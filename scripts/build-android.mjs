import {
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
const root = resolve("."),
  tools = resolve("tmp/android-tools");
const jdk = readdirSync(tools).find(
  (n) => n.startsWith("jdk-") && existsSync(join(tools, n, "bin", "javac.exe")),
);
if (!jdk)
  throw new Error("Exécuter node scripts/setup-android.mjs auparavant.");
const bin = join(tools, jdk, "bin"),
  sdk = join(tools, "android-15"),
  platform = join(tools, "android-35-ext15", "android.jar");
const build = resolve("android/build"),
  secrets = resolve("android/.signing");
for (const d of [
  build,
  join(build, "classes"),
  join(build, "dex"),
  secrets,
  resolve("android/res/drawable"),
  resolve("public/downloads"),
])
  mkdirSync(d, { recursive: true });
const run = (exe, args) =>
  execFileSync(exe, args, { stdio: "inherit", cwd: root });
const java = (...args) => run(join(bin, "java.exe"), args);
const pass = join(secrets, "password.txt"),
  key = join(secrets, "myc-release.p12");
if (existsSync(key) && !existsSync(pass))
  throw new Error("Retrouver le mot de passe de signature avant de continuer.");
if (!existsSync(pass))
  writeFileSync(pass, randomBytes(32).toString("base64url"), { flag: "wx" });
if (!existsSync(key))
  run(join(bin, "keytool.exe"), [
    "-genkeypair",
    "-alias",
    "myc-production",
    "-keyalg",
    "RSA",
    "-keysize",
    "3072",
    "-validity",
    "10000",
    "-storetype",
    "PKCS12",
    "-keystore",
    key,
    "-storepass:file",
    pass,
    "-keypass:file",
    pass,
    "-dname",
    "CN=MYC Production, OU=Ateliers, O=MYC, C=TN",
  ]);
copyFileSync("public/icons/icon-512.png", "android/res/drawable/icon.png");
run(join(sdk, "aapt2.exe"), [
  "compile",
  "--dir",
  "android/res",
  "-o",
  "android/build/resources.zip",
]);
run(join(sdk, "aapt2.exe"), [
  "link",
  "-o",
  "android/build/unsigned.apk",
  "--manifest",
  "android/AndroidManifest.xml",
  "-I",
  "tmp/android-tools/android-35-ext15/android.jar",
  "--min-sdk-version",
  "23",
  "--target-sdk-version",
  "35",
  "android/build/resources.zip",
]);
run(join(bin, "javac.exe"), [
  "-encoding",
  "UTF-8",
  "--release",
  "8",
  "-classpath",
  platform,
  "-d",
  join(build, "classes"),
  resolve("android/src/com/myc/production/MainActivity.java"),
]);
run(join(bin, "jar.exe"), [
  "cf",
  join(build, "classes.jar"),
  "-C",
  join(build, "classes"),
  ".",
]);
java(
  "-cp",
  join(sdk, "lib", "d8.jar"),
  "com.android.tools.r8.D8",
  "--lib",
  platform,
  "--min-api",
  "23",
  "--output",
  join(build, "dex"),
  join(build, "classes.jar"),
);
run(join(bin, "jar.exe"), [
  "uf",
  join(build, "unsigned.apk"),
  "-C",
  join(build, "dex"),
  "classes.dex",
]);
run(join(sdk, "zipalign.exe"), [
  "-f",
  "-p",
  "4",
  "android/build/unsigned.apk",
  "android/build/aligned.apk",
]);
const apk = resolve("public/downloads/MYC-Production-1.0.0.apk");
java(
  "-jar",
  join(sdk, "lib", "apksigner.jar"),
  "sign",
  "--ks",
  key,
  "--ks-key-alias",
  "myc-production",
  "--ks-pass",
  "file:" + pass,
  "--out",
  apk,
  join(build, "aligned.apk"),
);
java(
  "-jar",
  join(sdk, "lib", "apksigner.jar"),
  "verify",
  "--verbose",
  "--print-certs",
  apk,
);
if (existsSync(apk + ".idsig")) unlinkSync(apk + ".idsig");
run(join(sdk, "aapt2.exe"), [
  "dump",
  "badging",
  "public/downloads/MYC-Production-1.0.0.apk",
]);
const hash = createHash("sha256").update(readFileSync(apk)).digest("hex");
writeFileSync(apk + ".sha256", hash + "  MYC-Production-1.0.0.apk\n");
console.log("APK signed and verified: " + apk);
console.log("SHA-256: " + hash);
