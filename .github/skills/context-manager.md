# コンテキスト管理スキル

> セッション内の情報を保持し、スキル間のデータ受け渡しを管理します。

## 概要

このスキルは、SHIDENのセッション全体を通じてコンテキスト（文脈情報）を管理します。会話履歴、前回のスキル実行結果、ユーザー設定などを保持し、スキル間の連携を円滑にします。

## 主な機能

### 1. セッションコンテキストの保持

会話セッション中に以下の情報を保持します：

- **会話履歴**: ユーザーとの対話履歴
- **スキル実行結果**: 各スキルが生成したコンテンツ
- **メタプロンプト**: 収集したコンテキスト情報
- **教育理論検索結果**: 参照した教育理論
- **ユーザー設定**: デフォルトの学年・教科など

### 2. コンテキスト操作

#### remember（記憶）

情報をセッションコンテキストに保存します。

```
remember(key, value, metadata?)
```

**使用例**:
```
remember("last_lesson_plan", {
  subject: "数学",
  grade: "中学2年",
  topic: "一次関数",
  content: "...",
  theories: ["blooms_taxonomy", "gagnes_nine_events"]
}, {
  timestamp: "2026-01-21T10:30:00",
  skill: "lesson-plan"
})
```

#### recall（想起）

保存された情報を取得します。

```
recall(key)
recall(query, type?)
```

**使用例**:
```
recall("last_lesson_plan")
→ 直前の授業計画を取得

recall("前の授業計画", "lesson-plan")
→ 自然言語クエリで関連情報を検索
```

#### clear（クリア）

コンテキストをクリアします。

```
clear(key?)
clear() // 全クリア
```

**使用例**:
```
clear("last_lesson_plan")
→ 特定のキーをクリア

clear()
→ セッション全体をクリア
```

#### summarize（要約）

セッションの要約を生成します。

```
summarize()
```

**出力例**:
```markdown
## セッションサマリー

### 実行したスキル
1. **メタプロンプト生成** - 中学2年数学「一次関数」
2. **授業計画作成** - 50分、第3時/10時
3. **ワークシート作成** - 練習問題10問

### 参照した理論
- Bloom's Taxonomy（学習目標設定）
- Gagné's Nine Events（授業構成）

### 生成したコンテンツ
- 授業計画 1件
- ワークシート 1件
```

## スキル間データ受け渡し

### パターン1: 授業計画 → 教材作成

```
[lesson-plan.md]
1. 授業計画を生成
2. context-manager に保存: remember("current_lesson_plan", plan)

[materials.md]
1. コンテキストを取得: recall("current_lesson_plan")
2. 授業計画の内容に基づいてワークシートを生成
3. 整合性を確保
```

### パターン2: 授業計画 → 評価設計

```
[lesson-plan.md]
1. 授業計画（学習目標含む）を生成
2. context-manager に保存

[assessment.md]
1. コンテキストから学習目標を取得
2. 構成的整合性を確保した評価を設計
3. 目標との対応関係を明示
```

### パターン3: 評価結果 → フィードバック

```
[assessment.md]
1. ルーブリックを生成
2. context-manager に保存

[feedback.md]
1. ルーブリックの評価観点を参照
2. 観点に沿ったフィードバックを生成
```

## ユーザー参照パターン

ユーザーが自然言語で前の成果物を参照する場合の対応：

| ユーザー発話 | 解釈 | アクション |
|-------------|------|-----------|
| 「前の授業計画を基に」 | 直前の lesson-plan 出力 | recall("lesson-plan", latest=true) |
| 「さっきのルーブリックを修正」 | 直前の assessment 出力 | recall("assessment", latest=true) |
| 「同じ単元で教材を」 | 直前のメタプロンプトコンテキスト | recall("meta-prompt-context") |
| 「今日作ったものの一覧」 | セッション全体 | summarize() |

## コンテキスト構造

