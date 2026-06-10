import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-3">
          <Icon className="w-6 h-6 text-gray-400" />
          <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        </div>
        
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : "-"}{trend.value}
          </span>
        )}
      </div>
      
      <div>
        <span className="text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
      </div>
    </div>
  );
}
