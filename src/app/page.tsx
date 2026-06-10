import { Wrench, Briefcase, PenTool, Mail } from "lucide-react";
import StatCard from "@/components/StatCard";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  });

  // Fetch counts
  const { count: servicesCount } = await supabase.from('services').select('*', { count: 'exact', head: true });
  const { count: portfolioCount } = await supabase.from('case_studies').select('*', { count: 'exact', head: true });
  const { count: blogsCount } = await supabase.from('blogs').select('*', { count: 'exact', head: true });
  const { count: inquiriesCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('type', 'inquiry');

  // Fetch recent items for Activity feed
  const [blogsRes, portfolioRes, notifRes] = await Promise.all([
    supabase.from('blogs').select('id, title, created_at, author:authors(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('case_studies').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('id, title, message, created_at, type').order('created_at', { ascending: false }).limit(5)
  ]);

  // Merge and sort activities
  type Activity = { id: string; type: string; title: string; subtitle: string; created_at: string; initials: string };
  let activities: Activity[] = [];

  (blogsRes.data || []).forEach(b => {
    const author: any = Array.isArray(b.author) ? b.author[0] : b.author;
    activities.push({
      id: `blog_${b.id}`,
      type: 'blog',
      title: `New blog post published: "${b.title}"`,
      subtitle: `By ${author?.name || 'Admin'}`,
      created_at: b.created_at,
      initials: 'BP'
    });
  });

  (portfolioRes.data || []).forEach(p => {
    activities.push({
      id: `port_${p.id}`,
      type: 'portfolio',
      title: `New case study added: "${p.title}"`,
      subtitle: `System Activity`,
      created_at: p.created_at,
      initials: 'CS'
    });
  });

  (notifRes.data || []).forEach(n => {
    activities.push({
      id: `notif_${n.id}`,
      type: 'notification',
      title: n.title,
      subtitle: n.message.substring(0, 50) + (n.message.length > 50 ? '...' : ''),
      created_at: n.created_at,
      initials: n.type === 'inquiry' ? 'IN' : 'NF'
    });
  });

  // Sort by newest first and take top 6
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentActivities = activities.slice(0, 6);

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">Welcome to the Vibe Venture Admin Panel.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Services"
            value={servicesCount?.toString() || "0"}
            icon={Wrench}
            trend={{ value: 2, isPositive: true }}
          />
          <StatCard
            title="Portfolio Items"
            value={portfolioCount?.toString() || "0"}
            icon={Briefcase}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Blog Posts"
            value={blogsCount?.toString() || "0"}
            icon={PenTool}
            trend={{ value: 3, isPositive: true }}
          />
          <StatCard
            title="New Inquiries"
            value={inquiriesCount?.toString() || "0"}
            icon={Mail}
            trend={{ value: 12, isPositive: true }}
          />
        </div>

        <div className="pt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Recent Activity</h2>
            
            <div className="space-y-6">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No recent activity yet.</p>
              ) : (
                recentActivities.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shrink-0 ${
                      item.type === 'blog' ? 'bg-purple-50 text-purple-600' :
                      item.type === 'portfolio' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {item.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo(item.created_at)} • {item.subtitle}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
