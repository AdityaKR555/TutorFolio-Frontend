import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PlatformLoader from './PlatformLoader';
import { isLocalHost, resolveWebsiteHost, setWebsiteDomains } from '../utils/websiteUrls';

import { WebsiteHostContext } from "../utils/websiteHostContext";
export default function WebsiteHostBoundary({ children }) {
  const [host, setHost] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    axios.get(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/website/domains`, { timeout: 10000 }).then(({ data }) => {
      if (cancelled) return;
      if (data.status !== 200 || !Array.isArray(data.data?.platformDomains) || !Array.isArray(data.data?.reservedSubdomains)) throw new Error('Invalid registry');
      setWebsiteDomains(data.data);
      setHost(resolveWebsiteHost(window.location.hostname, data.data));
    }).catch(() => {
      if (cancelled) return;
      // No tenant hostname is guessed when the registry cannot be loaded.
      if (isLocalHost(window.location.hostname) && !window.location.hostname.endsWith('.localhost')) setHost({ kind: 'platform' });
      else setHost({ kind: 'unavailable' });
    });
    return () => { cancelled = true; };
  }, [attempt]);
  if (!host) return <div className="grid min-h-screen place-items-center"><PlatformLoader /></div>;
  if (['unknown', 'protected', 'unavailable'].includes(host.kind)) return <main className="grid min-h-screen place-content-center gap-4 p-8 text-center"><h1 className="text-2xl font-bold">{host.kind === 'unavailable' ? 'Website temporarily unavailable' : 'Website not found'}</h1>{host.kind === 'unavailable' && <button type="button" onClick={() => { setHost(null); setAttempt((value) => value + 1); }}>Try again</button>}</main>;
  return <WebsiteHostContext.Provider value={host}>{children}</WebsiteHostContext.Provider>;
}
