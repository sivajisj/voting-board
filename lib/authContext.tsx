"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  name: string;
  role: "admin" | "voter";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "admin" | "voter"
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [loading] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    const authUser = { name: data.name, role: data.role };
    setUser(authUser);
    localStorage.setItem("auth_user", JSON.stringify(authUser));

    if (data.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/voter");
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "admin" | "voter"
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    const authUser = { name, role };
    setUser(authUser);
    localStorage.setItem("auth_user", JSON.stringify(authUser));

    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/voter");
    }
  };

const logout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  setUser(null);
  localStorage.removeItem("auth_user");
  router.push("/login");
};

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}