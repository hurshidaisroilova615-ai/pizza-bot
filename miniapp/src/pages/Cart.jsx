import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api";
import { closeMiniApp, hapticFeedback, notificationHaptic } from "../telegram";
import Icon from "../components/Icon";

export default function Cart({ onOrderPlaced }) {
  const {
    items,
    changeQty,
    removeItem,
    subtotal,
    clearCart,
    promoCode,
    setPromoCode,
    redeemPoints,
    setRedeemPoints,
  } = useCart();
  const settings = useSettings();

  // Collection and card payment only appear when the business offers them,
  // so a shop that only delivers shows no choice at all.
  const [orderType, setOrderType] = useState(settings.deliveryEnabled === false ? "PICKUP" : "DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [comment, setComment] = useState("");
  const [promoInput, setPromoInput] = useState(promoCode);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [useLoyalty, setUseLoyalty] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    let active = true;
    api
      .quoteOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
        promoCode: promoCode || undefined,
        loyaltyPointsToRedeem: useLoyalty ? redeemPoints : 0,
        orderType,
      })
      .then((data) => {
        if (!active) return;
        setQuote(data);
        setQuoteError("");
      })
      .catch((err) => active && setQuoteError(err.message));
    return () => {
      active = false;
    };
  }, [items, promoCode, redeemPoints, useLoyalty, orderType]);

  function applyPromo() {
    setPromoCode(promoInput.trim().toUpperCase());
  }

  async function handleConfirm() {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
        orderType,
        paymentMethod,
        phone: phone || undefined,
        deliveryAddress: location || undefined,
        comment: comment || undefined,
        promoCode: promoCode || undefined,
        loyaltyPointsToRedeem: useLoyalty ? redeemPoints : 0,
      });

      notificationHaptic("success");
      clearCart();
      onOrderPlaced();
      closeMiniApp();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="page-title">Savatcha</h1>
        <div className="empty-state">
          <div className="empty-emoji">
            <Icon name="cart" size={30} strokeWidth={1.5} />
          </div>
          <p>
            Savatchangiz hozircha bo'sh.
            <br />
            Katalogdan mahsulot tanlab qo'shing!
          </p>
        </div>
      </div>
    );
  }

  const loyaltyBalance = quote?.loyaltyBalance || 0;
  // Only worth asking how the order goes out when the business does both.
  const bothWaysOffered = settings.deliveryEnabled !== false && settings.pickupEnabled === true;
  const closed = settings.opening?.isOpen === false;
  const meetsMinimum = quote ? quote.meetsMinimum : true;
  // Sold out while the cart sat open — say which dish, and offer to drop it
  // rather than leaving the customer to work out why confirm is dead.
  const soldOut = quote?.unavailableItems || [];
  const soldOutIds = new Set(soldOut.map((p) => p.id));

  return (
    <div>
      <h1 className="page-title">Savatcha</h1>

      {soldOut.length > 0 && (
        <div className="sold-out-warning">
          <p>{soldOut.map((p) => p.name).join(", ")} — hozircha tugadi.</p>
          <button
            type="button"
            className="sold-out-remove"
            onClick={() => soldOut.forEach((p) => removeItem(p.id))}
          >
            Savatchadan olib tashlash
          </button>
        </div>
      )}

      {items.map((item) => (
        <div
          className={`cart-item ${soldOutIds.has(item.productId) ? "sold-out" : ""}`}
          key={item.productId}
        >
          <img className="cart-item-img" src={item.imageUrl} alt={item.name} />
          <div className="cart-item-info">
            <p className="cart-item-name">{item.name}</p>
            {soldOutIds.has(item.productId) ? (
              <span className="cart-item-soldout">Hozircha tugadi</span>
            ) : (
              <span className="cart-item-price">
                {item.price.toLocaleString()} {settings.currency}
              </span>
            )}
          </div>
          <div className="qty-control">
            <button onClick={() => changeQty(item.productId, -1)}>−</button>
            <span>{item.qty}</span>
            <button onClick={() => changeQty(item.productId, 1)}>+</button>
          </div>
        </div>
      ))}

      <div className="promo-row">
        <input
          className="promo-input"
          placeholder="Promo kod"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
        />
        <button className="promo-apply-btn" onClick={applyPromo} disabled={!promoInput.trim()}>
          Qo'llash
        </button>
      </div>
      {quoteError && <p className="form-error">{quoteError}</p>}
      {quote?.promoValid && <p className="form-success">Promo kod qo'llandi 🎉</p>}

      {settings.loyaltyEnabled && loyaltyBalance > 0 && (
        <div className="upsell-row">
          <span className="upsell-text">
            Bonus balansingiz: {loyaltyBalance} ball. Ishlatishni xohlaysizmi?
          </span>
          <label className="switch">
            <input type="checkbox" checked={useLoyalty} onChange={(e) => setUseLoyalty(e.target.checked)} />
            <span className="switch-track" />
          </label>
        </div>
      )}
      {useLoyalty && loyaltyBalance > 0 && (
        <input
          className="location-input"
          type="range"
          min={0}
          max={loyaltyBalance}
          value={redeemPoints}
          onChange={(e) => setRedeemPoints(Number(e.target.value))}
        />
      )}

      {bothWaysOffered && (
        <>
          <p className="field-label">Qanday olasiz?</p>
          <div className="choice-row" role="group" aria-label="Buyurtma turi">
            <button
              type="button"
              className={`choice ${orderType === "DELIVERY" ? "active" : ""}`}
              onClick={() => setOrderType("DELIVERY")}
            >
              <Icon name="truck" size={17} strokeWidth={2} />
              Yetkazib berish
            </button>
            <button
              type="button"
              className={`choice ${orderType === "PICKUP" ? "active" : ""}`}
              onClick={() => setOrderType("PICKUP")}
            >
              <Icon name="walk" size={17} strokeWidth={2} />
              Olib ketaman
            </button>
          </div>
        </>
      )}

      {settings.cardPaymentEnabled && (
        <>
          <p className="field-label">To'lov turi</p>
          <div className="choice-row" role="group" aria-label="To'lov turi">
            <button
              type="button"
              className={`choice ${paymentMethod === "CASH" ? "active" : ""}`}
              onClick={() => setPaymentMethod("CASH")}
            >
              <Icon name="cash" size={17} strokeWidth={2} />
              Naqd
            </button>
            <button
              type="button"
              className={`choice ${paymentMethod === "CARD" ? "active" : ""}`}
              onClick={() => setPaymentMethod("CARD")}
            >
              <Icon name="card" size={17} strokeWidth={2} />
              Karta
            </button>
          </div>
        </>
      )}

      <input
        className="location-input"
        placeholder="Telefon raqamingiz"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      {orderType === "DELIVERY" ? (
        <input
          className="location-input"
          placeholder="Yetkazish manzili"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      ) : (
        settings.pickupAddress && (
          <p className="pickup-note">
            <Icon name="pin" size={16} strokeWidth={2} />
            Olib ketish manzili: {settings.pickupAddress}
          </p>
        )
      )}
      <input
        className="location-input"
        placeholder="Izoh (ixtiyoriy)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="summary-box">
        <div className="summary-row">
          <span>Mahsulotlar</span>
          <span>
            {subtotal.toLocaleString()} {settings.currency}
          </span>
        </div>
        {quote?.discountAmount > 0 && (
          <div className="summary-row">
            <span>Promo chegirma</span>
            <span>
              -{quote.discountAmount.toLocaleString()} {settings.currency}
            </span>
          </div>
        )}
        {quote?.loyaltyDiscount > 0 && (
          <div className="summary-row">
            <span>Bonus ball</span>
            <span>
              -{quote.loyaltyDiscount.toLocaleString()} {settings.currency}
            </span>
          </div>
        )}
        {quote?.deliveryFee > 0 && (
          <div className="summary-row">
            <span>Yetkazib berish</span>
            <span>
              {quote.deliveryFee.toLocaleString()} {settings.currency}
            </span>
          </div>
        )}
        <div className="summary-row total">
          <span>Jami</span>
          <span>
            {(quote?.totalPrice ?? subtotal).toLocaleString()} {settings.currency}
          </span>
        </div>
      </div>

      {closed && (
        <p className="form-error" style={{ padding: "8px 20px 0" }}>
          Hozir yopiqmiz. Ish vaqti: {settings.opening.openTime} - {settings.opening.closeTime}
        </p>
      )}

      {!meetsMinimum && (
        <p className="form-error" style={{ padding: "8px 20px 0" }}>
          Minimal buyurtma summasi: {quote.minOrderAmount.toLocaleString()} {settings.currency}
        </p>
      )}

      <div className="cart-footer">
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={submitting || !meetsMinimum || closed || soldOut.length > 0}
        >
          {closed
            ? "Hozir yopiq"
            : soldOut.length > 0
            ? "Tugagan mahsulotni olib tashlang"
            : submitting
            ? "Yuborilmoqda..."
            : "Buyurtmani tasdiqlash"}
        </button>
      </div>
    </div>
  );
}
