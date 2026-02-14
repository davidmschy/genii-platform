"use client";

import Sidebar from "../components/Sidebar";
import AssistantChat from "../components/AssistantChat";
import { Settings, Shield, Server, Share2 } from "lucide-react";

export default function OpsControlPage() {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-8">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">Ops Control</h1>
                    <p className="text-neutral-400">Interconnected team VMs & Autonomous Swarm Status.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Team VMs Status */}
                    <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Server className="text-blue-400" size={20} />
                            Team Nodes
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: "Main Mission Control", ip: "192.168.1.5", status: "Online" },
                                { name: "Marketing VM", ip: "192.168.1.12", status: "Online" },
                                { name: "Sales Outreach Node", ip: "192.168.1.15", status: "Syncing" },
                                { name: "Finance Auditor", ip: "192.168.1.20", status: "Idle" },
                            ].map((node, i) => (
                                <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-neutral-800/30">
                                    <div>
                                        <div className="font-bold">{node.name}</div>
                                        <div className="text-xs text-neutral-500">{node.ip}</div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${node.status === 'Online' ? 'bg-green-500/10 text-green-400' :
                                            node.status === 'Syncing' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-500/10 text-neutral-400'
                                        }`}>
                                        {node.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* HATEOAS Swarm Map */}
                    <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Share2 className="text-purple-400" size={20} />
                            HATEOAS Discovery
                        </h3>
                        <div className="p-6 rounded-2xl bg-neutral-800/50 border border-dashed border-neutral-700">
                            <p className="text-sm text-neutral-400 mb-4 font-mono">GET /discovery/departments</p>
                            <div className="flex flex-wrap gap-2">
                                {["Growth", "Sales", "Finance", "Legal", "Ops", "R&D"].map((dept) => (
                                    <span key={dept} className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs">
                                        {dept}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Triple-Entry Ledger Feed */}
                <div className="mt-8 p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Shield className="text-green-400" size={20} />
                        Triple-Entry Ledger Feed
                    </h3>
                    <div className="space-y-3 font-mono text-[10px]">
                        {[
                            { time: "18:42:01", actor: "MKT_PA_001", action: "Spend_Allocate", recipient: "Meta_Ads", sig: "0x4f...2a" },
                            { time: "18:41:55", actor: "SLS_BD_001", action: "Enrich_Lead", recipient: "Apollo_API", sig: "0xa1...8c" },
                            { time: "18:41:30", actor: "FIN_AC_001", action: "Audit_TX_Success", recipient: "System_Core", sig: "0xdd...44" },
                        ].map((tx, i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-lg bg-neutral-800/20 text-neutral-400">
                                <span className="text-neutral-600">[{tx.time}]</span>
                                <span className="text-blue-400">{tx.actor}</span>
                                <span className="text-white">→</span>
                                <span className="text-purple-400">{tx.recipient}</span>
                                <span className="flex-1 text-center font-bold text-neutral-300">{tx.action}</span>
                                <span className="text-green-500 font-bold opacity-50">SIG_VERIFIED({tx.sig})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <AssistantChat />
        </div>
    );
}
