// Interface translations only: production records and free text are never rewritten.
// Columns: French | English | Italian | Simplified Chinese | Arabic.
const rows = `
TRADUCTION|TRANSLATION|TRADUZIONE|语言|اللغة
Vue d’ensemble|Overview|Panoramica|概览|نظرة عامة
Saisie de production|Production entry|Inserimento produzione|生产录入|إدخال الإنتاج
Rapports & historique|Reports & history|Rapporti e storico|报表与历史|التقارير والسجل
ESPACE PRODUCTION|PRODUCTION SPACE|AREA PRODUZIONE|生产空间|مساحة الإنتاج
Espace production|Production space|Area produzione|生产空间|مساحة الإنتاج
LES DÉPARTEMENTS|DEPARTMENTS|REPARTI|部门|الأقسام
Accueil MYC|MYC home|Home MYC|MYC 首页|الرئيسية MYC
Métallisation|Metallisation|Metallizzazione|金属化|المعدنة
Assemblage|Assembly|Assemblaggio|装配|التجميع
Injection|Injection moulding|Stampaggio a iniezione|注塑|الحقن
Sérigraphie|Screen printing|Serigrafia|丝网印刷|الطباعة الحريرية
Chaîne|Production line|Linea di produzione|生产线|خط الإنتاج
Ligne / poste|Line / station|Linea / postazione|产线 / 工位|الخط / المحطة
Presse|Press|Pressa|注塑机|آلة الحقن
Machine|Machine|Macchina|设备|الآلة
Traitement de surface & finition|Surface treatment & finishing|Trattamento superficiale e finitura|表面处理与精加工|معالجة الأسطح والتشطيب
Montage & contrôle des composants|Component assembly & inspection|Montaggio e controllo componenti|组件装配与检验|تجميع المكونات وفحصها
Moulage & transformation matière|Moulding & material processing|Stampaggio e lavorazione materiali|成型与材料加工|القولبة وتحويل المواد
Impression & décoration|Printing & decoration|Stampa e decorazione|印刷与装饰|الطباعة والزخرفة
Suivi des ateliers|Workshop tracking|Monitoraggio reparti|车间跟踪|متابعة الورش
MYC · Tunisie|MYC · Tunisia|MYC · Tunisia|MYC · 突尼斯|MYC · تونس
Tunisie|Tunisia|Tunisia|突尼斯|تونس
Application installée|App installed|App installata|应用已安装|التطبيق مثبت
Installer l’application|Install app|Installa l’app|安装应用|تثبيت التطبيق
Rapports|Reports|Rapporti|报表|التقارير
Hors connexion|Offline|Offline|离线|غير متصل
Espace partagé|Shared workspace|Spazio condiviso|共享空间|مساحة مشتركة
Sur cet appareil|On this device|Su questo dispositivo|本设备|على هذا الجهاز
Vous pouvez continuer la saisie hors connexion.|You can continue entering data offline.|Puoi continuare a inserire dati offline.|您可以继续离线录入数据。|يمكنك متابعة الإدخال دون اتصال.
Synchroniser|Sync|Sincronizza|同步|مزامنة
Une nouvelle version de MYC est prête. Votre brouillon sera conservé.|A new MYC version is ready. Your draft will be kept.|Una nuova versione di MYC è pronta. La bozza verrà conservata.|MYC 新版本已就绪。您的草稿将保留。|نسخة جديدة من MYC جاهزة. سيتم الاحتفاظ بمسودتك.
Mise à jour…|Updating…|Aggiornamento…|正在更新…|جارٍ التحديث…
Mettre à jour|Update|Aggiorna|更新|تحديث
ATELIERS & PERFORMANCE|WORKSHOPS & PERFORMANCE|REPARTI E PRESTAZIONI|车间与绩效|الورش والأداء
La production, en clair|Production at a glance|La produzione, in chiaro|生产一目了然|الإنتاج بوضوح
Un espace pour vos équipes. Chaque saisie compte.|A workspace for your teams. Every entry counts.|Uno spazio per i tuoi team. Ogni dato conta.|为团队打造的工作空间。每条记录都重要。|مساحة لفرقك. لكل إدخال قيمة.
Accès direct · sans connexion|Direct access · no login|Accesso diretto · senza login|直接访问 · 无需登录|دخول مباشر · دون تسجيل
DU TERRAIN AU RAPPORT|FROM WORKSHOP TO REPORT|DAL REPARTO AL RAPPORTO|从现场到报表|من الميدان إلى التقرير
Votre atelier.|Your workshop.|Il tuo reparto.|您的车间。|ورشتك.
Votre suivi quotidien.|Your daily tracking.|Il tuo monitoraggio quotidiano.|您的日常跟踪。|متابعتك اليومية.
Sélectionnez un département, renseignez votre production et retrouvez un rapport prêt à partager.|Choose a department, enter your production and get a report ready to share.|Scegli un reparto, inserisci la produzione e ottieni un rapporto pronto da condividere.|选择部门，录入生产数据，即可获得可分享的报表。|اختر القسم وأدخل بيانات الإنتاج واحصل على تقرير جاهز للمشاركة.
Choisir mon département|Choose my department|Scegli il mio reparto|选择我的部门|اختيار قسمي
Production & qualité|Production & quality|Produzione e qualità|生产与质量|الإنتاج والجودة
PDF en un clic|PDF in one click|PDF con un clic|一键生成 PDF|PDF بنقرة واحدة
RAPPORT D’ATELIER|WORKSHOP REPORT|RAPPORTO DI REPARTO|车间报表|تقرير الورشة
PRODUCTION JOURNALIÈRE|DAILY PRODUCTION|PRODUZIONE GIORNALIERA|每日生产|الإنتاج اليومي
La précision à chaque étape.|Precision at every step.|Precisione in ogni fase.|每个环节，精准把控。|الدقة في كل مرحلة.
La précision, à chaque étape.|Precision at every step.|Precisione in ogni fase.|每个环节，精准把控。|الدقة في كل مرحلة.
PRODUCTION|PRODUCTION|PRODUZIONE|生产|الإنتاج
QUALITÉ|QUALITY|QUALITÀ|质量|الجودة
TRAÇABILITÉ|TRACEABILITY|TRACCIABILITÀ|可追溯性|التتبع
Des rapports soignés|Professional reports|Rapporti curati|专业报表|تقارير احترافية
Prêts à télécharger et à imprimer|Ready to download and print|Pronti da scaricare e stampare|可下载和打印|جاهزة للتنزيل والطباعة
01 / COMMENCER|01 / GET STARTED|01 / INIZIA|01 / 开始|01 / ابدأ
Choisissez votre département|Choose your department|Scegli il tuo reparto|选择您的部门|اختر قسمك
4 ateliers, un même outil|4 workshops, one tool|4 reparti, un unico strumento|四个车间，同一工具|أربع ورش، أداة واحدة
Reprendre la saisie|Resume entry|Riprendi l’inserimento|继续录入|متابعة الإدخال
Commencer la saisie|Start entry|Inizia l’inserimento|开始录入|بدء الإدخال
Le point du jour|Today’s overview|Riepilogo di oggi|今日概览|ملخص اليوم
Fiches disponibles|Available records|Schede disponibili|可用记录|السجلات المتاحة
Données de cet appareil|Data on this device|Dati di questo dispositivo|本设备数据|بيانات هذا الجهاز
Fiches enregistrées|Saved records|Schede salvate|已保存记录|السجلات المحفوظة
Pièces produites|Units produced|Pezzi prodotti|生产数量|القطع المنتجة
Voir les rapports|View reports|Visualizza rapporti|查看报表|عرض التقارير
Changer de département|Change department|Cambia reparto|切换部门|تغيير القسم
/ FICHE D’ATELIER|/ WORKSHOP RECORD|/ SCHEDA DI REPARTO|/ 车间记录|/ سجل الورشة
Modification de votre fiche de production.|Editing your production record.|Modifica della scheda di produzione.|正在编辑生产记录。|تعديل سجل الإنتاج.
Votre production, heure par heure.|Your production, hour by hour.|La tua produzione, ora per ora.|逐小时跟踪生产。|إنتاجك ساعة بساعة.
Fiche enregistrée|Record saved|Scheda salvata|记录已保存|تم حفظ السجل
Brouillon automatique|Autosaved draft|Bozza automatica|自动保存草稿|مسودة تلقائية
Nouvelle fiche|New record|Nuova scheda|新建记录|سجل جديد
Pièces conformes|Accepted units|Pezzi conformi|合格品|القطع المطابقة
Pièces rejetées|Rejected units|Pezzi scartati|不合格品|القطع المرفوضة
Taux de rebut|Reject rate|Tasso di scarto|不良率|نسبة الرفض
Temps d’arrêt|Downtime|Tempo di fermo|停机时间|مدة التوقف
Étapes de saisie|Entry steps|Fasi di inserimento|录入步骤|مراحل الإدخال
Production|Production|Produzione|生产|الإنتاج
Contrôle qualité|Quality control|Controllo qualità|质量控制|مراقبة الجودة
Synthèse & rapport|Summary & report|Riepilogo e rapporto|汇总与报表|الملخص والتقرير
IDENTIFICATION|IDENTIFICATION|IDENTIFICAZIONE|标识信息|التعريف
Informations générales|General information|Informazioni generali|基本信息|المعلومات العامة
* Champs obligatoires|* Required fields|* Campi obbligatori|* 必填项|* حقول إلزامية
Date|Date|Data|日期|التاريخ
Référence article|Item reference|Codice articolo|产品编号|مرجع المنتج
Ordre de fabrication|Work order|Ordine di produzione|生产工单|أمر التصنيع
Équipe / shift|Team / shift|Squadra / turno|班组 / 班次|الفريق / الوردية
Matricule opérateur|Operator ID|Matricola operatore|操作员工号|رقم العامل
Client|Customer|Cliente|客户|العميل
Nom du client|Customer name|Nome cliente|客户名称|اسم العميل
Objectif / heure|Target / hour|Obiettivo / ora|每小时目标|الهدف / ساعة
Pièces / h|Units / h|Pezzi / h|件 / 小时|قطعة / ساعة
Ex. Équipe A|E.g. Team A|Es. Squadra A|例如：A 班|مثال: الفريق أ
Informations complémentaires|Additional information|Informazioni aggiuntive|附加信息|معلومات إضافية
Lot matière|Material batch|Lotto materiale|材料批次|دفعة المواد
Compteur début|Start counter|Contatore iniziale|起始计数|العداد عند البداية
Compteur fin|End counter|Contatore finale|结束计数|العداد عند النهاية
Numéro de carton|Box number|Numero cartone|箱号|رقم الصندوق
Référence moule|Mould reference|Codice stampo|模具编号|مرجع القالب
Matière|Material|Materiale|材料|المادة
Vitesse de ligne|Line speed|Velocità linea|线速|سرعة الخط
Couleur / encre|Colour / ink|Colore / inchiostro|颜色 / 油墨|اللون / الحبر
RELEVÉS TERRAIN|SHOP FLOOR RECORDS|RILEVAZIONI DI REPARTO|现场记录|السجلات الميدانية
Production par heure|Hourly production|Produzione oraria|每小时生产|الإنتاج بالساعة
créneaux|time slots|fasce orarie|时段|فترات
CRÉNEAU|TIME SLOT|FASCIA ORARIA|时段|الفترة
QUANTITÉ OK|OK QUANTITY|QUANTITÀ OK|合格数量|الكمية المطابقة
QUANTITÉ NOK|NOK QUANTITY|QUANTITÀ NOK|不合格数量|الكمية المرفوضة
OBSERVATIONS & ARRÊTS|NOTES & STOPPAGES|NOTE E FERMI|备注与停机|الملاحظات والتوقفات
Heure|Time|Ora|时间|الوقت
Quantité OK|OK quantity|Quantità OK|合格数量|الكمية المطابقة
Quantité NOK|NOK quantity|Quantità NOK|不合格数量|الكمية المرفوضة
Une observation à ajouter…|Add a note…|Aggiungi una nota…|添加备注…|أضف ملاحظة…
Arrêt|Stoppage|Fermo|停机|توقف
Code|Code|Codice|代码|الرمز
Minutes|Minutes|Minuti|分钟|دقائق
Motif de l’arrêt|Reason for stoppage|Motivo del fermo|停机原因|سبب التوقف
Ajouter un créneau|Add time slot|Aggiungi fascia oraria|添加时段|إضافة فترة
pièces au total|units in total|pezzi totali|件总计|قطعة إجمالاً
CONTRÔLE QUALITÉ|QUALITY CONTROL|CONTROLLO QUALITÀ|质量控制|مراقبة الجودة
Les défauts observés|Observed defects|Difetti rilevati|已发现缺陷|العيوب المرصودة
Relevez les occurrences par créneau. Une pièce peut présenter plusieurs défauts.|Record occurrences per time slot. One unit may have several defects.|Registra le occorrenze per fascia oraria. Un pezzo può presentare più difetti.|按时段记录缺陷次数。一件产品可能有多个缺陷。|سجل الحالات حسب الفترة. قد تحتوي القطعة على عدة عيوب.
Ajouter un défaut|Add a defect|Aggiungi un difetto|添加缺陷|إضافة عيب
Type de défaut|Defect type|Tipo di difetto|缺陷类型|نوع العيب
Total|Total|Totale|总计|المجموع
Total des occurrences|Total occurrences|Totale occorrenze|发生次数合计|إجمالي الحالات
Le taux de rebut est calculé sur les pièces NOK / (OK + NOK). Les occurrences de défauts sont comptées séparément.|The reject rate is NOK / (OK + NOK). Defect occurrences are counted separately.|Il tasso di scarto è NOK / (OK + NOK). Le occorrenze dei difetti sono conteggiate separatamente.|不良率为 NOK / (OK + NOK)。缺陷次数单独统计。|نسبة الرفض هي NOK / (OK + NOK). تُحسب حالات العيوب بشكل منفصل.
VOTRE DOCUMENT|YOUR DOCUMENT|IL TUO DOCUMENTO|您的文档|مستندك
Un rapport prêt à partager|A report ready to share|Un rapporto pronto da condividere|可分享的报表|تقرير جاهز للمشاركة
Ordre de fabrication à renseigner|Enter a work order|Inserisci l’ordine di produzione|请填写生产工单|أدخل أمر التصنيع
Article à renseigner|Enter an item|Inserisci l’articolo|请填写产品|أدخل المنتج
Poste à renseigner|Enter a station|Inserisci la postazione|请填写工位|أدخل المحطة
Équipe à renseigner|Enter a team|Inserisci la squadra|请填写班组|أدخل الفريق
Synthèse de production et indicateurs|Production summary and metrics|Riepilogo produzione e indicatori|生产汇总与指标|ملخص الإنتاج والمؤشرات
Relevés horaires et détail des arrêts|Hourly records and stoppage details|Rilevazioni orarie e dettaglio fermi|小时记录与停机详情|السجلات بالساعة وتفاصيل التوقفات
Grille qualité et principaux défauts|Quality grid and main defects|Griglia qualità e difetti principali|质量表与主要缺陷|جدول الجودة والعيوب الرئيسية
Pagination automatique et zones de visa|Automatic pagination and sign-off areas|Paginazione automatica e aree firma|自动分页与签字区域|ترقيم تلقائي ومساحات التوقيع
Préparation…|Preparing…|Preparazione…|正在准备…|جارٍ التحضير…
Télécharger le rapport PDF|Download PDF report|Scarica rapporto PDF|下载 PDF 报表|تنزيل تقرير PDF
LECTURE RAPIDE|QUICK VIEW|LETTURA RAPIDA|快速查看|قراءة سريعة
Répartition de la production|Production breakdown|Ripartizione della produzione|生产分布|توزيع الإنتاج
% conformes|% accepted|% conformi|% 合格|% مطابقة
pièces OK|OK units|pezzi OK|件合格品|قطعة مطابقة
pièces NOK|NOK units|pezzi NOK|件不合格品|قطعة مرفوضة
Occurrences de défauts|Defect occurrences|Occorrenze dei difetti|缺陷次数|حالات العيوب
Arrêts de production|Production stoppages|Fermi di produzione|生产停机|توقفات الإنتاج
Créneaux renseignés|Completed time slots|Fasce orarie compilate|已填写时段|الفترات المسجلة
Observations de fin de poste|End-of-shift notes|Note di fine turno|交班备注|ملاحظات نهاية الوردية
Événements marquants, consignes pour l’équipe suivante…|Key events, instructions for the next team…|Eventi importanti, istruzioni per il turno successivo…|重要事件、下一班组的交接说明…|الأحداث المهمة وتعليمات الفريق التالي…
Brouillon conservé sur cet appareil|Draft saved on this device|Bozza salvata su questo dispositivo|草稿保存在本设备上|المسودة محفوظة على هذا الجهاز
Rapport PDF|PDF report|Rapporto PDF|PDF 报表|تقرير PDF
Continuer|Continue|Continua|继续|متابعة
Enregistrement…|Saving…|Salvataggio…|正在保存…|جارٍ الحفظ…
Enregistrer la fiche|Save record|Salva scheda|保存记录|حفظ السجل
TRAÇABILITÉ / TOUS LES ATELIERS|TRACEABILITY / ALL WORKSHOPS|TRACCIABILITÀ / TUTTI I REPARTI|追溯 / 所有车间|التتبع / جميع الورش
Retrouvez vos fiches, consultez les résultats et partagez vos rapports.|Find your records, view results and share your reports.|Ritrova le schede, consulta i risultati e condividi i rapporti.|查找记录、查看结果并分享报表。|اعثر على سجلاتك واطلع على النتائج وشارك تقاريرك.
Nouvelle saisie|New entry|Nuovo inserimento|新建录入|إدخال جديد
Registre de production|Production register|Registro di produzione|生产台账|سجل الإنتاج
Actualiser|Refresh|Aggiorna|刷新|تحديث
Rechercher une fiche|Search records|Cerca una scheda|搜索记录|البحث عن سجل
Rechercher un OF, article, client…|Search work order, item, customer…|Cerca ordine, articolo, cliente…|搜索工单、产品、客户…|ابحث عن أمر تصنيع أو منتج أو عميل…
Département|Department|Reparto|部门|القسم
Tous les départements|All departments|Tutti i reparti|所有部门|جميع الأقسام
Du|From|Dal|从|من
Au|To|Al|至|إلى
Date / OF|Date / work order|Data / ordine|日期 / 工单|التاريخ / أمر التصنيع
Article / poste|Item / station|Articolo / postazione|产品 / 工位|المنتج / المحطة
Rebut|Rejects|Scarti|不良品|المرفوض
Actions|Actions|Azioni|操作|الإجراءات
 · En attente| · Pending| · In attesa| · 待处理| · قيد الانتظار
Ouvrir|Open|Apri|打开|فتح
Aucune fiche pour ces critères|No records match these filters|Nessuna scheda per questi criteri|没有符合条件的记录|لا توجد سجلات تطابق هذه المعايير
Votre historique commence ici|Your history starts here|Il tuo storico inizia qui|您的历史记录从这里开始|سجلك يبدأ هنا
Modifiez vos filtres pour retrouver vos saisies.|Adjust your filters to find your entries.|Modifica i filtri per ritrovare i dati.|调整筛选条件以查找记录。|عدّل عوامل التصفية للعثور على سجلاتك.
Les fiches enregistrées apparaîtront dans ce registre.|Saved records will appear in this register.|Le schede salvate appariranno in questo registro.|已保存的记录将显示在此台账中。|ستظهر السجلات المحفوظة هنا.
Choisir un département|Choose a department|Scegli un reparto|选择部门|اختيار قسم
fiche(s) ·|record(s) ·|schede ·|条记录 ·|سجل ·
pièces produites|units produced|pezzi prodotti|件已生产|قطعة منتجة
Données partagées entre ateliers|Data shared across workshops|Dati condivisi tra reparti|车间间共享数据|بيانات مشتركة بين الورش
Données conservées sur cet appareil|Data saved on this device|Dati salvati su questo dispositivo|数据保存在本设备上|بيانات محفوظة على هذا الجهاز
Ateliers|Workshops|Reparti|车间|الورش
Saisie|Entry|Inserimento|录入|الإدخال
Installée|Installed|Installata|已安装|مثبت
Installer|Install|Installa|安装|تثبيت
Fermer la notification|Dismiss notification|Chiudi notifica|关闭通知|إغلاق الإشعار
Fermer|Close|Chiudi|关闭|إغلاق
Annuler|Cancel|Annulla|取消|إلغاء
Supprimer cette fiche ?|Delete this record?|Eliminare questa scheda?|删除此记录？|حذف هذا السجل؟
Supprimer la fiche|Delete record|Elimina scheda|删除记录|حذف السجل
Fiche supprimée.|Record deleted.|Scheda eliminata.|记录已删除。|تم حذف السجل.
Commencer une nouvelle fiche ?|Start a new record?|Iniziare una nuova scheda?|新建一条记录？|بدء سجل جديد؟
Revenir à la saisie|Back to entry|Torna all’inserimento|返回录入|العودة إلى الإدخال
Ajouter un type de défaut|Add defect type|Aggiungi tipo di difetto|添加缺陷类型|إضافة نوع عيب
Libellé du défaut|Defect name|Nome difetto|缺陷名称|اسم العيب
Ex. Défaut d’adhérence|E.g. Adhesion defect|Es. Difetto di adesione|例如：附着不良|مثال: عيب الالتصاق
Ajouter le défaut|Add defect|Aggiungi difetto|添加缺陷|إضافة العيب
Ajouter|Add|Aggiungi|添加|إضافة
Supprimer ce créneau ?|Delete this time slot?|Eliminare questa fascia oraria?|删除此时段？|حذف هذه الفترة؟
Supprimer le créneau|Delete time slot|Elimina fascia oraria|删除时段|حذف الفترة
Ce défaut existe déjà.|This defect already exists.|Questo difetto esiste già.|此缺陷已存在。|هذا العيب موجود بالفعل.
Fiche enregistrée et synchronisée.|Record saved and synced.|Scheda salvata e sincronizzata.|记录已保存并同步。|تم حفظ السجل ومزامنته.
Fiche enregistrée sur cet appareil.|Record saved on this device.|Scheda salvata su questo dispositivo.|记录已保存在本设备上。|تم حفظ السجل على هذا الجهاز.
Les fiches sont à jour.|Records are up to date.|Le schede sono aggiornate.|记录已是最新。|السجلات محدثة.
Particule|Particle|Particella|颗粒|جسيم
Bavure|Flash / burr|Bava|毛边|زوائد
Tache noire|Black stain|Macchia nera|黑斑|بقعة سوداء
Tache blanche|White stain|Macchia bianca|白斑|بقعة بيضاء
Rayure|Scratch|Graffio|划痕|خدش
Retassure|Sink mark|Ritiro|缩痕|انكماش
Tache d’huile|Oil stain|Macchia d’olio|油渍|بقعة زيت
Effet ombre|Shadow effect|Effetto ombra|阴影|تأثير الظل
Refus|Coating rejection|Rifiuto del rivestimento|涂层拒附|رفض الطلاء
Pièce manquante|Missing part|Pezzo mancante|零件缺失|قطعة ناقصة
Mauvais montage|Incorrect assembly|Montaggio errato|装配错误|تجميع غير صحيح
Déformation|Deformation|Deformazione|变形|تشوه
Jeu fonctionnel|Functional play|Gioco funzionale|配合间隙|خلوص وظيفي
Défaut de fermeture|Closure defect|Difetto di chiusura|闭合缺陷|عيب الإغلاق
Autre|Other|Altro|其他|أخرى
Manque matière|Short shot|Riempimento incompleto|缺料|نقص المادة
Brûlure|Burn mark|Bruciatura|烧焦|حرق
Point noir|Black speck|Punto nero|黑点|نقطة سوداء
Variation couleur|Colour variation|Variazione colore|色差|تفاوت اللون
Décalage impression|Print misalignment|Stampa disallineata|印刷偏移|انحراف الطباعة
Manque encre|Missing ink|Mancanza d’inchiostro|缺墨|نقص الحبر
Bavure impression|Print smearing|Sbavatura di stampa|印刷毛边|لطخ الطباعة
Mauvaise adhérence|Poor adhesion|Scarsa adesione|附着不良|ضعف الالتصاق
Tache|Stain|Macchia|污渍|بقعة
`;
export const translations = Object.fromEntries(rows.trim().split('\n').map(row => {
  const [fr, en, it, zh, ar] = row.split('|');
  if (![fr, en, it, zh, ar].every(Boolean)) throw new Error(`Incomplete translation: ${fr}`);
  return [fr, { en, it, zh, ar }];
}));
