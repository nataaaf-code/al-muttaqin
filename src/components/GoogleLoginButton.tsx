import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GOOGLE_CLIENT_ID = '619642670845-e7tvthu3ro4aip2fcdm80788486sc3vq.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
    handleGoogleCredentialResponse?: (response: any) => void;
  }
}

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: any) => void;
  loading?: boolean;
}

export function GoogleLoginButton({ onSuccess, onError, loading = false }: GoogleLoginButtonProps) {
  const buttonDivRef = useRef<any>(null);
  const [gsiRendered, setGsiRendered] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Definisikan handler callback global
    window.handleGoogleCredentialResponse = (response: any) => {
      if (response && response.credential) {
        onSuccess(response.credential);
      } else {
        if (onError) onError(new Error('Kredensial Google tidak ditemukan'));
      }
    };

    // Muat script Google Identity Services jika belum ada
    const scriptId = 'google-gsi-client';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID.trim(),
            callback: window.handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (buttonDivRef.current) {
            window.google.accounts.id.renderButton(buttonDivRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              width: 320,
              logo_alignment: 'left',
            });
            setGsiRendered(true);
          }
        } catch (e) {
          console.warn('[GSI Error]', e);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [onSuccess, onError]);

  // Fallback trigger jika tombol GIS native belum terender
  const handleManualPopup = () => {
    if (Platform.OS === 'web' && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      if (onError) onError(new Error('Layanan Google Sign-In sedang dimuat, silakan tunggu sebentar.'));
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#0D3723" />
          <Text style={styles.loadingText}>Memverifikasi akun Google...</Text>
        </View>
      ) : (
        <>
          {/* Kontainer untuk Tombol Resmi Google Identity Services */}
          {Platform.OS === 'web' && (
            <div
              ref={buttonDivRef}
              style={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: '44px',
                width: '100%',
              }}
            />
          )}

          {/* Tampilkan tombol custom hanya jika tombol resmi GIS belum siap */}
          {!gsiRendered && (
            <TouchableOpacity
              style={styles.customBtn}
              onPress={handleManualPopup}
              activeOpacity={0.85}
            >
              <Svg width="22" height="22" viewBox="0 0 24 24">
                <Path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <Path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <Path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </Svg>
              <Text style={styles.customBtnText}>Lanjutkan dengan Google</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0D3723',
  },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
});
