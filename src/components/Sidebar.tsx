"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, MessageSquare, Settings, Users, LogOut, X, Sparkles, FileText, Factory, UserCheck } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Services", href: "/services", icon: Briefcase },
  { name: "Industries", href: "/industries", icon: Factory },
  { name: "Blogs", href: "/blogs", icon: FileText },
  { name: "Authors", href: "/authors", icon: UserCheck },
  { name: "Case Studies", href: "/case-studies", icon: Briefcase },
  { name: "Jobs", href: "/jobs", icon: Users },
  { name: "Inquiries", href: "/inquiries", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="h-20 flex items-center justify-between px-6 border-b border-transparent">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h1 className="text-gray-900 font-bold text-xl tracking-tight">vibe <span className="text-emerald-600 font-medium">venture</span></h1>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              <span className="text-[15px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-transparent mt-auto">
        <form action={logoutAction}>
          <button 
            type="submit"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[15px]">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
