# AC Verification Guide

> 验收标准验证方法指南。

## 1. 验证方法决策树

```
Q1: AC 是否有对应的自动化测试?
├── Yes → Automated
└── No → Q2

Q2: AC 是否涉及代码实现?
├── Yes → Code Review
└── No → Q3

Q3: AC 是否涉及文件/文档存在性?
├── Yes → Documentation
└── No → Manual
```

## 2. 验证方法详解

### 2.1 Automated (自动化测试)

**适用场景**:
- 有单元测试覆盖
- 有集成测试覆盖
- 有 E2E 测试覆盖

**验证步骤**:
```bash
# 运行测试
Bash: npm test
# 或
Bash: pytest
# 或
Bash: make test
```

**判断标准**:
- 相关测试用例全部通过 → PASS
- 有测试失败 → FAIL

**示例**:
```
AC: "indexFeatures() 返回正确的 Feature 列表"
Method: Automated
Verify: npm test -- --grep "indexFeatures"
Result: PASS (3/3 tests passed)
```

### 2.2 Code Review (代码审查)

**适用场景**:
- AC 涉及"已实现"、"已创建"、"支持"
- 检查代码/文件是否存在并符合要求

**验证步骤**:
```bash
# 检查文件存在
Glob src/**/<expected-file>.ts

# 读取并检查内容
Read src/<path>/<file>.ts
# 确认关键实现存在
```

**判断标准**:
- 文件存在且包含预期实现 → PASS
- 文件不存在或实现不符 → FAIL

**示例**:
```
AC: "SKILL.md 已创建"
Method: Code Review
Verify: Glob .claude/skills/sdf-design/SKILL.md
Result: PASS (文件存在)
```

### 2.3 Documentation (文档检查)

**适用场景**:
- AC 涉及文档存在性
- AC 涉及模板创建
- AC 涉及配置文件

**验证步骤**:
```bash
# 检查文件存在
Glob docs/**/<expected-file>.md

# 可选：检查内容结构
Read docs/<path>/<file>.md
```

**判断标准**:
- 文件存在 → PASS
- 文件不存在 → FAIL

**示例**:
```
AC: "设计文档模板已创建"
Method: Documentation
Verify: Glob .claude/skills/sdf-design/templates/design.md
Result: PASS (文件存在)
```

### 2.4 Manual (人工验证)

**适用场景**:
- 需要运行并观察输出
- 需要交互式验证
- 无法自动化的场景

**验证步骤**:
```bash
# 执行命令
Bash: <command>

# 检查输出是否符合预期
```

**判断标准**:
- 输出符合预期 → PASS
- 输出不符预期 → FAIL

**示例**:
```
AC: "CLI 正确显示 Feature 列表"
Method: Manual
Verify: Bash: node dist/index.js status
Expected: Feature 列表格式正确
Result: PASS (输出符合预期)
```

## 3. 常见 AC 类型与推荐方法

| AC 类型 | 关键词 | 推荐方法 |
|---------|--------|----------|
| 功能实现 | "能够"、"支持" | Automated > Code Review |
| 文件创建 | "已创建"、"存在" | Documentation |
| 代码结构 | "包含"、"实现" | Code Review |
| 输出验证 | "显示"、"输出" | Manual > Automated |
| 集成验证 | "集成"、"调用" | Automated > Manual |

## 4. 验证原则

1. **优先自动化**: Automated > Code Review > Documentation > Manual
2. **可重复性**: 验证步骤应可重复执行
3. **明确标准**: 每个 AC 有清晰的通过标准
4. **记录详情**: 失败时记录具体原因

## 5. FAIL 处理

当 AC 验证失败时：

1. **记录失败原因**: 具体说明哪里不符
2. **评估严重性**: 是阻塞还是可接受
3. **决定行动**:
   - 严重 → REJECT，返回 C 阶段
   - 轻微 → 记录为已知问题，可选择 APPROVE
