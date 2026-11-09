# Contributing

Thanks for your interest in improving GapFinder AI.

This repository is currently an internship-assignment prototype. Contributions should keep the implementation understandable, documented, and honest about its current capabilities.

## Before making a change

1. Open an issue or discuss the proposed change with the maintainer.
2. Keep changes focused and explain the user problem they solve.
3. Do not add credentials, API keys, private student data, or local environment files.
4. Update the README or architecture documentation when behavior changes.

## Local development

Requirements: Node.js 20 or later and npm.

```bash
git clone https://github.com/siva-sai-yaswanth/gapfinder-ai.git
cd gapfinder-ai
npm install
cp .env.example .env.local
```

Add a valid `GROQ_API_KEY` to `.env.local`, then run:

```bash
npm run dev
```

Open http://localhost:3000.

## Pull request checklist

- [ ] The change has a clear purpose and is limited in scope.
- [ ] The app builds locally with `npm run build`.
- [ ] No secrets or private learner data are included.
- [ ] API inputs and model outputs are validated where relevant.
- [ ] User-facing errors are understandable.
- [ ] Documentation is updated if features or setup steps changed.
- [ ] Known limitations are not described as completed features.

## Reporting bugs

When opening an issue, include the steps to reproduce, expected behavior, actual behavior, and relevant error messages. Remove API keys, personal data, and other secrets from logs before sharing them.
