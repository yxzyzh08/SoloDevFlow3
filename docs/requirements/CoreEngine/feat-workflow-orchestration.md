---
id: feat-workflow-orchestration
type: feature
domain: CoreEngine
status: done
priority: critical
created: 2026-01-02
summary: 将 AI 最佳实践与文档驱动开发融合为 R-D-C-T 统一工作流，深挖依赖链确保端到端完整性
tags: [workflow, orchestration, R-D-C-T, ai-first, dependency-analysis]

# ===== Feature Kind =====
feature_kind: specification

dependencies:
  requires:
    - feat-sdf-design       # D 阶段设计能力 (analyzing)
    - feat-sdf-test         # T 阶段测试能力 (analyzing)
    - feat-doc-indexer      # 文档索引器 (done)
    - feat-dependency-graph # 依赖图分析器 (done)
  blocks: []
analyzed: true  # 所有依赖已分析完成
---

# Workflow Orchestration

> SoloDevFlow 的心脏：将 AI 最佳实践与文档驱动开发融合为统一工作流，深挖依赖链确保端到端完整性。

## 1. Requirements

### 1.1 Background

Claude CLI 官方最佳实践表明：
- **"Planning First 显著提升效果"** — 没有规划，AI 倾向于直接编码
- **"CLAUDE.md 是 Agent 的宪法"** — 需要精心打磨的核心指令
- **"Extended Thinking 提升复杂决策质量"** — think < think hard < ultrathink

SoloDevFlow 的 **R-D-C-T 流程** 与官方的 **Explore-Plan-Code-Commit** 模式高度契合：

```
Official Mode      SoloDevFlow Mapping
─────────────────────────────────────
Explore      →    Requirements (探索需求空间 + 依赖分析)
Plan         →    Design (设计实现方案)
Code         →    Coding (编码实现)
Commit       →    Testing (验证 + 提交)
```

本 Feature 的目标是**将这两套方法论融合**，并增加**依赖深挖**和**需求池管理**机制。

### 1.2 Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Document is Truth** | 工作流状态存在文档中，而非 AI 记忆 | YAML Frontmatter 状态字段 |
| **Dependency First** | 先分析依赖，再确定范围 | 深度依赖分析流程 |
| **Backlog Driven** | 发现的新需求进入需求池 | `docs/requirements/backlog.md` |
| **Complete Before Design** | 所有依赖分析完成后才能进入 D | 需求池为空作为门控 |
| **Progressive Disclosure** | 只加载当前阶段所需上下文 | 按阶段加载文档 |

### 1.3 State Machine

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

## 2. Specification

### 2.1 Phase R: Requirements

| Item | Content |
|------|---------|
| **Goal** | 将模糊需求转化为结构化文档，**深挖完整依赖链** |
| **Trigger** | 用户描述新功能/Bug/变更 |
| **Input** | 用户自然语言 + 现有上下文 + **需求池状态** |
| **Output** | Feature 文档 + **Backlog 更新** |
| **Tool** | Skill: `sdf-analyze` (增强版) |
| **Thinking** | `think hard` (深度依赖分析) |
| **AC** | Feature 文档 + 依赖分析完成 + 新依赖进入 Backlog |

#### Dependency Analysis Dimensions

| Type | Check Question | Example |
|------|----------------|---------|
| **功能依赖** | 需要什么现有功能？ | 订单创建 → 需要购物车 |
| **数据依赖** | 需要什么数据模型？ | 用户登录 → 需要 User 模型 |
| **基础设施** | 需要什么底层能力？ | 文件上传 → 需要存储服务 |
| **外部依赖** | 需要什么第三方服务？ | 支付 → 需要支付网关 API |

### 2.2 Backlog Mechanism

```
docs/requirements/backlog.md
├── 待分析队列 (pending)
├── 已分析完成 (completed)
└── 统计信息
```

