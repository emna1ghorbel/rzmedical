/**
 * Centralized API & Base URL helper with automatic host resolution for mobile / network devices.
 */
export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return envUrl.replace("localhost", hostname).replace("127.0.0.1", hostname);
    }
  }
  return envUrl;
};

export const getBaseUrl = (): string => {
  return getApiUrl().replace(/\/api\/?$/, "");
};

export const API_URL = getApiUrl();
