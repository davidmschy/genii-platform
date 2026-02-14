"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Globe, Cpu } from "lucide-react";

const features = [
    {
        title: "Autonomous CRM",
        description: "Your system manages relationships, qualifies leads, and updates itself while you sleep.",
        icon: Shield,
    },
    {
        title: "Liquid Outreach",
        description: "Hyper-personalized marketing that generates meetings and closings automatically.",
        icon: Zap,
    },
    {
        title: "Global Intelligence",
        description: "Multilingual agents that handle international operations seamlessly.",
        icon: Globe,
    },
    {
        title: "Neuro-Orchestration",
        description: "Real-time coordination between your OpenClaw agents and ERP core.",
        icon: Cpu,
    },
];

export default function Features() {
    return (
        <section className="py-32 bg-black border-y border-white/5">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter gradient-text">Built for the Sovereign CEO</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="luxury-card group !p-8"
                        >
                            <div className="mb-8 inline-block p-4 rounded-2xl bg-white/5 border border-white/10 transition-colors group-hover:border-white/30">
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 italic">{feature.title}</h3>
                            <p className="text-white/40 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
