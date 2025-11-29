import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NetworkNode, NetworkEdge, NetworkCluster, ViewportBounds, NetworkLoadingState } from '../../types';
import aiService from '../../domains/network/services/aiNetworkAnalysisService';
import { useOptionalTenant } from '../../domains/tenant';
import { useTranslation } from 'react-i18next';
import { palette } from '../../theme/palette';

// Lazy loading hook for network data
const useLazyNetworkLoading = (
    allNodes: NetworkNode[],
    allEdges: NetworkEdge[],
    batchSize: number = 20
) => {
    const [loadedNodes, setLoadedNodes] = useState<NetworkNode[]>([]);
    const [loadedEdges, setLoadedEdges] = useState<NetworkEdge[]>([]);
    const [loadingState, setLoadingState] = useState<NetworkLoadingState>({
        isLoading: false,
        loadedNodes: 0,
        totalNodes: allNodes.length,
        hasMore: allNodes.length > 0
    });

    const loadMoreNodes = useCallback(async () => {
        if (loadingState.isLoading || !loadingState.hasMore) return;

        setLoadingState(prev => ({ ...prev, isLoading: true }));

        // Simulate async loading (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentCount = loadedNodes.length;
        const nextBatch = allNodes.slice(currentCount, currentCount + batchSize);
        const newNodes = [...loadedNodes, ...nextBatch];

        // Load edges that connect to the new nodes
        const newNodeIds = new Set(nextBatch.map(n => n.id));
        const newEdges = allEdges.filter(edge =>
            newNodeIds.has(edge.from) || newNodeIds.has(edge.to)
        );

        setLoadedNodes(newNodes);
        setLoadedEdges(prev => [...prev, ...newEdges]);

        setLoadingState({
            isLoading: false,
            loadedNodes: newNodes.length,
            totalNodes: allNodes.length,
            hasMore: newNodes.length < allNodes.length
        });
    }, [allNodes, allEdges, loadedNodes, loadingState, batchSize]);

    // Initial load
    useEffect(() => {
        if (loadedNodes.length === 0 && allNodes.length > 0) {
            loadMoreNodes();
        }
    }, [allNodes, loadMoreNodes, loadedNodes.length]);

    return {
        nodes: loadedNodes,
        edges: loadedEdges,
        loadingState,
        loadMoreNodes
    };
};

interface NetworkGraphProps {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    onNodeClick?: (node: NetworkNode) => void;
    onEdgeClick?: (edge: NetworkEdge) => void;
    enableClustering?: boolean;
    enableVirtualization?: boolean;
    maxNodesToShow?: number;
}

const nodeDimensions = { width: 180, height: 60, radius: 8 };

const riskColors = {
    High: palette.danger,
    Medium: palette.warning,
    Low: palette.gold,
    None: palette.borderStrong
};

const typeColors = {
    person: palette.gold,
    company: palette.copper,
    historical: palette.border,
    property: palette.deepBlueLight,
    vehicle: palette.info,
    account: palette.success,
    external: palette.danger
};

const statusColors = {
    active: palette.gold,
    inactive: palette.textMuted,
    suspended: palette.danger
};

const clusterColors = [
    palette.gold,
    palette.copper,
    palette.deepBlueLight,
    palette.info,
    palette.warning,
    palette.success
];

