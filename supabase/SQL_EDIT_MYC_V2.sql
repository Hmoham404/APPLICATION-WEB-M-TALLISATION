-- MYC Production v2 - quatre departements, acces direct sans connexion.
-- A executer manuellement dans Supabase SQL Editor.
-- Tables historiques conservees pour ne perdre aucune saisie.
-- Lecture/ecriture publiques uniquement sur les quatre tables MYC existantes.
begin;
create extension if not exists pgcrypto;

create table if not exists public.myc_metallisation_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  production_date date not null,
  of_number text not null,
  chain text not null,
  shift text not null,
  article text,
  record_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, production_date, of_number, chain, shift)
);
alter table public.myc_metallisation_reports alter column owner_id drop not null;
create index if not exists myc_metallisation_reports_date_idx on public.myc_metallisation_reports(production_date desc);

create table if not exists public.myc_metallisation_hourly_entries (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references public.myc_metallisation_reports(id) on delete cascade,
  hour_index integer not null, hour_label text not null, quantity_ok integer, quantity_nok integer, comment text,
  unique(record_id,hour_index)
);
create table if not exists public.myc_metallisation_stoppages (
  id uuid primary key default gen_random_uuid(), hourly_entry_id uuid not null references public.myc_metallisation_hourly_entries(id) on delete cascade,
  code text check (code is null or code in ('C1','C2','C3','C4','C5','C6','C7','C8','C9','C10','C11')),
  duration_minutes integer, comment text
);
create table if not exists public.myc_metallisation_quality_defects (
  id uuid primary key default gen_random_uuid(), record_id uuid not null references public.myc_metallisation_reports(id) on delete cascade,
  defect_index integer not null, defect_name text not null, hourly_quantities jsonb not null default '[]'::jsonb,
  unique(record_id,defect_index)
);

alter table public.myc_metallisation_reports enable row level security;
alter table public.myc_metallisation_hourly_entries enable row level security;
alter table public.myc_metallisation_stoppages enable row level security;
alter table public.myc_metallisation_quality_defects enable row level security;

drop policy if exists "Users manage own MYC metallisation reports" on public.myc_metallisation_reports;
drop policy if exists "MYC reports shared direct access" on public.myc_metallisation_reports;
create policy "MYC reports shared direct access" on public.myc_metallisation_reports for all to anon, authenticated using (true) with check (true);
drop policy if exists "Users access own MYC hourly entries" on public.myc_metallisation_hourly_entries;
drop policy if exists "MYC hourly entries shared direct access" on public.myc_metallisation_hourly_entries;
create policy "MYC hourly entries shared direct access" on public.myc_metallisation_hourly_entries for all to anon, authenticated using (true) with check (true);
drop policy if exists "Users access own MYC stoppages" on public.myc_metallisation_stoppages;
drop policy if exists "MYC stoppages shared direct access" on public.myc_metallisation_stoppages;
create policy "MYC stoppages shared direct access" on public.myc_metallisation_stoppages for all to anon, authenticated using (true) with check (true);
drop policy if exists "Users access own MYC quality defects" on public.myc_metallisation_quality_defects;
drop policy if exists "MYC quality shared direct access" on public.myc_metallisation_quality_defects;
create policy "MYC quality shared direct access" on public.myc_metallisation_quality_defects for all to anon, authenticated using (true) with check (true);
grant select,insert,update,delete on public.myc_metallisation_reports,public.myc_metallisation_hourly_entries,public.myc_metallisation_stoppages,public.myc_metallisation_quality_defects to anon, authenticated;

-- Migration additive : anciennes fiches classees en metallisation.
alter table public.myc_metallisation_reports
  add column if not exists department text not null default 'metallisation';
update public.myc_metallisation_reports
set department = case when record_data->>'department' in ('metallisation','assemblage','injection','serigraphie')
  then record_data->>'department' else 'metallisation' end;
alter table public.myc_metallisation_reports drop constraint if exists myc_reports_department_check;
alter table public.myc_metallisation_reports add constraint myc_reports_department_check
  check (department in ('metallisation','assemblage','injection','serigraphie'));
create index if not exists myc_reports_department_date_idx
  on public.myc_metallisation_reports(department,production_date desc);

