'use client';

import { useState } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { ModelGraph } from '@/components/ModelGraph';
import { DetailPanel } from '@/components/DetailPanel';
import { useDebug } from '@/hooks/useDebug';
import { useModelInfo } from '@/hooks/useModelInfo';
import { LayerInfo } from '@/types/model';

export default function Home() {
    const { state, tokens, loading, streamLoading, error, controls } = useDebug();
    const { modelInfo, loading: modelLoading } = useModelInfo();
    const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);

    const handleLayerClick = (layer: LayerInfo) => {
        setSelectedLayer(layer);
    };

    const handleTestStream = async (prompt: string) => {
        await controls.testStream(prompt);
    };

    if (modelLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="text-xl font-semibold mb-2">加载模型信息中...</div>
                    <div className="text-gray-500">请稍候</div>
                </div>
            </div>
        );
    }

    if (!modelInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="text-xl font-semibold mb-2 text-red-600">无法加载模型信息</div>
                    <div className="text-gray-500">请检查后端服务是否运行</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Top Toolbar */}
            <Toolbar
                state={state}
                tokenCount={tokens.length}
                loading={loading}
                streamLoading={streamLoading}
                onEnable={controls.enable}
                onPause={controls.pause}
                onResume={controls.resume}
                onStep={controls.step}
                onRefresh={controls.getState}
                onClearTokens={controls.clearTokens}
                onTestStream={handleTestStream}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Central Visualization Area */}
                <div className="flex-1 relative">
                    <ModelGraph
                        modelInfo={modelInfo}
                        currentLayer={undefined} // TODO: Connect to actual current layer from debug state
                        onLayerClick={handleLayerClick}
                    />
                </div>

                {/* Right Detail Panel */}
                <DetailPanel
                    selectedLayer={selectedLayer}
                    modelInfo={modelInfo}
                    tokens={tokens}
                />
            </div>

            {/* Error Display */}
            {error && (
                <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded shadow-lg">
                    <strong>错误：</strong>{error}
                </div>
            )}
        </div>
    );
}
