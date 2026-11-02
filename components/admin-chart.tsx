"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminChart({ data }: { data: { day: string; sales: number }[] }) {
  return <div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
    <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a55c77" stopOpacity={0.22} /><stop offset="95%" stopColor="#a55c77" stopOpacity={0.01} /></linearGradient></defs>
    <CartesianGrid stroke="#f0e8e9" vertical={false} />
    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#9b8d92", fontSize: 11 }} />
    <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fill: "#9b8d92", fontSize: 11 }} />
    <Tooltip formatter={(value) => [Number(value).toLocaleString("ar-EG") + " ج.م", "المبيعات"]} contentStyle={{ borderRadius: 12, border: "1px solid #f0e8e9", fontFamily: "inherit" }} />
    <Area type="monotone" dataKey="sales" stroke="#a55c77" strokeWidth={2.5} fill="url(#sales-fill)" />
  </AreaChart></ResponsiveContainer></div>;
}
