---
product_name: SoloDevFlow 3.0
version: 0.1.0
status: in-development
last_updated: 2026-01-02

# 领域注册表 (Router 依据此列表进行分发)
domains:
  - id: CoreEngine
    description: 负责 CLI 的配置管理、Skill 调度 (.claude 目录管理)
    path: docs/requirements/CoreEngine
  - id: DocSystem
    description: 负责文档的解析、生成和依赖分析
    path: docs/requirements/DocSystem

# 全局约束
tech_stack:
  - Language: TypeScript/Python
  - Runtime: Claude CLI (Native)
  - Format: Markdown + YAML Frontmatter
---

# Product Vision

## 愿景
为超级个体开发者提供 AI 优先的人机协作开发框架。

## 核心原则

### 1. AI-First

**AI-First ≠ AI 直接执行文档**

| 层面 | 正确理解 | 错误理解 |
|------|----------|----------|
| **文档设计** | 结构和内容为 AI 理解能力优化 | 文档就是 AI 的可执行指令 |
| **工具实现** | 用代码 (TypeScript) 实现功能 | 用 Markdown 描述让 AI "执行" |
| **AI 角色** | 理解需求 → 调用工具 → 处理结果 | 直接解释 Markdown 执行任务 |

**AI-First 的具体体现**:
- YAML Frontmatter 存储结构化元数据（AI 易解析）
- `summary` 字段提供一句话描述（语义匹配）
- `tags` 字段支持分类搜索（快速定位）
- `dependencies` 字段声明依赖关系（图分析）

### 2. Document is Truth
文档是系统状态的唯一来源，代码是文档规格的实现。

### 3. Progressive Disclosure
渐进式加载上下文，防止 Token 爆炸。

### 4. Self-Bootstrapping
用 SoloDevFlow 开发 SoloDevFlow。

## 变更日志
- v0.1.0: 初始化项目结构，定义 CoreEngine 和 DocSystem。