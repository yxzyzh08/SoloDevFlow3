# Specification Change Process

> 当需要修改架构或规范（而非开发新 Feature）时，遵循此流程。

## 1. 适用场景

| 场景 | 示例 | 适用流程 |
|------|------|----------|
| 新增 Feature | "添加用户认证功能" | R-D-C-T |
| 修改架构/规范 | "合并 Commands 到 Skills" | **本流程** |
| 修复 Bug | "修复登录失败问题" | R-D-C-T (简化) |

**判断标准**：
- 如果主要产出是**新代码/新功能** → R-D-C-T
- 如果主要产出是**修改现有规范/架构** → Specification Change Process

## 2. 核心原则：Document First

```
❌ 错误：先执行变更 → 后更新文档
✅ 正确：先修改文档 → 后执行变更
```

**原因**：
1. Document is Truth - 文档是真理来源
2. 文档先行确保变更经过思考
3. 便于 Review 和回滚

## 3. 变更流程

```
Specification Change Process:

Step 1: 识别变更类型
    ↓
Step 2: 修改规范文档
    ↓
Step 3: 执行实际变更
    ↓
Step 4: 验证一致性
```

### Step 1: 识别变更类型

| 变更类型 | 需修改的文档 |
|----------|-------------|
| 工作流程变更 | `.claude/steering/workflow.md` |
| 架构变更 | `docs/architecture/ARCHITECTURE.md` |
| 原则变更 | `docs/architecture/principles.md` |
| 目录结构变更 | ADR + ARCHITECTURE.md |
| Skill 结构变更 | workflow.md + 相关 Skill 文档 |

### Step 2: 修改规范文档

**必须包含**：
1. 变更内容描述
2. 变更原因说明
3. 新的规范定义

**示例**：
```markdown
## 7. Skill Reference

所有工作流操作通过 Skills 触发，不再使用独立 Commands。
// ↑ 这就是规范变更，先写在文档里
```

### Step 3: 执行实际变更

规范文档修改完成后，再执行实际操作：
- 删除/创建文件
- 修改代码
- 更新配置

### Step 4: 验证一致性

```
检查清单：
- [ ] 实际状态与文档描述一致
- [ ] 无残留的旧结构
- [ ] 相关引用已更新
```

## 4. 与 ADR 的关系

| 变更规模 | 是否需要 ADR |
|----------|-------------|
| 小型调整 | 否，直接修改规范文档 |
| 重大架构变更 | 是，先创建 ADR，再修改规范 |

**重大变更标准**：
- 影响多个组件
- 引入新模式/废弃旧模式
- 不可逆的结构变更

## 5. 示例：Commands → Skills 合并

**正确流程**：

```
1. Step 1: 识别 → 工作流程变更 + Skill 结构变更

2. Step 2: 修改文档
   - workflow.md: 删除 Command Reference，添加 Skill Reference
   - workflow.md: 说明 "不再使用独立 Commands"
   - sdf-test/SKILL.md: 添加 AC 查询功能
   - sdf-analyze/SKILL.md: 添加 Task Manager 集成

3. Step 3: 执行变更
   - 删除 .claude/commands/ 目录

4. Step 4: 验证
   - 确认 commands 目录不存在
   - 确认 skills 包含所有功能
   - 确认 workflow.md 引用正确
```

## 6. 变更日志

变更完成后，在相关文档底部添加变更记录：

```markdown
**vX.Y.Z Changes**:
- 变更内容 1
- 变更内容 2
```
