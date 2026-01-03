---
domain_id: DocSystem
description: 负责文档的解析、生成和依赖分析
owner: Human
status: active
features:
  - id: feat-doc-indexer
    name: Doc Indexer
    status: done
    priority: high
    path: docs/requirements/DocSystem/feat-doc-indexer.md
  - id: feat-dependency-graph
    name: Dependency Graph
    status: done
    priority: high
    path: docs/requirements/DocSystem/feat-dependency-graph.md
---

# DocSystem 领域视图

## 领域职责
维护 "Document is Truth" 的完整性，包括：
1. Markdown 解析与 YAML 提取。
2. 跨文档的链接与依赖分析。
3. 生成人类可读的汇总视图。
4. **Feature 索引与状态统计。**

## Feature List

| ID | Name | Status | Priority | Description |
|----|------|--------|----------|-------------|
| feat-doc-indexer | Doc Indexer | proposed | high | 扫描、解析、索引 Feature 文档 |
| feat-dependency-graph | Dependency Graph | proposed | high | 依赖图构建、拓扑排序、门控检查 |