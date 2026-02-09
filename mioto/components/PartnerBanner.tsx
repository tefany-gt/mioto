import React from 'react';
import { ArrowRight, Wrench } from 'lucide-react';

interface PartnerBannerProps {
  onClick: () => void;
}

const PartnerBanner: React.FC<PartnerBannerProps> = ({ onClick }) => {
  return (
    <section className="w-full">
      <button 
        onClick={onClick}
        className="w-full text-left bg-gradient-to-r from-primary to-orange-400 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between group transition-all transform active:scale-[0.98]"
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-5"></div>

        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0 border border-white/30">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight mb-1">Seja uma Oficina Parceira</h3>
            <p className="text-white/90 text-xs md:text-sm font-medium leading-tight max-w-[200px]">
              Expanda seus negócios e receba novos clientes
            </p>
          </div>
        </div>

        <div className="w-10 h-10 bg-white/20 group-hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 border border-white/40">
           <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </section>
  );
};

export default PartnerBanner;