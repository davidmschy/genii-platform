"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Activity } from "lucide-react";

export default function RoiDashboard() {
    const [profit, setProfit] = useState(0);

    // Simulate real-time profit ticking up
    useEffect(() => {
        const interval = setInterval(() => {
            setProfit((prev) => prev + Math.floor(Math.random() * 150));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-20 bg-neutral-900 text-white">
            <div className="container px-4 md:px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Real-Time ROI</h2>
                    <p className="text-neutral-400">Your enterprise, quantified.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Card 1: System Cost */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-2xl bg-neutral-800 border border-neutral-700"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-red-500/20 text-red-500">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold">System Cost</h3>
                        </div>
                        <p className="text-4xl font-bold text-neutral-300">
                            $1,200,000
                        </p>
                        <p className="text-sm text-neutral-500 mt-2">Annual Flat Fee</p>
                    </motion.div>

                    {/* Card 2: Revenue Generated */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-2xl bg-neutral-800 border border-neutral-700"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-green-500/20 text-green-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Revenue Generated</h3>
                        </div>
                        <p className="text-4xl font-bold text-green-400">
                            ${(1200000 + profit).toLocaleString()}
                        </p>
                        <p className="text-sm text-neutral-500 mt-2">
                            Autonomous Sales & Outreach
                        </p>
                    </motion.div>

                    {/* Card 3: Passive Revenue (Affiliates) */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-2xl bg-neutral-800 border border-neutral-700"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-purple-500/20 text-purple-500">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Passive Revenue</h3>
                        </div>
                        <p className="text-4xl font-bold text-purple-400">
                            ${(profit * 0.12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-sm text-neutral-500 mt-2">
                            Affiliates & Fulfillment Markups
                        </p>
                    </motion.div>

                    {/* Card 4: Net Profit */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-2xl bg-neutral-800 border border-neutral-700 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-green-500/10 blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-blue-500/20 text-blue-500">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold">Net Profit</h3>
                            </div>
                            <p className="text-5xl font-bold text-white">
                                ${(profit * 1.12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-sm text-neutral-400 mt-2">
                                Pure Profit (After System Cost)
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
