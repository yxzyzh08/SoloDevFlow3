/**
 * Task Manager - Storage Layer
 * 持久化存储读写
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { TaskStore } from '../types.js';

const STORE_PATH = '.solodevflow/tasks.json';
const STORE_VERSION = '1.0.0';

/**
 * 读取任务存储
 * @param basePath 项目根目录
 */
export async function loadStore(basePath: string): Promise<TaskStore> {
  const storePath = path.join(basePath, STORE_PATH);
  try {
    const content = await fs.readFile(storePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // 文件不存在，返回空存储
    return { version: STORE_VERSION, tasks: [] };
  }
}

/**
 * 写入任务存储
 * @param basePath 项目根目录
 * @param store 存储数据
 */
export async function saveStore(basePath: string, store: TaskStore): Promise<void> {
  const storePath = path.join(basePath, STORE_PATH);
  const dir = path.dirname(storePath);

  // 确保目录存在
  await fs.mkdir(dir, { recursive: true });

  // 写入文件
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * 获取存储路径
 * @param basePath 项目根目录
 */
export function getStorePath(basePath: string): string {
  return path.join(basePath, STORE_PATH);
}

export { STORE_VERSION };
