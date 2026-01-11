---
type: workflow-specification
status: active
version: 1.2.0
last_updated: 2026-01-11
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

核心原则详见 `CLAUDE.md`。工作流特定原则：

| Principle | Description |
|-----------|-------------|
| **Planning First** | 复杂任务使用 extended thinking |
| **Gate Check** | 阶段转换需满足门控条件 |
| **AC Driven** | 验收标准是唯一判定依据 |

### 1.3 State Transitions

| From | To | Trigger | Condition |
|------|----|---------|-----------|
| `proposed` | `analyzing` | 开始分析 | - |
| `analyzing` | `analyzed` | 分析完成 | 依赖已识别 |
| `analyzing` | `analyzing` | 发现新依赖 | 创建 Task 后继续 |
| `analyzed` | `ready-for-design` | 检查通过 | 无待分析任务 |
| `analyzed` | `waiting-deps` | 检查未通过 | 有前置依赖未完成 |
| `waiting-deps` | `ready-for-design` | 依赖完成 | 前置依赖 status=done |
| `ready-for-design` | `designing` | R→D 门控 | 用户确认 |
| `designing` | `implementing` | D→C 门控 | 设计已批准 |
| `implementing` | `testing` | C→T 门控 | 代码完成 |
| `testing` | `done` | T→Done 门控 | AC 100% 通过 |

**简化流程**:
```
R: proposed → analyzing → analyzed → ready-for-design
D: designing
C: implementing
T: testing → done
```

## 2. Adaptive Workflows (简化路径)

不同任务类型可选择不同路径，避免过度流程化：

| 任务类型 | 路径 | 说明 |
|----------|------|------|
| **新功能** | R → D → C → T | 完整流程 |
| **Bug 修复 (小)** | R → C → T | 跳过 D，直接修复 |
| **Bug 修复 (大)** | R → D → C → T | 需要设计变更 |
| **文档修改** | R → T | 无需编码 |
| **配置调整** | 直接执行 | 无需 Feature 文档 |
| **规范变更** | Section 7 流程 | Document First |

**判断标准**:
- 影响范围 > 3 个文件 → 完整流程
- 需要新增模块/接口 → 需要 D 阶段
- 仅修改现有逻辑 → 可跳过 D 阶段

## 3. State Machine

### 3.1 Status Definitions

| Status | Phase | Meaning |
|--------|-------|---------|
| `proposed` | R | 需求已提出 (新发现的依赖通过 Task Manager 管理) |
| `analyzing` | R | 深度依赖分析中 |
| `analyzed` | R | 分析完成，检查依赖 |
| `waiting-deps` | R | 等待依赖完成 |
| `ready-for-design` | R | 可进入设计 |
| `designing` | D | 设计方案中 |
| `implementing` | C | 编码实现中 |
| `testing` | T | 测试验收中 |
| `done` | - | 已完成 |
| `blocked` | - | 阻塞 |

### 3.2 Valid Transitions

```
proposed → analyzing → analyzed → ready-for-design → designing
                 │                       ↑
                 └── waiting-deps ───────┘

designing → implementing → testing → done
```

## 4. Phase Specifications

### 4.1 Phase R: Requirements

| Item | Content |
|------|---------|
| **Goal** | 将模糊需求转化为结构化文档，深挖完整依赖链 |
| **Trigger** | 用户描述新功能/Bug/变更 |
| **Input** | 用户自然语言 + 现有上下文 + Task Manager 状态 |
| **Output** | Feature 文档 + Task Manager 更新 |
| **Skill** | `sdf-analyze` |
| **Thinking** | 标准模式，复杂依赖 → extended |

**Skill Location**: `.claude/skills/sdf-analyze/`

**Key Activities**:
1. 创建 Feature 文档 (`docs/requirements/<domain>/feat-<name>.md`)
2. 分析依赖 (功能/数据/基础设施/外部)
3. 新发现的依赖创建 Task (`type: analyze_requirement`)
4. 更新依赖状态 (`analyzed: true`)

### 4.2 Phase D: Design

