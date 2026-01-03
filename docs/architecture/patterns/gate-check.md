---
id: pattern-gate-check
title: Gate Check Pattern
status: active
used_by: [dependency-graph, workflow-orchestration]
---

# Gate Check Pattern

## Intent

在状态转换前执行一系列条件检查，确保满足所有前置条件才允许转换。

## Structure

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Current     │────▶│ Gate Check  │────▶│ Target      │
│ State       │     │ (Conditions)│     │ State       │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ Check Result│
                    │ - canProceed│
                    │ - conditions│
                    │ - blockers  │
                    └─────────────┘
```

## Data Structure

```typescript
interface GateCondition {
  id: string;           // 条件标识
  name: string;         // 条件名称
  satisfied: boolean;   // 是否满足
  details: string;      // 详细说明
}

interface GateCheckResult {
  featureId: string;
  targetPhase: PhaseTransition;
  canProceed: boolean;              // 所有条件都满足
  conditions: GateCondition[];      // 各条件结果
  blockers: string[];               // 阻塞原因列表
}
```

## Implementation

```typescript
function checkRToD(featureId: string, graph: DependencyGraph, backlog: BacklogItem[]): GateCheckResult {
  const conditions: GateCondition[] = [];
  const blockers: string[] = [];

  // Condition 1: 分析完成
  const feature = graph.nodes.get(featureId);
  conditions.push({
    id: 'analyzed',
    name: '依赖分析完成',
    satisfied: feature.analyzed === true,
    details: feature.analyzed ? 'analyzed: true' : '需完成依赖分析'
  });
  if (!conditions[0].satisfied) blockers.push('依赖分析未完成');

  // Condition 2: Backlog 清空
  const relatedBacklog = backlog.filter(b => b.source === featureId);
  conditions.push({
    id: 'backlog-empty',
    name: '需求池已清空',
    satisfied: relatedBacklog.length === 0,
    details: relatedBacklog.length === 0 ? '无待分析项' : `${relatedBacklog.length} 个待分析`
  });
  if (!conditions[1].satisfied) blockers.push('需求池未清空');

  // Condition 3: 前置依赖就绪
  // ...

  // Condition 4: 无循环依赖
  // ...

  return {
    featureId,
    targetPhase: 'R→D',
    canProceed: conditions.every(c => c.satisfied),
    conditions,
    blockers
  };
}
```

## Gate Definitions in SoloDevFlow

### R → D Gate

| Condition | Check |
|-----------|-------|
| analyzed | `feature.analyzed === true` |
| backlog-empty | 无相关待分析项 |
| deps-ready | 所有 requires 已就绪 |
| no-cycle | 无循环依赖 |

### D → C Gate

| Condition | Check |
|-----------|-------|
| design-exists | 设计文档已创建 |
| design-approved | 人工确认设计 |

### C → T Gate

| Condition | Check |
|-----------|-------|
| code-complete | 代码实现完成 |
| ac-defined | AC 已定义 |

### T → Done Gate

| Condition | Check |
|-----------|-------|
| all-ac-pass | 所有 AC 已勾选 |

## Output Format

```
=== R→D Gate Check: feat-doc-indexer ===

Conditions:
  [PASS] 依赖分析完成 (analyzed: true)
  [PASS] 需求池已清空 (无相关待分析项)
  [PASS] 前置依赖就绪 (无前置依赖)
  [PASS] 无循环依赖

Result: CAN PROCEED to Design phase
```

## When to Use

- 状态机的状态转换
- 工作流阶段推进
- 发布前检查

## Related Patterns

- State Machine
- Workflow Engine
- Policy Pattern
