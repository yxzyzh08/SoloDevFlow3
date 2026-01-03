/**
 * SoloDevFlow Type Definitions
 * AI-First 文档结构类型定义
 */

// ============ Feature Status ============
export type FeatureStatus =
  | 'backlog'
  | 'proposed'
  | 'analyzing'
  | 'analyzed'
  | 'waiting-deps'
  | 'ready-for-design'
  | 'designing'
  | 'implementing'
  | 'testing'
  | 'done'
  | 'blocked';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type FeatureType = 'feature' | 'bug' | 'enhancement';

// ============ Feature Index ============
export interface FeatureDependencies {
  requires: string[];
  blocks: string[];
}

export interface ComputedLinks {
  requiredBy: string[];
  blockedBy: string[];
}

export interface FeatureIndex {
  // Metadata
  id: string;
  type: FeatureType;
  domain: string;
  status: FeatureStatus;
  priority: Priority;

  // Semantic Fields (AI-First)
  summary: string;
  tags: string[];

  // Dependencies
  dependencies: FeatureDependencies;

  // Computed (reverse links)
  computed: ComputedLinks;

  // Analysis State
  analyzed: boolean;

  // File Info
  filePath: string;
  created?: string;
}

// ============ Validation ============
export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  rule: string;
  severity: ValidationSeverity;
  file: string;
  message: string;
  details?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ============ Index Result ============
export interface DomainSummary {
  id: string;
  description: string;
  featureCount: number;
  features: FeatureIndex[];
}

export interface IndexStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  analyzedCount: number;
  validCount: number;
}

export interface IndexResult {
  features: FeatureIndex[];
  domains: DomainSummary[];
  stats: IndexStats;
  validation: ValidationResult;
}

// ============ Dependency Graph ============
export interface GraphNode {
  id: string;
  status: FeatureStatus;
  priority: Priority;
  analyzed: boolean;
  domain: string;
}

export interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: {
    requires: Map<string, string[]>;
    blocks: Map<string, string[]>;
  };
}

// ============ Gate Check ============
export type PhaseTransition = 'R→D' | 'D→C' | 'C→T' | 'T→Done';

export interface GateCondition {
  id: string;
  name: string;
  satisfied: boolean;
  details: string;
}

export interface GateCheckResult {
  featureId: string;
  targetPhase: PhaseTransition;
  canProceed: boolean;
  conditions: GateCondition[];
  blockers: string[];
}

// ============ Backlog ============
export interface BacklogItem {
  id: string;
  source: string;
  description: string;
  status: 'pending' | 'analyzing' | 'completed';
}
