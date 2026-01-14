# Gate Conditions 详细参考

> 本文档包含门控条件的详细实现说明。快速参考请见 `workflow.md` Section 5。

## 1. R→D Gate 详细说明

进入 Design 阶段必须满足：

| Condition | Check Method | Pass Criteria | 说明 |
|-----------|--------------|---------------|------|
| feature-exists | Glob 检查文件 | `docs/requirements/<domain>/feat-<name>.md` 存在 | Feature 文档必须先创建 |
| frontmatter-complete | Read + 解析 | id, type, status, priority, dependencies 完整 | 元数据需完整 |
| ac-defined | Read Feature 文档 | AC 部分非空 (至少 1 条) | 无 AC 无法验收 |
| deps-analyzed | 检查 `analyzed` 字段 | `analyzed: true` | 依赖分析需完成 |
| pending-requirements-clear | queryTasks({ type: 'analyze_requirement', status: 'pending' }) | 无相关待分析需求 | 确保依赖链完整 |
| user-confirmed | 询问用户 | 用户确认进入 D 阶段 | 人工确认 |

### 检查命令

```bash
cd src && node dist/index.js next <feature-id>
```

### 常见失败原因

| 失败条件 | 解决方法 |
|----------|----------|
| pending-requirements-clear 失败 | 先处理 Task Manager 中的待分析任务 |
| deps-analyzed 失败 | 执行 sdf-analyze 完成依赖分析 |
| ac-defined 失败 | 在 Feature 文档中添加 AC |

## 2. D→C Gate 详细说明

进入 Coding 阶段必须满足：

| Condition | Check Method | Pass Criteria | 说明 |
|-----------|--------------|---------------|------|
| design-exists | Glob 检查文件 | `docs/design/<domain>/des-<name>.md` 存在 | 代码类 Feature 需设计文档 |
| design-approved | 用户确认 | 用户明确同意设计方案 | 设计需 Review |
| architecture-aligned | 检查设计文档 | Checklist 已完成 | 与架构一致 |
| adr-created | 检查 ADR | 如需要，ADR 已创建 | 重大决策需记录 |

### 规范类 Feature 特殊处理

对于 `feature_kind: specification` 的 Feature：
- **不需要** 独立设计文档
- 设计内嵌在需求文档的 Specification 部分
- design-exists 条件自动跳过

## 3. C→T Gate 详细说明

进入 Testing 阶段必须满足：

| Condition | Check Method | Pass Criteria | 说明 |
|-----------|--------------|---------------|------|
| code-complete | Glob 检查相关文件 | 预期文件存在 | 代码实现完成 |
| ac-defined | Read Feature 文档 | AC 部分非空 | 用于验证 |
| design-followed | Read 设计文档比对 | 实现与设计一致 | 遵循设计 |

### 验证方法

```bash
# 检查代码文件
Glob src/**/*.ts

# 检查规范文件
Glob .claude/skills/<name>/**/*
```

## 4. T→Done Gate 详细说明

完成 Feature 必须满足：

| Condition | Check Method | Pass Criteria | 说明 |
|-----------|--------------|---------------|------|
| all-ac-pass | 统计验证结果 | 100% AC 通过 | 全部验收 |
| no-blockers | 检查严重问题 | 无阻塞项 | 无已知问题 |
| user-approved | 询问用户 | 用户确认 APPROVE | 人工确认 |

### AC 验证方法

| 方法 | 适用场景 | 工具 |
|------|----------|------|
| Automated | 有单元测试 | `npm test` |
| Code Review | 代码实现验证 | Glob + Read |
| Documentation | 文件存在性 | Glob |
| Manual | 运行时验证 | Bash |

## 5. 门控检查输出格式

### 成功示例

```
=== Phase Transition ===

Feature: feat-xxx
Current: analyzing
Target: designing

Gate Check (R → D):
  [PASS] 依赖分析完成 (analyzed: true)
  [PASS] 待分析任务已清空 (无 pending analyze_requirement)
  [PASS] 前置依赖就绪 (无前置依赖)
  [PASS] 无循环依赖

Result: CAN PROCEED
```

### 失败示例

```
=== Phase Transition ===

Feature: feat-xxx
Current: analyzing
Target: designing

Gate Check (R → D):
  [PASS] 依赖分析完成
  [FAIL] 待分析任务未清空 (2 pending)
  [PASS] 无循环依赖

Result: CANNOT PROCEED

Blockers:
  1. Task Manager 有 2 个待分析任务

Suggestions:
  - 继续处理 Task Manager 中的待分析任务
  - 或使用 --force 强制推进 (不推荐)
```

## 6. 依赖检查

### 循环依赖检测

使用 DFS + 着色算法检测循环：

```bash
cd src && node dist/index.js status --graph
```

### 依赖就绪检查

验证所有前置依赖状态：

```bash
cd src && node dist/index.js next <feature-id>
```

## 7. 强制推进

**不推荐**，但当用户明确要求时可用：

```
用户: "强制推进 feat-xxx"

⚠️ 警告: 门控检查未通过，强制推进可能导致问题。
确认强制推进？(需明确确认)
```

**风险**:
- 可能导致设计与需求不一致
- 可能遗漏依赖
- 增加后续返工风险
