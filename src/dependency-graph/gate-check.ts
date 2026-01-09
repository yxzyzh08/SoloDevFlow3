/**
 * Gate Check
 * R→D 阶段转换门控检查
 */

import type {
  DependencyGraph,
  GateCheckResult,
  GateCondition,
  Task,
  PhaseTransition
} from '../types.js';
import { detectCycles } from './algorithms.js';

// 阶段转换前的状态要求
const PHASE_REQUIREMENTS: Record<PhaseTransition, string[]> = {
  'R→D': ['proposed', 'analyzing', 'analyzed', 'ready-for-design'],
  'D→C': ['designing'],
  'C→T': ['implementing'],
  'T→Done': ['testing']
};

// 阶段转换后的目标状态
const PHASE_TARGETS: Record<PhaseTransition, string> = {
  'R→D': 'designing',
  'D→C': 'implementing',
  'C→T': 'testing',
  'T→Done': 'done'
};

/**
 * R→D 阶段门控检查
 * @param featureId Feature ID
 * @param graph 依赖图
 * @param pendingRequirements 待分析需求任务 (type: 'analyze_requirement', status: 'pending')
 * @returns 门控检查结果
 */
export function checkRToD(
  featureId: string,
  graph: DependencyGraph,
  pendingRequirements: Task[]
): GateCheckResult {
  const conditions: GateCondition[] = [];
  const blockers: string[] = [];

  const feature = graph.nodes.get(featureId);
  if (!feature) {
    return {
      featureId,
      targetPhase: 'R→D',
      canProceed: false,
      conditions: [{
        id: 'feature-exists',
        name: 'Feature 存在',
        satisfied: false,
        details: `Feature "${featureId}" 不存在`
      }],
      blockers: [`Feature "${featureId}" 不存在`]
    };
  }

  // Condition 1: 分析完成
  const cond1: GateCondition = {
    id: 'analyzed',
    name: '依赖分析完成',
    satisfied: feature.analyzed === true,
    details: feature.analyzed
      ? 'analyzed: true'
      : 'analyzed: false，需完成依赖分析'
  };
  conditions.push(cond1);
  if (!cond1.satisfied) {
    blockers.push('依赖分析未完成');
  }

  // Condition 2: 待分析需求状态
  const relatedRequirements = pendingRequirements.filter(
    t => t.source === featureId && t.status === 'pending'
  );
  const cond2: GateCondition = {
    id: 'requirements-clear',
    name: '待分析需求已清空',
    satisfied: relatedRequirements.length === 0,
    details: relatedRequirements.length === 0
      ? '无相关待分析需求'
      : `${relatedRequirements.length} 个待分析: ${relatedRequirements.map(t => t.id).join(', ')}`
  };
  conditions.push(cond2);
  if (!cond2.satisfied) {
    blockers.push(`有 ${relatedRequirements.length} 个待分析需求`);
  }

  // Condition 3: 前置依赖就绪
  const requires = graph.edges.requires.get(featureId) || [];
  const notReady: string[] = [];

  // 需要处于 analyzed 或更后阶段的状态
  const readyStatuses = ['analyzed', 'ready-for-design', 'designing', 'implementing', 'testing', 'done'];

  for (const depId of requires) {
    const dep = graph.nodes.get(depId);
    if (!dep) {
      notReady.push(`${depId} (不存在)`);
    } else if (!readyStatuses.includes(dep.status)) {
      notReady.push(`${depId} (${dep.status})`);
    }
  }

  const cond3: GateCondition = {
    id: 'deps-ready',
    name: '前置依赖就绪',
    satisfied: notReady.length === 0,
    details: notReady.length === 0
      ? (requires.length === 0 ? '无前置依赖' : '所有依赖已就绪')
      : `等待: ${notReady.join(', ')}`
  };
  conditions.push(cond3);
  if (!cond3.satisfied) {
    blockers.push(`等待依赖: ${notReady.join(', ')}`);
  }

  // Condition 4: 无循环依赖
  const cycleResult = detectCycles(graph);
  const involvedCycles = cycleResult.cycles.filter(c => c.includes(featureId));
  const cond4: GateCondition = {
    id: 'no-cycle',
    name: '无循环依赖',
    satisfied: involvedCycles.length === 0,
    details: involvedCycles.length === 0
      ? '无循环'
      : `发现循环: ${involvedCycles[0].join(' → ')}`
  };
  conditions.push(cond4);
  if (!cond4.satisfied) {
    blockers.push('存在循环依赖');
  }

  return {
    featureId,
    targetPhase: 'R→D',
    canProceed: conditions.every(c => c.satisfied),
    conditions,
    blockers
  };
}