### セッションコンテキストの内部構造

```typescript
interface SessionContext {
  // セッション識別子
  sessionId: string;
  startTime: string;
  
  // ユーザー設定（デフォルト値）
  userDefaults: {
    grade?: string;      // デフォルト学年
    subject?: string;    // デフォルト教科
    language?: string;   // 使用言語
  };
  
  // メタプロンプトコンテキスト
  metaPromptContext: {
    grade?: string;
    subject?: string;
    topic?: string;
    learningObjective?: string;
    duration?: number;
    specialConsiderations?: string[];
    collectedAnswers: {
      question: string;
      answer: string;
      timestamp: string;
    }[];
  };
  
  // スキル実行履歴
  skillHistory: {
    skill: string;
    timestamp: string;
    input: object;
    output: object;
    theories: string[];
  }[];
  
  // 生成コンテンツ
  generatedContent: {
    type: 'lesson-plan' | 'materials' | 'assessment' | 
          'individual' | 'feedback' | 'guidance';
    content: string;
    metadata: object;
    timestamp: string;
  }[];
  
  // 教育理論検索結果キャッシュ
  theoryCache: {
    theoryId: string;
    data: object;
    timestamp: string;
  }[];
}
```

## マルチスキルオーケストレーション

### 実行順序の最適化

複合リクエスト時の実行順序を管理：

```
1. meta-prompt（コンテキスト収集）
   ↓ コンテキストを保存
2. lesson-plan（授業計画）
   ↓ 授業計画を保存
3. materials（教材）
   ↓ 授業計画を参照しながら生成
4. assessment（評価）
   ↓ 目標・活動と整合性確保
```

### 依存関係の解決

スキル間の依存関係を管理：

| スキル | 依存先 | 依存内容 |
|--------|--------|----------|
| materials | lesson-plan | 授業の流れ、時間配分 |
| assessment | lesson-plan | 学習目標、評価観点 |
| feedback | assessment | 評価基準、観点 |
| individual | assessment | 評価結果、課題 |

### 整合性チェック

スキル間の整合性を検証：

```markdown
## 整合性チェック結果

✅ **学習目標の一貫性**
- 授業計画の目標: {目標}
- 評価の対象目標: {同一目標}
- 結果: 一致

✅ **認知レベルの整合性**
- 目標レベル: 応用（Apply）
- 評価レベル: 応用問題を含む
- 結果: 整合

⚠️ **時間配分の確認**
- 授業計画: 50分
- ワークシート所要時間: 60分（推定）
- 結果: 調整を推奨
```

## 使用例

### 例1: 連続したコンテンツ作成

```
ユーザー: 「中学2年の一次関数の授業計画を作成してください」

[実行]
1. meta-prompt でコンテキスト収集
2. lesson-plan で授業計画生成
3. context-manager に保存

ユーザー: 「今の授業計画に合わせたワークシートも作って」

[実行]
1. context-manager から授業計画を recall
2. materials で整合性のあるワークシート生成
```

### 例2: セッションのまとめ

```
ユーザー: 「今日作成したものを一覧で見せて」

[実行]
1. context-manager.summarize()
2. 生成コンテンツの一覧を表示
```

### 例3: コンテキストの引き継ぎ

```
ユーザー: 「さっきと同じ学年・教科で、別の単元の授業計画を」

[実行]
1. recall("meta-prompt-context") で学年・教科を取得
2. 新しい単元のみをヒアリング
3. 既存コンテキストを活用して生成
```

## 注意事項

### セッションの範囲

- コンテキストは現在の会話セッション内でのみ有効
- VS Codeを閉じるとリセットされます
- 永続化が必要な場合はファイルに保存してください

### プライバシー

- 生徒の個人情報は保存しないでください
- 機密性の高い情報は clear() でクリアしてください

### 容量制限

- 大量のコンテンツは要約して保存
- 古いエントリは自動的に優先度が下がります
