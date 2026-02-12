"use client";

import { useEffect, useMemo, useState } from "react";

const USER_ID_KEY = "itp_user_id";

type RecentAttempt = {
  id: number;
  answeredAt: string;
  isCorrect: boolean;
  question: string;
  topicName: string;
};

type TrendPoint = {
  date: string;
  accuracy: number;
  answers: number;
};

type TopicRanking = {
  topicCode: string;
  topicName: string;
  accuracy: number;
  wrongRate: number;
  totalAnswers: number;
  correctAnswers: number;
};

type ProgressResponse = {
  source?: "sample" | "supabase";
  recentAttempts?: RecentAttempt[];
  trend?: TrendPoint[];
  topicRanking?: TopicRanking[];
};

export default function ProgressPage() {
  const [source, setSource] = useState<"sample" | "supabase">("sample");
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topicRanking, setTopicRanking] = useState<TopicRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const userId = localStorage.getItem(USER_ID_KEY)?.trim() ?? "";
        const query = new URLSearchParams();
        if (userId) {
          query.set("userId", userId);
        }

        const res = await fetch(`/api/progress?${query.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as ProgressResponse;

        setSource(data.source === "supabase" ? "supabase" : "sample");
        setRecentAttempts(Array.isArray(data.recentAttempts) ? data.recentAttempts : []);
        setTrend(Array.isArray(data.trend) ? data.trend : []);
        setTopicRanking(Array.isArray(data.topicRanking) ? data.topicRanking : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const summary = useMemo(() => {
    const answers = trend.reduce((sum, x) => sum + x.answers, 0);
    const weighted = trend.reduce((sum, x) => sum + x.accuracy * x.answers, 0);
    const avgAccuracy = answers > 0 ? Math.round(weighted / answers) : 0;
    return { answers, avgAccuracy };
  }, [trend]);

  return (
    <div className="section">
      <h1>進捗</h1>
      <p className="badge" style={{ width: "fit-content" }}>
        データソース: {source === "supabase" ? "Supabase" : "サンプル"}
      </p>

      <div className="kpi">
        <div className="card">
          <p className="num">{summary.answers}</p>
          <p className="muted">7日回答数</p>
        </div>
        <div className="card">
          <p className="num">{summary.avgAccuracy}%</p>
          <p className="muted">7日平均正答率</p>
        </div>
        <div className="card">
          <p className="num">{recentAttempts.length}</p>
          <p className="muted">直近表示件数</p>
        </div>
      </div>

      {loading && <p className="muted">進捗を読み込み中...</p>}

      <div className="card">
        <h2>分野別正答率ランキング</h2>
        <div className="section" style={{ marginTop: "10px" }}>
          {topicRanking.length === 0 && <p className="muted">分野別データがありません。</p>}
          {topicRanking.map((topic, idx) => (
            <div key={topic.topicCode} style={{ display: "flex", justifyContent: "space-between", gap: "8px", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              <span>
                {idx + 1}. {topic.topicName}
              </span>
              <span className="muted">
                正答率 {topic.accuracy}% ({topic.correctAnswers}/{topic.totalAnswers})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>7日推移</h2>
        <div className="section" style={{ marginTop: "10px" }}>
          {trend.map((point) => (
            <div key={point.date} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>{point.date}</span>
              <span className="muted">正答率 {point.accuracy}% / {point.answers}問</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>最近の回答</h2>
        <div className="section" style={{ marginTop: "10px" }}>
          {recentAttempts.length === 0 && <p className="muted">まだ回答履歴がありません。</p>}
          {recentAttempts.map((x) => (
            <div key={x.id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
              <p>
                <strong>{x.isCorrect ? "正解" : "不正解"}</strong> / {x.topicName}
              </p>
              <p className="muted">{x.question}</p>
              <p className="muted">{new Date(x.answeredAt).toLocaleString("ja-JP")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
