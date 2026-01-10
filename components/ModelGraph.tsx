'use client';

import React, { useMemo, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    NodeTypes,
    BackgroundVariant,
    MarkerType,
    Handle,
    Position,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ModelInfo, LayerInfo, SchemaNode } from '@/types/model';
import { useTranslations } from 'next-intl';

interface ModelGraphProps {
    modelInfo: ModelInfo;
    currentLayer?: number;
    currentNode?: string;
    currentOp?: string;
    currentInputs?: string;
    onLayerClick?: (layer: LayerInfo) => void;
}

// Custom node component
function ComponentNode({ data }: { data: any }) {
    const isCurrent = data.isCurrent;
    const componentType = data.componentType;

    const getBgColor = () => {
        if (isCurrent) return '#fbbf24';
        switch (componentType) {
            case 'input': return '#e0e7ff';
            case 'embedding': return '#f472b6';
            case 'projection': return '#93c5fd';
            case 'attention_compute': return '#3b82f6';
            case 'attention_norm': return '#c7d2fe';
            case 'gate': return '#86efac';
            case 'up': return '#4ade80';
            case 'down': return '#22c55e';
            case 'activation': return '#fcd34d';
            case 'ffn_norm': return '#d1fae5';
            case 'norm': return '#a78bfa';
            case 'output': return '#fb923c';
            case 'add': return '#fde047';
            case 'cache': return '#a78bfa';
            default: return '#9ca3af';
        }
    };

    const getTextColor = () => {
        const lightBg = ['input', 'attention_norm', 'ffn_norm', 'add', 'projection', 'gate', 'up', 'activation', 'cache'];
        return lightBg.includes(componentType) ? '#1f2937' : '#ffffff';
    };

    // Check if this is a VIEW operation (non-computational)
    const isViewOp = data.op && ['VIEW', 'RESHAPE', 'PERMUTE'].includes(data.op);

    return (
        <div
            className={`
        px-2 py-1.5 rounded cursor-pointer relative shadow-sm
        ${isCurrent ? 'border-yellow-600 ring-2 ring-yellow-400 scale-105' : 'border-gray-400'}
        ${isViewOp ? 'border-dashed border-2 opacity-60' : 'border-2'}
        transition-all duration-200 hover:shadow-md
      `}
            style={{
                backgroundColor: getBgColor(),
                minWidth: data.width || '110px',
                maxWidth: data.width || '110px',
            }}
            onClick={data.onClick}
        >
            <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-gray-400 !border-none !-top-1" />
            <div className="font-semibold text-[10px]" style={{ color: getTextColor() }}>
                {data.label}
            </div>
            {data.sublabel && (
                <div className="text-[8px] opacity-80 truncate" style={{ color: getTextColor() }}>
                    {data.sublabel}
                </div>
            )}
            {isCurrent && data.op && (
                <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[7px] px-1 rounded-sm shadow-sm font-bold animate-pulse">
                    {data.op}
                </div>
            )}
            {data.visitCount && data.visitCount > 1 && (
                <div className="absolute -top-3 -left-2 bg-blue-600 text-white text-[7px] px-1 rounded-full shadow-sm font-bold">
                    ×{data.visitCount}
                </div>
            )}
            <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-gray-400 !border-none !-bottom-1" />
        </div>
    );
}

function HubNode({ data }: { data: any }) {
    return (
        <div className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-600 flex items-center justify-center min-w-[80px]">
            <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-gray-400 !border-none" />
            <Handle type="target" position={Position.Right} id="right-in" className="!w-1.5 !h-1.5 !bg-gray-400 !border-none" />
            {data.label}
            <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-gray-400 !border-none" />
            <Handle type="source" position={Position.Right} id="right-out" className="!w-1.5 !h-1.5 !bg-gray-400 !border-none" />
        </div>
    );
}

const nodeTypes: NodeTypes = {
    component: ComponentNode,
    operator: ComponentNode,
    hub: HubNode,
};

