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
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-blue-600" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-gray-600 font-medium">{title}</h3>
        </div>
        
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
          
          {trend && (
            <span
              className={`text-sm font-medium mb-1 ${
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
