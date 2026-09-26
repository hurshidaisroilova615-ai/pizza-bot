import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { api } from "../api";
import StatCard from "../components/StatCard";
import { useT } from "../i18n";

const STATUS_LABELS = {
  PENDING: "Qabul qilindi",
  PREPARING: "Tayyorlanmoqda",
  ON_DELIVERY: "Kuryerda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};

export default function Dashboard() {
  const { t } = useT();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-note">{t("Yuklanmoqda...")}</p>;
  if (!summary) return <p className="empty-note">{t("Ma'lumotlarni olishda xatolik")}</p>;

  const chartData = summary.dailyRevenue.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenue,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>{t("Statistika")}</h1>
      </div>

      <div className="stat-grid">
        <StatCard label={t("Bugungi tushum")} value={summary.today.revenue.toLocaleString()} sub={`${summary.today.orders} ta buyurtma`} />
        <StatCard label={t("Haftalik tushum")} value={summary.week.revenue.toLocaleString()} sub={`${summary.week.orders} ta buyurtma`} />
        <StatCard label={t("Oylik tushum")} value={summary.month.revenue.toLocaleString()} sub={`${summary.month.orders} ta buyurtma`} />
        <StatCard label={t("O'rtacha buyurtma")} value={summary.avgOrderValue.toLocaleString()} />
        <StatCard label={t("Yangi mijozlar (bugun)")} value={summary.newCustomers.today} accent="#1a9d5b" />
        <StatCard label={t("Yangi mijozlar (hafta)")} value={summary.newCustomers.week} accent="#1a9d5b" />
      </div>

      <div className="chart-card">
        <h3>{t("Oxirgi 30 kunlik tushum")}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ff3b30" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={60} />
            <Tooltip formatter={(v) => v.toLocaleString()} />
            <Area type="monotone" dataKey="revenue" name={t("Tushum")} stroke="#ff3b30" fill="url(#revenueFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-grid-2">
        <div className="chart-card">
          <h3>{t("Eng ko'p sotilgan mahsulotlar")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.topProducts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ececee" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#ff3b30" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t("Buyurtmalar holati")}</h3>
          <div className="status-breakdown">
            {summary.statusCounts.map((s) => (
              <div className="status-breakdown-row" key={s.status}>
                <span>{t(STATUS_LABELS[s.status] || s.status)}</span>
                <span className="status-breakdown-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
