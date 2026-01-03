---
id: feat-doc-indexer
type: feature
domain: DocSystem
status: done
priority: high
created: 2026-01-02
summary: 扫描、解析、索引所有 Feature 文档，提供结构化查询和验证能力
tags: [indexing, metadata, validation, docSystem]
dependencies:
  requires: []  # 自包含，无前置依赖
  blocks:
    - feat-dependency-graph  # backlog-004 依赖本 Feature
analyzed: true
---

# Doc Indexer

> DocSystem 的核心基础设施：扫描、解析、索引所有 Feature 文档，为工作流状态查询提供数据支撑，并确保文档规范一致性。

## 1. Requirements

### 1.1 Background

SoloDevFlow 的 "Document is Truth" 原则要求所有状态存储在文档中。随着 Feature 数量增加，需要一个统一的机制来：

1. **扫描**所有 Feature 文档
2. **解析** YAML Frontmatter 提取元数据
3. **验证** Schema 规范，确保数据质量
4. **索引**生成结构化数据供查询
5. **计算**自动推导反向链接关系
6. **统计**汇总工作流状态

### 1.2 User Stories

作为**开发者**，我希望能**快速查看所有 Feature 的状态**，以便**了解项目整体进度和阻塞点**。

作为**工作流引擎**，我需要**获取所有 Feature 的依赖关系（包括反向链接）**，以便**判断阶段转换条件是否满足**。

作为**文档维护者**，我希望能**自动检测 Frontmatter 规范问题**，以便**及时修复保证数据质量**。

### 1.3 Scope

**包含**：
- 扫描 `docs/requirements/` 目录下所有 `.md` 文件
- 解析 YAML Frontmatter 提取元数据
- **验证 Schema 规范（必需字段、格式、唯一性）**
- 生成结构化索引数据
- **自动计算反向链接**
- 提供基础统计功能

**不包含**：
- 依赖图可视化（由 feat-dependency-graph 负责）
- 文档内容全文索引
- 持久化缓存（当前规模实时扫描即可）

## 2. Specification

### 2.1 Index Data Structure

```typescript
interface FeatureIndex {
  // 元数据
  id: string;                    // feat-xxx
  type: 'feature' | 'bug' | 'enhancement';
  domain: string;                // CoreEngine | DocSystem
  status: FeatureStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';

  // 语义字段 (AI-First)
  summary: string;               // 一句话描述，用于 AI 快速匹配
  tags: string[];                // 标签，便于分类和搜索

  // 依赖关系 (声明式)
  dependencies: {
    requires: string[];          // 前置依赖 ID 列表
    blocks: string[];            // 被本 Feature 阻塞的 ID 列表
  };

  // 反向链接 (自动计算)
  computed: {
    requiredBy: string[];        // 谁依赖我 (从其他 Feature 的 requires 反向计算)
    blockedBy: string[];         // 谁阻塞我 (从其他 Feature 的 blocks 反向计算)
  };

  // 分析状态
  analyzed: boolean;

  // 文件信息
  filePath: string;
  lastModified: string;
}

interface IndexResult {
  features: FeatureIndex[];
  domains: DomainSummary[];
  stats: IndexStats;
  validation: ValidationResult;  // 验证结果
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### 2.2 Frontmatter Schema

所有 Feature 文档必须包含以下 YAML Frontmatter：

```yaml
---
# ===== Required Fields =====
id: feat-<feature-name>         # 唯一标识，必须 feat- 前缀，全局唯一
type: feature                    # feature | bug | enhancement
domain: <DomainId>              # 所属领域，必须在 product_context.md 中注册
status: <FeatureStatus>         # 状态枚举
priority: high                   # critical | high | medium | low

# ===== Semantic Fields (AI-First) =====
summary: "一句话描述 Feature 的核心价值"  # 必需，用于 AI 快速匹配
tags: [tag1, tag2]              # 推荐，便于分类搜索

# ===== Dependency Fields =====
dependencies:
  requires: []                   # 前置依赖的 Feature ID
  blocks: []                     # 被本 Feature 阻塞的 Feature ID
analyzed: false                  # 依赖分析是否完成

# ===== Optional Fields =====
created: YYYY-MM-DD
---
```

### 2.3 Domain Index Schema

每个 Domain 目录下的 `index.md` 文件用于注册该 Domain 的所有 Feature。

```yaml
---
domain_id: <DomainId>              # Domain 标识
description: <一句话描述领域职责>
owner: Human
status: active
features:
  - id: feat-xxx                   # Feature ID
    name: Feature Name             # 显示名称
    status: done                   # 当前状态
    priority: high                 # 优先级
    path: docs/requirements/<Domain>/feat-xxx.md  # 完整项目路径
