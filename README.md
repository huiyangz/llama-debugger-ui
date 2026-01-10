# llama-debugger-ui

[English](README.md) | [中文](docs/README_zh.md)


`llama-debugger-ui` is a powerful visual debugging frontend for `llama.cpp`. It provides real-time visualization of the Transformer model's internal state, allowing developers and researchers to inspect tensors, activations, and data flow layer-by-layer and token-by-token.

## Features

- **Interactive Graph View**: Visualizes the computational graph of the model, including attention heads, FFNs, and normalization layers.
- **Real-time Inspection**: Inspect tensor values, shapes, and types at any point in the computation.
- **Step-by-Step Debugging**: Control the inference process with granular steps:
  - **Token**: Run one token at a time.
  - **Layer**: Advance through the model one layer at a time.
  - **Operation**: Execute single operations (e.g., matrix multiplication, activation) for low-level debugging.
- **KV Cache Visualization**: Monitor the state of the Key-Value cache associated with each attention block.

## Prerequisites

To use this debugging UI, you **MUST** run the backend using a specifically modified version of `llama.cpp` that exposes the necessary debug hooks and API endpoints.

*   **Node.js**: v18 or later
*   **Modified llama.cpp**:
    *   **Repository**: [https://github.com/huiyangz/llama.cpp](https://github.com/huiyangz/llama.cpp)
    *   **Branch**: `feature/debugger`

## Quick Start

### 1. Set up the Backend (llama.cpp)

First, clone and build the modified `llama.cpp` backend:

```bash
git clone -b feature/debugger https://github.com/huiyangz/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake .. -DLLAMA_DEBUGGER=ON  # Enable debugger support
make -j
```

Start the server using the compiled binary (ensure you have a model file formatted for GGUF):

```bash
# Example command
./bin/llama-server -m /path/to/your/model.gguf -c 2048 --host 0.0.0.0 --port 8080
```

### 2. Set up the Frontend (llama-debugger-ui)

Clone this repository and install dependencies:

```bash
git clone https://github.com/huiyangz/llama-debugger-ui.git
cd llama-debugger-ui
npm install
# or
yarn install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The UI should automatically connect to the `llama.cpp` server running on `localhost:8080`.

## Configuration

If your `llama.cpp` server is running on a different host or port, you can configure the backend URL in `llama-debugger-ui`. (Currently defaults to `http://localhost:8080`, configuration via `.env` coming soon).

## Roadmap

- **Enhanced Graph Visualization**: Optimize the rendering of computational graphs to decouple fused operators, ensuring a precise and intuitive visual representation during single-step debugging.
- **Deep Data Inspection**: Enable detailed inspection of inputs and outputs for every operator, including the ability to download complete tensor data for offline analysis.
- **KV Cache Monitoring**: Visualize KV cache memory usage and occupancy stats when the debugger is paused.
- **Dynamic Flow Control**: Allow runtime modification of intermediate tensor values (inputs/outputs) to test hypotheses and intervene in the inference process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
