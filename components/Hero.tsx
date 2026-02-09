
import React, { useState, useEffect } from 'react';

const images = [
  "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=1200&auto=format&fit=crop", // Carro Laranja em fundo escuro (Identidade Visual)
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop", // Carro Preto / Luzes Laranja (Velocidade/Noite)
  "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1200&auto=format&fit=crop"  // Oficina Industrial (Confiança/Técnica)
];

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-md group bg-gray-900 border border-gray-800">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0 relative">
             <img 
               src={img} 
               alt={`Slide ${idx}`} 
               className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[20s]"
             />
             {/* Gradient Overlay Criativo */}
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center px-8">
                <div className="border-l-4 border-primary pl-4 animate-in fade-in slide-in-from-left-4 duration-700">
                    <h1 className="text-white text-2xl md:text-4xl font-brand mb-2 shadow-black drop-shadow-lg tracking-wide">
                        OFICINAS <span className="text-primary">PREMIUM</span>
                    </h1>
                    <p className="text-gray-200 text-xs md:text-sm font-medium max-w-[200px] md:max-w-md leading-relaxed drop-shadow-md">
                        Conecte-se com os melhores especialistas automotivos da sua região.
                    </p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all shadow-sm ${
              currentSlide === idx ? 'bg-primary w-8' : 'bg-white/30 w-4 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
