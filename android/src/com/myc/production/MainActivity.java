package com.myc.production;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.OutputStream;

/** Remote UI stays on Vercel. Only the trusted main frame receives a file-save port. */
public final class MainActivity extends Activity {
  private static final String ORIGIN = "https://application-web-m-tallisation.vercel.app";
  private static final int SAVE_FILE = 30;
  private WebView web;
  private WebMessagePort port;
  private byte[] pendingFile;
  private String pendingId;
  private ProgressBar progress;
  private LinearLayout errorPanel;

  private boolean trusted(String url) {
    if (url == null) return false;
    Uri uri = Uri.parse(url);
    return "https".equals(uri.getScheme()) && "application-web-m-tallisation.vercel.app".equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443);
  }

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setBackgroundColor(Color.WHITE);
    root.setFitsSystemWindows(true);
    root.setOnApplyWindowInsetsListener((view, insets) -> {
      view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
      return insets.consumeSystemWindowInsets();
    });
    progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
    root.addView(progress, new LinearLayout.LayoutParams(-1, 5));
    errorPanel = new LinearLayout(this);
    errorPanel.setOrientation(LinearLayout.VERTICAL);
    errorPanel.setPadding(32, 48, 32, 32);
    TextView message = new TextView(this);
    message.setText("MYC ne peut pas charger cette page. Vérifiez votre connexion Internet. Vos données locales sont conservées.");
    message.setTextSize(18);
    errorPanel.addView(message);
    Button retry = new Button(this);
    retry.setText("Réessayer");
    retry.setOnClickListener(v -> { errorPanel.setVisibility(View.GONE); web.setVisibility(View.VISIBLE); web.loadUrl(ORIGIN + "/"); });
    errorPanel.addView(retry);
    errorPanel.setVisibility(View.GONE);
    root.addView(errorPanel);
    web = new WebView(this);
    root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1));
    setContentView(root);
    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setUserAgentString(settings.getUserAgentString() + " MYCAndroid/1.0.0");
    settings.setSupportMultipleWindows(false);
    if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
    web.setWebChromeClient(new WebChromeClient() {
      @Override public void onProgressChanged(WebView view, int value) {
        progress.setProgress(value);
        progress.setVisibility(value == 100 ? View.GONE : View.VISIBLE);
      }
    });
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        if (trusted(url)) return false;
        if (request.isForMainFrame() && ("https".equals(request.getUrl().getScheme()) || "http".equals(request.getUrl().getScheme()))) {
          try { startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl())); } catch (Exception ignored) { }
        }
        return true;
      }
      @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
        if (port != null) { port.close(); port = null; }
      }
      @Override public void onPageFinished(WebView view, String url) {
        if (!trusted(url)) return;
        WebMessagePort[] channel = view.createWebMessageChannel();
        if (port != null) port.close();
        port = channel[0];
        port.setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
          @Override public void onMessage(WebMessagePort sender, WebMessage message) {
            if (sender != port || !trusted(web.getUrl())) return;
            receiveFile(message.getData());
          }
        });
        view.postWebMessage(new WebMessage("MYC_ANDROID_READY", new WebMessagePort[]{channel[1]}), Uri.parse(ORIGIN));
      }
      @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame()) { errorPanel.setVisibility(View.VISIBLE); web.setVisibility(View.GONE); }
      }
      @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
        if (request.isForMainFrame() && response.getStatusCode() >= 400) { errorPanel.setVisibility(View.VISIBLE); web.setVisibility(View.GONE); }
      }
    });
    web.loadUrl(ORIGIN + "/");
  }

  private void reply(String id, boolean ok, String error) {
    if (port == null) return;
    try { JSONObject data = new JSONObject(); data.put("id", id); data.put("ok", ok); data.put("error", error); port.postMessage(new WebMessage(data.toString())); } catch (Exception ignored) { }
  }

  private void receiveFile(String raw) {
    String id = "";
    try {
      if (raw == null || raw.length() > 28000000) throw new Exception("Fichier trop volumineux.");
      JSONObject data = new JSONObject(raw);
      id = data.getString("id");
      if (!"saveFile".equals(data.getString("type"))) throw new Exception("Action inconnue.");
      if (pendingFile != null) throw new Exception("Terminez l’enregistrement précédent.");
      String mime = data.getString("mime");
      if (!mime.equals("application/pdf") && !mime.equals("text/csv")) throw new Exception("Format non autorisé.");
      byte[] bytes = Base64.decode(data.getString("base64"), Base64.DEFAULT);
      if (bytes.length > 20000000) throw new Exception("Fichier trop volumineux.");
      String filename = data.getString("filename").replaceAll("[^a-zA-Z0-9._-]", "_");
      if (filename.length() > 150) filename = filename.substring(0, 150);
      if (filename.isEmpty()) filename = mime.equals("application/pdf") ? "MYC.pdf" : "MYC.csv";
      Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE, filename);
      pendingFile = bytes;
      pendingId = id;
      try { startActivityForResult(intent, SAVE_FILE); } catch (Exception e) { pendingFile = null; pendingId = null; throw e; }
    } catch (Exception e) { reply(id, false, e.getMessage()); }
  }

  @Override protected void onActivityResult(int request, int result, Intent data) {
    super.onActivityResult(request, result, data);
    if (request != SAVE_FILE) return;
    final byte[] bytes = pendingFile;
    final String id = pendingId;
    pendingFile = null; pendingId = null;
    if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) { reply(id, false, "Enregistrement annulé."); return; }
    final Uri uri = data.getData();
    new Thread(() -> {
      try (OutputStream stream = getContentResolver().openOutputStream(uri)) {
        if (stream == null) throw new Exception("Impossible d’ouvrir le fichier.");
        stream.write(bytes);
        runOnUiThread(() -> { reply(id, true, ""); Toast.makeText(this, "Fichier enregistré", Toast.LENGTH_SHORT).show(); });
      } catch (Exception e) { runOnUiThread(() -> reply(id, false, "Impossible d’enregistrer le fichier.")); }
    }).start();
  }
  @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
  @Override protected void onDestroy() { if (port != null) port.close(); if (web != null) { ((ViewGroup)web.getParent()).removeView(web); web.destroy(); } super.onDestroy(); }
}
