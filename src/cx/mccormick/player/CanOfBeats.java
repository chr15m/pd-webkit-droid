package cx.mccormick.player;

import java.io.File;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.util.List;
import java.util.ArrayList;
import java.util.Scanner;
import java.util.Timer;
import java.util.TimerTask;
import java.lang.StringBuffer;

import org.puredata.android.service.PdService;
import org.puredata.core.PdBase;
import org.puredata.core.utils.PdUtils;
import org.puredata.core.utils.IoUtils;
import org.puredata.core.utils.PdDispatcher;
import org.puredata.core.utils.PdListener;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;
import android.widget.Toast;
import android.webkit.WebView;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;

public class CanOfBeats extends Activity {

	private final Handler handler = new Handler();
	private PdService pdService = null;
	private String patch;
	private WebView mWebView;

	private final PdDispatcher dispatcher = new PdDispatcher() {
		@Override
		public void print(String s) {
			Log.e("Pd", s);
		}
	};

	private final PdListener webkitListener = new PdListener() {
		@Override
		public synchronized void receiveList(Object... args) {
			StringBuffer msg = new StringBuffer();
			for (int a=0; a<args.length; a++) {
				if (a != 0 && ((String)args[a]).length() > 0)
					msg.append(" ");
				msg.append((String) args[a]);
			}
			mWebView.loadUrl("javascript:PdReceive('" + msg.toString() + "');");
		}
		
		// the remaining methods will never be called
		@Override
		public synchronized void receiveMessage(String symbol, Object... args) {
			StringBuffer msg = new StringBuffer();
			String space;
			for (int a=0; a<args.length; a++) {
				if (a != 0)
					msg.append(" ");
				msg.append((String) args[a]);
			}
			if (msg.length() > 0) {
				space = " ";
			} else {
				space = "";
			}
			mWebView.loadUrl("javascript:PdReceive('" + symbol + space + msg.toString() + "');");
		}
		
		@Override public void receiveSymbol(String symbol)  { mWebView.loadUrl("javascript:PdReceive('" + symbol + "');"); }
		@Override public void receiveFloat(float x) { mWebView.loadUrl("javascript:PdReceive(" + x + ");"); }
		@Override public void receiveBang() { mWebView.loadUrl("javascript:PdReceive('bang');"); }
	};

	private void post(final String msg) {
		final Resources res = getResources();
		handler.post(new Runnable() {
			@Override
			public void run() {
				Toast.makeText(getApplicationContext(), msg, Toast.LENGTH_SHORT).show();
			}
		});
	}

