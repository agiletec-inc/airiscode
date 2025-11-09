# airiscode CLI 統合仕様

## 1. 目的
- Claude Code / Codex CLI / Gemini CLI の長所のみを抽出し、Super Agent ランタイムからフェーズ別に呼び分けるための技術仕様を定義する。
- 「理解→説明→実行→自律制御」を一貫させつつ、Shell Guard・Approvals/Trust ポリシーと矛盾しない統合ポイントを示す。

## 2. ツール別強み整理
| ツール | 強み | 運用ヒント |
|-------|------|------------|
| Claude Code | 複雑なコードベース理解、豊富なリファクタ提案、多言語対応、説明テキスト生成 | 長い Context で遅延が出るため、Super Agent 側でモジュール単位にスライスして渡す |
| Codex CLI | 自然言語からファイル編集〜テストまで CLI ワークフロー化、承認モードが明確 | approvals/trust をそのまま Codex 子プロセスに伝搬し、Shell Guard をフック |
| Gemini CLI | 100万トークン級のリポジトリ把握、判断力のある自律実行、OSS との親和性 | レート制限や API 不安定性を考慮し、キャッシュ＋リトライ層を `packages/drivers/gemini` に持たせる |

## 3. ラップ戦略
1. **理解フェーズ (Gemini)**  
   - `packages/drivers/gemini` にリポジトリ全体のマップ生成 API を実装し、MindBase に `repo_map` エントリを保存。  
   - 大規模ファイルをまとめて投げず、Turbo キャッシュ済み `PROJECT_INDEX.*` を添付する。
2. **説明フェーズ (Claude Code)**  
   - `packages/adapters/claude-code` で差分とアーキテクチャ抜粋を渡し、影響範囲・設計根拠コメントを JSON で受け取る。  
   - 生成された説明は CLI の「Reasoning」ペインに表示し、PR テンプレートへも流用。
3. **実行フェーズ (Codex CLI)**  
   - `packages/adapters/codex` でパッチ作成、`pnpm turbo run test`、`git status` 等を順次実行。  
   - Shell Guard が提案コマンドを検査し、Approvals/Trust に応じて自動/手動を切り替える。

## 4. 自律実行モード設計（Gemini 由来）
- `--approvals=never --trust=sandboxed` 時のみ「Auto-Advance」フラグを有効化。  
- Auto-Advance では以下を Gemini ドライバに委譲：  
  1. `repo_map` と現在のタスクリストから、必要なサブタスクを推定。  
  2. Codex adapter に渡す実行計画 JSON を生成。  
  3. Shell Guard で許可されたコマンドだけを `packages/runners` へ送信。  
- ユーザーが TUI で `pause` を押す・Approvals を上げると即時停止。

## 5. 安全・承認フロー
- すべての子プロセスは `packages/sandbox` の Shell Guard API 経由でシェルを要求。危険パターン（`rm -rf /`, `docker system prune -a`, `git push --force` など）は即拒否。  
- 各 CLI に `policy_profile` を渡し、ログに「誰がどのコマンドを提案/実行したか」を記録。  
- MindBase には自律実行ログを別テーブル `auto_actions` として保存し、監査可能にする。

## 6. 実装タスクリスト (抜粋)
1. `packages/drivers/gemini`：巨大コンテキスト ingest・Auto-Advance プランナー。
2. `packages/adapters/claude-code`：差分説明 API、Reasoning テンプレート。
3. `packages/adapters/codex`：シェル実行＋ファイル編集フロー、Approvals Hook。
4. `apps/airiscode-cli`：理解/説明/実行のフェーズ UI、Auto-Advance トグル。
5. `packages/sandbox`：自律モード専用の追加ガードルールと監査ログ出力。
6. `docs/`：本仕様と `AGENTS.md` をリンクし、開発者オンボーディングを更新。
