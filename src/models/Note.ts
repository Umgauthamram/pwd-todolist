import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface INote {
  userId: Types.ObjectId;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isPrivate: boolean;
  labels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INoteDocument extends INote, Document {}

const NoteSchema = new Schema<INoteDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#1E293B", // Slate 800 default card background
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
      index: true, // Crucial index for Private Space isolation
    },
    labels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal query performance
NoteSchema.index({ userId: 1, isPrivate: 1, isTrashed: 1, isArchived: 1 });
NoteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

const Note: Model<INoteDocument> =
  mongoose.models.Note || mongoose.model<INoteDocument>("Note", NoteSchema);

export default Note;
