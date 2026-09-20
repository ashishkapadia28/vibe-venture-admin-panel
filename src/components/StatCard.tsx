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
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(124,58,237,0.1)] group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        </div>
        
        {trend && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
              trend.isPositive ? "bg-violet-50 text-violet-600 border border-violet-100" : "bg-red-50 text-red-600 border border-red-100"
            }`}
          >
            {trend.isPositive ? "+" : "-"}{trend.value}
          </span>
        )}
      </div>
      
      <div>
        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 tracking-tight">{value}</span>
      </div>
    </div>
  );
}
