---
type: workflow-specification
status: active
version: 1.4.0
last_updated: 2026-01-14
---

# SoloDevFlow Workflow Specification

> R-D-C-T 工作流完整规范。AI 应首先读取 Section 0 快速定位。

## 0. Quick Decision (AI 优先读取)

> **IMPORTANT**: 首先读取本节快速路由，仅在需要详细信息时再读取后续章节。

### 用户意图 → Skill 路由

| 用户说 | 触发 Skill | 模式 |
|--------|------------|------|
| "添加/实现/新功能/需求" | `sdf-analyze` | Plan → Execute |
| "设计/技术方案" | `sdf-design` | Plan (extended thinking) |
| "编码/写代码" | `sdf-code` | Execute |
| "测试/验收" | `sdf-test` | Execute |
| "推进/下一阶段" | 门控检查 | See Section 5 |
| "修改规范" | Document First | See references/ |

### 当前状态 → 下一步

| Status | Phase | Next Action |
|--------|-------|-------------|
| `requirements` | R | 完成依赖分析 → 门控 → `design` |
| `design` | D | 完成设计 → 门控 → `coding` |
| `coding` | C | 完成实现 → 门控 → `testing` |
| `testing` | T | AC 100% 通过 → `done` |

### 门控速查

| 门控 | 核心条件 | 命令 |
|------|----------|------|
| R→D | 依赖已分析 + 无待分析 Task | `node dist/index.js next <id>` |
| D→C | 设计文档存在 + 用户批准 | 同上 |
| C→T | 代码完成 + 符合设计 | 同上 |
| T→Done | AC 100% + 用户确认 | 同上 |

---

## 1. Plan Mode vs Execute Mode

> **官方最佳实践**: "Use Plan mode to preview a step-by-step implementation strategy, separating 'thinking' from 'doing'"

### 1.1 模式定义

| 模式 | 用途 | 特点 |
|------|------|------|
| **Plan Mode** | 规划与思考 | 深度分析，不执行变更 |
| **Execute Mode** | 执行与实现 | 按计划执行，快速迭代 |

### 1.2 阶段模式映射

| Phase | 默认模式 | 何时切换 |
|-------|----------|----------|
| R | Plan | 需求明确后 → Execute (创建文档) |
| D | **Plan** (extended thinking) | 设计确认后 → Execute (写设计文档) |
| C | Execute | 复杂实现前 → Plan (生成实现计划) |
| T | Execute | - |

### 1.3 Plan Mode 工作流

```
1. 用户描述需求/任务
    ↓
2. AI 进入 Plan Mode
   - 使用 extended thinking 深度分析
   - 生成步骤计划
   - 不执行任何变更
    ↓
3. 用户确认计划
    ↓
4. AI 进入 Execute Mode
   - 按计划执行
   - 可开启 auto-accept 加速
```

### 1.4 Extended Thinking 使用指南

| 场景 | 是否使用 | 原因 |
|------|----------|------|
| 复杂依赖分析 | ✅ 是 | 多步推理 |
| 架构设计 | ✅ 是 | 权衡取舍 |
| 简单 Bug 修复 | ❌ 否 | 过度开销 |
| 文档更新 | ❌ 否 | 直接执行 |

---

## 2. Context Management

> **官方最佳实践**: "Agents need a way to bridge the gap between coding sessions"

### 2.1 /clear 策略

| 场景 | 建议 |
|------|------|
| 完成一个完整 Feature | `/clear` 清理上下文 |
| 切换到不同任务 | `/clear` 避免干扰 |
| 上下文过长 (>50k tokens) | `/clear` 防止溢出 |
| 遇到奇怪的行为 | `/clear` 重置状态 |

### 2.2 跨会话持久化

| 持久化位置 | 内容 |
|------------|------|
| Feature 文档 | 需求、AC、依赖分析 |
| 设计文档 | 技术方案、架构决策 |
| Task Manager | 待办任务、进度 |
| Git 提交 | 代码变更记录 |

### 2.3 会话恢复

新会话开始时：
```bash
# 1. 查看当前状态
node dist/index.js status

# 2. 查看待办任务
node dist/index.js task list --status=pending

# 3. 读取相关文档继续工作
```

---

## 3. Safety Controls

> **官方最佳实践**: "Start from deny-all; allowlist only the commands needed"

### 3.1 敏感操作确认

| 操作类型 | 确认要求 |
|----------|----------|
| `git push` | 必须用户确认 |
| 删除文件 | 必须用户确认 |
| 修改 CLAUDE.md | 必须用户确认 |
| 阶段推进 (门控) | 必须用户确认 |

### 3.2 Skill 工具限制

| Skill | allowed-tools |
|-------|---------------|
| sdf-analyze | Read, Write, Edit, Grep, Glob |
| sdf-design | +Bash |
| sdf-code | +Bash |
| sdf-test | +Bash |

### 3.3 安全检查清单

- [ ] 不执行未经确认的破坏性操作
- [ ] 不修改 `.git/` 目录
- [ ] 不泄露敏感信息到日志
- [ ] 敏感操作前询问用户

---

## 4. Adaptive Workflows

不同任务类型选择不同路径：

| 任务类型 | 路径 | 说明 |
|----------|------|------|
| **新功能** | R → D → C → T | 完整流程 |
| **Bug 修复 (小)** | R → C → T | 跳过 D |
| **Bug 修复 (大)** | R → D → C → T | 需要设计 |
| **文档修改** | R → T | 无需编码 |
| **配置调整** | 直接执行 | 无需 Feature |
| **规范变更** | Document First | See references/ |

