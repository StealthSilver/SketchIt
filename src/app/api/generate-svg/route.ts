import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Using Google Gemini (FREE!)
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "API key not configured. Please add GOOGLE_API_KEY to your .env file. Get free key at: https://aistudio.google.com/app/apikey",
        },
        { status: 500 },
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const fullPrompt = `You are an expert diagram structure generator. Your job is to create a structured JSON diagram mapping using only basic shapes: square, rectangle, and circle.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations, no text before or after the JSON
2. Use ONLY these shape types: "square", "rectangle", "circle"
3. For squares: use "size" and "bottomLeft" coordinates
4. For rectangles: use "width", "height", and "bottomLeft" coordinates
5. For circles: use "radius" and "center" coordinates
6. Position shapes appropriately to form the requested diagram
7. Use a coordinate system where (0,0) is bottom-left, typical canvas size is 400x400
8. Make shapes proportional and well-positioned to clearly represent the diagram

Example format:
{
  "shapes": [
    {
      "id": "base",
      "type": "rectangle",
      "width": 200,
      "height": 150,
      "bottomLeft": { "x": 100, "y": 100 }
    },
    {
      "id": "element",
      "type": "square",
      "size": 40,
      "bottomLeft": { "x": 180, "y": 180 }
    },
    {
      "id": "detail",
      "type": "circle",
      "radius": 5,
      "center": { "x": 200, "y": 200 }
    }
  ]
}

Task: I want you to give me a diagram mapping for creating a ${prompt} diagram. You can only use square, rectangle and circle. I need the format like square - size - coordinates. So that after all the shapes are drawn they resemble the final diagram of a ${prompt}.

Remember: Return ONLY the JSON object, nothing else.`;

      const result = await model.generateContent(fullPrompt);

      const response = result.response;
      let responseText = response.text().trim();

      if (!responseText) {
        return NextResponse.json(
          { error: "No response from Gemini" },
          { status: 500 },
        );
      }

      // Clean up the response - remove markdown code blocks if present
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Parse and validate JSON
      let diagramData;
      try {
        diagramData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText);
        return NextResponse.json(
          { error: "Invalid JSON response from AI" },
          { status: 500 },
        );
      }

      if (!diagramData.shapes || !Array.isArray(diagramData.shapes)) {
        return NextResponse.json(
          { error: "Invalid diagram structure returned" },
          { status: 500 },
        );
      }

      return NextResponse.json({ diagram: diagramData });
    } catch (error: any) {
      console.error("Gemini API Error:", error);

      // Handle specific Gemini errors
      if (error.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          {
            error:
              "Invalid API key. Get a free key at: https://aistudio.google.com/app/apikey",
          },
          { status: 401 },
        );
      }

      if (error.message?.includes("RATE_LIMIT")) {
        return NextResponse.json(
          {
            error:
              "Rate limit exceeded. Please wait a moment. Free tier: 15 requests/minute.",
          },
          { status: 429 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error generating diagram:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
