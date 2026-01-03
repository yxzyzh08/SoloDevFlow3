---
id: feat-sdf-test
type: feature
domain: CoreEngine
status: done
priority: critical
created: 2026-01-02

# ===== Semantic Fields (AI-First) =====
summary: "T 阶段测试验收能力 - 4步精简验证流程，确认AC通过并更新Feature状态"
tags: [skill, testing, workflow, T-phase, acceptance-criteria, verification]

# ===== Feature Kind =====
feature_kind: specification

# ===== Dependency Fields =====
dependencies:
  requires:
    - feat-doc-indexer        # 获取 Feature AC 列表
    - feat-dependency-graph   # 门控检查
  blocks: []
analyzed: true
---

# SDF-Test Skill

> T 阶段测试验收能力 - 验证实现满足需求，确认 AC 通过并更新状态。

## 1. Requirements

### 1.1 Background

SoloDevFlow 的 R-D-C-T 工作流中，T (Testing) 阶段的核心职责是**验证确认**，而非**测试发现**。

**设计理念**:
- T 阶段只做"确认"，不做"发现"
- 测试报告应轻量化，核心是 AC 验证状态
- 直接更新 Feature 文档，避免重复记录

**T 阶段需要**:
1. **验证 AC** - 逐条确认验收标准是否满足
2. **运行测试** - 执行自动化测试（如存在）
3. **更新状态** - 将 Feature 状态从 testing → done

当前状态：
- R 阶段有 `sdf-analyze` Skill ✅
- D 阶段有 `sdf-design` Skill (analyzing)
- C 阶段由 Claude 原生工具支持 ✅
- T 阶段缺少专门的 Skill ❌

### 1.2 User Stories

作为**开发者**，我希望**在 C 阶段完成后自动获得测试验收指导**，以便**系统性地验证实现是否符合需求**。

作为**AI 助手**，我需要**结构化的测试流程**，以便**准确评估每个 AC 的完成情况并给出明确结论**。

### 1.3 Scope

**包含**：
- 4 步精简验证流程
- 轻量化测试验证模板
- AC 验证决策树
- C→T 和 T→Done 门控检查
- Feature 文档 AC 状态同步

**不包含**：
- 复杂测试报告生成
- 自动化测试框架（项目自带）
- 单元测试编写（C 阶段职责）
- 性能测试工具

## 2. Specification

### 2.1 Skill Structure

```
.claude/skills/sdf-test/
├── SKILL.md                 # 核心指令
├── templates/
│   └── test-report.md       # 测试报告模板
└── references/
    ├── ac-verification.md   # AC 验证指南
    └── gate-conditions.md   # 门控条件参考
```

### 2.2 Test Verification Template (Simplified)

> **设计理念**: T 阶段只做"确认"，不做"发现"。测试报告应轻量化。

```markdown
---
id: test-<name>
type: test-verification
feature: feat-<name>
domain: <DomainId>
date: YYYY-MM-DD
result: pass | fail
---

# <Feature> - Test Verification

## 1. AC Verification Status

| AC | Title | Method | Result |
|----|-------|--------|--------|
| AC-1 | xxx | Automated | PASS |
| AC-2 | yyy | Code Review | PASS |
| AC-3 | zzz | Manual | FAIL |

## 2. Test Output (If Applicable)

```bash
$ npm test
✓ 5/5 tests passed
Coverage: 85%
```

## 3. Decision

- **Result**: PASS / FAIL
- **Action**: APPROVE → Done / REJECT → 返回 C 阶段修复
```

**与原 Feature 文档同步**: 验证完成后，直接更新 Feature 文档中的 AC 复选框状态。

### 2.3 Test Workflow (Simplified)

> **设计理念**: 4 步精简流程，聚焦"验证"而非"测试"。

