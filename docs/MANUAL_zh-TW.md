# LLM Agent Explainability Platform — 使用手冊

> **版本**：1.0.0
> **最後更新**：2026-03-06

---

## 目錄

1. [專案簡介](#1-專案簡介)
2. [系統需求](#2-系統需求)
3. [安裝與環境設定](#3-安裝與環境設定)
4. [專案結構總覽](#4-專案結構總覽)
5. [核心模組說明](#5-核心模組說明)
   - 5.1 [資料庫模組 (db)](#51-資料庫模組-db)
   - 5.2 [推理軌跡記錄器 (agent)](#52-推理軌跡記錄器-agent)
   - 5.3 [探測實驗執行器 (probes)](#53-探測實驗執行器-probes)
   - 5.4 [推理一致性分析器 (analysis)](#54-推理一致性分析器-analysis)
   - 5.5 [REST API 服務 (api)](#55-rest-api-服務-api)
6. [快速上手](#6-快速上手)
7. [API 參考文件](#7-api-參考文件)
8. [自訂實驗指南](#8-自訂實驗指南)
9. [常見問題 (FAQ)](#9-常見問題-faq)

---

## 1. 專案簡介

本平台旨在研究 **LLM（大型語言模型）代理的可解釋性（Explainability）** 與 **推理軌跡分析（Reasoning Trace Analysis）**。

隨著 LLM 越來越多地被部署為自主代理（Autonomous Agent），理解其內部逐步推理過程並驗證其一致性變得至關重要。本平台提供以下能力：

- 📝 **記錄** — 捕捉代理在執行過程中的每一步思考、行動與觀察
- 💾 **儲存** — 將推理軌跡結構化地存入 SQLite 資料庫
- 🧪 **探測** — 執行特定的探測實驗，觸發並記錄代理的推理過程
- 🔍 **分析** — 檢測推理軌跡中的邏輯不一致或幻覺（Hallucination）
- 🌐 **查詢** — 透過 REST API 檢索推理紀錄，供視覺化或進階分析使用

---

## 2. 系統需求

| 項目 | 需求 |
|------|------|
| 作業系統 | Windows 10/11 + WSL (Ubuntu) |
| Node.js | v20 以上（建議透過 `nvm` 管理） |
| npm | v10 以上 |
| 磁碟空間 | 約 200 MB（含 `node_modules`） |

---

## 3. 安裝與環境設定

### 3.1 進入 WSL 環境

```bash
wsl
```

### 3.2 使用 nvm 切換 Node.js 版本

專案根目錄已有 `.nvmrc` 檔案，指定使用的 Node.js 版本。

```bash
# 進入專案目錄（WSL 中路徑格式）
cd /mnt/c/Users/chutz/mytestspace/agenttrace

# 安裝並使用指定版本的 Node.js
nvm install
nvm use
```

### 3.3 安裝套件依賴

```bash
npm install
```

> ⚠️ **注意**：`better-sqlite3` 是 C++ 原生模組，必須在你要執行的環境（Linux/WSL）中編譯。
> 如果你先前曾在 Windows 下執行 `npm install`，請在 WSL 中執行以下指令重新編譯：
> ```bash
> npm rebuild better-sqlite3
> ```

---

## 4. 專案結構總覽

```
agenttrace/
├── src/
│   ├── agent/                 # 推理軌跡記錄器
│   │   └── logger.ts
│   ├── probes/                # 探測實驗執行器
│   │   └── experiment_runner.ts
│   ├── analysis/              # 推理一致性分析器
│   │   └── analyzer.ts
│   ├── db/                    # SQLite 資料庫設定與 Schema
│   │   └── schema.ts
│   └── api/                   # Express REST API
│       └── server.ts
├── scripts/                   # 範例實驗腳本
│   └── run_experiment.ts
├── data/                      # SQLite 資料庫檔案存放處
│   └── traces.db              （執行後自動產生）
├── package.json
├── tsconfig.json
├── .nvmrc
├── .gitattributes
├── .gitignore
└── README.md
```

---

## 5. 核心模組說明

### 5.1 資料庫模組 (db)

**檔案**：`src/db/schema.ts`

負責建立與管理 SQLite 資料庫。資料庫檔案儲存於 `data/traces.db`。

#### 資料表結構：`reasoning_traces`

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER (PK) | 自動遞增主鍵 |
| `experiment_id` | TEXT | 實驗唯一識別碼，格式為 `exp_<timestamp>` |
| `step_number` | INTEGER | 推理步驟編號（從 1 開始） |
| `thought` | TEXT | 代理在此步驟的內部思考內容 |
| `action` | TEXT (nullable) | 代理執行的行動（如 `Search(...)`、`FinalAnswer(...)`） |
| `observation` | TEXT (nullable) | 行動後獲得的外部觀察結果 |
| `timestamp` | DATETIME | 記錄時間（自動填入） |

#### 使用方式

```typescript
import { initializeDatabase } from './src/db/schema';

// 初始化資料庫（建立資料表，若已存在則跳過）
initializeDatabase();
```

---

### 5.2 推理軌跡記錄器 (agent)

**檔案**：`src/agent/logger.ts`

提供 `ReasoningLogger` 類別，用於將代理的每一步推理軌跡寫入資料庫。

#### TraceEntry 介面

```typescript
interface TraceEntry {
  experimentId: string;   // 所屬實驗的 ID
  stepNumber: number;     // 步驟編號
  thought: string;        // 思考內容（必填）
  action?: string;        // 行動（選填）
  observation?: string;   // 觀察結果（選填）
}
```

#### 使用範例

```typescript
import { ReasoningLogger } from './src/agent/logger';

const logger = new ReasoningLogger();

logger.logTrace({
  experimentId: 'exp_001',
  stepNumber: 1,
  thought: '使用者問的是法國的首都，我需要去查詢。',
  action: 'Search(法國首都)',
});

logger.logTrace({
  experimentId: 'exp_001',
  stepNumber: 2,
  thought: '搜尋結果顯示法國的首都是巴黎。',
  observation: '巴黎是法國的首都及最大城市。',
});
```

---

### 5.3 探測實驗執行器 (probes)

**檔案**：`src/probes/experiment_runner.ts`

提供 `ExperimentRunner` 類別，用於模擬代理的推理過程並自動記錄軌跡。

目前提供的是一個**模擬（Mock）實驗**，模擬一個代理回答「法國的首都是什麼？」的三步推理過程：

1. **思考** → 理解使用者的問題
2. **搜尋** → 執行搜尋行動，獲得觀察結果
3. **回答** → 整合資訊，給出最終答案

#### 使用範例

```typescript
import { ExperimentRunner } from './src/probes/experiment_runner';

const runner = new ExperimentRunner();
const experimentId = await runner.runProbingExperiment('What is the capital of France?');
// 回傳值：實驗 ID，例如 'exp_1741239335661'
```

---

### 5.4 推理一致性分析器 (analysis)

**檔案**：`src/analysis/analyzer.ts`

提供 `ConsistencyAnalyzer` 類別，用於分析已記錄的推理軌跡是否合乎邏輯。

#### 目前的分析規則

| 規則 | 說明 |
|------|------|
| 搜尋後需有觀察 | 若前一步執行了 `Search(...)` 行動，下一步應包含 `observation` 欄位。若缺少，則判定為不一致。 |

#### 使用範例

```typescript
import { ConsistencyAnalyzer } from './src/analysis/analyzer';

const analyzer = new ConsistencyAnalyzer();
const isConsistent = analyzer.analyzeExperiment('exp_1741239335661');
// 回傳值：true（一致）或 false（發現不一致）
```

#### 輸出範例

一致的情況：
```
[Analyzer] Analyzing consistency for exp_001
[Analyzer] Experiment exp_001 reasoning trace appears consistent.
```

不一致的情況：
```
[Analyzer] Analyzing consistency for exp_002
Inconsistency detected at step 3: Missing observation after Search.
```

---

### 5.5 REST API 服務 (api)

**檔案**：`src/api/server.ts`

基於 Express 的 HTTP API 伺服器，提供推理紀錄的查詢功能。

預設執行在 **port 3000**（可透過環境變數 `PORT` 覆蓋）。

---

## 6. 快速上手

以下示範完整的操作流程，所有指令都在 **WSL** 中執行：

```bash
# 1. 進入專案目錄
cd /mnt/c/Users/chutz/mytestspace/agenttrace

# 2. 切換至指定的 Node.js 版本
nvm use

# 3. 安裝依賴套件
npm install

# 4. 執行範例實驗（會自動建立資料庫、記錄軌跡、並進行分析）
npm run experiment:run

# 5. 啟動 API 伺服器
npm run start:api
```

啟動伺服器後，在 Windows 瀏覽器開啟以下網址即可查看結果：

- 查看所有紀錄：[http://localhost:3000/api/logs](http://localhost:3000/api/logs)
- 查看特定實驗：`http://localhost:3000/api/logs/<實驗ID>`

---

## 7. API 參考文件

### `GET /api/logs`

取得最近的推理軌跡紀錄（預設上限 100 筆）。

**回應範例**：

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 3,
      "experiment_id": "exp_1741239335661",
      "step_number": 3,
      "thought": "I have the answer. I will formulate the final response.",
      "action": "FinalAnswer(Paris)",
      "observation": null,
      "timestamp": "2026-03-06 05:35:35"
    },
    {
      "id": 2,
      "experiment_id": "exp_1741239335661",
      "step_number": 2,
      "thought": "The search result indicates the capital of France is Paris.",
      "action": null,
      "observation": "Paris is the capital and most populous city of France.",
      "timestamp": "2026-03-06 05:35:35"
    }
  ]
}
```

### `GET /api/logs/:experimentId`

取得指定實驗的所有推理軌跡，按步驟順序排列。

**參數**：

| 參數 | 類型 | 說明 |
|------|------|------|
| `experimentId` | string (URL path) | 實驗 ID，例如 `exp_1741239335661` |

**回應範例**：

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "experiment_id": "exp_1741239335661",
      "step_number": 1,
      "thought": "I need to understand the user's prompt...",
      "action": "Search(Capital of France)",
      "observation": null,
      "timestamp": "2026-03-06 05:35:35"
    }
  ]
}
```

---

## 8. 自訂實驗指南

你可以依照以下步驟建立自己的探測實驗：

### 步驟一：建立新的實驗腳本

在 `scripts/` 目錄下建立新的 TypeScript 檔案，例如 `scripts/my_experiment.ts`：

```typescript
import { initializeDatabase } from '../src/db/schema';
import { ReasoningLogger } from '../src/agent/logger';
import { ConsistencyAnalyzer } from '../src/analysis/analyzer';

async function main() {
  initializeDatabase();

  const logger = new ReasoningLogger();
  const experimentId = `exp_${Date.now()}`;

  // 記錄你的自訂推理軌跡
  logger.logTrace({
    experimentId,
    stepNumber: 1,
    thought: '使用者詢問了一個數學問題，我需要分步驟計算。',
    action: 'Calculate(2 + 2)',
  });

  logger.logTrace({
    experimentId,
    stepNumber: 2,
    thought: '計算結果為 4，我將回答使用者。',
    observation: '2 + 2 = 4',
    action: 'FinalAnswer(4)',
  });

  // 分析一致性
  const analyzer = new ConsistencyAnalyzer();
  analyzer.analyzeExperiment(experimentId);
}

main().catch(console.error);
```

### 步驟二：執行自訂實驗

```bash
npx ts-node scripts/my_experiment.ts
```

### 步驟三：透過 API 查看結果

```bash
# 啟動 API 伺服器
npm run start:api

# 在另一個終端機中查詢
curl http://localhost:3000/api/logs
```

---

## 9. 常見問題 (FAQ)

### Q：執行時出現 `ERR_DLOPEN_FAILED` 或 `NODE_MODULE_VERSION` 錯誤？

**原因**：`better-sqlite3` 是 C++ 原生模組，必須在目標環境中編譯。如果你在 Windows 安裝後拿到 WSL 執行，或切換了 Node.js 版本，就會出現此錯誤。

**解決方法**：
```bash
npm rebuild better-sqlite3
```

### Q：在 Windows PowerShell 中 `npm` 找不到？

**原因**：你的 Windows 環境未安裝 Node.js，或未將其加入 PATH。

**解決方法**：改在 WSL 中執行所有指令：
```bash
wsl
cd /mnt/c/Users/chutz/mytestspace/agenttrace
nvm use
npm run experiment:run
```

### Q：Git 出現 `LF will be replaced by CRLF` 警告？

**原因**：Windows 預設使用 CRLF 行尾，而專案規範使用 LF。

**解決方法**：專案已包含 `.gitattributes` 設定，執行以下指令即可修復：
```bash
git add --renormalize .
git commit -m "Normalize line endings"
```

### Q：如何清除所有已記錄的實驗資料？

**方法**：直接刪除資料庫檔案即可，下次執行時會自動重建：
```bash
rm data/traces.db
```

---

> 📬 如有其他問題或功能需求，歡迎提出！
