import type { TopicInput, TopicScore } from "@/lib/types";

const WEIGHTS = {
  frequency: 0.5,
  wrongRate: 0.4,
  spacing: 0.1,
};

export function calcPriority(topic: TopicInput): number {
  return (
    topic.frequency * WEIGHTS.frequency +
    topic.wrongRate * WEIGHTS.wrongRate +
    Math.min(topic.daysSinceLastStudy, 30) * WEIGHTS.spacing
  );
}

export function getPrioritizedTopics(topics: TopicInput[]): TopicScore[] {
  return topics
    .map((topic) => ({ ...topic, priority: calcPriority(topic) }))
    .sort((a, b) => b.priority - a.priority);
}

export function summarizeKpi(topics: TopicInput[]) {
  const avgAccuracy = Math.round(
    100 - topics.reduce((sum, topic) => sum + topic.wrongRate, 0) / Math.max(topics.length, 1)
  );

  return {
    avgAccuracy,
    highRiskTopics: topics.filter((topic) => topic.wrongRate >= 40).length,
    streakDays: 6,
  };
}
