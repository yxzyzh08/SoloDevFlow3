---
id: feat-sdf-code
type: feature
domain: CoreEngine
status: done
priority: critical
created: 2026-01-11

# ===== Semantic Fields (AI-First) =====
summary: "C 阶段编码能力 - 根据设计文档实现代码，追踪变更并准备测试验收"
tags: [skill, coding, workflow, C-phase, implementation]

# ===== Feature Kind =====
feature_kind: specification

# ===== Dependency Fields =====
dependencies:
  requires:
    - feat-sdf-design         # 设计文档输入
    - feat-doc-indexer        # 获取 Feature 元数据
    - feat-dependency-graph   # 门控检查
  blocks: []
analyzed: true
---

# SDF-Code Skill

> C 阶段编码能力 - 根据设计文档实现代码，追踪变更并准备测试验收。

## 1. Requirements

### 1.1 Background

SoloDevFlow 的 R-D-C-T 工作流中，C (Coding) 阶段是**唯一产出代码**的阶段。

**当前问题**：
- R 阶段有 `sdf-analyze` Skill ✅
- D 阶段有 `sdf-design` Skill ✅
- **C 阶段无专门 Skill** ❌ ← 流程缺口
- T 阶段有 `sdf-test` Skill ✅

C 阶段被当作"Claude 原生能力"处理，导致：
1. **无前置验证** - 不检查设计文档是否 approved
2. **无结构化流程** - 实现顺序随意
3. **无变更追踪** - 不知道改了哪些文件
4. **无状态管理** - D→C、C→T 门控缺失

### 1.2 User Stories

作为**开发者**，我希望**在进入 C 阶段时获得结构化的实现指导**，以便**按设计方案高效完成编码**。

作为**AI 助手**，我需要**明确的编码流程和变更追踪机制**，以便**系统性地完成从设计到代码的转换**。

### 1.3 Scope

**包含**：
- D→C 门控检查
- 设计文档解析与实现计划生成
- 代码实现指导流程
- 变更文件追踪
- C→T 门控准备

**不包含**：
- 自动代码生成（AI 原生能力）
- 代码审查（可选的独立流程）
- 单元测试编写（设计文档中定义，C 阶段实现）

## 2. Specification

### 2.1 Skill Structure

```
.claude/skills/sdf-code/
├── SKILL.md                 # 核心指令
├── templates/
│   └── change-log.md        # 变更记录模板
└── references/
    └── coding-guidelines.md # 编码规范参考
```

### 2.2 Change Log Template

```markdown
---
id: changelog-<name>
type: change-log
feature: feat-<name>
domain: <DomainId>
date: YYYY-MM-DD
status: in-progress | completed
---

# <Feature> - Change Log

## 1. Implementation Summary

| Item | Value |
|------|-------|
| Design Doc | docs/design/<domain>/des-<name>.md |
| Start Time | YYYY-MM-DD HH:MM |
| End Time | YYYY-MM-DD HH:MM |
| Status | in-progress / completed |

## 2. Files Changed

| File | Action | Description |
|------|--------|-------------|
| src/xxx/index.ts | Created | 主模块入口 |
| src/xxx/types.ts | Created | 类型定义 |
| src/xxx/utils.ts | Modified | 添加辅助函数 |

## 3. Implementation Notes

### 3.1 Design Deviations (If Any)
- None / 列出与设计的偏差及原因

### 3.2 Technical Decisions
- 列出实现过程中的技术决策

## 4. Ready for Testing

- [ ] 所有设计模块已实现
- [ ] 代码符合编码规范
- [ ] 基础测试已编写（如设计要求）
- [ ] 变更记录已完成
```

### 2.3 Coding Workflow

