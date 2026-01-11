# Change Log Template

> C 阶段变更记录模板（可选使用）

```markdown
---
id: changelog-<name>
type: change-log
feature: feat-<name>
domain: <DomainId>
date: YYYY-MM-DD
status: in-progress | completed
---

# <Feature> - Change Log

## 1. Implementation Summary

| Item | Value |
|------|-------|
| Feature | feat-<name> |
| Design Doc | docs/design/<domain>/des-<name>.md |
| Start Time | YYYY-MM-DD HH:MM |
| End Time | YYYY-MM-DD HH:MM |
| Status | in-progress / completed |

## 2. Implementation Plan

### Modules

| # | Module | Status | Files |
|---|--------|--------|-------|
| 1 | Types/Interfaces | Done | src/xxx/types.ts |
| 2 | Core Logic | Done | src/xxx/index.ts |
| 3 | Integration | In Progress | src/xxx/... |
| 4 | Tests | Pending | src/xxx/__tests__/... |

## 3. Files Changed

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| src/xxx/types.ts | Created | +45 | 类型定义 |
| src/xxx/index.ts | Created | +120 | 主模块入口 |
| src/xxx/utils.ts | Modified | +30, -5 | 添加辅助函数 |

## 4. Implementation Notes

### 4.1 Design Deviations (If Any)

- None

或:

- **偏差**: 未使用设计中的 X 方案
- **原因**: 发现 Y 问题
- **实际方案**: 改用 Z

### 4.2 Technical Decisions

- 使用 async/await 而非 callback
- 错误处理采用 Result 模式

### 4.3 Known Issues

- None

或:

- Issue #1: 描述...

## 5. Verification Results

| Check | Result | Notes |
|-------|--------|-------|
| TypeScript | PASS | tsc --noEmit |
| Lint | PASS | npm run lint |
| Tests | PASS | 5/5 tests |

## 6. Ready for Testing

- [x] 所有设计模块已实现
- [x] 代码符合编码规范
- [x] 验证检查通过
- [x] 变更记录已完成
```

## 使用说明

1. **何时使用**: 复杂功能实现时可选使用此模板
2. **存储位置**: 可保存到 `docs/changelogs/<domain>/` 或直接记录在会话中
3. **简化方式**: 对于简单功能，可直接在 C 阶段完成汇报中列出变更文件

## 简化版 (推荐)

对于大多数功能，直接在 C 阶段完成汇报中记录即可：

```
=== C 阶段完成 ===

Feature: feat-xxx

变更文件:
- src/xxx/types.ts (新建, +45)
- src/xxx/index.ts (新建, +120)
- src/xxx/utils.ts (修改, +30, -5)

验证: TypeScript ✅ | Lint ✅ | Tests ✅
```
