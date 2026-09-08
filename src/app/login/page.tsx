"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";

export default function LoginPage() {
  const { user, openAuthModal, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/");
      } else {
        openAuthModal("login");
      }
    }
  }, [user, loading, openAuthModal, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <CircularProgress size={36} sx={{ color: "#ffffff" }} />
        <p className="text-sm text-neutral-400">Opening authentication...</p>
      </div>
    </div>
  );
}
