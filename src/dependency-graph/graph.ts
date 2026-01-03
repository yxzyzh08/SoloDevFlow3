/**
 * Graph Building
 * 从 Feature 索引构建依赖图
 */

import type { FeatureIndex, DependencyGraph, GraphNode } from '../types.js';

/**
 * 从 Feature 列表构建依赖图
 * @param features Feature 索引列表
 * @returns 依赖图
 */
export function buildGraph(features: FeatureIndex[]): DependencyGraph {
  const graph: DependencyGraph = {
    nodes: new Map(),
    edges: {
      requires: new Map(),
      blocks: new Map()
    }
  };

  // Step 1: 添加所有节点
  for (const feature of features) {
    const node: GraphNode = {
      id: feature.id,
      status: feature.status,
      priority: feature.priority,
      analyzed: feature.analyzed,
      domain: feature.domain
    };

    graph.nodes.set(feature.id, node);
    graph.edges.requires.set(feature.id, []);
    graph.edges.blocks.set(feature.id, []);
  }

  // Step 2: 添加边
  for (const feature of features) {
    if (feature.dependencies?.requires) {
      graph.edges.requires.set(feature.id, [...feature.dependencies.requires]);
    }
    if (feature.dependencies?.blocks) {
      graph.edges.blocks.set(feature.id, [...feature.dependencies.blocks]);
    }
  }

  return graph;
}

/**
 * 获取节点的所有入边（被哪些节点依赖）
 * @param graph 依赖图
 * @param nodeId 节点 ID
 * @returns 依赖该节点的节点 ID 列表
 */
export function getIncomingEdges(graph: DependencyGraph, nodeId: string): string[] {
  const incoming: string[] = [];

  for (const [from, toList] of graph.edges.requires) {
    if (toList.includes(nodeId)) {
      incoming.push(from);
    }
  }

  return incoming;
}

/**
 * 获取节点的所有出边（依赖哪些节点）
 * @param graph 依赖图
 * @param nodeId 节点 ID
 * @returns 该节点依赖的节点 ID 列表
 */
export function getOutgoingEdges(graph: DependencyGraph, nodeId: string): string[] {
  return graph.edges.requires.get(nodeId) || [];
}

/**
 * 格式化依赖图输出
 */
export function formatGraph(graph: DependencyGraph): string {
  const lines: string[] = [];
  lines.push('=== Dependency Graph ===');
  lines.push('');

  for (const [nodeId, node] of graph.nodes) {
    lines.push(`${nodeId} (${node.status}, ${node.priority})`);

    // requires
    const requires = graph.edges.requires.get(nodeId) || [];
    lines.push('├── requires:');
    if (requires.length === 0) {
      lines.push('│   (none)');
    } else {
      for (let i = 0; i < requires.length; i++) {
        const prefix = i === requires.length - 1 ? '│   └── ' : '│   ├── ';
        const depNode = graph.nodes.get(requires[i]);
        const status = depNode ? ` (${depNode.status})` : ' (not found)';
        lines.push(`${prefix}${requires[i]}${status}`);
      }
    }

    // blocks
    const blocks = graph.edges.blocks.get(nodeId) || [];
    lines.push('└── blocks:');
    if (blocks.length === 0) {
      lines.push('    (none)');
    } else {
      for (let i = 0; i < blocks.length; i++) {
        const prefix = i === blocks.length - 1 ? '    └── ' : '    ├── ';
        lines.push(`${prefix}${blocks[i]}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