**Backlog Operations**：
- `/backlog list` - 查看队列
- `/backlog add` - 手动添加
- `/backlog analyze` - 从池中取出分析
- `/backlog stats` - 统计和门控检查

### 2.3 R → D Gate Conditions

```markdown
### R → D Transition (必须全部满足)

Basic Conditions:
- [ ] Feature 文档已创建
- [ ] Frontmatter 完整 (id, type, status, priority, dependencies)
- [ ] 需求描述清晰
- [ ] 验收标准已定义 (至少 1 条)

Dependency Conditions:
- [ ] 依赖分析已完成 (analyzed: true)
- [ ] 所有前置依赖已识别并记录
- [ ] 新发现的依赖已加入 Backlog
- [ ] **需求池为空** 或 仅剩无关低优先级项
- [ ] 用户确认 "可以进入 Design 阶段"
```

### 2.4 Status Definitions

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

### 2.5 Other Phases

#### Phase D: Design

| Item | Content |
|------|---------|
| **Goal** | 产出可执行的技术方案 |
| **Trigger** | R 阶段完成 + Backlog 为空 + 用户确认 |
| **Input** | Feature 需求文档 + 代码库结构 |
| **Output** | `docs/design/<domain>/feat-<feature>.md` |
| **Tool** | Skill: `sdf-design` (待建) |
| **Thinking** | `think hard` (深度规划) |

#### Phase C: Coding

| Item | Content |
|------|---------|
| **Goal** | 实现设计方案 |
| **Trigger** | D 阶段完成 + 用户确认 |
| **Input** | 设计文档 + 需求文档 |
| **Output** | `src/` 代码变更 |
| **Tool** | Edit, Write, Bash |

#### Phase T: Testing

| Item | Content |
|------|---------|
| **Goal** | 验证实现满足需求 |
| **Trigger** | C 阶段完成 |
| **Input** | 代码变更 + 需求 AC |
| **Output** | 测试报告 + 状态更新 |
| **Tool** | Skill: `sdf-test` (待建) |

## 3. Dependency Analysis

> 此部分必须在进入 Design 阶段前完成

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| **feat-sdf-design** | Feature | **analyzing** | D 阶段核心能力 |
| **feat-sdf-test** | Feature | **analyzing** | T 阶段核心能力 |
| **feat-doc-indexer** | Feature | **done** | /status 需要扫描 Feature |
| **feat-dependency-graph** | Feature | **done** | R→D 门控需要依赖计算 |
| sdf-analyze Skill | Feature | Exists | R 阶段已实现 |
| Commands | Feature | Exists | /status, /next, /ac, /backlog |

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| 所有后续 Feature | Process | High | 定义了整个开发流程 |
| CLAUDE.md | Config | Medium | 需要更新工作流约束 |
| DocSystem | Cross-Domain | Medium | 需要 DocSystem 提供文档解析能力 |

### 3.3 New Backlog Items

| Backlog ID | Description | Domain | Priority |
|------------|-------------|--------|----------|
| backlog-001 | sdf-design Skill (D 阶段设计能力) | CoreEngine | Critical |
| backlog-002 | sdf-test Skill (T 阶段测试验收) | CoreEngine | Critical |
| backlog-003 | 文档索引器 (Feature 扫描与状态统计) | DocSystem | High |
| backlog-004 | 依赖图分析器 (依赖关系计算与门控检查) | DocSystem | High |

### 3.4 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在或已加入 Backlog
- [x] 后续影响已评估
- [x] **需求池已清空** ✅

**Status**: Ready for Design (等待 sdf-design 和 sdf-test 完成)

### 3.5 Dependency Graph

```
                    ┌──────────────────────────┐
                    │  workflow-orchestration  │
                    │      status: analyzing   │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                                     │
              ▼                                     ▼
       ┌─────────────┐                       ┌─────────────┐
       │ sdf-design  │                       │  sdf-test   │
       │  analyzing  │                       │  analyzing  │
       │  Critical   │                       │  Critical   │
       └──────┬──────┘                       └──────┬──────┘
              │                                     │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  DocSystem Features │
                      ├─────────────────────┤
                      │ feat-doc-indexer ✅ │
                      │ feat-dependency-    │
                      │ graph ✅            │
                      └─────────────────────┘
```

