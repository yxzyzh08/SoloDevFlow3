---
name: sdf-analyze
version: 1.1.0
description: |
  SoloDevFlow R-D-C-T 工作流入口：需求分析阶段。
  将自然语言需求转化为结构化文档，深挖依赖链。
  输出 docs/requirements/<domain>/<feature>.md 文档。
triggers:
  - "需求分析"
  - "添加功能"
  - "新需求"
  - "添加"
  - "实现"
  - "我想要"
  - "能不能"
  - "帮我做"
  - "报告 Bug"
allowed-tools: Read, Write, Edit, Grep, Glob
---

# SDF Requirement Analyzer

> R-D-C-T 工作流的第一阶段：将模糊需求转化为结构化真理文档，并深挖完整依赖链。

## 核心原则

- **Document is Truth**: 需求必须写入文档，不存于 AI 记忆
- **Dependency First**: 先分析依赖，再确定范围
- **Task Manager Driven**: 发现的新依赖创建 Task，确保无遗漏
- **AI-First Format**: 生成文档遵循 `doc-standards.md` 规范

## 使用示例

| 用户输入 | Skill 响应 |
|----------|-----------|
| "添加用户删除 API" | 进入需求分析流程，生成 feat-user-delete.md |
| "我想要一个导出功能" | 澄清需求后，生成需求文档 |
| "查看需求池" | 执行 `task list` 显示待分析需求 |

## 执行工作流

复制此清单跟踪进度：

```
Requirements Analysis Progress:
- [ ] Step 0: 需求清晰度评估
- [ ] Step 1: 读取全局上下文
- [ ] Step 2: 定位目标 Domain
- [ ] Step 2.5: 确定 Feature 类型
- [ ] Step 3: 深度依赖分析
- [ ] Step 4: 创建/更新文档
- [ ] Step 4.5: 注册 Feature 到 Domain Index
- [ ] Step 5: 处理需求池
- [ ] Step 6: 验证并汇报
```

### Step 0: 需求清晰度评估

**快速判断**：需求是否包含足够信息可以开始分析？

| 维度 | 清晰标准 | 检查问题 |
|------|----------|----------|
| **场景** | 知道用户什么时候用 | 在什么情况下需要这个功能？ |
| **行为** | 知道功能做什么 | 期望的输入输出是什么？ |
| **边界** | 知道不做什么 | 与现有功能的关系？范围限制？ |

**决策**：
- ✅ 清晰 → 直接进入 Step 1
- ⚠️ 部分模糊 → 仅针对模糊点提问
- ❌ 完全模糊 → 请用户提供更多信息

### Step 1: 读取全局上下文

```bash
Read docs/product_context.md    # 理解产品愿景和 Domain 注册表
cd src && node dist/index.js task list --type=analyze_requirement --status=pending
```

### Step 2: 定位目标 Domain

| 用户需求特征 | 目标 Domain |
|-------------|-------------|
| CLI 配置、Skill、工作流 | CoreEngine |
| 文档解析、生成、索引 | DocSystem |
| 新领域 | **需先创建 Domain** |

### Step 2.5: 确定 Feature 类型

| 类型 | feature_kind | 产出物 | 验收方式 |
|------|--------------|--------|----------|
| **代码类** | `code` | `src/` 下的代码 | 单元测试 + 运行时验证 |
| **规范类** | `specification` | `.claude/skills/` 或 `docs/` | 试运行 + 人工验收 |

### Step 3: 深度依赖分析 ⭐

**使用 `think hard` 进行深度分析**

#### 3.1 前置依赖分析

问自己：**"这个 Feature 需要什么才能工作？"**

| 依赖类型 | 检查问题 |
|----------|----------|
| **数据依赖** | 需要什么数据/模型？ |
| **功能依赖** | 需要什么现有功能？ |
| **基础设施** | 需要什么底层能力？ |
| **跨 Domain** | 涉及其他领域吗？ |

#### 3.2 后续影响分析

问自己：**"这个 Feature 会影响什么？"**

#### 3.3 发现新需求

检查依赖是否已存在：
```bash
Grep "依赖关键词" docs/requirements/
```

#### 3.4 加载依赖上下文

**对于每个已存在的依赖 Feature，必须加载其完整内容**：
```bash
Read docs/requirements/<dep-domain>/<dep-feature>.md
```

#### 3.5 依赖分析输出

```markdown
### 前置依赖 (Requires)
| 依赖项 | 类型 | 状态 | 说明 |
|--------|------|------|------|

### 后续影响 (Affects)
| 影响项 | 类型 | 影响程度 | 说明 |
|--------|------|----------|------|
```

### Step 4: 创建/更新文档

- **新 Feature**: 使用模板 [templates/feature.md](templates/feature.md)
- **变更现有**: 使用 `Edit` 更新
- **规范类 Feature**: 需要内嵌 "Design Decisions" 部分

### Step 4.5: 注册 Feature 到 Domain Index

```bash
cd src && npx ts-node "../.claude/skills/sdf-analyze/scripts/register-feature.ts" <domain> <feature-id>
```

### Step 5: 处理需求池 (Task Manager)

详见：[references/task-manager-guide.md](references/task-manager-guide.md)

**快速命令**：
```bash
# 添加新依赖到任务池
cd src && node dist/index.js task add --type=analyze_requirement --title="分析需求：<名称>" --priority=high

# 检查状态
cd src && node dist/index.js task stats

# 完成后标记
cd src && node dist/index.js task done <task-id>
```

### Step 6: 验证并汇报

**验证清单**：
- [ ] Frontmatter 包含完整依赖声明
- [ ] `feature_kind` 已设置
- [ ] 依赖分析部分已填写
- [ ] 新发现的依赖已加入任务池
- [ ] AC 已定义

**汇报模板**：
```
已完成需求分析：
- 文档: docs/requirements/<domain>/<feature>.md
- Domain: <domain>
- Feature Kind: <code | specification>

依赖分析结果：
- 前置依赖: X 个 (Y 个已存在, Z 个新增到任务池)
- 后续影响: N 项

需求池状态：
- 待分析: <count>
- [ ] 池为空 → 可进入 Design 阶段
```

## 参考资料

- **文档编写规范**: `.claude/steering/doc-standards.md` (生成文档前必读)
- **Feature 模板**: [templates/feature.md](templates/feature.md)
- **需求池管理**: [references/task-manager-guide.md](references/task-manager-guide.md)
- **依赖分析指南**: [references/dependency-analysis.md](references/dependency-analysis.md)
- **状态定义**: [references/status-definitions.md](references/status-definitions.md)
