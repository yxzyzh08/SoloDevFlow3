---
name: sdf-analyze
description: |
  SoloDevFlow R-D-C-T 工作流入口：需求分析阶段。
  将自然语言需求转化为结构化文档，深挖依赖链。
  当用户提出新功能、修改需求、报告 Bug，或说"添加"、
  "实现"、"我想要"、"能不能"、"帮我做"等意图时自动触发。
  输出 docs/requirements/<domain>/<feature>.md 文档。
allowed-tools: Read, Write, Edit, Grep, Glob
---

# SDF Requirement Analyzer

> R-D-C-T 工作流的第一阶段：将模糊需求转化为结构化真理文档，并深挖完整依赖链。

## 核心原则

- **Document is Truth**: 需求必须写入文档，不存于 AI 记忆
- **Dependency First**: 先分析依赖，再确定范围
- **Backlog Driven**: 发现的新依赖进入需求池，确保无遗漏
- **Complete Before Design**: 所有依赖分析完成后才能进入 D 阶段

## 执行工作流

复制此清单跟踪进度：

```
Requirements Analysis Progress:
- [ ] Step 0: 需求清晰度评估
- [ ] Step 1: 读取全局上下文
- [ ] Step 2: 定位目标 Domain
- [ ] Step 2.5: 确定 Feature 类型
- [ ] Step 3: 深度依赖分析
  - [ ] 3.1 前置依赖分析
  - [ ] 3.2 后续影响分析
  - [ ] 3.3 发现新需求
  - [ ] 3.4 加载依赖上下文 ⭐ 关键
  - [ ] 3.5 输出依赖分析结果
- [ ] Step 4: 创建/更新文档
- [ ] Step 4.5: 注册 Feature 到 Domain Index ⭐
- [ ] Step 5: 处理需求池
- [ ] Step 6: 验证并汇报
```

### Step 0: 需求清晰度评估

**目的**：在正式分析前，判断需求是否足够清晰。清晰则直接进入 Step 1，模糊则先澄清。

**快速判断**：需求是否包含足够信息可以开始分析？

| 维度 | 清晰标准 | 检查问题 |
|------|----------|----------|
| **场景** | 知道用户什么时候用 | 在什么情况下需要这个功能？ |
| **行为** | 知道功能做什么 | 期望的输入输出是什么？ |
| **边界** | 知道不做什么 | 与现有功能的关系？范围限制？ |

**判断决策树**：

```
评估需求描述：
├── ✅ 场景+行为+边界都清晰
│   └── 直接进入 Step 1
│
├── ⚠️ 部分模糊（1-2个维度不清晰）
│   └── 仅针对模糊点提问，获得答案后进入 Step 1
│
└── ❌ 完全模糊（只有一个想法）
    └── 请用户提供更多信息后再继续
```

**示例**：

| 用户需求 | 清晰度 | AI 行为 |
|----------|--------|---------|
| "添加删除用户 API，路径 /api/users/:id，返回 204" | ✅ 高 | 直接分析 |
| "加个删除功能" | ❌ 低 | 澄清：删除什么？在哪里？ |
| "需要一个产品咨询 Skill，回答进度和功能问题" | ⚠️ 中 | 澄清：具体回答什么类型问题？与 /status 的关系？ |

**澄清方式**：
- 直接在对话中提问
- 或使用 AskUserQuestion 工具提供选项

**重要**：不要过度澄清。如果能合理推断，就不需要问。

### Step 1: 读取全局上下文

```bash
# 必读文件
Read docs/product_context.md    # 理解产品愿景和 Domain 注册表
Read docs/requirements/backlog.md  # 查看需求池状态
```

### Step 2: 定位目标 Domain

**判断逻辑**：

| 用户需求特征 | 目标 Domain | 依据 |
|-------------|-------------|------|
| CLI 配置、Skill、工作流 | CoreEngine | 运行时环境相关 |
| 文档解析、生成、索引 | DocSystem | 文档处理相关 |
| 新领域 | **需先创建 Domain** | 更新 product_context.md |

```bash
Read docs/requirements/<domain>/index.md
```

### Step 2.5: 确定 Feature 类型 ⭐ NEW

**Feature 有两种类型，验收方式完全不同**：

| 类型 | feature_kind | 产出物 | 验收方式 |
|------|--------------|--------|----------|
| **代码类** | `code` | `src/` 下的代码 | 单元测试 + 运行时验证 |
| **规范类** | `specification` | `.claude/skills/` 或 `docs/` 下的规范 | 试运行 + 人工验收 |

