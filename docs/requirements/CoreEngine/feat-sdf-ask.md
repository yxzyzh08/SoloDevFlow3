---
id: feat-sdf-ask
type: feature
domain: CoreEngine
status: done
priority: medium
created: 2026-01-03

# ===== Semantic Fields (AI-First) =====
summary: "产品咨询 Skill - 渐进式回答产品进度、功能、架构问题，避免回答不全"
tags: [skill, query, progress, architecture, product-info]

# ===== Feature Kind =====
feature_kind: specification

# ===== Dependency Fields =====
dependencies:
  requires:
    - feat-doc-indexer        # 获取 Feature 列表和元数据
    - feat-dependency-graph   # 获取依赖关系
  blocks: []
analyzed: true
---

# SDF-Ask Skill

> 产品咨询 Skill - 渐进式回答产品进度、功能、架构问题，避免回答不全或片面。

## 1. Requirements

### 1.1 Background

随着 SoloDevFlow 功能增多，用户询问产品相关问题时可能遇到以下问题：

1. **回答不全** - AI 可能遗漏部分 Feature 或状态
2. **信息分散** - 产品信息散落在多个文档中
3. **上下文占用** - 咨询问题占用工作 session 的上下文
4. **新 session 冷启动** - 新对话不了解项目全貌

**解决方案**：创建专门的产品咨询 Skill，提供：
- 渐进式信息加载（先概览后详情）
- 结构化回答流程（确保覆盖所有维度）
- 独立 session 支持（`claude -p "run /ask 项目进度"`）

**与 /status 的关系**：
- `/status`：快速列出 Feature 索引和状态统计（表格形式）
- `/ask`：智能问答，理解自然语言问题，提供解释性回答

两者**独立并存**，适用不同场景。

### 1.2 User Stories

作为**开发者**，我希望**用自然语言询问产品问题并获得完整回答**，以便**快速了解项目状态而不遗漏信息**。

作为**新加入的协作者**，我希望**在新 session 中快速了解项目全貌**，以便**不需要阅读大量文档就能上手**。

### 1.3 Scope

**包含**：
- 进度类问题（"项目进度？"、"哪些功能完成了？"）
- 功能类问题（"有哪些功能？"、"XXX 功能做什么？"）
- 架构类问题（"技术架构是什么？"、"为什么选择 TypeScript？"）

**不包含**：
- 使用方法类问题（"怎么使用 XXX？"）→ 应查看文档或 claude-code-guide
- 故障排查类问题（"为什么报错？"）→ 属于开发调试
- 代码级问题（"这个函数做什么？"）→ 使用 Read 工具
- Claude Code 工具使用问题 → 使用 claude-code-guide agent
- Claude API / Agent SDK 问题 → 使用 claude-code-guide agent

**边界判定原则**：
- 如果问题核心意图是了解 **SoloDevFlow 产品本身**（进度、功能、架构）→ /ask 应答
- 如果问题核心意图是学习 **如何操作工具** → 引导到文档或 claude-code-guide
- 边界案例："/status 和 /ask 有什么区别？" → /ask 应答（属于 SoloDevFlow 功能介绍）

## 2. Specification

### 2.1 Skill Structure

```
.claude/skills/sdf-ask/
├── SKILL.md                 # 核心指令
└── references/
    └── question-types.md    # 问题类型分类和回答策略
```

### 2.2 Question Types & Response Strategy

| 问题类型 | 关键词示例 | 回答策略 |
|----------|------------|----------|
| **进度概览** | "进度"、"状态"、"完成了吗" | 读取所有 Feature，按状态分组统计 |
| **功能列表** | "有哪些功能"、"功能列表" | 按 Domain 分组列出 Feature + summary |
| **功能详情** | "XXX 做什么"、"介绍 XXX" | 读取特定 Feature 文档，提取关键信息 |
| **架构概览** | "架构"、"技术栈"、"设计" | 读取 ARCHITECTURE.md 和 principles.md |
| **架构决策** | "为什么"、"ADR"、"决策" | 读取相关 ADR 文档 |

