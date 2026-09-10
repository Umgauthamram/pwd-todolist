"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface UserProfile {
  id: string;
  email: string;
  isVerified: boolean;
  hasPin: boolean;
}

export type AuthMode = "login" | "register" | "verify" | "forgot";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  pendingEmail: string;
  isPrivateUnlocked: boolean;
  setIsPrivateUnlocked: (unlocked: boolean) => void;
  checkPrivateStatus: () => Promise<void>;
  lockPrivateSpace: () => Promise<void>;
  setPendingEmail: (email: string) => void;
  openAuthModal: (mode?: AuthMode, email?: string) => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: AuthMode) => void;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "beginning_cached_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize user from localStorage to allow instantaneous offline loading
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState<boolean>(false);

  const checkPrivateStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/private-space/status");
      if (res.ok) {
        const data = await res.json();
        setIsPrivateUnlocked(Boolean(data.isUnlocked));
        if (data.hasPin !== undefined) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, hasPin: Boolean(data.hasPin) };
            try {
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } else {
        setIsPrivateUnlocked(false);
      }
    } catch {
      setIsPrivateUnlocked(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          } catch {}
          await checkPrivateStatus();
          return;
        }
      }

      // Explicitly unauthenticated by server
      if (res.status === 401) {
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch {}
        setUser(null);
        setIsPrivateUnlocked(false);
      }
    } catch (err) {
      console.warn("Failed to fetch online session (retaining offline session if available):", err);
      // Offline fallback: load from localStorage
      try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
          return;
        }
      } catch {}
      setUser(null);
      setIsPrivateUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [checkPrivateStatus]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (mode: AuthMode = "login", email = "") => {
    setAuthMode(mode);
    if (email) setPendingEmail(email);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const lockPrivateSpace = async () => {
    try {
      await fetch("/api/private-space/lock", { method: "POST" });
    } catch (err) {
      console.error("Lock error:", err);
    } finally {
      setIsPrivateUnlocked(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {}
      setUser(null);
      setIsPrivateUnlocked(false);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authMode,
        pendingEmail,
        isPrivateUnlocked,
        setIsPrivateUnlocked,
        checkPrivateStatus,
        lockPrivateSpace,
        setPendingEmail,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
        setUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
