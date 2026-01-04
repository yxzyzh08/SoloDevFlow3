---
name: sdf-ask
description: |
  SoloDevFlow 产品咨询与状态查询 Skill。
  渐进式回答产品进度、功能、架构问题，避免回答不全。
  同时提供 Feature 索引、状态统计、验证检查功能。
  当用户问"项目进度"、"有哪些功能"、"技术架构"、"查看状态"等问题时触发。
allowed-tools: Read, Glob, Grep
---

# SDF Product Advisor & Status

> 产品咨询 + 状态查询 Skill - 渐进式回答产品问题，提供分析建议，同时支持结构化状态索引。

## 核心能力

本 Skill 整合两种输出模式：

| 模式 | 触发词 | 输出风格 |
|------|--------|----------|
| **咨询模式** | "进度怎样"、"介绍功能"、"为什么" | 自然语言 + 分析 + 建议 |
| **索引模式** | "查看状态"、"Feature 列表"、"验证" | 表格 + 结构化数据 |

## 边界判定

**应答范围**:
- 进度类问题（"项目进度？"、"哪些功能完成了？"）
- 功能类问题（"有哪些功能？"、"XXX 功能做什么？"）
- 架构类问题（"技术架构是什么？"、"为什么选择 TypeScript？"）

**拒绝范围**（引导到其他工具）:
- 使用方法类（"怎么使用 XXX？"）→ 查看文档或 claude-code-guide
- 故障排查类（"为什么报错？"）→ 开发调试
- 代码级问题（"这个函数做什么？"）→ Read 工具
- Claude Code/API 问题 → claude-code-guide agent

**边界案例判定原则**:
- 问题核心意图是了解 **SoloDevFlow 产品本身** → /ask 应答
- 问题核心意图是学习 **如何操作工具** → 引导到文档

## 执行工作流 (渐进式)

复制此清单跟踪进度：

```
Ask Progress:
- [ ] Step 1: 问题分类
- [ ] Step 1.5: 查询规范化
- [ ] Step 2: 加载基础上下文 (L0-L1)
- [ ] Step 3: 按需深入加载 (L2-L4)
- [ ] Step 3.5: 回答完整性检查
- [ ] Step 4: 结构化回答 (含分析与建议)
```

### Step 1: 问题分类

识别问题类型和查询范围：

| 问题类型 | 关键词示例 | 加载层级 |
|----------|------------|----------|
| **进度概览** | "进度"、"状态"、"完成了吗" | L0 + L1 |
| **功能列表** | "有哪些功能"、"功能列表" | L0 + L1 |
| **功能详情** | "XXX 做什么"、"介绍 XXX" | L0 + L1 + L2 |
| **架构概览** | "架构"、"技术栈"、"设计" | L0 + L3 |
| **架构决策** | "为什么"、"ADR"、"决策" | L0 + L3 |
| **依赖分析** | "依赖"、"阻塞"、"顺序" | L0 + L1 + L4 |

### Step 1.5: 查询规范化

**Feature ID 识别**:
- "doc indexer" → "feat-doc-indexer"
- "文档索引" → "feat-doc-indexer"
- "设计 skill" → "feat-sdf-design"

**Domain 识别**:
- "文档系统" → "DocSystem"
- "核心引擎" → "CoreEngine"

**隐含维度补全**:
- "进度" → "进度 + 阻塞项 + 下一步建议"
- "功能" → "功能列表 + 依赖关系"

### Step 2: 加载基础上下文 (L0-L1)

```bash
# L0: 产品上下文 (必读)
Read docs/product_context.md

# L1: Feature 索引 (大多数查询需要)
# 调用 indexFeatures() 或读取 Feature 文档的 Frontmatter
Glob docs/requirements/**/feat-*.md
# 对每个文件读取 Frontmatter 获取 id, status, summary, tags
```

**L0 提取信息**:
- 产品愿景
- Domain 列表
- 项目范围

**L1 提取信息**:
- Feature 列表
- 状态分布
- 优先级分布

### Step 3: 按需深入加载 (L2-L4)

根据问题类型加载更多上下文：

