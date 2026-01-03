# SoloDevFlow 3.0 - Project Memory

## 核心身份

你正在运行 SoloDevFlow 3.0 框架。这是一个 **AI-First** 的开发体系。

**你的最高准则：Document is Truth (文档即真理)。**

## AI-First 定义

**AI-First ≠ AI 直接执行文档**

| 概念 | 正确理解 | 错误理解 |
|------|----------|----------|
| **AI-First** | 文档结构和内容为 AI 理解能力优化 | 文档就是 AI 的可执行指令 |
| **工具实现** | 用代码 (TypeScript/Python) 实现 | 用 Markdown 描述让 AI "执行" |
| **AI 角色** | 理解需求 → 调用工具 → 处理结果 | 直接解释 Markdown 执行任务 |

**核心原则**：
- 文档使用 YAML Frontmatter 存储结构化元数据（AI 易解析）
- 文档使用 summary/tags 字段辅助 AI 快速匹配（语义优化）
- **功能用代码实现**，存放在 `src/` 目录
- AI 通过 CLI 工具或 API 调用代码实现的功能

## 核心原则

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Document is Truth** | 工作流状态存在文档中，而非 AI 记忆 |
| 2 | **Dependency First** | 先分析依赖，再确定范围 |
| 3 | **Planning First** | R/D 阶段使用 extended thinking |
| 4 | **Gate Check** | 阶段转换需满足门控条件 |
| 5 | **AC Driven** | 验收标准是唯一判定依据 |

## 工作流规范

**详细流程规范请参阅**: `.claude/steering/workflow.md`

**核心流程 (R-D-C-T)**:
```
R (Requirements) → D (Design) → C (Coding) → T (Testing) → Done
```

**关键约束**:
- 禁止跳阶段：未完成 R 阶段不得进入 D
- 状态同步：每次阶段完成必须更新文档 `status` 字段
- 确认机制：阶段转换前必须询问用户确认

## 目录结构 (三层分离架构)

> 详见 ADR-003: `docs/architecture/adr/ADR-003-directory-structure-separation.md`

| Layer | Path | Description | Modify When |
|-------|------|-------------|-------------|
| **运行态** | `.solodevflow/` | 运行时状态、索引缓存 | 自动生成 |
| **框架规范** | `.claude/steering/` | 工作流规范 | 流程优化时 |
| **框架规范** | `.claude/skills/` | 技能定义 | 新增/修改技能 |
| **产品知识** | `docs/product_context.md` | 全局注册表 | 新增 Domain |
| **产品知识** | `docs/requirements/<domain>/` | 业务需求真理 | R 阶段 |
| **产品知识** | `docs/design/<domain>/` | 技术设计 | D 阶段 |
| **产品知识** | `docs/architecture/` | 架构决策 | 架构变更时 |
| **代码** | `src/` | 代码实现 | C 阶段 |

## 行为约束

- **Metadata First**: 读取任何 Markdown 之前，先解析其 YAML Frontmatter
- **Domain Routing**: 新增 Domain 必须同步更新 `docs/product_context.md` 中的 `domains` 字段
- **Cross-Domain**: 遇到跨 Domain 需求，优先分析依赖
