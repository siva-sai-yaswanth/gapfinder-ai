import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF file first." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF is too large. Please use a file under 12 MB." }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const text = String(parsed.text || "").trim();
    if (text.length < 80) {
      return NextResponse.json({ error: "We couldn't extract enough selectable text. This may be a scanned PDF; please use a text-based PDF or paste its text." }, { status: 422 });
    }
    return NextResponse.json({ text, pages: parsed.numpages, title: parsed.info?.Title || file.name });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "PDF extraction failed." }, { status: 500 });
  }
}
