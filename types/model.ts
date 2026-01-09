export interface TensorInfo {
    name: string;
    type: string;
    shape: number[];
    size_bytes: number;
    role?: string;
}

export interface LayerParams {
    n_head?: number;
    n_head_kv?: number;
    n_embd?: number;
    head_dim?: number;
    ffn_dim?: number;
}

export interface LayerInfo {
    index: number;
    type: string;
    params: LayerParams;
    tensors: TensorInfo[];
}

export interface ModelInfo {
    model_name: string;
    arch: string;
    n_layers: number;
    n_embd: number;
    n_head: number;
    n_head_kv: number;
    n_vocab: number;
    n_ctx_train: number;
    layers: LayerInfo[];
    weights: TensorInfo[];
    metadata?: {
        arch?: string;
        activation?: string;
        pos_embd?: string;
    };
}
