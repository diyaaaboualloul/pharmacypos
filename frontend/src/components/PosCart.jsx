export default function PosCart({ items, onUpdateQuantity, onRemove, onCheckout }) {
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  if (items.length === 0) {
    return (
      <div className="alert alert-secondary mt-4">
        🛒 Your cart is empty. Search and add products to start a sale.
      </div>
    );
  }

  return (
    <div className="mt-4 table-responsive">
      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th style={{ width: "120px" }}>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={item.quantity}
                  min="1"
                  max={item.totalSellableQty}
                  onChange={(e) =>
                    onUpdateQuantity(item._id, Number(e.target.value))
                  }
                />
              </td>
              <td>${item.price.toFixed(2)}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onRemove(item._id)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="text-end fw-bold">
              Total:
            </td>
            <td colSpan="2" className="fw-bold">
              ${total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="text-end mt-3">
        <button
          className="btn btn-primary btn-lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          💰 Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
