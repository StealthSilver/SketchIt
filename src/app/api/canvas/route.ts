import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Canvas from "@/models/Canvas";

// GET - Load canvas data
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default-user";

    let canvas = await Canvas.findOne({ userId });

    if (!canvas) {
      // Create a new canvas if none exists
      canvas = await Canvas.create({ userId, lines: [] });
    }

    return NextResponse.json({
      success: true,
      data: canvas,
    });
  } catch (error: any) {
    console.error("Error loading canvas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST - Save canvas data
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId = "default-user", lines } = body;

    let canvas = await Canvas.findOne({ userId });

    if (canvas) {
      canvas.lines = lines;
      await canvas.save();
    } else {
      canvas = await Canvas.create({ userId, lines });
    }

    return NextResponse.json({
      success: true,
      data: canvas,
    });
  } catch (error: any) {
    console.error("Error saving canvas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
