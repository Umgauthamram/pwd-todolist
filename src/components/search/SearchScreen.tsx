"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  ViewStream as ViewStreamIcon,
  GridView as GridViewIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  LockOutlined as LockOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";
import NoteCard, { NoteItem } from "@/components/notes/NoteCard";

interface SearchScreenProps {
  open: boolean;
  onClose: () => void;
  notes: NoteItem[];
  privateNotes: NoteItem[];
  isPrivateUnlocked: boolean;
  isGridView: boolean;
  setIsGridView: (val: boolean) => void;
  onEdit: (note: NoteItem) => void;
  onTogglePin: (note: NoteItem) => void;
  onChangeColor: (note: NoteItem, color: string) => void;
  onToggleArchive: (note: NoteItem) => void;
  onMoveToTrash: (note: NoteItem) => void;
  onRestoreFromTrash: (note: NoteItem) => void;
  onDeletePermanently: (note: NoteItem) => void;
  allLabels: string[];
}

type ScopeFilter = "all" | "notes" | "archive" | "private";

export default function SearchScreen({
  open,
  onClose,
  notes,
  privateNotes,
  isPrivateUnlocked,
  isGridView,
  setIsGridView,
  onEdit,
  onTogglePin,
  onChangeColor,
  onToggleArchive,
  onMoveToTrash,
  onRestoreFromTrash,
  onDeletePermanently,
  allLabels,
}: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedTag(null);
      setScope("all");
    }
  }, [open]);

  // Handle ESC key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Determine searchable notes pool based on scope and private status
  const searchableNotes = useMemo(() => {
    let pool: NoteItem[] = [];

    if (scope === "all") {
      pool = [...notes.filter((n) => !n.isTrashed)];
      if (isPrivateUnlocked) {
        pool = [...pool, ...privateNotes.filter((n) => !n.isTrashed)];
      }
    } else if (scope === "notes") {
      pool = notes.filter((n) => !n.isArchived && !n.isTrashed);
    } else if (scope === "archive") {
      pool = notes.filter((n) => n.isArchived && !n.isTrashed);
    } else if (scope === "private" && isPrivateUnlocked) {
      pool = privateNotes.filter((n) => !n.isTrashed);
    }

    return pool;
  }, [notes, privateNotes, isPrivateUnlocked, scope]);

  // Filter in real-time as user types
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return searchableNotes.filter((note) => {
      // Tag filter if selected
      if (selectedTag && !note.labels?.includes(selectedTag)) {
        return false;
      }

      // If no text query and tag is selected, match all notes with tag
      if (!q) {
        return Boolean(selectedTag);
      }

      const titleMatch = note.title?.toLowerCase().includes(q);
      const contentMatch = note.content?.toLowerCase().includes(q);
      const labelMatch = note.labels?.some((l) => l.toLowerCase().includes(q));

      return titleMatch || contentMatch || labelMatch;
    });
  }, [searchableNotes, query, selectedTag]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col selection:bg-white selection:text-black">
      {/* Search Header Bar */}
      <header className="sticky top-0 z-10 border-b border-[#262626] bg-black/95 backdrop-blur-md px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Back Button */}
        <Tooltip title="Back to workspace (Esc)">
          <IconButton
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-neutral-900 shrink-0"
            size="medium"
            aria-label="Back"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Search Input Box */}
        <div className="flex-1 max-w-3xl flex items-center bg-[#212121] hover:bg-[#282828] focus-within:bg-[#282828] rounded-xl px-3 py-1.5 transition-all">
          <SearchIcon className="text-neutral-400 mr-2 shrink-0" fontSize="small" />
          <InputBase
            inputRef={inputRef}
            placeholder="Search notes, content, checklists, or #labels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-white placeholder-neutral-500"
            inputProps={{ "aria-label": "search query" }}
          />
          {query && (
            <IconButton
              size="small"
              onClick={() => setQuery("")}
              className="text-neutral-400 hover:text-white p-0.5 ml-1"
              aria-label="Clear search"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </div>

        {/* View Toggle Segmented Control */}
        <div className="flex items-center bg-[#212121] rounded-xl p-0.5 shrink-0">
          <Tooltip title="Grid view">
            <button
              type="button"
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isGridView
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
              aria-label="Grid view"
            >
              <GridViewIcon fontSize="small" sx={{ fontSize: 17 }} />
            </button>
          </Tooltip>
          <Tooltip title="List view">
            <button
              type="button"
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                !isGridView
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
              aria-label="List view"
            >
              <ViewStreamIcon fontSize="small" sx={{ fontSize: 17 }} />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Scope & Tag Filter Bar */}
      <div className="border-b border-[#262626] bg-[#070708] px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider hidden sm:inline mr-1">
          Scope:
        </span>

        {/* All notes */}
        <button
          onClick={() => setScope("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            scope === "all"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#262626]"
          }`}
        >
          All
        </button>

        {/* Notes */}
        <button
          onClick={() => setScope("notes")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            scope === "notes"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#262626]"
          }`}
        >
          <LightbulbOutlinedIcon sx={{ fontSize: 13 }} />
          <span>Notes</span>
        </button>

        {/* Archive */}
        <button
          onClick={() => setScope("archive")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            scope === "archive"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#262626]"
          }`}
        >
          <ArchiveOutlinedIcon sx={{ fontSize: 13 }} />
          <span>Archive</span>
        </button>

        {/* Private Space (if unlocked) */}
        {isPrivateUnlocked && (
          <button
            onClick={() => setScope("private")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              scope === "private"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#262626]"
            }`}
          >
            <LockOutlinedIcon sx={{ fontSize: 13 }} />
            <span>Private Space</span>
          </button>
        )}

        {/* Tag Filters */}
        {allLabels.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#262626]">
            {allLabels.map((lbl) => {
              const isActive = selectedTag === lbl;
              return (
                <button
                  key={lbl}
                  onClick={() => setSelectedTag(isActive ? null : lbl)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-white text-black font-semibold"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#262626]"
                  }`}
                >
                  <LabelOutlinedIcon sx={{ fontSize: 12 }} />
                  <span>#{lbl}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Results Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Active Search Status Banner */}
          {(query.trim() || selectedTag) && (
            <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-[#262626] pb-3">
              <div>
                <span>Found </span>
                <span className="font-semibold text-white">{searchResults.length}</span>
                <span> {searchResults.length === 1 ? "note" : "notes"}</span>
                {query.trim() && (
                  <>
                    <span> matching &quot;</span>
                    <span className="text-white font-medium">{query.trim()}</span>
                    <span>&quot;</span>
                  </>
                )}
                {selectedTag && (
                  <>
                    <span> with tag </span>
                    <span className="text-white font-mono font-medium">#{selectedTag}</span>
                  </>
                )}
              </div>

              {(query.trim() || selectedTag) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSelectedTag(null);
                  }}
                  className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Results Grid / List */}
          {(query.trim() || selectedTag) && searchResults.length > 0 && (
            <div
              className={
                isGridView
                  ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 items-start"
                  : "flex flex-col gap-3 max-w-2xl mx-auto w-full"
              }
            >
              {searchResults.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  viewMode={isGridView ? "grid" : "list"}
                  onEdit={onEdit}
                  onTogglePin={onTogglePin}
                  onChangeColor={onChangeColor}
                  onToggleArchive={onToggleArchive}
                  onMoveToTrash={onMoveToTrash}
                  onRestoreFromTrash={onRestoreFromTrash}
                  onDeletePermanently={onDeletePermanently}
                />
              ))}
            </div>
          )}

          {/* No Results Empty State */}
          {(query.trim() || selectedTag) && searchResults.length === 0 && (
            <div className="text-center py-20 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#212121] flex items-center justify-center text-neutral-400 shadow-xl">
                <SearchIcon sx={{ fontSize: 32 }} />
              </div>
              <div className="space-y-1">
                <Typography variant="h6" className="text-base font-semibold text-white">
                  No matching notes
                </Typography>
                <Typography variant="body2" className="text-xs text-neutral-400 leading-relaxed">
                  We couldn&apos;t find any notes matching your search. Try different keywords, check spelling, or change your scope filter.
                </Typography>
              </div>
            </div>
          )}

          {/* Idle Initial Search State */}
          {!query.trim() && !selectedTag && (
            <div className="text-center py-20 px-4 space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#212121] flex items-center justify-center text-white shadow-xl">
                <SearchIcon sx={{ fontSize: 32 }} />
              </div>
              <div className="space-y-2">
                <Typography variant="h6" className="text-base font-semibold text-white">
                  Search your notes
                </Typography>
                <Typography variant="body2" className="text-xs text-neutral-400 leading-relaxed">
                  Start typing to find notes instantly across titles, descriptions, checklists, and tags.
                </Typography>
              </div>

              {allLabels.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Quick Tag Filters:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {allLabels.slice(0, 8).map((lbl) => (
                      <button
                        key={lbl}
                        onClick={() => setSelectedTag(lbl)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-neutral-300 bg-[#0e0e10] hover:bg-neutral-800 border border-[#262626] transition-all cursor-pointer"
                      >
                        <LabelOutlinedIcon sx={{ fontSize: 12 }} />
                        <span>#{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
