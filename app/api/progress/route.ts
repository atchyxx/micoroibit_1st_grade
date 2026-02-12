import { NextRequest, NextResponse } from "next/server";
import { sampleHistory, sampleTopics } from "@/lib/sampleData";
import { supabaseAdmin } from "@/lib/supabase";

type AttemptRow = {
  id: number;
  is_correct: boolean;
  answered_at: string;
  questions:
    | {
        body: string;
        topics: { name: string } | { name: string }[] | null;
      }
    | {
        body: string;
        topics: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

type TopicStatRow = {
  total_answers: number;
  correct_answers: number;
  accuracy: number;
  wrong_rate: number;
  topics: { code: string; name: string } | { code: string; name: string }[] | null;
};

type TrendPoint = {
  date: string;
  accuracy: number;
  answers: number;
};

function toDateKey(dateText: string): string {
  return new Date(dateText).toISOString().slice(0, 10);
}

function dateRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim();

  if (!supabaseAdmin || !userId) {
    return NextResponse.json({
      source: "sample",
      recentAttempts: [],
      trend: sampleHistory.map((x) => ({ date: x.date, accuracy: x.accuracy, answers: 10 })),
      topicRanking: sampleTopics
        .map((topic) => ({
          topicCode: topic.code,
          topicName: topic.name,
          accuracy: Number((100 - topic.wrongRate).toFixed(1)),
          wrongRate: topic.wrongRate,
          totalAnswers: 10,
          correctAnswers: Math.round((100 - topic.wrongRate) / 10),
        }))
        .sort((a, b) => b.accuracy - a.accuracy),
    });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabaseAdmin
    .from("attempts")
    .select("id, is_correct, answered_at, questions(body, topics(name))")
    .eq("user_id", userId)
    .gte("answered_at", since.toISOString())
    .order("answered_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "failed_to_fetch_progress", detail: error.message },
      { status: 500 }
    );
  }

  const rows = ((data ?? []) as unknown) as AttemptRow[];

  const recentAttempts = rows.slice(0, 10).map((row) => {
    const questionRaw = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    const topicRaw = questionRaw?.topics;
    const topic = Array.isArray(topicRaw) ? topicRaw[0] : topicRaw;

    return {
      id: row.id,
      answeredAt: row.answered_at,
      isCorrect: row.is_correct,
      question: questionRaw?.body ?? "",
      topicName: topic?.name ?? "未分類",
    };
  });

  const byDay = new Map<string, { answers: number; correct: number }>();
  rows.forEach((row) => {
    const key = toDateKey(row.answered_at);
    const bucket = byDay.get(key) ?? { answers: 0, correct: 0 };
    bucket.answers += 1;
    if (row.is_correct) {
      bucket.correct += 1;
    }
    byDay.set(key, bucket);
  });

  const trend: TrendPoint[] = dateRange(7).map((day) => {
    const bucket = byDay.get(day) ?? { answers: 0, correct: 0 };
    const accuracy = bucket.answers > 0 ? Number(((bucket.correct / bucket.answers) * 100).toFixed(1)) : 0;
    return { date: day, accuracy, answers: bucket.answers };
  });

  const { data: topicStatRows, error: topicStatError } = await supabaseAdmin
    .from("topic_stats")
    .select("total_answers, correct_answers, accuracy, wrong_rate, topics(code, name)")
    .eq("user_id", userId);

  if (topicStatError) {
    return NextResponse.json(
      { error: "failed_to_fetch_topic_ranking", detail: topicStatError.message },
      { status: 500 }
    );
  }

  const topicRanking = (((topicStatRows ?? []) as unknown) as TopicStatRow[])
    .map((row) => {
      const topicRaw = row.topics;
      const topic = Array.isArray(topicRaw) ? topicRaw[0] : topicRaw;
      return {
        topicCode: topic?.code ?? "UNKNOWN",
        topicName: topic?.name ?? "未分類",
        accuracy: Number(row.accuracy ?? 0),
        wrongRate: Number(row.wrong_rate ?? 0),
        totalAnswers: Number(row.total_answers ?? 0),
        correctAnswers: Number(row.correct_answers ?? 0),
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy || b.totalAnswers - a.totalAnswers);

  return NextResponse.json({
    source: "supabase",
    recentAttempts,
    trend,
    topicRanking,
  });
}
