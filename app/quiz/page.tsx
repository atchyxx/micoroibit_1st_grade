"use client";

import { useEffect, useMemo, useState } from "react";

const USER_ID_KEY = "itp_user_id";

type QuizQuestion = {
  id: number;
  body: string;
  explanation: string | null;
  topic: { code: string; name: string };
  choices: { choice_no: number; body: string }[];
  correctChoiceNo: number;
};

type QuestionsResponse = {
  source?: string;
  questions?: QuizQuestion[];
};

type DailyPlanResponse = {
  source?: string;
  plans?: { code: string; name: string }[];
};

type SubmitResult = {
  ok: boolean;
  isCorrect: boolean;
  correctChoiceNo: number;
  stats: { totalAnswers: number; correctAnswers: number; accuracy: number; wrongRate: number };
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [recommendedTopic, setRecommendedTopic] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setMessage("");
      setIndex(0);
      setSelected(null);
      setResult(null);

      try {
        const userId = localStorage.getItem(USER_ID_KEY)?.trim() ?? "";
        let topicCode: string | null = null;
        let topicName: string | null = null;

        if (userId) {
          const planRes = await fetch(`/api/daily-plan?userId=${encodeURIComponent(userId)}&limit=1`, {
            cache: "no-store",
          });

          if (planRes.ok) {
            const planData = (await planRes.json()) as DailyPlanResponse;
            const top = Array.isArray(planData.plans) ? planData.plans[0] : null;
            if (top?.code) {
              topicCode = top.code;
              topicName = top.name;
            }
          }
        }

        const allRes = await fetch("/api/questions?limit=50", { cache: "no-store" });
        const allData = (await allRes.json()) as QuestionsResponse;
        const allQuestions = Array.isArray(allData.questions) ? allData.questions : [];

        if (topicCode) {
          const preferred = allQuestions.filter((q) => q.topic.code === topicCode);
          const others = allQuestions.filter((q) => q.topic.code !== topicCode);
          const mixed = [...shuffle(preferred), ...shuffle(others)];
          const unique = mixed.filter((q, i, arr) => arr.findIndex((x) => x.id === q.id) === i);
          setQuestions(unique);
          setRecommendedTopic(topicName ? { code: topicCode, name: topicName } : null);
        } else {
          setQuestions(shuffle(allQuestions));
          setRecommendedTopic(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  const current = useMemo(() => questions[index] ?? null, [questions, index]);

  async function submitAnswer() {
    if (!current || selected === null || submitting) {
      return;
    }

    const userId = localStorage.getItem(USER_ID_KEY)?.trim();
    if (!userId) {
      setMessage("先に設定画面で userId を保存してください。");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          questionId: current.id,
          selectedChoiceNo: selected,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.detail ?? data?.error ?? "回答保存に失敗しました。");
        return;
      }

      setResult(data as SubmitResult);
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    setResult(null);
    setSelected(null);
    setMessage("");
    setIndex((prev) => {
      if (questions.length === 0) {
        return 0;
      }
      return (prev + 1) % questions.length;
    });
  }

  return (
    <div className="section">
      <h1>問題演習</h1>
      {recommendedTopic && (
        <p className="badge" style={{ width: "fit-content" }}>
          今日の推奨分野: {recommendedTopic.name}
        </p>
      )}

      {loading && <p className="muted">問題を読み込み中...</p>}

      {!loading && !current && (
        <div className="card">
          <p className="muted">問題がありません。`seed.sql` を実行してください。</p>
        </div>
      )}

      {current && (
        <>
          <div className="card">
            <p className="badge">{current.topic.name}</p>
            <h2 style={{ marginTop: "10px" }}>{current.body}</h2>
            <div className="section" style={{ marginTop: "10px" }}>
              {current.choices.map((choice) => (
                <button
                  key={choice.choice_no}
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setSelected(choice.choice_no)}
                  style={{
                    border: selected === choice.choice_no ? "2px solid #003049" : "1px solid #d1d5db",
                  }}
                >
                  {choice.choice_no}. {choice.body}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                className="btn"
                type="button"
                onClick={submitAnswer}
                disabled={selected === null || submitting || Boolean(result)}
              >
                {submitting ? "送信中..." : "回答する"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={goNext}>
                次の問題
              </button>
            </div>
            {message && (
              <p className="muted" style={{ marginTop: "8px", color: "#d62828" }}>
                {message}
              </p>
            )}
          </div>

          {result && (
            <div className="card">
              <h3>{result.isCorrect ? "正解" : "不正解"}</h3>
              <p className="muted" style={{ marginTop: "8px" }}>
                正答は {result.correctChoiceNo} です。
              </p>
              <p className="muted" style={{ marginTop: "8px" }}>
                この分野の正答率: {result.stats.accuracy}%（{result.stats.correctAnswers}/{result.stats.totalAnswers}）
              </p>
              {current.explanation && (
                <p className="muted" style={{ marginTop: "8px" }}>
                  {current.explanation}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
