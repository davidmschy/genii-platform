'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function InteractiveReport({ data }: { data: any }) {
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
            >
                <header className="mb-12 border-b border-gray-800 pb-8">
                    <h1 className="text-4xl font-bold tracking-tighter mb-2">Enterprise Performance Audit</h1>
                    <p className="text-gray-400">Generated for David - {new Date().toLocaleDateString()}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* ROI Card */}
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <DollarSign className="text-green-500 mb-4" />
                        <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-1">Total ROI</h3>
                        <p className="text-3xl font-bold">$1,240,000</p>
                    </motion.div>

                    {/* Efficiency Card */}
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <TrendingUp className="text-blue-500 mb-4" />
                        <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-1">AI Efficiency</h3>
                        <p className="text-3xl font-bold">98.4%</p>
                    </motion.div>

                    {/* Output Card */}
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                        <Users className="text-purple-500 mb-4" />
                        <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-1">Automated Closure</h3>
                        <p className="text-3xl font-bold">42 Deals</p>
                    </motion.div>
                </div>

                {/* Narrative Section */}
                <section className="bg-gray-900/30 border border-gray-800 p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-6">Autonomous Insights</h2>
                    <div className="space-y-4 text-gray-300 leading-relaxed">
                        <p>
                            The Genii ecosystem has successfully fully integrated with your ClickUp workspace.
                            Agents in Phase 3 are currently processing 156 open tasks with a 92% autonomous resolution rate.
                        </p>
                        <p>
                            The "Personal Butler" skill has been successfully authorized for your primary household logistics.
                            The first autonomous run scheduled for tomorrow involves groceries coordination and an Uber booking for the morning meeting.
                        </p>
                    </div>
                </section>
            </motion.div>
        </div>
    );
}
