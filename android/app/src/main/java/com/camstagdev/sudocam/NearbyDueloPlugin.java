package com.camstagdev.sudocam;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.location.LocationManager;
import android.os.Build;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.AdvertisingOptions;
import com.google.android.gms.nearby.connection.ConnectionInfo;
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback;
import com.google.android.gms.nearby.connection.ConnectionResolution;
import com.google.android.gms.nearby.connection.ConnectionsClient;
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes;
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo;
import com.google.android.gms.nearby.connection.DiscoveryOptions;
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback;
import com.google.android.gms.nearby.connection.Payload;
import com.google.android.gms.nearby.connection.PayloadCallback;
import com.google.android.gms.nearby.connection.PayloadTransferUpdate;
import com.google.android.gms.nearby.connection.Strategy;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Conexión entre dos teléfonos para el modo Duelo, sin internet, con
 * Nearby Connections de Google (Bluetooth y el Wi-Fi del teléfono, sin
 * router). Del lado del juego la usa src/game/duelo/transportes/nearby.js.
 *
 * Métodos (todos devuelven una promesa en JavaScript):
 *   prepararse()                  servicios de Google Play, permisos y Bluetooth encendido
 *   anunciar({ nombre })          el anfitrión se anuncia con el código del duelo
 *   detenerAnuncio()
 *   buscar()                      el invitado busca duelos cerca
 *   detenerBusqueda()
 *   conectar({ id, nombre })      el invitado se une; se resuelve al quedar conectados
 *   enviar({ id, texto })
 *   desconectar({ id })
 *
 * Eventos: encontrado { id, nombre }, perdido { id }, conectado { id } (al
 * anfitrión, cuando alguien se une), mensaje { id, texto }, desconectado { id }.
 *
 * Las conexiones se aceptan solas en los dos teléfonos: los jugadores ya
 * eligieron el duelo por su código.
 */
@CapacitorPlugin(
    name = "NearbyDuelo",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
            }
        ),
        @Permission(alias = "wifi", strings = { Manifest.permission.NEARBY_WIFI_DEVICES }),
        @Permission(alias = "ubicacion", strings = { Manifest.permission.ACCESS_FINE_LOCATION }),
    }
)
public class NearbyDueloPlugin extends Plugin {

    // Solo se ven entre sí los teléfonos que usan este mismo servicio.
    private static final String SERVICIO = "com.camstagdev.sudocam.duelo";
    // Uno contra uno: la estrategia más rápida de Nearby.
    private static final Strategy ESTRATEGIA = Strategy.P2P_POINT_TO_POINT;

    private ConnectionsClient cliente;
    // Las uniones del invitado que esperan respuesta, por id del anfitrión.
    private final Map<String, PluginCall> unionesPendientes = new HashMap<>();

    @Override
    public void load() {
        cliente = Nearby.getConnectionsClient(getContext());
    }

    /* ---------- Antes de empezar: permisos y radios ---------- */

    // Qué permisos pide Nearby según la versión de Android. La ubicación se
    // pide siempre: sin ella, en algunos teléfonos la búsqueda por
    // Bluetooth no encuentra a nadie.
    private String[] permisosNecesarios() {
        if (Build.VERSION.SDK_INT >= 33) return new String[] { "bluetooth", "wifi", "ubicacion" };
        if (Build.VERSION.SDK_INT >= 31) return new String[] { "bluetooth", "ubicacion" };
        return new String[] { "ubicacion" };
    }

    private boolean tienePermisos() {
        for (String permiso : permisosNecesarios()) {
            if (getPermissionState(permiso) != PermissionState.GRANTED) return false;
        }
        return true;
    }

    @PluginMethod
    public void prepararse(PluginCall call) {
        int servicios = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(getContext());
        if (servicios != ConnectionResult.SUCCESS) {
            call.reject("Este teléfono no tiene los servicios de Google Play, que el Duelo necesita para conectarse.", "sin-play-services");
            return;
        }
        if (!tienePermisos()) {
            requestPermissionForAliases(permisosNecesarios(), call, "alResponderPermisos");
            return;
        }
        revisarRadios(call);
    }

