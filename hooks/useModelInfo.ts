'use client';

import { useState, useEffect } from 'react';
import { ModelInfo, LayerInfo } from '@/types/model';

export function useModelInfo() {
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModelInfo = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('http://localhost:8080/api/debug/model-info');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();

            // Transform backend data to frontend format
            const modelInfo: ModelInfo = {
                model_name: data.model_name || 'Unknown',
                arch: data.arch || 'unknown',
                n_layers: data.n_layers || 0,
                n_embd: data.n_embd || 0,
                n_head: data.n_head || 0,
                n_head_kv: data.n_head_kv || 0,
                n_vocab: data.n_vocab || 0,
                n_ctx_train: data.n_ctx_train || 0,
                weights: data.global_tensors || [],
                metadata: data.metadata,
                layers: (data.layers || []).map((l: any): LayerInfo => {
                    const gateProj = l.tensors?.find((t: any) => t.role === 'ffn_gate');
                    const ffn_dim = gateProj ? (gateProj.shape[0] || gateProj.shape[1]) : 0;

                    return {
                        index: l.index,
                        type: 'transformer',
                        tensors: l.tensors || [],
                        params: {
                            n_head: data.n_head,
                            n_head_kv: data.n_head_kv,
                            n_embd: data.n_embd,
                            head_dim: data.n_head ? Math.round(data.n_embd / data.n_head) : 0,
                            ffn_dim: ffn_dim
                        }
                    };
                })
            };

            setModelInfo(modelInfo);
        } catch (e) {
            console.error('Failed to fetch model info:', e);
            setError(e instanceof Error ? e.message : 'Unknown error');
            setModelInfo(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModelInfo();
    }, []);

    return { modelInfo, loading, error, refetch: fetchModelInfo };
}
