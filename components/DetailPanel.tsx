'use client';

import { LayerInfo, ModelInfo } from '@/types/model';
import { TokenInfo } from '@/types/debug';

interface DetailPanelProps {
    selectedLayer: LayerInfo | null;
    modelInfo: ModelInfo | null;
    tokens: TokenInfo[];
    currentNode?: string;
    currentOp?: string;
    currentInputs?: string;
}

import { useTranslations } from 'next-intl';

export function DetailPanel({ selectedLayer, modelInfo, tokens, currentNode, currentOp, currentInputs }: DetailPanelProps) {
    const t = useTranslations('DetailPanel');
    const tCommon = useTranslations('Common');

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
                <h2 className="text-lg font-bold mb-4">{t('title')}</h2>

                {/* Current Operation Section */}
                {currentNode && (
                    <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                        <h3 className="text-xs font-bold mb-2 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                            {t('currentOp')}
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[50px]">{t('node')}:</span>
                                <div className="flex-1">
                                    <span className="text-gray-900 dark:text-white font-mono font-bold">{currentNode}</span>
                                    {(currentNode.startsWith('node_') || currentNode.startsWith('tensor_')) && (
                                        <div className="mt-1 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                                            ⚠️ Anonymous Node
                                        </div>
                                    )}
                                </div>
                            </div>
                            {currentOp && (
                                <div className="flex items-start">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[50px]">{t('op')}:</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{currentOp}</span>
                                </div>
                            )}
                            {currentInputs && (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('inputs')}:</span>
                                    <span className="text-gray-900 dark:text-white font-mono text-[10px] bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                                        {currentInputs}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[50px]">{t('out')}:</span>
                                <span className="text-green-600 dark:text-green-400 font-mono font-bold">{currentNode}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Architecture Insights */}
                {modelInfo?.metadata && (
                    <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold mb-2 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            {t('architecture')}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs">{t('activation')}:</span>
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-mono text-xs">
                                    {modelInfo.metadata.activation === 'silu' ? 'SiLU (SwiGLU)' : modelInfo.metadata.activation?.toUpperCase() || 'ReLU'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-xs">{t('posEmb')}:</span>
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-mono text-xs">
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
                            {t('modelConfig')}
                        </h3>
                        <div className="space-y-1 text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="flex justify-between">
                                <div><span className="text-gray-500">{t('name')}:</span> {modelInfo.model_name}</div>
                            </div>
                            <div className="flex justify-between">
                                <div><span className="text-gray-500">{t('arch')}:</span> {modelInfo.arch}</div>
                            </div>

                            <div className="flex justify-between">
                                <div><span className="text-gray-500">{t('layers')}:</span> {modelInfo.n_layers}</div>
                            </div>
                            <div className="flex justify-between">
                                <div><span className="text-gray-500">{t('embdDim')}:</span> {modelInfo.n_embd}</div>
                            </div>
                            <div className="flex justify-between">
                                <div><span className="text-gray-500">{t('heads')}:</span> {modelInfo.n_head}</div>
                            </div>
                            <div className="flex justify-between">
                                <div><span className="text-gray-500">KV {t('heads')}:</span> {modelInfo.n_head_kv}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Layer Section */}
                {selectedLayer ? (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                Layer {selectedLayer.index + 1}
                            </h3>
                            <button
                                onClick={() => {/* TODO: Set breakpoint */ }}
                                className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            > 🔴 Breakpoint
                            </button>
                        </div>

                        {/* Layer Parameters */}
                        <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">FFN Dim:</span>
                                    <span className="font-mono">{selectedLayer.params?.ffn_dim || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Head Dim:</span>
                                    <span className="font-mono">{selectedLayer.params?.head_dim || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tensors */}
                        <div>
                            <h4 className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                                {t('tensorInfo')} ({selectedLayer.tensors?.length || 0})
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {selectedLayer.tensors && selectedLayer.tensors.length > 0 ? (
                                    selectedLayer.tensors.map((tensor, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded text-xs"
                                        >
                                            <div className="font-mono font-bold mb-1 truncate text-slate-700 dark:text-slate-300" title={tensor.name}>
                                                {tensor.name}
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>{tensor.type}</span>
                                                <span>{formatBytes(tensor.size_bytes)}</span>
                                            </div>
                                            <div className="text-gray-500">
                                                Shape: {formatShape(tensor.shape)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-400 text-center py-2">
                                        No tensors
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs italic">{t('noSelection')}</p>
                    </div>
                )}

                {/* Tokens Section */}
                <div className="mt-8 border-t pt-4">
                    <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span>{tCommon('tokens')}</span>
                        <span className="bg-gray-200 dark:bg-gray-700 text-[10px] px-1.5 py-0.5 rounded-full">{tokens.length}</span>
                    </h3>
                    <div className="max-h-60 overflow-y-auto border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 shadow-inner">
                        {tokens.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-8">
                                {tCommon('loading')}
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
