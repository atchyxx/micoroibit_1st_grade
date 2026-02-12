import { getPrioritizedTopics } from "@/lib/priority";
import { sampleTopics } from "@/lib/sampleData";

export default function AnalyticsPage() {
  const rows = getPrioritizedTopics(sampleTopics);

  return (
    <div className="section">
      <h1>出題傾向分析</h1>
      <p className="muted">優先度スコア順で分野を並べています。</p>

      <div className="section">
        {rows.map((topic) => (
          <article className="card" key={topic.code}>
            <h2>{topic.name}</h2>
            <p className="muted" style={{ marginTop: "6px" }}>
              優先度 {topic.priority.toFixed(1)} / 頻出度 {topic.frequency} / 不正答率 {topic.wrongRate}%
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
