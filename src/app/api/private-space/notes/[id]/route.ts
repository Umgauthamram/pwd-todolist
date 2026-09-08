import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Note from "@/models/Note";
import { getAuthUserFromRequest, getPinSessionFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pinSession = await getPinSessionFromRequest(request);
    if (!pinSession || pinSession.userId !== authUser.userId || !pinSession.privateAccess) {
      return NextResponse.json({ error: "PIN verification required", locked: true }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const note = await Note.findOne({
      _id: id,
      userId: authUser.userId,
      isPrivate: true,
    }).lean();

    if (!note) {
      return NextResponse.json({ error: "Private note not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      note: {
        ...note,
        _id: note._id.toString(),
        userId: note.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Get private note error:", error);
    return NextResponse.json({ error: "Failed to fetch private note" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pinSession = await getPinSessionFromRequest(request);
    if (!pinSession || pinSession.userId !== authUser.userId || !pinSession.privateAccess) {
      return NextResponse.json({ error: "PIN verification required", locked: true }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const note = await Note.findOne({
      _id: id,
      userId: authUser.userId,
      isPrivate: true,
    });

    if (!note) {
      return NextResponse.json({ error: "Private note not found" }, { status: 404 });
    }

    if (body.title !== undefined) note.title = body.title.trim();
    if (body.content !== undefined) note.content = body.content.trim();
    if (body.color !== undefined) note.color = body.color;
    if (body.isPinned !== undefined) note.isPinned = Boolean(body.isPinned);
    if (body.isArchived !== undefined) note.isArchived = Boolean(body.isArchived);
    if (body.isTrashed !== undefined) note.isTrashed = Boolean(body.isTrashed);
    if (body.labels !== undefined && Array.isArray(body.labels)) {
      note.labels = body.labels;
    }

    await note.save();

    return NextResponse.json({
      success: true,
      note: {
        ...note.toObject(),
        _id: note._id.toString(),
        userId: note.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Update private note error:", error);
    return NextResponse.json({ error: "Failed to update private note" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pinSession = await getPinSessionFromRequest(request);
    if (!pinSession || pinSession.userId !== authUser.userId || !pinSession.privateAccess) {
      return NextResponse.json({ error: "PIN verification required", locked: true }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    await connectToDatabase();

    if (permanent) {
      const result = await Note.findOneAndDelete({
        _id: id,
        userId: authUser.userId,
        isPrivate: true,
      });

      if (!result) {
        return NextResponse.json({ error: "Private note not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Private note deleted permanently",
      });
    }

    // Soft delete to private trash
    const note = await Note.findOne({
      _id: id,
      userId: authUser.userId,
      isPrivate: true,
    });

    if (!note) {
      return NextResponse.json({ error: "Private note not found" }, { status: 404 });
    }

    note.isTrashed = true;
    note.isPinned = false;
    await note.save();

    return NextResponse.json({
      success: true,
      message: "Private note moved to trash",
      note: {
        ...note.toObject(),
        _id: note._id.toString(),
        userId: note.userId.toString(),
      },
    });
  } catch (error) {
    console.error("Delete private note error:", error);
    return NextResponse.json({ error: "Failed to delete private note" }, { status: 500 });
  }
}
