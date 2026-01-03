---
id: feat-sdf-design
type: feature
domain: CoreEngine
status: done
priority: critical
created: 2026-01-02

# ===== Semantic Fields (AI-First) =====
summary: "D 阶段设计能力 - 根据需求文档和代码库结构生成技术设计文档"
tags: [skill, design, workflow, D-phase]

# ===== Feature Kind =====
feature_kind: specification

# ===== Dependency Fields =====
dependencies:
  requires:
    - feat-doc-indexer        # 获取 Feature 元数据
    - feat-dependency-graph   # 获取依赖图
  blocks: []
analyzed: true
---

# SDF-Design Skill

> D 阶段设计能力 - 根据需求文档和代码库结构生成技术设计文档。

## 1. Requirements

### 1.1 Background

SoloDevFlow 的 R-D-C-T 工作流中，D (Design) 阶段需要：

1. **理解需求** - 读取 Feature 需求文档
2. **分析上下文** - 了解代码库结构和现有模式
3. **评估依赖** - 确认所有依赖的接口和约束
4. **输出设计** - 生成结构化的技术设计文档

当前状态：
- R 阶段有 `sdf-analyze` Skill ✅
- D 阶段缺少专门的 Skill ❌
- 设计文档生成依赖人工操作

### 1.2 User Stories

作为**开发者**，我希望**在进入 D 阶段时自动获得设计指导**，以便**快速产出高质量的技术方案**。

作为**AI 助手**，我需要**结构化的设计流程**，以便**系统性地完成从需求到设计的转换**。

### 1.3 Scope

**包含**：
- 设计文档模板
- 设计流程指导
- 依赖接口分析
- 架构决策记录
- 与已实现工具的集成

**不包含**：
- 自动代码生成（C 阶段职责）
- 可视化设计工具
- UML 图自动生成

## 2. Specification

### 2.1 Skill Structure

```
.claude/skills/sdf-design/
├── SKILL.md                 # 核心指令
├── templates/
│   └── design.md            # 设计文档模板
└── references/
    └── design-patterns.md   # 常用设计模式参考
```

### 2.2 Design Document Template (Enhanced)

```markdown
---
id: des-<name>
type: design
domain: <DomainId>
status: draft | approved
created: <date>
requirement: docs/requirements/<domain>/feat-<name>.md
architecture_aligned: true | false
adr_created: [] | [ADR-XXX]
---

# <Feature> - Technical Design

## 1. Design Overview
### 1.1 Problem Statement
### 1.2 Solution Approach
### 1.3 Key Decisions (ADR References)

## 2. Architecture Alignment
### 2.1 Reused Components
### 2.2 New Components
### 2.3 Interface Consistency Check

## 3. Detailed Design
### 3.1 Module: <name>
### 3.2 Module: <name>

## 4. Integration
### 4.1 Dependency Integration
### 4.2 API Contracts

## 5. Test Strategy
### 5.1 Unit Test Approach
### 5.2 Integration Test Approach

## 6. Trade-offs & Alternatives
### 6.1 Options Considered
### 6.2 Decision Rationale

## 7. Risks & Mitigations

## 8. Success Metrics
```

### 2.3 Design Workflow (Enhanced with Architecture Check)

