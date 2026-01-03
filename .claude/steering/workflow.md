---
type: workflow-specification
status: active
version: 1.0.0
last_updated: 2026-01-02
---

# SoloDevFlow Workflow Specification

> R-D-C-T 工作流完整规范。本文档定义了 SoloDevFlow 的核心开发流程。

## 1. Overview

### 1.1 Workflow Mapping

SoloDevFlow 的 R-D-C-T 流程与 Claude 官方最佳实践高度契合：

```
Claude Best Practice    SoloDevFlow Phase    Description
───────────────────────────────────────────────────────────
Explore            →    R (Requirements)     探索需求空间 + 依赖分析
Plan               →    D (Design)           设计实现方案
Code               →    C (Coding)           编码实现
Commit             →    T (Testing)          验证 + 提交
```

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Document is Truth** | 工作流状态存在文档中，而非 AI 记忆 |
| **Dependency First** | 先分析依赖，再确定范围 |
| **Planning First** | R/D 阶段使用 extended thinking |
| **Gate Check** | 阶段转换需满足门控条件 |
| **AC Driven** | 验收标准是唯一判定依据 |

### 1.3 Workflow Diagram

```
                          ┌─────────────┐
                          │   backlog   │ ← 需求池中待分析
                          └──────┬──────┘
                                 │
                                 ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│proposed │───▶│  analyzing  │───▶│  analyzed   │
└─────────┘    │ (深挖依赖)  │    └──────┬──────┘
               └─────────────┘           │
                      │                  │
                      ▼                  │
               ┌─────────────┐           │
               │  New Deps   │──────────▶│
               │  → Backlog  │           │
               └─────────────┘           │
                                         │
                    ┌────────────────────┤
                    │ Backlog Empty?     │
                    ▼                    ▼
            ┌───────────────┐    ┌──────────────────┐
            │ ready-for-    │    │ waiting-deps     │
            │ design        │    │ (等待依赖完成)    │
            └───────┬───────┘    └──────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────────┐
        │    D (Design) → C (Coding) → T (Testing)    │
        └─────────────────────────────────────────────┘
                    │
                    ▼
               ┌──────────┐
               │   done   │
               └──────────┘
```

## 2. State Machine

### 2.1 Status Definitions

| Status | Phase | Meaning |
|--------|-------|---------|
| `backlog` | - | 需求池中，待分析 |
| `proposed` | R | 需求已提出 |
| `analyzing` | R | 深度依赖分析中 |
| `analyzed` | R | 分析完成，检查依赖 |
| `waiting-deps` | R | 等待依赖完成 |
| `ready-for-design` | R | 可进入设计 |
| `designing` | D | 设计方案中 |
| `implementing` | C | 编码实现中 |
| `testing` | T | 测试验收中 |
| `done` | - | 已完成 |
| `blocked` | - | 阻塞 |

### 2.2 Valid Transitions

```
proposed → analyzing → analyzed → ready-for-design → designing
                 │                       ↑
                 └── waiting-deps ───────┘

designing → implementing → testing → done
```

## 3. Phase Specifications

### 3.1 Phase R: Requirements

| Item | Content |
|------|---------|
| **Goal** | 将模糊需求转化为结构化文档，深挖完整依赖链 |
| **Trigger** | 用户描述新功能/Bug/变更 |
| **Input** | 用户自然语言 + 现有上下文 + 需求池状态 |
| **Output** | Feature 文档 + Backlog 更新 |
| **Skill** | `sdf-analyze` |
| **Thinking** | `think hard` (深度依赖分析) |

**Skill Location**: `.claude/skills/sdf-analyze/`

**Key Activities**:
1. 创建 Feature 文档 (`docs/requirements/<domain>/feat-<name>.md`)
2. 分析依赖 (功能/数据/基础设施/外部)
3. 新发现的依赖加入 Backlog
4. 更新依赖状态 (`analyzed: true`)

### 3.2 Phase D: Design

| Item | Content |
|------|---------|
| **Goal** | 产出可执行的技术方案 |
| **Trigger** | R→D 门控通过 + 用户确认 |
| **Input** | Feature 需求文档 + 架构文档 + 代码库结构 |
| **Output** | 设计文档 (`docs/design/<domain>/des-<name>.md`) |
| **Skill** | `sdf-design` |
| **Thinking** | `ultrathink` (深度规划) |

