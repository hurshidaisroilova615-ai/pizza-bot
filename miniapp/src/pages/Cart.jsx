import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api";
import { closeMiniApp, hapticFeedback, notificationHaptic } from "../telegram";
import Icon from "../components/Icon";
import { useI18n } from "../i18n/LanguageContext";

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
  const { t } = useI18n();

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
  const [cardCopied, setCardCopied] = useState(false);

  // navigator.clipboard is missing in some in-app browsers, so the number
  // stays visible and selectable either way — the copy is a convenience.
  async function copyCard() {
    try {
      await navigator.clipboard.writeText(settings.cardPaymentDetails || "");
      hapticFeedback("light");
      setCardCopied(true);
      setTimeout(() => setCardCopied(false), 2500);
    } catch {
      // clipboard unavailable; the customer can still read and type it
    }
  }

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
        <h1 className="page-title">{t("cart.title")}</h1>
        <div className="empty-state">
          <div className="empty-emoji">
            <Icon name="cart" size={30} strokeWidth={1.5} />
          </div>
          <p>
            {t("cart.empty")}
            <br />
            {t("cart.emptyHint")}
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
  // No card number, no card option: a customer who picks it would have
  // nowhere to send the money.
  const cardOffered = settings.cardPaymentEnabled && Boolean(settings.cardPaymentDetails);

  return (
    <div>
      <h1 className="page-title">{t("cart.title")}</h1>

      {soldOut.length > 0 && (
        <div className="sold-out-warning">
          <p>{t("cart.soldOutNotice", { names: soldOut.map((p) => p.name).join(", ") })}</p>
          <button
            type="button"
            className="sold-out-remove"
            onClick={() => soldOut.forEach((p) => removeItem(p.id))}
          >
            {t("cart.removeSoldOut")}
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
              <span className="cart-item-soldout">{t("product.soldOut")}</span>
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
          placeholder={t("cart.promo")}
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
        />
        <button className="promo-apply-btn" onClick={applyPromo} disabled={!promoInput.trim()}>
          {t("cart.apply")}
        </button>
      </div>
      {quoteError && <p className="form-error">{quoteError}</p>}
      {quote?.promoValid && <p className="form-success">{t("cart.promoApplied")}</p>}

      {settings.loyaltyEnabled && loyaltyBalance > 0 && (
        <div className="upsell-row">
          <span className="upsell-text">
            {t("cart.loyaltyPrompt", { points: loyaltyBalance })}
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
          <p className="field-label">{t("cart.howLabel")}</p>
          <div className="choice-row" role="group" aria-label="Buyurtma turi">
            <button
              type="button"
              className={`choice ${orderType === "DELIVERY" ? "active" : ""}`}
              onClick={() => setOrderType("DELIVERY")}
            >
              <Icon name="truck" size={17} strokeWidth={2} />
              {t("cart.delivery")}
            </button>
            <button
              type="button"
              className={`choice ${orderType === "PICKUP" ? "active" : ""}`}
              onClick={() => setOrderType("PICKUP")}
            >
              <Icon name="walk" size={17} strokeWidth={2} />
              {t("cart.pickup")}
            </button>
          </div>
        </>
      )}

      {cardOffered && (
        <>
          <p className="field-label">{t("cart.paymentLabel")}</p>
          <div className="choice-row" role="group" aria-label="To'lov turi">
            <button
              type="button"
              className={`choice ${paymentMethod === "CASH" ? "active" : ""}`}
              onClick={() => setPaymentMethod("CASH")}
            >
              <Icon name="cash" size={17} strokeWidth={2} />
              {t("cart.cash")}
            </button>
            <button
              type="button"
              className={`choice ${paymentMethod === "CARD" ? "active" : ""}`}
              onClick={() => setPaymentMethod("CARD")}
            >
              <Icon name="card" size={17} strokeWidth={2} />
              {t("cart.card")}
            </button>
          </div>
        </>
      )}

      <input
        className="location-input"
        placeholder={t("cart.phone")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      {orderType === "DELIVERY" ? (
        <input
          className="location-input"
          placeholder={t("cart.address")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      ) : (
        settings.pickupAddress && (
          <p className="pickup-note">
            <Icon name="pin" size={16} strokeWidth={2} />
            {t("cart.pickupAddress", { address: settings.pickupAddress })}
          </p>
        )
      )}
      {cardOffered && paymentMethod === "CARD" && (
        <div className="card-details">
          <p className="card-details-label">{t("cart.cardLabel")}</p>
          <button type="button" className="card-number" onClick={copyCard}>
            <span>{settings.cardPaymentDetails}</span>
            <Icon name={cardCopied ? "check" : "card"} size={18} strokeWidth={2} />
          </button>
          {settings.cardPaymentHolder && (
            <p className="card-details-holder">{settings.cardPaymentHolder}</p>
          )}
          <p className="card-details-hint">
            {cardCopied ? t("cart.cardCopied") : t("cart.cardHint")}
          </p>
        </div>
      )}

      <input
        className="location-input"
        placeholder={t("cart.comment")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="summary-box">
        <div className="summary-row">
          <span>{t("cart.items")}</span>
          <span>
            {subtotal.toLocaleString()} {settings.currency}
          </span>
        </div>
        {quote?.discountAmount > 0 && (
          <div className="summary-row">
            <span>{t("cart.promoDiscount")}</span>
            <span>
              -{quote.discountAmount.toLocaleString()} {settings.currency}
            </span>
          </div>
        )}
        {quote?.loyaltyDiscount > 0 && (
          <div className="summary-row">
            <span>{t("cart.loyaltyDiscount")}</span>
            <span>
              -{quote.loyaltyDiscount.toLocaleString()} {settings.currency}
            </span>
          </div>
        )}
        {quote?.deliveryFee > 0 && (
          <div className="summary-row">
            <span>{t("cart.deliveryFee")}</span>
            <span>
              {quote.deliveryFee.toLocaleString()} {settings.currency}
            </span>
          </div>
        )}
        <div className="summary-row total">
          <span>{t("cart.total")}</span>
          <span>
            {(quote?.totalPrice ?? subtotal).toLocaleString()} {settings.currency}
          </span>
        </div>
      </div>

      {closed && (
        <p className="form-error" style={{ padding: "8px 20px 0" }}>
          {t("cart.closedNotice", {
            open: settings.opening.openTime,
            close: settings.opening.closeTime,
          })}
        </p>
      )}

      {!meetsMinimum && (
        <p className="form-error" style={{ padding: "8px 20px 0" }}>
          {t("cart.minOrder", {
            amount: quote.minOrderAmount.toLocaleString(),
            currency: settings.currency,
          })}
        </p>
      )}

      <div className="cart-footer">
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={submitting || !meetsMinimum || closed || soldOut.length > 0}
        >
          {closed
            ? t("cart.closedBtn")
            : soldOut.length > 0
            ? t("cart.removeSoldOutBtn")
            : submitting
            ? t("cart.sending")
            : t("cart.confirm")}
        </button>
      </div>
    </div>
  );
}
