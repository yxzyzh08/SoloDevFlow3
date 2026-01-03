---
id: des-sdf-test
type: design
domain: CoreEngine
status: draft
created: 2026-01-02
requirement: docs/requirements/CoreEngine/feat-sdf-test.md
depends-on: [des-doc-indexer, des-dependency-graph]
architecture_aligned: true
adr_created: []
---

# SDF-Test Skill - Technical Design

> 技术设计文档：定义 Claude 如何实现 T 阶段测试验收能力。

## 1. Design Overview

### 1.1 Problem Statement

T 阶段需要验证实现是否满足需求。当前缺乏：
- 结构化的验证流程
- AC 状态同步机制
- 轻量化的验证报告

### 1.2 Solution Approach

**核心理念**: T 阶段只做"验证确认"，不做"测试发现"。

与 sdf-analyze, sdf-design 一致，sdf-test 是：

1. **Skill-Based**: 通过 Claude Skill 实现验证流程
2. **Tool-Driven**: 使用 Claude 内置工具 + Bash 执行测试
3. **Lightweight**: 精简的 4 步流程，轻量化报告
4. **AC-Centric**: 以验收标准为核心，直接更新 Feature 文档

### 1.3 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 实现方式 | Claude Skill | 与其他阶段保持一致 |
| 流程步骤 | 4 步精简 | 原 7 步过于复杂 |
| 报告格式 | 3 部分轻量 | 避免重复记录，核心是 AC 状态 |
| AC 同步 | 直接更新 Feature 文档 | 单一数据源原则 |

## 2. Architecture Alignment

### 2.1 Reused Components

| Component | How Used |
|-----------|----------|
| doc-indexer | 获取 Feature AC 列表 |
| dependency-graph | 门控检查 (C→T, T→Done) |
| sdf-analyze/sdf-design 模式 | 复用 Skill 目录结构 |

### 2.2 New Components

| Component | Location | Description |
|-----------|----------|-------------|
| sdf-test Skill | `.claude/skills/sdf-test/` | T 阶段核心能力 |
| test-report.md 模板 | `templates/test-report.md` | 测试验证报告模板 |
| ac-verification.md | `references/ac-verification.md` | AC 验证方法指南 |
| gate-conditions.md | `references/gate-conditions.md` | 门控条件参考 |

### 2.3 Interface Consistency Check

- [x] 无需新增 TypeScript 类型（纯 Skill 实现）
- [x] 输出格式与现有设计文档一致
- [x] 复用现有 CLI 命令接口

## 3. Detailed Design

### 3.1 Skill Structure

```
.claude/skills/sdf-test/
├── SKILL.md                 # 核心指令 (主文件)
├── templates/
│   └── test-report.md       # 测试验证报告模板
└── references/
    ├── ac-verification.md   # AC 验证方法指南
    └── gate-conditions.md   # 门控条件参考
```

### 3.2 SKILL.md Design

**Frontmatter**:
```yaml
---
name: sdf-test
description: |
  SoloDevFlow T 阶段：测试验收。
  验证实现满足需求，确认 AC 通过并更新状态。
  当用户通过 /next 进入 T 阶段，或说"测试"、"验收"、"检查"时触发。
  输出 docs/test-reports/<domain>/test-<name>.md 验证报告。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---
```

**核心工作流 (4 步精简)**:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Gate Check + Load Context                           │
│ ─────────────────────────────────────────────────────────── │
│ C→T 门控检查:                                                │
│ - 代码实现完成？                                             │
│ - AC 已定义？                                                │
│ - 遵循设计？                                                 │
│                                                              │
│ 加载上下文:                                                  │
│ - Read docs/requirements/<domain>/feat-<name>.md            │
│ - 提取 AC 列表                                               │
│ - Read docs/design/<domain>/des-<name>.md (如存在)          │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Run Automated Tests (If Applicable)                  │
│ ─────────────────────────────────────────────────────────── │
│ 检查测试脚本:                                                │
│ - Read package.json → scripts.test                          │
│ - 或 pytest.ini, Makefile 等                                │
│                                                              │
│ 如有测试:                                                    │
│ - Bash: npm test / pytest / make test                       │
│ - 记录输出和结果                                             │
│                                                              │
│ 如无测试:                                                    │
│ - 跳过，记录 "No automated tests"                           │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Verify AC + Update Feature Doc (think hard)         │
│ ─────────────────────────────────────────────────────────── │
│ For each AC:                                                 │
│   1. 使用决策树选择验证方法                                  │
│   2. 执行验证                                                │
│   3. 记录结果 (PASS/FAIL)                                    │
│   4. 如 FAIL，记录原因                                       │
│                                                              │
│ 更新 Feature 文档:                                           │
│ - Edit AC 复选框 [ ] → [x]                                   │
│                                                              │
│ Thinking: think hard (需要仔细验证)                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Decision + Output                                    │
│ ─────────────────────────────────────────────────────────── │
│ T→Done 门控检查:                                             │
│ - 所有 AC 通过？                                             │
│ - 无阻塞问题？                                               │
│                                                              │
│ 询问用户确认:                                                │
│ - APPROVE → 更新 status: done                               │
│ - REJECT → 返回 C 阶段修复                                   │
│                                                              │
│ 写入验证报告:                                                │
│ - Write docs/test-reports/<domain>/test-<name>.md           │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Test Verification Report Template

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

