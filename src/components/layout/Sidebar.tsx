"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Ticket, MessageSquare, Users, FileText,
  Settings, ClipboardList, Building2, LogOut, GraduationCap,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const studentNav: NavItem[] = [
  { href: "/student/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/student/queue/new", label: "حجز خدمة", icon: Ticket },
  { href: "/student/chat", label: "المساعد الذكي", icon: MessageSquare },
];

const advisorNav: NavItem[] = [
  { href: "/advisor/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/advisor/students", label: "الطلاب", icon: Users },
  { href: "/advisor/reports", label: "التقارير", icon: FileText },
];

const staffNav: NavItem[] = [
  { href: "/staff/dashboard", label: "قائمة الانتظار", icon: LayoutDashboard },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/units", label: "الوحدات الخدمية", icon: Building2 },
  { href: "/admin/settings", label: "إعدادات النظام", icon: Settings },
  { href: "/admin/audit", label: "سجل الأحداث", icon: ClipboardList },
];

const roleNavMap: Record<string, NavItem[]> = {
  STUDENT: studentNav,
  ADVISOR: advisorNav,
  STAFF: staffNav,
  ADMIN: adminNav,
};

interface SidebarProps {
  role: string;
  name: string;
  onMobileClose?: () => void;
}

export function Sidebar({ role, name, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = roleNavMap[role] ?? [];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="flex flex-col h-full bg-navy-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-lg leading-tight">سند</p>
          <p className="text-xs text-navy-300">جامعة الإمام</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-teal-600 text-white"
                  : "text-navy-200 hover:bg-navy-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-navy-700">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-navy-400 mb-3">{roleLabel(role)}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    STUDENT: "طالب",
    ADVISOR: "مرشد أكاديمي",
    STAFF: "موظف",
    ADMIN: "مدير النظام",
  };
  return map[role] ?? role;
}
