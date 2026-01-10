'use client';

import { DebugState } from '@/types/debug';

interface ToolbarProps {
    state: DebugState;
    tokenCount: number;
    loading: boolean;
    streamLoading: boolean;
    onEnable: () => void;
    onPause: () => void;
    onResume: () => void;
    onNextLayer: () => void;
    onNextToken: () => void;
    onStep: () => void;
    onRefresh: () => void;
    onClearTokens: () => void;
    onTestStream: (prompt: string) => void;
}

export function Toolbar({
    state,
    tokenCount,
    loading,
    streamLoading,
    onEnable,
    onPause,
    onResume,
    onNextLayer,
    onNextToken,
    onStep,
    onRefresh,
    onClearTokens,
    onTestStream,
}: ToolbarProps) {
    const handleTestClick = () => {
        const input = document.getElementById('prompt-input') as HTMLInputElement;
        if (input && input.value) {
            onTestStream(input.value);
        }
    };

    return (
        <div className="border-b bg-white dark:bg-gray-800 shadow-sm">
            <div className="px-4 py-3">
                {/* Top row: Status and controls */}
                <div className="flex items-center justify-between mb-3">
                    {/* Status indicators */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">状态:</span>
                            <span className="text-sm font-semibold">
                                {state.paused ? '⏸ 已暂停' : '▶ 运行中'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">位置:</span>
                            <span className="text-sm font-semibold truncate max-w-[200px]" title={state.currentNode}>
                                {state.currentLayer !== undefined && state.currentLayer !== -1 ? `L${state.currentLayer + 1}` : '-'}
                                {state.currentNode ? ` ${state.currentNode}` : ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Token:</span>
                            <span className="text-sm font-semibold">{tokenCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">后端:</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-semibold text-green-600">已连接</span>
                            </div>
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onEnable}
                            disabled={state.enabled || loading}
                            className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="启用调试"
                        >
                            🔧 启用
                        </button>
                        <button
                            onClick={onPause}
                            disabled={!state.enabled || state.paused || loading}
                            className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="暂停"
                        >
                            ⏸ 暂停
                        </button>
                        <button
                            onClick={onResume}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                            title="继续运行直到下一个断点或结束"
                        >
                            🚀 继续
                        </button>
                        <button
                            onClick={onNextLayer}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                            title="执行到下一层"
                        >
                            🥞 逐层
                        </button>
                        <button
                            onClick={onNextToken}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                            title="执行下一个 Token"
                        >
                            🔤 逐 Token
                        </button>
                        <button
                            onClick={onStep}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                            title="执行下一个算子"
                        >
                            ⤵ 单步
                        </button>
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="px-2.5 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="刷新状态"
                        >
                            🔄
                        </button>
                        <button
                            onClick={onClearTokens}
                            disabled={tokenCount === 0}
                            className="px-2.5 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="清空 Tokens"
                        >
                            🗑
                        </button>
                    </div>
                </div>

                {/* Bottom row: Test input */}
                <div className="flex gap-2">
                    <input
                        id="prompt-input"
                        type="text"
                        defaultValue="The capital of France is"
                        className="flex-1 px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="输入提示词..."
                    />
                    <button
                        onClick={handleTestClick}
                        disabled={!state.enabled || loading}
                        className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
                    >
                        {streamLoading ? '⏳ 生成中...' : '🚀 测试推理'}
                    </button>
                </div>
            </div>
        </div>
    );
}
