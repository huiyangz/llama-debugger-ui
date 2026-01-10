# llama-debugger-ui

[English](../README.md) | [中文](README_zh.md)

`llama-debugger-ui` 是一个为 `llama.cpp` 设计的强大可视化调试前端。它提供了 Transformer 模型内部状态的实时可视化，允许开发者和研究人员逐层、逐 Token 地检查张量、激活值和数据流。

## 主要功能

- **交互式图表视图**：可视化模型的计算图，包括注意力头、前馈网络（FFN）和归一化层。
- **实时检查**：在计算的任何时刻检查张量的值、形状和类型。
- **逐步调试**：通过细粒度的步骤控制推理过程：
  - **Token**：一次运行一个 Token。
  - **Layer (层)**：一次推进一步模型层。
  - **Operation (算子)**：执行单个算子（如矩阵乘法、激活函数）以便进行底层调试。
- **KV Cache 可视化**：监控与每个注意力块关联的 Key-Value 缓存状态。

## 前置要求

要使用此调试 UI，您**必须**使用经过特定修改的 `llama.cpp` 版本作为后端，该版本暴露了必要的调试钩子和 API 端点。

*   **Node.js**: v18 或更高版本
*   **修改版 llama.cpp**:
    *   **仓库**: [https://github.com/huiyangz/llama.cpp](https://github.com/huiyangz/llama.cpp)
    *   **分支**: `feature/debugger`

## 快速开始

### 1. 设置后端 (llama.cpp)

首先，克隆并构建修改版的 `llama.cpp` 后端：

```bash
git clone -b feature/debugger https://github.com/huiyangz/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake .. -DLLAMA_DEBUGGER=ON  # 启用调试器支持
make -j
```

使用编译好的二进制文件启动服务器（确保您有 GGUF 格式的模型文件）：

```bash
# 示例命令
./bin/llama-server -m /path/to/your/model.gguf -c 2048 --host 0.0.0.0 --port 8080
```

### 2. 设置前端 (llama-debugger-ui)

克隆本仓库并安装依赖：

```bash
git clone https://github.com/huiyangz/llama-debugger-ui.git
cd llama-debugger-ui
npm install
# 或者
yarn install
```

启动开发服务器：

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。UI 应该会自动连接到运行在 `localhost:8080` 的 `llama.cpp` 服务器。

## 配置

如果您的 `llama.cpp` 服务器运行在不同的主机或端口上，您可以在 `llama-debugger-ui` 中配置后端 URL。（目前的默认值为 `http://localhost:8080`，即将支持通过 `.env` 进行配置）。

## 未来计划 (Roadmap)

- **优化图表可视化**：优化计算图的渲染逻辑，解耦被强制融合的算子，确保单步调试时的视觉呈现更加精确和直观。
- **深度数据检查**：支持查看每个算子的输入和输出详情，并允许下载完整的张量数据以供离线分析。
- **KV 缓存监控**：在暂停状态下可视化 KV 缓存的内存占用和使用情况。
- **动态流程控制**：支持在运行时修改中间张量的值（输入/输出），以便测试假设并干预推理过程。

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。
