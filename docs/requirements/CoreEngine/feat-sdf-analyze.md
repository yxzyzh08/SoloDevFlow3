---
id: feat-sdf-analyze
type: feature
domain: CoreEngine
status: done
priority: critical
created: 2026-01-02

# ===== Semantic Fields (AI-First) =====
summary: "R 阶段需求分析能力 - 将自然语言需求转化为结构化文档，深挖依赖链"
tags: [skill, requirements, workflow, R-phase, dependency-analysis]

# ===== Feature Kind =====
feature_kind: specification

# ===== Dependency Fields =====
dependencies:
  requires: []         # 无前置依赖（基础 Skill）
  blocks:
    - feat-sdf-design  # 为 D 阶段提供模式参考
    - feat-sdf-test    # 为 T 阶段提供模式参考
analyzed: true
---

# SDF-Analyze Skill

> R 阶段需求分析能力 - 将自然语言需求转化为结构化文档，深挖依赖链。

## 1. Requirements

### 1.1 Background

SoloDevFlow 的 R-D-C-T 工作流中，R (Requirements) 阶段是入口，核心职责是：

1. **需求结构化** - 将自然语言转化为标准格式文档
2. **依赖分析** - 深挖前置依赖和后续影响
3. **需求池管理** - 发现的新依赖进入 Backlog

**自举说明**：
本 Feature 通过自举过程创建。在 SoloDevFlow 3.0 项目启动时，sdf-analyze Skill 是第一个被手动创建的 Skill，用于支持后续所有 Feature 的需求分析。本文档是事后补充，以保持文档完整性。

**当前状态**：
- sdf-analyze Skill 已实现并投入使用 ✅
- 已成功用于分析 feat-sdf-design, feat-sdf-test 等 Feature ✅
- 本文档为补充性质，状态直接设为 done ✅

### 1.2 User Stories

作为**开发者**，我希望**用自然语言描述需求后自动生成结构化文档**，以便**保持需求的一致性和可追溯性**。

作为**AI 助手**，我需要**结构化的需求分析流程**，以便**系统性地完成依赖分析并确保无遗漏**。

### 1.3 Scope

**包含**：
- Feature 文档模板
- 依赖分析工作流
- 需求池 (Backlog) 管理
- Domain 路由逻辑
- 验证清单

**不包含**：
- 设计文档生成（D 阶段职责）
- 代码实现（C 阶段职责）
- 测试验收（T 阶段职责）

## 2. Specification

### 2.1 Skill Structure

```
.claude/skills/sdf-analyze/
├── SKILL.md                 # 核心指令
├── templates/
│   ├── feature.md           # Feature 文档模板
│   └── domain-index.md      # Domain 索引模板
└── references/
    ├── dependency-analysis.md   # 依赖分析指南
    └── status-definitions.md    # 状态枚举定义
```

### 2.2 Analysis Workflow

