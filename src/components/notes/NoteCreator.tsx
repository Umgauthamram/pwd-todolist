"use client";

import React, { useState, useRef, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
  CheckBoxOutlined as CheckBoxOutlinedIcon,
  BrushOutlined as BrushOutlinedIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import ColorPicker from "./ColorPicker";
import { getNoteColor } from "@/constants/colors";

export interface CreateNotePayload {
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  labels: string[];
}

interface NoteCreatorProps {
  onSave: (payload: CreateNotePayload) => Promise<void>;
}

export default function NoteCreator({ onSave }: NoteCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#212121");
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (contentInputRef.current) {
      contentInputRef.current.style.height = "auto";
      contentInputRef.current.style.height = `${contentInputRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Click outside to collapse & save if not empty
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isExpanded) {
          handleAutoSaveAndClose();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, title, content, color, isPinned, isArchived, labels]);

  const handleAutoSaveAndClose = async () => {
    if (title.trim() || content.trim()) {
      setSaving(true);
      await onSave({
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        isArchived,
        labels,
      });
      setSaving(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setColor("#212121");
    setIsPinned(false);
    setIsArchived(false);
    setLabels([]);
    setShowLabelInput(false);
    setNewLabelInput("");
    setIsExpanded(false);
  };

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newLabelInput.trim()) {
      e.preventDefault();
      const cleaned = newLabelInput.trim().replace(/^#/, "");
      if (!labels.includes(cleaned)) {
        setLabels([...labels, cleaned]);
      }
      setNewLabelInput("");
      setShowLabelInput(false);
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };



  if (!isExpanded) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => contentInputRef.current?.focus(), 50);
          }}
          className="bg-[#212121] hover:bg-[#282828] rounded-2xl p-3.5 shadow-xl transition-all flex items-center justify-between cursor-text"
        >
          <span className="text-neutral-400 text-sm font-medium select-none px-1">
            Take a note...
          </span>
          <div className="flex items-center gap-1 text-neutral-400">
            <Tooltip title="New list">
              <IconButton size="small" className="text-neutral-400 hover:text-white">
                <CheckBoxOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="New note with drawing">
              <IconButton size="small" className="text-neutral-400 hover:text-white">
                <BrushOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
  const activeColor = getNoteColor(color);
  const isLight = Boolean(activeColor.isLight);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        ref={containerRef}
        style={{
          backgroundColor: activeColor.bg,
          border: activeColor.border || "none",
        }}
        className="rounded-2xl p-4 shadow-2xl transition-colors space-y-3 relative"
      >
        {/* Title Input & Pin Button */}
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ color: isLight ? activeColor.text : "#ffffff" }}
            className={`w-full bg-transparent text-base font-semibold focus:outline-none ${
              isLight ? "placeholder-neutral-400" : "placeholder-neutral-500"
            }`}
          />
          <Tooltip title={isPinned ? "Unpin note" : "Pin note"}>
            <IconButton
              size="small"
              onClick={() => setIsPinned(!isPinned)}
              className={
                isLight
                  ? "hover:opacity-80 transition-opacity"
                  : isPinned
                  ? "text-white"
                  : "text-neutral-400 hover:text-white"
              }
              style={isLight ? { color: activeColor.text } : undefined}
            >
              {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </div>

        {/* Content Multiline Area */}
        <div>
          <textarea
            ref={contentInputRef}
            placeholder="Take a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{ color: isLight ? activeColor.text : "#ffffff" }}
            className={`w-full bg-transparent text-sm focus:outline-none resize-none leading-relaxed ${
              isLight ? "placeholder-neutral-400" : "placeholder-neutral-500"
            }`}
          />
        </div>

        {/* Label Chips & Add Label Input */}
        {(labels.length > 0 || showLabelInput) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {labels.map((lbl) => (
              <Chip
                key={lbl}
                label={`#${lbl}`}
                size="small"
                onDelete={() => removeLabel(lbl)}
                sx={{
                  backgroundColor: isLight ? "#ffffff" : "#1c1c1e",
                  color: isLight ? activeColor.text : "#ffffff",
                  borderColor: isLight ? `${activeColor.text}40` : "#2e2e32",
                  fontSize: "11px",
                  height: "22px",
                }}
                variant="outlined"
              />
            ))}
            {showLabelInput && (
              <input
                type="text"
                autoFocus
                placeholder="tag name + enter"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={handleAddLabel}
                className={`border rounded-full px-2.5 py-0.5 text-xs focus:outline-none transition-colors ${
                  isLight
                    ? "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500"
                    : "bg-black border-[#262626] text-white placeholder-neutral-500 focus:border-white"
                }`}
              />
            )}
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div
          className={`flex items-center justify-between pt-2 border-t ${
            isLight ? "border-black/10" : "border-white/5"
          }`}
        >
          <div className="flex items-center gap-1">
            <ColorPicker
              currentColor={color}
              onChangeColor={setColor}
              iconColor={isLight ? activeColor.text : undefined}
            />

            <Tooltip title="Add label">
              <IconButton
                size="small"
                onClick={() => setShowLabelInput(!showLabelInput)}
                className={
                  isLight
                    ? "hover:opacity-80 transition-opacity"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }
                style={isLight ? { color: activeColor.text } : undefined}
              >
                <LabelOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={isArchived ? "Unarchive" : "Archive"}>
              <IconButton
                size="small"
                onClick={() => setIsArchived(!isArchived)}
                className={
                  isLight
                    ? "hover:opacity-80 transition-opacity"
                    : isArchived
                    ? "text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }
                style={isLight ? { color: activeColor.text } : undefined}
              >
                <ArchiveOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAutoSaveAndClose}
              disabled={saving}
              size="small"
              sx={{
                color: isLight ? activeColor.text : "#ffffff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "13px",
                padding: "4px 16px",
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: isLight
                    ? "rgba(0, 0, 0, 0.05)"
                    : "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              {saving ? "Saving..." : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