| Item | Content |
|------|---------|
| **Goal** | 产出可执行的技术方案 |
| **Trigger** | R→D 门控通过 + 用户确认 |
| **Input** | Feature 需求文档 + 架构文档 + 代码库结构 |
| **Output** | 设计文档 (`docs/design/<domain>/des-<name>.md`) |
| **Skill** | `sdf-design` |
| **Thinking** | extended thinking (深度规划) |

**Skill Location**: `.claude/skills/sdf-design/`

**Key Activities**:
1. 读取架构文档 (`docs/architecture/ARCHITECTURE.md`)
2. 架构一致性检查
3. 分析依赖接口
4. 生成设计文档
5. 更新架构文档 (如有新组件)

### 4.3 Phase C: Coding

| Item | Content |
|------|---------|
| **Goal** | 实现设计方案 |
| **Trigger** | D→C 门控通过 + 用户确认 |
| **Input** | 设计文档 + 需求文档 |
| **Output** | `src/` 代码变更 或 `.claude/skills/` 配置 |
| **Skill** | `sdf-code` |
| **Thinking** | 标准模式，复杂实现 → extended |

**Skill Location**: `.claude/skills/sdf-code/`

**Key Activities**:
1. D→C 门控检查
2. 加载设计文档和需求 AC
3. 生成实现计划并确认
4. 增量实现 (Loop: 实现 → 验证 → 下一模块)
5. 完成验证并准备测试

### 4.4 Phase T: Testing

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

## 5. Gate Conditions

### 5.1 R→D Gate

进入 Design 阶段必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| feature-exists | Glob 检查文件 | `docs/requirements/<domain>/feat-<name>.md` 存在 |
| frontmatter-complete | Read + 解析 | id, type, status, priority, dependencies 完整 |
| ac-defined | Read Feature 文档 | AC 部分非空 (至少 1 条) |
| deps-analyzed | 检查 `analyzed` 字段 | `analyzed: true` |
| pending-requirements-clear | queryTasks({ type: 'analyze_requirement', status: 'pending' }) | 无相关待分析需求 |
| user-confirmed | 询问用户 | 用户确认进入 D 阶段 |

**检查命令**: `/next <feature-id>`

### 5.2 D→C Gate

进入 Coding 阶段必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| design-exists | Glob 检查文件 | `docs/design/<domain>/des-<name>.md` 存在 |
| design-approved | 用户确认 | 用户明确同意设计方案 |
| architecture-aligned | 检查设计文档 | Checklist 已完成 |
| adr-created | 检查 ADR | 如需要，ADR 已创建 |

### 5.3 C→T Gate

进入 Testing 阶段必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| code-complete | Glob 检查相关文件 | 预期文件存在 |
| ac-defined | Read Feature 文档 | AC 部分非空 |
| design-followed | Read 设计文档比对 | 实现与设计一致 |

### 5.4 T→Done Gate

完成 Feature 必须满足：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| all-ac-pass | 统计验证结果 | 100% AC 通过 |
| no-blockers | 检查严重问题 | 无阻塞项 |
| user-approved | 询问用户 | 用户确认 APPROVE |

## 6. Phase Transition (阶段推进)

阶段推进是工作流的核心。当用户说"进入下一阶段"、"推进"、"next"时触发。

### 6.1 Transition Flow

```
用户: "推进 feat-xxx 到下一阶段"
    ↓
Step 1: 定位 Feature
    ↓
Step 2: 读取当前状态
    ↓
Step 3: 确定目标状态
    ↓
Step 4: 执行门控检查
    ↓
Step 5: 用户确认
    ↓
Step 6: 更新状态 + 触发下一阶段动作
```

### 6.2 State Transition Map

```
R Phase:
  proposed → analyzing → analyzed → ready-for-design
                              ↓
                       waiting-deps (如有未完成依赖)

R → D:
  ready-for-design → designing

D → C:
  designing → implementing

C → T:
  implementing → testing

T → Done:
  testing → done
```

### 6.3 Transition Execution

