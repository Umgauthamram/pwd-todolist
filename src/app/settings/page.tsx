"use client";

import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { ArrowBack as ArrowBackIcon, LightbulbOutlined as LightbulbOutlinedIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import SettingsView from "@/components/settings/SettingsView";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <Box className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#334155] bg-[#0F172A]/90 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton
            onClick={() => router.push("/")}
            className="text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
            size="medium"
          >
            <ArrowBackIcon />
          </IconButton>
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <LightbulbOutlinedIcon className="text-white" fontSize="small" />
            </div>
            <span className="font-semibold tracking-tight text-white text-base">Beginning</span>
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
