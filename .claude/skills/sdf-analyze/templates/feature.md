---
id: feat-<feature-name>
type: feature
domain: <DomainId>
status: proposed
priority: critical | high | medium | low
created: <YYYY-MM-DD>

# ===== Semantic Fields (AI-First) =====
summary: "<一句话描述 Feature 的核心价值，用于 AI 快速匹配>"  # Required
tags: [tag1, tag2]   # Recommended

# ===== Feature Kind (NEW) =====
# code: 产出代码 (src/)，使用单元测试验收
# specification: 产出规范 (.claude/skills/ 或 docs/)，使用试运行验收
feature_kind: code | specification

# ===== Dependency Fields =====
dependencies:
  requires: []       # 前置依赖的 Feature ID
  blocks: []         # 被本 Feature 阻塞的 Feature ID
analyzed: false      # 依赖分析是否完成
---

# <Feature Title in English>

> {{summary}}

## 1. Requirements

### 1.1 Background

[为什么需要这个 Feature？解决什么问题？]

### 1.2 User Stories

作为 [角色]，我希望 [功能]，以便 [价值]。

### 1.3 Scope

**包含**：
- [明确在范围内的功能点]

**不包含**：
- [明确排除的功能点]

## 2. Specification

[功能规格详细说明]

## 3. Dependency Analysis

> 此部分必须在进入 Design 阶段前完成

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| - | - | - | - |

**Dependency Types**:
- `Feature`: 依赖其他 Feature
- `Data`: 依赖数据模型/结构
- `Infra`: 依赖基础设施能力
- `External`: 依赖外部服务/API

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| - | - | - | - |

### 3.3 New Backlog Items

<!--
如果发现了新的依赖需求，列在此处：
- backlog-xxx: 描述
-->

(无新增)

### 3.4 Dependency Interaction Analysis

> 对每个已存在的依赖 Feature，记录其提供的能力和本 Feature 的使用方式

<!--
完成 Step 3.4 (加载依赖上下文) 后，按以下模板填写：

#### Interaction with <dep-feature-id>

**Source**: docs/requirements/<domain>/<dep-feature>.md
**Status**: [proposed/analyzing/implementing/done]

**Capabilities Provided**:
- `<接口/功能名>`: <描述>

**How This Feature Uses It**:
- <具体如何使用该依赖>

**Data Contract**:
- Input: <数据格式>
- Output: <数据格式>

**Constraints & Notes**:
- <从依赖文档中提取的限制>

**Design Implications**:
- <需要在 D 阶段考虑的设计点>
-->

(待分析)

### 3.5 Analysis Conclusion

- [ ] 所有前置依赖已识别
- [ ] 所有前置依赖已存在或已加入 Backlog
- [ ] 后续影响已评估

**Status**: Pending / Ready for Design

## 4. Acceptance Criteria

<!--
根据 feature_kind 选择对应的验收模板：

=== 如果 feature_kind: code ===
使用单元测试 + 运行时验证：

### AC-1: [Criteria Name]
- [ ] [具体可验证的条件]
- [ ] 单元测试覆盖: [测试文件路径]
- [ ] 运行时验证: [npm test / 命令输出]

=== 如果 feature_kind: specification ===
使用试运行 + 人工验收：

> **重要**：本 Feature 是**规范类 Feature**（Skill/规范定义），不是代码。
> 验收方式：**规范完整性 + 试运行验证 + 输出结构检查**，而非单元测试。
>
> **验收流程**：
> 1. Layer 1: 规范完整性 → Glob 检查 Skill/规范文件存在
> 2. Layer 2: 试运行验证 → 选择真实场景执行，观察流程
> 3. Layer 3: 输出结构验证 → 检查生成的文档/输出结构
> 4. Layer 4: 人工确认 → 用户批准完成

### AC-1: [Criteria Name]
- [ ] [规范文件路径] 已创建
- [ ] 试运行: [执行场景描述]
- [ ] 输出验证: [预期输出结构]
-->

### AC-1: [Criteria Name]
- [ ] [具体可验证的条件]
- [ ] [具体可验证的条件]

### AC-2: [Criteria Name]
- [ ] [具体可验证的条件]

## 5. Technical Constraints

[如有特定技术要求，在此说明]

## 6. Test Strategy

<!--
根据 feature_kind 选择对应的测试策略：

=== 如果 feature_kind: code ===
### 6.1 Unit Test Approach
- 测试文件: tests/<module>.test.ts
- 覆盖目标: [核心函数/模块]

### 6.2 Integration Test Approach
- 集成测试: [API/CLI 端到端测试]

=== 如果 feature_kind: specification ===
### 6.1 Specification Completeness
- 规范文件存在性检查 (Glob)
- 规范结构验证

### 6.2 Trial Run Verification
- 试运行场景: [选择真实 Feature/场景执行]
- 观察流程完整性
- 输出结构验证
-->

[根据 feature_kind 填写]

---

*Feature: <feature-name>*
*Domain: <DomainId>*
*Created: <date>*
*Status: proposed*
*Dependencies Analyzed: false*
*Kind: code | specification*