**判断决策树**：

```
Q1: Feature 的主要产出物是什么？
├── 代码 (TypeScript/Python 等) → code
├── CLI 工具/API 实现 → code
├── Skill 定义 (.claude/skills/) → specification
├── 工作流规范 (docs/workflow/) → specification
└── 模板/指南文档 → specification

Q2: 如何验证 Feature 完成？
├── 可以写单元测试验证 → code
├── 需要实际执行观察效果 → specification
└── 需要人工确认输出正确 → specification
```

**示例**：

| Feature | 产出物 | 类型 |
|---------|--------|------|
| feat-doc-indexer | src/doc-indexer/*.ts | code |
| feat-dependency-graph | src/dependency-graph/*.ts | code |
| feat-sdf-design | .claude/skills/sdf-design/ | specification |
| feat-sdf-test | .claude/skills/sdf-test/ | specification |

**重要提示**：
- 在 Frontmatter 中设置 `feature_kind: code` 或 `feature_kind: specification`
- 根据类型选择对应的 AC 模板（参见 templates/feature.md 中的注释）
- 规范类 Feature 的测试策略是「试运行验证」而非「单元测试」

### Step 3: 深度依赖分析 ⭐

**这是最关键的步骤。使用 `think hard` 进行深度分析。**

#### 3.1 前置依赖分析

问自己：**"这个 Feature 需要什么才能工作？"**

| 依赖类型 | 检查问题 | 示例 |
|----------|----------|------|
| **数据依赖** | 需要什么数据/模型？ | 用户认证 → 需要用户模型 |
| **功能依赖** | 需要什么现有功能？ | 订单创建 → 需要购物车 |
| **基础设施** | 需要什么底层能力？ | API 调用 → 需要 HTTP 客户端 |
| **跨 Domain** | 涉及其他领域吗？ | 报表导出 → 可能涉及 DocSystem |

#### 3.2 后续影响分析

问自己：**"这个 Feature 会影响什么？"**

| 影响类型 | 检查问题 | 示例 |
|----------|----------|------|
| **接口变更** | 会改变现有 API 吗？ | 新增字段 → 影响调用方 |
| **数据迁移** | 需要数据结构变更吗？ | 新表 → 需要迁移脚本 |
| **级联更新** | 其他功能需要适配吗？ | 权限变更 → 所有页面需检查 |

#### 3.3 发现新需求

对于每个识别出的依赖：

1. **检查是否已存在**：
   ```bash
   Grep "依赖关键词" docs/requirements/
   ```

2. **如果不存在**：
   - 创建简短描述
   - 添加到 `docs/requirements/backlog.md`

#### 3.4 加载依赖上下文 ⭐ 新增

**对于每个已存在的依赖 Feature，必须加载其完整内容**：

```bash
# 加载依赖 Feature 的完整文档
Read docs/requirements/<dep-domain>/<dep-feature>.md
```

**分析依赖上下文时关注**：

| 分析维度 | 关注问题 | 记录内容 |
|----------|----------|----------|
| **接口能力** | 依赖 Feature 提供什么能力？ | 可调用的功能/API |
| **数据契约** | 依赖 Feature 的输入输出是什么？ | 数据格式、字段定义 |
| **状态要求** | 依赖 Feature 需要什么前置状态？ | 初始化、配置要求 |
| **约束限制** | 依赖 Feature 有什么使用限制？ | 性能、并发、安全约束 |

**交互点分析**：

```markdown
### 依赖交互分析

#### 与 <dep-feature-id> 的交互

**依赖方式**: [调用/数据共享/事件订阅]

**接口使用**:
- 使用 `<接口名>` 来实现 [功能描述]
- 预期输入: [数据格式]
- 预期输出: [数据格式]

**注意事项**:
- [从依赖文档中提取的约束或限制]
```

**依赖上下文缓存**：
- 将关键信息记录在当前 Feature 文档的「依赖分析」部分
- 避免重复读取同一依赖文档

#### 3.5 依赖分析输出模板

```markdown
## 依赖分析结果

### 前置依赖 (Requires)
| 依赖项 | 类型 | 状态 | 说明 |
|--------|------|------|------|
| feat-xxx | Feature | 已存在 | ... |
| (新) 用户模型 | Feature | → Backlog | 需要先实现 |

### 后续影响 (Affects)
| 影响项 | 类型 | 影响程度 | 说明 |
|--------|------|----------|------|
| 现有 API | 接口 | 低 | 仅新增字段 |

### 新增到需求池
- backlog-001: 用户模型基础设施
- backlog-002: 认证中间件
```

### Step 4: 创建/更新文档

**新 Feature**: 使用增强模板创建文档
- 模板参考: [templates/feature.md](templates/feature.md)
- **必须包含依赖分析部分**

**变更现有**: 使用 `Edit` 更新对应文档

**新 Domain**: 先更新 `docs/product_context.md`

#### 规范类 Feature 的设计内嵌 ⭐

**对于 `feature_kind: specification` 的 Feature**：

> 规范类 Feature 的需求文档需要内嵌设计决策，无需创建独立的 des-xxx.md 设计文档。

**需求文档必须包含 "Design Decisions (内嵌设计)" 部分**：

```markdown
## N. Design Decisions (内嵌设计)

> 规范类 Feature 的设计内嵌在需求文档中，无需独立设计文档。

### N.1 Trade-offs & Alternatives

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **选择的方案** | 描述 | 优点 | 缺点 |
| 备选方案 | 描述 | 优点 | 缺点 |

**Decision Rationale**:
1. 理由 1
2. 理由 2

### N.2 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 风险 | 概率 | 影响 | 缓解措施 |

### N.3 Success Metrics

| Metric | Target |
|--------|--------|
| 指标 | 目标值 |
```

**原因**：
1. 规范类 Feature 的 Specification 部分已包含技术设计
2. 避免需求文档与设计文档内容重复
3. 符合 "Document is Truth" 单一数据源原则
4. 参考 Claude 官方 "Concise is key" 最佳实践

**参考**: `.claude/steering/workflow.md` Section 8: Feature Kind & Design Documents

### Step 4.5: 注册 Feature 到 Domain Index ⭐

**目的**：将 Feature 注册到 Domain 的 index.md，使用完整项目路径。

**执行脚本**：
```bash
cd src && npx ts-node "../.claude/skills/sdf-analyze/scripts/register-feature.ts" <domain> <feature-id>
```

**示例**：
```bash
cd src && npx ts-node "../.claude/skills/sdf-analyze/scripts/register-feature.ts" DocSystem doc-indexer
```

**脚本功能**：
- 读取 Feature 文档的 Frontmatter
- 更新 Domain index.md 的 features 数组
- path 使用完整项目路径：`docs/requirements/<domain>/feat-<id>.md`
- 已存在则更新，不存在则新增（幂等）

### Step 5: 处理需求池

1. **添加新发现的依赖到 backlog**：
   ```bash
   Edit docs/requirements/backlog.md
   # 在"待分析队列"表格中添加新行
   ```

2. **检查需求池状态**：
   - 如果池中有待分析需求 → 继续分析下一个
   - 如果池为空 → 可以考虑进入 D 阶段

3. **优先级排序**：
   - 被多个 Feature 依赖的需求优先
   - 基础设施类需求优先

### Step 6: 验证并汇报

**验证清单**：
- [ ] Frontmatter 包含完整依赖声明
- [ ] `feature_kind` 已设置 (code 或 specification)
- [ ] 依赖分析部分已填写
- [ ] 新发现的依赖已加入 Backlog
- [ ] AC 已定义（根据 feature_kind 使用对应模板）
- [ ] Test Strategy 已定义（根据 feature_kind 选择验收方式）

**汇报模板**：
```
已完成需求分析：
- 文档: docs/requirements/<domain>/<feature>.md
- Domain: <domain>
- Feature Kind: <code | specification>

依赖分析结果：
- 前置依赖: X 个 (Y 个已存在, Z 个新增到 Backlog)
- 后续影响: N 项

验收方式：
- [ ] code → 单元测试 + 运行时验证
- [x] specification → 试运行 + 人工验收

需求池状态：
- 待分析: <count>
- 当前分析: <current>

[ ] 需求池为空 → 可以进入 Design 阶段
[x] 需求池有 Z 个待分析 → 建议继续分析: backlog-xxx
```

## 参考资料

- **Feature 模板**: [templates/feature.md](templates/feature.md)
- **依赖分析指南**: [references/dependency-analysis.md](references/dependency-analysis.md)
- **状态定义**: [references/status-definitions.md](references/status-definitions.md)
