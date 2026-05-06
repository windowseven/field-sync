const API_PATH = "/api/v1";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function isLocalUrl(value: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isBrowserOnLocalhost(): boolean {
  return (
    typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname)
  );
}

function getRenderOrigin(): string | null {
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }

  if (process.env.FRONTEND_URL && !isLocalUrl(process.env.FRONTEND_URL)) {
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }

  return null;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (isBrowserOnLocalhost()) {
      return `${window.location.protocol}//${window.location.hostname}:5000${API_PATH}`;
    }

    return API_PATH;
  }

  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (configured && !isLocalUrl(configured)) {
    return configured;
  }

  const renderOrigin = getRenderOrigin();
  if (renderOrigin) {
    return `${renderOrigin}${API_PATH}`;
  }

  return process.env.NODE_ENV === "production"
    ? `http://127.0.0.1:${process.env.PORT || 5000}${API_PATH}`
    : "http://localhost:5000/api/v1";
}

export function getWsBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (isBrowserOnLocalhost()) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.hostname}:5000`;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }

  const configured = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");

  if (configured && !isLocalUrl(configured)) {
    return configured;
  }

  const renderOrigin = getRenderOrigin();
  if (renderOrigin) {
    return renderOrigin.replace(/^http/, "ws");
  }

  return process.env.NODE_ENV === "production"
    ? "wss://field-sync.onrender.com"
    : "ws://localhost:5000";
}
