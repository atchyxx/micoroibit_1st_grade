"use client";

import { useEffect, useMemo, useState } from "react";
import { TopicCard } from "@/components/TopicCard";
import { getPrioritizedTopics, summarizeKpi } from "@/lib/priority";
import { sampleTopics } from "@/lib/sampleData";
import type { TopicScore } from "@/lib/types";

type DailyPlanResponse = {
  source?: string;
  plans?: TopicScore[];
};

const USER_ID_KEY = "itp_user_id";

export default function HomePage() {
  const [topics, setTopics] = useState<TopicScore[]>(getPrioritizedTopics(sampleTopics).slice(0, 5));
  const [source, setSource] = useState<"sample" | "supabase">("sample");
  const [loading, setLoading] = useState(true);
  const [hasUserId, setHasUserId] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlans() {
      setLoading(true);
      const userId = localStorage.getItem(USER_ID_KEY)?.trim() ?? "";
      setHasUserId(Boolean(userId));

      const query = new URLSearchParams({ limit: "5" });
      if (userId) {
        query.set("userId", userId);
      }

      try {
        const res = await fetch(`/api/daily-plan?${query.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as DailyPlanResponse;
        const nextPlans = Array.isArray(data.plans) && data.plans.length > 0
          ? data.plans
          : getPrioritizedTopics(sampleTopics).slice(0, 5);

        setTopics(nextPlans);
        setSource(data.source === "supabase" ? "supabase" : "sample");
      } catch {
        setTopics(getPrioritizedTopics(sampleTopics).slice(0, 5));
        setSource("sample");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
    return () => controller.abort();
  }, []);

  const kpi = useMemo(() => summarizeKpi(topics), [topics]);

  return (
    <div className="section">
      <h1>今日の優先タスク</h1>
      <p className="muted">頻出度と苦手度から、最短で得点を伸ばす順番を提案します。</p>
      <p className="badge" style={{ width: "fit-content" }}>
        データソース: {source === "supabase" ? "Supabase" : "サンプル"}
      </p>
      {!hasUserId && (
        <p className="muted">本番データを使うには、設定画面で `userId` を保存してください。</p>
      )}

      <div className="kpi">
        <div className="card">
          <p className="num">{kpi.avgAccuracy}%</p>
          <p className="muted">平均正答率</p>
        </div>
        <div className="card">
          <p className="num">{kpi.highRiskTopics}</p>
          <p className="muted">重点分野</p>
        </div>
        <div className="card">
          <p className="num">{kpi.streakDays}</p>
          <p className="muted">連続学習日数</p>
        </div>
      </div>

      {loading && <p className="muted">学習順を読み込み中...</p>}

      <section className="topic-grid">
        {topics.map((topic, index) => (
          <TopicCard key={`${topic.code}-${index}`} topic={topic} rank={index + 1} />
        ))}
      </section>
    </div>
  );
}