### 2.3 Query Workflow (渐进式)

```
Input: 自然语言问题 (e.g., "项目进度怎样？")

┌─────────────────────────────────────────────────────────────┐
│ Step 1: 问题分类                                             │
│ ─────────────────────────────────────────────────────────── │
│ ├── 识别问题类型 (进度/功能/架构)                            │
│ ├── 识别查询范围 (全局/特定 Feature/特定 Domain)            │
│ └── 确定需要加载的文档范围                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1.5: Query Normalization (查询规范化)                   │
│ ─────────────────────────────────────────────────────────── │
│ ├── 识别 Feature ID (如 "doc indexer" → "feat-doc-indexer") │
│ ├── 识别 Domain (如 "文档系统" → "DocSystem")               │
│ ├── 补全隐含维度 (如 "进度" → "进度 + 阻塞项")              │
│ └── 生成规范化查询                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: 加载基础上下文 (L0-L1)                               │
│ ─────────────────────────────────────────────────────────── │
│ ├── L0: 读取 product_context.md (产品愿景和 Domain 列表)    │
│ └── L1: 调用 indexFeatures() 获取所有 Feature Frontmatter   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 按需深入加载 (L2-L4)                                 │
│ ─────────────────────────────────────────────────────────── │
│ ├── 进度类 → L1 数据 + 统计 status 分布                     │
│ ├── 功能类 → L2 读取相关 Feature 完整文档                   │
│ ├── 架构类 → L3 读取 ARCHITECTURE.md, principles.md, ADRs   │
│ └── 依赖类 → L4 调用 buildGraph() 构建依赖图                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3.5: Response Completeness Check (回答完整性检查)       │
│ ─────────────────────────────────────────────────────────── │
│ ├── 进度类: 是否涵盖所有状态分组？是否列出阻塞项？          │
│ ├── 功能类: 是否覆盖所有相关 Domain？                       │
│ ├── 架构类: 是否引用了相关 ADR？                            │
│ └── 如有遗漏，补充加载并完善回答                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 结构化回答 (差异化输出)                              │
│ ─────────────────────────────────────────────────────────── │
│ ├── 先给出直接答案                                          │
│ ├── 再提供支撑细节                                          │
│ ├── 分析与洞察 (/status 不提供)                             │
│ ├── 下一步建议 (/status 不提供)                             │
│ └── 最后指引进一步探索路径                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Progressive Loading Levels (渐进式加载层级)

| 层级 | 触发条件 | 加载内容 | 使用工具 |
|------|----------|----------|----------|
| **L0** | 所有查询 | `product_context.md` (Domain 列表、产品愿景) | Read |
| **L1** | 进度/功能概览 | 所有 Feature 的 Frontmatter (summary, status, tags) | indexFeatures() |
| **L2** | 特定 Feature 详情 | 完整 Feature 文档 (Requirements, Scope, AC) | Read |
| **L3** | 架构查询 | `ARCHITECTURE.md` + `principles.md` + 相关 ADR | Read + Glob |
| **L4** | 依赖分析 | 调用 dependency-graph 构建完整依赖图 | buildGraph() |

**加载原则**:
- 总是从 L0 开始，按需向上加载
- 单次查询最多加载到所需的最高层级
- 避免一次性加载所有文档，遵循 P5 Progressive Disclosure 原则

### 2.5 Response Format & Differentiation

#### 与 /status 的差异对比

| 维度 | /status | /ask |
|------|---------|------|
| **输出形式** | 表格/结构化数据 | 自然语言 + 解释 |
| **深度** | 事实陈述 | 事实 + **分析** + **建议** |
| **交互** | 单次输出 | 可引导追问 |
| **阻塞分析** | 仅列出状态 | 解释阻塞原因 |
| **建议** | 无 | 提供下一步行动建议 |

#### 进度类回答示例

```
## 项目进度概览

