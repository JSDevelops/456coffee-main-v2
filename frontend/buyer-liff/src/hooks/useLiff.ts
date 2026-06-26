import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { auth } from '../api';

export interface LiffUser {
  id?: string; // Our Backend User ID
  userId: string; // LINE UID
  displayName: string;
  pictureUrl?: string;
  points?: number;
}

export function useLiff() {
  const [user, setUser] = useState<LiffUser | null>(null);
  const [isLiffLoading, setIsLiffLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initLiff = async () => {
      try {
        const liffId = String(import.meta.env.VITE_LIFF_ID || '').trim();

        if (!liffId) {
          console.error('Missing VITE_LIFF_ID. Set a real LIFF ID to enable LINE login.');
          setUser(null);
          return;
        }

        await liff.init({ liffId });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          const accessToken = liff.getAccessToken();
          const syncRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/line`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken,
              lineUid: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl
            })
          });
          const dbUser = await syncRes.json();
          if (dbUser.token) auth.setToken(dbUser.token);

          if (!cancelled) {
            setUser({
              id: dbUser.id,
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              points: dbUser.points
            });
          }
        } else {
          if (import.meta.env.PROD) {
            liff.login();
            return;
          }
          setUser(null);
        }
      } catch (err) {
        console.error('LIFF Init Error:', err);
        setUser(null);
      } finally {
        if (!cancelled) setIsLiffLoading(false);
      }
    };

    initLiff();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLiffLoading, liff };
}
