---
type: documentation-standard
status: active
version: 1.0.0
last_updated: 2026-01-11
---

# AI-First Documentation Standards

> 文档编写规范，确保所有生成的文档对 AI 友好、结构清晰、易于解析。

**IMPORTANT: 生成任何文档前，必须遵循本规范。**

## 1. Core Principles

| Principle | Description |
|-----------|-------------|
| **Structure over Prose** | 使用表格/列表，避免长段落 |
| **Explicit over Implicit** | 明确声明，不依赖上下文推断 |
| **Flat over Nested** | 扁平结构，避免深层嵌套 |
| **Semantic Metadata** | YAML Frontmatter 包含语义字段 |

## 2. Format Selection

| 场景 | 推荐格式 | 避免格式 | 原因 |
|------|----------|----------|------|
| 状态转换 | 表格 | ASCII 图 | AI 线性处理，表格易解析 |
| 流程步骤 | 编号列表 | 嵌套列表 | 扁平结构更清晰 |
| 条件判断 | 表格 | if-else 段落 | 结构化，无歧义 |
| 选项对比 | 表格 | 长段落描述 | 并列展示，易比较 |
| 代码示例 | 代码块 | 内联代码 | 语法高亮，易复制 |
| 配置说明 | 表格 + 代码块 | 纯文字 | 结构 + 示例结合 |

## 3. YAML Frontmatter

### 3.1 必需字段

```yaml
---
id: <type>-<name>           # 唯一标识
type: <document-type>       # feature | design | test-report | ...
status: <status>            # proposed | analyzing | done | ...
---
```

### 3.2 语义字段 (AI-First)

```yaml
# AI 快速匹配字段
summary: "一句话描述文档核心内容"
tags: [关键词1, 关键词2, 关键词3]
```

### 3.3 依赖字段 (Feature 文档)

```yaml
dependencies:
  requires: [feat-xxx, feat-yyy]  # 前置依赖
  blocks: []                       # 阻塞的后续 Feature
analyzed: true                     # 依赖分析是否完成
```

## 4. Document Structure

### 4.1 章节层级

```markdown
# Title (H1) - 仅一个

## Section (H2) - 主要章节

### Subsection (H3) - 子章节

避免使用 H4 及以下
```

### 4.2 标准章节顺序

**Feature 文档 (feat-xxx.md)**:
```
1. Requirements (需求背景、User Stories、Scope)
2. Specification (技术规格)
3. Dependency Analysis (依赖分析)
4. Acceptance Criteria (验收标准)
5. Technical Constraints (技术约束)
```

**Design 文档 (des-xxx.md)**:
```
1. Overview (设计概述)
2. Architecture (架构设计)
3. Module Design (模块设计)
4. Interface Definition (接口定义)
5. Test Strategy (测试策略)
```

**Test Report (test-xxx.md)**:
```
1. Test Summary (测试摘要)
2. AC Verification (AC 验证结果)
3. Issues Found (发现的问题)
4. Conclusion (结论)
```

## 5. Content Guidelines

### 5.1 表格规范

```markdown
| Column A | Column B | Column C |
|----------|----------|----------|
| 数据对齐 | 使用 | 分隔线 |
```

- 表头必须有分隔线
- 单元格内容简洁，复杂内容用脚注
- 空值用 `-` 表示

### 5.2 列表规范

```markdown
**编号列表** (有顺序):
1. 第一步
2. 第二步
3. 第三步

**无序列表** (无顺序):
- 选项 A
- 选项 B
- 选项 C
```

- 避免超过 2 层嵌套
- 每项一个完整概念

### 5.3 代码块规范

```markdown
```typescript
// 指定语言以启用高亮
function example(): void {
  // 代码示例
}
```
```

- 必须指定语言类型
- 包含必要注释
- 可直接运行或说明依赖

### 5.4 避免的写法

| 避免 | 原因 | 替代方案 |
|------|------|----------|
| 长段落 (>5 行) | AI 难以提取关键信息 | 拆分为列表或表格 |
| ASCII 图 | 空间布局 AI 难解析 | 使用表格描述关系 |
| 隐式引用 | "如上所述" AI 难定位 | 明确指出章节/文件 |
| 深层嵌套 | 结构复杂 | 扁平化或拆分文档 |
| 模糊时间 | "稍后"、"之前" | 具体阶段或步骤编号 |

## 6. Naming Conventions

### 6.1 文件命名

| 类型 | 模式 | 示例 |
|------|------|------|
| Feature | `feat-<name>.md` | `feat-doc-indexer.md` |
| Design | `des-<name>.md` | `des-doc-indexer.md` |
| Test Report | `test-<name>.md` | `test-doc-indexer.md` |
| Domain Index | `index.md` | `index.md` |

### 6.2 ID 命名

| 类型 | 模式 | 示例 |
|------|------|------|
| Feature ID | `feat-<name>` | `feat-sdf-analyze` |
| Design ID | `des-<name>` | `des-task-management` |
| Test ID | `test-<name>` | `test-sdf-code` |
| Task ID | `task-<number>` | `task-001` |

### 6.3 命名风格

- 文件名: `kebab-case` (小写 + 连字符)
- ID: `kebab-case`
- 变量/字段: `camelCase` 或 `snake_case` (保持项目一致)

## 7. Templates Reference

| 文档类型 | 模板位置 |
|----------|----------|
| Feature | `.claude/skills/sdf-analyze/templates/` |
| Design | `.claude/skills/sdf-design/templates/` |
| Change Log | `.claude/skills/sdf-code/templates/` |
| Test Report | `.claude/skills/sdf-test/templates/` |

## 8. Validation Checklist

生成文档后检查：

```
- [ ] YAML Frontmatter 完整 (id, type, status)
- [ ] 语义字段已填写 (summary, tags)
- [ ] 无长段落 (每段 < 5 行)
- [ ] 无 ASCII 图 (使用表格替代)
- [ ] 无深层嵌套 (最多 2 层)
- [ ] 表格有分隔线
- [ ] 代码块指定语言
- [ ] 无隐式引用
```

## 9. Bilingual Convention

项目全局遵循以下双语约定：

| 元素 | 语言 |
|------|------|
| 文件名 (Filenames) | 英文 |
| 标题和术语 (Titles & Terms) | 英文 |
| 描述和逻辑 (Descriptions & Logic) | 中文 |

此规则适用于所有文档、代码注释和规范文件。


---

*Documentation Standards v1.0.0*
*Last Updated: 2026-01-11*
