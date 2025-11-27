/**
 * Network Types
 *
 * Types related to network graphs, nodes, and edges.
 */

import type { RiskLevel, SimpleRiskLevel } from './core';

// ============================================================================
// Network Node Types
// ============================================================================

/**
 * Legacy node type (for backward compatibility)
 */
export type NodeType = 'person' | 'company' | 'historical';

/**
 * Extended node type for network visualization
 */
export type NetworkNodeType =
  | 'person'
  | 'company'
  | 'historical'
  | 'property'
  | 'vehicle'
  | 'account'
  | 'external';

/**
 * Network node representing an entity
 */
export interface NetworkNode {
  id: string;
  tenantId: string;
  label: string;
  sublabel: string;
  type: NodeType;
  x: number;
  y: number;
  riskLevel: SimpleRiskLevel;
  cvr?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'suspended'; // For color coding
  clusterId?: string; // For clustering
  isHighlighted?: boolean; // For relation highlighting
  size?: number; // For node sizing based on importance
  connections?: number; // Number of connections for prioritization
  // AI analysis overlay (optional)
  ai?: {
    score: number; // 0-100
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: 'economy' | 'risk' | 'legal' | 'social' | 'other';
    source?: string; // e.g., 'gemini' or 'cache'
    generatedAt?: string; // ISO timestamp
  } | null;
}

// ============================================================================
// Network Edge Types
// ============================================================================

/**
 * Edge type for network visualization
 */
export type NetworkEdgeType =
  | 'ownership'
  | 'historical'
  | 'transaction'
  | 'management'
  | 'family'
  | 'business'
  | 'financial'
  | 'legal';

/**
 * Network edge representing a relationship
 */
export interface NetworkEdge {
  from: string;
  to: string;
  tenantId: string;
  type: 'ownership' | 'historical' | 'transaction';
  weight?: number; // For edge thickness and importance
  isHighlighted?: boolean; // For relation highlighting
  label?: string; // Optional edge label
  // Optional AI annotation for relationships
  ai?: {
    score?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: 'economy' | 'risk' | 'legal' | 'social' | 'other';
    source?: string;
    generatedAt?: string;
  } | null;
}

// ============================================================================
// Network Graph Types
// ============================================================================

/**
 * Complete network graph data
 */
export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/**
 * Network layout options
 */
export type NetworkLayout = 'force' | 'hierarchical' | 'circular' | 'grid';

/**
 * Network visualization options
 */
export interface NetworkOptions {
  layout: NetworkLayout;
  showLabels: boolean;
  highlightRisk: boolean;
  groupByType: boolean;
  filterTypes?: NetworkNodeType[];
}

// ============================================================================
// Network Filter Types
// ============================================================================

/**
 * Network filter options
 */
export interface NetworkFilter {
  nodeTypes?: NetworkNodeType[];
  edgeTypes?: NetworkEdgeType[];
  riskLevels?: RiskLevel[];
  searchQuery?: string;
  statusFilter?: ('active' | 'inactive' | 'suspended')[];
  clusterFilter?: string[];
}

// ============================================================================
// Network Clustering Types
// ============================================================================

/**
 * Cluster definition for grouping nodes
 */
export interface NetworkCluster {
  id: string;
  label: string;
  color: string;
  nodes: string[]; // Node IDs in this cluster
  centroid?: { x: number; y: number }; // Center point for cluster
}

// ============================================================================
// Network Performance Types
// ============================================================================

/**
 * Viewport bounds for virtualization
 */
export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Lazy loading state
 */
export interface NetworkLoadingState {
  isLoading: boolean;
  loadedNodes: number;
  totalNodes: number;
  hasMore: boolean;
}
