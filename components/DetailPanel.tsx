'use client';

import { LayerInfo, ModelInfo } from '@/types/model';
import { TokenInfo } from '@/types/debug';

interface DetailPanelProps {
    selectedLayer: LayerInfo | null;
    modelInfo: ModelInfo | null;
    tokens: TokenInfo[];
}

export function DetailPanel({ selectedLayer, modelInfo, tokens }: DetailPanelProps) {
    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const formatShape = (shape: number[]) => {
        return `[${shape.filter(s => s > 0).join(', ')}]`;
    };

    return (
        <div className="w-80 border-l bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4">
                <h2 className="text-lg font-bold mb-4">详细信息</h2>

                {/* Architecture Insights */}
                {modelInfo?.metadata && (
                    <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                        <h3 className="text-xs font-bold mb-2 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            架构特性 (Auto-Detected)
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs">激活函数:</span>
                                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-800 rounded text-purple-700 dark:text-purple-200 font-mono text-xs">
                                    {modelInfo.metadata.activation === 'silu' ? 'SiLU (SwiGLU)' : modelInfo.metadata.activation?.toUpperCase() || 'ReLU'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs">位置编码:</span>
                                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-700 dark:text-blue-200 font-mono text-xs">
                                    {modelInfo.metadata.pos_embd}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Model Info Section */}
                {modelInfo && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            模型配置
                        </h3>
                        <div className="space-y-1 text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="flex justify-between">
                                <span className="text-gray-500">模型名:</span>
                                <span className="font-mono truncate ml-2 text-xs" title={modelInfo.model_name}>{modelInfo.model_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">架构:</span>
                                <span className="font-mono text-xs">{modelInfo.arch}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">层数:</span>
                                <span className="font-mono text-xs">{modelInfo.n_layers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">嵌入维度:</span>
                                <span className="font-mono text-xs">{modelInfo.n_embd}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">注意力头:</span>
                                <span className="font-mono text-xs">{modelInfo.n_head}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Layer Section */}
                {selectedLayer ? (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                第 {selectedLayer.index} 层详情
                            </h3>
                            <button
                                onClick={() => {/* TODO: Set breakpoint */ }}
                                className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            > 🔴 断点
                            </button>
                        </div>

                        {/* Layer Parameters */}
                        <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">FFN 维度:</span>
                                    <span className="font-mono">{selectedLayer.params?.ffn_dim || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">头维度:</span>
                                    <span className="font-mono">{selectedLayer.params?.head_dim || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tensors */}
                        <div>
                            <h4 className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                                权威张量 ({selectedLayer.tensors?.length || 0})
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {selectedLayer.tensors && selectedLayer.tensors.length > 0 ? (
                                    selectedLayer.tensors.map((tensor, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded text-xs"
                                        >
                                            <div className="font-mono font-bold mb-1 truncate text-purple-600 dark:text-purple-400" title={tensor.name}>
                                                {tensor.name}
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>{tensor.type}</span>
                                                <span>{formatBytes(tensor.size_bytes)}</span>
                                            </div>
                                            <div className="text-gray-500">
                                                形状: {formatShape(tensor.shape)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-400 text-center py-2">
                                        无张量信息
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs italic">💡 点击左侧模型图中的节点，查看该层的真实权重张量和计算维度。</p>
                    </div>
                )}

                {/* Tokens Section */}
                <div className="mt-8 border-t pt-4">
                    <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span>实时生成的 Tokens</span>
                        <span className="bg-gray-200 dark:bg-gray-700 text-[10px] px-1.5 py-0.5 rounded-full">{tokens.length}</span>
                    </h3>
                    <div className="max-h-60 overflow-y-auto border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 shadow-inner">
                        {tokens.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-8">
                                等待推理开始...
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {tokens.map((token, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs py-1 px-2 bg-white dark:bg-gray-800 border rounded shadow-sm hover:border-blue-400 transition-colors cursor-default group"
                                    >
                                        <span className="text-[9px] text-gray-300 block leading-none mb-1 group-hover:text-blue-500">#{token.id}</span>
                                        <span className="font-mono font-semibold">{token.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
