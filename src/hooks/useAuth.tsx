import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

const KEY = "archguard.auth.user";
const USERS_KEY = "archguard.auth.accounts";

interface Account extends AuthUser {
  password: string;
}

interface AuthCtx {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  ready: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

const readAccounts = (): Account[] => {
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as Account[];
  } catch {
    return [];
  }
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AuthUser | null) => {
    setUser(next);
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await wait(650);
      const account = readAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (!account || account.password !== password) {
        throw new Error("Incorrect email or password.");
      }
      persist({ id: account.id, name: account.name, email: account.email });
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await wait(750);
      const accounts = readAccounts();
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }
      const account: Account = { id: crypto.randomUUID(), name, email, password };
      window.localStorage.setItem(USERS_KEY, JSON.stringify([...accounts, account]));
      persist({ id: account.id, name: account.name, email: account.email });
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
