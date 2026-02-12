import type { TopicScore } from "@/lib/types";

export function TopicCard({ topic, rank }: { topic: TopicScore; rank: number }) {
  return (
    <article className="card topic-card">
      <div>
        <p className="badge">優先度 #{rank}</p>
        <h2 style={{ marginTop: "8px" }}>{topic.name}</h2>
        <div className="topic-meta">
          <span className="badge">頻出度 {topic.frequency}</span>
          <span className="badge">不正答率 {topic.wrongRate}%</span>
          <span className="badge">空き日数 {topic.daysSinceLastStudy}</span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p className="num">{topic.priority.toFixed(1)}</p>
        <p className="muted">score</p>
      </div>
    </article>
  );
}
