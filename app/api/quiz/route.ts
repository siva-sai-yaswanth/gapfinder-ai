import { NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/retrieval";

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

    const retrieved = retrieveChunks(material, "main concepts topics definitions processes equations key ideas", 8);
    if (retrieved.length === 0) {
      return NextResponse.json({ error: "No usable passages could be retrieved from the supplied material." }, { status: 400 });
    }

    const sourceContext = retrieved
      .map((chunk) => `[Source ${chunk.id} · character offset ${chunk.start}]\n${chunk.text}`)
      .join("\n\n");

    const prompt = [
      "Create five multiple-choice diagnostic questions using ONLY the retrieved source passages below.",
      "Retrieval has already happened before generation. Do not use outside knowledge or infer unsupported facts.",
      "Return ONLY a valid JSON array. Do not use Markdown fences or introductory text.",
      "Each object must have: topic (string), question (string), options (array of exactly 4 strings), answer (zero-based integer 0-3), explanation (string), source (exact source label such as S1).",
      "Every question must be answerable from one or more supplied source passages. Use the exact source ID in the source field.",
      "",
      "RETRIEVED SOURCE PASSAGES:",
      sourceContext,
    ].join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
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
    const validSources = new Set(retrieved.map((chunk) => chunk.id));
    const withSources = questions.map((question, index) => {
      const cited = question.source.match(/S\\d+/)?.[0];
      const source = cited && validSources.has(cited) ? cited : retrieved[index % retrieved.length].id;
      return { ...question, id: index + 1, source };
    });
    return NextResponse.json({ questions: withSources, sources: retrieved.map(({ id, start, text }) => ({ id, start, excerpt: text.slice(0, 180) })) });
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
