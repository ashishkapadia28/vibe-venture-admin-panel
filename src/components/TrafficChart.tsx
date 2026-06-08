"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Week 1", visitors: 4000, inquiries: 240 },
  { name: "Week 2", visitors: 3000, inquiries: 139 },
  { name: "Week 3", visitors: 5000, inquiries: 480 },
  { name: "Week 4", visitors: 7800, inquiries: 890 },
];

export default function TrafficChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full h-[400px]">
      <h3 className="text-gray-900 font-medium mb-6">Traffic & Inquiries (Last 30 Days)</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.8} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#ffffff", 
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="visitors" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
            />
            <Line 
              type="monotone" 
              dataKey="inquiries" 
              stroke="#9ca3af" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#9ca3af", strokeWidth: 2, stroke: "#ffffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
