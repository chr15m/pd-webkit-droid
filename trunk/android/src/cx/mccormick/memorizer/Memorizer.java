package cx.mccormick.memorizer;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.media.SoundPool;
import android.webkit.WebView;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
//import android.os.Environment;

import java.io.FileInputStream;
import java.io.File;

public class Memorizer extends Activity
{
    private static final String LOG_TAG = "WebViewDemo";
    private WebView mWebView;
    private Handler mHandler = new Handler();
    private FileInputStream fis;
    private int i;
    
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
        //mWebView.addJavascriptInterface(new DemoJavaScriptInterface(), "LittleLooperEngine");
        mWebView.loadUrl("file:///android_asset/index.html");
	
	//File file[] = Environment.getExternalStorageDirectory().listFiles();  
	//System.out.println("***");
	//for (i=0; i< file.length; i++)
	//	System.out.println(file[i].getAbsolutePath());
	//System.out.println("***");
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
                    //mWebView.loadUrl("javascript:LittleLooperGUI.tick(19)");
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
