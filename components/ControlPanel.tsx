'use client';

import { useState } from 'react';
import { useDebug } from '@/hooks/useDebug';

export function ControlPanel() {
  const { state, tokens, loading, streamLoading, error, controls } = useDebug();
  const [prompt, setPrompt] = useState('The capital of France is');
  const [displayVersion, setDisplayVersion] = useState(0);

  const handleTestStream = async () => {
    setDisplayVersion(v => v + 1); // 强制重新渲染 token 列表
    await controls.testStream(prompt);
  };

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-lg">
      <h2 className="text-2xl font-bold mb-6">LLM 推理调试器</h2>

      {/* 状态显示 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">状态</div>
          <div className="text-lg font-semibold mt-1">
            {state.paused ? '⏸ 已暂停' : '▶ 运行中'}
          </div>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Token 数</div>
          <div className="text-lg font-semibold mt-1">{tokens.length}</div>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">调试模式</div>
          <div className="text-lg font-semibold mt-1">
            {state.enabled ? 'Token' : '关闭'}
          </div>
        </div>
      </div>

      {/* 流式测试区域 */}
      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
        <h3 className="font-semibold mb-3">流式输出测试（带调试）</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600"
            placeholder="输入提示词..."
          />
          <button
            onClick={handleTestStream}
            disabled={!state.enabled || loading}
            className="px-5 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {streamLoading ? '⏳ 生成中...' : '🚀 测试推理'}
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          启用调试后点击测试，会逐个 token 暂停。每次点击"单步"生成一个 token。
        </p>
      </div>

      {/* 控制按钮 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => controls.enable()}
          disabled={state.enabled || loading}
          className="px-5 py-2.5 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          🔧 启用调试
        </button>
        <button
          onClick={() => controls.pause()}
          disabled={!state.enabled || state.paused || loading}
          className="px-5 py-2.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ⏸ 暂停
        </button>
        <button
          onClick={() => controls.resume()}
          disabled={!state.enabled || !state.paused || loading}
          className="px-5 py-2.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ▶ 继续
        </button>
        <button
          onClick={() => controls.step()}
          disabled={!state.enabled || !state.paused || loading}
          className="px-5 py-2.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ⤵ 单步
        </button>
        <button
          onClick={() => controls.getState()}
          disabled={loading}
          className="px-5 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          🔄 刷新状态
        </button>
        <button
          onClick={() => controls.clearTokens()}
          disabled={tokens.length === 0}
          className="px-5 py-2.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          🗑 清空
        </button>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          <strong>错误：</strong>{error}
        </div>
      )}

      {/* Token 列表 */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3 text-lg">生成的 Tokens</h3>
        <div className="max-h-80 overflow-y-auto border rounded p-3 bg-gray-50 dark:bg-gray-900">
          {tokens.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              暂无 token - 点击"测试推理"开始
            </div>
          ) : (
            <div className="space-y-1">
              {tokens.map((token, idx) => (
                <div
                  key={`${displayVersion}-${idx}`}
                  className="text-sm py-2 px-3 border-b last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mr-2">
                    #{token.id}
                  </span>
                  <span className="font-mono text-lg">{token.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <h4 className="font-semibold mb-2">使用说明：</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>点击 <strong>启用调试</strong> 开启 Token 级调试</li>
          <li>在上方输入框输入提示词，点击 <strong>测试推理</strong></li>
          <li>推理会自动暂停在每个 token 生成后</li>
          <li>使用 <strong>单步</strong> 逐个 token 推进，查看每个 token</li>
          <li>或使用 <strong>继续</strong> 恢复自动生成剩余 tokens</li>
        </ol>
      </div>
    </div>
  );
}
