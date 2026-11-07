# GapFinder AI

**Find what the student doesn't know.**

GapFinder AI is a student learning prototype that turns study notes into a short diagnostic quiz. After a student answers the questions, it shows their score, gives explanations and highlights topics that may need more revision.

The idea is simple: instead of revising every chapter in the same way, students should be able to identify the concepts they need to work on first.

## Live demo

- **Application:** https://gapfinder-ai-khaki.vercel.app
- **Source code:** https://github.com/siva-sai-yaswanth/gapfinder-ai

## What is implemented

- Paste study material into the workspace.
- Generate five multiple-choice questions using the Groq API.
- Keep questions grounded in the supplied material through the quiz-generation prompt.
- Submit answers and see the score and explanations.
- Group questions by topic and show a preliminary Strong / Medium / Weak result.
- Display a score-based revision suggestion for each topic.
- Ask the material assistant for a summary based on retrieved text passages.

## Technology

- Next.js 15 and React 19
- TypeScript
- Groq chat completions API
- Vercel for hosting
- GitHub for source control

## Run locally

1. Install Node.js (20 or later).
2. Clone this repository:

   ```bash
   git clone https://github.com/siva-sai-yaswanth/gapfinder-ai.git
   cd gapfinder-ai
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a file named `.env.local` in the project root and add your own Groq API key:

   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

   Keep this key private. Do not commit `.env.local` or share the key publicly.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000.

## Current limitations

This is an early working prototype, not a finished learning management system.

- The current upload flow supports text and Markdown files. PDF text extraction is not implemented yet.
- Topic-level results are based on the questions generated and the student's score. They are preliminary indicators, not a validated measure of mastery.
- The material assistant uses lightweight keyword-based passage selection. It is not yet a full embedding/vector-search RAG system.
- Student accounts, database-backed progress history and persistent profiles are not implemented.
- The revision plan is currently generated from quiz performance using simple rules.

## Next development steps

1. Add PDF text extraction and syllabus ingestion.
2. Improve topic detection and syllabus-to-question coverage.
3. Strengthen retrieval with chunking, embeddings and source-level citations.
4. Improve diagnostic coverage and knowledge-gap evaluation.
5. Add saved student progress and a more complete revision workflow.
6. Add tests and improve error handling.

## Environment variable

| Name | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Authenticates requests to the Groq API. |

Never put API keys in frontend code or commit them to GitHub.

## Project status

Working prototype deployed on Vercel. Features and limitations are documented above so the current implementation can be evaluated accurately.