-- Atomic save for direct anonymous and authenticated use.
create or replace function public.save_myc_metallisation_report(payload jsonb)
returns uuid language plpgsql security invoker set search_path=public as $$
declare
  rid uuid; uid uuid := auth.uid(); h jsonb; s jsonb; q jsonb; hid uuid; i integer; dep text; quantity jsonb;
begin
  dep := coalesce(nullif(payload->>'department',''),'metallisation');
  if dep not in ('metallisation','assemblage','injection','serigraphie') then
    raise exception 'Departement invalide';
  end if;
  if exists(select 1 from unnest(array['date','article','of','chain','shift']) as required(key)
    where nullif(trim(payload->'general'->>key),'') is null) then
    raise exception 'Date, article, OF, poste et equipe obligatoires';
  end if;
  if jsonb_typeof(payload->'hours') is distinct from 'array' or jsonb_array_length(payload->'hours') < 1 then
    raise exception 'Au moins un creneau requis';
  end if;
  if jsonb_typeof(payload->'quality') is distinct from 'array' then
    raise exception 'Grille qualite invalide';
  end if;
  payload := (payload - '_pending') || jsonb_build_object('department',dep);
  rid := coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
  insert into public.myc_metallisation_reports(id,owner_id,production_date,of_number,chain,shift,article,department,record_data,updated_at)
  values(rid,uid,(payload->'general'->>'date')::date,coalesce(payload->'general'->>'of',''),coalesce(payload->'general'->>'chain',''),coalesce(payload->'general'->>'shift',''),payload->'general'->>'article',dep,payload,now())
  on conflict(id) do update set production_date=excluded.production_date,of_number=excluded.of_number,chain=excluded.chain,shift=excluded.shift,article=excluded.article,department=excluded.department,record_data=excluded.record_data,updated_at=now();
  delete from public.myc_metallisation_hourly_entries where record_id=rid;
  delete from public.myc_metallisation_quality_defects where record_id=rid;
  i:=0;
  for h in select value from jsonb_array_elements(coalesce(payload->'hours','[]'::jsonb)) loop
    if (h->>'time') is null or (h->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      raise exception 'Heure invalide';
    end if;
    if coalesce(nullif(h->>'ok','')::integer,0)<0 or coalesce(nullif(h->>'nok','')::integer,0)<0 then
      raise exception 'Quantites negatives interdites';
    end if;
    if (select coalesce(sum(nullif(value->>'duration','')::integer),0)
        from jsonb_array_elements(coalesce(h->'stoppages','[]'::jsonb))) > 60 then
      raise exception 'Les arrets ne peuvent pas depasser 60 minutes par creneau';
    end if;
    insert into public.myc_metallisation_hourly_entries(record_id,hour_index,hour_label,quantity_ok,quantity_nok,comment)
    values(rid,i,h->>'time',nullif(h->>'ok','')::integer,nullif(h->>'nok','')::integer,h->>'comment') returning id into hid;
    for s in select value from jsonb_array_elements(coalesce(h->'stoppages','[]'::jsonb)) loop
      if coalesce(nullif(s->>'duration','')::integer,0)<=0 or nullif(s->>'code','') is null then
        raise exception 'Code et duree positive requis pour chaque arret';
      end if;
      insert into public.myc_metallisation_stoppages(hourly_entry_id,code,duration_minutes,comment)
      values(hid,nullif(s->>'code',''),nullif(s->>'duration','')::integer,s->>'comment');
    end loop; i:=i+1;
  end loop;
  i:=0;
  for q in select value from jsonb_array_elements(coalesce(payload->'quality','[]'::jsonb)) loop
    if jsonb_typeof(q->'values') is distinct from 'array' or jsonb_array_length(q->'values') <> jsonb_array_length(payload->'hours') then
      raise exception 'La grille qualite doit correspondre aux creneaux horaires';
    end if;
    for quantity in select value from jsonb_array_elements(q->'values') loop
      if coalesce(nullif(quantity #>> '{}','')::integer,0)<0 then
        raise exception 'Quantites qualite negatives interdites';
      end if;
    end loop;
    insert into public.myc_metallisation_quality_defects(record_id,defect_index,defect_name,hourly_quantities)
    values(rid,i,q->>'name',coalesce(q->'values','[]'::jsonb)); i:=i+1;
  end loop;
  return rid;
end; $$;
grant execute on function public.save_myc_metallisation_report(jsonb) to anon, authenticated;

commit;
