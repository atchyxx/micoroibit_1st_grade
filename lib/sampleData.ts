import type { TopicInput } from "@/lib/types";

export const sampleTopics: TopicInput[] = [
  { code: "TEC-NET", name: "ネットワーク", frequency: 92, wrongRate: 41, daysSinceLastStudy: 7 },
  { code: "TEC-DB", name: "データベース", frequency: 88, wrongRate: 36, daysSinceLastStudy: 5 },
  { code: "MGT-PRO", name: "プロジェクト管理", frequency: 76, wrongRate: 44, daysSinceLastStudy: 11 },
  { code: "STR-LAW", name: "法務", frequency: 69, wrongRate: 53, daysSinceLastStudy: 9 },
  { code: "STR-BIZ", name: "経営戦略", frequency: 74, wrongRate: 28, daysSinceLastStudy: 14 },
];

export const sampleQuestion = {
  topic: "ネットワーク",
  body: "OSI基本参照モデルでルータが主に動作する層はどれか。",
  choices: [
    { no: 1, body: "物理層" },
    { no: 2, body: "データリンク層" },
    { no: 3, body: "ネットワーク層" },
    { no: 4, body: "アプリケーション層" },
  ],
  explanation: "ルータはIPアドレスを用いて経路制御するため、主にネットワーク層（第3層）で動作します。",
};

export const sampleHistory = [
  { date: "2026-02-10", accuracy: 68, minutes: 22 },
  { date: "2026-02-11", accuracy: 71, minutes: 25 },
  { date: "2026-02-12", accuracy: 74, minutes: 27 },
];
