import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type AttemptPayload = {
  userId: string;
  questionId: number;
  selectedChoiceNo: number;
  elapsedSec?: number;
};

type QuestionRow = {
  id: number;
  topic_id: number;
  correct_choice_no: number;
};

type TopicStatRow = {
  total_answers: number;
  correct_answers: number;
};

type TopicPlanRow = {
  topic_id: number;
  wrong_rate: number;
  last_studied_at: string | null;
  topics: { exam_frequency: number } | { exam_frequency: number }[] | null;
};

function daysSince(dateText: string | null): number {
  if (!dateText) {
    return 30;
  }

  const ms = Date.now() - new Date(dateText).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function calcPriority(frequency: number, wrongRate: number, days: number): number {
  return frequency * 0.5 + wrongRate * 0.4 + Math.min(days, 30) * 0.1;
}

async function recalculateDailyPlans(userId: string) {
  if (!supabaseAdmin) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("topic_stats")
    .select("topic_id, wrong_rate, last_studied_at, topics(exam_frequency)")
    .eq("user_id", userId);

  if (error || !data) {
    return;
  }

  const planDate = new Date().toISOString().slice(0, 10);

  const plans = (data as TopicPlanRow[]).map((row) => {
    const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
    const frequency = Number(topic?.exam_frequency ?? 0);
    const wrongRate = Number(row.wrong_rate ?? 0);
    const days = daysSince(row.last_studied_at);

    return {
      user_id: userId,
      topic_id: row.topic_id,
      plan_date: planDate,
      priority_score: calcPriority(frequency, wrongRate, days),
      recommended_questions: wrongRate >= 50 ? 15 : wrongRate >= 35 ? 12 : 10,
    };
  });

  if (plans.length === 0) {
    return;
  }

  await supabaseAdmin.from("daily_plans").upsert(plans, {
    onConflict: "user_id,plan_date,topic_id",
  });
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error: "service_role_key_missing",
        detail: "Set SUPABASE_SERVICE_ROLE_KEY in .env.local to save attempts.",
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as Partial<AttemptPayload>;
  const userId = body.userId?.trim();
  const questionId = Number(body.questionId);
  const selectedChoiceNo = Number(body.selectedChoiceNo);
  const elapsedSec = body.elapsedSec ? Number(body.elapsedSec) : null;

  if (!userId || !questionId || !(selectedChoiceNo >= 1 && selectedChoiceNo <= 4)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: question, error: questionError } = await supabaseAdmin
    .from("questions")
    .select("id, topic_id, correct_choice_no")
    .eq("id", questionId)
    .maybeSingle();

  if (questionError || !question) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  const q = question as QuestionRow;
  const isCorrect = q.correct_choice_no === selectedChoiceNo;

  const { error: attemptError } = await supabaseAdmin.from("attempts").insert({
    user_id: userId,
    question_id: q.id,
    selected_choice_no: selectedChoiceNo,
    is_correct: isCorrect,
    elapsed_sec: elapsedSec,
  });

  if (attemptError) {
    return NextResponse.json(
      { error: "failed_to_insert_attempt", detail: attemptError.message },
      { status: 500 }
    );
  }

  const { data: currentStat } = await supabaseAdmin
    .from("topic_stats")
    .select("total_answers, correct_answers")
    .eq("user_id", userId)
    .eq("topic_id", q.topic_id)
    .maybeSingle();

  const prev = (currentStat ?? { total_answers: 0, correct_answers: 0 }) as TopicStatRow;
  const totalAnswers = Number(prev.total_answers ?? 0) + 1;
  const correctAnswers = Number(prev.correct_answers ?? 0) + (isCorrect ? 1 : 0);
  const accuracy = Number(((correctAnswers / Math.max(totalAnswers, 1)) * 100).toFixed(2));
  const wrongRate = Number((100 - accuracy).toFixed(2));

  const { error: upsertStatError } = await supabaseAdmin.from("topic_stats").upsert(
    {
      user_id: userId,
      topic_id: q.topic_id,
      total_answers: totalAnswers,
      correct_answers: correctAnswers,
      accuracy: accuracy,
      wrong_rate: wrongRate,
      last_studied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" }
  );

  if (upsertStatError) {
    return NextResponse.json(
      { error: "failed_to_update_topic_stats", detail: upsertStatError.message },
      { status: 500 }
    );
  }

  await recalculateDailyPlans(userId);

  return NextResponse.json({
    ok: true,
    isCorrect,
    correctChoiceNo: q.correct_choice_no,
    topicId: q.topic_id,
    stats: {
      totalAnswers,
      correctAnswers,
      accuracy,
      wrongRate,
    },
  });
}
