# GapFinder AI — Architecture

## 1. Purpose

GapFinder AI is a retrieval-first learning prototype. It takes study material supplied by a learner, retrieves relevant text passages, uses a language model to generate or explain content from those passages, and turns quiz performance into preliminary topic-level revision suggestions.

The core design distinction is:

- **Retrieval** selects evidence from the learner's material.
- **Generation** uses the selected evidence to produce questions or an explanation.

The language model is not intended to replace the learner's source material with unrestricted general-knowledge answers.

## 2. High-level flow

```text
Student
  |
  v
Next.js workspace (app/page.tsx)
  |
  +--> Upload PDF / TXT / Markdown or paste text
  |       |
  |       +--> PDF: POST /api/extract --> pdf-parse --> extracted text
  |
  +--> Generate quiz: POST /api/quiz
  |       |
  |       +--> lib/retrieval.ts
  |       |      1. Clean and chunk material
  |       |      2. Rank chunks with lexical term overlap
  |       |      3. Return selected passages
  |       |
  |       +--> Groq Chat Completions
  |              1. Receives retrieved passages
  |              2. Generates MCQs in JSON format
  |              3. Returns topic, answer, explanation, source label
  |
  +--> Student answers quiz
  |       |
  |       +--> lib/assessment.ts
  |              1. Compare selected and correct answers
  |              2. Group results by generated topic
  |              3. Calculate topic percentages/status
  |              4. Build rule-based revision suggestions
  |
  +--> Ask material assistant: POST /api/ask
          |
          +--> Split material into passages
          +--> Lexically rank passages against the question
          +--> Send selected passages to Groq
          +--> Return answer and passage references
```

## 3. Main modules

### Frontend — `app/page.tsx`

Provides the student workspace, material input/upload, quiz generation, answer selection, results, topic indicators, revision suggestions, and material assistant interactions.

### PDF extraction — `app/api/extract/route.ts`

- Accepts a PDF through multipart form data.
- Checks file type and enforces a 12 MB size limit.
- Uses `pdf-parse` to extract selectable text.
- Returns extracted text, page count, and document title.
- Rejects files when too little text is extracted. This helps identify likely scanned PDFs, which currently require OCR outside this prototype.

### Quiz generation — `app/api/quiz/route.ts`

- Validates that sufficient study text is supplied.
- Checks for the server-side `GROQ_API_KEY`.
- Calls `retrieveChunks` before making the model request.
- Sends selected source passages to Groq and requests five multiple-choice questions in JSON.
- Validates the returned question structure and associates each question with a retrieved source chunk ID.

### Retrieval helper — `lib/retrieval.ts`

- Removes carriage returns and trims the input.
- Splits text into overlapping chunks (default size 1,100 characters; overlap 140 characters).
- Assigns chunk IDs such as `S1`.
- Tokenizes text into lowercase alphanumeric terms.
- Scores each chunk by the number of query terms present and returns the highest-ranked chunks. If no chunk matches, it falls back to the first chunks.

This is a simple lexical baseline. It is not embedding-based semantic retrieval and does not use a vector database.

### Material assistant — `app/api/ask/route.ts`

The assistant has a separate lightweight retrieval helper. It splits the material into 900-character passages, ranks them by overlap with terms from the user's question, and sends the top passages to Groq. The model is instructed to answer only from the supplied passages and cite their passage labels.

### Assessment — `lib/assessment.ts`

Groups generated questions by their topic labels, calculates the percentage correct for each topic, and assigns a preliminary status:

- **Strong:** 80% or higher
- **Medium:** 50% to 79%
- **Weak:** below 50%

Revision suggestions are rule-based and selected from the status. These results are directional feedback from a small quiz, not a validated assessment of mastery.

## 4. API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/extract` | Extract selectable text from an uploaded PDF. |
| POST | `/api/quiz` | Retrieve passages and generate diagnostic questions. |
| POST | `/api/ask` | Retrieve passages and answer a question about supplied material. |

All model requests are made from server routes. The Groq API key must remain in a server-side environment variable.

## 5. Data and privacy boundaries

The current prototype does not have user accounts or a database-backed student record. Material and quiz state are handled as part of the active application session; progress is not a persistent cross-session learning history.

Do not upload confidential, personally identifiable, or sensitive student information to a public demo. Anyone deploying their own instance should review the privacy and data-handling requirements for their intended users.

## 6. Known gaps and future architecture

Potential next steps include:

1. Parse syllabus structure into explicit topics and subtopics.
2. Store document metadata and page/section boundaries alongside chunks.
3. Add embeddings and vector search, then evaluate retrieval quality.
4. Validate every generated question against its cited passage.
5. Track repeated attempts and topic-level progress in a database.
6. Generate revision schedules using the learner's available study time.
7. Add authentication, authorization, rate limiting, tests, and monitoring.