// Helper component to handle auto-focus logic
function ViewportUpdater({ currentLayer, currentNode, nodes }: { currentLayer?: number; currentNode?: string; nodes: Node[] }) {
    const { setCenter } = useReactFlow();

    useEffect(() => {
        if (currentLayer === undefined && !currentNode) return;

        let targetNode = nodes.find(n => n.data.isCurrent);

        if (!targetNode && currentLayer !== undefined) {
            targetNode = nodes.find(n => n.id === `layer_${currentLayer}`);
        }

        if (targetNode) {
            let absX = targetNode.position.x;
            let absY = targetNode.position.y;

            if (targetNode.parentNode) {
                const parent = nodes.find(n => n.id === targetNode.parentNode);
                if (parent) {
                    absX += parent.position.x;
                    absY += parent.position.y;
                }
            }

            setCenter(absX + 55, absY + 20, {
                duration: 600,
                zoom: 1.0,
            });
        }
    }, [currentLayer, currentNode, nodes, setCenter]);

    return null;
}

function ModelGraphInner({ modelInfo, currentLayer, currentNode, currentOp, currentInputs, onLayerClick }: ModelGraphProps) {
    const t = useTranslations('ModelGraph');
    const tCommon = useTranslations('Common');

    const [isLocked, setIsLocked] = React.useState(true);

    // Track visit counts for each node
    const [nodeVisitCounts, setNodeVisitCounts] = React.useState<Map<string, number>>(new Map());



    // Update visit count when currentNode changes
    React.useEffect(() => {
        if (currentNode) {
            setNodeVisitCounts(prev => {
                const newCounts = new Map(prev);
                const count = newCounts.get(currentNode) || 0;
                newCounts.set(currentNode, count + 1);
                return newCounts;
            });
        }
    }, [currentNode]);

    const H_SPACING = 140;
    const V_SPACING = 60;
    const BASE_X = 600;

    const normalizeNodeName = (name: string) => {
        return name
            .replace(/\s*\([^)]*\)/g, '')   // Strip all (annotations)
            .replace(/^L\d+\s+/, '')         // Strip L4 prefix with space
            .replace(/^L\d+(_|\.)/, '')       // Strip L0_ or L0.
            .replace(/^blk\.\d+\./, '')      // Strip blk.0.
            .replace(/(_|\.)l\d+$/, '')      // Strip _l0 or .l0 suffix
            .replace(/-\d+$/, '');           // Strip -0 suffix
    };

    const getMappedRole = (nodeName: string, opName?: string, inputs?: string): string | null => {
        const name = nodeName.toLowerCase();
        const op = opName?.toUpperCase() || '';

        if (name.includes('attn_norm') || name === 'norm-0' || (op === 'RMS_NORM' && !name.includes('ffn') && !name.includes('q') && !name.includes('k'))) return 'attention_norm';
        if (name.includes('ffn_norm') || name === 'norm-1' || (op === 'RMS_NORM' && name.includes('ffn'))) return 'ffn_norm';
        if (name.includes('q_norm') || (op === 'RMS_NORM' && name.includes('q'))) return 'attention_norm';
        if (name.includes('k_norm') || (op === 'RMS_NORM' && name.includes('k'))) return 'attention_norm';

        if (name.includes('attn_q') || name === 'mul_mat-0' || name.includes('q_proj') || name.includes('qcur')) return 'projection';
        if (name.includes('attn_k') || name === 'mul_mat-1' || name.includes('k_proj') || name.includes('kcur')) return 'projection';
        if (name.includes('attn_v') || name === 'mul_mat-2' || name.includes('v_proj') || name.includes('vcur')) return 'projection';
        if (name.includes('attn_o') || name === 'mul_mat-3' || name.includes('o_proj')) return 'projection';
        if (name.includes('ffn_gate') || name === 'mul_mat-4' || name.includes('gate_proj')) return 'gate';
        if (name.includes('ffn_up') || name === 'mul_mat-5' || name.includes('up_proj')) return 'up';
        if (name.includes('ffn_down') || name === 'mul_mat-6' || name.includes('down_proj')) return 'down';

        if (name.includes('rope') || op === 'ROPE') return 'attention_compute';
        if (name.includes('soft_max') || name.includes('softmax') || op === 'SOFT_MAX' || name.includes('fattn')) return 'attention_compute';
        if (name.includes('silu') || op === 'SILU') return 'activation';
        if (name.includes('mul') || (op === 'MUL' && (name.includes('ffn') || name.includes('node')))) return 'attention_compute';

        if (op === 'ADD') return 'add';
        if (name.includes('cache') || name.includes('kv') || name.includes('k_l') || name.includes('v_l')) return 'cache';
        if (name.startsWith('node_') || name.startsWith('tensor_')) return 'intermediate';

        return null;
    };

    const getTensorLabel = (layerIdx: number, role: string, fallback: string) => {
        const layer = modelInfo.layers.find(l => l.index === layerIdx);
        const tensor = layer?.tensors?.find(t => t.role === role);
        return tensor ? `[${tensor.shape.join(', ')}]` : fallback;
    };

    const getGlobalTensorLabel = (role: string, fallback: string) => {
        const tensor = modelInfo.weights?.find(t => t.role === role);
        return tensor ? `[${tensor.shape.join(', ')}]` : fallback;
    };

    const style_group = (isCurrent: boolean, height: number = 900) => ({
        width: 1400,
        height: height,
        backgroundColor: isCurrent ? 'rgba(251, 191, 36, 0.05)' : 'rgba(243, 244, 246, 0.5)',
        border: isCurrent ? '3px solid #fbbf24' : '1px solid #d1d5db',
        boxShadow: isCurrent ? '0 0 20px rgba(251, 191, 36, 0.2)' : 'none',
        borderRadius: '12px',
        zIndex: -1,
    });

    const layerSpecificSchema = useMemo(() => {
        if (!modelInfo.layer_schema || currentLayer === undefined) return [];

        return modelInfo.layer_schema.filter(node => {
            const name = node.name;

            // Special case: inp_embd is global, only show in Layer 0
            if (name === 'inp_embd') {
                return currentLayer === 0;
            }

            // Standard case: check if node name ends with -${currentLayer}
            // Examples: norm-0, Qcur-0, l_out-0 for Layer 0
            const suffix = `-${currentLayer}`;
            return name.endsWith(suffix);
        });
    }, [modelInfo.layer_schema, currentLayer]);

    const generateDynamicLayerNodes = (layerIdx: number, schema: SchemaNode[], yBase: number) => {
        const layerNodes: Node[] = [];
        const prefix = `layer_common`;

        // --- 1. Architectural Abstraction Pre-processing ---

        // We define "Fused Blocks" that represent architectural concepts
        interface FusedBlock {
            id: string;
            label: string;
            originalNodes: string[];
            op: string;
            role: string;
            inputs: string[];
        }

        // --- 1. Use Original Schema Nodes (NO FUSION) ---
        // Use all schema nodes from the filtered layer
        const activeNodes: SchemaNode[] = schema;

        // --- 2. Build Dependency Graph for Original Nodes ---
        const nodeMap = new Map<string, SchemaNode>();
        const nameToAbstract = new Map<string, string>(); // For compatibility, maps node to itself

        activeNodes.forEach(node => {
            nodeMap.set(node.name, node);
            nameToAbstract.set(node.name, node.name); // Identity mapping (no abstraction)
        });

        // DEBUG: Log nameToAbstract mapping (should be identity now)
        if (typeof window !== 'undefined' && layerIdx === (currentLayer || 0)) {
            console.log('=== Using Original Nodes (No Fusion) ===');
            console.log(`Total nodes: ${activeNodes.length}`);
        }

        // Resolve dependencies between nodes
        const adj = new Map<string, string[]>();
        const inDegree = new Map<string, number>();
        const virtualNodes = new Set<string>();

        activeNodes.forEach(node => {
            const nodeId = node.name;
            if (!inDegree.has(nodeId)) inDegree.set(nodeId, 0);

            node.inputs.forEach(rawInput => {
                const trimmed = rawInput.trim();
                if (!trimmed) return;

                // Only strip annotations like (view), (permuted), but keep the base name intact
                const cleanedInput = trimmed.replace(/\s*\([^)]*\)/g, '').trim();

                // Try to find exact match first
                const sourceNode = activeNodes.find(n => n.name === cleanedInput);

                if (sourceNode) {
                    // Internal edge between two operators
                    if (sourceNode.name !== nodeId) {
                        adj.set(sourceNode.name, [...(adj.get(sourceNode.name) || []), nodeId]);
                        inDegree.set(nodeId, (inDegree.get(nodeId) || 0) + 1);
                    }
                } else {
                    // External input (weight or cache)
                    // Create virtual node for dependency tracking
                    const extId = `ext_${cleanedInput}`;
                    if (!virtualNodes.has(cleanedInput) && !nodeMap.has(cleanedInput)) {
                        virtualNodes.add(cleanedInput);
                        inDegree.set(extId, 0);
                    }
                    adj.set(extId, [...(adj.get(extId) || []), nodeId]);
                    inDegree.set(nodeId, (inDegree.get(nodeId) || 0) + 1);
                }
            });
        });

        // DEBUG: Log dependency resolution details
        if (typeof window !== 'undefined' && layerIdx === (currentLayer || 0)) {
            console.log('=== Dependency Resolution (Layer', layerIdx, ') ===');
            console.log(`Active nodes: ${activeNodes.length}`);
            console.log(`Virtual nodes created: ${virtualNodes.size}`);
            console.log('Sample virtual nodes:', Array.from(virtualNodes).slice(0, 10));

            // Check for problematic inputs
            const emptyInputs: string[] = [];
            activeNodes.forEach(node => {
                node.inputs.forEach(inp => {
                    const cleaned = inp.replace(/\s*\([^)]*\)/g, '').trim();
                    if (!cleaned) {
                        emptyInputs.push(`${node.name} has empty input: "${inp}"`);
                    }
                });
            });
            if (emptyInputs.length > 0) {
                console.warn('Found empty inputs:', emptyInputs);
            }
        }

        // --- 3. Ranking ---
        const ranks = new Map<string, number>();
        const queue: string[] = [];
        inDegree.forEach((degree, id) => { if (degree === 0) queue.push(id); });

        queue.forEach(q => ranks.set(q, 0));
        while (queue.length > 0) {
            const current = queue.shift()!;
            const r = ranks.get(current) || 0;
            (adj.get(current) || []).forEach(next => {
                const nextRank = Math.max(ranks.get(next) || 0, r + 1);
                ranks.set(next, nextRank);
                inDegree.set(next, inDegree.get(next)! - 1);
                if (inDegree.get(next) === 0) queue.push(next);
            });
        }

        // Cleanup ranking
        nodeMap.forEach((_, id) => { if (!ranks.has(id)) ranks.set(id, 0); });

        // Special handling for virtual nodes (cache):
        // Place them at the same rank as their consumer nodes for better layout
        virtualNodes.forEach(v => {
            const extId = `ext_${v}`;
            const consumers = adj.get(extId) || [];
            if (consumers.length > 0) {
                // Place virtual node at the same rank as its first consumer
                const consumerRank = ranks.get(consumers[0]) || 0;
                ranks.set(extId, consumerRank);
            } else {
                ranks.set(extId, 0);
            }
        });

        // DEBUG: Log topological ranks
        if (typeof window !== 'undefined' && layerIdx === (currentLayer || 0)) {
            console.log('=== Topological Ranks (Layer', layerIdx, ') ===');
            const sortedRanks = Array.from(ranks.entries()).sort((a, b) => a[1] - b[1]);
            sortedRanks.forEach(([id, rank]) => {
                const node = nodeMap.get(id);
                const label = node ? ('label' in node ? node.label : node.name) : id;
                console.log(`  Rank ${rank}: ${id} (${label})`);
            });
        }

        // --- 4. Compact Grid Layout ---
        const layerWidth = 1400;
        const V_STEP = 120; // Reduced for compactness

        const rankGroups = new Map<number, string[]>();
        ranks.forEach((rank, id) => {
            rankGroups.set(rank, [...(rankGroups.get(rank) || []), id]);
        });

        rankGroups.forEach((ids, rank) => {
            // FIRST: Filter to get only nodes that will actually be rendered
            const renderableNodes = ids.filter(id => {
                if (id.startsWith('ext_')) {
                    // Only cache nodes, not weights
                    return id.includes('cache');
                }
                // All regular nodes
                return true;
            });

            // Sort for consistent ordering
            renderableNodes.sort((a, b) => {
                const aIsCache = a.startsWith('ext_');
                const bIsCache = b.startsWith('ext_');
                if (aIsCache && !bIsCache) return -1;
                if (!aIsCache && bIsCache) return 1;
                return a.localeCompare(b);
            });

            // Calculate spacing based on ACTUAL rendered node count
            const nodeCount = renderableNodes.length;
            const spacing = 180; // Fixed spacing for consistency
            const totalWidth = nodeCount * spacing;
            const startX = (layerWidth - totalWidth) / 2 + spacing / 2;

            renderableNodes.forEach((id, i) => {
                const x = startX + i * spacing;
                const y = 100 + rank * V_STEP;

                // Check if it's a virtual node (cache)
                if (id.startsWith('ext_')) {
                    const label = id.replace('ext_', '');
                    const role = getMappedRole(label);
                    const isCurrentVirtual = isCurrent(label);

                    layerNodes.push({
                        id: `${prefix}_op_${id}`,
                        parentNode: prefix,
                        type: 'component',
                        position: { x, y },
                        data: {
                            label,
                            componentType: role || 'cache',
                            isVirtual: true,
                            isCurrent: isCurrentVirtual,
                            visitCount: nodeVisitCounts.get(label)
                        }
                    });
                } else {
                    // Regular node
                    const node = nodeMap.get(id);
                    if (!node) return;

                    const label = node.name;
                    const op = node.op;
                    const isCurrentBlock = isCurrent(label);
                    const role = getMappedRole(label, op);

                    layerNodes.push({
                        id: `${prefix}_op_${id}`,
                        parentNode: prefix,
                        type: 'component',
                        position: { x, y },
                        data: {
                            label,
                            componentType: role || 'projection',
                            isCurrent: isCurrentBlock,
                            visitCount: nodeVisitCounts.get(label),
                            op: isCurrentBlock ? op : undefined
                        }
                    });
                }
            });
        });

        // Heuristic Helpers for edges
        const firstAbstractNodes = Array.from(new Set(Array.from(nameToAbstract.values()))).filter(id => {
            const node = nodeMap.get(id);
            return node && (node.inputs.some(i => i.includes('l_out-') || i.includes('token')) || node.inputs.length === 0);
        });

        const lastAbstractNodes = Array.from(new Set(Array.from(nameToAbstract.values()))).filter(id => {
            return !(adj.get(id) || []).some(next => !next.startsWith('ext_'));
        });

        const maxRank = Math.max(0, ...Array.from(rankGroups.keys()));
        const exitY = 150 + (maxRank + 1) * V_STEP;

        // Entry/Exit Hubs
        layerNodes.push({
            id: `${prefix}_entry`, parentNode: prefix, type: 'hub', position: { x: layerWidth / 2 - 40, y: 40 }, data: { label: t('layerEntry') }
        });
        layerNodes.push({
            id: `${prefix}_exit`, parentNode: prefix, type: 'hub', position: { x: layerWidth / 2 - 40, y: exitY }, data: { label: t('layerExit') }
        });

        return { nodes: layerNodes, height: exitY + 100, nameToAbstract, firstAbstractNodes, lastAbstractNodes };

        function isCurrent(label: string) {
            return currentNode === label || (currentNode && normalizeNodeName(currentNode) === normalizeNodeName(label));
        }
    };

    const nodes: Node[] = useMemo(() => {
        const result: Node[] = [];
        let yOffset = 0;

        // Input
        result.push({
            id: 'input',
            type: 'component',
            position: { x: BASE_X - 55, y: yOffset },
            data: { label: t('inputTokens'), componentType: 'input', isCurrent: false, onClick: () => { } },
        });
        yOffset += V_SPACING + 20;

        // Token Embedding
        result.push({
            id: 'token_embedding',
            type: 'component',
            position: { x: BASE_X - 55, y: yOffset },
            data: {
                label: t('tokenEmbedding'),
                sublabel: getGlobalTensorLabel('tok_embd', `[seq, ${modelInfo.n_embd}]`),
                componentType: 'embedding',
                isCurrent: false,
                onClick: () => { },
            },
        });
        yOffset += V_SPACING + 40;

        // Transformer Layer Group (Single instance for all layers)
        const displayLayerIdx = currentLayer !== undefined ? currentLayer : 0;
        const prefix = `layer_common`;

        if (layerSpecificSchema.length > 0) {
            const { nodes: layerNodes, height, nameToAbstract, firstAbstractNodes, lastAbstractNodes } = generateDynamicLayerNodes(displayLayerIdx, layerSpecificSchema, yOffset);

            result.push({
                id: prefix,
                type: 'group',
                position: { x: BASE_X - 700, y: yOffset },
                data: { label: t('layerTitle', { index: displayLayerIdx + 1, total: modelInfo.n_layers }) },
                style: style_group(true, height),
            });

            // Explicit indicator node inside the group
            result.push({
                id: `${prefix}_title`,
                parentNode: prefix,
                type: 'default',
                position: { x: 20, y: 15 },
                data: { label: t('layerTitle', { index: displayLayerIdx + 1, total: modelInfo.n_layers }) },
                style: {
                    width: 200,
                    fontSize: '14px',
                    fontWeight: '800',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#fbbf24',
                    pointerEvents: 'none',
                },
                draggable: false,
                selectable: false,
            });

            result.push(...layerNodes);
            yOffset += height + 50;
        } else {
            // Static Fallback
            result.push({
                id: prefix,
                type: 'group',
                position: { x: BASE_X - 500, y: yOffset },
                data: { label: t('layerTitle', { index: displayLayerIdx + 1, total: modelInfo.n_layers }) },
                style: style_group(true, 900),
            });
            yOffset += 900 + 50;
        }

        // Final Norm
        result.push({
            id: 'final_norm',
            type: 'component',
            position: { x: BASE_X - 55, y: yOffset },
            data: {
                label: t('finalNorm'),
                sublabel: getGlobalTensorLabel('output_norm', `[seq, ${modelInfo.n_embd}]`),
                componentType: 'norm',
                isCurrent: false,
                onClick: () => { },
            },
        });
        yOffset += V_SPACING + 40;

        // Output
        result.push({
            id: 'output',
            type: 'component',
            position: { x: BASE_X - 55, y: yOffset },
            data: {
                label: t('outputProj'),
                sublabel: getGlobalTensorLabel('output', `[seq, ${modelInfo.n_vocab}]`),
                componentType: 'output',
                isCurrent: false,
                onClick: () => { },
            },
        });

        return result;
        return result;
    }, [modelInfo.layers, currentLayer, currentNode, currentOp, layerSpecificSchema, modelInfo.n_layers, modelInfo.n_embd, modelInfo.n_vocab, t]);

    // Track abstract mapping for edges
    const abstractData = useMemo(() => {
        if (layerSpecificSchema.length === 0) return { nameToAbstract: new Map<string, string>(), first: [] as string[], last: [] as string[] };
        const { nameToAbstract, firstAbstractNodes, lastAbstractNodes } = generateDynamicLayerNodes(currentLayer || 0, layerSpecificSchema, 0);
        return { nameToAbstract, first: firstAbstractNodes, last: lastAbstractNodes };
    }, [layerSpecificSchema, currentLayer]);

    const edges: Edge[] = useMemo(() => {
        const result: Edge[] = [];
        const style = (isCurrent: boolean) => ({
            stroke: isCurrent ? '#fbbf24' : '#9ca3af',
            strokeWidth: isCurrent ? 3 : 1.5,
            transition: 'all 0.3s ease',
        });
        const arrow = (isCurrent: boolean) => ({
            type: MarkerType.ArrowClosed,
            color: isCurrent ? '#fbbf24' : '#9ca3af',
        });
        const labelStyle = { fill: '#9ca3af', fontSize: 10, fontWeight: 500 };

        // Input to Embedding
        result.push({ id: 'in_to_embd', source: 'input', target: 'token_embedding', animated: true, style: style(false), markerEnd: arrow(false) });

        const prefix = `layer_common`;
        if (layerSpecificSchema.length > 0) {
            const schema: SchemaNode[] = layerSpecificSchema;
            const { nameToAbstract, first, last } = abstractData;

            // Internal and Virtual Edges using the Abstract Mapping
            const edgeSet = new Set<string>(); // Track unique edges to avoid duplicates

            schema.forEach((node: SchemaNode) => {
                const targetId = nameToAbstract.get(node.name);
                if (!targetId) return;

                // Separate inputs into data sources and weights
                const dataInputs: string[] = [];
                const weightInputs: string[] = [];

                node.inputs.forEach(input => {
                    const trimmed = input.trim();
                    if (!trimmed) return;

                    const cleaned = trimmed.replace(/\s*\([^)]*\)/g, '').trim();

                    // Check if it's a weight (contains 'weight' or 'blk.')
                    if (cleaned.includes('weight') || cleaned.includes('blk.')) {
                        weightInputs.push(cleaned);
                    } else {
                        dataInputs.push(cleaned);
                    }
                });

                // Create edges from data inputs
                dataInputs.forEach(cleanedInput => {
                    const sourceId = nameToAbstract.get(cleanedInput);

                    if (sourceId && sourceId !== targetId) {
                        // Edge from another node
                        const finalSource = `${prefix}_op_${sourceId}`;
                        const finalTarget = `${prefix}_op_${targetId}`;
                        const edgeKey = `${finalSource}_to_${finalTarget}`;

                        if (edgeSet.has(edgeKey)) return;
                        edgeSet.add(edgeKey);

                        // Show weight names on the edge label
                        const weightLabel = weightInputs.length > 0 ? weightInputs[0].split('.').pop() || '' : '';

                        // Highlight edge if currentNode is EITHER the source OR the target
                        const isEdgeCurrent = currentNode === node.name || currentNode === sourceId;

                        result.push({
                            id: edgeKey,
                            source: finalSource,
                            target: finalTarget,
                            label: weightLabel,
                            labelStyle: { ...labelStyle, fontSize: 9 },
                            style: style(isEdgeCurrent || false),
                            markerEnd: arrow(isEdgeCurrent || false)
                        });
                    } else if (cleanedInput.includes('cache')) {
                        // Edge from cache (virtual node)
                        const extId = `ext_${cleanedInput}`;
                        const finalSource = `${prefix}_op_${extId}`;
                        const finalTarget = `${prefix}_op_${targetId}`;
                        const edgeKey = `${finalSource}_to_${finalTarget}`;

                        if (edgeSet.has(edgeKey)) return;
                        edgeSet.add(edgeKey);

                        result.push({
                            id: edgeKey,
                            source: finalSource,
                            target: finalTarget,
                            label: 'KV Cache',
                            labelStyle: labelStyle,
                            style: style(false),
                            markerEnd: arrow(false)
                        });
                    }
                });
            });

            // Entry/Exit Logic
            result.push({ id: `embd_to_entry`, source: 'token_embedding', target: `${prefix}_entry`, animated: currentLayer === 0, style: style(currentLayer === 0), markerEnd: arrow(true) });

            first.forEach(id => {
                result.push({ id: `entry_to_${id}`, source: `${prefix}_entry`, target: `${prefix}_op_${id}`, style: style(false), markerEnd: arrow(false) });
            });

            last.forEach(id => {
                result.push({ id: `last_to_exit_${id}`, source: `${prefix}_op_${id}`, target: `${prefix}_exit`, style: style(false), markerEnd: arrow(false) });
            });

            result.push({ id: `exit_to_final`, source: `${prefix}_exit`, target: 'final_norm', animated: currentLayer === modelInfo.n_layers - 1, style: style(currentLayer === modelInfo.n_layers - 1), markerEnd: arrow(true) });

            // Feedback loop
            if (currentLayer !== undefined && currentLayer < modelInfo.n_layers - 1) {
                result.push({
                    id: `${prefix}_loop_simplified`,
                    source: `${prefix}_exit`, sourceHandle: 'right-out',
                    target: `${prefix}_entry`, targetHandle: 'right-in',
                    label: t('iterate'), labelStyle: { fill: '#fbbf24', fontWeight: 700, fontSize: 10 },
                    animated: true, type: 'smoothstep',
                    style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '10,5' },
                    markerEnd: arrow(true),
                });
            }
        }

        return result;
        return result;
    }, [modelInfo.layers, currentLayer, currentNode, layerSpecificSchema, modelInfo.n_layers, t]);

    const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes);
    const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges);

    useEffect(() => {
        setNodesState(nodes);
        setEdgesState(edges);
    }, [nodes, edges, setNodesState, setEdgesState]);

    useEffect(() => {
        console.log('[ModelGraph] Rendering with Single Layer Mode');
        console.log('[ModelGraph] Layer Schema count:', modelInfo.layer_schema?.length || 0);
        console.log('[ModelGraph] Layer Specific Schema count:', layerSpecificSchema.length);
        console.log('[ModelGraph] Current Layer:', currentLayer);
        console.log('[ModelGraph] Resulting Nodes count:', nodes.length);
        console.log('[ModelGraph] Resulting Edges count:', edges.length);
    }, [modelInfo.layer_schema, layerSpecificSchema, currentLayer, nodes.length, edges.length]);

    return (
        <div className="w-full h-full bg-gray-50 dark:bg-gray-900 relative">
            <ReactFlow
                key={`flow-${modelInfo.model_name}-${modelInfo.layer_schema?.length}`}
                nodes={nodesState}
                edges={edgesState}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                nodesDraggable={!isLocked}
                nodesConnectable={!isLocked}
                elementsSelectable={!isLocked}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.05}
                maxZoom={2}
            >
                <Background variant={BackgroundVariant.Dots} />
                <Controls onInteractiveChange={(interactive) => setIsLocked(!interactive)} />
                <ViewportUpdater currentLayer={currentLayer} currentNode={currentNode} nodes={nodes} />
            </ReactFlow>
        </div>
    );
}

export function ModelGraph(props: ModelGraphProps) {
    return (
        <ReactFlowProvider>
            <ModelGraphInner {...props} />
        </ReactFlowProvider>
    );
}
