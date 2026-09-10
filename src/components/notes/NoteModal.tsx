"use client";

import React, { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  UnarchiveOutlined as UnarchiveOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  LabelOutlined as LabelOutlinedIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import ColorPicker from "./ColorPicker";
import { NoteItem } from "./NoteCard";
import { getNoteColor } from "@/constants/colors";

interface NoteModalProps {
  note: NoteItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedNote: Partial<NoteItem> & { _id: string }) => Promise<void>;
  onMoveToTrash: (note: NoteItem) => void;
}

export default function NoteModal({
  note,
  open,
  onClose,
  onUpdate,
  onMoveToTrash,
}: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#0e0e10");
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setColor(note.color || "#0e0e10");
      setIsPinned(Boolean(note.isPinned));
      setIsArchived(Boolean(note.isArchived));
      setLabels(note.labels || []);
      setShowLabelInput(false);
      setNewLabelInput("");
    }
  }, [note]);

  // Auto-grow textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content, open]);

  if (!note) return null;

  const handleSaveAndClose = async () => {
    if (
      title !== note.title ||
      content !== note.content ||
      color !== note.color ||
      isPinned !== note.isPinned ||
      isArchived !== note.isArchived ||
      JSON.stringify(labels) !== JSON.stringify(note.labels)
    ) {
      await onUpdate({
        _id: note._id,
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        isArchived,
        labels,
      });
    }
    onClose();
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

  const removeLabel = (lblToRemove: string) => {
    setLabels(labels.filter((l) => l !== lblToRemove));
  };

  const activeColor = getNoteColor(color);
  const isLight = Boolean(activeColor.isLight);

  return (
    <Dialog
      open={open}
      onClose={handleSaveAndClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: activeColor.bg,
            color: isLight ? activeColor.text : "#ffffff",
            borderRadius: "20px",
            border: activeColor.border || "none",
            backgroundImage: "none",
            transition: "background-color 0.2s ease",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          },
        },
      }}
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Title Input & Pin Toggle */}
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ color: isLight ? activeColor.text : "#ffffff" }}
            className={`w-full bg-transparent text-lg font-semibold focus:outline-none ${
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

        {/* Content Multiline Input */}
        <div>
          <textarea
            ref={contentRef}
            placeholder="Note"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ color: isLight ? activeColor.text : "#ffffff" }}
            className={`w-full bg-transparent text-sm focus:outline-none resize-none leading-relaxed min-h-[120px] ${
              isLight ? "placeholder-neutral-400" : "placeholder-neutral-500"
            }`}
          />
        </div>

        {/* Labels Display */}
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

        {/* Bottom Modal Actions */}
        <div
          className={`flex items-center justify-between pt-3 border-t ${
            isLight ? "border-black/10" : "border-[#262626]"
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
                {isArchived ? (
                  <UnarchiveOutlinedIcon fontSize="small" />
                ) : (
                  <ArchiveOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Move to trash">
              <IconButton
                size="small"
                onClick={() => {
                  onMoveToTrash(note);
                  onClose();
                }}
                className={
                  isLight
                    ? "hover:opacity-80 transition-opacity"
                    : "text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                }
                style={isLight ? { color: activeColor.text } : undefined}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>

          <Button
            onClick={handleSaveAndClose}
            sx={{
              color: isLight ? activeColor.text : "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13px",
              padding: "4px 18px",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: isLight
                  ? "rgba(0, 0, 0, 0.05)"
                  : "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
