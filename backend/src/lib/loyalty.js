const prisma = require("./prisma");

// Points earned from an order subtotal, based on the business's earn rate
// (e.g. 0.05 => 5% of the amount paid comes back as points).
function calculateEarnedPoints(subtotal, settings) {
  if (!settings.loyaltyEnabled) return 0;
  return Math.floor(subtotal * settings.loyaltyEarnRate);
}

// Currency value of a number of points, used to cap/convert redemptions.
function pointsToValue(points, settings) {
  return points * settings.loyaltyPointValue;
}

async function recordTransaction(tx, { userId, orderId = null, type, points, note }) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  const balanceAfter = user.loyaltyPoints + points;
  await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: balanceAfter } });
  await tx.loyaltyTransaction.create({
    data: { userId, orderId, type, points, balanceAfter, note },
  });
  return balanceAfter;
}

async function earnPoints(tx, { userId, orderId, points, note }) {
  if (points <= 0) return;
  await recordTransaction(tx, { userId, orderId, type: "EARN", points, note });
}

async function redeemPoints(tx, { userId, orderId, points, note }) {
  if (points <= 0) return;
  await recordTransaction(tx, { userId, orderId, type: "REDEEM", points: -points, note });
}

async function getLoyaltySummary(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const recent = await prisma.loyaltyTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { balance: user.loyaltyPoints, transactions: recent };
}

module.exports = {
  calculateEarnedPoints,
  pointsToValue,
  earnPoints,
  redeemPoints,
  getLoyaltySummary,
};
