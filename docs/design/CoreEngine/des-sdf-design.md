---
id: des-sdf-design
type: design
domain: CoreEngine
status: draft
created: 2026-01-02
requirement: docs/requirements/CoreEngine/feat-sdf-design.md
depends-on: [des-doc-indexer, des-dependency-graph]
architecture_aligned: true
adr_created: []
---

# SDF-Design Skill - Technical Design

> 技术设计文档：定义 Claude 如何实现 D 阶段设计能力。

## 1. Design Overview

### 1.1 Problem Statement

D 阶段需要将需求文档转化为技术设计文档。当前依赖人工操作，缺乏：
- 结构化的设计流程
- 与现有工具的集成
- 架构一致性检查

### 1.2 Solution Approach

与 sdf-analyze 一致，sdf-design 是：

1. **Skill-Based**: 通过 Claude Skill 实现设计流程
2. **Tool-Driven**: 使用 Claude 内置工具 (Glob, Read, Write) + 已实现的 CLI
3. **Template-Based**: 基于模板生成设计文档
4. **Architecture-Aware**: 集成架构一致性检查

### 1.3 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 实现方式 | Claude Skill | 与 sdf-analyze 保持一致 |
| 模板位置 | .claude/skills/sdf-design/templates/ | 遵循现有结构 |
| 输出路径 | docs/design/<domain>/des-<name>.md | 已在需求中定义 |
| 依赖集成 | 调用已有 TypeScript CLI | 复用现有能力 |

## 2. Architecture Alignment

### 2.1 Reused Components

| Component | How Used |
|-----------|----------|
| doc-indexer | 获取 Feature 元数据和依赖信息 |
| dependency-graph | 获取依赖图，分析依赖接口 |
| sdf-analyze 模式 | 复用 Skill 目录结构和工作流模式 |

### 2.2 New Components

| Component | Location | Description |
|-----------|----------|-------------|
| sdf-design Skill | `.claude/skills/sdf-design/` | D 阶段核心能力 |
| design.md 模板 | `templates/design.md` | 设计文档模板 |
| design-patterns.md | `references/design-patterns.md` | 常用设计模式参考 |

### 2.3 Interface Consistency Check

- [x] 无需新增 TypeScript 类型（纯 Skill 实现）
- [x] 输出格式与 des-doc-indexer, des-dependency-graph 一致
- [x] 复用现有 CLI 命令接口

## 3. Detailed Design

### 3.1 Skill Structure

```
.claude/skills/sdf-design/
├── SKILL.md                 # 核心指令 (主文件)
├── templates/
│   └── design.md            # 设计文档模板
└── references/
    └── design-patterns.md   # 常用设计模式参考
```

### 3.2 SKILL.md Design

**Frontmatter**:
```yaml
---
name: sdf-design
description: |
  SoloDevFlow D 阶段：技术设计。
  将需求文档转化为结构化技术设计文档。
  当用户通过 /next 进入 D 阶段，或说"设计"、"怎么实现"时触发。
  输出 docs/design/<domain>/des-<name>.md 文档。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---
```

