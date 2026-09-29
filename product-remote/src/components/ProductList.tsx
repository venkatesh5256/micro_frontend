import "./ProductList.css";

const products = [
  { name: "iPhone", price: "₹70,000" },
  { name: "Samsung Galaxy", price: "₹60,000" },
  { name: "Google Pixel", price: "₹55,000" },
];

export default function ProductList() {
  return (
    <section className="product-list" aria-labelledby="products-heading">
      <h2 id="products-heading">Products</h2>
      <ol>
        {products.map((product) => (
          <li className="product-item" key={product.name}>
            <span>{product.name}</span>
            <strong>{product.price}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
