---
type: backlog
description: 全局需求池 - 存储待分析的需求和发现的依赖
last_updated: 2026-01-03
---

# 需求池 (Backlog)

> 所有待分析的需求在此排队。只有当需求池为空时，才能进入 Design 阶段。

## 待分析队列

| ID | 来源 | 描述 | 发现者 | 优先级 | 状态 |
|----|------|------|--------|--------|------|
| backlog-005 | ADR-003 | 项目初始化功能 - 定义新项目目录结构生成，含 architecture/ 目录。MVP: CLI/Backend | Human | Medium | pending |
| backlog-006 | backlog-005 | 多项目类型模板 - Web 前端、移动 App 等项目初始化模板 | Human | Low | pending |

## 已分析完成

当需求从队列移出并创建为正式 Feature 后，记录在此：

| Backlog ID | 转化为 | 分析日期 |
|------------|--------|----------|
| backlog-001 | feat-sdf-design | 2026-01-02 |
| backlog-002 | feat-sdf-test | 2026-01-02 |
| backlog-003 | feat-doc-indexer | 2026-01-02 |
| backlog-004 | feat-dependency-graph | 2026-01-02 |

## 统计

- **待分析**: 2
- **分析中**: 1
- **已完成**: 4

## 新增 Feature (直接创建)

| Feature ID | 描述 | 创建日期 | 状态 |
|------------|------|----------|------|
| feat-task-management | 统一任务管理系统 (Backlog + Task) | 2026-01-04 | analyzing |

## 依赖关系说明

```
workflow-orchestration
├── 直接依赖 (Critical)
│   ├── feat-sdf-design ✅ (analyzing)
│   └── feat-sdf-test ✅ (analyzing)
│
└── 间接依赖 - 来自 DocSystem
    ├── feat-doc-indexer ✅ (done)
    └── feat-dependency-graph ✅ (done)
            │
            └── 依赖 feat-doc-indexer ✅
```

---

## 使用说明

### 添加需求到池

在分析 Feature 时发现的依赖需求，使用以下格式添加：

```markdown
| backlog-<序号> | <来源 Feature ID> | <需求描述> | <发现者> | <优先级> | pending |
```

### 从池中取出分析

1. 按优先级排序取出
2. 创建 Feature 文档
3. 更新本文件：从"待分析队列"移到"已分析完成"

### 门控规则

**R → D 阶段转换条件**：
- [ ] 当前 Feature 分析完成
- [ ] 所有依赖 Feature 已识别
- [ ] **需求池为空** 或 所有相关依赖已分析完成

### 当前门控状态

```
feat-task-management:
  ├── 依赖分析: ✅ 完成 (analyzed: true)
  ├── 前置依赖: feat-doc-indexer ✅ (done)
  ├── 需求池状态: ✅ 无相关待分析项
  └── 可进入 Design: ✅ 可以

feat-workflow-orchestration:
  ├── 依赖分析: ✅ 完成
  ├── 需求池状态: ✅ 已清空
  └── 可进入 Design: ✅ 可以 (等待子依赖完成)

feat-sdf-design:
  ├── 依赖分析: ✅ 完成
  ├── 前置依赖: feat-doc-indexer ✅, feat-dependency-graph ✅
  └── 可进入 Design: ✅ 可以

feat-sdf-test:
  ├── 依赖分析: ✅ 完成
  ├── 前置依赖: feat-doc-indexer ✅, feat-dependency-graph ✅
  └── 可进入 Design: ✅ 可以

feat-doc-indexer:
  ├── 状态: done ✅
  └── 已完成实现和测试

feat-dependency-graph:
  ├── 状态: done ✅
  └── 已完成实现和测试
```
