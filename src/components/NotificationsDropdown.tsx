"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, MessageSquare, Briefcase, Mail, Info, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read_status: boolean;
  created_at: string;
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setHasUnread(true);
        }
      )
      .subscribe();

    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) {
      setNotifications(data);
      setHasUnread(data.some(n => !n.read_status));
    }
  }

  async function markAsRead(id: string) {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read_status: true } : n)
    );
    
    // Check if there are any other unread notifications
    setHasUnread(notifications.some(n => n.id !== id && !n.read_status));

    // Update in DB
    await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('id', id);
  }

  async function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    setHasUnread(false);
    
    const unreadIds = notifications.filter(n => !n.read_status).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('notifications')
        .update({ read_status: true })
        .in('id', unreadIds);
    }
  }

  function getIconForType(type: string) {
    switch (type) {
      case 'inquiry':
      case 'query':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'job':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return `Yesterday`;
    return date.toLocaleDateString();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
      >
        <Bell className="w-5 h-5" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {hasUnread && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet. You're all caught up!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => !notification.read_status && markAsRead(notification.id)}
                    className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 ${!notification.read_status ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`p-2 rounded-full shrink-0 ${!notification.read_status ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                        {getIconForType(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${!notification.read_status ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${!notification.read_status ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read_status && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