```
Input: Feature ID (e.g., feat-xxx)

┌─────────────────────────────────────────────────────────────┐
│ Step 1: D→C Gate Check                                       │
│ ─────────────────────────────────────────────────────────── │
│ ├── 检查设计文档是否存在                                     │
│ ├── 检查设计文档 status 是否为 approved                      │
│ ├── 检查 Architecture Alignment Checklist 是否完成           │
│ └── 如未通过，提示返回 D 阶段                                │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Load Context                                         │
│ ─────────────────────────────────────────────────────────── │
│ ├── 读取设计文档 (docs/design/<domain>/des-<name>.md)        │
│ ├── 读取需求文档 (获取 AC 列表)                              │
│ ├── 读取架构文档 (获取代码规范)                              │
│ └── 创建变更记录文档                                         │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Generate Implementation Plan                         │
│ ─────────────────────────────────────────────────────────── │
│ ├── 从设计文档提取模块列表                                   │
│ ├── 确定实现顺序（依赖优先）                                 │
│ ├── 列出每个模块的关键实现点                                 │
│ └── 展示计划，请求用户确认                                   │
│                                                              │
│ Thinking: think hard (需要理解设计并规划)                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Implement Modules                                    │
│ ─────────────────────────────────────────────────────────── │
│ ├── 按计划顺序实现每个模块                                   │
│ ├── 每完成一个模块，更新变更记录                             │
│ ├── 遵循设计文档中的接口定义                                 │
│ └── 遵循架构文档中的编码规范                                 │
│                                                              │
│ Thinking: 标准模式 (执行阶段)                                │
│ Tools: Edit, Write, Bash (npm install, etc.)                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Verify & Prepare for Testing                         │
│ ─────────────────────────────────────────────────────────── │
│ ├── 运行 lint/type check (如有)                              │
│ ├── 确认所有模块已实现                                       │
│ ├── 完成变更记录                                             │
│ ├── 更新 Feature status: implementing → testing              │
│ └── 输出 C→T 门控检查结果                                    │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Gate Conditions

#### D→C Gate

| Condition | Check | Description |
|-----------|-------|-------------|
| design-exists | `docs/design/<domain>/des-<name>.md` 存在 | 设计文档已创建 |
| design-approved | status = approved 或用户确认 | 设计已获批准 |
| architecture-aligned | Checklist 完成 | 架构对齐检查通过 |

**Gate Check 输出示例**:

```
=== D→C Gate Check: feat-xxx ===

Conditions:
  [PASS] 设计文档已创建 (docs/design/CoreEngine/des-xxx.md)
  [PASS] 设计已获批准 (status: approved)
  [PASS] 架构对齐检查完成 (checklist: 8/8)

Result: CAN PROCEED to Coding phase
```

#### C→T Gate

| Condition | Check | Description |
|-----------|-------|-------------|
| code-complete | 所有设计模块已实现 | 变更记录确认 |
| lint-pass | lint/type check 通过 | 代码质量基线 |
| change-log-complete | 变更记录已完成 | 追踪信息完整 |
| user-confirmed | 用户确认 | 人工确认可进入测试 |

**Gate Check 输出示例**:

```
=== C→T Gate Check: feat-xxx ===

Conditions:
  [PASS] 所有模块已实现 (3/3)
  [PASS] TypeScript 编译通过
  [PASS] 变更记录已完成 (5 files changed)
  [PASS] 用户确认

Result: CAN PROCEED to Testing phase
```

### 2.5 Implementation Guidelines

#### 实现原则

| Principle | Description |
|-----------|-------------|
| **Design First** | 严格按设计文档实现，不擅自添加功能 |
| **Minimal Change** | 只修改必要的文件，避免无关变更 |
| **Track Everything** | 所有变更记录到 Change Log |
| **Test Ready** | 为 T 阶段准备好测试条件 |

#### 实现顺序

```
1. Types/Interfaces (类型定义优先)
2. Core Logic (核心逻辑)
3. Integration (集成代码)
4. Tests (单元测试，如设计要求)
5. Documentation (代码注释，如需要)
```

### 2.6 CLI Integration

编码阶段可调用已实现的工具：

```typescript
// 获取 Feature 信息
import { indexFeatures } from 'src/doc-indexer';
const result = await indexFeatures(basePath);
const feature = result.features.find(f => f.id === featureId);

// 获取依赖图
import { buildGraph } from 'src/dependency-graph';
const graph = buildGraph(result.features);
```

或通过 CLI：

```bash
node dist/index.js status              # 查看 Feature 状态
node dist/index.js next <feature-id>   # 门控检查
```

### 2.7 Trigger

```
User: /next feat-xxx
  ↓
Gate Check: D→C 通过
  ↓
Prompt: "进入 Coding 阶段，是否使用 sdf-code Skill?"
  ↓
User: 确认
  ↓
