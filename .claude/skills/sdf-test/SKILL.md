---
name: sdf-test
version: 1.1.0
description: |
  SoloDevFlow T 阶段：测试验收。
  验证实现满足需求，确认 AC 通过并更新状态。
  输出 docs/test-reports/<domain>/test-<name>.md 验证报告。
triggers:
  - "测试"
  - "验收"
  - "检查"
  - "验证"
  - "检查 AC"
  - "/next"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# SDF Test Verifier

> R-D-C-T 工作流的最后阶段：验证实现满足需求，确认 AC 通过。

## 使用示例

| 用户输入 | Skill 响应 |
|----------|-----------|
| "验收 feat-xxx" | 完整 T 阶段流程，生成验证报告 |
| "检查 AC" | 快速查询 AC 完成情况 |
| "测试通过了吗" | 运行测试并汇报结果 |

## 核心理念

**T 阶段只做"验证确认"，不做"测试发现"**

- **Verification**: 确认已实现的功能符合 AC
- **NOT Discovery**: 不是发现新 Bug 的阶段
- **Lightweight**: 精简流程，轻量化报告
- **AC-Centric**: 以验收标准为核心判断依据
- **AI-First Format**: 生成报告遵循 `doc-standards.md` 规范

## 执行工作流 (4 步精简)

复制此清单跟踪进度：

```
Test Verification Progress:
- [ ] Step 1: Gate Check + Load Context
- [ ] Step 2: Run Automated Tests (If Applicable)
- [ ] Step 3: Verify AC + Update Feature Doc
- [ ] Step 4: Decision + Output
```

### Step 1: Gate Check + Load Context

#### C→T 门控检查

```bash
# 检查代码实现
Glob src/**/*.ts
Glob .claude/skills/<name>/**/*

# 检查 AC 定义
Read docs/requirements/<domain>/feat-<name>.md
```

**门控条件**：

| Condition | Check Method | Pass Criteria |
|-----------|--------------|---------------|
| code-complete | Glob 检查相关文件 | 文件存在 |
| ac-defined | Read Feature 文档 | AC 部分非空 |
| design-followed | Read 设计文档 | 实现与设计一致 |

**输出示例**：
```
=== C→T Gate Check: feat-xxx ===

Conditions:
  [PASS] 代码实现完成 (src/xxx/ 已创建)
  [PASS] AC 已定义 (5 条验收标准)
  [PASS] 遵循设计 (实现与设计一致)

Result: CAN PROCEED to Testing phase
```

#### 加载上下文

```bash
# 读取需求文档，提取 AC 列表
Read docs/requirements/<domain>/feat-<name>.md

# 读取设计文档，了解实现位置
Read docs/design/<domain>/des-<name>.md
```

### Step 2: Run Automated Tests (If Applicable)

```bash
# 检查是否有测试脚本
Read package.json  # 查看 scripts.test
```

**如有自动化测试**：
```bash
Bash: npm test
# 或
Bash: pytest
# 或
Bash: make test
```

**记录输出**：
- 测试通过数
- 覆盖率 (如有)
- 失败信息 (如有)

**如无自动化测试**：
- 记录 "No automated tests configured"
- 继续 Step 3

### Step 3: Verify AC + Update Feature Doc ⭐

**使用 `think hard` 仔细验证每条 AC**

#### AC 验证决策树

```
Q1: AC 是否有对应的自动化测试?
├── Yes → Automated (检查测试是否通过)
└── No → Q2

Q2: AC 是否涉及代码实现?
├── Yes → Code Review (Glob + Read 确认代码存在)
└── No → Q3

Q3: AC 是否涉及文件/文档存在性?
├── Yes → Documentation (Glob 确认文件存在)
└── No → Manual (执行命令验证输出)
```

#### 验证方法详解

