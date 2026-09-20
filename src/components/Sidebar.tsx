"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, MessageSquare, Settings, Users, LogOut, X, Sparkles, FileText, Factory, UserCheck } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Services", href: "/services", icon: Briefcase },
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
      <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100/80">
        <div className="flex items-center">
          <Image
            src="/vibe_venture_logo.svg"
            alt="Vibe Venture Logo"
            width={160}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
              <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3.5 py-2.5 mx-1 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-linear-to-r from-violet-600 to-violet-500 text-white font-semibold shadow-[0_8px_20px_-6px_rgba(124,58,237,0.55)]"
                  : "text-gray-500 hover:bg-violet-50/70 hover:text-violet-700"
              }`}
            >
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-300 ${
                isActive ? "bg-white/15" : "bg-transparent group-hover:bg-violet-100/70"
              }`}>
                <Icon className={`w-[18px] h-[18px] transition-colors duration-300 ${isActive ? "text-white" : "text-gray-400 group-hover:text-violet-600"}`} />
              </span>
              <span className="text-[14.5px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-2.5 mx-1 w-[calc(100%-0.5rem)] rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 font-medium group shadow-sm hover:shadow-md"
          >
            <LogOut className="w-[18px] h-[18px] text-gray-400 group-hover:text-red-500 transition-colors" />
            <span className="text-[14.5px]">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
