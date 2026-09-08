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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <CircularProgress size={36} sx={{ color: "#38BDF8" }} />
        <p className="text-sm text-[#94A3B8]">Opening authentication...</p>
      </div>
    </div>
  );
}
