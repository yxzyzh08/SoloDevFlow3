---
id: pattern-document-parser
title: Scanner-Parser-Validator Pattern
status: active
used_by: [doc-indexer]
---

# Scanner-Parser-Validator Pattern

## Intent

将文档处理分解为三个独立阶段，每个阶段职责单一，便于测试和扩展。

## Structure

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Scanner  │────▶│  Parser  │────▶│Validator │
│          │     │          │     │          │
│ 发现文件  │     │ 解析内容  │     │ 验证规范  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     ▼                ▼                ▼
  files[]         parsed[]        validated[]
```

## Components

### Scanner

**职责**: 发现符合条件的文件

```typescript
interface ScanResult {
  files: string[];
  errors: string[];
}

async function scanFeatureFiles(basePath: string): Promise<ScanResult>
```

**实现要点**:
- 使用 Glob 模式匹配
- 返回错误而非抛出异常
- 支持过滤规则

### Parser

**职责**: 解析文件内容提取结构化数据

```typescript
interface ParseResult {
  success: boolean;
  feature?: Partial<FeatureIndex>;
  error?: string;
}

async function parseFeatureFile(filePath: string): Promise<ParseResult>
```

**实现要点**:
- 处理 YAML Frontmatter
- 规范化可选字段
- 单文件失败不影响整体

### Validator

**职责**: 验证数据符合 Schema 规范

```typescript
interface ValidationIssue {
  rule: string;
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

function validateFeature(feature, ctx): ValidationIssue[]
```

**实现要点**:
- 区分 Error 和 Warning
- 提供具体规则 ID
- 支持跨文件验证（如 ID 唯一性）

## Usage in SoloDevFlow

```typescript
// src/doc-indexer/index.ts

export async function indexFeatures(basePath: string): Promise<IndexResult> {
  // Step 1: Scan
  const scanResult = await scanFeatureFiles(basePath);

  // Step 2: Parse
  const features = [];
  for (const file of scanResult.files) {
    const parseResult = await parseFeatureFile(file);
    if (parseResult.success) {
      features.push(parseResult.feature);
    }
  }

  // Step 3: Validate
  const issues = [];
  for (const feature of features) {
    issues.push(...validateFeature(feature, ctx));
  }

  return { features, validation: summarize(issues) };
}
```

## When to Use

- 处理多个同类型文档
- 需要批量验证
- 错误处理需要细粒度控制

## Related Patterns

- Pipeline Pattern
- Chain of Responsibility
