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
    (c) => c.bg.toLowerCase() === (note.color || "").toLowerCase()
  );

  const hasCustomColor =
    Boolean(note.color) &&
    note.color !== "#0e0e10" &&
    note.color !== "#202124" &&
    note.color !== "#212121";

  const noteBg = hasCustomColor
    ? note.color
    : isHovered
    ? "#282828"
    : "#212121";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(note)}
      style={{
        backgroundColor: noteBg,
      }}
      className={`group relative rounded-2xl transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden ${
        viewMode === "list"
          ? "p-4 sm:p-5 w-full max-w-2xl mx-auto"
          : "p-3 sm:p-4 w-full h-fit"
      }`}
    >
      {/* Top Rainbow Accent Strip if custom rainbow color is active */}
      {activeColorObj?.accent && activeColorObj.id !== "default" && activeColorObj.id !== "black" && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-90"
          style={{ backgroundColor: activeColorObj.accent }}
        />
      )}

      {/* Top Row: Title & Pin Button */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          {note.title ? (
            <h3
              className={`font-semibold text-white break-words leading-snug ${
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
                  className={note.isPinned ? "text-white" : "text-neutral-400 hover:text-white"}
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
            className={`text-neutral-300 whitespace-pre-wrap break-words leading-relaxed ${
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
                className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#000000] text-neutral-300 font-medium"
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
        className={`mt-3 sm:mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 transition-opacity duration-150 ${
          isHovered ? "opacity-100" : "opacity-75 sm:opacity-0"
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