| 层级 | 触发条件 | 加载内容 |
|------|----------|----------|
| **L2** | 特定 Feature 详情 | `Read docs/requirements/<domain>/feat-<name>.md` |
| **L3** | 架构查询 | `Read docs/architecture/ARCHITECTURE.md` + ADRs |
| **L4** | 依赖分析 | 构建依赖图，分析阻塞关系 |

**L2 示例**:
```bash
# 用户问 "feat-doc-indexer 做什么？"
Read docs/requirements/DocSystem/feat-doc-indexer.md
# 提取: summary, Scope, AC, Dependencies
```

**L3 示例**:
```bash
# 用户问 "技术架构是什么？"
Read docs/architecture/ARCHITECTURE.md
Glob docs/architecture/adr/*.md
# 提取: 技术栈, 原则, ADR 列表
```

**L4 示例**:
```bash
# 用户问 "哪些功能被阻塞了？"
# 分析所有 Feature 的 dependencies.requires
# 计算阻塞关系
```

### Step 3.5: 回答完整性检查

**使用 `think hard` 自检**

| 问题类型 | 完整性检查项 |
|----------|--------------|
| 进度类 | 是否涵盖所有状态分组？是否列出阻塞项？ |
| 功能类 | 是否覆盖所有相关 Domain？ |
| 架构类 | 是否引用了相关 ADR？ |

如有遗漏，补充加载并完善回答。

### Step 4: 结构化回答

**回答结构** (差异化内容用 ⭐ 标记):

```markdown
## [问题类型] 回答

[直接答案 - 简洁明了]

### 详情
[支撑细节 - 数据和事实]

### 分析与洞察 ⭐ (/status 不提供)
[深入分析 - 为什么、关键路径、风险点]

### 下一步建议 ⭐ (/status 不提供)
[行动建议 - 具体可执行的下一步]

---
如需进一步了解，可以问：[引导追问]
```

## 回答模板

### 进度类回答

```markdown
## 项目进度概览

**总体状态**: [开发中/已完成] (X/Y Feature 完成)

### 已完成 (N)
- feat-xxx (功能描述)
- feat-yyy (功能描述)

### 进行中 (M)
- feat-zzz (功能描述) - 当前阶段

### 待开始 (K)
- feat-aaa (功能描述)

**当前阻塞**: [无 / 列出阻塞项]

---
### 分析与洞察

- [关键路径分析]
- [依赖关系洞察]
- [风险点提示]

### 下一步建议

1. [具体行动 1]
2. [具体行动 2]

如需了解具体 Feature，可问 "feat-xxx 做什么？"
```

### 功能类回答

```markdown
## 功能列表

### Domain: [DomainName] (N Features)
| Feature | 状态 | 描述 |
|---------|------|------|
| feat-xxx | done | 一句话描述 |

### Domain: [DomainName] (M Features)
...

---
### 分析与洞察

- [功能之间的关系]
- [核心功能 vs 辅助功能]

### 下一步建议

[基于功能现状的建议]

如需详情，可问 "feat-xxx 做什么？"
```

### 架构类回答

```markdown
## 技术架构概览

**技术栈**: [主要技术]

**核心原则**:
1. [原则 1]
2. [原则 2]

**架构决策记录 (ADR)**:
- ADR-001: [标题]
- ADR-002: [标题]

---
### 分析与洞察

- [架构选择的原因]
- [与 AI-First 的关系]

### 下一步建议

[基于架构的建议]

如需详情，可问 "ADR-001 是什么？"
```

## 边界案例处理

### 案例 1: "/status 和 /ask 有什么区别？"

**判定**: 属于 SoloDevFlow 功能介绍 → /ask 应答

**回答**:
```
/status 和 /ask 都能查看项目状态，但侧重不同：

| 维度 | /status | /ask |
|------|---------|------|
| 输出 | 表格数据 | 自然语言解释 |
| 深度 | 事实列举 | 分析 + 建议 |

建议：快速查看状态用 /status，需要分析建议用 /ask。
```

### 案例 2: "怎么使用 /status？"

