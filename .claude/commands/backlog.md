---
allowed-tools: Read, Write, Edit, Grep, Glob
description: 管理需求池 - 查看、添加、分析待处理需求
argument-hint: [list|add|analyze|stats] [参数]
---

# 需求池管理

管理 SoloDevFlow 的需求池 (Backlog)。

## 当前上下文

**工作目录**: !`pwd`
**需求池状态**: !`head -30 docs/requirements/backlog.md 2>/dev/null || echo "需求池文件不存在"`

## 任务

操作: $ARGUMENTS

## 支持的操作

### `/backlog` 或 `/backlog list`
显示需求池当前状态，包括：
- 待分析数量
- 按优先级分类
- 按来源 Feature 分组

### `/backlog add <描述> [--from <feature-id>] [--priority <high|medium|low>]`
手动添加需求到池中：
1. 生成新的 backlog ID
2. 添加到待分析队列
3. 更新统计信息

### `/backlog analyze [backlog-id]`
从池中取出一个需求进行分析：
1. 如果指定 ID，分析该需求
2. 如果未指定，按优先级取最高的
3. 触发 sdf-analyze 工作流
4. 分析完成后更新 backlog 状态

### `/backlog stats`
显示详细统计：
- 待分析/分析中/已完成 数量
- 各优先级分布
- 依赖图概览

## 操作流程

### 添加需求
```bash
# 1. 读取当前 backlog
Read docs/requirements/backlog.md

# 2. 生成新 ID (backlog-XXX)
# 3. 添加到待分析队列表格
Edit docs/requirements/backlog.md

# 4. 更新统计
```

### 分析需求
```bash
# 1. 从 backlog 取出需求
Read docs/requirements/backlog.md

# 2. 根据描述创建 Feature 文档
# 使用 sdf-analyze 的模板

# 3. 更新 backlog：移到"已分析完成"

# 4. 递归检查是否产生新依赖
```

## 输出格式

```
=== 需求池状态 ===

统计:
- 待分析: 3
- 分析中: 1
- 已完成: 5

待分析队列 (按优先级排序):
┌────────────┬──────────────────────────┬─────────┬──────────┐
│ ID         │ 描述                     │ 来源    │ 优先级   │
├────────────┼──────────────────────────┼─────────┼──────────┤
│ backlog-003│ 用户认证基础设施         │ feat-xx │ critical │
│ backlog-001│ Session 管理             │ feat-xx │ high     │
│ backlog-002│ 密码加密模块             │ feat-xx │ medium   │
└────────────┴──────────────────────────┴─────────┴──────────┘

建议: 优先分析 backlog-003 (被多个 Feature 依赖)
```

## 门控检查

执行 `/backlog stats` 时，同时检查：
- 是否有 Feature 可以进入 Design 阶段
- 哪些 Feature 正在等待依赖

```
=== 阶段转换检查 ===

可进入 Design:
- feat-xxx: 所有依赖已就绪 ✅

等待依赖:
- feat-yyy: 等待 backlog-001, backlog-003
```
