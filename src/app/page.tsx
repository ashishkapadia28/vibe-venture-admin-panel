import { Wrench, Briefcase, PenTool, Mail, Sparkles } from "lucide-react";
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
        <header className="bg-gradient-to-r from-violet-600 to-violet-900 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">Welcome back, Admin! <span className="inline-block hover:animate-bounce">👋</span></h1>
            <p className="text-violet-100/90 text-sm sm:text-base max-w-lg leading-relaxed">Here's what's happening with Vibe Venture today. Monitor your portfolio, blogs, and new inquiries all in one place.</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <Sparkles className="w-64 h-64" />
          </div>
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

        <div className="pt-2">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 sm:p-8 relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
              <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-600 rounded-full border border-violet-100">Live Updates</span>
            </div>
            
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-full">No recent activity yet.</p>
                </div>
              ) : (
                recentActivities.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white transition-all duration-300 border border-transparent hover:border-gray-100 hover:shadow-sm group">
                    <div className={`w-12 h-12 rounded-xl font-bold flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                      item.type === 'blog' ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600' :
                      item.type === 'portfolio' ? 'bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600' :
                      'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600'
                    }`}>
                      {item.initials}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-[15px] font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-gray-400">{timeAgo(item.created_at)}</span> 
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        {item.subtitle}
                      </p>
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
