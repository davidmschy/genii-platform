"use client";

import Sidebar from "../components/Sidebar";
import AssistantChat from "../components/AssistantChat";
import { Mail, ShieldCheck, Zap } from "lucide-react";

export default function EmailsPage() {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-8">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">Email Command</h1>
                    <p className="text-neutral-400">Autonomous filtering and prioritization.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden">
                        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                            <h3 className="font-semibold">Priority Inbox</h3>
                            <span className="text-xs text-neutral-500">2 Unread - Sorted by Relevance</span>
                        </div>
                        <div className="divide-y divide-neutral-800/50">
                            {[
                                { from: "Investor Alpha", subject: "Follow-up on Seed Round", snippet: "The details we discussed regarding the autonomous node scaling...", time: "12m ago", priority: "High" },
                                { from: "Legal Core", subject: "Compliance Update - EU", snippet: "Revised terms for sovereign AI deployment are attached for review...", time: "1h ago", priority: "Action Required" },
                                { from: "Ops Agent", subject: "Daily Briefing: 2026-02-12", snippet: "All systems operational. 42 leads contacted today with 3 meetings...", time: "4h ago", priority: "Info" },
                            ].map((email, i) => (
                                <div key={i} className="p-6 hover:bg-neutral-800/20 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold">{email.from}</div>
                                        <div className="text-xs text-neutral-500">{email.time}</div>
                                    </div>
                                    <div className="text-sm font-semibold mb-1 flex items-center gap-2 text-neutral-200">
                                        {email.subject}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${email.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                                email.priority === 'Action Required' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {email.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-500 line-clamp-1 group-hover:text-neutral-400">{email.snippet}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/20">
                            <Zap className="text-purple-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Smart Summaries</h3>
                            <p className="text-sm text-neutral-400 mb-6">Assistant has summarized 24 non-priority emails today.</p>
                            <button className="w-full py-3 bg-purple-600 rounded-2xl font-bold hover:bg-purple-500 transition-colors">Read Summary</button>
                        </div>

                        <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
                            <ShieldCheck className="text-green-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Zero-Trust Filter</h3>
                            <p className="text-sm text-neutral-400">140 Spam/Phishing attempts blocked in the last 24h.</p>
                        </div>
                    </div>
                </div>
            </main>
            <AssistantChat />
        </div>
    );
}