const Node: React.FC<{
    node: NetworkNode,
    onMouseEnter: () => void,
    onMouseLeave: () => void,
    onClick?: () => void,
    scale?: number,
    aiEnabled?: boolean,
    aiSensitivity?: number,
    enabledCategories?: Set<string>
}> = ({ node, onMouseEnter, onMouseLeave, onClick, scale = 1, aiEnabled = false, aiSensitivity = 1, enabledCategories = new Set() }) => {
    const riskColor = riskColors[node.riskLevel] || riskColors.None;
    const typeColor = typeColors[node.type] || typeColors.company;
    const statusColor = statusColors[node.status || 'active'];
    const isHighlighted = node.isHighlighted;

    // If AI overlay present, map category -> color and score -> extra scale/opacity
    const rawCategory = aiEnabled ? node.ai?.category : undefined;
    const aiCategory = rawCategory && enabledCategories.has(rawCategory.toLowerCase()) ? rawCategory : undefined;
    const aiScore = aiEnabled && typeof node.ai?.score === 'number' && aiCategory ? node.ai.score : undefined;
    const aiCategoryColors: Record<string, string> = {
        economy: palette.warning,
        risk: palette.danger,
        legal: palette.deepBlueLight,
        social: palette.info,
        governance: palette.accent,
        socmint: palette.copper,
        other: palette.textMuted,
    };

    const aiColor = aiCategory ? (aiCategoryColors[aiCategory.toLowerCase()] || aiCategoryColors.other) : undefined;

    const scoreScale = aiScore ? (1 + Math.min(0.9, (aiScore / 100 * 0.9) * aiSensitivity)) : 1;
    const width = nodeDimensions.width * (node.size || 1) * scale * scoreScale;
    const height = nodeDimensions.height * (node.size || 1) * scale * scoreScale;

    return (
        <g
            transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className="cursor-pointer transition-all duration-200"
            style={{
                filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(227, 178, 60, 0.6))' : 'none',
                opacity: node.status === 'inactive' ? 0.6 : 1
            }}
        >
            {/* Status indicator */}
            <circle
                cx={width - 8}
                cy={8}
                r={4}
                fill={statusColor}
                stroke={palette.surface}
                strokeWidth={1}
            />

            {/* Main node rectangle */}
            <rect
                width={width}
                height={height}
                rx={nodeDimensions.radius}
                ry={nodeDimensions.radius}
                fill={palette.surface}
                stroke={aiColor ?? riskColor}
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-all duration-200"
            />

            {/* Type indicator bar */}
            <rect
                width={8}
                height={height}
                fill={typeColor}
                rx={nodeDimensions.radius}
                ry={nodeDimensions.radius}
                clipPath={`inset(0 ${width - 8}px 0 0 round ${nodeDimensions.radius}px)`}
            />

            {/* Label */}
            <text
                x={12}
                y={height * 0.4}
                fill={palette.text}
                fontSize={Math.max(12, 14 * scale)}
                fontWeight="bold"
                className="pointer-events-none"
            >
                {node.label}
            </text>

            {/* Sublabel */}
            <text
                x={12}
                y={height * 0.75}
                fill={palette.textMuted}
                fontSize={Math.max(10, 12 * scale)}
                className="pointer-events-none font-mono"
            >
                {node.sublabel}
            </text>

            {/* Connection count badge */}
            {node.connections && node.connections > 1 && (
                <circle
                    cx={8}
                    cy={height - 8}
                    r={6}
                    fill={palette.border}
                    stroke={palette.surface}
                    strokeWidth={1}
                />
            )}
            {node.connections && node.connections > 1 && (
                <text
                    x={8}
                    y={height - 8}
                    fill={palette.text}
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none font-bold"
                >
                    {node.connections}
                </text>
            )}
        </g>
    );
};

const Edge: React.FC<{
    edge: NetworkEdge,
    fromNode: NetworkNode,
    toNode: NetworkNode,
    onClick?: () => void,
    aiEnabled?: boolean,
    enabledCategories?: Set<string>
}> = ({ edge, fromNode, toNode, onClick, aiEnabled = false, enabledCategories = new Set() }) => {
    const isHighlighted = edge.isHighlighted;
    const strokeWidth = Math.max(1, (edge.weight || 1) * 1.5);
    // If AI classification present on edge, color by category
    const rawAiCat = aiEnabled ? edge.ai?.category : undefined;
    const aiCat = rawAiCat && enabledCategories.has(rawAiCat.toLowerCase()) ? rawAiCat : undefined;
    const aiEdgeColors: Record<string, string> = {
        economy: palette.warning,
        risk: palette.danger,
        legal: palette.deepBlueLight,
        social: palette.info,
        governance: palette.accent,
        socmint: palette.copper,
        other: palette.textMuted,
    };

    const strokeColor = aiCat
        ? (aiEdgeColors[aiCat.toLowerCase()] || aiEdgeColors.other)
        : (edge.type === 'historical'
            ? (isHighlighted ? palette.gold : palette.border)
            : (isHighlighted ? palette.gold : palette.textMuted));

    // Calculate edge label position
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    return (
        <g onClick={onClick} className="cursor-pointer">
            <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={edge.type === 'historical' ? '4 4' : 'none'}
                className="transition-all duration-200"
                style={{
                    filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(227, 178, 60, 0.4))' : 'none'
                }}
            />

            {/* Edge label */}
            {edge.label && (
                <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                        x={-20}
                        y={-8}
                        width={40}
                        height={16}
                        rx={4}
                        fill={palette.surface}
                        stroke={strokeColor}
                        strokeWidth={1}
                        opacity={0.9}
                    />
                    <text
                        x={0}
                        y={0}
                        fill={palette.text}
                        fontSize="10"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none font-medium"
                    >
                        {edge.label}
                    </text>
                </g>
            )}
        </g>
    );
};

