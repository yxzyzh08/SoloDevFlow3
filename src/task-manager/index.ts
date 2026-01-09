/**
 * Task Manager
 * 持久化任务管理模块
 *
 * 提供：
 * - 任务 CRUD 操作
 * - 依赖关系管理
 * - 批量创建（为 impact-analyzer 准备）
 * - 可执行任务查询
 */

export * from './store.js';
export * from './operations.js';

// 重导出类型
export type {
  Task,
  TaskType,
  TaskStatus,
  TaskStore,
  TaskResult
} from '../types.js';
