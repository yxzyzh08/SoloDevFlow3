# SoloDevFlow Hooks

> 利用 Claude Code 的 Hooks 机制实现自动化门控检查。

## 可用 Hooks

| Hook | 触发时机 | 用途 |
|------|----------|------|
| `gate-check.sh` | Edit 操作前 | 检查待分析任务 |

## 配置方法

在 Claude Code settings 中添加:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "command": ".claude/hooks/gate-check.sh \"$FILE_PATH\""
      }
    ]
  }
}
```

## Hook 类型

| 类型 | 说明 |
|------|------|
| `PreToolUse` | 工具调用前 |
| `PostToolUse` | 工具调用后 |
| `Notification` | 通知事件 |

## 自定义 Hook

创建新 Hook 脚本:

```bash
#!/bin/bash
# 你的检查逻辑
# 返回 0 = 允许继续
# 返回非 0 = 阻止操作 (需 stopOnFailure: true)
exit 0
```

## 参考

- [Claude Code Hooks 文档](https://docs.anthropic.com/claude-code/hooks)
