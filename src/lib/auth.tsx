/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Shield, Lock } from "lucide-react";

interface User {
  name: string;
  role: "admin" | "superadmin";
}

interface AuthContextType {
  user: User | null;
  login: (name: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAuthenticated: false,
});

const ADMIN_CREDENTIALS = {
  name: "Admin User",
  username: "admin",
  password: "admin123",
  role: "superadmin" as const,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setUser({ name: ADMIN_CREDENTIALS.name, role: ADMIN_CREDENTIALS.role });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) return <>{children}</>;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1b33] flex items-center justify-center p-4">
      <div className="bg-[#0f2240] rounded-2xl p-8 max-w-sm w-full border border-white/5">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-sm text-white/50">Sign in to manage the platform</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#d4af37] text-[#0c1b33] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
