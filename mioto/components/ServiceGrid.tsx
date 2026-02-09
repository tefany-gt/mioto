
import React, { useRef } from 'react';
import { Droplet, Disc, Battery, Settings2, Wrench, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

// Categorias
const categories = [
  { id: '1', name: 'Óleo', icon: Droplet },
  { id: '2', name: 'Freios', icon: Disc },
  { id: '3', name: 'Bateria', icon: Battery },
  { id: '4', name: 'Mecânica', icon: Wrench },
  { id: '5', name: 'Revisão', icon: Settings2 },
  { id: '6', name: 'Elétrica', icon: Zap },
];

const ServiceGrid: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative group/carousel py-4">
      {/* Botão Navegação Esquerda (Desktop) */}
      <button 
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-xl rounded-full items-center justify-center text-gray-800 hover:text-primary transition-all opacity-0 group-hover/carousel:opacity-100 border border-gray-200 scale-90 hover:scale-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Container Scrollável */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 pb-4 px-1 md:gap-4 no-scrollbar snap-x scroll-smooth"
      >
        {categories.map((cat) => (
          <button 
            key={cat.id}
            className={`
              relative flex-shrink-0 snap-start
              w-24 h-24 md:w-28 md:h-28 
              rounded-2xl
              bg-white
              flex flex-col items-center justify-center
              shadow-sm border border-gray-200
              hover:shadow-lg hover:border-primary
              hover:-translate-y-1
              transition-all duration-200 group
            `}
          >
            {/* Ícone Container - Sólido (Sem Blur) */}
            <div className={`
                p-3 rounded-xl mb-2 transition-all duration-200
                bg-gray-100 text-gray-900 
                group-hover:bg-white group-hover:text-primary
            `}>
                <cat.icon className="w-6 h-6 md:w-7 md:h-7 stroke-[2px]" />
            </div>
            
            {/* Texto - Fonte da Marca (Russo One) */}
            <span className={`
                text-[10px] md:text-xs tracking-wider z-10 font-brand uppercase transition-colors duration-200
                text-gray-900 group-hover:text-primary
            `}>
                {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Botão Navegação Direita (Desktop) */}
      <button 
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-xl rounded-full items-center justify-center text-gray-800 hover:text-primary transition-all opacity-0 group-hover/carousel:opacity-100 border border-gray-200 scale-90 hover:scale-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
};

export default ServiceGrid;
