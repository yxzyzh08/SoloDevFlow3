---
type: architecture
status: living
last_updated: 2026-01-05
version: 0.2.0
---

# SoloDevFlow System Architecture

> 活架构文档 - 随项目演进持续更新。每个 Feature 设计前必须阅读本文档。

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SoloDevFlow 3.0                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Claude     │  │    docs/     │  │     src/     │       │
│  │   Skills     │  │  (Truth)     │  │   (Tools)    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                           ▼                                  │
│              ┌─────────────────────────┐                    │
│              │   R-D-C-T Workflow      │                    │
│              │   Requirements          │                    │
│              │   Design                │                    │
│              │   Coding                │                    │
│              │   Testing               │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Component Map

### 2.1 Implemented Components

#### Code Components (需要设计文档)

| Component | Domain | Location | Status | Description |
|-----------|--------|----------|--------|-------------|
| doc-indexer | DocSystem | `src/doc-indexer/` | done | Feature 文档扫描、解析、验证 |
| dependency-graph | DocSystem | `src/dependency-graph/` | done | 依赖图构建、拓扑排序、门控检查 |
| task-manager | CoreEngine | `src/task-manager/` | done | 持久化任务管理，支持依赖关系 |
| CLI | Core | `src/index.ts` | done | 命令行入口 |

#### Specification Components (设计内嵌在需求文档)

| Component | Domain | Location | Status | Description |
|-----------|--------|----------|--------|-------------|
| sdf-analyze | CoreEngine | `.claude/skills/sdf-analyze/` | done | R 阶段需求分析 Skill |
| sdf-design | CoreEngine | `.claude/skills/sdf-design/` | done | D 阶段技术设计 Skill |
| sdf-test | CoreEngine | `.claude/skills/sdf-test/` | done | T 阶段测试验收 Skill |
| workflow-orchestration | CoreEngine | `.claude/steering/workflow.md` | done | R-D-C-T 工作流规范 |

### 2.2 Component Classification

| Feature Kind | 设计文档策略 | 示例 |
|--------------|-------------|------|
| `code` | 需要独立 des-xxx.md | doc-indexer, dependency-graph |
| `specification` | 设计内嵌在需求文档 Specification 部分 | sdf-analyze, sdf-design, sdf-test |

> 详见 `.claude/steering/workflow.md` Section 8: Feature Kind & Design Documents

## 3. Interface Contracts

### 3.1 Core Data Types (`src/types.ts`)

```typescript
// Feature 索引 - 所有模块共享
interface FeatureIndex {
  id: string;
  type: FeatureType;
  domain: string;
  status: FeatureStatus;
  priority: Priority;
  summary: string;
  tags: string[];
  dependencies: FeatureDependencies;
  computed: ComputedLinks;
  analyzed: boolean;
  filePath: string;
}

// 依赖图 - 图算法模块使用
interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: {
    requires: Map<string, string[]>;
    blocks: Map<string, string[]>;
  };
}

// 门控检查结果 - 工作流模块使用
interface GateCheckResult {
  featureId: string;
  targetPhase: PhaseTransition;
  canProceed: boolean;
  conditions: GateCondition[];
  blockers: string[];
}
```

### 3.2 Module APIs

| Module | Function | Input | Output |
|--------|----------|-------|--------|
| doc-indexer | `indexFeatures(basePath)` | string | `IndexResult` |
| doc-indexer | `parseFeatureFile(path)` | string | `ParseResult` |
| dependency-graph | `buildGraph(features)` | `FeatureIndex[]` | `DependencyGraph` |
| dependency-graph | `topologicalSort(graph)` | `DependencyGraph` | `string[]` |
| dependency-graph | `detectCycles(graph)` | `DependencyGraph` | `CycleDetectionResult` |
| dependency-graph | `checkRToD(id, graph, backlog)` | ... | `GateCheckResult` |

### 3.3 Cross-Module Data Flow

```
┌─────────────────┐
│  Glob + Read    │  ← Claude Built-in Tools
└────────┬────────┘
         │ files
         ▼
┌─────────────────┐
│   doc-indexer   │
│  ─────────────  │
│  scanner.ts     │
│  parser.ts      │
│  validator.ts   │
└────────┬────────┘
         │ FeatureIndex[]
         ▼
┌─────────────────┐
│dependency-graph │
│  ─────────────  │
│  graph.ts       │
│  algorithms.ts  │
│  gate-check.ts  │
└────────┬────────┘
         │ GateCheckResult
         ▼
┌─────────────────┐
│   CLI / Skill   │
└─────────────────┘
```