**Skill Location**: `.claude/skills/sdf-design/`

**Key Activities**:
1. 读取架构文档 (`docs/architecture/ARCHITECTURE.md`)
2. 架构一致性检查
3. 分析依赖接口
4. 生成设计文档
5. 更新架构文档 (如有新组件)

### 3.3 Phase C: Coding

| Item | Content |
|------|---------|
| **Goal** | 实现设计方案 |
| **Trigger** | D→C 门控通过 + 用户确认 |
| **Input** | 设计文档 + 需求文档 |
| **Output** | `src/` 代码变更 或 `.claude/skills/` 配置 |
| **Tool** | Edit, Write, Bash (Claude 原生工具) |

**Key Activities**:
1. 按设计文档实现
2. 遵循架构约束 (TypeScript, 类型定义等)
3. 更新状态为 `implementing`

### 3.4 Phase T: Testing

| Item | Content |
|------|---------|
| **Goal** | 验证实现满足需求 (验证确认，非测试发现) |
| **Trigger** | C→T 门控通过 |
| **Input** | 代码变更 + 需求 AC |
| **Output** | 测试报告 (`docs/test-reports/<domain>/test-<name>.md`) + 状态更新 |
| **Skill** | `sdf-test` |

**Skill Location**: `.claude/skills/sdf-test/`

**Key Activities**:
1. C→T 门控检查
2. 运行自动化测试 (如存在)
3. 逐条验证 AC
4. 更新 Feature 文档 AC 复选框
5. T→Done 门控检查
6. 用户确认后更新状态为 `done`

## 4. Gate Conditions

### 4.1 R→D Gate

进入 Design 阶段必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| feature-exists | Glob 检查文件 | `docs/requirements/<domain>/feat-<name>.md` 存在 |
| frontmatter-complete | Read + 解析 | id, type, status, priority, dependencies 完整 |
| ac-defined | Read Feature 文档 | AC 部分非空 (至少 1 条) |
| deps-analyzed | 检查 `analyzed` 字段 | `analyzed: true` |
| backlog-clear | Read backlog.md | 需求池为空或仅剩无关项 |
| user-confirmed | 询问用户 | 用户确认进入 D 阶段 |

**检查命令**: `/next <feature-id>`

### 4.2 D→C Gate

进入 Coding 阶段必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| design-exists | Glob 检查文件 | `docs/design/<domain>/des-<name>.md` 存在 |
| design-approved | 用户确认 | 用户明确同意设计方案 |
| architecture-aligned | 检查设计文档 | Checklist 已完成 |
| adr-created | 检查 ADR | 如需要，ADR 已创建 |

### 4.3 C→T Gate

进入 Testing 阶段必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| code-complete | Glob 检查相关文件 | 预期文件存在 |
| ac-defined | Read Feature 文档 | AC 部分非空 |
| design-followed | Read 设计文档比对 | 实现与设计一致 |

### 4.4 T→Done Gate

完成 Feature 必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| all-ac-pass | 统计验证结果 | 100% AC 通过 |
| no-blockers | 检查严重问题 | 无阻塞项 |
| user-approved | 询问用户 | 用户确认 APPROVE |

## 5. Backlog Mechanism

### 5.1 Backlog File

**Location**: `docs/requirements/backlog.md`

**Structure**:
```markdown
---
type: backlog
last_updated: YYYY-MM-DD
---

# Backlog

## Pending (待分析)

| ID | Description | Domain | Priority | Added |
|----|-------------|--------|----------|-------|
| backlog-001 | xxx | CoreEngine | High | 2026-01-02 |

## Completed (已完成)

| ID | Feature | Completed |
|----|---------|-----------|
| backlog-001 | feat-xxx | 2026-01-02 |
```

### 5.2 Backlog Operations

| Command | Action |
|---------|--------|
| `/backlog list` | 查看待处理队列 |
| `/backlog add` | 手动添加项目 |
| `/backlog analyze` | 从池中取出分析 |
| `/backlog stats` | 统计和门控检查 |

## 6. Command Reference

### 6.1 /analyze

**Purpose**: 显式进入 R 阶段分析

**Location**: `.claude/commands/analyze.md`

