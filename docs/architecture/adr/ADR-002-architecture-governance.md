---
id: ADR-002
title: 引入三层架构治理体系
status: accepted
date: 2026-01-02
deciders: [Human, AI]
---

# ADR-002: 引入三层架构治理体系

## Status

**Accepted**

## Context

在 Feature-by-Feature 设计过程中发现问题：

> "我们在做需求设计时候，有可能只针对某些 feature 做设计，但是我们的设计缺少全局角度，设计可能非常不合理。"

**问题表现**:
- 每个 Feature 可能选择不同的技术方案
- 接口定义可能不一致
- 缺少对跨切面关注点的统一处理
- 可能违反 DRY 原则

**行业解决方案**:
- BDUF (Big Design Up Front) - 过于僵化
- Emergent Design - 可能导致架构腐化
- Intentional Architecture (SAFe) - 平衡方案

## Decision

引入 **三层架构治理体系**：

```
Layer 1: Architecture Principles (硬性约束)
    ↓
Layer 2: Living Architecture Document (演进文档)
    ↓
Layer 3: Design Checklist (检查清单)
```

## Implementation

### Layer 1: principles.md

不可违反的硬性约束：
- Document is Truth
- AI-First Document Design
- TypeScript for Tools
- Modular Independence
- Progressive Disclosure
- Gate-Controlled Transitions

### Layer 2: ARCHITECTURE.md

随项目演进的活文档：
- Component Map
- Interface Contracts
- Design Patterns
- Evolution Log

### Layer 3: Design Checklist

每个 Feature 设计前必须完成：
- Principles Compliance
- Reuse Analysis
- Interface Consistency
- Pattern Usage
- ADR Required?

## Design Flow Change

```
原流程:
Step 1: Load Feature Context
Step 2: Analyze Dependencies
Step 3: Explore Codebase
Step 4: Generate Design

新流程:
Step 0: Load Architecture Context (新增)
Step 1: Load Feature Context
Step 2: Architecture Consistency Check (新增)
Step 3: Analyze Dependencies
Step 4: Explore Codebase
Step 5: Generate Design
Step 6: Update Architecture (新增)
```

## Consequences

### Positive

- 每个 Feature 设计有全局视角
- 接口一致性得到保障
- 设计决策有迹可循
- 减少重复造轮子

### Negative

- 增加设计流程步骤
- 需要维护架构文档

### Mitigation

- 架构文档作为 "活文档" 随项目自然演进
- 检查清单嵌入 sdf-design Skill 自动执行
- 只在必要时创建 ADR

## References

- SAFe Architectural Runway
- ADR (Architecture Decision Records)
- Emergent Design vs Intentional Architecture