/**
 * D→C 阶段门控检查
 */
export function checkDToC(
  featureId: string,
  graph: DependencyGraph,
  hasDesignDoc: boolean
): GateCheckResult {
  const conditions: GateCondition[] = [];
  const blockers: string[] = [];

  const feature = graph.nodes.get(featureId);
  if (!feature) {
    return {
      featureId,
      targetPhase: 'D→C',
      canProceed: false,
      conditions: [],
      blockers: [`Feature "${featureId}" 不存在`]
    };
  }

  // Condition 1: 设计文档存在
  const cond1: GateCondition = {
    id: 'design-exists',
    name: '设计文档已创建',
    satisfied: hasDesignDoc,
    details: hasDesignDoc
      ? '设计文档已存在'
      : '需创建设计文档 docs/design/<domain>/feat-<name>.md'
  };
  conditions.push(cond1);
  if (!cond1.satisfied) {
    blockers.push('设计文档未创建');
  }

  return {
    featureId,
    targetPhase: 'D→C',
    canProceed: conditions.every(c => c.satisfied),
    conditions,
    blockers
  };
}

/**
 * C→T 阶段门控检查
 */
export function checkCToT(
  featureId: string,
  graph: DependencyGraph,
  codeComplete: boolean,
  acDefined: boolean
): GateCheckResult {
  const conditions: GateCondition[] = [];
  const blockers: string[] = [];

  // Condition 1: 编码完成
  const cond1: GateCondition = {
    id: 'code-complete',
    name: '编码已完成',
    satisfied: codeComplete,
    details: codeComplete ? '编码已完成' : '编码未完成'
  };
  conditions.push(cond1);
  if (!cond1.satisfied) {
    blockers.push('编码未完成');
  }

  // Condition 2: AC 已定义
  const cond2: GateCondition = {
    id: 'ac-defined',
    name: 'AC 已定义',
    satisfied: acDefined,
    details: acDefined ? 'AC 已定义' : '需定义验收标准'
  };
  conditions.push(cond2);
  if (!cond2.satisfied) {
    blockers.push('验收标准未定义');
  }

  return {
    featureId,
    targetPhase: 'C→T',
    canProceed: conditions.every(c => c.satisfied),
    conditions,
    blockers
  };
}

/**
 * 格式化门控检查结果
 */
export function formatGateCheckResult(result: GateCheckResult): string {
  const lines: string[] = [];

  lines.push(`=== ${result.targetPhase} Gate Check: ${result.featureId} ===`);
  lines.push('');
  lines.push('Conditions:');

  for (const cond of result.conditions) {
    const status = cond.satisfied ? '[PASS]' : '[FAIL]';
    lines.push(`  ${status} ${cond.name} (${cond.details})`);
  }

  lines.push('');
  if (result.canProceed) {
    const target = PHASE_TARGETS[result.targetPhase];
    lines.push(`Result: CAN PROCEED to ${target} phase`);
  } else {
    lines.push('Result: CANNOT PROCEED');
    lines.push('');
    lines.push('Blockers:');
    result.blockers.forEach((blocker, i) => {
      lines.push(`  ${i + 1}. ${blocker}`);
    });
  }

  return lines.join('\n');
}