const Cluster: React.FC<{
    cluster: NetworkCluster,
    onClick?: () => void
}> = ({ cluster, onClick }) => {
    if (!cluster.centroid) return null;

    const nodeCount = cluster.nodes.length;
    const radius = Math.max(30, Math.sqrt(nodeCount) * 15);

    return (
        <g onClick={onClick} className="cursor-pointer">
            <circle
                cx={cluster.centroid.x}
                cy={cluster.centroid.y}
                r={radius}
                fill={cluster.color}
                fillOpacity={0.1}
                stroke={cluster.color}
                strokeWidth={2}
                strokeDasharray="5 5"
            />
            <text
                x={cluster.centroid.x}
                y={cluster.centroid.y - radius - 10}
                fill={cluster.color}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                className="pointer-events-none"
            >
                {cluster.label} ({nodeCount})
            </text>
        </g>
    );
};

const LoadingIndicator: React.FC = () => (
    <div className="absolute top-4 right-4 bg-base-dark p-2 rounded-md border border-border-dark">
        <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-[var(--color-text)]">Loading network...</span>
        </div>
    </div>
);

const Tooltip: React.FC<{ node: NetworkNode }> = ({ node }) => {
    const { t } = useTranslation();
    const yOffset = node.y - nodeDimensions.height / 2 - 10;
    const xOffset = node.x;

    return (
        <g transform={`translate(${xOffset}, ${yOffset})`} style={{ pointerEvents: 'none' }}>
            <foreignObject x={-125} y={-80} width={250} height={75}>
                 <div className="bg-base-dark p-2 rounded-md border border-border-dark text-center shadow-lg text-xs">
                     <p className="font-bold text-[var(--color-text)]">{node.cvr ? t('person.network.tooltip.cvr', { cvr: node.cvr }) : t('person.network.tooltip.personFallback')}</p>
                     <p className="text-[var(--color-text-muted)] mt-1">{node.notes}</p>
                     {node.ai && (
                         <div className="text-xs text-[var(--color-text-muted)] mt-2">
                             <div><strong>{t('person.network.ai.score')}:</strong> {typeof node.ai.score === 'number' ? `${node.ai.score}` : '—'}</div>
                             <div><strong>{t('person.network.ai.sentiment')}:</strong> {node.ai.sentiment ?? '—'}</div>
                             <div><strong>{t('person.network.ai.category')}:</strong> {node.ai.category ?? '—'}</div>
                             <div><strong>{t('person.network.ai.generatedAt')}:</strong> {node.ai.generatedAt ? new Date(node.ai.generatedAt).toLocaleString() : '—'}</div>
                             <div><strong>{t('person.network.ai.source')}:</strong> {node.ai.source ?? '—'}</div>
                         </div>
                     )}
                 </div>
            </foreignObject>
               <path d={`M -5 -5 L 0 0 L 5 -5`} fill={palette.surface} stroke={palette.border} strokeWidth={1} transform={`translate(0, -5)`}/>
        </g>
    )
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
    nodes: allNodes,
    edges: allEdges,
    onNodeClick,
    onEdgeClick,
    enableClustering = true,
    enableVirtualization = true,
    maxNodesToShow: _maxNodes = 50
}) => {
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [aiMap, setAiMap] = useState<Record<string, any>>({});
    const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
        x: 0, y: 0, width: 700, height: 400
    });

    // AI UI controls
    const [aiSensitivity, setAiSensitivity] = useState<number>(1);
    const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set(['economy','risk','legal','social','governance','socmint','other']));
    const toggleCategory = useCallback((cat: string) => {
        setEnabledCategories(prev => {
            const next = new Set(Array.from(prev));
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    }, []);

    // Tenant / RBAC (use optional tenant hook to avoid throwing in tests)
    const tenantCtx = useOptionalTenant();
    const canUseAi = tenantCtx ? tenantCtx.hasPermission('ai:use') : false;
    const tenant = tenantCtx?.tenant ?? null;

    // AI overlay toggle persisted per tenant
    const AI_PREF_KEY = `ui:ai-overlays-enabled:${tenant?.id ?? 'global'}`;
    const isLocalStorageAvailable = () => {
        try { return typeof window !== 'undefined' && !!window.localStorage; } catch { return false; }
    };

    const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
        try {
            const raw = isLocalStorageAvailable() ? window.localStorage.getItem(AI_PREF_KEY) : null;
            return raw === 'true';
        } catch { return false; }
    });

    useEffect(() => {
        if (!isLocalStorageAvailable()) return;
        try { window.localStorage.setItem(AI_PREF_KEY, String(aiEnabled)); } catch { /* storage unavailable */ }
    }, [aiEnabled, AI_PREF_KEY]);

    // When enabling AI overlays, trigger analysis (only if allowed)
    useEffect(() => {
        if (!aiEnabled) return;
        if (!canUseAi) return;

        (async () => {
            try {
                await aiService.analyzeWholeGraph(allNodes, allEdges, tenant?.aiKey ?? undefined);
            } catch (e) {
                console.warn('Analyze whole graph failed', e);
            }
        })();
    }, [aiEnabled, canUseAi, allNodes, allEdges, tenant?.aiKey]);

    // Use lazy loading for large networks (batchSize can be adjusted based on maxNodesToShow)
    const {
        nodes: processedNodes,
        edges: processedEdges,
        loadingState,
        loadMoreNodes: _loadMore // eslint-disable-line @typescript-eslint/no-unused-vars
    } = useLazyNetworkLoading(allNodes, allEdges, Math.min(20, _maxNodes));

    const clusters = useMemo((): NetworkCluster[] => {
        if (!enableClustering) return [];

        const clusterMap = new Map<string, NetworkCluster>();
        const colorIndex = 0;

        processedNodes.forEach(node => {
            const clusterId = node.clusterId || 'default';
            if (!clusterMap.has(clusterId)) {
                clusterMap.set(clusterId, {
                    id: clusterId,
                    label: clusterId.charAt(0).toUpperCase() + clusterId.slice(1),
                    color: clusterColors[colorIndex % clusterColors.length],
                    nodes: [],
                    centroid: { x: 0, y: 0 }
                });
            }
            clusterMap.get(clusterId)!.nodes.push(node.id);
        });

        // Calculate centroids
        clusterMap.forEach(cluster => {
            const clusterNodes = processedNodes.filter(n => cluster.nodes.includes(n.id));
            if (clusterNodes.length > 0) {
                cluster.centroid = {
                    x: clusterNodes.reduce((sum, n) => sum + n.x, 0) / clusterNodes.length,
                    y: clusterNodes.reduce((sum, n) => sum + n.y, 0) / clusterNodes.length
                };
            }
        });

        return Array.from(clusterMap.values());
    }, [processedNodes, enableClustering]);

    const findNode = useCallback((id: string) => processedNodes.find(n => n.id === id), [processedNodes]);

    const handleNodeClick = useCallback((node: NetworkNode) => {
        setSelectedNodeId(node.id);
        onNodeClick?.(node);
    }, [onNodeClick]);

    const handleEdgeClick = useCallback((edge: NetworkEdge) => {
        onEdgeClick?.(edge);
    }, [onEdgeClick]);

    // Virtualization setup
    const visibleNodes = useMemo(() => {
        if (!enableVirtualization) return processedNodes;

        return processedNodes.filter(node =>
            node.x >= viewportBounds.x &&
            node.x <= viewportBounds.x + viewportBounds.width &&
            node.y >= viewportBounds.y &&
            node.y <= viewportBounds.y + viewportBounds.height
        );
    }, [processedNodes, viewportBounds, enableVirtualization]);

    const handleViewportChange = useCallback((bounds: ViewportBounds) => {
        setViewportBounds(bounds);
    }, []);

    // Subscribe to AI analysis service updates and merge results into AI map
    useEffect(() => {
        const unsub = aiService.subscribeToNetworkAnalysis((entry) => {
            setAiMap(prev => ({ ...prev, [entry.id]: entry }));
        });

        // Hydrate aiMap from cache on mount
        try {
            const cached = allNodes
                .map(n => ({ id: n.id, entry: aiService.getCachedAnalysis(n.id) }))
                .filter(x => x.entry)
                .reduce((acc, cur) => ({ ...acc, [cur.id]: cur.entry }), {} as Record<string, any>);
            if (Object.keys(cached).length > 0) setAiMap(cached);
        } catch (e) { /* ignore */ }

        return () => unsub();
    }, [allNodes]);

    // Merge AI data into nodes for rendering
    const nodesWithAi = useMemo(() => processedNodes.map(n => ({ ...n, ai: aiMap[n.id] ?? n.ai })), [processedNodes, aiMap]);

    return (
        <div className="relative w-full h-full bg-base-darker rounded-lg overflow-hidden">
            {loadingState.isLoading && <LoadingIndicator />}

                    {/* AI controls (top-right) */}
                    <div className="absolute top-4 right-4 z-20 bg-base-dark p-2 rounded-md border border-border-dark">
                        <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-300">AI overlay</div>
                            <label className={`inline-flex relative items-center cursor-pointer ${!canUseAi ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input type="checkbox" className="sr-only peer" checked={aiEnabled && canUseAi} onChange={() => { if (!canUseAi) return; setAiEnabled(v=>!v); }} aria-label="Toggle AI overlays" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary relative" />
                            </label>
                        </div>

                        <div className="mt-2">
                            <label className="text-xs text-gray-400">Score sensitivity</label>
                            <input type="range" min="0" max="2" step="0.1" value={(window as any).__aiSensitivity ?? 1} onChange={(e)=>{ const v = Number(e.target.value); (window as any).__aiSensitivity = v; setAiSensitivity(v); }} className="w-full" aria-label="AI sensitivity" />
                        </div>

                        <div className="mt-2 text-xs text-gray-300">Categories</div>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                            {['economy','risk','legal','social','governance','socmint','other'].map(cat => (
                                <label key={cat} className="flex items-center space-x-2 text-xs"><input type="checkbox" checked={enabledCategories.has(cat)} onChange={() => toggleCategory(cat)} /> <span>{cat}</span></label>
                            ))}
                        </div>
                    </div>

            <svg
                width="100%"
                height="400"
                viewBox="0 0 700 400"
                className="bg-base-darker"
                onWheel={(e) => {
                    // Handle zoom/pan for viewport bounds
                    handleViewportChange({
                        ...viewportBounds,
                        x: Math.max(0, viewportBounds.x + (e.deltaX * 0.1)),
                        y: Math.max(0, viewportBounds.y + (e.deltaY * 0.1))
                    });
                }}
            >
                {/* Render clusters */}
                {enableClustering && clusters.map(cluster => (
                    <Cluster key={cluster.id} cluster={cluster} />
                ))}

                {/* Render edges */}
                {processedEdges.map((edge, i) => {
                    const fromNode = findNode(edge.from);
                    const toNode = findNode(edge.to);
                    if (!fromNode || !toNode) return null;

                    return (
                        <Edge
                            key={i}
                            edge={edge}
                            fromNode={fromNode}
                            toNode={toNode}
                            onClick={() => handleEdgeClick(edge)}
                            aiEnabled={aiEnabled && canUseAi}
                            enabledCategories={enabledCategories}
                        />
                    );
                })}

                {/* Render nodes */}
                {enableVirtualization ? visibleNodes.map(node => (
                    <Node
                        key={node.id}
                        node={{ ...node, ai: (nodesWithAi.find(n=>n.id===node.id)?.ai) ?? node.ai }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleNodeClick(node)}
                        scale={selectedNodeId === node.id ? 1.1 : 1}
                        aiEnabled={aiEnabled && canUseAi}
                        aiSensitivity={aiSensitivity}
                        enabledCategories={enabledCategories}
                    />
                )) : nodesWithAi.map(node => (
                    <Node
                        key={node.id}
                        node={node}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleNodeClick(node)}
                        scale={selectedNodeId === node.id ? 1.1 : 1}
                        aiEnabled={aiEnabled && canUseAi}
                        aiSensitivity={aiSensitivity}
                        enabledCategories={enabledCategories}
                    />
                ))}

                {/* Render tooltip */}
                {hoveredNodeId && <Tooltip node={processedNodes.find(n => n.id === hoveredNodeId)!} />}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-base-dark p-3 rounded-md border border-border-dark text-xs">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.gold }}></div><span>Active</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.textMuted }}></div><span>Inactive</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded" style={{ background: palette.danger }}></div><span>High Risk</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded" style={{ background: palette.warning }}></div><span>Medium Risk</span></div>

                    {/* AI categories */}
                    <div className="col-span-2 mt-2 font-semibold">AI categories</div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.warning }}></div><span>Economy</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.danger }}></div><span>Risk</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.deepBlueLight }}></div><span>Legal</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.info }}></div><span>SOCMINT / Social</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ background: palette.textMuted }}></div><span>Other</span></div>
                </div>
                <div className="mt-2 text-xs text-[var(--color-text-muted)]">AI overlay: {canUseAi ? (aiEnabled ? 'Enabled' : 'Disabled') : 'Not permitted'}</div>
            </div>
        </div>
    );
};
