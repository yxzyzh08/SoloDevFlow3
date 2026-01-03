---
id: des-workflow-orchestration
type: design
domain: CoreEngine
status: draft
created: 2026-01-02
requirement: docs/requirements/CoreEngine/feat-workflow-orchestration.md
depends-on:
  - feat-sdf-design
  - feat-sdf-test
  - feat-doc-indexer
  - feat-dependency-graph
architecture_aligned: true
adr_created: []
---

# Workflow Orchestration - Technical Design

> 技术设计文档：定义 R-D-C-T 工作流编排系统的实现方案。

## 1. Design Overview

### 1.1 Problem Statement

当前 SoloDevFlow 面临以下问题：

1. **职责混杂**: CLAUDE.md 同时承载了 AI 身份、核心原则、工作流规范，文件过大且修改频繁
2. **规范分散**: R-D-C-T 工作流的详细定义分散在多个 Skill 中，缺少统一参考
3. **门控不完整**: 各阶段的门控条件缺少统一定义和检查机制
4. **命令缺乏入口**: 已有 5 个 commands，但缺少统一的工作流入口

### 1.2 Solution Approach

**分层架构方案**: 将工作流相关内容拆分为三层文档体系：

```
Layer 1: CLAUDE.md (宪法纲要)
├── 核心身份定义
├── AI-First 原则
├── 5 条核心约束
└── 引用 → WORKFLOW.md

Layer 2: WORKFLOW.md (流程法典)
├── 完整状态机定义
├── 各阶段详细规范
├── 全部门控条件
├── Backlog 机制
└── 命令快速参考

Layer 3: Skills (执行能力)
├── sdf-analyze/ → R 阶段
├── sdf-design/  → D 阶段
└── sdf-test/    → T 阶段
```

### 1.3 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 文档分层 | 3 层架构 | 职责分离，修改影响最小化 |
| 规范位置 | .claude/steering/ | 与 docs/ 其他规范文档一致 |
| 门控定义 | 集中在 WORKFLOW.md | 便于查阅和维护 |
| CLAUDE.md 精简 | 保留身份 + 原则 + 引用 | 保持稳定，减少修改 |

## 2. Architecture Alignment

### 2.1 Reused Components

| Component | How Used |
|-----------|----------|
| sdf-analyze Skill | R 阶段执行能力，保持不变 |
| sdf-design Skill | D 阶段执行能力，保持不变 |
| sdf-test Skill | T 阶段执行能力，保持不变 |
| doc-indexer CLI | /status 命令的 Feature 扫描 |
| dependency-graph CLI | /next 命令的门控检查 |
| 5 个 Commands | /analyze, /status, /next, /ac, /backlog |

### 2.2 New Components

| Component | Location | Description |
|-----------|----------|-------------|
| WORKFLOW.md | .claude/steering/workflow.md | R-D-C-T 流程规范文档 |
| CLAUDE.md (精简版) | CLAUDE.md | 精简后的核心身份文档 |

### 2.3 Interface Consistency Check

- [x] 本 Feature 不涉及代码接口
- [x] 文档结构与现有 docs/ 风格一致
- [x] 命令引用保持向后兼容

## 3. Detailed Design

### 3.1 Module: WORKFLOW.md

**职责**: 定义 R-D-C-T 工作流的完整规范

**文档结构**:

```markdown
# SoloDevFlow Workflow Specification

## 1. Overview
- 工作流总览图
- 与 Claude 官方最佳实践映射

## 2. State Machine
- 完整状态定义
- 状态转换图

## 3. Phase Specifications
### 3.1 Phase R: Requirements
- 目标、触发、输入、输出
- Skill: sdf-analyze
- 门控条件

### 3.2 Phase D: Design
- 目标、触发、输入、输出
- Skill: sdf-design
- 门控条件

### 3.3 Phase C: Coding
- 目标、触发、输入、输出
- 门控条件

### 3.4 Phase T: Testing
- 目标、触发、输入、输出
- Skill: sdf-test
- 门控条件

## 4. Gate Conditions
- R→D Gate
- D→C Gate
- C→T Gate
- T→Done Gate

## 5. Backlog Mechanism
- 需求池机制
- 操作命令

## 6. Command Reference
- /analyze
- /status
- /next
- /ac
- /backlog
```

**实现要点**:
- 使用 Mermaid 状态图
- 每个门控条件包含检查方法
- 命令参考链接到 .claude/commands/

### 3.2 Module: CLAUDE.md (精简版)

**职责**: 定义 AI 核心身份和基本原则

**文档结构**:

