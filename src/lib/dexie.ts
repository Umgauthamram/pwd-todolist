import Dexie, { Table } from "dexie";
import { NoteItem } from "@/components/notes/NoteCard";

export interface OfflineNoteRecord {
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
  updatedAt: string;
  syncStatus: "synced" | "pending_create" | "pending_update" | "pending_delete";
}

export class BeginningDatabase extends Dexie {
  notes!: Table<OfflineNoteRecord, string>;

  constructor() {
    super("BeginningNotesDB");

    this.version(1).stores({
      notes: "_id, userId, isPrivate, isTrashed, isArchived, isPinned, updatedAt, syncStatus",
    });
  }
}

export const db = new BeginningDatabase();

/**
 * Cache an array of notes from the server into IndexedDB.
 */
export async function cacheNotesLocally(notes: NoteItem[]): Promise<void> {
  try {
    if (!notes || notes.length === 0) return;
    const records: OfflineNoteRecord[] = notes.map((n) => ({
      _id: n._id,
      userId: n.userId || "",
      title: n.title,
      content: n.content,
      color: n.color || "#212121",
      isPinned: Boolean(n.isPinned),
      isArchived: Boolean(n.isArchived),
      isTrashed: Boolean(n.isTrashed),
      isPrivate: Boolean(n.isPrivate),
      labels: n.labels || [],
      updatedAt:
        typeof n.updatedAt === "string"
          ? n.updatedAt
          : n.updatedAt
          ? (n.updatedAt as Date).toISOString()
          : new Date().toISOString(),
      syncStatus: "synced",
    }));

    await db.notes.bulkPut(records);
  } catch (error) {
    console.error("Dexie caching error:", error);
  }
}

/**
 * Get all cached notes for a user (filtered by public vs private).
 */
export async function getCachedNotes(userId: string, isPrivate: boolean): Promise<OfflineNoteRecord[]> {
  try {
    return await db.notes
      .where("userId")
      .equals(userId)
      .filter((n) => Boolean(n.isPrivate) === Boolean(isPrivate) && n.syncStatus !== "pending_delete")
      .reverse()
      .sortBy("updatedAt");
  } catch (error) {
    console.error("Dexie fetch error:", error);
    return [];
  }
}

/**
 * Count total cached notes.
 */
export async function getLocalNotesCount(): Promise<number> {
  try {
    return await db.notes.count();
  } catch {
    return 0;
  }
}

/**
 * Clear local offline database.
 */
export async function clearLocalNotes(): Promise<void> {
  try {
    await db.notes.clear();
  } catch (error) {
    console.error("Dexie clear error:", error);
  }
}
