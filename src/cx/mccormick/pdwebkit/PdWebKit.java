package cx.mccormick.pdwebkit;

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
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MenuInflater;

public class PdWebKit extends Activity {

	private final Handler handler = new Handler();
	private PdService pdService = null;
	private String patch;
	private WebView mWebView;
	private final PdWebKit that = this;

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
				if (a != 0)
					msg.append(" ");
				msg.append((String) args[a]);
			}
			js("PdReceive('" + msg.toString() + "')");
		}
		
		// the remaining methods will never be called
		@Override
		public synchronized void receiveMessage(String symbol, Object... args) {
			StringBuffer msg = new StringBuffer();
			String space;
			for (int a=0; a<args.length; a++) {
				if (a != 0)
					msg.append(" ");
				msg.append(args[a].toString());
			}
			if (msg.length() > 0) {
				space = " ";
			} else {
				space = "";
			}
			//post("[" + symbol + "]" + space + msg.toString());
			//Log.e("receiveMessage", "[" + symbol + "]" + space + msg.toString());
			// dispatch key event
			/*if (symbol.equals("key")) {
				int x = ((Float)args[0]).intValue();
                		mWebView.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, x));
		                mWebView.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, x));
				//mWebView.dispatchKeyEvent(new KeyEvent(0, args[0].toString(), 0, 0));
			} else {*/
			js("PdReceive('" + symbol + space + msg.toString() + "')");
			//}
		}
		
		@Override public void receiveSymbol(String symbol)  { js("PdReceive('" + symbol + "')"); }
		@Override public void receiveFloat(float x) { js("PdReceive(" + x + ")"); }
		@Override public void receiveBang() { js("PdReceive('bang')"); }
	};

	private void js(final String call) {
		this.runOnUiThread(new Runnable() {
			public void run() {
				mWebView.loadUrl("javascript:" + call + ";");
				//mWebView.postInvalidate();
			}
		});
		// mWebView.loadUrl("javascript:" + call + ";");
	}

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
			handler.post(new Runnable() {
				public void run() {
					initPd();
				}
			});
		}
		
		@Override
		public void onServiceDisconnected(ComponentName name) {
			// this method will never be called
		}
	};

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		final ProgressDialog pd = new ProgressDialog(PdWebKit.this);
		super.onCreate(savedInstanceState);
		Timer t = new Timer(); 
		pd.setMessage("Loading. Please wait...");
		pd.setCancelable(false);
		pd.setIndeterminate(true);
		pd.show();
		initGui();
		t.schedule(new TimerTask() {
			public void run() {
				handler.post(new Runnable() {
					public void run() {
						unpackResources();
						pd.dismiss();
					}
				});
			}
		}, 2000);
	}
	
	private void unpackResources() {
		Resources res = getResources();
		File libDir = getFilesDir();
		try {
			IoUtils.extractZipResource(res.openRawResource(R.raw.abstractions), libDir, false);
			IoUtils.extractZipResource(res.openRawResource(IoUtils.hasArmeabiV7a() ? R.raw.externals_v7a : R.raw.externals), libDir, false);
			//IoUtils.extractZipResource(getResources().openRawResource(R.raw.patch), new File("/sdcard/" + res.getString(R.string.app_name)), true);
		} catch (IOException e) {
			Log.e("Player", e.toString());
			e.printStackTrace();
		}
		PdBase.addToSearchPath(libDir.getAbsolutePath());
		//PdBase.addToSearchPath("/sdcard/" + res.getString(R.string.app_name) + "/patch/");
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.menu, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle item selection
		switch (item.getItemId()) {
			case R.id.about:
				//newGame();
				Log.e("menu", "about");
				js("about()");
				return true;
			case R.id.help:
				//newGame();
				Log.e("menu", "help");
				js("help()");
				return true;
			case R.id.quit:
				Log.e("menu", "quit");
				finish();
			return true;
				default:
			return super.onOptionsItemSelected(item);
		}
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
		mWebView.pauseTimers();
	}

	@Override
	protected void onResume() {
		super.onResume();
		mWebView.resumeTimers();
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
		webSettings.setBuiltInZoomControls(false);
		//webSettings.setDatabaseEnabled(false);
		//webSettings.setDomStorageEnabled(false);
		//webSettings.setGeolocationEnabled(false);
		webSettings.setPluginsEnabled(false);
		webSettings.setRenderPriority(WebSettings.RenderPriority.NORMAL);

		mWebView.setWebChromeClient(new MyWebChromeClient());
		mWebView.addJavascriptInterface(new JavaScriptInterface(), "Pd");
		//mWebView.setScrollBarStyle(WebView.)
		mWebView.setVerticalScrollbarOverlay(true);
		mWebView.loadUrl("file:///android_asset/index.html");
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
			
			for (int i=0; i < bits.length; i++) {
				try {
					list.add(Float.parseFloat(bits[i]));
				} catch (NumberFormatException e) {
					list.add(bits[i]);
				}
			}
			
			Object[] ol = list.toArray();
			PdBase.sendList(dest, ol);
		}
		
		public void sendBang(String s) {
			PdBase.sendBang(s);
		}
		
		public void requestfiles() {
			StringBuffer msg = new StringBuffer();
			msg.append("'");
			List<File> list = IoUtils.find(new File("/sdcard"), ".*\\.wpd$");
			for (File dir: list) {
				// scenes.put(dir.getName(), dir.getAbsolutePath());
				msg.append(dir.getAbsolutePath().toString() + "', '");
			}
			msg.append("'");
			js("files(" + msg + ")");
		}
		
		public void load(String path) {
			post(path);
			Resources res = getResources();
			try {
				patch = PdUtils.openPatch(path + "/_main.pd");
			} catch (IOException e) {
				post(e.toString() + "; exiting now");
				finish();
			}
			bindService(new Intent(that, PdService.class), serviceConnection, BIND_AUTO_CREATE);
			mWebView.loadUrl("file://" + path + "/index.html");
		}
	}
	
	/**
	 * Provides a hook for calling "alert" from javascript. Useful for
	 * debugging your javascript.
	 */
	final class MyWebChromeClient extends WebChromeClient {
		@Override
		public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
			post(message);
			result.confirm();
			return true;
		}
	}

	private void initPd() {
		Resources res = getResources();
		PdBase.setReceiver(dispatcher);
		dispatcher.addListener("webkit", webkitListener);
		String name = res.getString(R.string.app_name);
		try {
			pdService.initAudio(22050, 0, 2, -1);   // negative values are replaced by defaults/preferences
		} catch (IOException e) {
			post(e.toString() + "; exiting now");
			finish();
		}
		pdService.startAudio(new Intent(this, PdWebKit.class), android.R.drawable.ic_media_play, name, "Return to " + name + ".");
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