## 4. Technical Design

### 4.1 Architecture: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    文档层次结构                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CLAUDE.md (宪法纲要)                                        │
│  ├── 核心身份                                                │
│  ├── AI-First 定义                                          │
│  ├── 核心原则 (5 条)                                         │
│  └── @see .claude/steering/workflow.md                         │
│                                                              │
│  .claude/steering/workflow.md (流程法典) ← 核心交付物           │
│  ├── R-D-C-T 完整状态机                                      │
│  ├── 各阶段详细定义                                          │
│  ├── 全部门控条件                                            │
│  ├── Backlog 机制                                           │
│  └── 命令快速参考                                            │
│                                                              │
│  .claude/skills/ (执行能力)                                  │
│  ├── sdf-analyze/  → R 阶段执行                              │
│  ├── sdf-design/   → D 阶段执行                              │
│  └── sdf-test/     → T 阶段执行                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**职责分离原则**:

| 文档 | 职责 | 修改频率 |
|------|------|----------|
| **CLAUDE.md** | AI 身份 + 核心原则 | 低（稳定） |
| **WORKFLOW.md** | 流程规范 + 门控条件 | 中（流程优化时） |
| **Skills** | 各阶段执行细节 | 高（功能迭代时） |

### 4.2 Components

```
CLAUDE.md                      ✅ 精简版 (引用 WORKFLOW.md)

.claude/steering/
└── WORKFLOW.md                ○ 流程规范 (核心交付物)

.claude/
├── skills/
│   ├── sdf-analyze/           ✅ R 阶段执行能力
│   ├── sdf-design/            ○ D 阶段执行能力
│   └── sdf-test/              ○ T 阶段执行能力
│
├── commands/
│   ├── analyze.md             ✅ Explicit entry
│   ├── status.md              ✅ Workflow status
│   ├── next.md                ✅ Phase advance
│   ├── ac.md                  ✅ AC check
│   └── backlog.md             ✅ Backlog management
│
docs/requirements/
└── backlog.md                 ✅ Global backlog

src/                           ✅ CLI Tools (TypeScript)
├── doc-indexer/               # Feature 文档索引
├── dependency-graph/          # 依赖图分析
└── index.ts                   # CLI 入口
```

### 4.3 CLI Commands

```bash
cd src
node dist/index.js status              # 显示 Feature 索引
node dist/index.js status --graph      # + 依赖图
node dist/index.js status --order      # + 执行顺序
node dist/index.js status --export     # 导出到 .solodevflow/index/feature-index.md
node dist/index.js next <feature-id>   # R→D 门控检查
node dist/index.js check-cycles        # 循环依赖检测
```

### 4.4 CLAUDE.md 精简方案

CLAUDE.md 保留核心内容，引用 WORKFLOW.md：

```markdown
## 工作流规范

详细流程规范请参阅: `.claude/steering/workflow.md`

核心原则:
- **Document is Truth**: 状态存在文档中
- **Dependency First**: 先分析依赖，再确定范围
- **Planning First**: R/D 阶段使用 extended thinking
- **Gate Check**: 阶段转换需满足门控条件
- **AC Driven**: 验收标准是唯一判定依据
```

## 5. Acceptance Criteria

### AC-1: Workflow Tracking
- [x] Feature 文档 Frontmatter 包含 status 和 dependencies 字段
- [x] status 值符合定义的状态枚举
- [x] 可通过 `/status` 命令查看当前状态

### AC-2: Deep Dependency Analysis
- [x] sdf-analyze Skill 包含依赖分析流程
- [x] Feature 模板包含依赖分析部分
- [x] 依赖分析指南文档已创建

