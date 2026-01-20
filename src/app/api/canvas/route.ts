import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Canvas from "@/models/Canvas";

// GET - Load canvas data
export async function GET(request: NextRequest) {
  try {
    // Set timeout for MongoDB connection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database timeout")), 5000),
    );

    await Promise.race([connectDB(), timeoutPromise]);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default-user";

    let canvas = await Canvas.findOne({ userId }).maxTimeMS(3000); // 3 second query timeout

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
    // Return empty canvas on error so the client can use localStorage
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        data: { userId: "default-user", lines: [] },
      },
      { status: 500 },
    );
  }
}

// POST - Save canvas data
export async function POST(request: NextRequest) {
  try {
    // Set timeout for MongoDB connection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database timeout")), 5000),
    );

    await Promise.race([connectDB(), timeoutPromise]);

    const body = await request.json();
    const { userId = "default-user", lines } = body;

    let canvas = await Canvas.findOne({ userId }).maxTimeMS(3000);

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
    // Return success: false but don't crash - localStorage will handle persistence
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Configure edge runtime for better performance on Vercel
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
