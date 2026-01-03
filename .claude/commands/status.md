---
allowed-tools: Read, Grep, Glob
description: 查看工作流状态、Feature 索引和验证结果
argument-hint: [--detail | --validate | domain | feature-id]
---

# Feature Index & Status

查看 SoloDevFlow 项目的 Feature 索引和工作流状态。

## Arguments

- 无参数: 显示全局状态概览
- `--detail`: 显示详细信息（含依赖关系）
- `--validate`: 显示完整验证结果
- `<domain>`: 显示指定 Domain 的 Feature
- `<feature-id>`: 显示指定 Feature 详情

## Execution Flow

执行以下步骤实现 Doc Indexer 功能：

### Step 1: Scan Feature Files

```bash
Glob("docs/requirements/**/feat-*.md")
```

排除 `index.md` 和 `backlog.md`。

### Step 2: Parse & Validate Each File

对每个文件执行：

```bash
Read(<file>)
```

然后解析 YAML Frontmatter，提取以下字段：

**Required Fields** (缺失报 Error):
- `id`: 必须以 `feat-`、`bug-`、`enh-` 开头
- `type`: 必须是 `feature` | `bug` | `enhancement`
- `domain`: 必须是已注册的 Domain
- `status`: 必须是有效状态枚举
- `priority`: 必须是 `critical` | `high` | `medium` | `low`
- `summary`: 一句话描述

**Optional Fields** (缺失报 Warning):
- `tags`: 标签列表
- `dependencies.requires`: 前置依赖
- `dependencies.blocks`: 阻塞项
- `analyzed`: 分析完成标记

**Validation Rules**:
| Rule | Severity | Check |
|------|----------|-------|
| id-required | Error | id 字段存在 |
| id-format | Error | id 以 feat-/bug-/enh- 开头 |
| id-unique | Error | id 全局唯一（扫描完成后检查） |
| type-enum | Error | type 值有效 |
| status-enum | Error | status 值有效 |
| priority-enum | Error | priority 值有效 |
| summary-required | Error | summary 字段存在 |
| summary-length | Warning | summary 10-100 字符 |
| tags-recommended | Warning | tags 字段存在 |
| deps-exist | Warning | requires 中的 ID 存在 |

### Step 3: Calculate Reverse Links

扫描完成后，计算反向链接：

```
for each feature A:
  A.computed = { requiredBy: [], blockedBy: [] }

for each feature A:
  for each feature B:
    if A.id in B.dependencies.requires:
      A.computed.requiredBy.push(B.id)
    if A.id in B.dependencies.blocks:
      A.computed.blockedBy.push(B.id)
```

### Step 4: Group by Domain & Calculate Stats

```
domains = groupBy(features, 'domain')
stats = {
  total: features.length,
  byStatus: countBy(features, 'status'),
  byPriority: countBy(features, 'priority'),
  analyzedCount: count(f => f.analyzed == true),
  validCount: count(f => f.errors.length == 0)
}
```

### Step 5: Format Output

## Output Format

### Default (Summary)

```
=== Feature Index ===

Validation: {errors} errors, {warnings} warnings

Domain: {domain} ({count} features)
| ID | Status | Priority | RequiredBy |
|----|--------|----------|------------|
| feat-xxx | designing | high | feat-yyy |

Stats:
- Total: N features
- By Status: implementing(2), designing(1), proposed(1)
- By Priority: critical(1), high(3)
- Analyzed: M/N
```

### With --detail

添加每个 Feature 的：
- Summary
- Tags
- Dependencies (requires/blocks)
- Computed reverse links (requiredBy/blockedBy)

### With --validate

显示完整验证结果：
```
Errors:
  [id-unique] feat-xxx: ID 重复
    - docs/requirements/CoreEngine/feat-xxx.md
    - docs/requirements/DocSystem/feat-xxx.md

Warnings:
  [tags-recommended] feat-yyy: 建议添加 tags 字段
  [summary-length] feat-zzz: summary 过短 (8 字符)
```

## Status Enum Reference

| Status | Phase | Description |
|--------|-------|-------------|
| backlog | - | 需求池中 |
| proposed | R | 已提出 |
| analyzing | R | 分析中 |
| analyzed | R | 分析完成 |
| waiting-deps | R | 等待依赖 |
| ready-for-design | R | 可进入设计 |
| designing | D | 设计中 |
| implementing | C | 实现中 |
| testing | T | 测试中 |
| done | - | 完成 |
| blocked | - | 阻塞 |

## Example Execution

```
User: /status

Claude:
1. Glob("docs/requirements/**/feat-*.md")
   → 3 files found

2. Read & Parse each file
   → feat-doc-indexer: OK
   → feat-dependency-graph: OK
   → feat-workflow-orchestration: OK

3. Validate
   → 0 errors, 1 warning

4. Calculate reverse links
   → feat-doc-indexer.requiredBy = [feat-dependency-graph]

5. Output:
   === Feature Index ===
   ...
```
