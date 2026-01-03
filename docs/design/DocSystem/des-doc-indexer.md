---
id: des-doc-indexer
type: design
domain: DocSystem
status: draft
created: 2026-01-02
requirement: docs/requirements/DocSystem/feat-doc-indexer.md
---

# Doc Indexer - Technical Design

> 技术设计文档：定义 Claude 如何实现文档索引功能。

## 1. Design Overview

### 1.1 Implementation Approach

由于 SoloDevFlow 是 **AI-First** 框架，Doc Indexer 不是传统的代码实现，而是：

1. **Skill-Based**: 通过 Claude Skill 实现索引逻辑
2. **Tool-Driven**: 使用 Claude 内置工具 (Glob, Read) 执行扫描
3. **On-Demand**: 每次调用时实时计算，无持久化

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    /status Command                       │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Doc Indexer Skill                   │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │    │
│  │  │ Scanner │→ │ Parser  │→ │ Validator       │  │    │
│  │  │ (Glob)  │  │ (YAML)  │  │ (Schema Check)  │  │    │
│  │  └─────────┘  └─────────┘  └─────────────────┘  │    │
│  │                     │                            │    │
│  │                     ▼                            │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │           Reverse Link Calculator        │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  │                     │                            │    │
│  │                     ▼                            │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │              Output Formatter            │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 2. Component Design

### 2.1 Scanner Component

**职责**: 扫描 `docs/requirements/` 目录下所有 Feature 文件

**实现**:
```
Tool: Glob
Pattern: "docs/requirements/**/feat-*.md"
```

**过滤规则**:
- 包含: `feat-*.md` 文件
- 排除: `index.md`, `backlog.md`

### 2.2 Parser Component

**职责**: 解析 YAML Frontmatter 提取元数据

**实现**:
```
Tool: Read
Process:
1. 读取文件内容
2. 提取 --- 之间的 YAML 块
3. 解析为结构化数据
```

**字段提取**:
```yaml
Required:
  - id          # feat-xxx
  - type        # feature | bug | enhancement
  - domain      # Domain ID
  - status      # Status enum
  - priority    # critical | high | medium | low
  - summary     # 一句话描述

Optional:
  - tags        # 标签列表
  - created     # 创建日期
  - dependencies.requires  # 前置依赖
  - dependencies.blocks    # 阻塞项
  - analyzed    # 分析完成标记
```

### 2.3 Validator Component

**职责**: 验证 Frontmatter 符合 Schema 规范

**验证规则实现**:

| Rule ID | Check | Severity | Implementation |
|---------|-------|----------|----------------|
| id-required | id 字段存在 | Error | `if !frontmatter.id` |
| id-format | id 格式正确 | Error | `regex: ^(feat\|bug\|enh)-` |
| id-unique | id 全局唯一 | Error | 收集所有 id 后检查重复 |
| type-enum | type 值有效 | Error | `in ['feature','bug','enhancement']` |
| status-enum | status 值有效 | Error | `in [valid_statuses]` |
| priority-enum | priority 值有效 | Error | `in ['critical','high','medium','low']` |
| summary-required | summary 存在 | Error | `if !frontmatter.summary` |
| summary-length | summary 长度 | Warning | `10 <= len <= 100` |
| tags-recommended | tags 存在 | Warning | `if !frontmatter.tags` |
| domain-registered | domain 已注册 | Error | 检查 product_context.md |

**输出格式**:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: Array<{
    rule: string;
    file: string;
    message: string;
  }>;
  warnings: Array<{
    rule: string;
    file: string;
    message: string;
  }>;
}
```

### 2.4 Reverse Link Calculator

**职责**: 计算反向依赖关系

**算法**:
```
Input: features[] (所有已解析的 Feature)
Output: features[] (填充 computed 字段)

Algorithm:
1. 初始化所有 feature.computed = { requiredBy: [], blockedBy: [] }
2. for each feature A:
     for each feature B:
       if A.id in B.dependencies.requires:
         A.computed.requiredBy.push(B.id)
       if A.id in B.dependencies.blocks:
         A.computed.blockedBy.push(B.id)
3. return features
```

### 2.5 Output Formatter

**职责**: 格式化输出结果

**输出模式**:

#### Mode 1: Summary (默认)
```
=== Feature Index ===

Validation: 0 errors, 1 warning

Domain: DocSystem (2 features)
| ID                    | Status    | Priority | RequiredBy |
|-----------------------|-----------|----------|------------|
| feat-doc-indexer      | designing | high     | feat-dependency-graph |
| feat-dependency-graph | proposed  | high     | (none)     |

