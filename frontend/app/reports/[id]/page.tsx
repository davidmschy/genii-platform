'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        // In reality, fetch from http://localhost:8000/reports/${id}
        setReport({
            title: "Autonomous Enterprise Report",
            client: "Genii High-Net-Worth Division",
            metrics: {
                roi: "420%",
                delivered_value: "$1.2M",
                time_saved: "2,400 hrs"
            }
        });
    }, [id]);

    if (!report) return <div className="p-20 text-white">Loading Intelligence...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-10 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <header className="border-b border-white/10 pb-10 mb-20">
                    <h1 className="text-6xl font-extrabold tracking-tighter mb-4 gradient-text">
                        {report.title}
                    </h1>
                    <p className="text-xl text-white/50">Exclusive briefing for {report.client}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {Object.entries(report.metrics).map(([key, value]: [string, any]) => (
                        <div key={key} className="glass p-8 rounded-3xl border border-white/5 bg-white/5">
                            <p className="text-white/40 uppercase text-xs tracking-widest mb-2">{key.replace('_', ' ')}</p>
                            <p className="text-4xl font-bold">{value}</p>
                        </div>
                    ))}
                </div>

                <section className="glass p-12 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl">
                    <h2 className="text-3xl font-bold mb-8 italic">Autonomous Insights</h2>
                    <p className="text-lg leading-relaxed text-white/70">
                        The Genii platform has successfully orchestrated 14 material deliveries and
                        secured 3 building permits across independent municipalities.
                        Your ROI is currently tracking at 4.2x the initial investment.
                    </p>
                </section>
            </motion.div>
        </div>
    );
}
