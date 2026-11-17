package com.viandavisual.lepetitprince;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.content.ContentValues;
import android.content.ContentResolver;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import java.io.OutputStream;
import java.io.File;
import java.io.FileOutputStream;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Button;
import android.widget.LinearLayout;

public class MainActivity extends Activity {
    private static final String HOME = "https://viandavisual.github.io/LEPETITPRINCE/APP/index.html";
    private static final String ALLOWED = "https://viandavisual.github.io/LEPETITPRINCE/";
    private WebView webView;
    private LinearLayout offlinePanel;
    private volatile String activePageUrl = "";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF101B36);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));

        offlinePanel = new LinearLayout(this);
        offlinePanel.setOrientation(LinearLayout.VERTICAL);
        offlinePanel.setGravity(android.view.Gravity.CENTER);
        offlinePanel.setPadding(44, 44, 44, 44);
        offlinePanel.setBackgroundColor(0xFF101B36);
        TextView message = new TextView(this);
        message.setText("No s'ha pogut obrir Le Petit Prince.\nComprova la connexió a Internet.");
        message.setTextColor(0xFFFFF2D8);
        message.setTextSize(17);
        message.setGravity(android.view.Gravity.CENTER);
        offlinePanel.addView(message);
        Button retry = new Button(this);
        retry.setText("TORNAR-HO A PROVAR");
        retry.setOnClickListener(v -> {offlinePanel.setVisibility(View.GONE);webView.loadUrl(HOME);});
        offlinePanel.addView(retry);
        offlinePanel.setVisibility(View.GONE);
        root.addView(offlinePanel, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptCookie(true);
        // Pont limitat exclusivament a exportar PNG des de la web de Le Petit Prince.
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface public void savePng(String dataUrl, String filename) {
                if (!isPrincePage()) return;
                if (dataUrl == null || !dataUrl.startsWith("data:image/png;base64,")) return;
                if (filename == null || !filename.matches("LE_PETIT_PRINCE_TINC_[0-9]{4}-[0-9]{2}-[0-9]{2}_P[0-9]{2,}-DE-[0-9]{2,}\\.png")) return;
                try {
                    // 12 MiB màxim de PNG descodificat. Evita fitxers de mida desmesurada.
                    String raw = dataUrl.substring("data:image/png;base64,".length());
                    if (raw.length() > 17_000_000) return;
                    byte[] bytes = Base64.decode(raw, Base64.DEFAULT);
                    if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) return;
                    byte[] signature = {(byte)137,80,78,71,13,10,26,10};
                    for (int i=0;i<8;i++) if (bytes[i]!=signature[i]) return;
                    savePngBytes(bytes,filename);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this,"PNG desat a Descàrregues",Toast.LENGTH_LONG).show());
                } catch (Exception e) {
                    android.util.Log.e("LePetitPrince","No s'ha pogut desar el PNG",e);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this,"Error desant el PNG",Toast.LENGTH_LONG).show());
                }
            }
        }, "LPPAndroid");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u=request.getUrl(); String url=u.toString();
                if (!request.isForMainFrame()) return false;
                if (url.startsWith(ALLOWED)) return false;
                try {startActivity(new Intent(Intent.ACTION_VIEW,u));} catch (ActivityNotFoundException ignored) {}
                return true;
            }
            @Override public void onPageStarted(WebView v,String url,Bitmap favicon) {
                activePageUrl = url;
                offlinePanel.setVisibility(View.GONE);
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest request, WebResourceError error) {
                if(request.isForMainFrame()) offlinePanel.setVisibility(View.VISIBLE);
            }
        });
        if(state!=null) webView.restoreState(state);
        else webView.loadUrl(HOME);
    }
    private boolean isPrincePage() {
        final String current = activePageUrl;
        return current != null && (current.startsWith(ALLOWED + "APP/") || current.startsWith(ALLOWED + "APP/index.html"));
    }

    private void savePngBytes(byte[] bytes, String filename) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME,filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE,"image/png");
            values.put(MediaStore.MediaColumns.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS + "/Le Petit Prince");
            values.put(MediaStore.MediaColumns.IS_PENDING,1);
            ContentResolver resolver = getContentResolver();
            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);
            if (uri == null) throw new Exception("MediaStore: inserció fallida");
            try (OutputStream stream = resolver.openOutputStream(uri)) {
                if (stream == null) throw new Exception("MediaStore: sense stream");
                stream.write(bytes);
            } catch (Exception e) {resolver.delete(uri,null,null);throw e;}
            ContentValues completed = new ContentValues();
            completed.put(MediaStore.MediaColumns.IS_PENDING,0);
            resolver.update(uri,completed,null,null);
        } else {
            // Android 7–9: carpeta privada de l'app, per no sol·licitar permisos amplis.
            File dir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
            if (dir == null) throw new Exception("Carpeta privada no disponible");
            if (!dir.exists() && !dir.mkdirs()) throw new Exception("No s'ha pogut crear la carpeta");
            try (FileOutputStream stream = new FileOutputStream(new File(dir,filename))) {stream.write(bytes);}
        }
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        webView.saveState(out); super.onSaveInstanceState(out);
    }
    @Override public void onBackPressed() {
        if(webView!=null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override public void onDestroy() {
        if(webView!=null){webView.stopLoading();webView.destroy();webView=null;}
        super.onDestroy();
    }
}