```
Input: Feature ID (e.g., feat-xxx)

┌─────────────────────────────────────────────────────────────┐
│ Step 1: Gate Check + Load Context                            │
│ ─────────────────────────────────────────────────────────── │
│ ├── C→T 门控检查 (代码完成? AC 定义?)                        │
│ ├── 读取 Feature 需求文档，提取 AC 列表                      │
│ └── 读取设计文档，了解实现位置                               │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Run Automated Tests (If Applicable)                  │
│ ─────────────────────────────────────────────────────────── │
│ ├── 检查是否有测试脚本 (package.json scripts)                │
│ ├── 运行 npm test / pytest / etc.                            │
│ └── 记录测试输出                                             │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Verify AC + Update Feature Doc                       │
│ ─────────────────────────────────────────────────────────── │
│ ├── 逐条验证 AC (使用决策树选择验证方法)                     │
│ ├── 直接更新 Feature 文档中的 AC 复选框                      │
│ └── 如有 FAIL，记录原因                                      │
│                                                              │
│ Thinking: think hard (需要仔细验证)                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Decision + Output                                    │
│ ─────────────────────────────────────────────────────────── │
│ ├── T→Done 门控检查 (所有 AC 通过?)                          │
│ ├── 询问用户确认                                             │
│ ├── 写入 docs/test-reports/<domain>/test-<name>.md           │
│ └── 如 APPROVE，更新 Feature status: done                    │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
```

**流程对比**:
| 原设计 | 简化后 |
|--------|--------|
| 7 步 (Step 0-6) | 4 步 |
| 独立的报告生成步骤 | 合并到 Step 4 |
| 两次门控检查 | 合并到 Step 1 和 Step 4 |

### 2.4 AC Verification Methods

| Method | When to Use | Example |
|--------|-------------|---------|
| **Automated** | 有测试脚本 | `npm test` 通过 |
| **Code Review** | 检查代码实现 | 确认函数/模块已实现 |
| **Manual** | 需要运行并观察 | 执行命令检查输出 |
| **Documentation** | 检查文件存在 | 确认文档已创建 |

#### AC Verification Decision Tree

```
AC 验证方法选择:

Q1: AC 是否有对应的自动化测试?
├── Yes → Automated (运行测试，检查是否通过)
└── No → Q2

Q2: AC 是否涉及代码实现?
├── Yes → Code Review (检查代码是否存在并符合要求)
└── No → Q3

Q3: AC 是否涉及文件/文档存在性?
├── Yes → Documentation (用 Glob/Read 检查文件)
└── No → Manual (人工执行并验证)
```

**验证原则**:
- 优先使用 Automated (可重复、客观)
- Code Review 检查"实现存在"而非"实现正确"
- Manual 仅用于无法自动化的场景

### 2.5 Gate Conditions

#### C→T Gate

| Condition | Check | Description |
|-----------|-------|-------------|
| code-complete | 代码变更已完成 | 实现代码已提交/保存 |
| ac-defined | AC 已定义 | Feature 文档包含 AC 列表 |
| design-followed | 遵循设计 | 实现与设计文档一致 |

**Gate Check 输出示例**:

```
=== C→T Gate Check: feat-doc-indexer ===

Conditions:
  [PASS] 代码实现完成 (src/doc-indexer/ 已创建)
  [PASS] AC 已定义 (5 条验收标准)
  [PASS] 遵循设计 (实现与设计一致)

Result: CAN PROCEED to Testing phase
```

#### T→Done Gate

| Condition | Check | Description |
|-----------|-------|-------------|
| all-ac-pass | 所有 AC 通过 | AC 通过率 100% |
| no-blockers | 无阻塞问题 | 没有严重问题 |
| user-approved | 用户确认 | 用户同意完成 |

**Gate Check 输出示例**:

```
=== T→Done Gate Check: feat-doc-indexer ===

Conditions:
  [PASS] 所有 AC 通过 (5/5, 100%)
  [PASS] 无阻塞问题
  [PASS] 用户确认

Result: Feature COMPLETED - status updated to 'done'
```

### 2.6 CLI Integration

测试阶段可调用已实现的工具：

```typescript
// 获取 Feature AC 列表
import { indexFeatures } from 'src/doc-indexer';
const result = await indexFeatures(basePath);
const feature = result.features.find(f => f.id === featureId);
// feature.ac 包含验收标准
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
Gate Check: C→T 通过
  ↓
Prompt: "进入 Testing 阶段，是否使用 sdf-test Skill?"
  ↓
User: 确认
  ↓
Execute: sdf-test Skill
```

