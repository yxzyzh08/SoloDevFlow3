---
type: architecture-principles
status: active
last_updated: 2026-01-02
---

# Architecture Principles

> 不可违反的硬性约束。违反任何原则需要创建 ADR 并获得明确批准。

## Core Principles

### P1: Document is Truth

**声明**: 所有系统状态存储在文档中，代码是文档规格的实现。

**约束**:
- Feature 状态存储在 YAML Frontmatter
- 不依赖外部数据库或状态存储
- 每次操作从文档读取最新状态

**验证**: 删除所有运行时状态后，系统应能从文档完全恢复。

---

### P2: AI-First Document Design

**声明**: 文档结构和内容为 AI 理解能力优化，同时保持人类可读性。

**约束**:
- 使用 YAML Frontmatter 存储结构化元数据
- 提供 `summary` 字段用于语义匹配
- 使用 `tags` 字段支持分类搜索
- 使用 `dependencies` 字段声明关系

**验证**: AI 能通过 Frontmatter 快速理解文档目的和关系。

---

### P3: TypeScript for Tools

**声明**: 所有工具代码使用 TypeScript 实现。

**约束**:
- 源码位于 `src/` 目录
- 使用严格类型检查 (`strict: true`)
- 共享类型定义在 `src/types.ts`

**理由**: 类型安全 + IDE 支持 + 与 Node.js 生态兼容。

---

### P4: Modular Independence

**声明**: 模块之间通过明确的接口通信，保持低耦合。

**约束**:
- 模块导出纯函数
- 不共享可变状态
- 依赖通过参数注入

**验证**: 每个模块可以独立测试。

---

### P5: Progressive Disclosure

**声明**: 只加载当前阶段所需的上下文，防止 Token 爆炸。

**约束**:
- R 阶段: 只加载需求文档
- D 阶段: 加载需求 + 架构 + 依赖设计
- C 阶段: 加载设计 + 相关代码
- T 阶段: 加载 AC + 测试相关

**验证**: 每个阶段的 context 加载有明确边界。

---

### P6: Gate-Controlled Transitions

**声明**: 阶段转换必须通过门控检查。

**约束**:
- R→D: 依赖分析完成 + Backlog 清空
- D→C: 设计文档存在 + 人工确认
- C→T: 代码完成 + AC 定义
- T→Done: 所有 AC 通过

**验证**: `/next` 命令执行门控检查。

---

## Technical Principles

### T1: Result Pattern for Errors

**声明**: 使用 Result 模式处理可预期的错误。

```typescript
// Good
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Avoid
throw new Error("something went wrong");
```

---

### T2: Immutable Data Preference

**声明**: 优先使用不可变数据结构。

```typescript
// Good
const newFeatures = [...features, newFeature];

// Avoid
features.push(newFeature);
```

---

### T3: Explicit over Implicit

**声明**: 显式优于隐式。

```typescript
// Good
function buildGraph(features: FeatureIndex[]): DependencyGraph

// Avoid
function buildGraph(): DependencyGraph  // 隐式依赖全局状态
```

---

## Principle Violation Process

如需违反任何原则：

1. 创建 ADR 说明原因
2. 列出替代方案及其权衡
3. 明确违反的影响范围
4. 获得人工确认

---

*These principles are non-negotiable unless explicitly overridden via ADR.*
