
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { Send, Bot, User, Loader2, Wrench, AlertTriangle, ChevronLeft, Trash2 } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface AIChatProps {
    onBack: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ onBack }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: 'Olá! Sou o Mecânico Virtual da MIOTO. 🤖🔧\n\nDescreva o que está acontecendo com seu carro (barulhos, luzes no painel, cheiros) e eu tentarei te ajudar a identificar o problema.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Ref to store the chat session instance
    const chatSession = useRef<ChatSession | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Chat Session
    useEffect(() => {
        const initChat = async () => {
            try {
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!apiKey) {
                    console.error("Gemini API Key is missing");
                    return;
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: `Você é um mecânico automotivo sênior e assistente virtual da plataforma MIOTO. 
                    
                    Seus objetivos:
                    1. Ajudar motoristas leigos a diagnosticar problemas baseados em sintomas (barulhos, fumaça, luzes, comportamento).
                    2. Explicar a gravidade do problema (Baixa, Média, Alta/Perigo).
                    3. Sugerir qual tipo de serviço oficina eles devem procurar (ex: Elétrica, Suspensão, Motor).
                    4. NUNCA dê orçamentos de preços exatos, pois varia muito.
                    5. SEMPRE finalize recomendando agendar com uma oficina parceira da MIOTO para um diagnóstico preciso.
                    
                    Seja cordial, técnico mas acessível, e use emojis relacionados a carros ocasionalmente.`,
                });

                chatSession.current = model.startChat({
                    history: [
                        {
                            role: 'user',
                            parts: [{ text: 'Olá' }]
                        },
                        {
                            role: 'model',
                            parts: [{ text: 'Olá! Sou o Mecânico Virtual da MIOTO. Como posso ajudar com seu veículo hoje?' }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                    }
                });
            } catch (error) {
                console.error("Failed to init chat", error);
            }
        };
        initChat();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input;
        setInput('');
        setIsLoading(true);

        // Add User Message
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, newUserMsg]);

        try {
            if (!chatSession.current) throw new Error("Chat not initialized");

            // Send to Gemini
            const result = await chatSession.current.sendMessage(userText);
            const response = await result.response;
            const responseText = response.text();

            // Add Model Message
            const newModelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
            setMessages(prev => [...prev, newModelMsg]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: '⚠️ Ocorreu um erro de conexão com a oficina virtual. Verifique sua internet ou tente mais tarde.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([messages[0]]);
        // Re-init chat handled by effect technically, but simple clear is visual here
        // Ideally we would reset the chatSession history too, but for UI simplicity:
        window.location.reload(); // Quick reset for demo
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-gray-50 md:rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-between text-white shadow-md z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full md:hidden">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50 relative">
                        <Bot className="w-6 h-6 text-primary" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></span>
                    </div>
                    <div>
                        <h3 className="font-bold leading-tight">Mecânico IA</h3>
                        <p className="text-[10px] text-gray-300 flex items-center gap-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                            Online • Gemini 3.0 Flash
                        </p>
                    </div>
                </div>
                <button onClick={clearChat} className="p-2 text-gray-400 hover:text-white transition-colors" title="Limpar conversa">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]/10">
                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                        max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm relative
                        ${isUser
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                    `}>
                                {/* Format line breaks */}
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {msg.text}
                                </p>
                                <span className={`text-[10px] opacity-70 block text-right mt-1 ${isUser ? 'text-orange-100' : 'text-gray-400'}`}>
                                    {new Date(parseInt(msg.id) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-xs text-gray-500 font-medium">Analisando motor...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-primary/50 focus-within:bg-white transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ex: Meu carro faz um estalo quando viro o volante..."
                        className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-32 p-2"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white rounded-xl transition-all shadow-sm active:scale-95 flex-shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    IA pode cometer erros. Sempre consulte um mecânico real.
                </p>
            </div>
        </div>
    );
};

export default AIChat;
