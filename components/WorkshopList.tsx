import React, { useState, useEffect } from 'react';
import { Star, ChevronRight, MapPin, Heart, Settings, Database, RotateCw, CheckCircle2, FilterX, ImageOff, Clock, Droplet, Disc, Battery, Wrench, Settings2, Zap, UserPlus } from 'lucide-react';
import { Workshop, ServiceOrder, PaymentMethod, OpeningHours } from '../types';
import { db, generateUUID } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import ServiceRequestModal from './ServiceRequestModal';

interface WorkshopListProps {
  onRequireAuth?: () => void;
  viewMode?: 'horizontal' | 'grid';
  onViewAll?: () => void;
  onNavigate?: (tab: string) => void;
  filter?: string;
  onOpenDetails?: (workshop: Workshop) => void;
}

// Helper para verificar horário em tempo real
const isShopOpenNow = (hours?: OpeningHours) => {
  if (!hours) return false;
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Domingo, 1 = Segunda...
  const keys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayKey = keys[dayIndex] as keyof OpeningHours;

  const schedule = hours[todayKey];
  if (!schedule || schedule.isClosed) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = schedule.start.split(':').map(Number);
  const [endH, endM] = schedule.end.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Helper para pegar o ícone baseado no nome do serviço
const getServiceIcon = (name: string) => {
  switch (name) {
    case 'Óleo': return Droplet;
    case 'Freios': return Disc;
    case 'Bateria': return Battery;
    case 'Mecânica': return Wrench;
    case 'Revisão': return Settings2;
    case 'Elétrica': return Zap;
    default: return Wrench;
  }
};

const WorkshopList: React.FC<WorkshopListProps> = ({ onRequireAuth, viewMode = 'horizontal', onViewAll, onNavigate, filter, onOpenDetails }) => {
  const { user, toggleFavorite } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  // Force re-render every minute to update Open/Closed status
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const [isSeeding, setIsSeeding] = useState(false);

  const fetchWorkshops = async () => {
    setLoadingList(true);
    try {
      const data = await db.getWorkshops();

      // Aplicar filtro se houver
      if (filter) {
        const filteredData = data.filter(w =>
          w.tags?.some(tag => tag.toLowerCase().includes(filter.toLowerCase())) ||
          w.name.toLowerCase().includes(filter.toLowerCase())
        );
        setWorkshops(filteredData);
      } else {
        setWorkshops(data);
      }
    } catch (e) {
      console.error("Erro ao carregar oficinas", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, [filter]);

  const handleSeed = async () => {
    setIsSeeding(true);
    const success = await db.seedDatabase();
    setIsSeeding(false);
    if (success) {
      fetchWorkshops();
    }
  };

  const initiateRequest = (e: React.MouseEvent, workshop: Workshop) => {
    e.stopPropagation(); // Impede que o clique no botão abra os detalhes
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (user.type === 'oficina') {
      alert("Oficinas não podem solicitar serviços.");
      return;
    }
    setSelectedWorkshop(workshop);
  };

  const handleCardClick = (workshop: Workshop) => {
    if (onOpenDetails) {
      onOpenDetails(workshop);
    }
  };

  const handleToggleFav = (e: React.MouseEvent, workshopId: string) => {
    e.stopPropagation();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    toggleFavorite(workshopId);
  };

  const handleFinalizeRequest = async (
    serviceName: string,
    price: number | undefined,
    description: string | undefined,
    paymentMethod: PaymentMethod,
    scheduleData?: { date: string, time: string }
  ) => {
    if (!selectedWorkshop || !user) return;
    setRequesting(selectedWorkshop.id);

    // Geração de ID robusta
    const orderId = generateUUID();

    const newOrder: ServiceOrder = {
      id: orderId,
      driverId: user.id,
      driverName: user.name,
      driverPhone: user.phone,
      workshopId: selectedWorkshop.id,
      workshopName: selectedWorkshop.name,
      workshopPhone: selectedWorkshop.phone,
      serviceName: serviceName,
      serviceDescription: description,
      price: price,
      paymentMethod: paymentMethod,
      date: new Date().toLocaleDateString('pt-BR'),
      status: paymentMethod === 'credit_card' ? 'pago' : 'criado',
      vehicle: `${user.vehicleBrand || ''} ${user.vehicleModel || ''}`.trim() || 'Veículo não informado',
      vehiclePlate: user.vehiclePlate,
      // Scheduling data
      scheduleDate: scheduleData?.date,
      scheduleTime: scheduleData?.time,
      scheduleStatus: scheduleData ? 'pendente' : 'imediato'
    };

    await db.createOrder(newOrder);
    setRequesting(null);
    setSelectedWorkshop(null);
    if (onNavigate) onNavigate('orders');
  };

  // Logic: On desktop (md+), ALWAYS use Grid layout because horizontal scrolling looks empty on wide screens.
  // On mobile, respect the 'viewMode' prop.
  const containerClass = viewMode === 'horizontal'
    ? "flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 snap-x min-h-[200px] md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:mx-0 md:px-0 md:overflow-visible"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

  const cardClass = viewMode === 'horizontal' ? "snap-center min-w-[280px] w-[280px] md:w-full md:min-w-0" : "w-full";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded-lg">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {filter ? `Resultados: ${filter}` : 'Oficinas recomendadas'}
          </h2>
        </div>
        {filter && (
          <button onClick={() => fetchWorkshops()} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs">
            <FilterX className="w-3 h-3" /> Limpar filtro
          </button>
        )}
        {onViewAll && !filter && (
          <button onClick={onViewAll} className="text-primary text-sm font-semibold flex items-center hover:underline">
            Ver todas <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        )}
      </div>

      {/* Grid Content */}
      <div className={containerClass}>
        {loadingList ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[280px] h-[340px] bg-gray-100 rounded-2xl animate-pulse md:w-full"></div>
          ))
        ) : workshops.length === 0 ? (
          <div className="w-full py-12 flex flex-col items-center text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 md:col-span-3">
            <Database className="w-10 h-10 text-gray-300 mb-2" />
            <h3 className="font-bold text-gray-700">Nenhuma oficina encontrada</h3>
            <p className="text-xs text-gray-400 mb-4 px-4">
              {filter ? `Não encontramos oficinas para a categoria "${filter}".` : "O banco de dados está vazio. Cadastre uma oficina para aparecer aqui."}
            </p>
            {!filter && (
              <button onClick={onRequireAuth} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md">
                <UserPlus className="w-4 h-4" /> Cadastrar Oficina
              </button>
            )}
            {/* Fallback button hidden if connected to real empty DB */}
            <button onClick={handleSeed} className="mt-4 text-[10px] text-gray-400 hover:text-primary underline">Carregar dados de teste local (Offline)</button>
          </div>
        ) : (
          workshops.map((shop) => {
            const isFavorite = user?.favorites?.includes(shop.id);
            // Verifica se está aberto AGORA baseado nos horários
            const isOpen = isShopOpenNow(shop.openingHours);

            return (
              <div
                key={shop.id}
                onClick={() => handleCardClick(shop)}
                className={`${cardClass} bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col`}
              >
                <button
                  onClick={(e) => handleToggleFav(e, shop.id)}
                  className={`absolute top-3 right-3 z-10 p-1.5 rounded-full shadow-sm transition-colors ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute top-36 right-3 bg-gray-900/80 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10 backdrop-blur-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {shop.rating}
                </div>

                {/* Badge de Status Aberto/Fechado (Real-time) */}
                <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/20 ${isOpen ? 'bg-green-500 text-white' : 'bg-gray-900/90 text-gray-300'}`}>
                  {isOpen ? (
                    <Clock className="w-3 h-3 animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  )}
                  {isOpen ? 'Aberto' : 'Fechado'}
                </div>

                <div className="h-40 overflow-hidden bg-gray-200 relative flex-shrink-0">
                  <img
                    src={shop.coverImage || 'https://via.placeholder.com/300x200'}
                    alt={shop.name}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-110 duration-700 ${!isOpen ? 'grayscale-[0.5]' : ''}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://ui-avatars.com/api/?name=Oficina&background=e5e7eb&color=6b7280&size=300';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>

                <div className="p-4 pt-2 flex flex-col gap-2 relative flex-1">
                  {/* Foto de Perfil Sobreposta */}
                  <div className="-mt-10 mb-2 w-16 h-16 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden z-20 relative group-hover:scale-105 transition-transform">
                    <img
                      src={shop.image || `https://ui-avatars.com/api/?name=${shop.name}&background=random`}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${shop.name}&background=random`;
                      }}
                    />
                  </div>

                  <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">{shop.name}</h3>
                  <div className="flex items-center text-gray-500 text-xs"><MapPin className="w-3 h-3 mr-1" /><span>{shop.location}</span></div>

                  {/* Exibição dos Serviços Oferecidos em Ícones */}
                  {shop.services && shop.services.length > 0 ? (
                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                      {shop.services.slice(0, 5).map(service => {
                        const Icon = getServiceIcon(service.name);
                        return (
                          <div key={service.id} className="flex flex-col items-center justify-center bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 min-w-[50px] flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary mb-1" />
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight">{service.name}</span>
                          </div>
                        );
                      })}
                      {shop.services.length > 5 && (
                        <div className="flex items-center justify-center bg-gray-50 px-2 rounded-lg border border-gray-100 min-w-[30px] flex-shrink-0">
                          <span className="text-[10px] font-bold text-gray-400">+{shop.services.length - 5}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {shop.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium border border-orange-100">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-3">
                    <button
                      onClick={(e) => initiateRequest(e, shop)}
                      className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm relative z-20 hover:shadow-md active:scale-95"
                    >
                      Solicitar serviço
                    </button>
                  </div>
                </div>
              </div>
            );
          }))}
      </div>

      {selectedWorkshop && (
        <ServiceRequestModal
          workshop={selectedWorkshop}
          onClose={() => setSelectedWorkshop(null)}
          onSelectService={handleFinalizeRequest}
          isLoading={!!requesting}
        />
      )}
    </section>
  );
};

export default WorkshopList;