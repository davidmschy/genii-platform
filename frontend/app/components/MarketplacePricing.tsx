"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, Globe, Cpu } from "lucide-react";

const tiers = [
    {
        name: "ERP Scaffold",
        price: "$47",
        description: "The complete DNA for your autonomous business.",
        features: ["ERP Database Structure", "Obsidian Brain Template", "OpenClaw Base Config", "DIY Community Access"],
        cta: "Instant Download",
        icon: <Zap className="w-6 h-6" />,
        style: "bg-white/5 border-white/10"
    },
    {
        name: "Sovereign Scale",
        price: "$50,000",
        interval: "/mo",
        description: "For established teams seeking total optimization.",
        features: ["Integration Specialist Setup", "Custom Agent Tuning", "VPS & LLM Management", "Priority Affliate Rates"],
        cta: "Apply to Scale",
        icon: <Globe className="w-6 h-6 text-blue-400" />,
        style: "bg-blue-500/10 border-blue-500/20"
    },
    {
        name: "Enterprise Empire",
        price: "$10M",
        interval: "/yr",
        description: "Autonomous orchestration for global conglomerates.",
        features: ["Dedicated GPU Cluster", "Long-term Systems Management", "On-site Integration Team", "White-glove Ops Support"],
        cta: "Contact Sovereign Sales",
        icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
        style: "bg-purple-500/10 border-purple-500/20 shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]"
    }
];

export default function MarketplacePricing() {
    return (
        <section className="py-24 bg-black overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
                        Acquire The Operating System
                    </h2>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">
                        From single-agent scaffolds to $10M annual management.
                        Choose the tier of your autonomous future.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative luxury-card group/tier transition-all hover:scale-[1.02] cursor-pointer ${tier.style}`}
                        >
                            <div className="mb-6">{tier.icon}</div>
                            <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-5xl font-black">{tier.price}</span>
                                <span className="text-white/40">{tier.interval}</span>
                            </div>
                            <p className="text-white/60 mb-8 leading-relaxed">{tier.description}</p>

                            <ul className="space-y-4 mb-10">
                                {tier.features.map(f => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full py-4 rounded-full bg-white text-black font-bold hover:bg-neutral-200 transition-colors">
                                {tier.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
