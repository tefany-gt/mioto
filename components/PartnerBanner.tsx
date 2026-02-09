import React from 'react';
import { ArrowRight, Wrench, ShieldCheck, Zap } from 'lucide-react';

interface PartnerBannerProps {
  onClick: () => void;
}

const PartnerBanner: React.FC<PartnerBannerProps> = ({ onClick }) => {
  return (
    <section className="w-full py-2">
      <button
        onClick={onClick}
        className="w-full text-left bg-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between group transition-all transform active:scale-[0.99] border border-white/10"
      >
        {/* Camadas de Fundo (Abstrato) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[50px] -ml-20 -mb-20"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full md:w-auto text-center md:text-left">
          {/* Ícone Impactante */}
          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform shadow-xl">
              <Wrench className="w-8 h-8 text-black" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-black">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="bg-primary text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tighter">Parceria Premium</span>
              <div className="flex items-center gap-1 text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Verificado</span>
              </div>
            </div>
            <h3 className="font-brand text-2xl md:text-3xl leading-tight mb-2 tracking-tight">
              Seja uma <span className="text-primary italic">Oficina Parceira</span>
            </h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[320px]">
              Aumente seu faturamento com a rede Mioto. Receba orçamentos e pedidos em tempo real.
            </p>
          </div>
        </div>

        <div className="mt-6 md:mt-0 z-10 w-full md:w-auto">
          <div className="bg-white hover:bg-orange-50 text-black font-extrabold px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl group/btn active:scale-95">
            <span className="text-sm">FAZER CADASTRO GRATUITO</span>
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>
    </section>
  );
};

export default PartnerBanner;