import { ControlPanel } from '@/components/ControlPanel';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">LLM 推理调试器</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Token 级别调试控制面板 - MVP 版本
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <ControlPanel />
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>基于 llama.cpp 的调试器原型 | 迭代 1: Token 级调试基础</p>
        </footer>
      </div>
    </main>
  );
}
