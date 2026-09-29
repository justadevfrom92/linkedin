import { createContext, ReactNode, useContext, useRef, useState } from 'react';

import { LinkedInBrowser, LinkedInBrowserHandle, NotLoggedInError } from './LinkedInBrowser';
import { BotAction } from './script';

type LinkedIn = {
  /** True while a post is being published; the bot handles one at a time. */
  busy: boolean;
  publish(action: BotAction, onStep: (step: string) => void): Promise<void>;
};

const LinkedInContext = createContext<LinkedIn | null>(null);

export function useLinkedIn(): LinkedIn {
  const ctx = useContext(LinkedInContext);
  if (!ctx) throw new Error('useLinkedIn must be used inside LinkedInProvider');
  return ctx;
}

/**
 * Keeps one logged-in LinkedIn page alive behind every screen and runs post
 * and schedule actions on it. When LinkedIn asks for a login, the page is shown
 * so the user can sign in.
 */
export function LinkedInProvider({ children }: { children: ReactNode }) {
  const browser = useRef<LinkedInBrowserHandle>(null);
  const [busy, setBusy] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const publish = async (action: BotAction, onStep: (step: string) => void) => {
    setBusy(true);
    try {
      await browser.current!.run(action, onStep);
    } catch (e) {
      if (e instanceof NotLoggedInError) setShowLogin(true);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinkedInContext.Provider value={{ busy, publish }}>
      {children}
      <LinkedInBrowser
        ref={browser}
        visible={showLogin}
        message="Log in to LinkedIn with your email and password, then tap Done and press Post again."
        onClose={() => setShowLogin(false)}
        onLoginChange={() => {}}
      />
    </LinkedInContext.Provider>
  );
}
