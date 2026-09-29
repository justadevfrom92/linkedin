import { Ref, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { actionScript, BotAction, BotMessage, statusScript } from './script';

const FEED_URL = 'https://www.linkedin.com/feed/';
// Desktop Chrome, so LinkedIn serves the desktop composer (the mobile site has no scheduler).
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const ACTION_TIMEOUT_MS = 90_000;

export class NotLoggedInError extends Error {
  constructor() {
    super('Log in to LinkedIn, then tap Post or Schedule again.');
  }
}

export type LinkedInBrowserHandle = {
  /** Loads the feed and runs one post/schedule action. Rejects with a readable error. */
  run(action: BotAction, onStep?: (step: string) => void): Promise<void>;
};

type Pending = {
  id: string;
  script: string;
  injected: boolean;
  onStep?: (step: string) => void;
  resolve: () => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type Props = {
  ref?: Ref<LinkedInBrowserHandle>;
  /** Show the browser full screen (to log in or watch what the bot is doing). */
  visible: boolean;
  onClose: () => void;
  onLoginChange: (loggedIn: boolean) => void;
  /** Optional line shown above the page, e.g. why it opened. */
  message?: string;
};

/**
 * One LinkedIn WebView that stays mounted for the app's lifetime, so the login
 * session persists. It sits invisibly behind the app and is brought to the
 * front when `visible` is set.
 */
export function LinkedInBrowser({ ref, visible, onClose, onLoginChange, message }: Props) {
  const webRef = useRef<WebView>(null);
  const pending = useRef<Pending | null>(null);
  const [nonce, setNonce] = useState(0);
  const counter = useRef(0);

  const finish = (err?: Error) => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    clearTimeout(p.timer);
    if (err) p.reject(err);
    else p.resolve();
  };

  useImperativeHandle(ref, () => ({
    run(action, onStep) {
      if (pending.current) return Promise.reject(new Error('Another post is still in progress'));
      return new Promise<void>((resolve, reject) => {
        const id = `a${++counter.current}`;
        pending.current = {
          id,
          script: actionScript(id, action),
          injected: false,
          onStep,
          resolve,
          reject,
          timer: setTimeout(() => finish(new Error('LinkedIn took too long to respond')), ACTION_TIMEOUT_MS),
        };
        onStep?.('Loading LinkedIn');
        // Changing the URL reloads the feed, so every action starts from a clean page.
        setNonce((n) => n + 1);
      });
    },
  }));

  const onLoadEnd = () => {
    const p = pending.current;
    if (p && !p.injected) {
      p.injected = true;
      // Give LinkedIn's app a moment to boot before driving it.
      setTimeout(() => webRef.current?.injectJavaScript(p.script), 1500);
    } else if (!p) {
      webRef.current?.injectJavaScript(statusScript('status'));
    }
  };

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: BotMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'status') {
      onLoginChange(msg.loggedIn);
      return;
    }
    const p = pending.current;
    if (!p || msg.id !== p.id) return;
    if (msg.type === 'step') {
      p.onStep?.(msg.step);
    } else if (msg.ok) {
      onLoginChange(true);
      finish();
    } else if (msg.error === 'NOT_LOGGED_IN') {
      onLoginChange(false);
      finish(new NotLoggedInError());
    } else {
      finish(new Error(msg.error));
    }
  };

  return (
    <View style={visible ? styles.shown : styles.hidden} pointerEvents={visible ? 'auto' : 'none'}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.bar}>
          <Text style={styles.barTitle}>LinkedIn</Text>
          <Pressable
            onPress={() => {
              onClose();
              // Re-check the login state once the user closes the browser.
              webRef.current?.injectJavaScript(statusScript('status'));
            }}
            hitSlop={12}
          >
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <WebView
          ref={webRef}
          source={{ uri: nonce ? `${FEED_URL}?r=${nonce}` : FEED_URL }}
          userAgent={DESKTOP_UA}
          onLoadEnd={onLoadEnd}
          onMessage={onMessage}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          setSupportMultipleWindows={false}
          style={styles.fill}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shown: { ...StyleSheet.absoluteFill, zIndex: 10, backgroundColor: '#fff' },
  // Kept full size (not 0x0) so LinkedIn lays out normally while hidden.
  hidden: { ...StyleSheet.absoluteFill, zIndex: -1, opacity: 0 },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  barTitle: { fontSize: 17, fontWeight: '600' },
  done: { fontSize: 17, color: '#0a66c2', fontWeight: '600' },
  message: { padding: 12, fontSize: 14, color: '#1d2226', backgroundColor: '#eef3f8' },
});