**总体状态**: 开发中 (4/8 Feature 完成)

### 已完成 (4)
- feat-sdf-analyze (R 阶段分析)
- feat-doc-indexer (文档索引)
- feat-dependency-graph (依赖图)
- ...

### 进行中 (3)
- feat-sdf-design (D 阶段设计)
- feat-sdf-test (T 阶段测试)
- feat-workflow-orchestration (工作流编排)

### 待开始 (1)
- feat-sdf-ask (产品咨询)

**当前阻塞**: 无

---
### 💡 分析与洞察 (/status 不提供)

- workflow-orchestration 依赖 sdf-design 和 sdf-test，这两个是当前**关键路径**
- DocSystem 的基础设施已全部完成，为后续 Feature 提供了稳定基础

### 📋 下一步建议 (/status 不提供)

1. 优先完成 sdf-design 和 sdf-test 的实现
2. 完成后可并行推进 workflow-orchestration 和 sdf-ask

如需了解具体 Feature 详情，可问 "feat-sdf-design 做什么？"
```

#### 架构类回答示例

```
## 技术架构概览

**技术栈**: TypeScript + Claude CLI

**核心原则**:
1. AI-First - 文档结构为 AI 优化
2. Document is Truth - 文档是状态唯一来源
3. Progressive Disclosure - 渐进式上下文加载

**架构决策记录**:
- ADR-001: 选择 TypeScript 作为实现语言
- ADR-002: 架构治理流程
- ADR-003: 目录结构分层

---
### 💡 分析与洞察 (/status 不提供)

选择 TypeScript 的主要原因是：类型安全 + IDE 支持 + 与 Node.js 生态兼容。
这与 AI-First 原则相辅相成，因为类型定义帮助 AI 更好地理解代码结构。

如需详情，可问 "ADR-001 是什么？"
```

### 2.6 Trigger

```
用户输入含以下意图时触发：
- 明确使用 /ask 命令
- 或问题以 "项目"、"产品"、"进度"、"功能"、"架构" 开头
```

### 2.7 CLI Integration

可通过 CLI 独立调用，避免占用当前 session：

```bash
# 快速查询进度
claude -p "run /ask 项目进度"

# 查询特定功能
claude -p "run /ask feat-doc-indexer 做什么"

