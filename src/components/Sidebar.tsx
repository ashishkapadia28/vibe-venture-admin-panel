"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, MessageSquare, Settings, Users, LogOut, AlertTriangle } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Case Studies", href: "/case-studies", icon: Briefcase },
  { name: "Jobs", href: "/jobs", icon: Users },
  { name: "Inquiries", href: "/inquiries", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMaintenanceStatus() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("maintenance_mode")
        .eq("id", "global")
        .single();
        
      if (data) {
        setIsMaintenance(data.maintenance_mode);
      }
      setIsLoading(false);
    }
    
    fetchMaintenanceStatus();
  }, [supabase]);

  const toggleMaintenance = async () => {
    const newValue = !isMaintenance;
    setIsMaintenance(newValue); // Optimistic UI update
    
    const { error } = await supabase
      .from("site_settings")
      .update({ maintenance_mode: newValue })
      .eq("id", "global");
      
    if (error) {
      console.error("Error updating maintenance mode:", error);
      // Revert on error
      setIsMaintenance(!newValue);
    }
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-blue-600 font-bold text-xl tracking-wider">VIBE VENTURE</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 flex flex-col gap-4">
        {/* Maintenance Mode Toggle */}
        <div className="px-3 py-3 bg-amber-50 rounded-md border border-amber-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Maintenance Mode</span>
            </div>
            <button 
              onClick={toggleMaintenance}
              disabled={isLoading}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${isMaintenance ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isMaintenance ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-xs text-amber-600/80 leading-tight">
            {isMaintenance ? "Site is currently offline for visitors." : "Site is live for all visitors."}
          </p>
        </div>

        <form action={logoutAction}>
          <button 
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </form>
        <div className="text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()} Vibe Venture
        </div>
      </div>
    </aside>
  );
}
