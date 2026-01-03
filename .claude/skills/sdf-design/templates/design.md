---
id: des-<name>
type: design
domain: <DomainId>
status: draft
created: <YYYY-MM-DD>
requirement: docs/requirements/<domain>/feat-<name>.md
depends-on: []
architecture_aligned: false
adr_created: []
---

# <Feature> - Technical Design

> 技术设计文档：定义如何实现 <Feature>。

## 1. Design Overview

### 1.1 Problem Statement

[要解决什么问题？当前有什么痛点？]

### 1.2 Solution Approach

[采用什么方案解决？核心思路是什么？]

### 1.3 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [决策点] | [选择] | [理由] |

## 2. Architecture Alignment

### 2.1 Reused Components

| Component | How Used |
|-----------|----------|
| [组件名] | [使用方式] |

### 2.2 New Components

| Component | Location | Description |
|-----------|----------|-------------|
| [组件名] | [位置] | [描述] |

### 2.3 Interface Consistency Check

- [ ] 输入输出类型与现有接口风格一致
- [ ] 函数命名遵循现有约定
- [ ] 错误处理使用 { success, error } 模式

## 3. Detailed Design

### 3.1 Module: <name>

**职责**: [模块职责描述]

**接口**:
```typescript
// 接口定义
```

**实现要点**:
- [要点 1]
- [要点 2]

### 3.2 Module: <name>

[同上格式]

## 4. Integration

### 4.1 Dependency Integration

| Dependency | Interface Used | Purpose |
|------------|----------------|---------|
| [依赖名] | [接口] | [用途] |

### 4.2 API Contracts

```typescript
// 输入输出定义
```

## 5. Test Strategy

### 5.1 Unit Test Approach

[单元测试策略]

### 5.2 Integration Test Approach

[集成测试策略]

## 6. Trade-offs & Alternatives

### 6.1 Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **选择的方案** | [描述] | [优点] | [缺点] |
| 备选方案 1 | [描述] | [优点] | [缺点] |

### 6.2 Decision Rationale

[为什么选择当前方案？]

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [风险] | [概率] | [影响] | [缓解措施] |

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| [指标] | [目标值] |

---

*Design: <feature-name>*
*Domain: <DomainId>*
*Created: <date>*
*Status: draft*
