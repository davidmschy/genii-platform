"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Mail,
    TrendingUp,
    Settings,
    Shield
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
    { name: "Mission Control", href: "/", icon: LayoutDashboard },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Emails", href: "/emails", icon: Mail },
    { name: "Finance", href: "/finance", icon: TrendingUp },
    { name: "Ops Control", href: "/ops", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-black border-r border-neutral-800 z-40 hidden md:block">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center">
                        <Shield size={18} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter">GENII</span>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                            ? "bg-white/10 text-white"
                                            : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.name}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold">SOVEREIGN MODE</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