```
Input: Feature ID (e.g., feat-xxx)

┌─────────────────────────────────────────────────────────────┐
│ Step 0: Load Architecture Context (NEW)                     │
│ ─────────────────────────────────────────────────────────── │
│ ├── Read docs/architecture/ARCHITECTURE.md                  │
│ ├── Read docs/architecture/principles.md                    │
│ ├── Get current Component Map                               │
│ └── Get existing Interface Contracts                        │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Load Feature Context                                 │
│ ─────────────────────────────────────────────────────────── │
│ ├── 调用 indexFeatures() 获取 Feature 元数据                 │
│ ├── 调用 buildGraph() 获取依赖图                             │
│ └── 读取 Feature 需求文档                                    │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Architecture Consistency Check (NEW)                 │
│ ─────────────────────────────────────────────────────────── │
│ ├── 检查是否可复用现有组件                                   │
│ ├── 检查接口风格是否一致                                     │
│ ├── 识别是否引入新模式                                       │
│ └── 标记是否需要创建 ADR                                     │
│                                                              │
│ Thinking: think hard (需要深度分析)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Analyze Dependencies                                 │
│ ─────────────────────────────────────────────────────────── │
│ ├── 遍历 dependencies.requires                               │
│ ├── 读取每个依赖的设计文档（如存在）                         │
│ ├── 提取接口定义和约束                                       │
│ └── 确保与 ARCHITECTURE.md 中的接口一致                      │
│                                                              │
│ Thinking: think hard                                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Explore Codebase                                     │
│ ─────────────────────────────────────────────────────────── │
│ ├── Glob 扫描相关目录                                        │
│ ├── 识别现有模式 (参考 patterns/)                            │
│ └── 找到可复用的组件                                         │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Generate Design                                      │
│ ─────────────────────────────────────────────────────────── │
│ ├── 填充增强版设计模板                                       │
│ ├── 填写 Architecture Alignment 部分                         │
│ ├── 填写 Trade-offs & Alternatives                           │
│ ├── 定义 Test Strategy                                       │
│ └── 如需要，创建 ADR 草稿                                    │
│                                                              │
│ Thinking: ultrathink (架构决策需要深度思考)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Update Architecture (NEW)                            │
│ ─────────────────────────────────────────────────────────── │
│ ├── 如有新组件，更新 ARCHITECTURE.md Component Map           │
│ ├── 如有新接口，更新 Interface Contracts                     │
│ ├── 更新 Evolution Log                                       │
│ └── 如有 ADR，保存到 adr/                                    │
│                                                              │
│ Thinking: 标准模式                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Output                                               │
│ ─────────────────────────────────────────────────────────── │
│ └── 写入 docs/design/<domain>/des-<name>.md                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Architecture Alignment Checklist

设计时必须完成以下检查：

```markdown
## Architecture Alignment Checklist

### Principles Compliance
- [ ] 使用 TypeScript
- [ ] 类型定义在 src/types.ts 或本模块内
- [ ] 遵循现有错误处理模式 ({ success, error })

### Reuse Analysis
- [ ] 已检查 doc-indexer 是否可复用
- [ ] 已检查 dependency-graph 是否可复用
- [ ] 如不复用，说明原因: _______________

### Interface Consistency
- [ ] 输入输出类型与现有接口风格一致
- [ ] 函数命名遵循现有约定

### Pattern Usage
- [ ] 使用的设计模式: _______________
- [ ] 模式已在 patterns/ 记录
- [ ] 或：需要创建 ADR

### Update Required
- [ ] 更新 ARCHITECTURE.md Component Map
- [ ] 更新 ARCHITECTURE.md Evolution Log
```

### 2.4 CLI Integration

设计阶段可调用已实现的工具：

```typescript
// 获取 Feature 信息
import { indexFeatures } from 'src/doc-indexer';
const result = await indexFeatures(basePath);
const feature = result.features.find(f => f.id === featureId);

// 获取依赖图
import { buildGraph, getOutgoingEdges } from 'src/dependency-graph';
const graph = buildGraph(result.features);
const deps = getOutgoingEdges(graph, featureId);
```

或通过 CLI：

```bash
node dist/index.js status --export  # 导出完整上下文
```

### 2.5 Trigger

```
User: /next feat-xxx
  ↓
Gate Check: R→D 通过
  ↓
Prompt: "进入 Design 阶段，是否使用 sdf-design Skill?"
  ↓
User: 确认
  ↓
