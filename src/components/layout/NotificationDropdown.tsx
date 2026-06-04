"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { clsx } from "clsx";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-navy-700 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full mt-2 z-20 w-80 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-navy-900 text-sm">الإشعارات</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-teal-600 hover:underline">
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">لا توجد إشعارات</p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={clsx(
                      "px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                      !n.isRead && "bg-blue-50"
                    )}
                  >
                    <p className="text-sm font-medium text-navy-900">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("ar-SA")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