---
```

**path 字段规范**：

| 属性 | 要求 |
|------|------|
| **格式** | 完整项目路径，从项目根目录开始 |
| **正确** | `docs/requirements/DocSystem/feat-doc-indexer.md` |
| **错误** | `./feat-doc-indexer.md` (相对路径) |
| **原因** | 便于 AI 和工具直接定位文件，无需路径拼接 |

### 2.4 Validation Rules

| Rule | Type | Description |
|------|------|-------------|
| **id-required** | Error | id 字段必须存在 |
| **id-format** | Error | id 必须以 `feat-`、`bug-`、`enh-` 开头 |
| **id-unique** | Error | id 在全局范围内必须唯一 |
| **type-required** | Error | type 字段必须存在 |
| **type-enum** | Error | type 必须是 feature/bug/enhancement 之一 |
| **domain-required** | Error | domain 字段必须存在 |
| **domain-registered** | Error | domain 必须在 product_context.md 中注册 |
| **status-required** | Error | status 字段必须存在 |
| **status-enum** | Error | status 必须是有效状态枚举值 |
| **priority-required** | Error | priority 字段必须存在 |
| **summary-required** | Error | summary 字段必须存在 |
| **summary-length** | Warning | summary 建议 10-100 字符 |
| **tags-recommended** | Warning | 建议添加 tags 字段 |
| **deps-exist** | Warning | dependencies.requires 中的 ID 应存在 |

### 2.5 Status Enum

```typescript
type FeatureStatus =
  | 'backlog'           // 需求池中
  | 'proposed'          // 已提出
  | 'analyzing'         // 分析中
  | 'analyzed'          // 分析完成
  | 'waiting-deps'      // 等待依赖
  | 'ready-for-design'  // 可进入设计
  | 'designing'         // 设计中
  | 'implementing'      // 实现中
  | 'testing'           // 测试中
  | 'done'              // 完成
  | 'blocked';          // 阻塞
```

### 2.6 Index Operations

#### 2.6.1 Full Scan & Validation

```
Input: docs/requirements/
Output: IndexResult

Steps:
1. Glob("docs/requirements/**/feat-*.md")
2. 排除 index.md 和 backlog.md
3. 对每个文件:
   a. Read(filePath)
   b. 解析 YAML Frontmatter
   c. 验证 Schema (收集 errors/warnings)
   d. 构建 FeatureIndex
4. ID 唯一性全局检查
5. 计算反向链接
6. 按 Domain 分组
7. 生成统计信息
8. 返回 IndexResult (含验证结果)
```

#### 2.6.2 Reverse Link Computation

```
Input: FeatureIndex[]
Output: FeatureIndex[] (填充 computed 字段)

Algorithm:
for each feature A in features:
  for each feature B in features:
    if A.id in B.dependencies.requires:
      A.computed.requiredBy.push(B.id)
    if A.id in B.dependencies.blocks:
      A.computed.blockedBy.push(B.id)
```

#### 2.6.3 ID Uniqueness Check

```
Input: FeatureIndex[]
Output: ValidationError[] (如有重复)

Algorithm:
idMap = {}
for each feature in features:
  if feature.id in idMap:
    errors.push({
      type: 'id-unique',
      message: f"ID '{feature.id}' 重复",
      files: [idMap[feature.id], feature.filePath]
    })
  else:
    idMap[feature.id] = feature.filePath
```

#### 2.6.4 Feature Registration (Skill Script)

**目的**：在 sdf-analyze skill 完成 Feature 文档创建后，自动将 Feature 注册到 Domain 的 index.md。

**实现方式**：作为 skill 的工具脚本，位于 `.claude/skills/sdf-analyze/scripts/register-feature.ts`

```
Command: npx ts-node .claude/skills/sdf-analyze/scripts/register-feature.ts <domain> <feature-id>

Input:
  - domain: Domain ID (如 DocSystem)
  - feature-id: Feature ID (如 doc-indexer，不含 feat- 前缀)

Process:
1. 读取 docs/requirements/<domain>/feat-<feature-id>.md
2. 解析 YAML Frontmatter 提取 id, name(从标题), status, priority
3. 读取 docs/requirements/<domain>/index.md
4. 更新 features 数组:
   - 如果 id 已存在: 更新 status, priority
   - 如果 id 不存在: 添加新条目
5. path 使用完整项目路径: docs/requirements/<domain>/feat-<feature-id>.md
6. 写回 index.md

Output:
  - 成功: "Registered feat-<id> to <domain>/index.md"
  - 失败: 错误信息
```

**设计原则**：

| 原则 | 说明 |
|------|------|
| **AI-First** | 脚本实现功能，AI 调用脚本，符合"功能用代码实现" |
| **零上下文** | 脚本输出消耗 Token，脚本本身不加载到上下文 |
| **一致性** | 代码保证 path 格式统一，避免人工错误 |
| **幂等性** | 多次执行结果一致，已存在则更新 |

### 2.7 Output Format

```
=== Feature Index ===

