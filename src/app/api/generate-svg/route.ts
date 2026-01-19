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
            "API key not configured. Please add GOOGLE_API_KEY to your .env.local file. Get free key at: https://aistudio.google.com/app/apikey",
        },
        { status: 500 },
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const systemPrompt = `You are an expert SVG diagram generator. Generate clean, valid SVG code based on user descriptions.

CRITICAL RULES:
1. Return ONLY the raw SVG code - no markdown, no code blocks, no explanations
2. Start directly with <svg and end with </svg>
3. Use viewBox for scalability (e.g., viewBox="0 0 800 600")
4. Include proper width and height attributes (width="800" height="600")
5. Use clean, semantic SVG elements
6. Add colors and styling inline
7. Make diagrams clear and professional
8. Ensure all text is readable (font-size at least 14)
9. Use appropriate shapes for the diagram type requested`;

      const result = await model.generateContent([
        systemPrompt,
        `\n\nGenerate an SVG diagram for: ${prompt}`,
      ]);

      const response = result.response;
      let svgContent = response.text().trim();

      // Clean up the response (remove markdown code blocks if present)
      svgContent = svgContent
        .replace(/```svg\n?/g, "")
        .replace(/```xml\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Validate that it's actual SVG
      if (!svgContent.includes("<svg")) {
        return NextResponse.json(
          { error: "Generated content is not valid SVG" },
          { status: 500 },
        );
      }

      return NextResponse.json({ svg: svgContent });
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
    console.error("Error generating SVG:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* 
ALTERNATIVE IMPLEMENTATION FOR ANTHROPIC CLAUDE:

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
