---
id: test-<name>
type: test-verification
feature: feat-<name>
domain: <DomainId>
date: <YYYY-MM-DD>
result: pass | fail
---

# <Feature> - Test Verification

> T 阶段验证报告：确认实现满足验收标准。

## 1. AC Verification Status

| AC | Title | Method | Result | Notes |
|----|-------|--------|--------|-------|
| AC-1 | [标题] | Automated / Code Review / Documentation / Manual | PASS / FAIL | [备注] |
| AC-2 | [标题] | [方法] | [结果] | [备注] |

**Summary**:
- Total: X ACs
- Passed: Y (Z%)
- Failed: N

## 2. Test Output (If Applicable)

```bash
$ npm test

[测试输出]

✓ X/Y tests passed
Coverage: XX%
```

*如无自动化测试，记录*: No automated tests configured

## 3. Decision

- **Result**: PASS / FAIL
- **Action**:
  - APPROVE → Feature status updated to `done`
  - REJECT → Return to C phase for fixes

**Blockers** (if any):
- [阻塞问题列表]

---

*Verified: <date>*
*Verifier: AI + Human*
