// The Android host transfers a port only to our exact HTTPS main-frame origin.
if (/MYCAndroid\//.test(navigator.userAgent)) {
  window.addEventListener("message", (event) => {
    if (
      event.data !== "MYC_ANDROID_READY" ||
      !event.ports?.[0] ||
      window !== window.top
    )
      return;
    const port = event.ports[0];
    const pending = new Map();
    port.onmessage = ({ data }) => {
      const result = JSON.parse(data);
      const item = pending.get(result.id);
      if (!item) return;
      pending.delete(result.id);
      result.ok
        ? item.resolve()
        : item.reject(new Error(result.error || "Enregistrement impossible."));
    };
    window.MYCNative = {
      async saveBlob(blob, filename) {
        if (blob.size > 20000000) throw new Error("Le fichier dépasse 20 Mo.");
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const id = crypto.randomUUID();
        return new Promise((resolve, reject) => {
          pending.set(id, { resolve, reject });
          port.postMessage(
            JSON.stringify({
              type: "saveFile",
              id,
              filename,
              mime: blob.type.split(";")[0],
              base64,
            }),
          );
        });
      },
    };
  });
  document.addEventListener(
    "click",
    async (event) => {
      const link = event.target.closest?.("a[download]");
      if (!link?.href.startsWith("blob:") || !window.MYCNative) return;
      event.preventDefault();
      try {
        await window.MYCNative.saveBlob(
          await (await fetch(link.href)).blob(),
          link.download,
        );
      } catch (error) {
        alert(error.message);
      }
    },
    true,
  );
}
