import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#fff0f0", minHeight: "100vh" }}>
          <h1 style={{ color: "red", fontSize: 24 }}>🚨 Runtime Error (White Screen Diagnosis)</h1>
          <pre style={{ background: "#ffe0e0", padding: 16, borderRadius: 8, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            <strong>Message:</strong> {this.state.error.message}
            {"\n\n"}
            <strong>Stack:</strong> {this.state.error.stack}
          </pre>
          <p style={{ color: "#555", marginTop: 16 }}>Check the browser console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
