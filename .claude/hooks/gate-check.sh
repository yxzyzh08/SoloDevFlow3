#!/bin/bash
# SoloDevFlow Gate Check Hook
#
# 用法: 在 Claude Code settings 中配置:
# {
#   "hooks": {
#     "PreToolUse": [
#       {
#         "matcher": "Edit",
#         "command": ".claude/hooks/gate-check.sh"
#       }
#     ]
#   }
# }

# 获取当前操作的文件路径
FILE_PATH="$1"

# 检查是否是状态更新操作
if [[ "$FILE_PATH" == *"docs/requirements"* ]] && [[ "$FILE_PATH" == *".md" ]]; then
    # 提取 Feature ID
    FEATURE_ID=$(basename "$FILE_PATH" .md)

    # 检查是否有待分析任务
    if command -v node &> /dev/null && [ -f "src/dist/index.js" ]; then
        PENDING=$(cd src && node dist/index.js task list --type=analyze_requirement --status=pending --json 2>/dev/null | grep -c "pending" || echo "0")

        if [ "$PENDING" -gt 0 ]; then
            echo "⚠️  Gate Check Warning: $PENDING pending requirement(s) in Task Manager"
            echo "   Consider analyzing them before proceeding."
        fi
    fi
fi

# 返回 0 允许操作继续
exit 0
