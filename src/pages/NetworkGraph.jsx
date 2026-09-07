import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDevotees } from '../context/DevoteeContext';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

const NetworkGraph = () => {
    const { devotees } = useDevotees();
    const navigate = useNavigate();

    // Auto-Layout Calculation
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes = [];
        const edges = [];

        // 1. Identify Counselors (anyone who is listed as a counselor)
        const counselorNames = [...new Set(devotees.map(d => d.counselor).filter(Boolean))];

        // Helper to find devotee ID by name (fuzzy match)
        const findDevoteeId = (name) => {
            const d = devotees.find(dev =>
                dev.name.toLowerCase() === name.toLowerCase() ||
                (dev.initiatedName && dev.initiatedName.toLowerCase() === name.toLowerCase())
            );
            return d ? d.id : null;
        };

        // 2. Position Counselors (Top Row)
        const spacingX = 250;
        const spacingY = 150; // Vertical gap between counselor and disciple

        counselorNames.forEach((name, index) => {
            // Check if counselor is actually a registered devotee, otherwise create a "Virtual" node
            const realId = findDevoteeId(name);
            const id = realId || `virtual-${name}`;

            // Avoid duplicates if counselor is already added
            if (!nodes.find(n => n.id === id)) {
                nodes.push({
                    id,
                    data: { label: name, isCounselor: true },
                    position: { x: index * spacingX * 2, y: 0 },
                    style: {
                        background: '#ea580c', // Orange-600
                        color: 'white',
                        border: '1px solid #c2410c',
                        borderRadius: '8px',
                        padding: '10px',
                        fontWeight: 'bold',
                        width: 180
                    }
                });
            }

            // 3. Find Disciples for this counselor
            const disciples = devotees.filter(d => d.counselor === name);

            disciples.forEach((disciple, dIndex) => {
                // Determine discple node
                const discipleId = disciple.id;

                // Add Disciple Node provided it's not the counselor themselves
                if (!nodes.find(n => n.id === discipleId)) {
                    nodes.push({
                        id: discipleId,
                        data: { label: disciple.name || disciple.initiatedName, phone: disciple.contact },
                        position: {
                            x: (index * spacingX * 2) + (dIndex % 2 === 0 ? -50 : 50) + (dIndex * 20), // Slight offset
                            y: spacingY + (dIndex * 60)
                        },
                        style: {
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '50px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            width: 'fit-content'
                        }
                    });
                }

                // Add Edge
                edges.push({
                    id: `e-${id}-${discipleId}`,
                    source: id,
                    target: discipleId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                    style: { stroke: '#94a3b8' }
                });
            });
        });

        // Add Orphan Nodes (No counselor) somewhere else
        let orphanY = 600;
        devotees.filter(d => !d.counselor).forEach((d, i) => {
            if (!nodes.find(n => n.id === d.id)) {
                nodes.push({
                    id: d.id,
                    data: { label: d.name },
                    position: { x: (i % 5) * 150, y: orphanY + (Math.floor(i / 5) * 60) },
                    style: { background: '#f1f5f9', color: '#64748b', fontSize: '11px', borderRadius: '4px', border: 'none', padding: '5px' }
                });
            }
        });

        return { nodes, edges };
    }, [devotees]);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    const onNodeClick = useCallback((event, node) => {
        // Navigate to profile if it's a real devotee (not virtual)
        if (!node.id.startsWith('virtual-')) {
            navigate(`/devotees/${node.id}`);
        }
    }, [navigate]);

    return (
        <div className="h-[calc(100vh-100px)] w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="absolute z-10 p-4">
                <h2 className="text-xl font-bold text-slate-900 bg-white dark:bg-slate-900/80 backdrop-blur px-3 py-1 rounded-lg">Network Graph</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/80 backdrop-blur px-3 py-1 rounded-lg mt-1">
                    <span className="text-orange-600 font-bold">●</span> Counselor
                    <span className="text-slate-400 dark:text-slate-500 ml-3">●</span> Disciple
                </p>
            </div>
            <ErrorBoundary>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    fitView
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                    <MiniMap nodeColor="#fda4af" />
                </ReactFlow>
            </ErrorBoundary>
        </div>
    );
};

export default NetworkGraph;