**Usage**:
```
/analyze <feature-description>
```

### 6.2 /status

**Purpose**: 查看 Feature 状态

**Location**: `.claude/commands/status.md`

**Usage**:
```
/status              # 显示所有 Feature
/status --graph      # 显示依赖图
/status --order      # 显示执行顺序
```

**CLI Support**:
```bash
node dist/index.js status
node dist/index.js status --graph
node dist/index.js status --order
```

### 6.3 /next

**Purpose**: 阶段推进 + 门控检查

**Location**: `.claude/commands/next.md`

**Usage**:
```
/next <feature-id>   # 检查并推进到下一阶段
```

**CLI Support**:
```bash
node dist/index.js next <feature-id>
```

### 6.4 /ac

**Purpose**: 验收标准检查

**Location**: `.claude/commands/ac.md`

**Usage**:
```
/ac <feature-id>     # 检查 AC 完成情况
```

### 6.5 /backlog

**Purpose**: 需求池管理

**Location**: `.claude/commands/backlog.md`

**Usage**:
```
/backlog list        # 查看队列
/backlog add         # 添加项目
/backlog analyze     # 取出分析
/backlog stats       # 统计信息
```

## 7. Thinking Level Guide

| Phase | Default Thinking | When to Upgrade |
|-------|------------------|-----------------|
| R | `think hard` | 复杂依赖链 → `ultrathink` |
| D | `ultrathink` | 简单设计 → `think hard` |
| C | 标准 | 复杂实现 → `think hard` |
| T | `think hard` | 标准验证 → 标准模式 |

## 8. Feature Kind & Design Documents

### 8.1 Feature Kind 分类

| Kind | 定义 | 产出 | 示例 |
|------|------|------|------|
| `code` | 需要编写代码的功能 | `src/` 代码 | doc-indexer, dependency-graph |
| `specification` | 定义规范或 Skill | SKILL.md 文件 | sdf-analyze, sdf-design, sdf-test, sdf-ask |

### 8.2 设计文档策略

| Feature Kind | 需要独立设计文档? | 原因 |
|--------------|------------------|------|
| `code` | **是** | 需求 → 设计 → 代码，设计是桥梁 |
| `specification` | **否** | 需求文档的 Specification 部分即设计 |

**规范类 Feature 的设计内嵌原则**:

> 对于 `specification` 类型的 Feature，其需求文档 (feat-xxx.md) 中的 **Section 2. Specification** 已包含完整的技术设计：
> - Skill Structure (目录结构)
> - Workflow (工作流)
> - Data Structures (数据结构)
> - Output Format (输出规范)
>
> 因此**无需创建独立的 des-xxx.md 设计文档**，避免重复维护。

### 8.3 Frontmatter 标记

```yaml
# 代码类 Feature
feature_kind: code

# 规范类 Feature
feature_kind: specification
```

### 8.4 D 阶段行为差异

| Feature Kind | D 阶段行为 |
|--------------|-----------|
| `code` | 创建 `docs/design/<domain>/des-<name>.md` |
| `specification` | 直接在需求文档 Specification 部分完善设计，无独立设计文档 |

### 8.5 决策依据

此策略基于以下最佳实践：

1. **Claude 官方 Skill 最佳实践**: "Concise is key" - 避免不必要的文档
2. **Document is Truth**: 单一数据源原则，减少重复
3. **实际价值分析**: 规范类 Feature 的设计文档与需求文档 Specification 内容重叠度 > 90%

**参考**: [Claude Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

## 9. Quick Reference

### 9.1 Phase Flow

```
R → D → C → T → Done
```

### 9.2 Key Files

| Type | Pattern |
|------|---------|
| Requirements | `docs/requirements/<domain>/feat-<name>.md` |
| Design | `docs/design/<domain>/des-<name>.md` |
| Test Report | `docs/test-reports/<domain>/test-<name>.md` |
| Backlog | `docs/requirements/backlog.md` |

### 9.3 Skills

| Phase | Skill |
|-------|-------|
| R | `.claude/skills/sdf-analyze/` |
| D | `.claude/skills/sdf-design/` |
| T | `.claude/skills/sdf-test/` |

---

*Workflow Specification v1.0.0*
*Last Updated: 2026-01-02*
*Maintainer: Human + AI Collaboration*
