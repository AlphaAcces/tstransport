import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NetworkNode, NetworkEdge, NetworkCluster, ViewportBounds, NetworkLoadingState } from '../../types';
import { useTranslation } from 'react-i18next';

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
    High: '#e53e3e',
    Medium: '#dd6b20',
    Low: '#d69e2e',
    None: '#2d3748'
};

const typeColors = {
    person: '#00cc66',
    company: '#4a5568',
    historical: '#2d3748',
    property: '#805ad5',
    vehicle: '#3182ce',
    account: '#38a169',
    external: '#e53e3e'
};

const statusColors = {
    active: '#00cc66',
    inactive: '#a0aec0',
    suspended: '#e53e3e'
};

const clusterColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
];

const Node: React.FC<{
    node: NetworkNode,
    onMouseEnter: () => void,
    onMouseLeave: () => void,
    onClick?: () => void,
    scale?: number
}> = ({ node, onMouseEnter, onMouseLeave, onClick, scale = 1 }) => {
    const riskColor = riskColors[node.riskLevel] || riskColors.None;
    const typeColor = typeColors[node.type] || typeColors.company;
    const statusColor = statusColors[node.status || 'active'];
    const isHighlighted = node.isHighlighted;

    const width = nodeDimensions.width * (node.size || 1) * scale;
    const height = nodeDimensions.height * (node.size || 1) * scale;

    return (
        <g
            transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className="cursor-pointer transition-all duration-200"
            style={{
                filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(0, 204, 102, 0.6))' : 'none',
                opacity: node.status === 'inactive' ? 0.6 : 1
            }}
        >
            {/* Status indicator */}
            <circle
                cx={width - 8}
                cy={8}
                r={4}
                fill={statusColor}
                stroke="#1a1c20"
                strokeWidth={1}
            />

            {/* Main node rectangle */}
            <rect
                width={width}
                height={height}
                rx={nodeDimensions.radius}
                ry={nodeDimensions.radius}
                fill="#1a1c20"
                stroke={riskColor}
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
                fill="#e2e8f0"
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
                fill="#a0aec0"
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
                    fill="#4a5568"
                    stroke="#1a1c20"
                    strokeWidth={1}
                />
            )}
            {node.connections && node.connections > 1 && (
                <text
                    x={8}
                    y={height - 8}
                    fill="#e2e8f0"
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
    onClick?: () => void
}> = ({ edge, fromNode, toNode, onClick }) => {
    const isHighlighted = edge.isHighlighted;
    const strokeWidth = Math.max(1, (edge.weight || 1) * 1.5);
    const strokeColor = edge.type === 'historical'
        ? (isHighlighted ? "#00cc66" : "#4a5568")
        : (isHighlighted ? "#00cc66" : "#718096");

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
                    filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(0, 204, 102, 0.4))' : 'none'
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
                        fill="#1a1c20"
                        stroke={strokeColor}
                        strokeWidth={1}
                        opacity={0.9}
                    />
                    <text
                        x={0}
                        y={0}
                        fill="#e2e8f0"
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
            <span className="text-sm text-gray-300">Loading network...</span>
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
                     <p className="font-bold text-gray-300">{node.cvr ? t('person.network.tooltip.cvr', { cvr: node.cvr }) : t('person.network.tooltip.personFallback')}</p>
                     <p className="text-gray-400 mt-1">{node.notes}</p>
                 </div>
            </foreignObject>
             <path d={`M -5 -5 L 0 0 L 5 -5`} fill="#121418" stroke="#2d3748" strokeWidth={1} transform={`translate(0, -5)`}/>
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
    const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
        x: 0, y: 0, width: 700, height: 400
    });

    // Use lazy loading for large networks (batchSize can be adjusted based on maxNodesToShow)
    const {
        nodes: processedNodes,
        edges: processedEdges,
        loadingState,
        loadMoreNodes: _loadMore
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

    return (
        <div className="relative w-full h-full bg-base-darker rounded-lg overflow-hidden">
            {loadingState.isLoading && <LoadingIndicator />}

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
                        />
                    );
                })}

                {/* Render nodes */}
                {enableVirtualization ? visibleNodes.map(node => (
                    <Node
                        key={node.id}
                        node={node}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleNodeClick(node)}
                        scale={selectedNodeId === node.id ? 1.1 : 1}
                    />
                )) : processedNodes.map(node => (
                    <Node
                        key={node.id}
                        node={node}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleNodeClick(node)}
                        scale={selectedNodeId === node.id ? 1.1 : 1}
                    />
                ))}

                {/* Render tooltip */}
                {hoveredNodeId && <Tooltip node={processedNodes.find(n => n.id === hoveredNodeId)!} />}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-base-dark p-3 rounded-md border border-border-dark text-xs">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span>Inactive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>High Risk</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-yellow-500"></div>
                        <span>Medium Risk</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
