"use client";

import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  ArchiveOutlined as ArchiveOutlinedIcon,
  UnarchiveOutlined as UnarchiveOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  RestoreFromTrash as RestoreFromTrashIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";
import ColorPicker from "./ColorPicker";
import { getNoteColor } from "@/constants/colors";

export interface NoteItem {
  id?: string;
  _id: string;
  userId?: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isPrivate?: boolean;
  color?: string;
  labels: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface NoteCardProps {
  note: NoteItem;
  viewMode?: "grid" | "list";
  isTrashView?: boolean;
  onEdit: (note: NoteItem) => void;
  onTogglePin: (note: NoteItem) => void;
  onChangeColor: (note: NoteItem, color: string) => void;
  onToggleArchive: (note: NoteItem) => void;
  onMoveToTrash: (note: NoteItem) => void;
  onRestoreFromTrash: (note: NoteItem) => void;
  onDeletePermanently: (note: NoteItem) => void;
}

export default function NoteCard({
  note,
  viewMode = "grid",
  isTrashView = false,
  onEdit,
  onTogglePin,
  onChangeColor,
  onToggleArchive,
  onMoveToTrash,
  onRestoreFromTrash,
  onDeletePermanently,
}: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const activeColor = getNoteColor(note.color);
  const isLight = Boolean(activeColor.isLight);

  const noteBg = isLight
    ? activeColor.bg
    : isHovered
    ? activeColor.id === "black"
      ? "#141414"
      : "#282828"
    : activeColor.bg;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(note)}
      style={{
        backgroundColor: noteBg,
        border: activeColor.border || "none",
      }}
      className={`group relative rounded-2xl transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between ${
        isPickerOpen ? "z-40" : isHovered ? "z-20" : "z-0"
      } ${
        viewMode === "list"
          ? "p-4 sm:p-5 w-full max-w-2xl mx-auto"
          : "p-3 sm:p-4 w-full h-fit"
      }`}
    >
      {/* Top Rainbow Accent Strip if custom color */}
      {activeColor.accent && activeColor.id !== "default" && activeColor.id !== "black" && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-90"
          style={{ backgroundColor: activeColor.accent }}
        />
      )}

      {/* Top Row: Title & Pin Button */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          {note.title ? (
            <h3
              style={{
                color: isLight ? activeColor.text : "#ffffff",
              }}
              className={`font-semibold break-words leading-snug ${
                viewMode === "list"
                  ? "text-sm sm:text-base line-clamp-2"
                  : "text-xs sm:text-sm md:text-base line-clamp-2"
              }`}
            >
              {note.title}
            </h3>
          ) : (
            <span />
          )}

          {!isTrashView && (
            <div
              className={`transition-opacity ${
                note.isPinned || isHovered ? "opacity-100" : "opacity-50 sm:opacity-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title={note.isPinned ? "Unpin note" : "Pin note"}>
                <IconButton
                  size="small"
                  onClick={() => onTogglePin(note)}
                  className={
                    isLight
                      ? "hover:opacity-80 transition-opacity"
                      : note.isPinned
                      ? "text-white"
                      : "text-neutral-400 hover:text-white"
                  }
                  style={isLight ? { color: activeColor.text } : undefined}
                  sx={{ padding: "4px" }}
                >
                  {note.isPinned ? (
                    <PushPinIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <PushPinOutlinedIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Content Preview */}
        {note.content && (
          <p
            style={{
              color: isLight ? activeColor.text : "#d4d4d4",
              opacity: isLight ? 0.9 : 1,
            }}
            className={`whitespace-pre-wrap break-words leading-relaxed ${
              viewMode === "list"
                ? "text-xs sm:text-sm line-clamp-10"
                : "text-[11px] sm:text-xs md:text-sm line-clamp-5 sm:line-clamp-6"
            }`}
          >
            {note.content}
          </p>
        )}

        {/* Labels Display */}
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5">
            {note.labels.map((lbl) => (
              <span
                key={lbl}
                style={{
                  backgroundColor: isLight ? "#ffffff" : "#000000",
                  color: isLight ? activeColor.text : "#d4d4d4",
                  border: isLight ? `1px solid ${activeColor.text}40` : "none",
                }}
                className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium shadow-xs"
              >
                #{lbl}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row: Actions Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`mt-3 sm:mt-4 pt-2 border-t ${
          isLight ? "border-black/10" : "border-white/5"
        } flex items-center justify-between text-xs transition-opacity duration-150 ${
          isHovered || isPickerOpen ? "opacity-100" : "opacity-75 sm:opacity-0"
        }`}
      >
        {isTrashView ? (
          <div className="flex items-center gap-1 w-full justify-end">
            <Tooltip title="Restore note">
              <IconButton
                size="small"
                onClick={() => onRestoreFromTrash(note)}
                className="text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10"
              >
                <RestoreFromTrashIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete forever">
              <IconButton
                size="small"
                onClick={() => onDeletePermanently(note)}
                className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-1 w-full justify-between">
            <div className="flex items-center gap-0.5">
              <ColorPicker
                currentColor={note.color || ""}
                onChangeColor={(newCol) => onChangeColor(note, newCol)}
                onOpenChange={setIsPickerOpen}
                iconColor={isLight ? activeColor.text : undefined}
              />

              <Tooltip title={note.isArchived ? "Unarchive" : "Archive"}>
                <IconButton
                  size="small"
                  onClick={() => onToggleArchive(note)}
                  className={
                    isLight
                      ? "hover:opacity-80 transition-opacity"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }
                  style={isLight ? { color: activeColor.text } : undefined}
                >
                  {note.isArchived ? (
                    <UnarchiveOutlinedIcon fontSize="small" />
                  ) : (
                    <ArchiveOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete note">
                <IconButton
                  size="small"
                  onClick={() => onMoveToTrash(note)}
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

            {note.updatedAt && (
              <span
                style={{
                  color: isLight ? activeColor.text : "#737373",
                  opacity: isLight ? 0.75 : 1,
                }}
                className="text-[10px]"
              >
                {new Date(note.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
