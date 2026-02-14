"use client";

import Sidebar from "../components/Sidebar";
import AssistantChat from "../components/AssistantChat";
import RoiDashboard from "../components/RoiDashboard";

export default function FinancePage() {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-8">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">Finance & ROI</h1>
                    <p className="text-neutral-400">Strategic autonomous revenue tracking.</p>
                </header>

                <RoiDashboard />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
                        <h3 className="text-xl font-semibold mb-6">Revenue Breakdown</h3>
                        {/* Placeholder for chart */}
                        <div className="h-64 rounded-2xl bg-neutral-800/50 flex items-center justify-center border border-dashed border-neutral-700">
                            <span className="text-neutral-500">Autonomous Sales Chart Coming Soon</span>
                        </div>
                    </div>
                    <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
                        <h3 className="text-xl font-semibold mb-6">Asset Valuation</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Main Enterprise Node", value: "$4.2M" },
                                { label: "Autonomous Intellectual Prop", value: "$1.8M" },
                                { label: "R2 Content Lake", value: "$320k" },
                            ].map((asset, i) => (
                                <div key={i} className="flex justify-between p-4 rounded-xl bg-neutral-800/30">
                                    <span className="text-neutral-400">{asset.label}</span>
                                    <span className="font-mono font-bold">{asset.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <AssistantChat />
        </div>
    );
}
