export type RetrievedChunk = {
  id: string;
  text: string;
  start: number;
  score: number;
};

/** Split source text into overlapping chunks before any model call. */
export function chunkMaterial(material: string, chunkSize = 1100, overlap = 140): RetrievedChunk[] {
  const clean = material.replace(/\r/g, "").trim();
  const chunks: RetrievedChunk[] = [];
  let start = 0;
  let index = 1;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const text = clean.slice(start, end).trim();
    if (text) chunks.push({ id: `S${index++}`, text, start, score: 0 });
    if (end === clean.length) break;
    start = end - overlap;
  }
  return chunks;
}

function termsOf(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
}

/** Lightweight lexical retrieval. The model only receives the returned source chunks. */
export function retrieveChunks(material: string, query: string, limit = 5): RetrievedChunk[] {
  const queryTerms = [...new Set(termsOf(query))];
  const chunks = chunkMaterial(material);
  const ranked = chunks.map((chunk) => {
    const sourceTerms = new Set(termsOf(chunk.text));
    const score = queryTerms.reduce((total, term) => total + (sourceTerms.has(term) ? 1 : 0), 0);
    return { ...chunk, score };
  });
  const relevant = ranked.filter((chunk) => chunk.score > 0).sort((a, b) => b.score - a.score || a.start - b.start);
  return (relevant.length ? relevant : ranked).slice(0, limit);
}
