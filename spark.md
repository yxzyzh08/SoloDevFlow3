问题1： 为什么针对上面的任务，你没走需求流程呢，应该是先修改文档，还执行任务
创意1： 渐进式披露 ，不一定是自上向下，有可能是反过来，比如我让你修改某个文件的逻辑，不管是规范还是代码，你都先定位到这个文件，然后你做分析，利用我们的索引，看看这个文件的修改，影响那些模块，然后依次递归分析，生成相关任务。
整个流程是个递归任务，当然反过来其实也一样，我觉得依靠AI去做，不太现实，我建议提供一个工具或代码，配合AI来做比较合适，你觉得这个需求合理吗，能网上搜搜相关的最佳实践吗，或者官方有推荐吗，请深入研究，然后给出方案，使用ultrathink

问题3： 修改存在的feature时候，没修改feature 文档状态，稳定状态还是done ，是否需要新定义个状态，让AI知道这针对feature的需求变更

需求拆分分析

  ┌────────────────────────────────────────────────────────────────┐
  │              Impact Analysis System (整体需求)                  │
  ├────────────────────────────────────────────────────────────────┤
  │                                                                │
  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
  │  │ feat-code-  │   │ feat-reverse│   │ feat-impact │          │
  │  │ indexer     │──▶│ -dep-index  │──▶│ -analyzer   │          │
  │  │             │   │             │   │             │          │
  │  │ AST 解析    │   │ 反向索引    │   │ 递归分析    │          │
  │  │ 符号提取    │   │ 谁依赖我?   │   │ 影响范围    │          │
  │  └─────────────┘   └─────────────┘   └──────┬──────┘          │
  │                                             │                  │
  │                                             ▼                  │
  │                    ┌─────────────┐   ┌─────────────┐          │
  │                    │ feat-doc-   │   │ feat-task-  │          │
  │                    │ code-mapping│   │ generator   │          │
  │                    │             │   │             │          │
  │                    │ Feature↔File│   │ 生成任务    │          │
  │                    └─────────────┘   └─────────────┘          │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘

  建议的 Feature 拆分

  | Feature ID             | 名称         | 职责                                          | 依赖                   |
  |------------------------|--------------|-----------------------------------------------|------------------------|
  | feat-code-indexer      | 代码索引器   | Tree-sitter AST 解析，提取 import/export/符号 | 无                     |
  | feat-reverse-dep-index | 反向依赖索引 | 构建"谁依赖 X"的索引结构                      | feat-code-indexer      |
  | feat-doc-code-mapping  | 文档代码映射 | Feature ↔ 代码文件的对应关系                  | feat-doc-indexer       |
  | feat-impact-analyzer   | 影响分析引擎 | 递归遍历，计算影响范围                        | feat-reverse-dep-index |
  | feat-task-generator    | 任务生成器   | 根据影响范围生成任务列表                      | feat-impact-analyzer   |

  依赖图

  feat-doc-indexer (已有)     feat-code-indexer (新)
          │                           │
          │                           ▼
          │                   feat-reverse-dep-index
          │                           │
          ▼                           │
  feat-doc-code-mapping ◀─────────────┤
          │                           │
          │                           ▼
          └──────────────────▶ feat-impact-analyzer
                                      │
                                      ▼
                              feat-task-generator

  与现有 Feature 的关系

  | 现有 Feature          | 关系   | 说明                                     |
  |-----------------------|--------|------------------------------------------|
  | feat-doc-indexer      | 被依赖 | 提供 Feature 元数据                      |
  | feat-dependency-graph | 互补   | 文档级依赖 vs 代码级依赖，可合并到统一图 |

  推荐的开发顺序

  Phase 1: 基础索引
    1. feat-code-indexer        [无依赖，可立即开始]

  Phase 2: 反向能力
    2. feat-reverse-dep-index   [依赖 Phase 1]
    3. feat-doc-code-mapping    [依赖 feat-doc-indexer]

  Phase 3: 分析引擎
    4. feat-impact-analyzer     [依赖 Phase 2]

  Phase 4: 任务生成
    5. feat-task-generator      [依赖 Phase 3]

  ---
  要我帮你创建这些 Feature 的需求文档吗？可以先从 feat-code-indexer 开始，走完整的 R-D-C-T 流程。

