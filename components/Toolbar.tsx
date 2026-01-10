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

import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

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
    const t = useTranslations('Toolbar');
    const tCommon = useTranslations('Common');

    const handleTestClick = () => {
        const input = document.getElementById('prompt-input') as HTMLInputElement;
        if (input && input.value) {
            onTestStream(input.value);
        }
    };

    return (
        <div className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm sticky top-0 z-10 border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3">
                {/* Top row: Status and controls */}
                <div className="flex items-center justify-between mb-3">
                    {/* Status indicators */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{tCommon('status')}:</span>
                            <span className="text-sm font-semibold">
                                {state.paused ? `⏸ ${tCommon('paused')}` : `▶ ${tCommon('running')}`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Position:</span>
                            <span className="text-sm font-semibold truncate max-w-[200px]" title={state.currentNode}>
                                {state.currentLayer !== undefined && state.currentLayer !== -1 ? `L${state.currentLayer + 1}` : '-'}
                                {state.currentNode ? ` ${state.currentNode}` : ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{tCommon('token')}:</span>
                            <span className="text-sm font-semibold">{tokenCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Backend:</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-semibold text-green-600">Connected</span>
                            </div>
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className="flex gap-2">
                        {/* Enable and Pause buttons removed as per user request */}
                        <button
                            onClick={onResume}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-sm"
                            title={t('resume')}
                        >
                            🚀 {t('resume')}
                        </button>
                        <button
                            onClick={onNextLayer}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-sm"
                            title={t('nextLayer')}
                        >
                            🥞 {t('nextLayer')}
                        </button>
                        <button
                            onClick={onNextToken}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-sm"
                            title={t('nextToken')}
                        >
                            🔤 {t('nextToken')}
                        </button>
                        <button
                            onClick={onStep}
                            disabled={!state.enabled || !state.paused || loading}
                            className="px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-all shadow-sm"
                            title={t('step')}
                        >
                            ⤵ {t('step')}
                        </button>
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="px-2.5 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('refresh')}
                        >
                            🔄
                        </button>
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center mx-1" />
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Bottom row: Test input */}
                <div className="flex gap-2">
                    <input
                        id="prompt-input"
                        type="text"
                        defaultValue="The capital of France is"
                        className="flex-1 px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder={t('inputPrompt')}
                    />
                    <button
                        onClick={handleTestClick}
                        disabled={loading || streamLoading || state.paused}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium disabled:cursor-not-allowed"
                    >
                        {(streamLoading || state.paused) ? `⏳ ${t('testing')}` : `🚀 ${t('testStream')}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
