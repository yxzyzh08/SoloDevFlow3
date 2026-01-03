---
id: ADR-001
title: 使用 TypeScript 实现 CLI 工具
status: accepted
date: 2026-01-02
deciders: [Human, AI]
---

# ADR-001: 使用 TypeScript 实现 CLI 工具

## Status

**Accepted**

## Context

SoloDevFlow 需要实现 doc-indexer 和 dependency-graph 功能。有两种实现方式可选：

1. **Skill-Based**: 通过 Claude Skill 的 Markdown 指令实现
2. **Code-Based**: 通过 TypeScript 代码实现

最初误解了 "AI-First" 的含义，认为 Markdown 可以作为可执行指令。经用户澄清：

> "AI-First 并不是说文档就是 AI 的执行指令，而是说文档的结构和内容要适配 AI 的能力，我们的工具还是要用代码实现。"

## Decision

使用 **TypeScript 实现 CLI 工具**，存放在 `src/` 目录。

## Options Considered

### Option A: Skill-Based (Markdown Instructions)

**优点**:
- 无需编译
- 可读性强
- 与文档统一

**缺点**:
- 不可测试
- 性能不可控
- 复杂逻辑难以表达

### Option B: TypeScript CLI (Chosen)

**优点**:
- 类型安全
- 可测试
- 性能可控
- IDE 支持
- 可复用模块

**缺点**:
- 需要编译
- 需要 Node.js 环境

## Consequences

### Positive

- 建立了 `src/` 目录的代码规范
- 定义了 `src/types.ts` 共享类型
- 模块可被其他功能复用
- 支持 `--export` 导出供人工检查

### Negative

- 需要 `npm install` 和 `npm run build`
- Claude Skills 需要调用 CLI 而非直接执行

### Neutral

- AI-First 体现在文档设计，而非代码执行方式

## References

- `src/doc-indexer/` - 文档索引器实现
- `src/dependency-graph/` - 依赖图实现
- `CLAUDE.md` - AI-First 定义澄清
