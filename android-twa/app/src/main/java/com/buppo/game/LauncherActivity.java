package com.buppo.game;

import android.net.Uri;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse(getString(R.string.default_url));
    }
}