```
Input: 自然语言需求描述

┌─────────────────────────────────────────────────────────────┐
│ Step 1: 读取全局上下文                                       │
│ ─────────────────────────────────────────────────────────── │
│ ├── 读取 docs/product_context.md                            │
│ └── 读取 docs/requirements/backlog.md                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: 定位目标 Domain                                      │
│ ─────────────────────────────────────────────────────────── │
│ ├── 根据需求特征判断 Domain                                  │
│ └── 读取 Domain index.md                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2.5: 确定 Feature 类型                                  │
│ ─────────────────────────────────────────────────────────── │
│ ├── 判断 feature_kind: code | specification                 │
│ └── 选择对应的 AC 和测试策略模板                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 深度依赖分析 ⭐                                      │
│ ─────────────────────────────────────────────────────────── │
│ ├── 3.1 前置依赖分析                                        │
│ ├── 3.2 后续影响分析                                        │
│ ├── 3.3 发现新需求 → Backlog                                │
│ ├── 3.4 加载依赖上下文                                      │
│ └── 3.5 输出依赖分析结果                                    │
│                                                              │
│ Thinking: think hard                                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 创建/更新文档                                        │
│ ─────────────────────────────────────────────────────────── │
│ └── 写入 docs/requirements/<domain>/feat-<name>.md          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: 处理需求池                                           │
│ ─────────────────────────────────────────────────────────── │
│ ├── 新依赖加入 Backlog                                      │
│ └── 检查是否可进入 D 阶段                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: 验证并汇报                                           │
│ ─────────────────────────────────────────────────────────── │
│ ├── 验证清单检查                                            │
│ └── 输出分析结果摘要                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Feature Document Template

参见 `.claude/skills/sdf-analyze/templates/feature.md`

核心字段：
- `id`: Feature 唯一标识
- `type`: feature | bug | enhancement
- `domain`: 所属领域
- `status`: 状态枚举
- `feature_kind`: code | specification
- `summary`: 一句话描述（AI 语义匹配用）
- `tags`: 标签列表
- `dependencies`: 依赖声明

### 2.4 Trigger

```
用户输入含以下意图时自动触发：
- "添加"、"实现"、"我想要"
- "能不能"、"帮我做"
- 明确的功能需求描述
```

## 3. Dependency Analysis

> 本 Feature 是基础 Skill，无前置依赖

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| Glob/Read Tools | Infra | Claude Built-in | 读取文档 |
| Write/Edit Tools | Infra | Claude Built-in | 写入文档 |

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| feat-sdf-design | Feature | High | 提供需求分析模式参考 |
| feat-sdf-test | Feature | High | 提供需求分析模式参考 |
| 所有新 Feature | Feature | High | 所有 Feature 通过此 Skill 创建 |

### 3.3 New Backlog Items

(无 - 基础 Skill)

### 3.4 Dependency Interaction Analysis

本 Skill 是基础设施，被其他 Skill 参考但不依赖其他 Feature。

### 3.5 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在
- [x] 后续影响已评估
- [x] 无新增依赖到 Backlog

**Status**: Done (自举完成)

## 4. Acceptance Criteria

> **重要**：本 Feature 是**规范类 Feature**（Skill 定义），不是代码。
> 验收方式：**规范完整性 + 试运行验证 + 输出结构检查**，而非单元测试。
>
> **验收流程**：
> 1. Layer 1: 规范完整性 → Glob 检查 Skill 文件存在
> 2. Layer 2: 试运行验证 → 用自然语言描述需求，观察生成的文档
> 3. Layer 3: 输出结构验证 → 检查生成的 Feature 文档结构
> 4. Layer 4: 人工确认 → 用户批准完成

### AC-1: Skill Structure
- [x] `.claude/skills/sdf-analyze/SKILL.md` 已创建
- [x] Feature 文档模板已创建
- [x] 依赖分析指南已创建
- [x] 状态定义参考已创建

### AC-2: Analysis Workflow
- [x] Step 1-6 流程完整定义
- [x] 依赖分析决策树已定义
- [x] Feature 类型判断逻辑已添加

### AC-3: Output Generation
- [x] 能生成符合模板的 Feature 文档
- [x] 文档包含完整依赖分析部分
- [x] 文档保存到正确路径

### AC-4: Backlog Integration
- [x] 新发现的依赖能加入 Backlog
- [x] 能检查需求池状态
- [x] 能判断是否可进入 D 阶段

## 5. Technical Constraints

- **Claude Tools Only**: 使用 Glob, Read, Write, Edit, Grep
- **Template-Based**: 基于模板生成，保持一致性
- **Human Review**: 需求文档需人工确认后才能进入 D 阶段

## 6. Test Strategy

> 规范类 Feature 的测试策略

### 6.1 Specification Completeness
- [x] Skill 文件存在性检查 (Glob)
- [x] 模板结构验证

### 6.2 Trial Run Verification
- [x] 试运行场景: 用自然语言描述新需求
- [x] 观察流程完整性: 6 步流程全部执行
- [x] 输出结构验证: 生成的 Feature 文档符合模板

**验证记录**：
- 已成功用于分析 feat-sdf-design ✅
- 已成功用于分析 feat-sdf-test ✅
- 已成功用于分析 feat-doc-indexer ✅
- 已成功用于分析 feat-dependency-graph ✅

---

*Feature: sdf-analyze*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: done*
*Kind: specification*
*Note: 自举创建，文档事后补充*
