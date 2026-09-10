"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 3D Canvas 错误边界：glb 加载失败 / WebGL 不可用时不允许白屏，
 * 必须降级为纸片人（2D 立绘 + 对话气泡继续可用）。
 */
export class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // Phase 16 接入 Sentry；当前输出到控制台
    console.error("[3D Canvas] 渲染失败，降级纸片人模式：", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
          {/* 纸片人降级占位（Phase 8 替换为真实 2D 立绘） */}
          <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-mirai-card text-7xl shadow-inner">
            <i className="fa-solid fa-user-astronaut text-mirai-accent2" />
          </div>
          <p className="text-sm text-amber-300">
            <i className="fa-solid fa-triangle-exclamation mr-1" />
            3D 模型加载失败，已切换「纸片人模式」，聊天不受影响
          </p>
          <button
            className="rounded-lg bg-mirai-card px-3 py-1.5 text-xs text-mirai-accent2 hover:bg-black/30"
            onClick={() => this.setState({ hasError: false, message: "" })}
          >
            <i className="fa-solid fa-rotate-right mr-1" />重试加载 3D
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
