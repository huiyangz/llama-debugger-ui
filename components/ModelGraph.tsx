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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ModelInfo, LayerInfo } from '@/types/model';

interface ModelGraphProps {
    modelInfo: ModelInfo;
    currentLayer?: number;
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
            default: return '#9ca3af';
        }
    };

    const getTextColor = () => {
        const lightBg = ['input', 'attention_norm', 'ffn_norm', 'add', 'projection', 'gate', 'up', 'activation'];
        return lightBg.includes(componentType) ? '#1f2937' : '#ffffff';
    };

    return (
        <div
            className={`
        px-2 py-1.5 rounded border-2 cursor-pointer relative shadow-sm
        ${isCurrent ? 'border-yellow-600 ring-2 ring-yellow-400 scale-105' : 'border-gray-400'}
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
            <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-gray-400 !border-none !-bottom-1" />
        </div>
    );
}

const nodeTypes: NodeTypes = {
    component: ComponentNode,
};

export function ModelGraph({ modelInfo, currentLayer, onLayerClick }: ModelGraphProps) {
    const H_SPACING = 140;
    const V_SPACING = 60;
    const LAYER_SPACING = 100;
    const BASE_X = 300;

    const getTensorLabel = (layerIdx: number, role: string, fallback: string) => {
        const layer = modelInfo.layers.find(l => l.index === layerIdx);
        const tensor = layer?.tensors?.find(t => t.role === role);
        if (tensor) {
            return `[${tensor.shape.join(', ')}]`;
        }
        return fallback;
    };

    const getGlobalTensorLabel = (role: string, fallback: string) => {
        const tensor = modelInfo.weights.find(t => t.role === role);
        if (tensor) {
            return `[${tensor.shape.join(', ')}]`;
        }
        return fallback;
    };

    const nodes: Node[] = useMemo(() => {
        const result: Node[] = [];
        let yOffset = 0;

        // Input
        result.push({
            id: 'input',
            type: 'component',
            position: { x: BASE_X, y: yOffset },
            data: { label: '输入 Tokens', componentType: 'input', isCurrent: false, onClick: () => { } },
        });
        yOffset += V_SPACING;

        // Token Embedding
        result.push({
            id: 'token_embedding',
            type: 'component',
            position: { x: BASE_X, y: yOffset },
            data: {
                label: 'Token Embedding',
                sublabel: getGlobalTensorLabel('tok_embd', `[seq, ${modelInfo.n_embd}]`),
                componentType: 'embedding',
                isCurrent: false,
                onClick: () => { },
            },
        });
        yOffset += LAYER_SPACING;

        // For each layer - ultra detailed
        modelInfo.layers.forEach((layer, layerIdx) => {
            const prefix = `layer_${layer.index}`;
            const isCurrent = currentLayer === layer.index;
            const layerStartY = yOffset;

            // Layer label (left side)
            result.push({
                id: `${prefix}_label`,
                type: 'component',
                position: { x: BASE_X - 160, y: yOffset + V_SPACING * 3 },
                data: {
                    label: `Layer ${layer.index}`,
                    componentType: 'norm',
                    width: '80px',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });

            // ===== ATTENTION BLOCK =====
            // Attention Norm
            result.push({
                id: `${prefix}_attn_norm`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: 'Attn Norm',
                    sublabel: getTensorLabel(layer.index, 'attn_norm', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'attention_norm',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // Q, K, V Projections (parallel)
            const qkvY = yOffset;
            result.push({
                id: `${prefix}_q_proj`,
                type: 'component',
                position: { x: BASE_X - H_SPACING, y: qkvY },
                data: {
                    label: 'Q Projection',
                    sublabel: getTensorLabel(layer.index, 'attn_q', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'projection',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            result.push({
                id: `${prefix}_k_proj`,
                type: 'component',
                position: { x: BASE_X, y: qkvY },
                data: {
                    label: 'K Projection',
                    sublabel: getTensorLabel(layer.index, 'attn_k', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'projection',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            result.push({
                id: `${prefix}_v_proj`,
                type: 'component',
                position: { x: BASE_X + H_SPACING, y: qkvY },
                data: {
                    label: 'V Projection',
                    sublabel: getTensorLabel(layer.index, 'attn_v', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'projection',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // Attention Computation
            result.push({
                id: `${prefix}_attn_compute`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: 'Attention',
                    sublabel: `Softmax(QKᵀ/√d)V + ${modelInfo.metadata?.pos_embd || 'RoPE'}`,
                    componentType: 'attention_compute',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // Output Projection
            result.push({
                id: `${prefix}_o_proj`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: 'O Projection',
                    sublabel: getTensorLabel(layer.index, 'attn_o', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'projection',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // Residual Add 1
            result.push({
                id: `${prefix}_add1`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: '+ Residual',
                    sublabel: `[seq, ${modelInfo.n_embd}]`,
                    componentType: 'add',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // ===== FFN BLOCK =====
            // FFN Norm
            result.push({
                id: `${prefix}_ffn_norm`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: 'FFN Norm',
                    sublabel: getTensorLabel(layer.index, 'ffn_norm', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'ffn_norm',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // Gate and Up projections (parallel)
            const gateUpY = yOffset;
            result.push({
                id: `${prefix}_gate_proj`,
                type: 'component',
                position: { x: BASE_X - H_SPACING / 2, y: gateUpY },
                data: {
                    label: 'Gate Proj',
                    sublabel: getTensorLabel(layer.index, 'ffn_gate', `[seq, ${modelInfo.n_embd * 4}]`),
                    componentType: 'gate',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            result.push({
                id: `${prefix}_up_proj`,
                type: 'component',
                position: { x: BASE_X + H_SPACING / 2, y: gateUpY },
                data: {
                    label: 'Up Proj',
                    sublabel: getTensorLabel(layer.index, 'ffn_up', `[seq, ${modelInfo.n_embd * 4}]`),
                    componentType: 'up',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // GLU Logic (SwiGLU)
            const isGLU = modelInfo.metadata?.activation === 'silu';

            if (isGLU) {
                // SiLU on gate path
                result.push({
                    id: `${prefix}_silu`,
                    type: 'component',
                    position: { x: BASE_X - H_SPACING / 2, y: yOffset },
                    data: {
                        label: 'SiLU',
                        sublabel: 'activation',
                        componentType: 'activation',
                        width: '70px',
                        isCurrent,
                        onClick: () => onLayerClick?.(layer),
                    },
                });

                // Element-wise Multiply
                result.push({
                    id: `${prefix}_mul`,
                    type: 'component',
                    position: { x: BASE_X, y: yOffset + V_SPACING / 2 },
                    data: {
                        label: '✕',
                        sublabel: 'Element-wise',
                        componentType: 'add',
                        width: '50px',
                        isCurrent,
                        onClick: () => onLayerClick?.(layer),
                    },
                });
                yOffset += V_SPACING;
            } else {
                // Standard Activation (ReLU/GELU)
                const actFunc = modelInfo.metadata?.activation || 'relu';
                result.push({
                    id: `${prefix}_activation`,
                    type: 'component',
                    position: { x: BASE_X, y: yOffset },
                    data: {
                        label: actFunc.toUpperCase(),
                        sublabel: 'activation',
                        componentType: 'activation',
                        isCurrent,
                        onClick: () => onLayerClick?.(layer),
                    },
                });
                yOffset += V_SPACING;
            }

            // Down Projection
            result.push({
                id: `${prefix}_down_proj`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: 'Down Proj',
                    sublabel: getTensorLabel(layer.index, 'ffn_down', `[seq, ${modelInfo.n_embd}]`),
                    componentType: 'down',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += V_SPACING;

            // Residual Add 2
            result.push({
                id: `${prefix}_add2`,
                type: 'component',
                position: { x: BASE_X, y: yOffset },
                data: {
                    label: '+ Residual',
                    sublabel: `[seq, ${modelInfo.n_embd}]`,
                    componentType: 'add',
                    isCurrent,
                    onClick: () => onLayerClick?.(layer),
                },
            });
            yOffset += LAYER_SPACING;
        });

        // Final Norm
        result.push({
            id: 'final_norm',
            type: 'component',
            position: { x: BASE_X, y: yOffset },
            data: {
                label: 'Final Norm',
                sublabel: getGlobalTensorLabel('output_norm', `[seq, ${modelInfo.n_embd}]`),
                componentType: 'norm',
                isCurrent: false,
                onClick: () => { },
            },
        });
        yOffset += V_SPACING;

        // Output
        result.push({
            id: 'output',
            type: 'component',
            position: { x: BASE_X, y: yOffset },
            data: {
                label: 'Output Projection',
                sublabel: getGlobalTensorLabel('output', `[seq, ${modelInfo.n_vocab}]`),
                componentType: 'output',
                isCurrent: false,
                onClick: () => { },
            },
        });

        return result;
    }, [modelInfo, currentLayer, onLayerClick]);

    const edges: Edge[] = useMemo(() => {
        const result: Edge[] = [];
        const B = 'B';
        const S = 'S';
        const H = modelInfo.n_embd;

        // High visibility labels
        const LABEL_STYLE = { fontSize: 10, fill: '#1f2937', fontWeight: 600 };
        const LABEL_BG = { fill: '#ffffff', fillOpacity: 0.9, rx: 2, ry: 2 };

        const arrow = (isCurrent: boolean) => ({
            type: MarkerType.ArrowClosed,
            color: isCurrent ? '#fbbf24' : '#4b5563',
        });
        const style = (isCurrent: boolean) => ({
            stroke: isCurrent ? '#fbbf24' : '#6b7280',
            strokeWidth: isCurrent ? 2.5 : 2,
        });

        // Input -> Embedding (Always animated)
        result.push({
            id: 'input-emb',
            source: 'input',
            target: 'token_embedding',
            style: style(false),
            markerEnd: arrow(false),
            animated: true,
            label: `[${B}, ${S}]`,
            labelStyle: LABEL_STYLE,
            labelBgStyle: LABEL_BG,
        });

        // Embedding -> First layer (Backbone animated)
        if (modelInfo.layers.length > 0) {
            result.push({
                id: 'emb-layer0',
                source: 'token_embedding',
                target: `layer_${modelInfo.layers[0].index}_attn_norm`,
                animated: true,
                style: style(currentLayer === modelInfo.layers[0].index),
                markerEnd: arrow(currentLayer === modelInfo.layers[0].index),
                label: `[${B}, ${S}, ${H}]`,
                labelStyle: LABEL_STYLE,
                labelBgStyle: LABEL_BG,
            });
        }

        // For each layer
        modelInfo.layers.forEach((layer, idx) => {
            const prefix = `layer_${layer.index}`;
            const isCurrent = currentLayer === layer.index;

            const gateProj = layer.tensors?.find(t => t.role === 'ffn_gate');
            const ffnDim = gateProj ? gateProj.shape[0] : H * 4;
            const headDim = modelInfo.n_head ? Math.round(modelInfo.n_embd / modelInfo.n_head) : 0;

            // Attn Norm -> Q, K, V
            ['q', 'k', 'v'].forEach(proj => {
                result.push({
                    id: `${prefix}_norm_to_${proj}`,
                    source: `${prefix}_attn_norm`,
                    target: `${prefix}_${proj}_proj`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
            });

            // Q -> Attn
            result.push({
                id: `${prefix}_q_to_attn`,
                source: `${prefix}_q_proj`,
                target: `${prefix}_attn_compute`,
                animated: isCurrent,
                style: style(isCurrent),
                markerEnd: arrow(isCurrent),
                label: `[${B}, ${modelInfo.n_head}, ${S}, ${headDim}]`,
                labelStyle: { ...LABEL_STYLE, fontSize: 8 },
                labelBgStyle: LABEL_BG,
            });
            // K, V -> Attn
            ['k', 'v'].forEach(proj => {
                result.push({
                    id: `${prefix}_${proj}_to_attn`,
                    source: `${prefix}_${proj}_proj`,
                    target: `${prefix}_attn_compute`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                    label: `k/v`, // Simplified label to avoid clutter
                    labelStyle: { ...LABEL_STYLE, fontSize: 8 },
                    labelBgStyle: LABEL_BG,
                });
            });

            // Attn -> O
            result.push({
                id: `${prefix}_attn_to_o`,
                source: `${prefix}_attn_compute`,
                target: `${prefix}_o_proj`,
                animated: isCurrent,
                style: style(isCurrent),
                markerEnd: arrow(isCurrent),
                label: `[${B}, ${S}, ${H}]`,
                labelStyle: LABEL_STYLE,
                labelBgStyle: LABEL_BG,
            });

            // O -> Add1
            result.push({
                id: `${prefix}_o_to_add1`,
                source: `${prefix}_o_proj`,
                target: `${prefix}_add1`,
                animated: isCurrent,
                style: style(isCurrent),
                markerEnd: arrow(isCurrent),
            });

            // Residual 1
            const res1Source = idx === 0 ? 'token_embedding' : `layer_${modelInfo.layers[idx - 1].index}_add2`;
            result.push({
                id: `${prefix}_res1`,
                source: res1Source,
                target: `${prefix}_add1`,
                animated: isCurrent,
                style: { ...style(isCurrent), strokeDasharray: '5,5' }, // Apply dashed style
                markerEnd: arrow(isCurrent),
                label: 'skip',
                labelStyle: { ...LABEL_STYLE, fontSize: 9, fill: '#6b7280' },
                labelBgStyle: LABEL_BG,
            });

            // Add1 -> FFN
            result.push({
                id: `${prefix}_add1_to_ffn_norm`,
                source: `${prefix}_add1`,
                target: `${prefix}_ffn_norm`,
                animated: isCurrent,
                style: style(isCurrent),
                markerEnd: arrow(isCurrent),
                label: `[${B}, ${S}, ${H}]`,
                labelStyle: LABEL_STYLE,
                labelBgStyle: LABEL_BG,
            });

            // FFN -> Gate/Up
            ['gate', 'up'].forEach(proj => {
                result.push({
                    id: `${prefix}_ffn_norm_to_${proj}`,
                    source: `${prefix}_ffn_norm`,
                    target: `${prefix}_${proj}_proj`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
            });

            // FFN Edges
            const isGLU = modelInfo.metadata?.activation === 'silu';
            if (isGLU) {
                // Gate path: Gate -> SiLU -> Mul
                result.push({
                    id: `${prefix}_gate_to_silu`,
                    source: `${prefix}_gate_proj`,
                    target: `${prefix}_silu`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
                result.push({
                    id: `${prefix}_silu_to_mul`,
                    source: `${prefix}_silu`,
                    target: `${prefix}_mul`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
                // Up path: Up -> Mul
                result.push({
                    id: `${prefix}_up_to_mul`,
                    source: `${prefix}_up_proj`,
                    target: `${prefix}_mul`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
                // Mul -> Down
                result.push({
                    id: `${prefix}_mul_to_down`,
                    source: `${prefix}_mul`,
                    target: `${prefix}_down_proj`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
            } else {
                // Legacy path: Gate/Up (shared) -> Act -> Down
                ['gate', 'up'].forEach(proj => {
                    result.push({
                        id: `${prefix}_${proj}_to_act`,
                        source: `${prefix}_${proj}_proj`,
                        target: `${prefix}_activation`,
                        animated: isCurrent,
                        style: style(isCurrent),
                        markerEnd: arrow(isCurrent),
                    });
                });
                result.push({
                    id: `${prefix}_act_to_down`,
                    source: `${prefix}_activation`,
                    target: `${prefix}_down_proj`,
                    animated: isCurrent,
                    style: style(isCurrent),
                    markerEnd: arrow(isCurrent),
                });
            }

            // Down -> Add2
            result.push({
                id: `${prefix}_down_to_add2`,
                source: `${prefix}_down_proj`,
                target: `${prefix}_add2`,
                animated: isCurrent,
                style: style(isCurrent),
                markerEnd: arrow(isCurrent),
                label: `[${B}, ${S}, ${H}]`,
                labelStyle: LABEL_STYLE,
                labelBgStyle: LABEL_BG,
            });

            // Residual 2
            result.push({
                id: `${prefix}_res2`,
                source: `${prefix}_add1`,
                target: `${prefix}_add2`,
                animated: isCurrent,
                style: { ...style(isCurrent), strokeDasharray: '5,5' }, // Apply dashed style
                markerEnd: arrow(isCurrent),
                label: 'skip',
                labelStyle: { ...LABEL_STYLE, fontSize: 9, fill: '#6b7280' },
                labelBgStyle: LABEL_BG,
            });

            // To next (Backbone animated)
            if (idx < modelInfo.layers.length - 1) {
                result.push({
                    id: `${prefix}_to_next`,
                    source: `${prefix}_add2`,
                    target: `layer_${modelInfo.layers[idx + 1].index}_attn_norm`,
                    animated: true,
                    style: style(currentLayer === modelInfo.layers[idx + 1].index),
                    markerEnd: arrow(currentLayer === modelInfo.layers[idx + 1].index),
                    label: `[${B}, ${S}, ${H}]`,
                    labelStyle: LABEL_STYLE,
                    labelBgStyle: LABEL_BG,
                });
            } else {
                result.push({
                    id: `${prefix}_to_final`,
                    source: `${prefix}_add2`,
                    target: 'final_norm',
                    animated: true,
                    style: style(false),
                    markerEnd: arrow(false),
                    label: `[${B}, ${S}, ${H}]`,
                    labelStyle: LABEL_STYLE,
                    labelBgStyle: LABEL_BG,
                });
            }
        });

        // Final -> Out (Backbone animated)
        result.push({
            id: 'final_to_out',
            source: 'final_norm',
            target: 'output',
            animated: true,
            style: style(false),
            markerEnd: arrow(false),
            label: `[${B}, ${S}, ${modelInfo.n_vocab}]`,
            labelStyle: LABEL_STYLE,
            labelBgStyle: LABEL_BG,
        });

        return result;
    }, [modelInfo.layers, currentLayer, modelInfo.n_embd, modelInfo.n_head, modelInfo.n_head_kv, modelInfo.n_vocab]);

    const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes);
    const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges);

    useEffect(() => {
        setNodesState(nodes);
        setEdgesState(edges);
    }, [currentLayer, nodes, edges, setNodesState, setEdgesState]);

    return (
        <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
            <ReactFlow
                nodes={nodesState}
                edges={edgesState}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.05}
                maxZoom={2}
            >
                <Background variant={BackgroundVariant.Dots} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
