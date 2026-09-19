import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { productId, name, imageUrl, price, qty }
  const [promoCode, setPromoCode] = useState("");
  const [redeemPoints, setRedeemPoints] = useState(0);

  function addItem(product, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          qty,
        },
      ];
    });
  }

  function changeQty(productId, delta) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clearCart() {
    setItems([]);
    setPromoCode("");
    setRedeemPoints(0);
  }

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  const value = {
    items,
    addItem,
    changeQty,
    removeItem,
    clearCart,
    subtotal,
    totalCount,
    promoCode,
    setPromoCode,
    redeemPoints,
    setRedeemPoints,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart CartProvider ichida ishlatilishi kerak");
  return ctx;
}
