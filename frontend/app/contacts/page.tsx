"use client";

import Sidebar from "../components/Sidebar";
import AssistantChat from "../components/AssistantChat";
import { Search, UserPlus } from "lucide-react";

export default function ContactsPage() {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Receptionist CRM</h1>
                        <p className="text-neutral-400">Contacts gathered by your receptionist agents.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                className="bg-neutral-900 border border-neutral-800 rounded-full py-2.5 px-10 text-sm focus:outline-none focus:border-purple-500 w-64"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors">
                            <UserPlus size={18} />
                            Add Manual
                        </button>
                    </div>
                </header>

                <div className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-800">
                                <th className="p-6 text-xs uppercase tracking-widest text-neutral-500">Contact</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-neutral-500">Source Agent</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-neutral-500">Sentiment</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-neutral-500">Status</th>
                                <th className="p-6 text-xs uppercase tracking-widest text-neutral-500 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: "Sarah Collins", email: "sarah@techcorp.com", agent: "Reception-Alpha", sentiment: "High Interest", status: "Outbound Sent" },
                                { name: "Mark Peterson", email: "m.p@finholdings.net", agent: "Reception-Beta", sentiment: "Neutral", status: "Follow-up TBD" },
                                { name: "Elena Rodriguez", email: "elena@designstudio.io", agent: "Reception-Alpha", sentiment: "Positive", status: "Meeting Booked" },
                            ].map((contact, i) => (
                                <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                                    <td className="p-6">
                                        <div className="font-semibold">{contact.name}</div>
                                        <div className="text-xs text-neutral-500">{contact.email}</div>
                                    </td>
                                    <td className="p-6 text-sm text-neutral-300">{contact.agent}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${contact.sentiment === 'High Interest' ? 'bg-green-500/10 text-green-400' :
                                                contact.sentiment === 'Positive' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-500/10 text-neutral-400'
                                            }`}>
                                            {contact.sentiment}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm text-neutral-400">{contact.status}</td>
                                    <td className="p-6 text-right">
                                        <button className="text-xs font-bold text-white hover:underline underline-offset-4">View History</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
            <AssistantChat />
        </div>
    );
}