> 在做之前，我们是不是应该先做一个任务管理feature，当前我们有一个backlog.md,但它不合适，我觉得应该优化它，增强它，把他变成     
任务管理，而且我们也没backlog feature 

● 你说得非常对！这是典型的 Dependency First 原则 —— 在做影响分析系统之前，需要先有一个能承接"生成任务"的任务管理系统。

  让我先看看当前的 backlog.md：

● Read(docs\requirements\backlog.md)
  ⎿  Read 101 lines

● 你说得很对。当前 backlog.md 存在几个问题：

  当前问题分析

  | 问题              | 说明                                           |
  |-------------------|------------------------------------------------|
  | 定位模糊          | 既是"需求池"又包含"门控状态"，职责混杂         |
  | 只有 Backlog      | 只能存储"待分析的需求"，无法管理"执行任务"     |
  | 粒度单一          | 只有 Feature 级别，无法管理 Feature 内部的任务 |
  | 手动维护          | 统计、状态都需要人工更新                       |
  | 没有 Feature 定义 | backlog 功能本身没有被正式定义                 |

  Backlog vs Task 的区别

  ┌─────────────────────────────────────────────────────────────┐
  │                    当前: Backlog Only                        │
  ├─────────────────────────────────────────────────────────────┤
  │  Backlog Item (待分析需求)                                   │
  │  ├── backlog-005: 项目初始化功能                             │
  │  └── backlog-006: 多项目类型模板                             │
  │                                                              │
  │  问题: 分析完成后变成 Feature，但 Feature 内的任务无处管理    │
  └─────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │                    需要: Backlog + Task                      │
  ├─────────────────────────────────────────────────────────────┤
  │  Backlog (需求池)          Task (执行任务)                   │
  │  ├── 待分析需求             ├── Feature 内的具体任务         │
  │  └── 转化为 Feature         ├── 影响分析生成的任务           │
  │                             ├── 代码修改任务                 │
  │                             └── 测试/验证任务                │
  └─────────────────────────────────────────────────────────────┘

  建议的 Feature 拆分

  这个"任务管理系统"本身也可能涉及多个 Feature：

  ┌─────────────────────────────────────────────────────────────┐
  │                Task Management System                        │
  ├─────────────────────────────────────────────────────────────┤
  │                                                              │
  │  ┌─────────────────┐    ┌─────────────────┐                 │
  │  │ feat-backlog    │    │ feat-task-mgmt  │                 │
  │  │                 │    │                 │                 │
  │  │ • 需求池管理    │    │ • 任务 CRUD     │                 │
  │  │ • 待分析队列    │    │ • 状态流转      │                 │
  │  │ • 转化为 Feature│    │ • 优先级排序    │                 │
  │  │ • 统计视图      │    │ • 任务-Feature 关联│               │
  │  └────────┬────────┘    └────────┬────────┘                 │
  │           │                      │                          │
  │           └──────────┬───────────┘                          │
  │                      ▼                                       │
  │           ┌─────────────────┐                               │
  │           │ feat-work-queue │  (可选，后期)                  │
  │           │                 │                               │
  │           │ • 统一工作队列   │                               │
  │           │ • 自动调度      │                               │
  │           │ • 进度追踪      │                               │
  │           └─────────────────┘                               │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘

  我的建议

  先做一个 MVP 版本，把 Backlog 和 Task 合并成一个 Feature：

  | Feature              | 说明                                         |
  |----------------------|----------------------------------------------|
  | feat-task-management | 统一的任务管理，包含 Backlog + Task 两种类型 |

  等 MVP 验证后，再根据需要拆分。

  核心数据结构草案

  interface WorkItem {
    id: string;
    type: 'backlog' | 'task';

    // 通用字段
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'blocked' | 'done';
    priority: 'critical' | 'high' | 'medium' | 'low';
    created: Date;

    // Backlog 专用
    source?: string;           // 来源 Feature
    convertedTo?: FeatureId;   // 转化后的 Feature

    // Task 专用
    parentFeature?: FeatureId; // 所属 Feature
    generatedBy?: string;      // 生成来源 (impact-analyzer, manual, etc.)
    affectedFiles?: FilePath[]; // 涉及的文件
  }

  ---
  你觉得这个思路对吗？要不要我们先为 feat-task-management 走一遍完整的 R 阶段分析？