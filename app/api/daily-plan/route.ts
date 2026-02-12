import { NextRequest, NextResponse } from "next/server";
import { getPrioritizedTopics } from "@/lib/priority";
import { sampleTopics } from "@/lib/sampleData";
import { supabase } from "@/lib/supabase";
import type { TopicInput } from "@/lib/types";

type DbTopicRow = {
  code: string;
  name: string;
  exam_frequency: number;
};

type DbTopicStatRow = {
  topic_id: number;
  wrong_rate: number;
  last_studied_at: string | null;
  topics: DbTopicRow | DbTopicRow[] | null;
};

type DailyPlanOnlyRow = {
  topic_id: number;
  priority_score: number;
};

function daysSince(dateText: string | null): number {
  if (!dateText) {
    return 30;
  }

  const ms = Date.now() - new Date(dateText).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function normalizeTopic(row: DbTopicStatRow): TopicInput | null {
  const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
  if (!topic) {
    return null;
  }

  return {
    code: topic.code,
    name: topic.name,
    frequency: Number(topic.exam_frequency ?? 0),
    wrongRate: Number(row.wrong_rate ?? 0),
    daysSinceLastStudy: daysSince(row.last_studied_at),
  };
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 5);

  if (!supabase || !userId) {
    const fallback = getPrioritizedTopics(sampleTopics).slice(0, limit);
    return NextResponse.json({ source: "sample", plans: fallback });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: dailyRows } = await supabase
    .from("daily_plans")
    .select("topic_id, priority_score")
    .eq("user_id", userId)
    .eq("plan_date", today)
    .order("priority_score", { ascending: false })
    .limit(limit);

  const plannedTopicIds = ((dailyRows as DailyPlanOnlyRow[] | null) ?? []).map((row) => row.topic_id);

  if (plannedTopicIds.length > 0) {
    const { data: plannedStats, error: plannedError } = await supabase
      .from("topic_stats")
      .select("topic_id, wrong_rate, last_studied_at, topics(code, name, exam_frequency)")
      .eq("user_id", userId)
      .in("topic_id", plannedTopicIds);

    if (!plannedError && plannedStats) {
      const byId = new Map(
        (plannedStats as DbTopicStatRow[])
          .map((row) => [row.topic_id, normalizeTopic(row)] as const)
          .filter((entry): entry is readonly [number, TopicInput] => entry[1] !== null)
      );

      const ordered = plannedTopicIds
        .map((id) => byId.get(id) ?? null)
        .filter((row): row is TopicInput => row !== null);

      if (ordered.length > 0) {
        return NextResponse.json({ source: "supabase", plans: getPrioritizedTopics(ordered).slice(0, limit) });
      }
    }
  }

  const { data, error } = await supabase
    .from("topic_stats")
    .select("topic_id, wrong_rate, last_studied_at, topics(code, name, exam_frequency)")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "failed_to_fetch_topic_stats", detail: error.message },
      { status: 500 }
    );
  }

  const topicInputs = (data as DbTopicStatRow[])
    .map((row) => normalizeTopic(row))
    .filter((row): row is TopicInput => row !== null);

  const plans = getPrioritizedTopics(topicInputs).slice(0, limit);

  return NextResponse.json({ source: "supabase", plans });
}