## 4. Design Patterns in Use

| Pattern | Where | Description | Reference |
|---------|-------|-------------|-----------|
| **Scanner-Parser-Validator** | doc-indexer | 三阶段文档处理 | `patterns/document-parser.md` |
| **Adjacency List Graph** | dependency-graph | 图数据结构 | `patterns/graph-algorithm.md` |
| **Kahn's Algorithm** | topologicalSort | 拓扑排序 | `patterns/graph-algorithm.md` |
| **DFS + Coloring** | detectCycles | 循环检测 | `patterns/graph-algorithm.md` |
| **Gate Check** | checkRToD | 阶段转换验证 | `patterns/gate-check.md` |

## 5. Constraints for New Features

### 5.1 Must Follow

1. **TypeScript Only** - 所有工具代码使用 TypeScript
2. **Types in `src/types.ts`** - 共享类型定义集中管理
3. **CLI Entry Point** - 用户交互功能必须提供 CLI 入口
4. **YAML Frontmatter** - 文档元数据使用 YAML Frontmatter

### 5.2 Should Follow

1. **Reuse Existing Modules** - 优先复用 doc-indexer, dependency-graph
2. **Consistent Error Handling** - 使用 `{ success, error?, data? }` 模式
3. **Export Functions** - 模块导出纯函数，便于组合

### 5.3 ADR Required When

- 引入新的设计模式
- 添加新的外部依赖
- 修改现有接口契约
- 违反 "Should Follow" 约束

## 6. Evolution Log

| Date | Feature | Change | Impact | ADR |
|------|---------|--------|--------|-----|
| 2026-01-02 | doc-indexer | 初始实现 TypeScript CLI | 建立基础模式 | ADR-001 |
| 2026-01-02 | dependency-graph | 复用 doc-indexer 数据结构 | 验证模块间接口 | - |
| 2026-01-02 | CLI | 添加 --export 功能 | 支持人工检查 | - |
| 2026-01-02 | architecture | 创建架构治理体系 | 全局一致性保障 | ADR-002 |
| 2026-01-02 | sdf-design | D 阶段 Skill 设计完成 | 完成 R-D-C-T 中 D 阶段能力 | - |
| 2026-01-02 | sdf-test | T 阶段 Skill 设计完成 | 完成 R-D-C-T 中 T 阶段能力 | - |
| 2026-01-02 | workflow-orchestration | D 阶段设计完成 | 3层文档架构：CLAUDE.md + WORKFLOW.md + Skills | - |
| 2026-01-03 | sdf-design | Skill 实现完成 | D 阶段全流程可用 | - |
| 2026-01-03 | sdf-test | Skill 实现完成 | T 阶段全流程可用 | - |
| 2026-01-03 | workflow-orchestration | 全部 AC 完成，status: done | R-D-C-T 工作流框架完成 | - |
| 2026-01-03 | architecture | 新增 Feature Kind 分类 | 规范类 Feature 设计内嵌，减少重复文档 | - |
| 2026-01-05 | sdf-ask | 删除 | 与 Claude 原生能力重叠，遵循 YAGNI 原则 | - |
| 2026-01-05 | task-manager | 设计完成 | 持久化任务管理模块 | - |
| 2026-01-05 | task-manager | 实现完成 | store.ts + operations.ts + index.ts | - |

## 7. Architecture Checklist

新 Feature 设计时必须确认：

```markdown
## Architecture Alignment

### Principles Compliance
- [ ] 使用 TypeScript
- [ ] 类型定义在 src/types.ts 或本模块内
- [ ] 提供 CLI 入口（如需用户交互）

### Reuse Analysis
- [ ] 已检查 doc-indexer 是否可复用
- [ ] 已检查 dependency-graph 是否可复用
- [ ] 如不复用，说明原因

### Interface Consistency
- [ ] 输入输出类型与现有接口风格一致
- [ ] 错误处理使用 { success, error } 模式

### Pattern Usage
- [ ] 使用的设计模式已在 patterns/ 记录
- [ ] 或：创建新 ADR 说明新模式

### Update Required
- [ ] 更新本文档的 Component Map
- [ ] 更新本文档的 Evolution Log
```

---

*Last Updated: 2026-01-05*
*Maintainer: Human + AI Collaboration*
