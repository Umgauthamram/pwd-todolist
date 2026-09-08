"use client";

import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import SettingsView from "@/components/settings/SettingsView";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <Box className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#262626] bg-black/95 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton
            onClick={() => router.push("/")}
            className="text-neutral-400 hover:text-white hover:bg-neutral-900"
            size="medium"
          >
            <ArrowBackIcon />
          </IconButton>
          <div className="select-none cursor-pointer" onClick={() => router.push("/")}>
            <span className="font-bold tracking-tight text-white text-lg">Beginning</span>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <SettingsView />
      </main>
    </Box>
  );
}
