# SoloDevFlow 3.0 - Project Memory

## 核心身份

你正在运行 SoloDevFlow 3.0 框架，一个 **AI-First** 的开发体系。

**IMPORTANT: 你的最高准则是 Document is Truth (文档即真理)。**

AI-First 意味着文档结构为 AI 理解优化（YAML Frontmatter + 语义字段），但**功能用代码实现**（`src/`），AI 通过 CLI 调用。

## 技术栈

| Item | Value |
|------|-------|
| Language | TypeScript (ESM) |
| Runtime | Node.js 18+ |
| Package Manager | npm |
| Documentation | Markdown + YAML Frontmatter |

## 核心原则

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Document is Truth** | 工作流状态存在文档中，而非 AI 记忆 |
| 2 | **Document First** | 修改架构/规范时，先改文档再执行 |
| 3 | **Dependency First** | 先分析依赖，再确定范围 |
| 4 | **Gate Check** | 阶段转换需满足门控条件 |
| 5 | **AC Driven** | 验收标准是唯一判定依据 |

## 工作流 (R-D-C-T)

```
R (Requirements) → D (Design) → C (Coding) → T (Testing) → Done
```

**IMPORTANT: 执行任何阶段操作前，必须先读取 `.claude/steering/workflow.md`**

**IMPORTANT: 禁止跳阶段，每次阶段完成必须更新文档 `status` 字段。**

## Skill 入口

| 阶段 | Skill | 版本 | 触发词 | 位置 |
|------|-------|------|--------|------|
| R | sdf-analyze | 1.1.0 | "需求分析"、"添加功能"、"新需求"、"我想要" | `.claude/skills/sdf-analyze/` |
| D | sdf-design | 1.1.0 | "设计"、"技术方案"、"怎么实现"、"架构" | `.claude/skills/sdf-design/` |
| C | sdf-code | 1.1.0 | "编码"、"开始写代码"、"进入开发" | `.claude/skills/sdf-code/` |
| T | sdf-test | 1.1.0 | "测试"、"验收"、"检查 AC" | `.claude/skills/sdf-test/` |

## 常用命令

```bash
# 构建
npm run build

# 测试
npm test

# Feature 状态
node dist/index.js status
node dist/index.js status --graph --order

# 任务管理
node dist/index.js task list
node dist/index.js task stats
node dist/index.js task add --type=analyze_requirement --title="xxx"
node dist/index.js task done <task-id>

# 门控检查
node dist/index.js next <feature-id>
```

## 目录结构

| Layer | Path | Description |
|-------|------|-------------|
| **运行态** | `.solodevflow/` | 运行时状态、任务存储 |
| **框架规范** | `.claude/steering/` | 工作流规范 |
| **框架规范** | `.claude/skills/` | 技能定义 |
| **产品知识** | `docs/requirements/<domain>/` | 需求文档 (R 阶段) |
| **产品知识** | `docs/design/<domain>/` | 设计文档 (D 阶段) |
| **产品知识** | `docs/architecture/` | 架构决策 |
| **代码** | `src/` | 代码实现 (C 阶段) |

## 行为约束

- **IMPORTANT: Metadata First** - 读取 Markdown 前先解析 YAML Frontmatter
- **IMPORTANT: Gate Check** - 阶段转换前必须执行门控检查并询问用户确认
- **Status Sync** - 阶段完成后立即更新文档 `status` 字段
- **Domain Routing** - 新增 Domain 必须同步更新 `docs/product_context.md`
- **Cross-Domain** - 跨 Domain 需求优先分析依赖

## 参考文档

| 文档 | 用途 |
|------|------|
| `.claude/steering/workflow.md` | 完整工作流规范 |
| `.claude/steering/doc-standards.md` | AI-First 文档编写规范 |
| `docs/architecture/ARCHITECTURE.md` | 系统架构 |
| `docs/product_context.md` | 领域注册表 |

**IMPORTANT: 生成任何文档前，必须先读取 `doc-standards.md`**