**判断标准**:
- 影响范围 > 3 个文件 → 完整流程
- 需要新增模块/接口 → 需要 D 阶段
- 仅修改现有逻辑 → 可跳过 D 阶段

---

## 5. State Machine (Simplified)

> **v1.4.0 简化**: 从 7 个状态精简为 5 个，每阶段一个状态。

### 5.1 Status Definitions

| Status | Phase | Meaning |
|--------|-------|---------|
| `requirements` | R | 需求分析中 (含依赖分析) |
| `design` | D | 技术设计中 |
| `coding` | C | 编码实现中 |
| `testing` | T | 测试验收中 |
| `done` | - | 已完成 |

### 5.2 Valid Transitions

```
requirements → design → coding → testing → done
     ↑______________|  (可跳过 D 阶段)
```

### 5.3 状态迁移表

| 旧状态 (v1.3) | 新状态 (v1.4) |
|--------------|--------------|
| proposed, analyzing, ready-for-design | `requirements` |
| designing | `design` |
| implementing | `coding` |
| testing | `testing` |
| done | `done` |

---

## 6. Gate Conditions (概要)

> 详细说明见 [references/gate-conditions-detail.md](references/gate-conditions-detail.md)

### R→D Gate

| Condition | Pass Criteria |
|-----------|---------------|
| feature-exists | Feature 文档存在 |
| deps-analyzed | `analyzed: true` |
| pending-clear | 无待分析 Task |
| user-confirmed | 用户确认 |

### D→C Gate

| Condition | Pass Criteria |
|-----------|---------------|
| design-exists | 设计文档存在 (code 类型) |
| design-approved | 用户确认设计 |

### C→T Gate

| Condition | Pass Criteria |
|-----------|---------------|
| code-complete | 代码文件存在 |
| design-followed | 符合设计 |

### T→Done Gate

| Condition | Pass Criteria |
|-----------|---------------|
| all-ac-pass | 100% AC 通过 |
| user-approved | 用户确认 |

---

## 7. Phase Specifications

### 7.1 Phase R: Requirements

| Item | Content |
|------|---------|
| **Skill** | `.claude/skills/sdf-analyze/` |
| **Output** | `docs/requirements/<domain>/feat-<name>.md` |
| **Mode** | Plan → Execute |

### 7.2 Phase D: Design

| Item | Content |
|------|---------|
| **Skill** | `.claude/skills/sdf-design/` |
| **Output** | `docs/design/<domain>/des-<name>.md` |
| **Mode** | Plan (extended thinking) |

### 7.3 Phase C: Coding

| Item | Content |
|------|---------|
| **Skill** | `.claude/skills/sdf-code/` |
| **Output** | `src/` 代码变更 |
| **Mode** | Execute (Plan for complex) |

### 7.4 Phase T: Testing

| Item | Content |
|------|---------|
| **Skill** | `.claude/skills/sdf-test/` |
| **Output** | `docs/test-reports/<domain>/test-<name>.md` |
| **Mode** | Execute |

---

## 8. Feature Kind & Design

| Kind | 产出 | 需要独立设计文档? |
|------|------|------------------|
| `code` | `src/` 代码 | **是** |
| `specification` | SKILL.md | **否** (设计内嵌) |

**规范类 Feature**: 需求文档的 Specification 部分即设计，无需 des-xxx.md。

---

## 9. Task Management

> 详细说明见 `.claude/skills/sdf-analyze/references/task-manager-guide.md`

| 操作 | 命令 |
|------|------|
| 查看待分析 | `node dist/index.js task list --type=analyze_requirement` |
| 添加任务 | `node dist/index.js task add --type=analyze_requirement --title="xxx"` |
| 完成任务 | `node dist/index.js task done <task-id>` |
| 统计 | `node dist/index.js task stats` |

---

## 10. Specification Change

> 详细流程见 [references/spec-change-process.md](references/spec-change-process.md)

**核心原则**: Document First

```
❌ 错误：先执行变更 → 后更新文档
✅ 正确：先修改文档 → 后执行变更
```

---

## 11. Quick Reference

### Key Files

| Type | Pattern |
|------|---------|
| Requirements | `docs/requirements/<domain>/feat-<name>.md` |
| Design | `docs/design/<domain>/des-<name>.md` |
| Test Report | `docs/test-reports/<domain>/test-<name>.md` |
| Tasks | `.solodevflow/tasks.json` |

### Skills

| Phase | Location |
|-------|----------|
| R | `.claude/skills/sdf-analyze/` |
| D | `.claude/skills/sdf-design/` |
| C | `.claude/skills/sdf-code/` |
| T | `.claude/skills/sdf-test/` |

---

*Workflow Specification v1.4.0*
*Last Updated: 2026-01-14*

**v1.4.0 Changes**:
- Added Section 1: Plan Mode vs Execute Mode (官方最佳实践)
- Added Section 2: Context Management (/clear 策略、跨会话持久化)
- Added Section 3: Safety Controls (敏感操作确认、工具限制)
- Moved Gate Conditions detail to references/gate-conditions-detail.md
- Moved Specification Change to references/spec-change-process.md
- Reduced from 704 lines to ~350 lines (Progressive Disclosure)
- Removed redundant Skill Reference (Skills are self-documenting)
