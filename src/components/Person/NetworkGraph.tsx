import React, { useState } from 'react';
import { NetworkNode, NetworkEdge } from '../../types';

interface NetworkGraphProps {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
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
}

const Node: React.FC<{ node: NetworkNode, onMouseEnter: () => void, onMouseLeave: () => void }> = ({ node, onMouseEnter, onMouseLeave }) => {
    const riskColor = riskColors[node.riskLevel] || riskColors.None;
    const typeColor = typeColors[node.type] || typeColors.company;

    return (
        <g 
            transform={`translate(${node.x - nodeDimensions.width / 2}, ${node.y - nodeDimensions.height / 2})`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="cursor-pointer"
        >
            <rect 
                width={nodeDimensions.width} 
                height={nodeDimensions.height} 
                rx={nodeDimensions.radius} 
                ry={nodeDimensions.radius}
                fill="#1a1c20"
                stroke={riskColor}
                strokeWidth={2}
            />
             <rect 
                width={5} 
                height={nodeDimensions.height} 
                fill={typeColor}
                rx={nodeDimensions.radius} 
                ry={nodeDimensions.radius}
                clipPath={`inset(0 ${nodeDimensions.width - 5}px 0 0 round ${nodeDimensions.radius}px)`}
            />
            <text x={20} y={25} fill="#e2e8f0" fontSize="14" fontWeight="bold">{node.label}</text>
            <text x={20} y={45} fill="#a0aec0" fontSize="12" className="font-mono">{node.sublabel}</text>
        </g>
    );
};

const Tooltip: React.FC<{ node: NetworkNode }> = ({ node }) => {
    const yOffset = node.y - nodeDimensions.height / 2 - 10;
    const xOffset = node.x;

    return (
        <g transform={`translate(${xOffset}, ${yOffset})`} style={{ pointerEvents: 'none' }}>
            <foreignObject x={-125} y={-80} width={250} height={75}>
                 <div className="bg-base-dark p-2 rounded-md border border-border-dark text-center shadow-lg text-xs">
                     <p className="font-bold text-gray-300">{node.cvr ? `CVR: ${node.cvr}` : 'Person'}</p>
                     <p className="text-gray-400 mt-1">{node.notes}</p>
                 </div>
            </foreignObject>
             <path d={`M -5 -5 L 0 0 L 5 -5`} fill="#121418" stroke="#2d3748" strokeWidth={1} transform={`translate(0, -5)`}/>
        </g>
    )
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, edges }) => {
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    const findNode = (id: string) => nodes.find(n => n.id === id);

    return (
        <svg width="100%" height="400" viewBox="0 0 700 400">
            {edges.map((edge, i) => {
                const fromNode = findNode(edge.from);
                const toNode = findNode(edge.to);
                if (!fromNode || !toNode) return null;

                return (
                    <line 
                        key={i}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={edge.type === 'historical' ? "#4a5568" : "#718096"}
                        strokeWidth={1.5}
                        strokeDasharray={edge.type === 'historical' ? '4 4' : 'none'}
                    />
                );
            })}
            {nodes.map(node => (
                <Node 
                    key={node.id} 
                    node={node}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                />
            ))}
            {hoveredNodeId && <Tooltip node={nodes.find(n => n.id === hoveredNodeId)!} />}
        </svg>
    );
};