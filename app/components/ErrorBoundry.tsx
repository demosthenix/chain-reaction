import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl text-white mb-4">Something went wrong</h1>
            <button
              className="bg-blue-500 text-white px-4 py-2"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Restart Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
