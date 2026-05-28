import { Users, MailOpen, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import TrafficChart from "@/components/TrafficChart";

export default function Home() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back. Here is what is happening with Vibe Venture today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Visitors"
            value="124,592"
            icon={Users}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Active Inquiries"
            value="84"
            icon={MailOpen}
            trend={{ value: 4.2, isPositive: false }}
          />
          <StatCard
            title="Conversion Rate"
            value="3.2%"
            icon={TrendingUp}
            trend={{ value: 1.8, isPositive: true }}
          />
        </div>

        <div className="pt-4">
          <TrafficChart />
        </div>
      </div>
    </div>
  );
}