#### Step 1-2: Locate & Read

```bash
# 定位 Feature
Glob docs/requirements/**/feat-<name>.md

# 读取状态
Read <feature-file>
# 解析 YAML Frontmatter 中的 status 字段
```

#### Step 3: Determine Target

| Current Status | Target Status | Transition |
|----------------|---------------|------------|
| proposed/analyzing/analyzed | ready-for-design | R 内部 |
| ready-for-design | designing | R → D |
| designing | implementing | D → C |
| implementing | testing | C → T |
| testing | done | T → Done |

#### Step 4: Gate Check

执行对应阶段的门控检查（详见 Section 4）。

**门控检查输出格式**:

```
=== Phase Transition ===

Feature: feat-xxx
Current: analyzing
Target: designing

Gate Check (R → D):
  [PASS] 依赖分析完成 (analyzed: true)
  [PASS] 待分析任务已清空 (无 pending analyze_requirement)
  [PASS] 前置依赖就绪 (无前置依赖)
  [PASS] 无循环依赖

Result: CAN PROCEED / CANNOT PROCEED
```

**如果门控失败**:

```
Result: CANNOT PROCEED

Blockers:
  1. Task Manager 有 2 个待分析任务
  2. 等待前置依赖完成: feat-xxx, feat-yyy

Suggestions:
  - 继续处理 Task Manager 中的待分析任务
  - 或使用 --force 强制推进 (不推荐)
```

#### Step 5: User Confirmation

```
门控检查通过。确认推进到 [target-phase]？

- Yes → 执行状态更新
- No → 取消操作
```

#### Step 6: Execute Transition

```bash
# 更新 Feature 文档状态
Edit docs/requirements/<domain>/feat-<name>.md
# status: <current> → <target>
```

**触发下一阶段动作**:

| Target Phase | Action |
|--------------|--------|
| designing | 提示使用 sdf-design Skill 创建设计文档 |
| implementing | 提示开始编码实现 |
| testing | 提示使用 sdf-test Skill 验证 AC |
| done | 更新统计，汇报完成 |

### 6.4 Dependency Checks

门控检查包含两个核心验证：

| 检查 | 说明 | 实现位置 |
|------|------|----------|
| 循环依赖检测 | DFS + 着色算法 | `src/dependency-graph/index.ts:detectCycles()` |
| 依赖就绪检查 | 验证前置依赖状态 | `src/dependency-graph/index.ts:checkRToD()` |

### 6.5 Force Transition

不推荐，但当用户明确要求时可以强制推进：

```
用户: "强制推进 feat-xxx"

警告: 门控检查未通过，强制推进可能导致问题。
确认强制推进？(需明确确认)
```

## 7. Specification Change Process

当需要修改架构或规范（而非开发新 Feature）时，遵循此流程。

### 7.1 适用场景

| 场景 | 示例 | 适用流程 |
|------|------|----------|
| 新增 Feature | "添加用户认证功能" | R-D-C-T |
| 修改架构/规范 | "合并 Commands 到 Skills" | **本流程** |
| 修复 Bug | "修复登录失败问题" | R-D-C-T (简化) |

**判断标准**：
- 如果主要产出是**新代码/新功能** → R-D-C-T
- 如果主要产出是**修改现有规范/架构** → Specification Change Process

### 7.2 核心原则：Document First

```
❌ 错误：先执行变更 → 后更新文档
✅ 正确：先修改文档 → 后执行变更
```

**原因**：
1. Document is Truth - 文档是真理来源
2. 文档先行确保变更经过思考
3. 便于 Review 和回滚

### 7.3 变更流程

```
Specification Change Process:

Step 1: 识别变更类型
    ↓
Step 2: 修改规范文档
    ↓
Step 3: 执行实际变更
    ↓
Step 4: 验证一致性
```

#### Step 1: 识别变更类型

| 变更类型 | 需修改的文档 |
|----------|-------------|
| 工作流程变更 | `.claude/steering/workflow.md` |
| 架构变更 | `docs/architecture/ARCHITECTURE.md` |
| 原则变更 | `docs/architecture/principles.md` |
| 目录结构变更 | ADR + ARCHITECTURE.md |
| Skill 结构变更 | workflow.md + 相关 Skill 文档 |

