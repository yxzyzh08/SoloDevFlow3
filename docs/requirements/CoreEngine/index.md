---
domain_id: CoreEngine
description: 负责 CLI 的配置管理、Skill 调度 (.claude 目录管理)
owner: Human
status: active
features:
  - id: feat-sdf-analyze
    name: SDF-Analyze Skill
    status: done
    priority: critical
    path: docs/requirements/CoreEngine/feat-sdf-analyze.md
  - id: feat-workflow-orchestration
    name: Workflow Orchestration
    status: done
    priority: critical
    path: docs/requirements/CoreEngine/feat-workflow-orchestration.md
  - id: feat-sdf-design
    name: SDF-Design Skill
    status: done
    priority: critical
    path: docs/requirements/CoreEngine/feat-sdf-design.md
  - id: feat-sdf-code
    name: SDF-Code Skill
    status: done
    priority: critical
    path: docs/requirements/CoreEngine/feat-sdf-code.md
  - id: feat-sdf-test
    name: SDF-Test Skill
    status: done
    priority: critical
    path: docs/requirements/CoreEngine/feat-sdf-test.md
  - id: feat-task-management
    name: Task Management
    status: done
    priority: high
    path: docs/requirements/CoreEngine/feat-task-management.md
---

# CoreEngine 领域视图

## 领域职责
管理 SoloDevFlow 的运行时环境，包括：
1. `.claude/skills` 的加载与执行。
2. `.claude/commands` 的解析。
3. 全局 Context 的维护。
4. **工作流状态机的编排与调度。**

## Feature List

| ID | Name | Status | Priority | Description |
|----|------|--------|----------|-------------|
| feat-sdf-analyze | SDF-Analyze Skill | done | critical | R 阶段需求分析能力 (自举) |
| feat-workflow-orchestration | Workflow Orchestration | done | critical | R-D-C-T 工作流编排系统 |
| feat-sdf-design | SDF-Design Skill | done | critical | D 阶段设计能力 |
| feat-sdf-code | SDF-Code Skill | done | critical | C 阶段编码能力 |
| feat-sdf-test | SDF-Test Skill | done | critical | T 阶段测试验收能力 |
| feat-task-management | Task Management | done | high | 持久化任务管理 |