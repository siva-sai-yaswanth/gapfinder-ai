import { NextResponse } from "next/server";

function splitIntoChunks(text: string, size = 900): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += size) {
    chunks.push(text.slice(start, start + size));
  }
  return chunks;
}

function retrievePassages(material: string, question: string) {
  const terms = question.toLowerCase().split(/\\W+/).filter((term) => term.length > 2);
  const chunks = splitIntoChunks(material);
  return chunks
    .map((content, index) => ({
      content,
      index,
      score: terms.reduce(
        (total, term) => total + (content.toLowerCase().includes(term) ? 1 : 0),
        0
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const material = body?.material;
    const question = typeof body?.question === "string" ? body.question : "";

    if (typeof material !== "string" || material.trim().length < 40) {
      return NextResponse.json({ error: "Add study material first." }, { status: 400 });
    }
    if (!question.trim()) {
      return NextResponse.json({ error: "Enter a question about your material." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Assistant is not configured. Add GROQ_API_KEY to the deployment environment." },
        { status: 503 }
      );
    }

    const passages = retrievePassages(material, question);
    const context = passages
      .map((passage) => `[Source passage ${passage.index + 1}] ${passage.content}`)
      .join("\\n\\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Answer only from the retrieved passages. If they do not contain the answer, say so. Cite passage labels such as [Source passage 2]. Do not invent facts.",
          },
          {
            role: "user",
            content: `Question: ${question}\\n\\nRetrieved passages:\\n${context}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "The AI provider could not answer.";
      return NextResponse.json({ error: `Groq API error (${response.status}): ${message}` }, { status: response.status });
    }

    return NextResponse.json({
      answer: data?.choices?.[0]?.message?.content || "No answer returned.",
      retrievedPassages: passages.map((passage) => passage.index + 1),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "The assistant took too long to respond. Please try again."
        : error instanceof Error
          ? error.message
          : "Assistant failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
