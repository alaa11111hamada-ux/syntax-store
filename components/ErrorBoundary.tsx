"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
            <h2 className="mb-2 text-xl font-bold text-red-300">حدث خطأ غير متوقع</h2>
            <p className="mb-4 text-sm text-muted">
              `{this.state.error?.message || "خطأ غير معروف"}`
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-xl bg-brand-gradient px-6 py-2.5 font-bold text-white transition-opacity hover:opacity-90"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