**判定**: 工具使用方法 → 引导到文档

**回答**:
```
/status 的使用方法请参考：
- `.claude/commands/status.md`
- 或使用 claude-code-guide 获取更多帮助

简单示例：直接输入 `/status` 即可查看 Feature 索引。
```

### 案例 3: "Claude Code 怎么配置？"

**判定**: Claude Code 工具问题 → 明确拒绝，引导

**回答**:
```
这个问题关于 Claude Code 工具本身，不是 SoloDevFlow 产品问题。

建议使用 claude-code-guide agent 获取帮助：
- 它专门回答 Claude Code 的功能、配置、使用问题
```

## 索引模式 (原 /status 功能)

当用户明确要求"查看状态"、"Feature 索引"、"验证检查"时，使用索引模式输出。

### 索引模式执行流程

```
Index Mode Progress:
- [ ] Step 1: 扫描 Feature 文件
- [ ] Step 2: 解析并验证每个文件
- [ ] Step 3: 计算反向链接
- [ ] Step 4: 按 Domain 分组统计
- [ ] Step 5: 格式化输出
```

### Step 1: 扫描 Feature 文件

```bash
Glob("docs/requirements/**/feat-*.md")
Glob("docs/requirements/**/bug-*.md")
Glob("docs/requirements/**/enh-*.md")
```

排除 `index.md` 和 `backlog.md`。

### Step 2: 解析并验证

对每个文件解析 YAML Frontmatter，提取字段：

**Required Fields** (缺失报 Error):
- `id`: 必须以 `feat-`、`bug-`、`enh-` 开头
- `type`: 必须是 `feature` | `bug` | `enhancement`
- `domain`: 必须是已注册的 Domain
- `status`: 必须是有效状态枚举
- `priority`: 必须是 `critical` | `high` | `medium` | `low`
- `summary`: 一句话描述

**Validation Rules**:
| Rule | Severity | Check |
|------|----------|-------|
| id-required | Error | id 字段存在 |
| id-format | Error | id 以 feat-/bug-/enh- 开头 |
| id-unique | Error | id 全局唯一 |
| type-enum | Error | type 值有效 |
| status-enum | Error | status 值有效 |
| priority-enum | Error | priority 值有效 |
| summary-required | Error | summary 字段存在 |
| summary-length | Warning | summary 10-100 字符 |
| tags-recommended | Warning | tags 字段存在 |
| deps-exist | Warning | requires 中的 ID 存在 |

### Step 3: 计算反向链接

```
for each feature A:
  A.computed = { requiredBy: [], blockedBy: [] }

for each feature A:
  for each feature B:
    if A.id in B.dependencies.requires:
      A.computed.requiredBy.push(B.id)
    if A.id in B.dependencies.blocks:
      A.computed.blockedBy.push(B.id)
```

### Step 4: 分组统计

```
domains = groupBy(features, 'domain')
stats = {
  total: features.length,
  byStatus: countBy(features, 'status'),
  byPriority: countBy(features, 'priority'),
  analyzedCount: count(f => f.analyzed == true),
  validCount: count(f => f.errors.length == 0)
}
```

### Step 5: 索引模式输出格式

```
=== Feature Index ===

Validation: {errors} errors, {warnings} warnings

Domain: {domain} ({count} features)
| ID | Status | Priority | Summary |
|----|--------|----------|---------|
| feat-xxx | done | high | 一句话描述 |

Stats:
- Total: N features
- By Status: done(5), implementing(2)
- By Priority: critical(2), high(3)
- Analyzed: M/N
```

### 索引模式参数

| 参数 | 说明 |
|------|------|
| 无参数 | 显示全局状态概览 |
| `--detail` | 显示详细信息（含依赖关系） |
| `--validate` | 显示完整验证结果 |
| `<domain>` | 显示指定 Domain 的 Feature |
| `<feature-id>` | 显示指定 Feature 详情 |

## 参考资料

- **问题类型分类**: [references/question-types.md](references/question-types.md)
- **Product Context**: `docs/product_context.md`
- **Architecture**: `docs/architecture/ARCHITECTURE.md`
