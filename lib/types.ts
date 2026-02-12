export type TopicScore = {
  code: string;
  name: string;
  frequency: number;
  wrongRate: number;
  daysSinceLastStudy: number;
  priority: number;
};

export type TopicInput = Omit<TopicScore, "priority">;
