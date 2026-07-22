"use client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Decoded Vault JWT claims we care about for the demo. The token is opaque
// to us — we just surface a few claim fields as UI hints.
export type SessionClaims = {
  applicationId?: string;
  consumerId?: string;
  consumerMetadata?: { accountName?: string; userName?: string; email?: string };
  exp?: number;
  iat?: number;
};

export type Session = SessionClaims & { jwt: string };

type Ctx = {
  session: Session | null;
  token: string | null;
  setToken: (t: string | null) => void;
  clearSession: () => void;
};

const STORAGE_KEY = "apideck-smb-suite-session";
const SessionContext = createContext<Ctx>({
  session: null,
  token: null,
  setToken: () => {},
  clearSession: () => {},
});

function decodeJwt(token: string): SessionClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="))
        : Buffer.from(padded, "base64").toString("utf8");
    const raw = JSON.parse(json);
    return {
      applicationId: raw.application_id ?? raw.applicationId,
      consumerId: raw.consumer_id ?? raw.consumerId,
      consumerMetadata:
        raw.consumer_metadata ?? raw.consumerMetadata ?? undefined,
      exp: raw.exp,
      iat: raw.iat,
    };
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setTokenState(stored);
  }, []);

  useEffect(() => {
    if (!token) {
      setSession(null);
      return;
    }
    const claims = decodeJwt(token);
    setSession({ ...(claims ?? {}), jwt: token });
  }, [token]);

  const setToken = useCallback((value: string | null) => {
    if (typeof window !== "undefined") {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
    setTokenState(value);
  }, []);

  const clearSession = useCallback(() => setToken(null), [setToken]);

  return (
    <SessionContext.Provider
      value={{ session, token, setToken, clearSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
