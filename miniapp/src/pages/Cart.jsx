import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api";
import { closeMiniApp, hapticFeedback, notificationHaptic } from "../telegram";
import Icon from "../components/Icon";
import OrderPlaced from "../components/OrderPlaced";
import { isTelegram, savedContact, rememberContact } from "../identity";
import { currentTable, forgetTable } from "../table";
import { useI18n } from "../i18n/LanguageContext";

export default function Cart({ onOrderPlaced, onBrowseMenu }) {
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

  // A table code was scanned, and the shop takes orders from its tables.
  // Then there is nothing to choose: the customer is sitting in the room.
  const [table, setTable] = useState(() => currentTable());
  const atTable = Boolean(table) && settings.dineInEnabled;

  // Collection, eating in and card payment only appear when the business
  // offers them, so a shop that only delivers shows no choice at all.
  const [orderType, setOrderType] = useState(() => {
    if (atTable) return "DINE_IN";
    if (settings.deliveryEnabled !== false) return "DELIVERY";
    if (settings.pickupEnabled) return "PICKUP";
    return settings.dineInEnabled ? "DINE_IN" : "PICKUP";
  });

  // A cafe can print one code for the whole room instead of one per table,
  // and hang the numbers on the tables themselves — cheaper to print, and
  // nothing to reprint when the room is rearranged. Then the customer says
  // which table they are at, so the field has to exist.
  const [typedTable, setTypedTable] = useState("");
  const tableNumber = atTable ? table : typedTable.trim();
  const dineIn = orderType === "DINE_IN";
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  // Telegram already knows who is ordering. A browser does not, so the name
  // is asked for here — and, like the phone and address, kept for next time,
  // because typing all three again is where a second order gets abandoned.
  const onWeb = !isTelegram();
  const remembered = savedContact();
  const [customerName, setCustomerName] = useState(remembered.name || "");
  const [phone, setPhone] = useState(remembered.phone || "");
  const [location, setLocation] = useState(remembered.address || "");
  const [placedOrder, setPlacedOrder] = useState(null);
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
      const order = await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
        orderType,
        paymentMethod,
        tableNumber: dineIn ? tableNumber : undefined,
        customerName: customerName.trim() || undefined,
        phone: phone || undefined,
        deliveryAddress: location || undefined,
        comment: comment || undefined,
        promoCode: promoCode || undefined,
        loyaltyPointsToRedeem: useLoyalty ? redeemPoints : 0,
      });

      notificationHaptic("success");
      if (onWeb) {
        rememberContact({ name: customerName.trim(), phone, address: location });
      }
      clearCart();
      onOrderPlaced();
      // The next order is a fresh decision — they may have left by then.
      if (atTable) forgetTable();
      // Inside Telegram the app closes and the chat behind it carries the
      // confirmation. On the website nothing is behind the page, so the
      // confirmation has to be the page.
      if (!closeMiniApp()) setPlacedOrder(order);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) {
    return (
      <OrderPlaced
        order={placedOrder}
        onBackToMenu={() => {
          setPlacedOrder(null);
          onBrowseMenu();
        }}
      />
    );
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
  const ways = [
    settings.deliveryEnabled !== false && "DELIVERY",
    settings.pickupEnabled === true && "PICKUP",
    settings.dineInEnabled === true && "DINE_IN",
  ].filter(Boolean);
  // One way of getting the order is not a choice, so it is not shown.
  const waysOffered = ways.length > 1;
  const closed = settings.opening?.isOpen === false;
  const meetsMinimum = quote ? quote.meetsMinimum : true;
  // Sold out while the cart sat open — say which dish, and offer to drop it
  // rather than leaving the customer to work out why confirm is dead.
  const soldOut = quote?.unavailableItems || [];
  const soldOutIds = new Set(soldOut.map((p) => p.id));
  // No card number, no card option: a customer who picks it would have
  // nowhere to send the money.
  const cardOffered = settings.cardPaymentEnabled && Boolean(settings.cardPaymentDetails);
  // A web order with no name, phone or address is one the kitchen cannot
  // act on, so the button stays down rather than letting the customer send
  // it and read a rejection.
  // A confirm button that will not press, with nothing saying why, is the
  // point where a customer decides the shop is broken and closes the page.
  // So the first thing still missing is named, in the order it is asked
  // for on screen.
  function whatIsMissing() {
    if (dineIn) return tableNumber ? null : "cart.needTable";
    if (!onWeb) return null;
    if (customerName.trim().length < 2) return "cart.needName";
    if (phone.trim().length < 5) return "cart.needPhone";
    if (orderType === "DELIVERY" && !location.trim()) return "cart.needAddress";
    return null;
  }
  const missingKey = whatIsMissing();
  const missingContact = Boolean(missingKey);

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

      {atTable && (
        <div className="table-note">
          <Icon name="table" size={18} strokeWidth={2} />
          <div>
            <p className="table-note-number">{t("cart.atTable", { table })}</p>
            <p className="table-note-text">{t("cart.tableNote")}</p>
          </div>
          <button
            type="button"
            className="table-note-leave"
            onClick={() => {
              forgetTable();
              setTable(null);
              setOrderType(settings.deliveryEnabled === false ? "PICKUP" : "DELIVERY");
            }}
          >
            {t("cart.notAtTable")}
          </button>
        </div>
      )}

      {!atTable && waysOffered && (
        <>
          <p className="field-label">{t("cart.howLabel")}</p>
          <div className="choice-row" role="group" aria-label={t("cart.howLabel")}>
            {ways.includes("DELIVERY") && (
              <button
                type="button"
                className={`choice ${orderType === "DELIVERY" ? "active" : ""}`}
                onClick={() => setOrderType("DELIVERY")}
              >
                <Icon name="truck" size={17} strokeWidth={2} />
                {t("cart.delivery")}
              </button>
            )}
            {ways.includes("PICKUP") && (
              <button
                type="button"
                className={`choice ${orderType === "PICKUP" ? "active" : ""}`}
                onClick={() => setOrderType("PICKUP")}
              >
                <Icon name="walk" size={17} strokeWidth={2} />
                {t("cart.pickup")}
              </button>
            )}
            {ways.includes("DINE_IN") && (
              <button
                type="button"
                className={`choice ${orderType === "DINE_IN" ? "active" : ""}`}
                onClick={() => setOrderType("DINE_IN")}
              >
                <Icon name="table" size={17} strokeWidth={2} />
                {t("cart.dineIn")}
              </button>
            )}
          </div>
        </>
      )}

      {/* Eating in, but the code that was scanned did not say which table —
          it is one code for the whole room, and the number is on the table
          in front of them. */}
      {!atTable && dineIn && (
        <input
          className="location-input"
          inputMode="numeric"
          placeholder={t("cart.tableInput")}
          value={typedTable}
          onChange={(e) => setTypedTable(e.target.value)}
        />
      )}

      {cardOffered && (
        <>
          <p className="field-label">{t("cart.paymentLabel")}</p>
          <div className="choice-row" role="group" aria-label={t("cart.paymentLabel")}>
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

      {onWeb && !dineIn && (
        <input
          className="location-input"
          placeholder={t("cart.name")}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      )}
      {!dineIn && (
        <input
          className="location-input"
          placeholder={t("cart.phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      )}
      {orderType === "DELIVERY" && (
        <input
          className="location-input"
          placeholder={t("cart.address")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      )}
      {/* Where to come and collect — which means nothing to somebody
          already sitting at one of the tables inside. */}
      {orderType === "PICKUP" &&
        settings.pickupAddress && (
          <p className="pickup-note">
            <Icon name="pin" size={16} strokeWidth={2} />
            {t("cart.pickupAddress", { address: settings.pickupAddress })}
          </p>
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

      {missingKey && !closed && meetsMinimum && soldOut.length === 0 && (
        <p className="form-hint" style={{ padding: "8px 20px 0" }}>
          {t(missingKey)}
        </p>
      )}

      <div className="cart-footer">
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={submitting || !meetsMinimum || closed || soldOut.length > 0 || missingContact}
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