| Method | How to Verify | Example |
|--------|---------------|---------|
| **Automated** | 检查 npm test 输出 | "5/5 tests passed" |
| **Code Review** | `Glob` + `Read` 确认代码 | "SKILL.md 已创建" |
| **Documentation** | `Glob` 确认文件存在 | "design.md 存在" |
| **Manual** | `Bash` 执行并检查输出 | "CLI 输出正确" |

#### 逐条验证

对每个 AC：

```markdown
### AC-X: [Title]

**验证方法**: [Automated/Code Review/Documentation/Manual]

**验证步骤**:
1. [具体操作]
2. [检查结果]

**结果**: PASS / FAIL

**如 FAIL，原因**: [具体原因]
```

#### 更新 Feature 文档

验证完成后，直接更新 Feature 文档中的 AC 复选框：

```bash
Edit docs/requirements/<domain>/feat-<name>.md
# 将 - [ ] 改为 - [x]
```

### Step 4: Decision + Output

#### T→Done 门控检查

| Condition | Check | Pass Criteria |
|-----------|-------|---------------|
| all-ac-pass | 统计 AC 结果 | 100% 通过 |
| no-blockers | 检查严重问题 | 无阻塞项 |
| user-approved | 询问确认 | 用户同意 |

**输出示例**：
```
=== T→Done Gate Check: feat-xxx ===

Conditions:
  [PASS] 所有 AC 通过 (5/5, 100%)
  [PASS] 无阻塞问题
  [WAIT] 等待用户确认

Result: READY for completion (pending user approval)
```

#### 用户确认

```
AC 验证结果：5/5 通过

是否确认完成？
- APPROVE → 更新 status: done
- REJECT → 返回 C 阶段修复
```

#### 写入验证报告

```bash
Write docs/test-reports/<domain>/test-<name>.md
```

使用模板：[templates/test-report.md](templates/test-report.md)

#### 如 APPROVE，更新状态

```bash
Edit docs/requirements/<domain>/feat-<name>.md
# status: implementing → done
```

## 汇报模板

```
已完成测试验收：
- 报告: docs/test-reports/<domain>/test-<name>.md
- Feature: feat-<name>

AC 验证结果：
- 总计: X 条
- 通过: Y 条 (Z%)
- 方法分布: Automated(A), Code Review(B), Documentation(C), Manual(D)

自动化测试：
- [运行结果 / 未配置]

决策：
- [x] APPROVE → status 已更新为 done
- [ ] REJECT → 需返回 C 阶段修复
```

## AC 快速查询模式 (原 /ac 功能)

当用户只想查看 AC 完成情况而不执行完整 T 阶段流程时，使用快速查询模式。

**触发词**: "检查 AC"、"AC 状态"、"验收标准完成情况"

### 快速查询流程

```bash
# 1. 定位 Feature 文档
Glob docs/requirements/**/feat-<name>.md

# 2. 读取并解析 AC 部分
Read <feature-file>

# 3. 统计 [ ] 和 [x] 数量
```

### 快速查询输出格式

```
=== 验收标准检查 ===

Feature: <feature-id>
Domain: <domain>
Status: <current-status>

验收标准进度: 3/5 完成

### AC-1: <标准名称>
- [x] 条件 1 (已完成)
- [ ] 条件 2 (未完成)

### AC-2: <标准名称>
- [x] 条件 1 (已完成)

---
建议: [下一步行动]
```

### 快速查询 vs 完整验证

| 场景 | 使用模式 |
|------|----------|
| "feat-xxx 的 AC 完成了多少？" | 快速查询 |
| "检查下验收标准" | 快速查询 |
| "验收 feat-xxx" | 完整 T 阶段 |
| "测试通过后进入下一阶段" | 完整 T 阶段 |

## 参考资料

- **文档编写规范**: `.claude/steering/doc-standards.md` (生成报告前必读)
- **验证报告模板**: [templates/test-report.md](templates/test-report.md)
- **AC 验证指南**: [references/ac-verification.md](references/ac-verification.md)
- **门控条件参考**: [references/gate-conditions.md](references/gate-conditions.md)
