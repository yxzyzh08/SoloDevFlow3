# Design Patterns Reference

> SoloDevFlow 中常用的设计模式参考。

## 1. 已使用的模式

### 1.1 Scanner-Parser-Validator Pattern

**用于**: doc-indexer

```
Input → Scanner → Parser → Validator → Output
         (Glob)   (YAML)   (Schema)
```

**适用场景**:
- 文档处理
- 配置文件解析
- 数据导入

### 1.2 Adjacency List Graph

**用于**: dependency-graph

```typescript
interface Graph {
  nodes: Map<Id, Node>;
  edges: {
    requires: Map<Id, Id[]>;
    blocks: Map<Id, Id[]>;
  };
}
```

**适用场景**:
- 依赖关系
- 任务排序
- 循环检测

### 1.3 Gate Check Pattern

**用于**: 阶段转换

```typescript
interface GateCheckResult {
  canProceed: boolean;
  conditions: GateCondition[];
  blockers: string[];
}
```

**适用场景**:
- 流程控制
- 准入检查
- 状态转换

### 1.4 Skill-Based Implementation

**用于**: sdf-analyze, sdf-design, sdf-test

```
SKILL.md (指令)
├── templates/ (模板)
└── references/ (参考)
```

**适用场景**:
- AI 驱动的流程
- 模板化输出
- 指导性任务

## 2. 接口约定

### 2.1 Result Pattern

```typescript
// 成功
{ success: true, data: T }

// 失败
{ success: false, error: string }
```

### 2.2 函数命名

| 类型 | 前缀 | 示例 |
|------|------|------|
| 获取单个 | get | getFeature() |
| 获取列表 | list/index | indexFeatures() |
| 构建 | build | buildGraph() |
| 检查 | check/detect | checkRToD(), detectCycles() |
| 解析 | parse | parseFeatureFile() |
| 验证 | validate | validateSchema() |

### 2.3 文件命名

| 类型 | 前缀 | 示例 |
|------|------|------|
| Feature 需求 | feat- | feat-doc-indexer.md |
| 设计文档 | des- | des-doc-indexer.md |
| 测试报告 | test- | test-doc-indexer.md |

## 3. 何时需要 ADR

创建 Architecture Decision Record (ADR) 当：

1. **引入新模式** - 不在上述列表中的模式
2. **添加外部依赖** - 新的 npm 包或服务
3. **修改接口契约** - 改变现有 API
4. **违反约束** - 有理由偏离规范

### ADR 模板

```markdown
# ADR-XXX: <Title>

## Status
Proposed | Accepted | Deprecated

## Context
[背景和问题]

## Decision
[决策内容]

## Consequences
[影响和后果]
```

## 4. 设计检查清单

设计前确认：

```markdown
### Principles Compliance
- [ ] 使用 TypeScript
- [ ] 类型定义位置正确
- [ ] 错误处理一致

### Reuse Analysis
- [ ] 检查可复用组件
- [ ] 说明不复用原因

### Interface Consistency
- [ ] 命名约定一致
- [ ] 返回值格式一致

### Pattern Usage
- [ ] 使用已有模式
- [ ] 或记录新模式
```
