package com.buppo.game;

import android.net.Uri;
import android.view.WindowManager;

import androidx.browser.trusted.TrustedWebActivityDisplayMode;

import com.google.androidbrowserhelper.trusted.TwaLauncher;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse(getString(R.string.default_url));
    }

    @Override
    protected TwaLauncher.FallbackStrategy getFallbackStrategy() {
        return TwaLauncher.WEBVIEW_FALLBACK_STRATEGY;
    }

    @Override
    protected TrustedWebActivityDisplayMode getDisplayMode() {
        return new TrustedWebActivityDisplayMode.ImmersiveMode(
                true,
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        );
    }
}
