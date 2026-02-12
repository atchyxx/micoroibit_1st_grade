import { NextRequest, NextResponse } from "next/server";
import { sampleQuestion } from "@/lib/sampleData";
import { supabase } from "@/lib/supabase";

type DbQuestionRow = {
  id: number;
  body: string;
  explanation: string | null;
  correct_choice_no: number;
  topics: { code: string; name: string } | { code: string; name: string }[] | null;
  choices: { choice_no: number; body: string }[] | null;
};

function normalizeTopic(topic: DbQuestionRow["topics"]): { code: string; name: string } {
  const normalized = Array.isArray(topic) ? topic[0] : topic;
  return normalized ?? { code: "UNKNOWN", name: "未分類" };
}

export async function GET(request: NextRequest) {
  const topicCode = request.nextUrl.searchParams.get("topicCode");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 10);

  if (!supabase) {
    return NextResponse.json({
      source: "sample",
      questions: [sampleQuestion],
    });
  }

  let topicId: number | null = null;
  if (topicCode) {
    const { data: topicRow, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("code", topicCode)
      .maybeSingle();

    if (topicError) {
      return NextResponse.json(
        { error: "failed_to_fetch_topic", detail: topicError.message },
        { status: 500 }
      );
    }

    if (!topicRow) {
      return NextResponse.json({ source: "supabase", questions: [] });
    }

    topicId = topicRow.id as number;
  }

  let query = supabase
    .from("questions")
    .select("id, body, explanation, correct_choice_no, topics(code, name), choices(choice_no, body)")
    .limit(Math.max(limit * 5, 20))
    .order("id", { ascending: true });

  if (topicId !== null) {
    query = query.eq("topic_id", topicId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "failed_to_fetch_questions", detail: error.message },
      { status: 500 }
    );
  }

  const mapped = (data as DbQuestionRow[]).map((row) => ({
    id: row.id,
    body: row.body,
    explanation: row.explanation,
    topic: normalizeTopic(row.topics),
    choices: (row.choices ?? []).sort((a, b) => a.choice_no - b.choice_no),
    correctChoiceNo: row.correct_choice_no,
  }));

  // Deduplicate same question text in same topic (caused by repeated seed inserts).
  const deduped = mapped.filter((q, idx, arr) => {
    const key = `${q.topic.code}::${q.body}`;
    return arr.findIndex((x) => `${x.topic.code}::${x.body}` === key) === idx;
  });

  return NextResponse.json({ source: "supabase", questions: deduped.slice(0, limit) });
}
