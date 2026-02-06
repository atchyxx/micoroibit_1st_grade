# 理論検索スキル（SHIDEN SQLite統合）

> SHIDEN内蔵のSQLite教育理論データベースから175+の教育理論を検索・取得・引用します。

## 概要

このスキルは、SHIDENに内蔵された175件の教育理論を検索・取得するための機能を提供します。FTS5 trigramによる日本語全文検索とWITH RECURSIVE CTEによるグラフ走査をサポートします。

**v0.3.0の重要な変更**: TENJINのDocker依存を排除し、SQLiteデータベースを直接パッケージに同梱。`npx shiden init` だけでセットアップが完了します。

## CLI コマンド

### 基本的な使い方

```bash
# カテゴリ一覧を表示
npx shiden theories categories

# 理論を検索（FTS5 trigram - 3文字以上推奨）
npx shiden theories search "社会的構成主義"
npx shiden theories search "constructivism"

# 理論の詳細を取得
npx shiden theories get theory-003

# 理論一覧を表示
npx shiden theories list -l 10

# 関連理論をグラフ走査で取得
npx shiden theories related theory-003 -d 2
```

### コマンドリファレンス

#### `theories categories`

カテゴリ一覧と各カテゴリの理論数を表示します。

```bash
$ npx shiden theories categories

📁 カテゴリ一覧 (11カテゴリ, 175理論)

  learning_theory            45件 █████████
  asian_education            27件 ██████
  instructional_design       19件 ████
  technology_enhanced        18件 ████
  modern_education           14件 ███
  social_learning            11件 ███
  assessment                 10件 ██
  curriculum                 10件 ██
  developmental              10件 ██
  motivation                 10件 ██
  critical_alternative        1件 █
```

#### `theories search <query>`

FTS5 trigramによる全文検索を実行します。

**オプション**:
- `-c, --category <category>`: カテゴリでフィルタ
- `-l, --limit <number>`: 表示件数（デフォルト: 10）
- `-v, --verbose`: 詳細表示

```bash
$ npx shiden theories search "社会的" -v

🔍 検索結果: "社会的" (10件, 4.54ms)

theory-007: Social Constructivism
  社会的構成主義
  Category: learning_theory
  Description: Learning as a social process...
  Principles: Zone of proximal development, Scaffolding...
```

**注意**: trigramインデックスのため、3文字以上のクエリを推奨します。2文字以下のクエリはLIKE検索にフォールバックします。

#### `theories get <id>`

理論の詳細情報を取得します。

```bash
$ npx shiden theories get theory-003

📖 Social Cognitive Theory

日本語名: 社会的認知理論
カテゴリ: learning_theory
ID: theory-003

説明:
  Triadic reciprocal interaction between behavior...

説明（日本語）:
  行動・環境・個人的要因の三者相互作用と自己効力感

主要原則:
  • Triadic reciprocal determinism
  • Self-efficacy as central construct
  • Self-regulation of behavior

応用分野:
  • Academic motivation interventions
  • Health behavior change

強み:
  ✓ Comprehensive framework
  ✓ Strong empirical support

限界・制約:
  ✗ Complexity in measurement
  ✗ Cultural variations
```

#### `theories list`

理論一覧を表示します。

**オプション**:
- `-c, --category <category>`: カテゴリでフィルタ
- `-l, --limit <number>`: 表示件数（デフォルト: 20）
- `-o, --offset <number>`: オフセット（デフォルト: 0）

```bash
$ npx shiden theories list -c motivation -l 5

📚 教育理論一覧 (5/10件)

theory-029: Expectancy-Value Theory
  期待価値理論
  Category: motivation
...
```

#### `theories related <id>`

WITH RECURSIVE CTEによるグラフ走査で関連理論を取得します。

**オプション**:
- `-d, --depth <number>`: 走査深さ 1-3（デフォルト: 2）

```bash
$ npx shiden theories related theory-003 -d 2

🔗 関連理論: Social Cognitive Theory

   起点: theory-003 (深さ: 2)

  └─ theory-014: Self-Efficacy Theory (derived_from)
    └─ theory-029: Expectancy-Value Theory (complements)

  2件の関連理論
```

