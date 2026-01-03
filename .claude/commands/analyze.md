---
allowed-tools: Read, Write, Edit, Grep, Glob
description: 显式进入需求分析模式 (R 阶段)
argument-hint: [需求描述]
---

# 需求分析入口

显式触发 SoloDevFlow R-D-C-T 工作流的 Requirements 阶段。

## 当前上下文

**工作目录**: !`pwd`
**已注册 Domain**: !`grep -A 20 "^domains:" docs/product_context.md 2>/dev/null || echo "未找到 product_context.md"`

## 任务

分析以下需求，创建或更新 `docs/requirements/` 下的文档：

**用户需求**: $ARGUMENTS

## 执行步骤

1. 读取 `docs/product_context.md` 理解全局上下文
2. 定位目标 Domain（如需新建 Domain，先更新 product_context.md）
3. 创建 Feature 文档（使用 `.claude/skills/sdf-analyze/templates/feature.md` 模板）
4. 更新 Domain 的 `index.md` 注册新 Feature
5. 汇报结果并询问是否进入 Design 阶段

## 输出要求

- Feature 文档必须包含完整 YAML Frontmatter
- 验收标准 (AC) 必须可验证
- status 初始值为 `proposed`
