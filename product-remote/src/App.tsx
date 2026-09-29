import ProductList from "./components/ProductList";

export default function App() {
  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 20px" }}>
      <h1>Product Remote</h1>
      <p>
        This application can run on its own or provide ProductList to a host.
      </p>
      <ProductList />
    </main>
  );
}