# 查询架构决策
claude -p "run /ask 为什么选择 TypeScript"
```

## 3. Dependency Analysis

> 此部分已在分析过程中完成

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| **feat-doc-indexer** | Feature | **done** | 获取 Feature 列表和元数据 |
| **feat-dependency-graph** | Feature | **done** | 获取依赖关系（回答功能依赖问题） |
| Glob/Read Tools | Infra | Claude Built-in | 读取文档 |

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| 用户体验 | UX | High | 提供更智能的产品问答 |
| 新 session 体验 | UX | High | 快速了解项目全貌 |

### 3.3 New Backlog Items

(无新增)

### 3.4 Dependency Interaction Analysis

#### Interaction with feat-doc-indexer

**Source**: docs/requirements/DocSystem/feat-doc-indexer.md
**Status**: done

**Capabilities Provided**:
- `indexFeatures()`: 扫描并索引所有 Feature 文档
- `formatIndexResult()`: 格式化输出

**How This Feature Uses It**:
- 回答进度问题时获取 Feature 状态分布
- 回答功能列表问题时获取所有 Feature 的 summary

**Data Contract**:
- Input: basePath
- Output: IndexResult { features, domains, stats }

#### Interaction with feat-dependency-graph

**Source**: docs/requirements/DocSystem/feat-dependency-graph.md
**Status**: done

**Capabilities Provided**:
- `buildGraph()`: 构建依赖图
- `getOutgoingEdges()`: 获取依赖列表

**How This Feature Uses It**:
- 回答功能依赖问题时使用
- 分析阻塞关系

### 3.5 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在 (feat-doc-indexer ✅, feat-dependency-graph ✅)
- [x] 后续影响已评估
- [x] 无新增依赖到 Backlog

**Status**: Ready for Design

## 4. Acceptance Criteria

> **重要**：本 Feature 是**规范类 Feature**（Skill 定义），不是代码。
> 验收方式：**规范完整性 + 试运行验证 + 输出结构检查**，而非单元测试。
>
> **验收流程**：
> 1. Layer 1: 规范完整性 → Glob 检查 Skill 文件存在
> 2. Layer 2: 试运行验证 → 用自然语言问题测试
> 3. Layer 3: 输出结构验证 → 检查回答格式
> 4. Layer 4: 人工确认 → 用户批准完成

### AC-1: Skill Structure
- [x] `.claude/skills/sdf-ask/SKILL.md` 已创建
- [x] 问题类型分类参考已创建
- [x] 渐进式加载层级 (L0-L4) 规则已文档化

### AC-2: Query Workflow
- [x] Step 1: 能正确分类问题类型和查询范围
- [x] Step 1.5: 能执行查询规范化 (Feature ID/Domain 识别)
- [x] Step 2-3: 能按层级渐进式加载所需文档
- [x] Step 3.5: 能执行回答完整性自检
- [x] Step 4: 输出包含分析与建议 (差异化内容)

### AC-3: Response Quality
- [x] 进度类问题：正确统计 Feature 状态 + 提供下一步建议
- [x] 功能类问题：完整列出相关功能 + 说明依赖关系
- [x] 架构类问题：引用正确的 ADR 和架构文档 + 解释决策原因

### AC-4: CLI Integration
- [x] 支持 `claude -p "run /ask <question>"` 调用
- [x] 独立 session 能正确回答问题

### AC-5: Boundary Cases (边界案例)
- [x] 边界案例 1: "/status 和 /ask 有什么区别？" → 正确回答 (属于功能介绍)
- [x] 边界案例 2: "怎么使用 /status？" → 引导到文档或 claude-code-guide
- [x] 边界案例 3: "Claude Code 怎么配置？" → 明确拒绝，引导到 claude-code-guide
- [x] 边界案例 4: 混合查询 "feat-doc-indexer 的进度" → 正确处理跨类型查询

### AC-6: Differentiation from /status
- [x] 回答包含"分析与洞察"部分 (/status 不提供)
- [x] 回答包含"下一步建议"部分 (/status 不提供)
- [x] 阻塞项附带原因解释 (而非仅列出)

## 5. Technical Constraints

- **Claude Tools Only**: 使用 Glob, Read
- **Leverage Existing**: 复用 doc-indexer 和 dependency-graph 的输出
- **Progressive Loading**: 按需加载，避免一次读取所有文档
- **No Caching**: 每次实时读取，确保信息最新

## 6. Test Strategy

> 规范类 Feature 的测试策略

### 6.1 Specification Completeness
- Skill 文件存在性检查 (Glob)
- 问题类型覆盖验证
- 渐进式加载层级文档检查

### 6.2 Trial Run Verification

**核心场景**:
- 试运行场景 1: "项目进度怎样？" → 验证进度类 + 分析建议
- 试运行场景 2: "有哪些功能？" → 验证功能类 + 完整覆盖
- 试运行场景 3: "技术架构是什么？" → 验证架构类 + ADR 引用
- 试运行场景 4: "feat-doc-indexer 做什么？" → 验证特定 Feature 查询

**边界案例**:
- 试运行场景 5: "/status 和 /ask 有什么区别？" → 验证边界判定
- 试运行场景 6: "怎么使用 /status？" → 验证引导到文档
- 试运行场景 7: "Claude Code 怎么配置？" → 验证拒绝并引导

**差异化验证**:
- 检查回答是否包含"分析与洞察"部分
- 检查回答是否包含"下一步建议"部分

---

*Feature: sdf-ask*
*Domain: CoreEngine*
*Created: 2026-01-03*
*Updated: 2026-01-03*
*Status: proposed*
*Kind: specification*
*Dependencies Analyzed: true*
