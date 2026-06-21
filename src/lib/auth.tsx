/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { Shield, Lock, Mail, UserPlus } from "lucide-react";
import { api } from "./api";

interface User {
  id: number;
  name: string;
  email: string;
  role: "member" | "admin" | "superadmin";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => ({ ok: false }),
  loginWithGoogle: async () => false,
  logout: () => {},
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = api.getToken();
    if (!token) {
      queueMicrotask(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }
    api.auth
      .me()
      .then((u) => { if (!cancelled) setUser(u as User); })
      .catch(() => { if (!cancelled) api.clearToken(); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.auth.login(email, password);
      api.setToken();
      setUser(res.user as User);
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await api.auth.register(name, email, password);
      api.setToken();
      setUser(res.user as User);
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      return { ok: false, error: msg };
    }
  }, []);

  const loginWithGoogle = useCallback(async (token: string) => {
    try {
      const res = await api.auth.google(token);
      api.setToken();
      setUser(res.user as User);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, loginWithGoogle, logout, isAuthenticated: !!user, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function GoogleSignInButton({ onSuccess }: { onSuccess: (token: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !divRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const google = (window as unknown as Record<string, unknown>).google as {
        accounts: { id: { initialize: (opts: Record<string, unknown>) => void; renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void } };
      };
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) onSuccess(response.credential);
        },
      });

      google.accounts.id.renderButton(divRef.current!, {
        theme: "filled_blue",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [clientId, onSuccess]);

  if (!clientId) return null;

  return <div ref={divRef} className="w-full flex justify-center" />;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1b33] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (!ok) setError("Invalid email or password");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await register(name, email, password);
    setSubmitting(false);
    if (!res.ok) setError(res.error || "Registration failed");
  };

  const handleGoogleSuccess = async (token: string) => {
    setError("");
    const ok = await loginWithGoogle(token);
    if (!ok) setError("Google sign-in failed");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email);
      setResetSent(true);
    } catch {
      setError("Failed to send reset email.");
    }
    setSubmitting(false);
  };

  if (mode === "forgot") {
    return (
      <div className="min-h-screen bg-[#0c1b33] flex items-center justify-center p-4">
        <div className="bg-[#0f2240] rounded-2xl p-8 max-w-sm w-full border border-white/5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#d4af37]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-sm text-white/50">Enter your email to receive a reset link.</p>
          </div>
          {resetSent ? (
            <div className="text-center">
              <p className="text-green-400 text-sm mb-4">If that email is registered, a reset link has been sent.</p>
              <button onClick={() => { setMode("login"); setResetSent(false); setError(""); }} className="text-[#d4af37] hover:underline text-sm">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full btn-gold flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-[#0c1b33] border-t-transparent rounded-full animate-spin" /> : "Send Reset Link"}
              </button>
              <p className="text-center text-xs text-white/30 mt-2">
                Remember your password?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="text-[#d4af37] hover:underline">Sign in</button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1b33] flex items-center justify-center p-4">
      <div className="bg-[#0f2240] rounded-2xl p-8 max-w-sm w-full border border-white/5">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-white/50">
            {mode === "login" ? "Sign in to manage the platform" : "Join the Kingdom Mission Network"}
          </p>
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} />

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0f2240] px-2 text-white/30">or continue with email</span>
          </div>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
          {mode === "register" && (
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
            </div>
          )}
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
            </div>
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#d4af37] text-[#0c1b33] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-[#0c1b33] border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              <>
                <Shield className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        {mode === "login" && (
          <button onClick={() => { setMode("forgot"); setError(""); }} className="block mx-auto mt-3 text-xs text-white/40 hover:text-[#d4af37] transition-colors">
            Forgot Password?
          </button>
        )}

        <p className="text-center text-xs text-white/30 mt-5">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-[#d4af37] hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-[#d4af37] hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
