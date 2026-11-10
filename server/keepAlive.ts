const DEFAULT_INTERVAL_MINUTES = 10;

let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function resolveKeepAliveBaseUrl(): string | null {
  const candidates = [
    process.env.KEEP_ALIVE_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.APP_URL,
  ];

  for (const raw of candidates) {
    const value = (raw || '').trim().replace(/\/+$/, '');
    if (value && value !== 'MY_APP_URL' && /^https?:\/\//i.test(value)) {
      return value;
    }
  }

  return null;
}

async function pingEndpoint(pingUrl: string): Promise<void> {
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'JobPilot-KeepAlive/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.warn(`[KeepAlive] Ping returned HTTP ${response.status} from ${pingUrl}`);
    }
  } catch (err: any) {
    console.warn(`[KeepAlive] Ping failed for ${pingUrl}:`, err?.message || err);
  }
}

/**
 * Periodically pings the backend's public /api/ping URL so Render's free web
 * service does not hit the 15-minute inactivity spin-down window.
 */
export function startKeepAlive(): void {
  if (keepAliveTimer) return;

  if (process.env.KEEP_ALIVE_ENABLED === 'false') {
    console.log('[KeepAlive] Disabled via KEEP_ALIVE_ENABLED=false.');
    return;
  }

  const isProdOrRender =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.KEEP_ALIVE_URL);

  if (!isProdOrRender) {
    return;
  }

  const baseUrl = resolveKeepAliveBaseUrl();
  if (!baseUrl) {
    console.log('[KeepAlive] Skipped: no RENDER_EXTERNAL_URL, KEEP_ALIVE_URL, or APP_URL found.');
    return;
  }

  const parsedMinutes = Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES);
  const intervalMinutes =
    Number.isFinite(parsedMinutes) && parsedMinutes > 0
      ? Math.min(14, Math.max(1, parsedMinutes))
      : DEFAULT_INTERVAL_MINUTES;

  const pingUrl = `${baseUrl}/api/ping`;
  console.log(`[KeepAlive] Active — pinging ${pingUrl} every ${intervalMinutes} min.`);

  keepAliveTimer = setInterval(() => {
    void pingEndpoint(pingUrl);
  }, intervalMinutes * 60 * 1000);

  // Do not prevent graceful process shutdown
  keepAliveTimer.unref();
}

export function stopKeepAlive(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

