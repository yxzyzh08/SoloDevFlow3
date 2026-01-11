---
name: sdf-design
description: |
  SoloDevFlow D 阶段：技术设计。
  将需求文档转化为结构化技术设计文档，确保架构一致性。
  当用户通过 /next 进入 D 阶段，或说"设计"、"怎么实现"、
  "技术方案"等意图时触发。
  输出 docs/design/<domain>/des-<name>.md 文档。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# SDF Technical Designer

> R-D-C-T 工作流的第二阶段：将需求转化为技术设计，确保架构一致性。

## 核心原则

- **Architecture First**: 设计前必须读取架构文档
- **Reuse Over Create**: 优先复用现有组件
- **Consistency Check**: 确保接口风格一致
- **ADR When Needed**: 重大决策需要记录
- **AI-First Format**: 生成文档遵循 `doc-standards.md` 规范

## 执行工作流

复制此清单跟踪进度：

```
Design Progress:
- [ ] Step 0: 加载架构上下文
- [ ] Step 1: 加载 Feature 上下文
- [ ] Step 2: 架构一致性检查
- [ ] Step 3: 分析依赖接口
- [ ] Step 4: 探索代码库
- [ ] Step 5: 生成设计文档 (ultrathink)
- [ ] Step 6: 更新架构文档
- [ ] Step 7: 输出并汇报
```

### Step 0: 加载架构上下文

```bash
# 必读文件
Read docs/architecture/ARCHITECTURE.md    # 获取架构全景
```

**提取关键信息**：
- Component Map (已实现组件)
- Interface Contracts (接口约定)
- Design Patterns in Use (已用模式)
- Constraints (约束条件)

### Step 1: 加载 Feature 上下文

```bash
# 读取需求文档
Read docs/requirements/<domain>/feat-<name>.md
```

**提取关键信息**：
- summary, tags, dependencies
- Acceptance Criteria (AC)
- Technical Constraints
- Scope (包含/不包含)

### Step 2: 架构一致性检查 ⭐

**使用 `think hard` 进行深度分析**

完成以下检查清单：

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

**决策点**：
- 是否引入新模式？ → 标记需要 ADR
- 是否可复用现有组件？ → 记录复用方式

### Step 3: 分析依赖接口

```bash
# 遍历 dependencies.requires
for each dep in dependencies.requires:
  Read docs/design/<domain>/des-<dep>.md  # 如存在
  # 提取接口定义
```

**记录依赖接口**：

| 依赖 | 提供的接口 | 本 Feature 使用方式 |
|------|------------|---------------------|
| doc-indexer | indexFeatures() | 获取 Feature 元数据 |
| dependency-graph | buildGraph() | 获取依赖关系 |

### Step 4: 探索代码库

```bash
# 扫描相关目录
Glob src/**/*.ts
Glob .claude/skills/**/*
```

**识别**：
- 可复用的模块
- 现有代码模式
- 命名约定

### Step 5: 生成设计文档 ⭐

**使用 `ultrathink` 进行深度设计**

使用模板生成设计文档：
- 模板参考: [templates/design.md](templates/design.md)

**必填部分**：
1. Design Overview (问题陈述 + 解决方案)
2. Architecture Alignment (复用分析 + 一致性检查)
3. Detailed Design (模块设计)
4. Integration (依赖集成)
5. Test Strategy (测试策略)
6. Trade-offs & Alternatives (权衡与替代方案)

### Step 6: 更新架构文档

**如有新组件**：
```bash
Edit docs/architecture/ARCHITECTURE.md
# 更新 Component Map
# 更新 Evolution Log
```

**如需 ADR**：
```bash
Write docs/architecture/adr/ADR-XXX.md
```

### Step 7: 输出并汇报

```bash
Write docs/design/<domain>/des-<name>.md
```

**汇报模板**：
```
已完成技术设计：
- 文档: docs/design/<domain>/des-<name>.md
- Domain: <domain>

架构对齐：
- 复用组件: X 个
- 新增组件: Y 个
- 需要 ADR: [是/否]

依赖集成：
- 依赖接口: N 个已分析

下一步：
- [ ] 人工审核设计
- [ ] 确认后进入 C 阶段
```

## D→C 门控条件

设计完成后，进入 Coding 需满足：

| Condition | Check |
|-----------|-------|
| design-exists | `docs/design/<domain>/des-<name>.md` 存在 |
| design-approved | 用户明确同意设计方案 |
| architecture-aligned | Checklist 已完成 |
| adr-created | 如需要，ADR 已创建 |

## 参考资料

- **文档编写规范**: `.claude/steering/doc-standards.md` (生成文档前必读)
- **设计模板**: [templates/design.md](templates/design.md)
- **设计模式参考**: [references/design-patterns.md](references/design-patterns.md)
