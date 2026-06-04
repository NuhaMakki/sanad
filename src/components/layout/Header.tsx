"use client";

import { Menu } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-500 hover:text-navy-700 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-navy-900">{title}</h1>
      </div>
      <NotificationDropdown />
    </header>
  );
}
