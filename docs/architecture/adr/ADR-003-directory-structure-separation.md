---
id: ADR-003
title: 目录结构三层分离
status: accepted
date: 2026-01-03
deciders: [Human, AI]
---

# ADR-003: 目录结构三层分离

## Status

**Accepted**

## Context

在研究 SoloDevFlow2 及业界类似产品（PAELLADOC、claude-code-spec-workflow、llms.txt 标准）后，发现当前 SoloDevFlow3 的目录结构存在职责边界模糊的问题。

**问题**:
- `docs/workflow/WORKFLOW.md` 是**框架执行规范**（告诉 AI 如何工作），但放在 `docs/` 下与产品文档混淆
- `docs/generated/` 是自动生成的索引，属于运行态产物，不应与永久知识资产混放
- 缺乏清晰的"运行态 vs 框架规范 vs 产品文档"分离

**约束**:
- 已有 `.solodevflow/` 作为运行态目录
- 已有 `.claude/skills/` 存放技能定义
- 需要保持与 Claude Code 最佳实践对齐

**参考产品**:
- **SoloDevFlow2**: `.solodevflow/` 存放运行态，`template/` 存放可分发模板
- **PAELLADOC**: 使用 `memory.db` 管理运行时状态
- **Pimzino spec-workflow**: `.claude/steering/` 存放框架引导文档

## Decision

> 我们决定将项目目录划分为三层：**运行态**、**框架规范**、**产品知识**，并将文件按职责归位。

### 三层架构

| 层级 | 目录 | 职责 | Git 策略 |
|------|------|------|----------|
| Layer 1 | `.solodevflow/` | 运行时状态，可随时重建 | 部分 `.gitignore` |
| Layer 2 | `.claude/` | 框架行为规范，定义 AI 如何工作 | 版本控制 |
| Layer 3 | `docs/` | 产品知识资产，项目特定内容 | 严格版本控制 |

### 具体变动

| 原路径 | 新路径 | 理由 |
|--------|--------|------|
| `docs/workflow/WORKFLOW.md` | `.claude/steering/workflow.md` | 这是框架规范，非产品文档 |
| `docs/generated/*` | `.solodevflow/index/*` | 自动生成的索引属于运行态 |

## Options Considered

### Option A: 维持现状

**描述**: 保持 `docs/workflow/` 不变。

**优点**:
- 无需迁移成本

**缺点**:
- 概念混淆：框架规范与产品文档混放
- AI 上下文效率低：加载 docs/ 时包含无关内容

### Option B: 三层分离 (Chosen)

**描述**: 按职责将文件归类到三个独立层级。

**优点**:
- 清晰的责任边界
- 与业界最佳实践对齐（Pimzino 的 `.claude/steering/`）
- 优化 AI 上下文加载
- 运行态可重建，不污染 Git 历史

**缺点**:
- 一次性迁移成本
- 需要更新 CLAUDE.md 中的路径引用

## Consequences

### Positive

- **认知负担降低**：目录名即职责，无需猜测文档性质
- **Git 历史干净**：运行态变更不污染版本历史
- **AI Token 效率提升**：按需加载对应层级
- **框架可独立升级**：`.claude/` 层可单独更新

### Negative

- 需要修改 CLAUDE.md 中的工作流引用路径

### Mitigation

- 本次 ADR 实施时同步更新所有路径引用
- 在 CLAUDE.md 中明确三层结构说明

## References

- [PAELLADOC GitHub](https://github.com/jlcases/paelladoc)
- [Pimzino claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow)
- [llms.txt Specification](https://llmstxt.org/)
- [Claude Code Best Practices - Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
