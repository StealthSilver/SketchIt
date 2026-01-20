import { NextResponse } from "next/server";
import OpenAI from "openai";

// Rate limiting tracker (in-memory, resets on server restart)
const requestTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

function checkRateLimit(identifier: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const tracker = requestTracker.get(identifier);

  if (!tracker || now > tracker.resetTime) {
    requestTracker.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (tracker.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((tracker.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  tracker.count++;
  return { allowed: true };
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

    // Check server-side rate limiting
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        {
          error: `Server rate limit exceeded. Please wait ${rateLimitCheck.retryAfter} seconds.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 },
      );
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    if (prompt.length > 200) {
      return NextResponse.json(
        { error: "Prompt too long. Please keep it under 200 characters." },
        { status: 400 },
      );
    }

    // Using OpenAI GPT-4o-mini (affordable and fast)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured");
      return NextResponse.json(
        {
          error:
            "API key not configured. Please add OPENAI_API_KEY to your .env file. Get your key at: https://platform.openai.com/api-keys",
        },
        { status: 500 },
      );
    }

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const systemPrompt = `You are an expert diagram structure generator. Your job is to create a structured JSON diagram mapping using only basic shapes: square, rectangle, and circle.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Use ONLY these shape types: "square", "rectangle", "circle"
3. For squares: use "size" and "bottomLeft" coordinates
4. For rectangles: use "width", "height", and "bottomLeft" coordinates
5. For circles: use "radius" and "center" coordinates
6. Position shapes appropriately to form the requested diagram
7. Use a coordinate system where (0,0) is bottom-left, typical canvas size is 400x400
8. Make shapes proportional and well-positioned to clearly represent the diagram

Return format:
{
  "shapes": [
    {
      "id": "unique_id",
      "type": "rectangle" | "square" | "circle",
      "width": number (for rectangle),
      "height": number (for rectangle),
      "size": number (for square),
      "radius": number (for circle),
      "bottomLeft": { "x": number, "y": number } (for square/rectangle),
      "center": { "x": number, "y": number } (for circle)
    }
  ]
}`;

      const userPrompt = `Create a diagram mapping for: ${prompt}

Use only square, rectangle, and circle shapes. Position them to clearly represent a ${prompt}.
Return ONLY the JSON object with the shapes array.`;

      console.log("Sending request to OpenAI...");
      console.log(`Client IP: ${clientIp}, Prompt length: ${prompt.length}`);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }, // Force JSON response
      });

      const apiTime = Date.now() - startTime;
      console.log(`OpenAI API response time: ${apiTime}ms`);

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        console.error("No response from OpenAI");
        return NextResponse.json(
          { error: "No response from OpenAI" },
          { status: 500 },
        );
      }

      console.log("OpenAI Response:", responseText);

      // Parse and validate JSON
      let diagramData;
      try {
        diagramData = JSON.parse(responseText);
        console.log("Parsed diagram data:", diagramData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText);
        return NextResponse.json(
          {
            error: "Invalid JSON response from AI",
            details: responseText.substring(0, 200),
          },
          { status: 500 },
        );
      }

      // Validate the structure
      if (!diagramData.shapes || !Array.isArray(diagramData.shapes)) {
        console.error("Invalid structure:", diagramData);
        return NextResponse.json(
          {
            error: "Invalid diagram structure - missing shapes array",
            received: diagramData,
          },
          { status: 500 },
        );
      }

      // Validate each shape
      const validShapes = diagramData.shapes.filter((shape: any) => {
        const hasValidType = ["square", "rectangle", "circle"].includes(
          shape.type,
        );
        const hasValidCoords =
          (shape.type === "circle" && shape.radius && shape.center) ||
          ((shape.type === "square" || shape.type === "rectangle") &&
            shape.bottomLeft);

        if (!hasValidType || !hasValidCoords) {
          console.warn("Invalid shape filtered out:", shape);
          return false;
        }
        return true;
      });

      if (validShapes.length === 0) {
        console.error("No valid shapes in response");
        return NextResponse.json(
          { error: "No valid shapes generated" },
          { status: 500 },
        );
      }

      console.log(`Successfully generated ${validShapes.length} valid shapes`);

      const totalTime = Date.now() - startTime;
      console.log(`Total request time: ${totalTime}ms`);

      return NextResponse.json({
        diagram: { shapes: validShapes },
        debug: {
          totalShapes: diagramData.shapes.length,
          validShapes: validShapes.length,
          filteredOut: diagramData.shapes.length - validShapes.length,
        },
        performance: {
          totalTime,
          apiTime: apiTime,
        },
      });
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      console.error("Error details:", {
        status: error.status,
        message: error.message,
        type: error.type,
      });

      // Handle specific OpenAI errors
      if (error.status === 401 || error.code === "invalid_api_key") {
        return NextResponse.json(
          {
            error:
              "Invalid API key. Get your key at: https://platform.openai.com/api-keys",
          },
          { status: 401 },
        );
      }

      if (error.status === 429 || error.code === "rate_limit_exceeded") {
        const retryAfter = error.headers?.["retry-after"] || "60";
        console.warn(`OpenAI rate limit hit. Retry after: ${retryAfter}s`);
        return NextResponse.json(
          {
            error: `OpenAI rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
            retryAfter: retryAfter,
          },
          { status: 429 },
        );
      }

      if (error.status === 402 || error.code === "insufficient_quota") {
        return NextResponse.json(
          {
            error:
              "Insufficient OpenAI credits. Please add credits to your account.",
          },
          { status: 402 },
        );
      }

      if (error.status === 503 || error.code === "service_unavailable") {
        return NextResponse.json(
          {
            error:
              "OpenAI service is temporarily unavailable. Please try again in a moment.",
          },
          { status: 503 },
        );
      }

      // Generic API errors
      if (error.status >= 500) {
        return NextResponse.json(
          {
            error: "OpenAI service error. Please try again later.",
          },
          { status: error.status },
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Error generating diagram:", error);

    // Log full error for debugging
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/*
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an expert SVG diagram generator. Generate clean, valid SVG code for: ${prompt}
          
Rules:
1. Return ONLY the SVG code, no markdown, no explanations
2. Use viewBox for scalability
3. Make diagrams clear and professional`,
        },
      ],
    });

    const svgContent = message.content[0].text.trim();
    return NextResponse.json({ svg: svgContent });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate SVG" },
      { status: 500 },
    );
  }
}
*/