#### Step 2: 修改规范文档

**必须包含**：
1. 变更内容描述
2. 变更原因说明
3. 新的规范定义

**示例**：
```markdown
## 7. Skill Reference

所有工作流操作通过 Skills 触发，不再使用独立 Commands。
// ↑ 这就是规范变更，先写在文档里
```

#### Step 3: 执行实际变更

规范文档修改完成后，再执行实际操作：
- 删除/创建文件
- 修改代码
- 更新配置

#### Step 4: 验证一致性

```
检查清单：
- [ ] 实际状态与文档描述一致
- [ ] 无残留的旧结构
- [ ] 相关引用已更新
```

### 7.4 与 ADR 的关系

| 变更规模 | 是否需要 ADR |
|----------|-------------|
| 小型调整 | 否，直接修改规范文档 |
| 重大架构变更 | 是，先创建 ADR，再修改规范 |

**重大变更标准**：
- 影响多个组件
- 引入新模式/废弃旧模式
- 不可逆的结构变更

### 7.5 示例：Commands → Skills 合并

**正确流程**：

```
1. Step 1: 识别 → 工作流程变更 + Skill 结构变更

2. Step 2: 修改文档
   - workflow.md: 删除 Command Reference，添加 Skill Reference
   - workflow.md: 说明 "不再使用独立 Commands"
   - sdf-test/SKILL.md: 添加 AC 查询功能
   - sdf-analyze/SKILL.md: 添加 Task Manager 集成

3. Step 3: 执行变更
   - 删除 .claude/commands/ 目录

4. Step 4: 验证
   - 确认 commands 目录不存在
   - 确认 skills 包含所有功能
   - 确认 workflow.md 引用正确
```

## 8. Task-based Requirement Management

### 8.1 统一任务管理

所有待办项（包括待分析的需求）统一通过 Task Manager 管理。

**存储位置**: `.solodevflow/tasks.json`

**需求分析任务类型**: `analyze_requirement`

### 8.2 需求发现流程

```
发现新需求（依赖分析/用户提出）
    ↓
createTask({
  type: 'analyze_requirement',
  title: '分析需求：xxx',
  priority: 'medium',
  source: '<来源 Feature ID>',
  generatedBy: 'discovery'
})
    ↓
R 阶段分析
    ↓
创建 Feature 文档 + updateTask({ status: 'done' })
```

### 8.3 任务查询

```typescript
// 查看待分析需求
queryTasks({ type: 'analyze_requirement', status: 'pending' })

// 查看可执行任务（依赖已满足）
getExecutableTasks()

// 按优先级筛选
queryTasks({ status: 'pending' })  // 然后按 priority 排序
```

### 8.4 与 R→D 门控的关系

R→D 门控检查 `pending-requirements-clear` 条件：
- 查询 `type: 'analyze_requirement', status: 'pending'` 的任务
- 如果存在相关待分析需求，阻止进入 D 阶段
- 确保依赖链完整分析后再进入设计

## 9. Skill Reference

所有工作流操作通过 Skills 触发，不再使用独立 Commands。

### 9.1 sdf-analyze (R 阶段)

**Location**: `.claude/skills/sdf-analyze/`

**触发词**: "添加"、"实现"、"新功能"、"需求分析"、"待办"、"修改了"、"变更"、"分析影响"

**能力**:
- 需求分析和 Feature 文档创建
- 依赖分析
- 任务管理 (通过 task-manager API)
- 变更影响分析 (计划中)

### 9.2 sdf-design (D 阶段)

**Location**: `.claude/skills/sdf-design/`

**触发词**: "设计"、"技术方案"、"进入 D 阶段"

**能力**:
- 读取架构文档
- 生成设计文档
- 架构一致性检查

### 9.3 sdf-code (C 阶段)

**Location**: `.claude/skills/sdf-code/`

