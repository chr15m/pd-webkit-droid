package cx.mccormick.littlelooper;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.media.MediaPlayer;
import android.webkit.WebView;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;

import java.io.FileInputStream;

public class LittleLooper extends Activity
{
    private static final String LOG_TAG = "WebViewDemo";
    private WebView mWebView;
    private Handler mHandler = new Handler();
    private MediaPlayer mp = new MediaPlayer();
    private FileInputStream fis;

    @Override
    public void onCreate(Bundle icicle) {
        super.onCreate(icicle);
        setContentView(R.layout.main);
        mWebView = (WebView) findViewById(R.id.webview);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setSavePassword(false);
        webSettings.setSaveFormData(false);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setSupportZoom(false);

        mWebView.setWebChromeClient(new MyWebChromeClient());
        mWebView.addJavascriptInterface(new DemoJavaScriptInterface(), "LittleLooperEngine");
        mWebView.loadUrl("file:///android_asset/index.html");

	/*
        try {
            fis = openFileInput("test.wav");
        } catch (java.io.FileNotFoundException e) {
            System.out.println("file not foundzz");
        }
        try {
            //mp.reset();
            mp.setDataSource(fis.getFD());
            mp.prepare();
            mp.start();
        } catch (java.io.IOException e) {
            System.out.println("test.wav doesn't exist");
        }*/
    }

    final class DemoJavaScriptInterface {

        DemoJavaScriptInterface() {
        }

        /**
         * This is not called on the UI thread. Post a runnable to invoke
         * loadUrl on the UI thread.
         */
        public void ping() {
            mHandler.post(new Runnable() {
                public void run() {
                    // send the number 12 to our javascript gui component
                    mWebView.loadUrl("javascript:LittleLooperGUI.tick(12)");
                }
            });

        }
        
	public void trace(String s) { System.out.println(s); }
    }

    /**
     * Provides a hook for calling "alert" from javascript. Useful for
     * debugging your javascript.
     */
    final class MyWebChromeClient extends WebChromeClient {
        @Override
        public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
            Log.d(LOG_TAG, message);
            result.confirm();
            return true;
        }
    }
}
