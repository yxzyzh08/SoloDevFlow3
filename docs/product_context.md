---
product_name: SoloDevFlow 3.0
version: 0.2.0
status: in-development
last_updated: 2026-01-14

# 领域注册表
domains:
  - id: CoreEngine
    description: CLI、Skill 调度、Hooks
    path: docs/requirements/CoreEngine
  - id: DocSystem
    description: 文档解析、依赖分析
    path: docs/requirements/DocSystem

# 技术栈
tech_stack:
  - Language: TypeScript
  - Runtime: Claude Code (Native)
  - Format: Markdown + YAML Frontmatter
---

# Product Vision

## 重新定位 (v0.2.0)

> **SoloDevFlow 不是 "工作流框架"，而是 Claude Code 的项目管理增强。**

### 与 Claude Code 的关系

| Claude Code 原生 | SoloDevFlow 增强 |
|-----------------|-----------------|
| CLAUDE.md | R-D-C-T 工作流规范 |
| Skills 系统 | 4 阶段专用 Skills |
| Subagents | (利用，不重复) |
| Plan Mode | 门控机制 + 状态管理 |
| (无) | **Task Manager** ✨ |
| (无) | **依赖图分析** ✨ |
| (无) | **Feature 状态机** ✨ |

### 核心差异化

| 能力 | 说明 |
|------|------|
| **Task Manager** | 结构化任务管理，依赖追踪 |
| **依赖图** | Feature 间依赖可视化 |
| **门控机制** | 阶段验证，确保流程完整 |
| **R-D-C-T 规范** | 标准化开发流程 |

## 核心原则

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Document is Truth** | 文档是系统状态唯一来源 |
| 2 | **Complement, Not Compete** | 增强 Claude Code，不重复造轮子 |
| 3 | **Progressive Disclosure** | 渐进式加载，防止 Token 爆炸 |
| 4 | **Simplicity First** | 5 状态 > 9 状态，简化优先 |

## 目标用户

- 使用 Claude Code 的个人开发者
- 需要项目管理能力的复杂项目
- 需要审计追踪的团队项目

## 变更日志

- v0.2.0: 重新定位，简化状态机，增加 Hooks 支持
- v0.1.0: 初始化项目结构