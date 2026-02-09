import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sparkles, Image as ImageIcon, Download, Loader2, AlertCircle } from 'lucide-react';

type ImageSize = '1K' | '2K' | '4K';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [size, setSize] = useState<ImageSize>('1K');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setError('Chave de API do Gemini não configurada.');
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Observação: O SDK oficial do Gemini para JS atualmente não gera imagens diretamente 
      // via generateContent. Esta é uma implementação de fallback para evitar erros de compilação.
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("IA respondeu ao prompt de imagem:", text);
      setError('A geração de imagens via Gemini 1.5 direta não é suportada neste SDK. Use o Vertex AI ou Imagen API.');

    } catch (err: any) {
      console.error(err);
      setError('Erro ao conectar com a IA. Verifique sua conexão ou tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold">Estúdio IA</h2>
        </div>
        <p className="text-indigo-100 text-sm">Crie imagens automotivas personalizadas com Inteligência Artificial.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Descreva sua imagem</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Um carro esportivo vermelho correndo em uma estrada futurista ao pôr do sol..."
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none h-32 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Resolução</label>
          <div className="flex gap-2">
            {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${size === s
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando arte...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Imagem
            </>
          )}
        </button>
      </div>

      {generatedImage && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-500">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            Resultado
          </h3>
          <div className="rounded-xl overflow-hidden shadow-md bg-gray-100 mb-3 relative group">
            <img src={generatedImage} alt="Generated AI" className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
          </div>
          <a
            href={generatedImage}
            download={`iotu-ai-gen-${Date.now()}.png`}
            className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Imagem
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;