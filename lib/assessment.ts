export type QuizQuestion = {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  source: string;
};

export type TopicResult = {
  topic: string;
  total: number;
  correct: number;
  percent: number;
  status: "Strong" | "Medium" | "Weak";
};

/** Summarise submitted answers by the topic assigned to each generated question. */
export function analyseTopics(
  questions: QuizQuestion[],
  answers: Record<number, number>
): TopicResult[] {
  const groups = new Map<string, { total: number; correct: number }>();

  for (const question of questions) {
    const topic = question.topic?.trim() || "General";
    const result = groups.get(topic) ?? { total: 0, correct: 0 };
    result.total += 1;
    if (answers[question.id] === question.answer) result.correct += 1;
    groups.set(topic, result);
  }

  return Array.from(groups.entries())
    .map(([topic, result]) => {
      const percent = Math.round((result.correct / result.total) * 100);
      const status: TopicResult["status"] =
        percent >= 80 ? "Strong" : percent >= 50 ? "Medium" : "Weak";
      return {
        topic,
        ...result,
        percent,
        status,
      };
    })
    .sort((a, b) => a.percent - b.percent);
}

export function buildRevisionPlan(topics: TopicResult[]) {
  return topics.map((topic) => ({
    ...topic,
    task:
      topic.status === "Weak"
        ? "Revisit the source notes, write a short explanation in your own words, then practise 5 new questions."
        : topic.status === "Medium"
          ? "Review the missed concept and complete 3–5 targeted practice questions."
          : "Do a quick active-recall review and revisit this topic in 3 days.",
  }));
}