Execute: sdf-design Skill
```

## 3. Dependency Analysis

> 此部分必须在进入 Design 阶段前完成

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| **feat-doc-indexer** | Feature | **done** | 获取 Feature 元数据 (summary, tags, deps) |
| **feat-dependency-graph** | Feature | **done** | 获取依赖图，分析依赖接口 |
| Glob/Read Tools | Infra | Claude Built-in | 探索代码库结构 |

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| /next 命令 | Command | High | D 阶段触发设计 Skill |
| feat-workflow-orchestration | Feature | High | 完成 D 阶段能力 |
| docs/design/ | Directory | High | 输出设计文档 |

### 3.3 New Backlog Items

(无新增 - 所有依赖已实现)

### 3.4 Dependency Interaction Analysis

#### Interaction with feat-doc-indexer

**Source**: docs/requirements/DocSystem/feat-doc-indexer.md
**Status**: done

**Capabilities Provided**:
- `indexFeatures()`: 扫描并索引所有 Feature 文档
- `parseFeatureFile()`: 解析单个 Feature 的 Frontmatter
- `formatIndexResult()`: 格式化输出

**How This Feature Uses It**:
- 获取目标 Feature 的 summary, tags, dependencies
- 获取所有 Feature 列表用于依赖分析

**Data Contract**:
- Input: basePath (项目根目录)
- Output: IndexResult { features, domains, stats, validation }

**Design Implications**:
- 设计流程第一步调用 indexFeatures()
- 可利用 validation 检查 Feature 文档完整性

#### Interaction with feat-dependency-graph

**Source**: docs/requirements/DocSystem/feat-dependency-graph.md
**Status**: done

**Capabilities Provided**:
- `buildGraph()`: 构建依赖图
- `getOutgoingEdges()`: 获取 Feature 的依赖列表
- `topologicalSort()`: 获取执行顺序

**How This Feature Uses It**:
- 获取目标 Feature 的所有依赖
- 确定设计需要考虑的依赖接口

**Data Contract**:
- Input: FeatureIndex[]
- Output: DependencyGraph { nodes, edges }

**Design Implications**:
- 设计时需遍历所有依赖，提取其接口定义

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
> 2. Layer 2: 试运行验证 → 选择真实 Feature 执行，观察流程
> 3. Layer 3: 输出结构验证 → 检查生成的设计文档结构
> 4. Layer 4: 人工确认 → 用户批准完成

### AC-1: Skill Structure
- [x] `.claude/skills/sdf-design/SKILL.md` 已创建
- [x] 设计文档模板已创建
- [x] 设计模式参考文档已创建

### AC-2: Design Workflow
- [x] 能读取 Feature 需求文档
- [x] 能调用 doc-indexer 获取元数据
- [x] 能调用 dependency-graph 获取依赖
- [x] 能探索代码库结构

### AC-3: Output Generation
- [x] 能生成符合模板的设计文档
- [x] 设计文档包含依赖接口分析
- [x] 设计文档保存到正确路径

### AC-4: Integration
- [x] /next 命令 D 阶段触发设计 Skill
- [x] 状态正确更新为 designing

### AC-5: Architecture Alignment (NEW)
- [x] 设计前读取 ARCHITECTURE.md
- [x] 填写 Architecture Alignment Checklist
- [x] 如引入新模式，创建 ADR 草稿
- [x] 如新增组件，更新 Component Map

## 5. Technical Constraints

- **Claude Tools Only**: 使用 Glob, Read, Write
- **Leverage Existing**: 复用 src/ 下的 TypeScript 模块
- **Template-Based**: 基于模板生成，保持一致性
- **Human Review**: 设计文档需人工确认后才能进入 C 阶段

## 6. D→C Gate Conditions (NEW)

设计完成后，进入 Coding 阶段需满足以下条件：

| Condition | Check | Description |
|-----------|-------|-------------|
| design-exists | `docs/design/<domain>/des-<name>.md` 存在 | 设计文档已创建 |
| design-approved | 人工确认 | 用户明确同意设计方案 |
| architecture-aligned | Checklist 完成 | Architecture Alignment Checklist 已填写 |
| adr-created | 如需要 | 新模式/架构变更已记录 ADR |

**Gate Check 输出示例**:

```
=== D→C Gate Check: feat-sdf-design ===

Conditions:
  [PASS] 设计文档已创建 (docs/design/CoreEngine/des-sdf-design.md)
  [PASS] 设计已获批准 (user approved)
  [PASS] 架构对齐检查完成 (checklist: 8/8)
  [PASS] ADR 已创建 (ADR-003)

Result: CAN PROCEED to Coding phase
```

## 7. Design Decisions (内嵌设计)

> 规范类 Feature 的设计内嵌在需求文档中，无需独立设计文档。

### 7.1 Trade-offs & Alternatives

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Skill-Based** (选择) | Claude Skill 实现 | 与现有模式一致，灵活 | 依赖 AI 执行质量 |
| Code-Based | TypeScript 脚本 | 可测试，确定性 | 过度工程化 |
| Hybrid | Skill + TypeScript | 最佳灵活性 | 复杂度增加 |

**Decision Rationale**:
1. 与 sdf-analyze 保持一致
2. 设计过程需要 AI 理解和创造力
3. 当前规模不需要复杂的代码实现
4. 模板 + 指令 = 足够的结构化

### 7.2 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI 不遵循模板 | Medium | Medium | 明确的模板结构 + 检查清单 |
| 漏掉架构检查 | Low | High | Checklist 强制 |
| 设计文档质量不一致 | Medium | Medium | 人工审核 + D→C 门控 |

### 7.3 Success Metrics

| Metric | Target |
|--------|--------|
| 设计文档生成成功率 | 100% |
| 架构对齐检查完成率 | 100% |
| 设计到编码转换顺畅度 | 人工反馈 |

---

*Feature: sdf-design*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: done*
*Dependencies Analyzed: true*
*Feature Kind: specification*