```markdown
# SoloDevFlow 3.0 - Project Memory

## 核心身份
你正在运行 SoloDevFlow 3.0 框架。这是一个 **AI-First** 的开发体系。
**你的最高准则：Document is Truth (文档即真理)。**

## AI-First 定义
[保留现有内容]

## 核心原则
1. Document is Truth
2. Dependency First
3. Planning First
4. Gate Check
5. AC Driven

## 工作流规范
详细流程规范请参阅: `.claude/steering/workflow.md`

## 目录结构与权限
[保留现有 Truth Schema]

## 行为约束
[保留现有约束]
```

**实现要点**:
- 删除详细的状态机定义
- 删除详细的阶段规范
- 添加对 WORKFLOW.md 的引用
- 保持文件简洁稳定

## 4. Integration

### 4.1 Dependency Integration

| Dependency | Interface Used | Purpose |
|------------|----------------|---------|
| sdf-analyze | SKILL.md 定义 | R 阶段执行，WORKFLOW.md 引用 |
| sdf-design | SKILL.md 定义 | D 阶段执行，WORKFLOW.md 引用 |
| sdf-test | SKILL.md 定义 | T 阶段执行，WORKFLOW.md 引用 |
| doc-indexer | CLI: status | 支持 /status 命令 |
| dependency-graph | CLI: next | 支持 /next 门控检查 |

### 4.2 Document Relationships

```
CLAUDE.md
    │
    └──▶ .claude/steering/workflow.md
              │
              ├──▶ .claude/skills/sdf-analyze/
              ├──▶ .claude/skills/sdf-design/
              ├──▶ .claude/skills/sdf-test/
              │
              └──▶ .claude/commands/
                    ├── analyze.md
                    ├── status.md
                    ├── next.md
                    ├── ac.md
                    └── backlog.md
```

## 5. Test Strategy

### 5.1 Document Verification

由于此 Feature 主要是文档，验证方法：

| AC | Method | Verification |
|----|--------|--------------|
| WORKFLOW.md 存在 | Documentation | Glob 检查文件存在 |
| 状态机定义完整 | Code Review | 检查包含所有状态 |
| 门控条件完整 | Code Review | 检查包含 4 个门控 |
| CLAUDE.md 精简 | Code Review | 检查删除详细规范 |
| 引用关系正确 | Manual | 验证链接可访问 |

### 5.2 Integration Verification

- 执行 /status 命令验证正常
- 执行 /next 命令验证门控检查
- 验证 Skills 可正常触发

## 6. Trade-offs & Alternatives

### 6.1 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **3 层分离** | CLAUDE + WORKFLOW + Skills | 职责清晰，修改隔离 | 需要维护多个文件 |
| 2 层分离 | CLAUDE + Skills | 文件少 | CLAUDE.md 仍较大 |
| 全集中 | 全部在 CLAUDE.md | 单一入口 | 文件过大，修改频繁 |

### 6.2 Decision Rationale

选择 **3 层分离** 方案，因为：

1. **稳定性**: CLAUDE.md 保持稳定，仅在核心原则变更时修改
2. **可维护性**: WORKFLOW.md 专注流程，便于迭代优化
3. **模块化**: Skills 独立演进，不影响规范文档
4. **可查阅性**: WORKFLOW.md 作为单一参考入口

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 文档同步问题 | Medium | Medium | 在 WORKFLOW.md 中使用引用而非复制 |
| 用户找不到规范 | Low | Medium | CLAUDE.md 明确引用 WORKFLOW.md |
| Skills 与规范不一致 | Medium | High | T 阶段验证 Skills 符合规范 |

## 8. Implementation Checklist

### Phase 1: WORKFLOW.md 创建

```
- [ ] 创建 .claude/steering/ 目录
- [ ] 创建 WORKFLOW.md 基础结构
- [ ] 编写 Overview 和状态机
- [ ] 编写 4 个阶段规范
- [ ] 编写 4 个门控条件
- [ ] 编写 Backlog 机制
- [ ] 编写 Command Reference
```

### Phase 2: CLAUDE.md 精简

```
- [ ] 备份现有 CLAUDE.md
- [ ] 删除详细工作流内容
- [ ] 添加 WORKFLOW.md 引用
- [ ] 验证核心内容保留完整
```

### Phase 3: 验证

```
- [ ] 验证文档链接正确
- [ ] 验证命令正常工作
- [ ] 验证 Skills 可触发
```

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| CLAUDE.md 行数 | < 100 行 |
| WORKFLOW.md 完整性 | 覆盖 100% 门控条件 |
| 文档链接有效性 | 100% 可访问 |

---

*Design: workflow-orchestration*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: draft*
