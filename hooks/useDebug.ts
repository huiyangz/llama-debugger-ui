'use client';

import { useState, useCallback, useRef } from 'react';
import { DebugState, TokenInfo, DebugResponse } from '@/types/debug';

const API_BASE = 'http://localhost:8080';

export function useDebug() {
  const [state, setState] = useState<DebugState>({
    enabled: false,
    paused: false,
    granularity: 'token',
  });

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const tokensRef = useRef<TokenInfo[]>([]); // 使用 ref 来追踪实际列表
  const [loading, setLoading] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false); // 单独的流式加载状态
  const [error, setError] = useState<string | null>(null);
  const [tokenVersion, setTokenVersion] = useState(0); // 版本号，用于强制刷新

  const controls = {
    pause: useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/debug/pause`, { method: 'POST' });
        const data: DebugResponse = await res.json();
        if (data.error) throw new Error(data.error);

        // 获取最新状态
        const stateRes = await fetch(`${API_BASE}/debug/state`);
        const stateData: DebugResponse = await stateRes.json();
        if (stateData.error) throw new Error(stateData.error);

        setState({
          enabled: stateData.enabled ?? false,
          paused: stateData.paused ?? true,
          granularity: stateData.granularity ?? 'token',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Pause failed');
      } finally {
        setLoading(false);
      }
    }, []),

    resume: useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/debug/resume`, { method: 'POST' });
        const data: DebugResponse = await res.json();
        if (data.error) throw new Error(data.error);

        // 获取最新状态
        const stateRes = await fetch(`${API_BASE}/debug/state`);
        const stateData: DebugResponse = await stateRes.json();
        if (stateData.error) throw new Error(stateData.error);

        setState({
          enabled: stateData.enabled ?? false,
          paused: stateData.paused ?? false,
          granularity: stateData.granularity ?? 'token',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Resume failed');
      } finally {
        setLoading(false);
      }
    }, []),

    step: useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/debug/step`, { method: 'POST' });
        const data: DebugResponse = await res.json();
        if (data.error) throw new Error(data.error);
        // 注意：不再添加模拟 token，因为流式输出会添加真实 token
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Step failed');
      } finally {
        setLoading(false);
      }
    }, []),

    enable: useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/debug/enable`, { method: 'POST' });
        const data: DebugResponse = await res.json();
        if (data.error) throw new Error(data.error);

        // 启用后自动获取最新状态（因为后端会自动暂停）
        const stateRes = await fetch(`${API_BASE}/debug/state`);
        const stateData: DebugResponse = await stateRes.json();
        if (stateData.error) throw new Error(stateData.error);

        setState({
          enabled: stateData.enabled ?? true,
          paused: stateData.paused ?? true,
          granularity: stateData.granularity ?? 'token',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Enable failed');
      } finally {
        setLoading(false);
      }
    }, []),

    getState: useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/debug/state`);
        const data: DebugResponse = await res.json();
        if (data.error) throw new Error(data.error);
        setState({
          enabled: data.enabled ?? false,
          paused: data.paused ?? false,
          granularity: data.granularity ?? 'token',
        });
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Get state failed');
        return null;
      } finally {
        setLoading(false);
      }
    }, []),

    clearTokens: useCallback(() => {
      tokensRef.current = [];
      setTokens([]);
      setTokenVersion(v => v + 1); // 更新版本号
    }, []),

    // 流式输出测试
    testStream: useCallback(async (prompt: string) => {
      setStreamLoading(true);
      setError(null);
      tokensRef.current = []; // 清空 ref
      setTokens([]); // 清空之前的 tokens
      setTokenVersion(v => v + 1); // 更新版本号强制刷新

      try {
        console.log('[DEBUG] Starting stream request for:', prompt);
        const response = await fetch(`${API_BASE}/completion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            n_predict: 10,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[DEBUG] Stream done, total tokens:', tokenCount);
            // 流式输出结束，说明推理完成，自动 resume
            if (tokenCount > 0 && state.paused) {
              console.log('[DEBUG] Auto-resuming after stream completion');
              await fetch(`${API_BASE}/debug/resume`, { method: 'POST' });
              // 更新状态
              await controls.getState();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') {
                  console.log('[DEBUG] Received [DONE]');
                  continue;
                }
                const data = JSON.parse(jsonStr);

                // 只有当数据包包含 content 字段时才添加 token
                if (!('content' in data)) {
                  console.log('[DEBUG] Skipping non-token data packet');
                  continue;
                }

                // 获取content（可能是空字符串）
                const content = data.content;

                // 使用 ref 追踪，避免 React StrictMode 双重调用
                tokenCount++;
                const displayText = content === '' ? `<empty>` :
                                 content === ' ' ? `<space>` :
                                 content.length === 1 && content.charCodeAt(0) < 32 ? `<ctrl ${content.charCodeAt(0)}>` :
                                 content;

                console.log('[DEBUG] Token', tokenCount, ':', displayText, `(raw: "${content}")`);
                console.log('[DEBUG] tokensRef.current.length before:', tokensRef.current.length);

                // 使用 ref 追踪实际的 token 列表
                const newToken = {
                  id: tokensRef.current.length,
                  text: displayText,
                  position: tokensRef.current.length,
                  rawContent: content,
                };
                tokensRef.current.push(newToken);

                console.log('[DEBUG] tokensRef.current.length after:', tokensRef.current.length);
                console.log('[DEBUG] Setting tokens with length:', tokensRef.current.length);

                // 更新状态 - 使用函数形式确保基于最新值
                setTokens(() => [...tokensRef.current]);
              } catch (parseErr) {
                console.warn('[DEBUG] Failed to parse line:', line);
              }
            }
          }
        }

        // 完成后更新状态
        await controls.getState();
      } catch (e) {
        console.error('[DEBUG] Stream error:', e);
        const errorMsg = e instanceof Error ? e.message : 'Stream failed';
        setError(errorMsg);
      } finally {
        setStreamLoading(false);
      }
    }, [state.paused]), // 添加 state.paused 作为依赖
  };

  return { state, tokens, loading, streamLoading, error, controls };
}
