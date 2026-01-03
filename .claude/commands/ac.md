---
allowed-tools: Read, Grep, Glob
description: 检查 Feature 的验收标准完成情况
argument-hint: [feature-id]
---

# 验收标准检查

检查指定 Feature 的验收标准 (AC) 完成情况。

## 当前上下文

**工作目录**: !`pwd`

## 任务

检查 Feature 验收标准: $ARGUMENTS

## 执行步骤

1. **定位 Feature 文档**
   - 搜索 `docs/requirements/*/$ARGUMENTS.md` 或匹配 id

2. **提取验收标准**
   - 解析文档中的 `## 验收标准` 或 `## AC` 部分
   - 识别所有 `- [ ]` 和 `- [x]` 条目

3. **逐项验证**
   - 对于可自动验证的 AC（如"文件存在"、"测试通过"），执行验证
   - 对于需人工确认的 AC，标记为待确认

4. **生成报告**

## 输出格式

```
=== 验收标准检查 ===

Feature: <feature-id>
Domain: <domain>
Status: <current-status>

验收标准进度: 2/5 完成

### AC-1: <标准名称>
- [x] 条件 1 (已验证)
- [ ] 条件 2 (未完成)

### AC-2: <标准名称>
- [?] 条件 1 (需人工确认)

---
建议: <下一步行动>
```
