# 工作流状态定义

## Feature 状态流转

```
                          ┌─────────────┐
                          │   backlog   │ ← 需求池中待分析
                          └──────┬──────┘
                                 │
                                 ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│proposed │───▶│  analyzing  │───▶│  analyzed   │
└─────────┘    └─────────────┘    └──────┬──────┘
                                         │
                    ┌────────────────────┤
                    │ 所有依赖完成?       │
                    ▼                    ▼
            ┌───────────────┐    ┌──────────────────┐
            │ ready-for-    │    │ waiting-deps     │
            │ design        │    │ (等待依赖完成)    │
            └───────┬───────┘    └──────────────────┘
                    │
                    ▼
            ┌─────────────┐
            │  designing  │ ← D 阶段
            └──────┬──────┘
                   │
                   ▼
          ┌──────────────┐
          │implementing  │ ← C 阶段
          └──────┬───────┘
                 │
                 ▼
           ┌──────────┐
           │ testing  │ ← T 阶段
           └────┬─────┘
                │
                ▼
           ┌──────────┐
           │   done   │
           └──────────┘
                │
                ▼
           ┌──────────┐
           │ blocked  │ ← 任意阶段可进入
           └──────────┘
```

## 状态说明

| 状态 | 阶段 | 含义 | 进入条件 | 退出条件 |
|------|------|------|----------|----------|
| `backlog` | - | 需求池中，待分析 | 被依赖分析发现 | 开始分析 |
| `proposed` | R | 需求已提出 | 用户提出需求 | 开始分析 |
| `analyzing` | R | 深度分析中 | 开始依赖分析 | 分析完成 |
| `analyzed` | R | 分析完成 | 依赖识别完成 | 检查依赖状态 |
| `waiting-deps` | R | 等待依赖完成 | 有未完成的前置依赖 | 所有依赖完成 |
| `ready-for-design` | R | 可进入设计 | 所有依赖已就绪 | 用户确认进入 D |
| `designing` | D | 设计方案中 | 用户确认 | 设计完成 |
| `implementing` | C | 编码实现中 | 设计完成 + 用户确认 | 编码完成 |
| `testing` | T | 测试验收中 | 编码完成 | 所有 AC 通过 |
| `done` | - | 已完成 | 所有 AC 通过 | - |
| `blocked` | - | 阻塞 | 遇到无法解决的问题 | 问题解决 |

## 阶段转换检查清单

### Backlog → Analyzing

- [ ] 从需求池中取出
- [ ] 确定目标 Domain
- [ ] 开始依赖分析

### Proposed → Analyzing

- [ ] 需求描述已明确
- [ ] 开始依赖分析

### Analyzing → Analyzed

- [ ] 前置依赖已识别
- [ ] 后续影响已评估
- [ ] 新依赖已加入 Backlog

### Analyzed → Ready-for-Design

**关键门控条件**：

- [ ] 当前 Feature 依赖分析完成 (`analyzed: true`)
- [ ] 所有 `requires` 中的 Feature 状态为 `done` 或 `ready-for-design`
- [ ] **需求池 (Backlog) 为空**，或仅剩与当前 Feature 无关的低优先级项
- [ ] 用户确认 "可以进入 Design 阶段"

### Ready-for-Design → Designing

- [ ] 用户确认
- [ ] 创建设计文档

### Designing → Implementing

- [ ] 设计文档完成
- [ ] 文件变更清单已列出
- [ ] 关键接口已定义
- [ ] 用户确认

### Implementing → Testing

- [ ] 代码变更完成
- [ ] Lint 通过 (如适用)
- [ ] 用户确认

### Testing → Done

- [ ] 所有 AC 验证通过
- [ ] Feature 文档 status 更新

## 状态查询规则

**判断 Feature 是否可进入 Design**：

```
function canEnterDesign(featureId):
    feature = loadFeature(featureId)

    // 1. 自身分析完成
    if not feature.analyzed:
        return false, "依赖分析未完成"

    // 2. 所有前置依赖就绪
    for dep in feature.dependencies.requires:
        depFeature = loadFeature(dep)
        if depFeature.status not in ['done', 'ready-for-design']:
            return false, f"依赖 {dep} 未就绪"

    // 3. 需求池检查
    backlog = loadBacklog()
    relatedItems = backlog.filter(item => item.source == featureId)
    if relatedItems.any(item => item.priority in ['critical', 'high']):
        return false, "需求池中有相关的高优先级待分析项"

    return true, "可以进入 Design 阶段"
```

## 批量状态更新

当一个 Feature 完成时，需要检查：

1. **更新被阻塞的 Feature**：
   ```
   for feat in allFeatures:
       if currentFeature.id in feat.dependencies.requires:
           if allDepsReady(feat):
               feat.status = 'ready-for-design'
   ```

2. **更新 Backlog 统计**：
   ```
   backlog.stats.pending -= 1
   backlog.stats.completed += 1
   ```
