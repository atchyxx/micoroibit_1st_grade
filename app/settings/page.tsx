"use client";

import { FormEvent, useEffect, useState } from "react";

const USER_ID_KEY = "itp_user_id";

export default function SettingsPage() {
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUserId(localStorage.getItem(USER_ID_KEY) ?? "");
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(USER_ID_KEY, userId.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="section">
      <h1>設定</h1>

      <form className="card" onSubmit={onSubmit}>
        <h2>SupabaseユーザーID</h2>
        <p className="muted" style={{ marginTop: "6px", marginBottom: "8px" }}>
          `auth.users.id` のUUIDを保存すると、ホームで実データの学習順を表示します。
        </p>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          style={{
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "10px 12px",
            fontSize: "14px",
          }}
        />
        <button className="btn" type="submit" style={{ marginTop: "10px" }}>
          保存する
        </button>
        {saved && (
          <p className="muted" style={{ marginTop: "8px" }}>
            保存しました。ホームを再表示すると反映されます。
          </p>
        )}
      </form>

      <div className="card">
        <h2>通知</h2>
        <p className="muted" style={{ marginTop: "6px" }}>朝7時に「今日の優先タスク」を表示</p>
      </div>
    </div>
  );
}