	private final ServiceConnection serviceConnection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName name, IBinder service) {
			pdService = ((PdService.PdBinder) service).getService();
			initPd();
		}
		
		@Override
		public void onServiceDisconnected(ComponentName name) {
			// this method will never be called
		}
	};

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		final ProgressDialog pd = new ProgressDialog(CanOfBeats.this);
		final CanOfBeats that = this;
		super.onCreate(savedInstanceState);
		Timer t = new Timer(); 
		pd.setMessage("Loading. Please wait...");
		pd.setCancelable(false);
		pd.setIndeterminate(true);
		pd.show();
		Log.e("COB", "start");
		Log.e("COB", "initGui");
		initGui();
		t.schedule(new TimerTask() {
			public void run() {
				handler.post(new Runnable() {
					public void run() {
						unpackResources();
						bindService(new Intent(that, PdService.class), serviceConnection, BIND_AUTO_CREATE);
						pd.dismiss();
					}
				});
			}
		}, 2000);
		/*handler.post(new Runnable() {
			@Override
			public void run() {
				Log.e("COB", "unpackResources");
				unpackResources();
				Log.e("COB", "bindService");
				bindService(new Intent(that, PdService.class), serviceConnection, BIND_AUTO_CREATE);
				Log.e("COB", "dismiss");
				pd.dismiss();
			}
		});*/
	}
	
	private void unpackResources() {
		Resources res = getResources();
		File libDir = getFilesDir();
		try {
			IoUtils.extractZipResource(res.openRawResource(R.raw.abstractions), libDir, false);
			IoUtils.extractZipResource(res.openRawResource(IoUtils.hasArmeabiV7a() ? R.raw.externals_v7a : R.raw.externals), libDir, false);
			IoUtils.extractZipResource(getResources().openRawResource(R.raw.patch), new File("/sdcard/" + res.getString(R.string.app_name)), false);
		} catch (IOException e) {
			Log.e("Player", e.toString());
			e.printStackTrace();
		}
		PdBase.addToSearchPath(libDir.getAbsolutePath());
		PdBase.addToSearchPath("/sdcard/" + res.getString(R.string.app_name) + "/patch/");
	}

	// this callback makes sure that we handle orientation changes without audio glitches
	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		super.onConfigurationChanged(newConfig);
		//initGui();
	}

	@Override
	protected void onPause() {
		super.onPause();
	}

	@Override
	protected void onResume() {
		super.onResume();
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		cleanup();
	}

	private void initGui() {
		Log.d("initGui", "started");
		setContentView(R.layout.main);
		mWebView = (WebView) findViewById(R.id.webview);
		
		WebSettings webSettings = mWebView.getSettings();
		webSettings.setSavePassword(false);
		webSettings.setSaveFormData(false);
		webSettings.setJavaScriptEnabled(true);
		webSettings.setSupportZoom(false);

		mWebView.setWebChromeClient(new MyWebChromeClient());
		mWebView.addJavascriptInterface(new JavaScriptInterface(), "Pd");
		Log.d("initGui", "load index");
		mWebView.loadUrl("file:///android_asset/index.html");
		Log.d("initGui", "done");
	}

	final class JavaScriptInterface {

		JavaScriptInterface() {
		}

		/**
		 * This is not called on the UI thread. Post a runnable to invoke
		 * loadUrl on the UI thread.
		 */
		public void ping() {
			handler.post(new Runnable() {
				public void run() {
					// send the number 12 to our javascript gui component
					mWebView.loadUrl("javascript:ping();");
				}
			});
		}
		
		public void trace(String s) { System.out.println(s); }
		
		public void send(String dest, String s) {
			List<Object> list = new ArrayList<Object>();
			String[] bits = s.split(" ");
			Object[] ol;
			for (int i=0; i < bits.length; i++) {
				try {
					list.add(Float.parseFloat(bits[i]));
				} catch (NumberFormatException e) {
					list.add(bits[i]);
				}
			}
			
 			ol = list.toArray();
			PdBase.sendList(dest, ol);
			Log.e("sending list", "[" + dest + "] -> " + ol.toString());
		}
		
		public void sendBang(String s) {
			PdBase.sendBang(s);
		}
	}
	
	/**
	 * Provides a hook for calling "alert" from javascript. Useful for
	 * debugging your javascript.
	 */
	final class MyWebChromeClient extends WebChromeClient {
		@Override
		public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
			//Log.d(LOG_TAG, message);
			post(message);
			result.confirm();
			return true;
		}
	}

	private void initPd() {
		Resources res = getResources();
		String path = new String("/sdcard/" + res.getString(R.string.app_name) + "/patch/_main.pd");
		PdBase.setReceiver(dispatcher);
		dispatcher.addListener("webkit", webkitListener);
		try {
			patch = PdUtils.openPatch(path);
			String name = res.getString(R.string.app_name);
			pdService.startAudio(22050, 0, 2, -1,   // negative values are replaced by defaults/preferences
					new Intent(this, CanOfBeats.class), android.R.drawable.ic_media_play, name, "Return to " + name + ".");
		} catch (IOException e) {
			post(e.toString() + "; exiting now");
			finish();
		}
	}

	@Override
	public void finish() {
		cleanup();
		super.finish();
	}

	private void cleanup() {
		Resources res = getResources();
		// make sure to release all resources
		if (pdService != null) pdService.stopAudio();
		PdUtils.closePatch(patch);
		PdBase.release();
		try {
			unbindService(serviceConnection);
		} catch (IllegalArgumentException e) {
			// already unbound
			pdService = null;
		}
	}
}