**核心工作流**:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 0: Load Architecture Context                           │
│ ─────────────────────────────────────────────────────────── │
│ Read docs/architecture/ARCHITECTURE.md                       │
│ - 获取 Component Map                                         │
│ - 获取 Interface Contracts                                   │
│ - 获取 Design Patterns in Use                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Load Feature Context                                 │
│ ─────────────────────────────────────────────────────────── │
│ Read docs/requirements/<domain>/feat-<name>.md               │
│ 提取：                                                       │
│ - summary, tags, dependencies                               │
│ - AC (验收标准)                                              │
│ - Technical Constraints                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Architecture Consistency Check                       │
│ ─────────────────────────────────────────────────────────── │
│ 检查：                                                       │
│ - 是否可复用现有组件？                                       │
│ - 接口风格是否一致？                                         │
│ - 是否引入新模式？→ 标记需要 ADR                            │
│                                                              │
│ 输出：Architecture Alignment Checklist                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Analyze Dependencies                                 │
│ ─────────────────────────────────────────────────────────── │
│ For each dep in dependencies.requires:                       │
│   - Read docs/design/<domain>/des-<dep>.md (如存在)          │
│   - 提取接口定义                                             │
│   - 记录 Integration Points                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Explore Codebase                                     │
│ ─────────────────────────────────────────────────────────── │
│ Glob src/**/*.ts                                             │
│ - 识别相关模块                                               │
│ - 找到可复用的代码                                           │
│ - 确认现有模式                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Generate Design (ultrathink)                         │
│ ─────────────────────────────────────────────────────────── │
│ 使用 templates/design.md 模板                                │
│ 填充：                                                       │
│ - Design Overview                                            │
│ - Architecture Alignment                                     │
│ - Detailed Design                                            │
│ - Integration                                                │
│ - Test Strategy                                              │
│ - Trade-offs & Alternatives                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Update Architecture                                  │
│ ─────────────────────────────────────────────────────────── │
│ 如有新组件：                                                 │
│ - Edit docs/architecture/ARCHITECTURE.md                     │
│ - 更新 Component Map                                         │
│ - 更新 Evolution Log                                         │
│                                                              │
│ 如需 ADR：                                                   │
│ - Write docs/architecture/adr/ADR-XXX.md                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Output                                               │
│ ─────────────────────────────────────────────────────────── │
│ Write docs/design/<domain>/des-<name>.md                     │
│ 汇报完成状态                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Design Document Template

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

### 3.4 Architecture Alignment Checklist

设计时必须完成以下检查：

```markdown
## Architecture Alignment Checklist

### Principles Compliance
- [ ] 使用 TypeScript (如涉及代码)
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

## 4. Integration

### 4.1 Dependency Integration

**与 doc-indexer 集成**:
```bash
# 通过 CLI 获取 Feature 索引
node dist/index.js status --export

# 或在 Skill 中直接读取文件
Read docs/requirements/<domain>/feat-<name>.md
# 解析 YAML Frontmatter 获取元数据
```

**与 dependency-graph 集成**:
```bash
# 通过 CLI 检查门控
node dist/index.js next <feature-id>
```

### 4.2 Trigger Integration

```
User: /next feat-xxx
  ↓
Gate Check: R→D 通过
  ↓
System: "进入 Design 阶段，是否使用 sdf-design Skill?"
  ↓
User: 确认
  ↓
Execute: sdf-design Skill
```

## 5. Test Strategy

### 5.1 Verification Approach

由于 sdf-design 是 Claude Skill（非代码），验证方式：

| 验证点 | 方法 |
|--------|------|
| Skill 结构正确 | 检查文件存在性 |
| 模板有效 | 手动测试生成设计文档 |
| 工作流完整 | 端到端测试一个 Feature |

### 5.2 E2E Test Case

```
Test: Design feat-sdf-test using sdf-design Skill

Steps:
1. 运行 /next feat-sdf-test
2. 确认进入 D 阶段
3. 触发 sdf-design Skill
4. 验证生成 docs/design/CoreEngine/des-sdf-test.md
5. 验证文档结构符合模板
6. 验证 ARCHITECTURE.md 已更新
```

## 6. Trade-offs & Alternatives

### 6.1 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Skill-Based** (选择) | Claude Skill 实现 | 与现有模式一致，灵活 | 依赖 AI 执行质量 |
| Code-Based | TypeScript 脚本 | 可测试，确定性 | 过度工程化 |
| Hybrid | Skill + TypeScript | 最佳灵活性 | 复杂度增加 |

### 6.2 Decision Rationale

选择 **Skill-Based** 因为：
1. 与 sdf-analyze 保持一致
2. 设计过程需要 AI 理解和创造力
3. 当前规模不需要复杂的代码实现
4. 模板 + 指令 = 足够的结构化

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI 不遵循模板 | Medium | Medium | 明确的模板结构 + 检查清单 |
| 漏掉架构检查 | Low | High | Checklist 强制 |
| 设计文档质量不一致 | Medium | Medium | 人工审核 + D→C 门控 |

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| 设计文档生成成功率 | 100% |
| 架构对齐检查完成率 | 100% |
| 设计到编码转换顺畅度 | 人工反馈 |

---

*Design: feat-sdf-design*
*Domain: CoreEngine*
*Created: 2026-01-02*
*Status: draft*
*Depends On: des-doc-indexer, des-dependency-graph*