Validation: 1 error, 2 warnings

Errors:
  [id-unique] ID 'feat-xxx' 重复
     - docs/requirements/CoreEngine/feat-xxx.md
     - docs/requirements/DocSystem/feat-xxx.md

Warnings:
  [summary-length] feat-doc-indexer: summary 过短 (8 字符)
  [tags-recommended] feat-workflow-orchestration: 建议添加 tags

---

Domain: CoreEngine (1 Features)
| ID                          | Status     | Priority | RequiredBy  |
|-----------------------------|------------|----------|-------------|
| feat-workflow-orchestration | analyzing  | critical | (none)      |

Domain: DocSystem (1 Features)
| ID               | Status   | Priority | RequiredBy            |
|------------------|----------|----------|-----------------------|
| feat-doc-indexer | proposed | high     | feat-dependency-graph |

Stats:
- Total: 2 Features
- By Status: analyzing(1), proposed(1)
- By Priority: critical(1), high(1)
- Analyzed: 1/2
- Valid: 1/2
```

## 3. Dependency Analysis

### 3.1 Requires

| Dependency | Type | Status | Description |
|------------|------|--------|-------------|
| Glob Tool | Infra | Claude Built-in | 扫描文件目录 |
| Read Tool | Infra | Claude Built-in | 读取文件内容 |
| YAML Parser | Infra | Claude Built-in | 解析 Frontmatter |

**结论**: 本 Feature 是自包含的基础设施，无前置 Feature 依赖。

### 3.2 Affects

| Item | Type | Impact | Description |
|------|------|--------|-------------|
| /status Command | Command | High | 依赖索引数据显示状态 |
| /backlog stats | Command | High | 依赖索引数据统计 |
| feat-dependency-graph | Feature | High | 依赖索引数据构建依赖图 |
| /next Command | Command | Medium | 查询 Feature 当前状态 |
| Feature Template | Template | Medium | 需同步更新 Frontmatter 规范 |

### 3.3 New Backlog Items

(无新增 - 本 Feature 是自包含的)

### 3.4 Analysis Conclusion

- [x] 所有前置依赖已识别
- [x] 所有前置依赖已存在 (Claude 内置工具)
- [x] 后续影响已评估
- [x] 无新增依赖到 Backlog

**Status**: Ready for Design

## 4. Acceptance Criteria

### AC-1: Full Scan
- [x] 能扫描 `docs/requirements/` 下所有 `feat-*.md` 文件
- [x] 正确排除 `index.md` 和 `backlog.md`
- [x] 返回结构化的索引数据

### AC-2: Frontmatter Parsing
- [x] 能正确解析 YAML Frontmatter
- [x] 正确提取所有字段包括 summary 和 tags
- [x] 对缺失字段给出相应错误/警告

### AC-3: Schema Validation
- [x] 检测必需字段缺失并报告为 Error
- [x] 检测 ID 格式不符合规范
- [x] 检测 status/type/priority 值不在枚举范围内
- [x] 检测 domain 未在 product_context.md 注册

### AC-4: ID Uniqueness
- [x] 全局检查所有 Feature ID 唯一性
- [x] 发现重复时报告所有冲突文件路径

### AC-5: Reverse Links
- [x] 自动计算 `computed.requiredBy` 字段
- [x] 自动计算 `computed.blockedBy` 字段
- [x] 计算结果与 dependencies 声明一致

### AC-6: Domain Grouping
- [x] 索引结果按 Domain 正确分组
- [x] 每个 Domain 的 Feature 数量准确

### AC-7: Statistics
- [x] 按 status 分组统计正确
- [x] 按 priority 分组统计正确
- [x] analyzed 完成率计算正确
- [x] 验证通过率计算正确

### AC-8: Integration
- [x] /status 命令能调用索引器
- [x] 显示验证结果摘要
- [x] 输出格式清晰可读

### AC-9: Feature Registration Script
- [ ] 脚本位于 `.claude/skills/sdf-analyze/scripts/register-feature.ts`
- [ ] 能正确读取 Feature 文档的 Frontmatter
- [ ] 能正确更新 Domain index.md 的 features 数组
- [ ] path 字段使用完整项目路径 `docs/requirements/<domain>/feat-<id>.md`
- [ ] 已存在的 Feature 执行更新操作（幂等）
- [ ] sdf-analyze skill 能正确调用此脚本

## 5. Technical Constraints

- **No Persistence**: 当前规模（<50 个文件）实时扫描即可
- **Skill Scripts**: Feature 注册使用 skill 脚本实现，符合 AI-First 原则
- **Fault Tolerance**: 单个文件解析失败不影响整体索引，记录为验证错误
- **Performance**: 全量扫描应在 5 秒内完成

---

*Feature: doc-indexer*
*Domain: DocSystem*
*Created: 2026-01-02*
*Status: done*
*Dependencies Analyzed: true*