## プログラマティックAPI

TypeScript/JavaScriptからも直接利用可能です：

```typescript
import {
  search,
  get,
  list,
  categories,
  related,
  count,
  closeDatabase,
} from 'shiden/theories';

// 検索
const result = search('社会的学習', { limit: 5 });
console.log(`${result.total}件 (${result.durationMs}ms)`);

// 詳細取得
const theory = get('theory-003');
console.log(theory?.name_ja);

// カテゴリ一覧
const cats = categories();

// 関連理論（グラフ走査）
const rel = related('theory-003', { depth: 2 });

// クリーンアップ
closeDatabase();
```

## カテゴリ一覧

| カテゴリ | 件数 | 説明 |
|---------|------|------|
| `learning_theory` | 45 | 学習理論（構成主義、行動主義など） |
| `asian_education` | 27 | アジアの教育理論 |
| `instructional_design` | 19 | 授業設計・教授法 |
| `technology_enhanced` | 18 | 教育工学・ICT活用 |
| `modern_education` | 14 | 現代教育（21世紀型スキルなど） |
| `social_learning` | 11 | 社会的学習・協調学習 |
| `assessment` | 10 | 評価理論 |
| `curriculum` | 10 | カリキュラム設計 |
| `developmental` | 10 | 発達心理学 |
| `motivation` | 10 | 動機づけ理論 |
| `critical_alternative` | 1 | 批判的教育学 |

## 関係タイプ

理論間の関係は以下のタイプで分類されています：

| タイプ | 説明 |
|--------|------|
| `related_to` | 一般的な関連 |
| `influenced_by` | 影響を受けた |
| `influences` | 影響を与えた |
| `builds_upon` | 基盤として構築 |
| `derived_from` | 派生した |
| `complements` | 補完的 |
| `similar_to` | 類似 |
| `contrasts_with` | 対照的 |

## 他のスキルからの呼び出し

他のスキル（lesson-plan.md、assessment-design.md等）から理論検索を行う場合：

```markdown
### 使用する教育理論の選定

1. コンテキストに基づいて理論を検索：
   ```bash
   npx shiden theories search "アクティブラーニング"
   ```

2. 推奨される理論の詳細を確認：
   ```bash
   npx shiden theories get theory-038
   ```

3. 関連理論も併せて検討：
   ```bash
   npx shiden theories related theory-038 -d 2
   ```
```

## データベース仕様

- **フォーマット**: SQLite 3（better-sqlite3使用）
- **サイズ**: 約1.5MB
- **理論数**: 175件
- **関係数**: 77件
- **FTS5インデックス**: trigram tokenizer（日本語対応）
- **データソース**: TENJIN Neo4jデータベースからエクスポート

## TENJIN MCP Server との比較

| 機能 | SHIDEN (v0.3.0) | TENJIN MCP |
|------|-----------------|------------|
| セットアップ | `npx shiden init` | Docker + Neo4j + ChromaDB |
| 依存関係 | なし | Neo4j, ChromaDB, Ollama |
| 理論数 | 175 | 175+ |
| 検索方式 | FTS5 trigram | ベクトル検索 + GraphRAG |
| グラフ走査 | WITH RECURSIVE | Cypher |
| オフライン | ✅ | ❌ |
| 推薦機能 | ❌ | ✅（LLM利用） |
| 深層分析 | ❌ | ✅（LLM利用） |

**推奨**:
- **教育者・素早く始めたい方**: SHIDEN SQLite統合
- **高度な推薦・分析が必要な方**: TENJIN MCP Server

## トラブルシューティング

### 検索結果が0件になる

- 3文字以上のクエリを使用してください（trigramインデックス）
- 2文字以下のクエリはLIKE検索にフォールバックしますが、精度が下がります

### データベースが見つからない

```
Database file not found
```

→ `npm install shiden` を再実行してください。`src/data/theories.db` が含まれているか確認してください。

### 日本語検索がうまくいかない

- trigramインデックスは3文字以上で最適に動作します
- 「認知」より「認知負荷」のように具体的なクエリを使用してください