Stats:
- Total: 2 features
- By Status: designing(1), proposed(1)
```

#### Mode 2: Detail (带验证详情)
```
=== Feature Index (Detail) ===

Validation Results:
  Warnings:
    [tags-recommended] feat-xxx: 建议添加 tags 字段

Features:
  feat-doc-indexer:
    Status: designing
    Priority: high
    Summary: 扫描、解析、索引所有 Feature 文档...
    Tags: [indexing, metadata, validation]
    Requires: (none)
    Blocks: feat-dependency-graph
    RequiredBy: feat-dependency-graph
```

## 3. Integration Design

### 3.1 Integration with /status Command

**调用流程**:
```
User: /status
  │
  ▼
.claude/commands/status.md
  │
  ├── 调用 Doc Indexer
  │     ├── Glob("docs/requirements/**/feat-*.md")
  │     ├── Read each file
  │     ├── Parse & Validate
  │     ├── Calculate reverse links
  │     └── Format output
  │
  └── 显示结果
```

### 3.2 Integration with /backlog Command

**提供数据**:
- 当前 Feature 状态统计
- 依赖关系图
- 门控检查所需信息

## 4. Execution Flow

### 4.1 Complete Execution Sequence

```
Step 1: Scan
─────────────────────────────────
Glob("docs/requirements/**/feat-*.md")
→ files: [
    "docs/requirements/DocSystem/feat-doc-indexer.md",
    "docs/requirements/DocSystem/feat-dependency-graph.md",
    "docs/requirements/CoreEngine/feat-workflow-orchestration.md"
  ]

Step 2: Parse
─────────────────────────────────
for each file:
  content = Read(file)
  frontmatter = parseYAML(content)
  features.push({
    ...frontmatter,
    filePath: file
  })

Step 3: Validate
─────────────────────────────────
errors = []
warnings = []
idSet = {}

for each feature:
  // Required field checks
  if !feature.id: errors.push(...)
  if !feature.summary: errors.push(...)

  // Format checks
  if !feature.id.match(/^(feat|bug|enh)-/): errors.push(...)

  // Uniqueness check
  if feature.id in idSet:
    errors.push({
      rule: 'id-unique',
      files: [idSet[feature.id], feature.filePath]
    })
  else:
    idSet[feature.id] = feature.filePath

Step 4: Reverse Links
─────────────────────────────────
for each feature A:
  A.computed = { requiredBy: [], blockedBy: [] }

for each feature A:
  for each feature B:
    if A.id in B.dependencies?.requires:
      A.computed.requiredBy.push(B.id)
    if A.id in B.dependencies?.blocks:
      A.computed.blockedBy.push(B.id)

Step 5: Group & Stats
─────────────────────────────────
domains = groupBy(features, 'domain')
stats = {
  total: features.length,
  byStatus: countBy(features, 'status'),
  byPriority: countBy(features, 'priority'),
  analyzedRate: count(f => f.analyzed) / total
}

Step 6: Output
─────────────────────────────────
format(domains, stats, validation)
```

## 5. Error Handling

### 5.1 File Read Errors

```
Scenario: 文件无法读取
Handling:
  - 记录为 validation error
  - 继续处理其他文件
  - 最终报告中显示失败文件
```

### 5.2 YAML Parse Errors

```
Scenario: YAML 格式错误
Handling:
  - 记录为 validation error (rule: 'yaml-invalid')
  - 跳过该文件
  - 继续处理其他文件
```

### 5.3 Missing Frontmatter

```
Scenario: 文件没有 YAML Frontmatter
Handling:
  - 记录为 validation error (rule: 'frontmatter-missing')
  - 跳过该文件
```

## 6. Performance Considerations

| Metric | Target | Rationale |
|--------|--------|-----------|
| Scan Time | < 1s | 当前规模 <10 文件 |
| Parse Time | < 100ms/file | YAML 解析快速 |
| Total Time | < 5s | 用户体验要求 |

**优化策略**:
- 并行读取文件（如果 Claude 支持）
- 早期失败：遇到严重错误可选择终止

## 7. Future Extensibility

### 7.1 Potential Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Cache Layer | Low | 基于文件修改时间的缓存 |
| Full-text Search | Low | 文档内容搜索 |
| Export to JSON | Medium | 导出索引数据供外部工具使用 |

### 7.2 Not Planned

- 图形化界面（保持 CLI-first）
- 持久化数据库（当前规模不需要）

---

*Design: feat-doc-indexer*
*Domain: DocSystem*
*Created: 2026-01-02*
*Status: draft*
