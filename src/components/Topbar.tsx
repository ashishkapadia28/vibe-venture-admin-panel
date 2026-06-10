"use client";

import { usePathname } from "next/navigation";
import { AlertTriangle, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import NotificationsDropdown from "./NotificationsDropdown";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/services": "Services Management",
  "/industries": "Industries",
  "/blogs": "Blog Posts",
  "/authors": "Authors",
  "/case-studies": "Case Studies",
  "/jobs": "Jobs",
  "/inquiries": "Inquiries",
  "/settings": "Settings",
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Find the exact match or default to a generic title
  let title = "Dashboard";
  if (pathname !== "/") {
    const matchedRoute = Object.keys(routeTitles).find(route => route !== "/" && pathname.startsWith(route));
    if (matchedRoute) {
      title = routeTitles[matchedRoute];
    }
  }

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

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 hidden sm:block">{title}</h2>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Maintenance Toggle */}
        <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Maintenance Mode</span>
          </div>
          <button 
            onClick={toggleMaintenance}
            disabled={isLoading}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${isMaintenance ? 'bg-amber-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isMaintenance ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer pl-4 sm:pl-6 border-l border-gray-200">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900 leading-tight">Admin User</span>
            <span className="text-xs text-gray-500">Administrator</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            AU
          </div>
        </div>
      </div>
    </header>
  );
}