**触发词**: "编码"、"实现"、"开始写代码"、"进入开发"、"进入 C 阶段"

**能力**:
- D→C 门控检查
- 实现计划生成
- 增量实现与验证
- 变更追踪
- C→T 门控准备

### 9.4 sdf-test (T 阶段)

**Location**: `.claude/skills/sdf-test/`

**触发词**: "测试"、"验收"、"检查 AC"、"验证"

**能力**:
- C→T 和 T→Done 门控检查
- AC 验证
- 测试报告生成
- AC 快速查询

### 9.5 Phase Transition (阶段推进)

**Location**: 本文档 Section 6

**触发词**: "推进"、"下一阶段"、"进入 D/C/T 阶段"

**能力**:
- 门控检查
- 状态更新
- 触发对应阶段 Skill

## 10. Thinking Level Guide

| Phase | Default | When to Use Extended Thinking |
|-------|---------|-------------------------------|
| R | 标准 | 复杂依赖链分析 |
| D | extended | 架构设计、技术方案 |
| C | 标准 | 复杂实现逻辑 |
| T | 标准 | 复杂验证场景 |

> **Note**: "extended thinking" 指 Claude 的深度思考模式，适用于需要多步推理的复杂任务。

## 11. Feature Kind & Design Documents

### 11.1 Feature Kind 分类

| Kind | 定义 | 产出 | 示例 |
|------|------|------|------|
| `code` | 需要编写代码的功能 | `src/` 代码 | doc-indexer, dependency-graph, task-manager |
| `specification` | 定义规范或 Skill | SKILL.md 文件 | sdf-analyze, sdf-design, sdf-test |

### 11.2 设计文档策略

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

### 11.3 Frontmatter 标记

```yaml
# 代码类 Feature
feature_kind: code

# 规范类 Feature
feature_kind: specification
```

### 11.4 D 阶段行为差异

| Feature Kind | D 阶段行为 |
|--------------|-----------|
| `code` | 创建 `docs/design/<domain>/des-<name>.md` |
| `specification` | 直接在需求文档 Specification 部分完善设计，无独立设计文档 |

### 11.5 决策依据

此策略基于以下最佳实践：

1. **Claude 官方 Skill 最佳实践**: "Concise is key" - 避免不必要的文档
2. **Document is Truth**: 单一数据源原则，减少重复
3. **实际价值分析**: 规范类 Feature 的设计文档与需求文档 Specification 内容重叠度 > 90%

**参考**: [Claude Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

## 12. Quick Reference

### 12.1 Phase Flow

```
R → D → C → T → Done
```

### 12.2 Key Files

| Type | Pattern |
|------|---------|
| Requirements | `docs/requirements/<domain>/feat-<name>.md` |
| Design | `docs/design/<domain>/des-<name>.md` |
| Test Report | `docs/test-reports/<domain>/test-<name>.md` |
| Task Store | `.solodevflow/tasks.json` |
| Doc Standards | `.claude/steering/doc-standards.md` |

### 12.3 Skills

| Phase | Skill |
|-------|-------|
| R | `.claude/skills/sdf-analyze/` |
| D | `.claude/skills/sdf-design/` |
| C | `.claude/skills/sdf-code/` |
| T | `.claude/skills/sdf-test/` |

---

*Workflow Specification v1.2.0*
*Last Updated: 2026-01-11*
*Maintainer: Human + AI Collaboration*

**v1.2.0 Changes**:
- Added Section 2: Adaptive Workflows (简化路径)
- Removed implementation details (algorithms moved to code)
- Fixed "ultrathink" → "extended thinking" terminology
- Simplified Core Principles (reference CLAUDE.md)
- Removed all backlog/需求池 references (unified to Task Manager)
- Replaced ASCII workflow diagram with state transition table
- Added doc-standards.md reference to Key Files
- Renumbered all sections

**v1.1.0 Changes**:
- Added sdf-code Skill for C phase
- Integrated Task Manager for requirement pool management (replaced backlog.md)
- Updated Quick Reference with Task Store path