### 3.4 AC Verification Decision Tree

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

**验证方法详解**:

| Method | When to Use | How to Verify | Example |
|--------|-------------|---------------|---------|
| **Automated** | 有测试脚本 | `npm test` 通过 | 单元测试覆盖的功能 |
| **Code Review** | 检查代码实现 | Glob + Read 确认代码存在 | "函数已实现" |
| **Documentation** | 检查文件存在 | Glob 确认文件存在 | "文档已创建" |
| **Manual** | 需要运行观察 | 执行命令检查输出 | "CLI 输出正确" |

### 3.5 Gate Conditions

#### C→T Gate

```
=== C→T Gate Check: feat-xxx ===

Conditions:
  [?] 代码实现完成 (检查 src/ 变更)
  [?] AC 已定义 (检查 Feature 文档)
  [?] 遵循设计 (比对设计文档)

Result: CAN PROCEED / CANNOT PROCEED
```

**检查逻辑**:

| Condition | Check Method |
|-----------|--------------|
| code-complete | Glob src/ 检查相关文件存在 |
| ac-defined | Read Feature 文档，检查 AC 部分非空 |
| design-followed | Read 设计文档，比对实现 |

#### T→Done Gate

```
=== T→Done Gate Check: feat-xxx ===

Conditions:
  [?] 所有 AC 通过 (X/Y, 100%)
  [?] 无阻塞问题
  [?] 用户确认

Result: Feature COMPLETED / REJECTED
```

## 4. Integration

### 4.1 Dependency Integration

**与 doc-indexer 集成**:
```bash
# 获取 Feature AC 列表
Read docs/requirements/<domain>/feat-<name>.md
# 解析 Section 4. Acceptance Criteria
```

**与 dependency-graph 集成**:
```bash
# C→T 门控检查
node dist/index.js next <feature-id>
```

### 4.2 Feature Document Sync

验证完成后，直接更新 Feature 文档中的 AC 复选框：

```bash
# 原始
### AC-1: Skill Structure
- [ ] `.claude/skills/sdf-test/SKILL.md` 已创建

# 更新后
### AC-1: Skill Structure
- [x] `.claude/skills/sdf-test/SKILL.md` 已创建
```

### 4.3 Trigger Integration

```
User: /next feat-xxx
  ↓
Gate Check: C→T 通过
  ↓
System: "进入 Testing 阶段，是否使用 sdf-test Skill?"
  ↓
User: 确认
  ↓
Execute: sdf-test Skill
```

## 5. Test Strategy

### 5.1 Verification Approach

由于 sdf-test 是 Claude Skill（非代码），验证方式：

| 验证点 | 方法 |
|--------|------|
| Skill 结构正确 | 检查文件存在性 |
| 模板有效 | 手动测试生成验证报告 |
| 工作流完整 | 端到端测试一个 Feature |
| AC 同步正确 | 检查 Feature 文档更新 |

### 5.2 E2E Test Case

```
Test: Verify feat-sdf-design using sdf-test Skill

Steps:
1. 确保 feat-sdf-design 在 implementing 状态
2. 运行 /next feat-sdf-design
3. 确认进入 T 阶段
4. 触发 sdf-test Skill
5. 验证：
   - C→T 门控检查正确
   - AC 逐条验证
   - Feature 文档 AC 复选框更新
   - 验证报告生成到 docs/test-reports/CoreEngine/
   - 状态更新为 done
```

## 6. Trade-offs & Alternatives

### 6.1 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **4 步精简** (选择) | Gate→Test→Verify→Decision | 简洁，聚焦验证 | 可能遗漏边缘情况 |
| 7 步完整 | 原设计 | 更全面 | 过于复杂，T 阶段不需要 |
| 独立报告 | 不更新 Feature 文档 | 解耦 | 数据不一致风险 |

### 6.2 Decision Rationale

选择 **4 步精简 + AC 同步** 因为：
1. T 阶段核心是"确认"而非"发现"
2. Feature 文档是单一数据源
3. 轻量化报告减少维护负担
4. 简化流程提高执行效率

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AC 验证不准确 | Medium | High | 决策树 + 人工确认 |
| 自动化测试失败 | Low | Medium | 记录输出，返回 C 阶段 |
| Feature 文档更新冲突 | Low | Low | 使用 Edit 工具精确更新 |

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| 验证报告生成成功率 | 100% |
| AC 状态同步准确率 | 100% |
| T→Done 门控准确性 | 100% |

---

*Design: feat-sdf-test*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: draft*
*Depends On: des-doc-indexer, des-dependency-graph*
