package com.camstagdev.sudocam;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins propios del juego (los de npm se registran solos).
        registerPlugin(NearbyDueloPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