Execute: sdf-code Skill
```

## 3. Dependency Analysis

> 此部分必须在进入 Design 阶段前完成

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| **feat-sdf-design** | Feature | **done** | 提供设计文档输入 |
| **feat-doc-indexer** | Feature | **done** | 获取 Feature 元数据 |
| **feat-dependency-graph** | Feature | **done** | 门控检查支持 |
| Edit/Write/Bash Tools | Infra | Claude Built-in | 代码编辑能力 |

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| /next 命令 | Command | High | C 阶段触发编码 Skill |
| feat-workflow-orchestration | Feature | High | 完成 C 阶段能力 |
| feat-sdf-test | Feature | Medium | 提供变更清单作为测试输入 |

### 3.3 New Backlog Items

(无新增 - 所有依赖已实现)

### 3.4 Dependency Interaction Analysis

#### Interaction with feat-sdf-design

**Source**: docs/requirements/CoreEngine/feat-sdf-design.md
**Status**: done

**Capabilities Provided**:
- 设计文档输出到 `docs/design/<domain>/des-<name>.md`
- 包含模块设计、接口定义、测试策略

**How This Feature Uses It**:
- 读取设计文档作为实现指南
- 按设计的模块结构实现代码
- 遵循设计的接口定义

**Design Implications**:
- 设计文档必须包含明确的模块列表
- 接口定义必须足够详细以指导实现

#### Interaction with feat-sdf-test

**Source**: docs/requirements/CoreEngine/feat-sdf-test.md
**Status**: done

**Capabilities Provided**:
- T 阶段测试验收流程

**How This Feature Affects It**:
- 提供变更记录作为测试范围参考
- 更新 Feature status 触发 T 阶段

### 3.5 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在 (feat-sdf-design ✅, feat-doc-indexer ✅, feat-dependency-graph ✅)
- [x] 后续影响已评估
- [x] 无新增依赖到 Backlog

**Status**: Ready for Design

## 4. Acceptance Criteria

> **重要**：本 Feature 是**规范类 Feature**（Skill 定义），不是代码。
> 验收方式：**规范完整性 + 试运行验证 + 输出结构检查**，而非单元测试。
>
> **验收流程**：
> 1. Layer 1: 规范完整性 → Glob 检查 Skill 文件存在
> 2. Layer 2: 试运行验证 → 选择已完成 D 阶段的 Feature 执行
> 3. Layer 3: 输出结构验证 → 检查变更记录和代码结构
> 4. Layer 4: 人工确认 → 用户批准完成

### AC-1: Skill Structure
- [ ] `.claude/skills/sdf-code/SKILL.md` 已创建
- [ ] 变更记录模板已创建
- [ ] 编码规范参考文档已创建

### AC-2: Coding Workflow (5 步)
- [ ] Step 1: 能执行 D→C 门控检查
- [ ] Step 2: 能加载设计文档和需求 AC
- [ ] Step 3: 能生成实现计划
- [ ] Step 4: 能追踪代码变更
- [ ] Step 5: 能执行 C→T 门控检查

### AC-3: Change Tracking
- [ ] 变更记录文档自动创建
- [ ] 所有文件变更被追踪
- [ ] 变更记录包含实现说明

### AC-4: Gate Checks
- [ ] D→C 门控检查正常工作
- [ ] C→T 门控检查正常工作
- [ ] 门控失败时有明确提示

### AC-5: Integration
- [ ] /next 命令 C 阶段触发编码 Skill
- [ ] 状态正确更新为 implementing
- [ ] 完成后状态更新为 testing

## 5. Technical Constraints

- **Claude Tools Only**: 使用 Glob, Read, Edit, Write, Bash
- **Design Driven**: 严格按设计文档实现
- **Template-Based**: 变更记录基于模板
- **Human Review**: 实现计划需人工确认

## 6. Design Decisions (内嵌设计)

> 规范类 Feature 的设计内嵌在需求文档中，无需独立设计文档。

### 6.1 Trade-offs & Alternatives

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Skill-Based** (选择) | Claude Skill 实现 | 与 R/D/T 一致，灵活 | 依赖 AI 执行质量 |
| No Skill | 继续使用原生能力 | 简单 | 流程断裂，无追踪 |
| Code-Based | TypeScript 脚本 | 确定性 | 过度工程化 |

**Decision Rationale**:
1. 与 sdf-analyze, sdf-design, sdf-test 保持一致
2. 补全 R-D-C-T 流程的缺口
3. 提供结构化的实现指导
4. 变更追踪为 T 阶段提供输入

### 6.2 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI 不遵循设计 | Medium | High | 明确的实现计划 + 人工确认 |
| 变更追踪遗漏 | Medium | Medium | 每步更新 + 最终检查 |
| 门控过于严格 | Low | Medium | 允许用户跳过（带警告） |

### 6.3 Success Metrics

| Metric | Target |
|--------|--------|
| 实现计划生成成功率 | 100% |
| 变更追踪完整率 | > 95% |
| D→C 门控准确性 | 100% |
| C→T 门控准确性 | 100% |

---

*Feature: sdf-code*
*Domain: CoreEngine*
*Created: 2026-01-11*
*Status: proposed*
*Dependencies Analyzed: true*
*Feature Kind: specification*
