---
name: sdf-ask
description: |
  SoloDevFlow 产品咨询 Skill。
  渐进式回答产品进度、功能、架构问题，避免回答不全。
  当用户问"项目进度"、"有哪些功能"、"技术架构"等产品相关问题时触发。
  提供分析洞察和下一步建议，与 /status 形成差异化。
allowed-tools: Read, Glob, Grep
---

# SDF Product Advisor

> 产品咨询 Skill - 渐进式回答产品进度、功能、架构问题，提供分析与建议。

## 核心理念

**与 /status 的差异化**

| 维度 | /status | /ask |
|------|---------|------|
| **输出形式** | 表格/结构化数据 | 自然语言 + 解释 |
| **深度** | 事实陈述 | 事实 + **分析** + **建议** |
| **交互** | 单次输出 | 可引导追问 |
| **阻塞分析** | 仅列出状态 | 解释阻塞原因 |
| **建议** | 无 | 提供下一步行动建议 |

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

## 参考资料

- **问题类型分类**: [references/question-types.md](references/question-types.md)
- **Product Context**: `docs/product_context.md`
- **Architecture**: `docs/architecture/ARCHITECTURE.md`
