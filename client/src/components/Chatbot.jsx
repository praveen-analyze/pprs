import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            text: "Hi! I'm Municipal Buddy 😊\nHow can I help you today?",
            sender: 'bot'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [flowState, setFlowState] = useState({
        intent: null,
        category: '',
        location: '',
        description: '',
        photo: null,
        awaiting: 'category'
    });
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() && !selectedPhoto) return;

        const userText = input.trim() || (selectedPhoto ? `Photo uploaded: ${selectedPhoto.name}` : '');
        const userMsg = { text: userText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', userText);
            formData.append('flowState', JSON.stringify(flowState));
            formData.append('history', JSON.stringify(messages.slice(-5).map(m => ({
                    role: m.sender === 'bot' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                }))));
            if (selectedPhoto) {
                formData.append('photo', selectedPhoto);
            }

            const response = await api.post('/chat', formData);

            if (response.data.success) {
                const botMsg = { text: response.data.response, sender: 'bot' };
                setMessages(prev => [...prev, botMsg]);

                if (response.data.flowState) {
                    setFlowState(response.data.flowState);
                }
                
                // Special check for navigation actions
                if (response.data.action === 'navigate' && response.data.path) {
                    setTimeout(() => {
                        navigate(response.data.path);
                    }, 1500);
                }
            } else {
                setMessages(prev => [...prev, { text: "Sorry, I'm having trouble thinking right now.", sender: 'bot' }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = error?.response?.data?.error || "Failed to connect. Please try again.";
            setMessages(prev => [...prev, { text: errorMessage, sender: 'bot' }]);
        } finally {
            setSelectedPhoto(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setIsLoading(false);
        }
    };

    const handlePhotoSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedPhoto(file);
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[410px] h-[540px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.28)] border border-slate-200/80 flex flex-col overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-[#1455a0] via-primary-600 to-[#2f79c7] p-4 flex items-center justify-between text-white">
                        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '10px 10px' }}></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 ring-1 ring-white/40 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-[1.35rem] tracking-tight leading-tight">Municipal Buddy</h3>
                                <p className="text-xs text-primary-50/95 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Online • Always here to help
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/15 p-1.5 rounded-lg transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-[#eef4fb] scroll-smooth">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[fade-in_0.2s_ease-out]`}>
                                <div className={`max-w-[84%] px-4 py-3 rounded-2xl text-[1.04rem] leading-relaxed shadow-sm border ${
                                    m.sender === 'user' 
                                    ? 'bg-gradient-to-br from-primary-600 to-[#1e5fa8] text-white rounded-tr-sm border-primary-700/30 shadow-[0_10px_24px_rgba(20,85,160,0.28)]' 
                                    : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm'
                                }`}>
                                    <p className="whitespace-pre-line break-words">{m.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-200">
                        {selectedPhoto && (
                            <div className="mb-2 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-3 py-2">
                                <span className="text-xs text-primary-800 truncate font-medium">📸 {selectedPhoto.name}</span>
                                <button
                                    onClick={() => {
                                        setSelectedPhoto(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-300 focus-within:ring-2 focus-within:ring-primary-600/20 focus-within:border-primary-600/40 transition-all">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={handlePhotoSelect}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="text-slate-500 hover:text-primary-700 p-2.5 rounded-xl transition-colors disabled:opacity-50"
                                title="Upload photo"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 00-5.656-5.656L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                                </svg>
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 bg-white border border-slate-300 rounded-xl outline-none focus:ring-0 text-sm px-3 py-2 text-slate-800 placeholder-slate-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || (!input.trim() && !selectedPhoto)}
                                className="bg-gradient-to-br from-primary-600 to-[#1d5ea8] text-white p-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all shadow-md active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_20px_35px_rgba(15,23,42,0.3)] transition-all duration-300 transform active:scale-90 ${
                    isOpen ? 'bg-slate-100 text-slate-600 rotate-180 hover:bg-slate-200' : 'bg-gradient-to-br from-primary-600 to-[#1d5ea8] text-white hover:brightness-110 hover:scale-110'
                }`}
            >
                {isOpen ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default Chatbot;
