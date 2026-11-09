# GapFinder AI

**Find what the student doesn't know.**

GapFinder AI is a learning-support prototype that uses a student's own study material to create a short diagnostic quiz, evaluate answers, highlight topics that may need revision, and suggest next study actions.

The goal is to help learners focus their revision instead of treating every topic as equally difficult.

## Live application

- **Live demo:** https://gapfinder-ai-khaki.vercel.app
- **GitHub repository:** https://github.com/siva-sai-yaswanth/gapfinder-ai

## Student workflow

1. **Add study material** — upload a text-based PDF, TXT or Markdown file, or paste notes into the workspace.
2. **Generate a diagnostic quiz** — the server splits the supplied text into chunks, retrieves passages, and asks the Groq model to create multiple-choice questions from those passages.
3. **Take the quiz** — select an answer for each question and submit the assessment.
4. **Review the diagnosis** — see the score, explanations, and preliminary Strong / Medium / Weak topic indicators.
5. **Plan revision** — use the topic-level suggestions to decide what to revisit.
6. **Ask about the material** — use the material assistant to ask a question or request a summary based on retrieved passages.

## Implemented features

- Text input and upload support for PDF, TXT and Markdown study material.
- Server-side PDF text extraction with a 12 MB upload limit.
- Clear message when a PDF appears to contain too little selectable text (for example, a scanned PDF).
- Overlapping text chunking for quiz-generation retrieval.
- Lightweight lexical retrieval before the quiz-generation model call.
- Groq-powered generation of multiple-choice diagnostic questions using retrieved passages as context.
- Source chunk labels attached to generated quiz questions.
- Interactive answer selection, scoring, and answer explanations.
- Topic grouping and preliminary Strong / Medium / Weak indicators.
- Rule-based revision suggestions based on topic scores.
- Material assistant that retrieves text passages and asks the model to answer using those passages.
- Responsive workspace and navigation.

## Technology

- **Framework:** Next.js 15
- **UI:** React 19
- **Language:** TypeScript
- **AI inference:** Groq Chat Completions API (model: `openai/gpt-oss-120b`)
- **PDF extraction:** `pdf-parse`
- **Hosting:** Vercel
- **Version control:** Git and GitHub

## Run locally

### Prerequisites

- Node.js 20 or later
- npm
- A Groq API key

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/siva-sai-yaswanth/gapfinder-ai.git
   cd gapfinder-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Open `.env.local` and replace the placeholder with your own Groq API key:

   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

   Keep this key private. Do not put it in client-side code or commit `.env.local`.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Visit [http://localhost:3000](http://localhost:3000).

To create a production build locally:

```bash
npm run build
npm run start
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Authenticates server-side requests to the Groq API. |

The key must be configured in the Vercel project environment settings for a hosted deployment. Redeploy after changing environment variables.

## How the retrieval-first AI flow works

GapFinder AI separates retrieval from generation:

1. **Input and extraction:** the student supplies text or a supported document. PDF text is extracted on the server.
2. **Chunking:** the quiz retrieval helper splits the material into overlapping text chunks and assigns source IDs such as `S1` and `S2`.
3. **Retrieval:** a lightweight lexical matcher ranks chunks against a query. The quiz route retrieves a limited set of passages before calling the language model. The material assistant uses its own lexical passage-selection helper based on the user's question.
4. **Generation:** the server sends the selected passages to Groq with instructions to answer or generate questions only from that context.
5. **Attribution:** quiz questions carry source chunk labels. The assistant is instructed to cite retrieved passage labels in its answer.
6. **Diagnosis:** the client groups quiz results by the topic labels returned with the questions and calculates a score-based status.
7. **Revision suggestions:** simple rules map each topic status to a suggested study action.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more detail.

## Important limitations

This is a working prototype and should not be represented as a complete learning management system.

- Retrieval is lexical/keyword-based, not embedding-based semantic search. There is no vector database.
- Quiz retrieval currently uses a general-purpose query rather than a syllabus-aware topic map.
- The model is instructed to stay within retrieved passages, but generated content and source labels should still be reviewed. Source labels refer to internal text chunks, not verified PDF page numbers or formal citations.
- PDF support extracts selectable text. OCR for scanned/image-only PDFs is not implemented.
- Topic diagnosis is based on a small generated quiz and model-provided topic labels. Strong / Medium / Weak are preliminary indicators, not validated measures of mastery.
- Revision suggestions use simple score-based rules; they do not yet adapt to a student's calendar or available study hours.
- Student login, database-backed profiles, and persistent progress history across sessions are not implemented.
- The current retake interaction resets the existing quiz; it does not guarantee a newly generated question set.
- Automated test coverage and a dedicated test script have not yet been added.

## Project structure

```text
app/
  api/
    ask/route.ts       # Material assistant endpoint
    extract/route.ts   # PDF text extraction endpoint
    quiz/route.ts      # Retrieval-first quiz generation endpoint
  page.tsx             # Main student workspace and assessment flow
  globals.css          # Application styles
  layout.tsx           # Root layout
lib/
  assessment.ts        # Topic scoring and revision suggestions
  retrieval.ts         # Text chunking and lexical retrieval
.env.example           # Environment variable template
```

## Roadmap

- Build a syllabus-aware topic map and map questions to syllabus sections.
- Improve retrieval with embeddings and evaluated semantic search.
- Provide more precise source citations, including document page/section metadata.
- Add OCR support for scanned PDFs.
- Improve diagnostic coverage, answer evaluation, and evidence behind topic-level gap reports.
- Make revision planning configurable by study time and deadlines.
- Add authentication and persistent student progress.
- Add automated tests and stronger validation/error handling.

## Contributing

This repository is currently maintained as an internship assignment prototype. If you want to suggest an improvement, open an issue describing the problem and proposed change before submitting a pull request. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Never commit API keys, passwords, private student data, or `.env.local`. Report security concerns privately to the repository maintainer rather than posting secrets in a public issue.

## Project status

**Prototype deployed on Vercel.** The repository documents the features currently implemented and distinguishes them from planned work.
