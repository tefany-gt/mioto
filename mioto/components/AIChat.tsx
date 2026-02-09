
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { Send, Bot, User, Loader2, Wrench, AlertTriangle, ChevronLeft, Trash2, X } from 'lucide-react';

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
            text: 'OlÃ¡! Sou o MecÃ¢nico Virtual da MIOTO. (v2.1-debug) ðŸ¤–ðŸ”§\n\nDescreva o que estÃ¡ acontecendo com seu carro (barulhos, luzes no painel, cheiros) e eu tentarei te ajudar a identificar o problema.'
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
                    console.error("Gemini API Key is missing. Create a .env file with VITE_GEMINI_API_KEY=YOUR_KEY");
                    setMessages(prev => [...prev, {
                        id: 'error-key',
                        role: 'model',
                        text: 'âŒ ConfiguraÃ§Ã£o pendente: A chave de API do Gemini nÃ£o foi encontrada no arquivo .env. Por favor, adicione VITE_GEMINI_API_KEY para ativar o mecÃ¢nico.'
                    }]);
                    return;
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: `VocÃª Ã© um mecÃ¢nico automotivo sÃªnior e assistente virtual da plataforma MIOTO. 
                    
                    Seus objetivos:
                    1. Ajudar motoristas leigos a diagnosticar problemas baseados em sintomas (barulhos, fumaÃ§a, luzes, comportamento).
                    2. Explicar a gravidade do problema (Baixa, MÃ©dia, Alta/Perigo).
                    3. Sugerir qual tipo de serviÃ§o oficina eles devem procurar (ex: ElÃ©trica, SuspensÃ£o, Motor).
                    4. NUNCA dÃª orÃ§amentos de preÃ§os exatos, pois varia muito.
                    5. SEMPRE finalize recomendando agendar com uma oficina parceira da MIOTO para um diagnÃ³stico preciso.
                    
                    Seja cordial, tÃ©cnico mas acessÃ­vel, e use emojis relacionados a carros ocasionalmente.`,
                });

                chatSession.current = model.startChat({
                    history: [
                        {
                            role: 'user',
                            parts: [{ text: 'OlÃ¡' }]
                        },
                        {
                            role: 'model',
                            parts: [{ text: 'OlÃ¡! Sou o MecÃ¢nico Virtual da MIOTO. Como posso ajudar com seu veÃ­culo hoje?' }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                    }
                });
                console.log("âœ… MecÃ¢nico IA inicializado com sucesso.");
            } catch (error) {
                console.error("Failed to init chat", error);
                setMessages(prev => [...prev, {
                    id: 'error-init',
                    role: 'model',
                    text: 'âš ï¸ Erro ao carregar inteligÃªncia artificial. Verifique sua chave de API ou conexÃ£o.'
                }]);
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
            if (!chatSession.current) {
                // Tenta reinicializar se falhou antes
                throw new Error("MecÃ¢nico IA nÃ£o inicializado. Verifique as configuraÃ§Ãµes.");
            }

            // Send to Gemini
            const result = await chatSession.current.sendMessage(userText);
            const response = await result.response;
            const responseText = response.text();

            // Add Model Message
            const newModelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
            setMessages(prev => [...prev, newModelMsg]);

        } catch (error: any) {
            console.error("Erro completo do chat:", error);

            // Extrai o erro tÃ©cnico para ajudar no diagnÃ³stico
            const technicalError = error.message || JSON.stringify(error);
            const isApiKeyError = technicalError.includes("API key") || technicalError.includes("403") || technicalError.includes("401") || technicalError.includes("key");

            const errorMsg = isApiKeyError
                ? `âš ï¸ Falha na Chave de API: O Google recusou a conexÃ£o.\n\nDetalhe tÃ©cnico: ${technicalError}`
                : `âš ï¸ Falha de ConexÃ£o: O MecÃ¢nico IA nÃ£o pÃ´de responder.\n\nErro tÃ©cnico: ${technicalError}`;

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: errorMsg
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
        // Refresh to reset session history in SDK easily for this demo
        window.location.reload();
    };

    return (
        <div className="flex flex-col w-[90vw] md:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gray-900 border-b border-white/5 p-4 flex items-center justify-between text-white shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50 relative">
                        <Bot className="w-6 h-6 text-primary" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight text-white">MecÃ¢nico IA</h3>
                        <p className="text-[10px] text-primary flex items-center gap-1 font-bold uppercase tracking-tighter">
                            Online â€¢ Especialista
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={clearChat} className="p-2 text-gray-400 hover:text-white transition-colors" title="Limpar conversa">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={onBack} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                                ${isUser
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                            `}>
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
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-primary/50 focus-within:bg-white transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Como posso ajudar seu carro?"
                        className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-32 p-2"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-primary hover:bg-black disabled:bg-gray-300 text-white rounded-xl transition-all shadow-sm active:scale-95 flex-shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
