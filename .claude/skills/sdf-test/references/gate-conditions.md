# Gate Conditions Reference

> 阶段转换门控条件参考。

## 1. C→T Gate (进入测试阶段)

### 条件列表

| ID | Condition | Check Method | Pass Criteria |
|----|-----------|--------------|---------------|
| C2T-1 | code-complete | Glob 检查相关文件 | 预期文件存在 |
| C2T-2 | ac-defined | Read Feature 文档 | AC 部分非空 |
| C2T-3 | design-followed | Read 设计文档比对 | 实现与设计一致 |

### 检查流程

```bash
# C2T-1: 代码完成检查
Glob src/**/<feature-related>.*
Glob .claude/skills/<feature-name>/**/*

# C2T-2: AC 定义检查
Read docs/requirements/<domain>/feat-<name>.md
# 检查 Section 4. Acceptance Criteria 非空

# C2T-3: 遵循设计检查
Read docs/design/<domain>/des-<name>.md
# 比对实现与设计的一致性
```

### 输出格式

```
=== C→T Gate Check: feat-xxx ===

Conditions:
  [PASS] 代码实现完成 (src/xxx/ 已创建)
  [PASS] AC 已定义 (5 条验收标准)
  [PASS] 遵循设计 (实现与设计一致)

Result: CAN PROCEED to Testing phase
```

### 失败处理

| 失败条件 | 行动 |
|----------|------|
| code-complete FAIL | 返回 C 阶段完成实现 |
| ac-defined FAIL | 返回 R 阶段补充 AC |
| design-followed FAIL | 检查偏差，必要时返回 D 阶段 |

## 2. T→Done Gate (完成验收)

### 条件列表

| ID | Condition | Check Method | Pass Criteria |
|----|-----------|--------------|---------------|
| T2D-1 | all-ac-pass | 统计验证结果 | 100% AC 通过 |
| T2D-2 | no-blockers | 检查严重问题 | 无阻塞项 |
| T2D-3 | user-approved | 询问用户 | 用户确认 |

### 检查流程

```bash
# T2D-1: AC 通过率
# 统计 Step 3 的验证结果
# passed / total = 100%

# T2D-2: 阻塞问题检查
# 检查是否有 FAIL 且严重的 AC

# T2D-3: 用户确认
# 展示结果，询问 APPROVE/REJECT
```

### 输出格式

```
=== T→Done Gate Check: feat-xxx ===

Conditions:
  [PASS] 所有 AC 通过 (5/5, 100%)
  [PASS] 无阻塞问题
  [WAIT] 等待用户确认

Result: READY for completion (pending user approval)
```

### 决策矩阵

| AC 通过率 | 阻塞问题 | 用户决定 | 结果 |
|-----------|----------|----------|------|
| 100% | 无 | APPROVE | → done |
| 100% | 无 | REJECT | → 返回 C |
| <100% | - | - | → 必须返回 C |
| - | 有 | - | → 必须解决 |

## 3. 完整门控流程

```
C 阶段完成
    │
    ▼
┌─────────────────┐
│ C→T Gate Check  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 通过？  │
    └────┬────┘
     Yes │  No → 返回 C/D/R
         ▼
┌─────────────────┐
│ T 阶段验证      │
│ (Step 1-3)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ T→Done Gate     │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 通过？  │
    └────┬────┘
     Yes │  No → 返回 C
         ▼
┌─────────────────┐
│ 用户确认        │
└────────┬────────┘
         │
    ┌────┴────┐
    │APPROVE? │
    └────┬────┘
     Yes │  No → 返回 C
         ▼
┌─────────────────┐
│ status: done    │
└─────────────────┘
```

## 4. 门控检查最佳实践

1. **自动化检查**: 尽量用工具自动检查
2. **明确标准**: 每个条件有清晰的通过标准
3. **快速失败**: 发现问题立即停止
4. **记录原因**: 失败时记录具体原因
5. **人工兜底**: 最终决策需人工确认
