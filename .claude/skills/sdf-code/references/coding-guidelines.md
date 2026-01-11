# SoloDevFlow Coding Guidelines

> C 阶段编码规范参考

## 1. 语言与运行时

| Item | Standard |
|------|----------|
| Language | TypeScript (优先) / Python |
| Runtime | Node.js / Claude CLI |
| Format | Markdown + YAML Frontmatter |

## 2. TypeScript 规范

### 2.1 类型定义

```typescript
// 类型定义放在 types.ts 或模块顶部
export interface FeatureIndex {
  id: string;
  name: string;
  status: FeatureStatus;
  dependencies: Dependencies;
}

// 使用 type 定义联合类型
export type FeatureStatus =
  | 'proposed'
  | 'analyzing'
  | 'implementing'
  | 'done';

// 避免 any，使用 unknown 或具体类型
function parse(input: unknown): Result<ParsedData> { ... }
```

### 2.2 错误处理

使用 Result 模式而非 throw：

```typescript
// ✅ 推荐：Result 模式
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function parseFeature(path: string): Result<Feature> {
  try {
    const content = readFile(path);
    const feature = parse(content);
    return { success: true, data: feature };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 使用
const result = parseFeature(path);
if (!result.success) {
  console.error(result.error);
  return;
}
const feature = result.data;
```

### 2.3 函数风格

```typescript
// ✅ 优先使用 async/await
async function loadFeatures(): Promise<Feature[]> {
  const files = await glob('docs/requirements/**/*.md');
  const features = await Promise.all(files.map(parseFeature));
  return features.filter(f => f.success).map(f => f.data!);
}

// ✅ 小函数，单一职责
function extractFrontmatter(content: string): Frontmatter { ... }
function validateFeature(feature: Feature): ValidationResult { ... }

// ✅ 有意义的命名
function getExecutableTasks() { ... }  // 好
function getTasks() { ... }            // 不够明确
```

### 2.4 模块组织

```
src/<module>/
├── index.ts      # 公共 API 入口
├── types.ts      # 类型定义
├── core.ts       # 核心逻辑
├── utils.ts      # 辅助函数
└── __tests__/    # 测试文件
    └── index.test.ts
```

## 3. 文档规范 (Skill/Specification)

### 3.1 YAML Frontmatter

```yaml
---
name: skill-name
description: |
  简短描述第一行。
  详细描述第二行。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---
```

### 3.2 Markdown 结构

```markdown
# Title

> 一句话摘要

## 核心原则
- 原则 1
- 原则 2

## 执行工作流

### Step 1: 步骤名称
说明...

### Step 2: 步骤名称
说明...

## 参考资料
- [链接](path)
```

## 4. 变更原则

### 4.1 Minimal Change

```typescript
// ❌ 不要顺手重构无关代码
function existingFunction() {
  // 原有逻辑不变
  // 只添加必要的新逻辑
}

// ✅ 只修改必要部分
function existingFunction() {
  // 保持原有逻辑
  newFeatureLogic(); // 新增
}
```

### 4.2 Design Driven

```typescript
// ❌ 不要自作主张添加功能
function parseFeature() {
  // 设计文档没提到的功能
  this.autoFix(); // 不要
}

// ✅ 严格按设计实现
function parseFeature() {
  // 只实现设计文档定义的功能
}
```

### 4.3 Track Everything

每次修改都应该能回答：
- 改了哪个文件？
- 为什么改？
- 改了什么？

## 5. 验证清单

实现完成后检查：

```
- [ ] TypeScript 编译通过 (tsc --noEmit)
- [ ] Lint 检查通过 (npm run lint)
- [ ] 测试通过 (npm test)
- [ ] 类型定义完整
- [ ] 错误处理完善
- [ ] 无 console.log 调试代码
- [ ] 无硬编码路径
```

## 6. 常见模式

### 6.1 配置读取

```typescript
import { join } from 'path';

const CONFIG_PATH = '.solodevflow/config.json';

function getConfigPath(basePath: string): string {
  return join(basePath, CONFIG_PATH);
}
```

### 6.2 文件操作

```typescript
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

async function ensureWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
}
```

### 6.3 CLI 输出

```typescript
function log(message: string): void {
  console.log(message);
}

function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

function logError(message: string): void {
  console.error(`❌ ${message}`);
}
```
