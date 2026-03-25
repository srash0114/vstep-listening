import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent";

// ==================== Prompts per Part ====================
const PART_PROMPTS: Record<string, string> = {
  "1": `You are parsing a VSTEP English listening exam document. Extract ALL Part 1 questions and answers.

Part 1 contains individual announcement/short message questions (no conversations or passages).
Each question has exactly 4 answer options labeled A, B, C, D. Exactly one option is correct.

Return ONLY valid JSON with no markdown code blocks, no explanation, no extra text — just raw JSON:
{
  "questions": [
    {
      "content": "The full question text",
      "script": "Transcript or audio script if present in document, empty string if not",
      "options": [
        { "label": "A", "content": "Option A text", "is_correct": false },
        { "label": "B", "content": "Option B text", "is_correct": true },
        { "label": "C", "content": "Option C text", "is_correct": false },
        { "label": "D", "content": "Option D text", "is_correct": false }
      ]
    }
  ]
}

Document content:
`,

  "2": `You are parsing a VSTEP English listening exam document. Extract ALL Part 2 content.

Part 2 contains conversations (passages). There are typically 3 conversations, each with 4 questions.
Each question has exactly 4 answer options labeled A, B, C, D. Exactly one option is correct.

Return ONLY valid JSON with no markdown code blocks, no explanation, no extra text — just raw JSON:
{
  "passages": [
    {
      "title": "Conversation 1",
      "script": "The full conversation transcript if present in document, empty string if not",
      "questions": [
        {
          "content": "The full question text",
          "options": [
            { "label": "A", "content": "Option A text", "is_correct": false },
            { "label": "B", "content": "Option B text", "is_correct": true },
            { "label": "C", "content": "Option C text", "is_correct": false },
            { "label": "D", "content": "Option D text", "is_correct": false }
          ]
        }
      ]
    }
  ]
}

Document content:
`,

  "3": `You are parsing a VSTEP English listening exam document. Extract ALL Part 3 content.

Part 3 contains lectures or talks (passages). There are typically 3 lectures, each with 5 questions.
Each question has exactly 4 answer options labeled A, B, C, D. Exactly one option is correct.

Return ONLY valid JSON with no markdown code blocks, no explanation, no extra text — just raw JSON:
{
  "passages": [
    {
      "title": "Lecture 1",
      "script": "The full lecture transcript if present in document, empty string if not",
      "questions": [
        {
          "content": "The full question text",
          "options": [
            { "label": "A", "content": "Option A text", "is_correct": false },
            { "label": "B", "content": "Option B text", "is_correct": true },
            { "label": "C", "content": "Option C text", "is_correct": false },
            { "label": "D", "content": "Option D text", "is_correct": false }
          ]
        }
      ]
    }
  ]
}

Document content:
`,
};

// ==================== Gemini API Call ====================
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ==================== Route Handler ====================
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const part = formData.get("part") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!part || !["1", "2", "3"].includes(part)) {
      return NextResponse.json(
        { error: "part must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    // ── Extract text from file ──────────────────────────────────────────────
    let text = "";

    if (
      file.name.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      // .txt / plain text
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file. Make sure it is not empty." },
        { status: 400 }
      );
    }

    // ── Build prompt and call Gemini ────────────────────────────────────────
    const prompt = PART_PROMPTS[part] + text;
    const raw = await callGemini(prompt);

    // Strip any accidental markdown fences Gemini might add
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data: parsed, part: parseInt(part) });
  } catch (error: any) {
    console.error("[ai-import] Error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            "Gemini returned invalid JSON. Try re-parsing or simplify the document.",
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
