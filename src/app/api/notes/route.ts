import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Note from "@/models/Note";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "notes"; // "notes" | "archive" | "trash"
    const search = searchParams.get("search")?.trim();
    const label = searchParams.get("label")?.trim();

    // Query builder strictly enforcing public workspace
    const query: Record<string, unknown> = {
      userId: authUser.userId,
      isPrivate: false, // Strict public workspace filter
    };

    if (filter === "trash") {
      query.isTrashed = true;
    } else if (filter === "archive") {
      query.isArchived = true;
      query.isTrashed = false;
    } else {
      // Default: Active notes
      query.isArchived = false;
      query.isTrashed = false;
    }

    if (label) {
      query.labels = label;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { labels: { $regex: searchRegex } },
      ];
    }

    const notes = await Note.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      notes: notes.map((n) => ({
        ...n,
        _id: n._id.toString(),
        userId: n.userId.toString(),
      })),
    });
  } catch (error) {
    console.error("Fetch notes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title = "",
      content = "",
      color = "#1E293B",
      isPinned = false,
      isArchived = false,
      isTrashed = false,
      labels = [],
    } = body;

    await connectToDatabase();

    const newNote = await Note.create({
      userId: authUser.userId,
      title: title.trim(),
      content: content.trim(),
      color,
      isPinned: Boolean(isPinned),
      isArchived: Boolean(isArchived),
      isTrashed: Boolean(isTrashed),
      isPrivate: false, // Public workspace note
      labels: Array.isArray(labels) ? labels : [],
    });

    return NextResponse.json(
      {
        success: true,
        note: {
          ...newNote.toObject(),
          _id: newNote._id.toString(),
          userId: newNote.userId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
