import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import JobGuide from './JobGuide';

// The Northstar web app runs on your computer (npm start in the project folder).
// By default the phone opens it on the same computer that runs Expo, at port 3000.
// Set "serverUrl" in app.json (extra) to point somewhere else.
function defaultServerUrl() {
  const extra = Constants.expoConfig?.extra || {};
  if (extra.serverUrl) return extra.serverUrl.replace(/\/$/, '');
  const host = (Constants.expoConfig?.hostUri || '').split(':')[0];
  const port = extra.serverPort || 3000;
  return host ? `http://${host}:${port}` : `http://localhost:${port}`;
}

export default function App() {
  const webRef = useRef(null);
  const [serverUrl, setServerUrl] = useState(defaultServerUrl);
  const [draftUrl, setDraftUrl] = useState(serverUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [guideJob, setGuideJob] = useState(null); // a Craigslist listing open in the step-by-step guide

  // Ask once so the map's "near me" works inside the app
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  // Android back button goes back inside the app first
  useEffect(() => {
    if (Platform.OS !== 'android' || guideJob) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, guideJob]);

  // Northstar pages stay in the app; phone calls, Google Maps and other sites open outside it
  const onShouldStart = useCallback(
    (req) => {
      const url = req.url || '';
      if (url.startsWith(serverUrl) || url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return true;
      if (url.startsWith('https://checkout.stripe.com')) return true;
      if (req.isTopFrame === false) return true;
      // Craigslist listings open in the guide (the Gigs page normally sends a message instead)
      if (/^https?:\/\/([a-z0-9-]+\.)*craigslist\.org\//i.test(url)) {
        setGuideJob({ url, title: '', message: 'Hi, I saw your post and I’m interested. I’m a hard worker and I can start right away. Please let me know when and where to come. Thank you!' });
        return false;
      }
      Linking.openURL(url).catch(() => {});
      return false;
    },
    [serverUrl]
  );

  const retry = (url) => {
    const next = (url || serverUrl).trim().replace(/\/$/, '');
    setServerUrl(next);
    setDraftUrl(next);
    setFailed(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        {failed ? (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Can’t reach Northstar</Text>
            <Text style={styles.errorText}>
              Make sure the server is running on your computer (npm start) and your phone is on the same Wi-Fi.
            </Text>
            <Text style={styles.label}>Server address</Text>
            <TextInput
              style={styles.input}
              value={draftUrl}
              onChangeText={setDraftUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={() => retry(draftUrl)}
            />
            <Pressable style={styles.button} onPress={() => retry(draftUrl)}>
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.root}>
            <WebView
              key={reloadKey}
              ref={webRef}
              source={{ uri: serverUrl }}
              style={styles.root}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              geolocationEnabled
              sharedCookiesEnabled
              allowsBackForwardNavigationGestures
              pullToRefreshEnabled
              setSupportMultipleWindows={false}
              allowsInlineMediaPlayback
              // Android: follow the pages' viewport setting (they open slightly zoomed out)
              scalesPageToFit
              onShouldStartLoadWithRequest={onShouldStart}
              onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
              onMessage={(e) => {
                try {
                  const m = JSON.parse(e.nativeEvent.data);
                  if (m && m.type === 'job-guide' && m.url) setGuideJob(m);
                } catch (err) {}
              }}
              onLoadEnd={() => setLoading(false)}
              onError={() => setFailed(true)}
              onHttpError={(e) => {
                if (e.nativeEvent.statusCode >= 500 && e.nativeEvent.url === serverUrl) setFailed(true);
              }}
            />
            {loading && (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator size="large" color="#111111" />
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
      {guideJob ? (
        <View style={StyleSheet.absoluteFill}>
          <JobGuide job={guideJob} onClose={() => setGuideJob(null)} />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  error: { flex: 1, padding: 24, justifyContent: 'center' },
  errorTitle: { fontSize: 26, fontWeight: '800', color: '#111111', marginBottom: 10 },
  errorText: { fontSize: 16, lineHeight: 23, color: '#555555', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#555555', marginBottom: 6 },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    marginBottom: 14,
  },
  button: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
});