### AC-3: Backlog Mechanism
- [x] `docs/requirements/backlog.md` 已创建
- [x] `/backlog` 命令可管理需求池
- [x] 新发现的依赖可自动/手动加入池

### AC-4: R → D Gate Enhancement
- [x] 阶段转换需检查依赖分析完成
- [x] 阶段转换需检查需求池状态
- [x] 门控条件已文档化

### AC-5: Commands Complete
- [x] `/analyze` - 显式分析入口
- [x] `/status` - 状态查询
- [x] `/next` - 阶段推进
- [x] `/ac` - 验收检查
- [x] `/backlog` - 需求池管理

### AC-6: Workflow Specification Document (NEW)
- [x] `.claude/steering/workflow.md` 已创建
- [x] 包含完整 R-D-C-T 状态机定义
- [x] 包含全部门控条件 (R→D, D→C, C→T, T→Done)
- [x] 包含 Backlog 机制说明
- [x] 包含命令快速参考

### AC-7: CLAUDE.md Separation (NEW)
- [x] CLAUDE.md 精简为核心身份 + 原则
- [x] CLAUDE.md 引用 WORKFLOW.md
- [x] 工作流详细规范从 CLAUDE.md 移至 WORKFLOW.md

## 6. Roadmap

```
Phase 1: Foundation ✅
├── ✅ 增强 sdf-analyze Skill (含依赖分析)
├── ✅ 创建需求池机制
├── ✅ 更新 Feature 模板
└── ✅ 更新 CLAUDE.md 工作流约束

Phase 2: Commands ✅
├── ✅ 创建 /analyze 命令
├── ✅ 创建 /status 命令
├── ✅ 创建 /next 命令
├── ✅ 创建 /ac 命令
└── ✅ 创建 /backlog 命令

Phase 3: Remaining Skills ✅
├── ✅ 创建 sdf-design Skill (D 阶段)
└── ✅ 创建 sdf-test Skill (T 阶段)

Phase 4: Workflow Specification ✅
├── ✅ 创建 .claude/steering/workflow.md
├── ✅ 精简 CLAUDE.md (仅保留身份 + 原则)
└── ✅ 迁移工作流详细规范到 WORKFLOW.md
```

## 7. Design Decisions (内嵌设计)

> 规范类 Feature 的设计内嵌在需求文档中，无需独立设计文档。

### 7.1 Trade-offs & Alternatives

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **3 层分离** (选择) | CLAUDE + WORKFLOW + Skills | 职责清晰，修改隔离 | 需要维护多个文件 |
| 2 层分离 | CLAUDE + Skills | 文件少 | CLAUDE.md 仍较大 |
| 全集中 | 全部在 CLAUDE.md | 单一入口 | 文件过大，修改频繁 |

**Decision Rationale**:
1. **稳定性**: CLAUDE.md 保持稳定，仅在核心原则变更时修改
2. **可维护性**: WORKFLOW.md 专注流程，便于迭代优化
3. **模块化**: Skills 独立演进，不影响规范文档
4. **可查阅性**: WORKFLOW.md 作为单一参考入口

### 7.2 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 文档同步问题 | Medium | Medium | 在 WORKFLOW.md 中使用引用而非复制 |
| 用户找不到规范 | Low | Medium | CLAUDE.md 明确引用 WORKFLOW.md |
| Skills 与规范不一致 | Medium | High | T 阶段验证 Skills 符合规范 |

### 7.3 Success Metrics

| Metric | Target |
|--------|--------|
| CLAUDE.md 行数 | < 100 行 |
| WORKFLOW.md 完整性 | 覆盖 100% 门控条件 |
| 文档链接有效性 | 100% 可访问 |

## 8. References

- [Claude Code Best Practices - Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Code Documentation](https://code.claude.com/docs/en/overview)

---

*Feature: workflow-orchestration*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: done*
*Dependencies Analyzed: true*
*Feature Kind: specification*
