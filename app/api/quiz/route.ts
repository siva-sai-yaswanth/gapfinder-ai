import { NextResponse } from "next/server";

type GeneratedQuestion = {
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  source: string;
};

function parseQuiz(raw: string): GeneratedQuestion[] {
  // Models sometimes wrap JSON in Markdown fences or add a short introduction.
  let cleaned = raw.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/i, "");
  const firstArray = cleaned.indexOf("[");
  const lastArray = cleaned.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) {
    cleaned = cleaned.slice(firstArray, lastArray + 1);
  }

  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Groq returned an empty quiz. Please try again with more detailed study material.");
  }

  return parsed.map((item: any, index: number) => {
    if (
      !item ||
      typeof item.question !== "string" ||
      !Array.isArray(item.options) ||
      item.options.length !== 4 ||
      !item.options.every((option: unknown) => typeof option === "string") ||
      !Number.isInteger(item.answer) ||
      item.answer < 0 ||
      item.answer > 3
    ) {
      throw new Error(`Groq returned an invalid format for question ${index + 1}. Please try generating the quiz again.`);
    }

    return {
      topic: typeof item.topic === "string" ? item.topic : "General",
      question: item.question,
      options: item.options,
      answer: item.answer,
      explanation: typeof item.explanation === "string" ? item.explanation : "Review the source material to understand this answer.",
      source: typeof item.source === "string" ? item.source : "Your uploaded study material",
    };
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const material = body?.material;

    if (typeof material !== "string" || material.trim().length < 80) {
      return NextResponse.json(
        { error: "Please add at least 80 characters of study material." },
        { status: 400 }
      );
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing from this Vercel deployment. Add it in Settings → Environment Variables, then redeploy." },
        { status: 503 }
      );
    }

    const prompt = [
      "Create five multiple-choice diagnostic questions strictly from the supplied study material.",
      "Return ONLY a valid JSON array. Do not use Markdown fences or introductory text.",
      "Each object must have: topic (string), question (string), options (array of exactly 4 strings), answer (zero-based integer 0-3), explanation (string), source (short heading or excerpt).",
      "Do not use facts unsupported by the material.",
      "",
      "STUDY MATERIAL:",
      material.slice(0, 30000),
    ].join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(45000),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Groq returned an unreadable response (HTTP ${response.status}). Please try again.`);
    }

    if (!response.ok) {
      const providerMessage = data?.error?.message || data?.message || "Unknown provider error";
      const safeMessage = String(providerMessage).slice(0, 350);
      throw new Error(`Groq API error (HTTP ${response.status}): ${safeMessage}`);
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) {
      throw new Error("Groq responded, but did not return quiz content. Please try again.");
    }

    const questions = parseQuiz(raw);
    return NextResponse.json({ questions: questions.map((question, index) => ({ ...question, id: index + 1 })) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "Groq took too long to respond. Please try again."
          : error.message
        : "Quiz generation failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