## 3. Dependency Analysis

> 此部分必须在进入 Design 阶段前完成

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| **feat-doc-indexer** | Feature | **done** | 获取 Feature AC 列表 |
| **feat-dependency-graph** | Feature | **done** | 门控检查支持 |
| Glob/Read Tools | Infra | Claude Built-in | 读取代码和文档 |
| Bash Tool | Infra | Claude Built-in | 运行测试命令 |

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| /next 命令 | Command | High | T 阶段触发测试 Skill |
| feat-workflow-orchestration | Feature | High | 完成 T 阶段能力 |
| docs/test-reports/ | Directory | High | 输出测试报告 |

### 3.3 New Backlog Items

(无新增 - 所有依赖已实现)

### 3.4 Dependency Interaction Analysis

#### Interaction with feat-doc-indexer

**Source**: docs/requirements/DocSystem/feat-doc-indexer.md
**Status**: done

**Capabilities Provided**:
- `indexFeatures()`: 扫描并索引所有 Feature 文档
- `parseFeatureFile()`: 解析单个 Feature 的 Frontmatter

**How This Feature Uses It**:
- 获取目标 Feature 的 AC 列表
- 获取 Feature 当前状态

**Design Implications**:
- 测试流程需要读取 Feature 文档提取 AC
- 可利用已有的 parser 逻辑

#### Interaction with feat-dependency-graph

**Source**: docs/requirements/DocSystem/feat-dependency-graph.md
**Status**: done

**Capabilities Provided**:
- Gate check 门控检查能力
- 依赖状态验证

**How This Feature Uses It**:
- C→T 门控检查
- T→Done 门控检查

### 3.5 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在 (feat-doc-indexer ✅, feat-dependency-graph ✅)
- [x] 后续影响已评估
- [x] 无新增依赖到 Backlog

**Status**: Ready for Design

## 4. Acceptance Criteria

> **重要**：本 Feature 是**规范类 Feature**（Skill 定义），不是代码。
> 验收方式：**规范完整性 + 试运行验证 + 输出结构检查**，而非单元测试。
>
> **验收流程**：
> 1. Layer 1: 规范完整性 → Glob 检查 Skill 文件存在
> 2. Layer 2: 试运行验证 → 选择已完成 C 阶段的 Feature 执行
> 3. Layer 3: 输出结构验证 → 检查测试报告和 Feature 文档更新
> 4. Layer 4: 人工确认 → 用户批准完成

### AC-1: Skill Structure
- [x] `.claude/skills/sdf-test/SKILL.md` 已创建
- [x] 简化版测试验证模板已创建
- [x] AC 验证决策树指南已创建

### AC-2: Test Workflow (4 步)
- [x] Step 1: 能执行 C→T 门控检查并加载上下文
- [x] Step 2: 能检测并运行自动化测试
- [x] Step 3: 能逐条验证 AC 并更新 Feature 文档
- [x] Step 4: 能执行 T→Done 门控并输出报告

### AC-3: Feature Doc Sync
- [x] 验证完成后直接更新 Feature 文档 AC 复选框
- [x] 轻量级测试报告保存到 docs/test-reports/

### AC-4: Gate Checks
- [x] C→T 门控检查正常工作
- [x] T→Done 门控检查正常工作
- [x] 全部 AC 通过后状态更新为 done

## 5. Technical Constraints

- **Claude Tools Only**: 使用 Glob, Read, Write, Bash
- **Leverage Existing**: 复用 src/ 下的 TypeScript 模块
- **Template-Based**: 基于模板生成，保持一致性
- **Human Review**: 最终结果需人工确认

## 6. Test Strategy (for this Feature)

### 6.1 Unit Test Approach
- 测试报告模板渲染
- AC 提取逻辑

### 6.2 Integration Test Approach
- 完整测试流程 E2E 测试
- 门控检查集成测试

---

*Feature: sdf-test*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: analyzing*
*Dependencies Analyzed: true*
