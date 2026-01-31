'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatWindow() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        setInputValue('');

        // Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] })
            });

            if (!response.ok) throw new Error(response.statusText);

            // Create placeholder for AI response
            const aiMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

            // Stream Reader
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No reader available");

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();

                    // Skip empty lines and comments
                    if (!trimmed || trimmed.startsWith(':')) continue;

                    // Handle SSE data lines
                    if (trimmed.startsWith('data:')) {
                        const jsonStr = trimmed.slice(5).trim();

                        // Skip [DONE] marker
                        if (jsonStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(jsonStr);
                            const content = data.choices?.[0]?.delta?.content || '';

                            if (content) {
                                setMessages(prev => prev.map(m =>
                                    m.id === aiMsgId
                                        ? { ...m, content: m.content + content }
                                        : m
                                ));
                            }
                        } catch {
                            // If not JSON, it might be plain text (local fallback)
                            if (jsonStr && !jsonStr.startsWith('{')) {
                                setMessages(prev => prev.map(m =>
                                    m.id === aiMsgId
                                        ? { ...m, content: m.content + jsonStr }
                                        : m
                                ));
                            }
                        }
                    } else if (!trimmed.startsWith('event:')) {
                        // Plain text response (local fallback)
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId
                                ? { ...m, content: m.content + trimmed }
                                : m
                        ));
                    }
                }
            }

        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: "⚠️ Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-transform hover:scale-105 hover:bg-blue-700"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle size={28} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[90vw] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Health Coach</h3>
                        <p className="text-xs text-slate-500">Always available</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4">
                {messages.length === 0 && (
                    <div className="mt-8 text-center text-sm text-slate-400">
                        <p>👋 Hi! I'm your AI Coach.</p>
                        <p>Ask me about workouts or nutrition!</p>
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                                    max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                    ${m.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                    }
                                `}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            </div>
                        </div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-slate-100 bg-white px-4 py-3 shadow-sm">
                                <Loader2 size={16} className="animate-spin text-blue-600" />
                                <span className="text-xs text-slate-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-slate-100 bg-white p-3">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask anything..."
                        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
            </form>
        </div>
    );
}
