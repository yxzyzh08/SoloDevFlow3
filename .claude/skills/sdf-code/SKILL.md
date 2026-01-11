---
name: sdf-code
description: |
  SoloDevFlow C 阶段：编码实现。
  根据设计文档实现代码，追踪变更并准备测试验收。
  当用户通过 /next 进入 C 阶段，或说"编码"、"实现"、
  "开始写代码"、"进入开发"等意图时触发。
  输出 src/ 代码变更 + 变更记录。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# SDF Code Implementer

> R-D-C-T 工作流的第三阶段：根据设计文档实现代码，追踪变更。

## 核心原则

- **Design First**: 严格按设计文档实现，不擅自添加功能
- **Minimal Change**: 只修改必要的文件，避免无关变更
- **Track Everything**: 所有变更记录追踪
- **Incremental & Verify**: 增量实现，每步验证
- **AI-First Format**: 生成文档遵循 `doc-standards.md` 规范

## 执行工作流

复制此清单跟踪进度：

```
Coding Progress:
- [ ] Step 1: D→C 门控检查
- [ ] Step 2: 加载上下文
- [ ] Step 3: 生成实现计划
- [ ] Step 4: 增量实现 (Loop)
- [ ] Step 5: 验证并准备测试
```

### Step 1: D→C 门控检查

**检查条件**：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| design-exists | Glob | `docs/design/<domain>/des-<name>.md` 存在 |
| design-approved | 用户确认 | 用户同意设计方案 |
| architecture-aligned | 检查设计文档 | Checklist 已完成 |

```bash
# 检查设计文档
Glob docs/design/<domain>/des-<name>.md
```

**门控输出**：
```
=== D→C Gate Check: <feature-id> ===

Conditions:
  [PASS/FAIL] 设计文档已创建
  [PASS/FAIL] 设计已获批准
  [PASS/FAIL] 架构对齐检查完成

Result: CAN PROCEED / CANNOT PROCEED
```

**如未通过**：提示返回 D 阶段完成设计。

### Step 2: 加载上下文

```bash
# 读取设计文档 (核心输入)
Read docs/design/<domain>/des-<name>.md

# 读取需求文档 (获取 AC)
Read docs/requirements/<domain>/feat-<name>.md

# 读取架构文档 (获取编码规范)
Read docs/architecture/ARCHITECTURE.md
```

**提取关键信息**：
- 设计文档：模块列表、接口定义、测试策略
- 需求文档：Acceptance Criteria (AC)
- 架构文档：编码规范、类型约定

### Step 3: 生成实现计划

**使用 `think hard` 进行规划**

从设计文档提取模块，确定实现顺序：

```markdown
## Implementation Plan

### 实现顺序 (依赖优先)

1. **Types/Interfaces** (类型定义优先)
   - 文件: src/<module>/types.ts
   - 关键点: ...

2. **Core Logic** (核心逻辑)
   - 文件: src/<module>/index.ts
   - 关键点: ...

3. **Integration** (集成代码)
   - 文件: src/<module>/...
   - 关键点: ...

4. **Tests** (如设计要求)
   - 文件: src/<module>/__tests__/...
   - 关键点: ...

### 预计变更文件
- [ ] src/xxx/types.ts (新建)
- [ ] src/xxx/index.ts (新建)
- [ ] src/xxx/utils.ts (修改)
```

**询问用户确认计划后再开始实现**。

### Step 4: 增量实现 (Loop) ⭐

**循环执行以下步骤**：

```
For each module in implementation_plan:
┌─────────────────────────────────────────┐
│ 4.1 实现当前模块                         │
│ 4.2 运行验证 (lint/type check/test)     │
│ 4.3 汇报进度                            │
│ 4.4 如验证失败，修复后重复               │
└─────────────────────────────────────────┘
```

#### 4.1 实现模块

**遵循原则**：
- 严格按设计文档的接口定义
- 遵循架构文档的编码规范
- TypeScript 类型优先
- 错误处理遵循 `{ success, data?, error? }` 模式

```bash
# 创建/编辑文件
Write src/<module>/types.ts
Edit src/<module>/index.ts
```

#### 4.2 运行验证

```bash
# TypeScript 类型检查 (如适用)
npx tsc --noEmit

# Lint 检查 (如配置)
npm run lint

# 运行相关测试 (如存在)
npm test -- --grep "<module>"
```

#### 4.3 汇报进度

每完成一个模块，输出：

```
Module Progress: [2/4] Core Logic ✅

已完成:
- [x] Types/Interfaces
- [x] Core Logic

进行中:
- [ ] Integration
- [ ] Tests

变更文件:
- src/xxx/types.ts (新建, 45 行)
- src/xxx/index.ts (新建, 120 行)
```

#### 4.4 错误处理

如验证失败：
1. 分析错误原因
2. 修复问题
3. 重新验证
4. 如需设计变更，暂停并讨论

### Step 5: 验证并准备测试

**完成所有模块后执行**：

```bash
# 完整类型检查
npx tsc --noEmit

# 完整 Lint
npm run lint

# 运行所有测试
npm test
```

**C→T 门控检查**：

| Condition | Check | Result |
|-----------|-------|--------|
| code-complete | 所有模块已实现 | ✅/❌ |
| type-check-pass | tsc --noEmit 通过 | ✅/❌ |
| lint-pass | npm run lint 通过 | ✅/❌ |
| tests-pass | npm test 通过 (如有) | ✅/❌ |

**更新 Feature 状态**：

```bash
Edit docs/requirements/<domain>/feat-<name>.md
# status: implementing → testing
```

**汇报模板**：

```
=== C 阶段完成 ===

Feature: <feature-id>
Domain: <domain>

实现统计:
- 模块数: X
- 新建文件: Y
- 修改文件: Z
- 代码行数: ~N 行

验证结果:
- TypeScript: PASS
- Lint: PASS
- Tests: PASS (X/X)

变更文件清单:
1. src/xxx/types.ts (新建)
2. src/xxx/index.ts (新建)
3. ...

C→T Gate Check: PASS

下一步:
- [ ] 进入 T 阶段验收
- [ ] 使用 sdf-test Skill 验证 AC
```

## 规范类 Feature 的 C 阶段

对于 `feature_kind: specification` 的 Feature（如 Skill 定义）：

**产出**：
- `.claude/skills/<name>/SKILL.md`
- `.claude/skills/<name>/templates/`
- `.claude/skills/<name>/references/`

**验证方式**：
- 文件存在性检查
- 格式规范检查
- 无需 TypeScript/Lint

## 参考资料

- **文档编写规范**: `.claude/steering/doc-standards.md` (生成文档前必读)
- **编码规范**: [references/coding-guidelines.md](references/coding-guidelines.md)
- **变更记录模板**: [templates/change-log.md](templates/change-log.md)