    @PermissionCallback
    private void alResponderPermisos(PluginCall call) {
        if (!tienePermisos()) {
            call.reject(
                "Sin el permiso de dispositivos cercanos no se puede crear ni buscar un duelo. Puedes darlo en los ajustes de la app.",
                "permisos"
            );
            return;
        }
        revisarRadios(call);
    }

    @SuppressLint("MissingPermission") // isEnabled solo pide BLUETOOTH (normal) hasta Android 11
    private void revisarRadios(PluginCall call) {
        BluetoothManager gestor = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter adaptador = gestor == null ? null : gestor.getAdapter();
        if (adaptador == null) {
            call.reject("Este teléfono no tiene Bluetooth.", "sin-bluetooth");
            return;
        }
        if (!adaptador.isEnabled()) {
            call.reject("Activa el Bluetooth para jugar un duelo.", "bluetooth-apagado");
            return;
        }
        // Hasta Android 11, buscar teléfonos cerca pide la ubicación encendida.
        if (Build.VERSION.SDK_INT < 31 && !ubicacionEncendida()) {
            call.reject("Activa la ubicación del teléfono: en esta versión de Android hace falta para encontrar otros teléfonos.", "ubicacion-apagada");
            return;
        }
        call.resolve();
    }

    private boolean ubicacionEncendida() {
        LocationManager ubicacion = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        if (ubicacion == null) return false;
        if (Build.VERSION.SDK_INT >= 28) return ubicacion.isLocationEnabled();
        return ubicacion.isProviderEnabled(LocationManager.GPS_PROVIDER)
            || ubicacion.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
    }

    /* ---------- Anfitrión ---------- */

    @PluginMethod
    public void anunciar(PluginCall call) {
        String nombre = call.getString("nombre", "SudoCam");
        AdvertisingOptions opciones = new AdvertisingOptions.Builder().setStrategy(ESTRATEGIA).build();
        cliente
            .startAdvertising(nombre, SERVICIO, cicloDeConexion, opciones)
            .addOnSuccessListener((nada) -> call.resolve())
            .addOnFailureListener((error) -> {
                if (codigoDe(error) == ConnectionsStatusCodes.STATUS_ALREADY_ADVERTISING) call.resolve();
                else call.reject(mensajeDeError(error), "anuncio");
            });
    }

    @PluginMethod
    public void detenerAnuncio(PluginCall call) {
        cliente.stopAdvertising();
        call.resolve();
    }

    /* ---------- Invitado ---------- */

    @PluginMethod
    public void buscar(PluginCall call) {
        DiscoveryOptions opciones = new DiscoveryOptions.Builder().setStrategy(ESTRATEGIA).build();
        cliente
            .startDiscovery(SERVICIO, descubrimiento, opciones)
            .addOnSuccessListener((nada) -> call.resolve())
            .addOnFailureListener((error) -> {
                if (codigoDe(error) == ConnectionsStatusCodes.STATUS_ALREADY_DISCOVERING) call.resolve();
                else call.reject(mensajeDeError(error), "busqueda");
            });
    }

    @PluginMethod
    public void detenerBusqueda(PluginCall call) {
        cliente.stopDiscovery();
        call.resolve();
    }

