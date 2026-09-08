"use client";

import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
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
import { NOTE_COLORS } from "@/constants/colors";

export interface NoteItem {
  _id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isPrivate: boolean;
  labels: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface NoteCardProps {
  note: NoteItem;
  viewMode?: "grid" | "list";
  isTrashView?: boolean;
  onEdit: (note: NoteItem) => void;
  onTogglePin: (note: NoteItem) => void;
  onChangeColor: (note: NoteItem, newColor: string) => void;
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

  const activeColorObj = NOTE_COLORS.find(
    (c) => c.bg.toLowerCase() === (note.color || "#0e0e10").toLowerCase()
  );
  const borderColor = isHovered
    ? "#737373"
    : activeColorObj?.border || "#262626";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(note)}
      style={{
        backgroundColor: note.color || "#0e0e10",
        borderColor,
      }}
      className={`group relative rounded-2xl border transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between p-4 ${
        viewMode === "list" ? "w-full" : "w-full"
      }`}
    >
      {/* Top Row: Title & Pin Button */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          {note.title ? (
            <h3 className="font-semibold text-sm sm:text-base text-white break-words line-clamp-2 leading-snug">
              {note.title}
            </h3>
          ) : (
            <span />
          )}

          {!isTrashView && (
            <div
              className={`transition-opacity ${
                note.isPinned || isHovered ? "opacity-100" : "opacity-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title={note.isPinned ? "Unpin note" : "Pin note"}>
                <IconButton
                  size="small"
                  onClick={() => onTogglePin(note)}
                  className={note.isPinned ? "text-white" : "text-neutral-400 hover:text-white"}
                >
                  {note.isPinned ? (
                    <PushPinIcon fontSize="small" />
                  ) : (
                    <PushPinOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Content Preview */}
        {note.content && (
          <p className="text-xs sm:text-sm text-neutral-300 whitespace-pre-wrap break-words line-clamp-6 leading-relaxed">
            {note.content}
          </p>
        )}

        {/* Labels Display */}
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {note.labels.map((lbl) => (
              <span
                key={lbl}
                className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-neutral-300 border border-[#262626] font-medium"
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
        className={`mt-4 pt-2 border-t border-[#262626] flex items-center justify-between text-xs text-neutral-400 transition-opacity duration-150 ${
          isHovered ? "opacity-100" : "opacity-0 sm:opacity-0"
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
                currentColor={note.color}
                onChangeColor={(newCol) => onChangeColor(note, newCol)}
              />

              <Tooltip title={note.isArchived ? "Unarchive" : "Archive"}>
                <IconButton
                  size="small"
                  onClick={() => onToggleArchive(note)}
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800"
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
                  className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>

            {note.updatedAt && (
              <span className="text-[10px] text-neutral-500">
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
