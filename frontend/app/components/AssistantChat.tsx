"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, X, Bot } from "lucide-react";

export default function AssistantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Welcome back. How can I assist with your enterprise today?" }
    ]);
    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages([...messages, userMessage]);
        setInput("");

        // Mock backend call
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `I'm processing your request: "${input}". I'll update the relevant dashboard shortly.`
            }]);
        }, 1000);
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 p-4 rounded-full bg-white text-black shadow-2xl z-50 hover:scale-110 transition-transform"
                >
                    <MessageSquare size={24} />
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-8 right-8 w-96 h-[500px] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                                    <Bot size={20} />
                                </div>
                                <span className="font-semibold text-sm">Genii Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                            ? 'bg-white text-black'
                                            : 'bg-neutral-800 text-neutral-200'
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-full py-3 px-6 pr-12 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1.5 p-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
