import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const dir = resolve("tmp/android-tools");
await mkdir(dir, { recursive: true });
const xml = await (
  await fetch("https://dl.google.com/android/repository/repository2-1.xml")
).text();
function sdkPackage(name, file) {
  const start = xml.indexOf(`path="${name}"`);
  if (start < 0) throw new Error("Missing SDK package");
  const section = xml.slice(start, xml.indexOf("</remotePackage>", start));
  // Select the complete archive containing this URL, not preceding host archives.
  const block = [...section.matchAll(/<complete>([\s\S]*?)<\/complete>/g)].find(
    (m) => m[1].includes(`<url>${file}</url>`),
  )?.[1];
  const checksum = block?.match(/<checksum[^>]*>([^<]+)</)?.[1];
  if (!checksum) throw new Error("Missing SDK checksum");
  return {
    name: file,
    url: "https://dl.google.com/android/repository/" + file,
    hash: checksum,
    algorithm: "sha1",
  };
}
const packages = [
  sdkPackage("build-tools;35.0.0", "build-tools_r35_windows.zip"),
  sdkPackage("platforms;android-35", "platform-35-ext15_r01.zip"),
  {
    name: "jdk.zip",
    url: "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_windows_hotspot_17.0.20.1_1.zip",
    hash: "e53a79c3c3d86865bd7e787903884331068e71321714ffd44f145785affc7cb0",
    algorithm: "sha256",
  },
];
await Promise.all(
  packages.map(async (p) => {
    const path = resolve(dir, p.name);
    let bytes;
    try {
      bytes = await readFile(path);
    } catch {}
    if (
      !bytes ||
      createHash(p.algorithm).update(bytes).digest("hex") !== p.hash
    ) {
      console.log("Downloading " + p.name);
      const r = await fetch(p.url);
      if (!r.ok) throw new Error("Download failed: " + r.status);
      bytes = Buffer.from(await r.arrayBuffer());
      if (createHash(p.algorithm).update(bytes).digest("hex") !== p.hash)
        throw new Error("Checksum mismatch " + p.name);
      await writeFile(path, bytes);
    }
    console.log("Verified " + p.name);
  }),
);
for (const p of packages) {
  const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath ${quote(resolve(dir, p.name))} -DestinationPath ${quote(dir)} -Force`,
    ],
    { stdio: "inherit" },
  );
}
console.log("Android toolchain ready in tmp/android-tools");
