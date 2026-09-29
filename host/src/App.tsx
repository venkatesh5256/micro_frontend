import {
  Component,
  lazy,
  Suspense,
  type ErrorInfo,
  type ReactNode,
} from "react";

const ProductList = lazy(() => import("productRemote/ProductList"));

type ErrorBoundaryState = {
  hasError: boolean;
};

class RemoteErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Product remote failed to load or render", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="unavailable" role="alert">
          <h2>Product service is currently unavailable.</h2>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Micro Frontend Demo</p>
        <h1>Featured products</h1>
        <p className="subtitle">
          Product data rendered from an independently served remote.
        </p>
      </header>

      <RemoteErrorBoundary>
        <Suspense
          fallback={
            <p className="loading" role="status">
              Loading products...
            </p>
          }
        >
          <ProductList />
        </Suspense>
      </RemoteErrorBoundary>
    </main>
  );
}
