import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Using OpenAI GPT-4o-mini (affordable and fast)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
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

      return NextResponse.json({
        diagram: { shapes: validShapes },
        debug: {
          totalShapes: diagramData.shapes.length,
          validShapes: validShapes.length,
          filteredOut: diagramData.shapes.length - validShapes.length,
        },
      });
    } catch (error: any) {
      console.error("OpenAI API Error:", error);

      // Handle specific OpenAI errors
      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "Invalid API key. Get your key at: https://platform.openai.com/api-keys",
          },
          { status: 401 },
        );
      }

      if (error.status === 429) {
        const retryAfter = error.headers?.["retry-after"] || "60";
        return NextResponse.json(
          {
            error: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
            retryAfter: retryAfter,
          },
          { status: 429 },
        );
      }

      if (error.status === 402) {
        return NextResponse.json(
          {
            error:
              "Insufficient OpenAI credits. Please add credits to your account.",
          },
          { status: 402 },
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Error generating diagram:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "Unknown error",
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