    @PluginMethod
    public void conectar(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("Falta el duelo al que unirse.", "conexion");
            return;
        }
        unionesPendientes.put(id, call);
        cliente
            .requestConnection(call.getString("nombre", "Invitado"), id, cicloDeConexion)
            .addOnFailureListener((error) -> {
                PluginCall pendiente = unionesPendientes.remove(id);
                if (pendiente != null) pendiente.reject(mensajeDeError(error), "conexion");
            });
    }

    /* ---------- Durante el duelo ---------- */

    @PluginMethod
    public void enviar(PluginCall call) {
        String id = call.getString("id");
        String texto = call.getString("texto");
        if (id == null || texto == null) {
            call.reject("Falta el destino o el mensaje.", "envio");
            return;
        }
        cliente
            .sendPayload(id, Payload.fromBytes(texto.getBytes(StandardCharsets.UTF_8)))
            .addOnSuccessListener((nada) -> call.resolve())
            .addOnFailureListener((error) -> call.reject(mensajeDeError(error), "envio"));
    }

    @PluginMethod
    public void desconectar(PluginCall call) {
        String id = call.getString("id");
        if (id != null) cliente.disconnectFromEndpoint(id);
        call.resolve();
    }

    // Si la app se cierra, no dejar al otro teléfono esperando.
    @Override
    protected void handleOnDestroy() {
        cliente.stopAdvertising();
        cliente.stopDiscovery();
        cliente.stopAllEndpoints();
    }

    /* ---------- Lo que avisa Nearby ---------- */

    private final ConnectionLifecycleCallback cicloDeConexion = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(@NonNull String id, @NonNull ConnectionInfo informacion) {
            cliente.acceptConnection(id, cargas);
        }

        @Override
        public void onConnectionResult(@NonNull String id, @NonNull ConnectionResolution resultado) {
            PluginCall pendiente = unionesPendientes.remove(id);
            if (!resultado.getStatus().isSuccess()) {
                if (pendiente != null) pendiente.reject("No se pudo conectar con ese duelo.", "conexion");
                return;
            }
            JSObject datos = new JSObject();
            datos.put("id", id);
            if (pendiente != null) {
                // El invitado ya está dentro: deja de buscar.
                cliente.stopDiscovery();
                pendiente.resolve(datos);
            } else {
                // El anfitrión ya tiene rival: deja de anunciarse.
                cliente.stopAdvertising();
                notifyListeners("conectado", datos);
            }
        }

        @Override
        public void onDisconnected(@NonNull String id) {
            JSObject datos = new JSObject();
            datos.put("id", id);
            notifyListeners("desconectado", datos);
        }
    };

    private final PayloadCallback cargas = new PayloadCallback() {
        @Override
        public void onPayloadReceived(@NonNull String id, @NonNull Payload carga) {
            byte[] bytes = carga.asBytes();
            if (carga.getType() != Payload.Type.BYTES || bytes == null) return;
            JSObject datos = new JSObject();
            datos.put("id", id);
            datos.put("texto", new String(bytes, StandardCharsets.UTF_8));
            notifyListeners("mensaje", datos);
        }

        @Override
        public void onPayloadTransferUpdate(@NonNull String id, @NonNull PayloadTransferUpdate avance) {}
    };

    private final EndpointDiscoveryCallback descubrimiento = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(@NonNull String id, @NonNull DiscoveredEndpointInfo informacion) {
            if (!SERVICIO.equals(informacion.getServiceId())) return;
            JSObject datos = new JSObject();
            datos.put("id", id);
            datos.put("nombre", informacion.getEndpointName());
            notifyListeners("encontrado", datos);
        }

        @Override
        public void onEndpointLost(@NonNull String id) {
            JSObject datos = new JSObject();
            datos.put("id", id);
            notifyListeners("perdido", datos);
        }
    };

    /* ---------- Errores ---------- */

    private static int codigoDe(Exception error) {
        return error instanceof ApiException ? ((ApiException) error).getStatusCode() : -1;
    }

    private static String mensajeDeError(Exception error) {
        int codigo = codigoDe(error);
        if (codigo == ConnectionsStatusCodes.STATUS_BLUETOOTH_ERROR) {
            return "Hubo un problema con el Bluetooth. Apágalo, vuelve a encenderlo e inténtalo otra vez.";
        }
        if (codigo == ConnectionsStatusCodes.STATUS_ENDPOINT_UNKNOWN) {
            return "Ese duelo ya no está disponible.";
        }
        return "No se pudo usar la conexión entre teléfonos (código " + codigo + ").";
    }
}
