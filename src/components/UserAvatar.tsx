"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, type SessionUser } from "@/lib/client-auth";

type Props = { user: SessionUser };

function roleLabel(role: SessionUser["role"]) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function avatarColor(name: string) {
  const colors = [
    "bg-green-700 text-white",
    "bg-emerald-600 text-white",
    "bg-teal-600 text-white",
    "bg-green-800 text-white",
    "bg-lime-700 text-white",
  ];
  return colors[(name.charCodeAt(0) ?? 0) % colors.length];
}

export default function UserAvatar({ user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);
  const initial = user.fullName.charAt(0).toUpperCase();
  const color   = avatarColor(user.fullName);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleLogout() {
    setOpen(false);
    clearSession();
    router.push("/login");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}>
          {initial}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">{user.fullName}</span>
          <span className="text-[10px] text-green-700 uppercase tracking-wider font-medium">{roleLabel(user.role)}</span>
        </span>
        <span className={`hidden md:block material-symbols-outlined text-sm text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden slide-down"
        >
          {/* User info */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${color}`}>
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-[10px] uppercase tracking-wider text-green-700 font-medium">{roleLabel(user.role)}</p>
              {user.location && <p className="truncate text-[10px] text-gray-400">{user.location}</p>}
            </div>
          </div>

          {/* Menu items */}
          <ul className="py-1">
            <MenuItem icon="person"   label="Profile"  onClick={() => setOpen(false)} />
            <MenuItem icon="settings" label="Settings" onClick={() => setOpen(false)} />
            <li role="separator" className="my-1 border-t border-gray-100" />
            <MenuItem icon="logout"   label="Logout"   onClick={handleLogout} danger />
          </ul>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger = false }: {
  icon: string; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <li role="none">
      <button
        role="menuitem"
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 focus:outline-none ${
          danger ? "text-red-600 hover:text-red-700" : "text-gray-700 hover:text-gray-900"
        }`}
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
      </button>
    </li>
  );
}
