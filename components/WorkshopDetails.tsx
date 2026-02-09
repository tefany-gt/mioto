import React, { useState, useEffect } from 'react';
import { Workshop, ServiceOrder, PaymentMethod, OpeningHours } from '../types';
import { db, generateUUID } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft, MapPin, Phone, Star, ShieldCheck,
    Clock, Award, Wrench, MessageSquare, Image as ImageIcon,
    Share2, Heart, CheckCircle2, Car, CalendarCheck, Check, X, ChevronRight, Tag, ShoppingBag,
    Droplet, Disc, Battery, Zap, Wind, PaintBucket, Truck, Key, Circle, Gauge
} from 'lucide-react';
import ServiceRequestModal from './ServiceRequestModal';

interface WorkshopDetailsProps {
    workshop: Workshop;
    onBack: () => void;
    onNavigate: (tab: string) => void;
}

type TabType = 'sobre' | 'servicos' | 'galeria' | 'avaliacoes';

// Helper para escolher ícone baseado no nome
const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('óleo') || n.includes('lubrificante') || n.includes('filtro')) return Droplet;
    if (n.includes('freio') || n.includes('pastilha') || n.includes('disco')) return Disc;
    if (n.includes('bateria')) return Battery;
    if (n.includes('elétrica') || n.includes('lâmpada') || n.includes('som')) return Zap;
    if (n.includes('ar') || n.includes('condicionado') || n.includes('clima')) return Wind;
    if (n.includes('pintura') || n.includes('funilaria') || n.includes('polimento')) return PaintBucket;
    if (n.includes('guincho') || n.includes('reboque')) return Truck;
    if (n.includes('chave') || n.includes('codificação')) return Key;
    if (n.includes('pneu') || n.includes('roda') || n.includes('alinhamento') || n.includes('balanceamento')) return Circle;
    if (n.includes('motor') || n.includes('injeção') || n.includes('câmbio')) return Gauge;
    if (n.includes('lavagem') || n.includes('estética')) return Car;
    return Wrench; // Ícone padrão
};

const isShopOpenNow = (hours?: OpeningHours) => {
    if (!hours) return false;
    const now = new Date();
    const dayIndex = now.getDay();
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

const WorkshopDetails: React.FC<WorkshopDetailsProps> = ({ workshop, onBack, onNavigate }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>(() => window.innerWidth >= 768 ? 'servicos' : 'sobre');
    const [reviews, setReviews] = useState<ServiceOrder[]>([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requesting, setRequesting] = useState(false);

    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    const daysMap: { [key: string]: string } = {
        'seg': 'Segunda', 'ter': 'Terça', 'qua': 'Quarta', 'qui': 'Quinta', 'sex': 'Sexta', 'sab': 'Sábado', 'dom': 'Domingo'
    };
    const orderedDaysKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    const todayIndex = new Date().getDay();
    const indexToKeyMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const todayKey = indexToKeyMap[todayIndex];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && activeTab === 'sobre') setActiveTab('servicos');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]);

    useEffect(() => {
        const loadReviews = async () => {
            const orders = await db.getOrders();
            setReviews(orders.filter(o => o.workshopId === workshop.id && o.status === 'concluido'));
        };
        loadReviews();
    }, [workshop.id]);

    const handleFinalizeRequest = async (
        serviceName: string,
        price: number | undefined,
        description: string | undefined,
        paymentMethod: PaymentMethod,
        scheduleData?: { date: string, time: string }
    ) => {
        if (!user) { alert("Faça login para solicitar."); return; }
        setRequesting(true);

        const newOrder: ServiceOrder = {
            id: generateUUID(),
            driverId: user.id,
            driverName: user.name,
            driverPhone: user.phone,
            workshopId: workshop.id,
            workshopName: workshop.name,
            workshopPhone: workshop.phone,
            serviceName: serviceName,
            serviceDescription: description,
            price: price,
            paymentMethod: paymentMethod,
            date: new Date().toLocaleDateString('pt-BR'),
            status: paymentMethod === 'credit_card' ? 'pago' : 'criado',
            vehicle: `${user.vehicleBrand || ''} ${user.vehicleModel || ''}`.trim() || 'Veículo não informado',
            vehiclePlate: user.vehiclePlate,
            scheduleDate: scheduleData?.date,
            scheduleTime: scheduleData?.time,
            scheduleStatus: scheduleData ? 'pendente' : 'imediato'
        };

        await db.createOrder(newOrder);
        await new Promise(resolve => setTimeout(resolve, 500));
        setShowRequestModal(false);
        setRequesting(false);
        onNavigate('orders');
    };

    const isOpen = isShopOpenNow(workshop.openingHours);

    // Sidebar Component (Mobile & Desktop)
    const SidebarInfo = () => (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Contato</h4>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-primary flex-shrink-0"><MapPin className="w-5 h-5" /></div>
                    <div><p className="text-sm font-medium text-gray-900">{workshop.address}</p><p className="text-xs text-gray-500">{workshop.location}</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0"><Phone className="w-5 h-5" /></div>
                    <div><p className="text-sm font-medium text-gray-900">{workshop.phone}</p><p className="text-xs text-gray-500">Atendimento WhatsApp</p></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <h4 className="font-bold text-gray-900">Funcionamento</h4>
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isOpen ? 'Aberto Agora' : 'Fechado'}</div>
                </div>
                {workshop.openingHours ? (
                    <div className="space-y-1">
                        {orderedDaysKeys.map((dayKey) => {
                            const schedule = workshop.openingHours![dayKey as keyof OpeningHours];
                            const isToday = dayKey === todayKey;
                            return (
                                <div key={dayKey} className={`flex justify-between items-center text-xs p-2 rounded-lg ${isToday ? 'bg-orange-50' : ''}`}>
                                    <span className={`font-bold ${isToday ? 'text-primary' : 'text-gray-500'}`}>{daysMap[dayKey]}</span>
                                    <span className={`font-bold ${schedule.isClosed ? 'text-red-400' : 'text-gray-600'}`}>{schedule.isClosed ? 'Fechado' : `${schedule.start} - ${schedule.end}`}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : <p className="text-xs text-gray-400">Sem horários.</p>}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'servicos':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">

                        {/* 1. SEÇÃO DE ESPECIALIDADES (TAGS) */}
                        <div>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-gray-400" /> Especialidades
                            </h3>
                            {!workshop.services || workshop.services.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">Nenhuma especialidade listada.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {workshop.services.map((service) => {
                                        const Icon = getServiceIcon(service.name);
                                        return (
                                            <div key={service.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-primary flex-shrink-0"><Icon className="w-4 h-4" /></div>
                                                <span className="font-bold text-gray-700 text-sm leading-tight">{service.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200"></div>

                        {/* 2. SEÇÃO DE VITRINE (DETALHADO) */}
                        <div>
                            <h3 className="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" /> Vitrine & Ofertas
                            </h3>

                            {!workshop.detailedServices || workshop.detailedServices.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                                    <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Nenhum serviço em destaque no momento.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {workshop.detailedServices.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all cursor-pointer" onClick={() => setShowRequestModal(true)}>
                                            <div className="h-40 bg-gray-100 relative overflow-hidden">
                                                {item.image ? (
                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>
                                                )}
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                                    {item.price ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Sob Consulta'}
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h4 className="font-bold text-gray-900 text-base mb-1">{item.name}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{item.description}</p>
                                                <button className="w-full py-2 bg-gray-50 text-primary text-xs font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                                    Solicitar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-gray-100 text-center">
                            <button onClick={() => setShowRequestModal(true)} className="w-full md:w-auto px-8 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-transform mx-auto">
                                <Wrench className="w-5 h-5" /> Fazer Orçamento Personalizado
                            </button>
                        </div>
                    </div>
                );

            case 'galeria':
                const allImages = [...(workshop.gallery || []), ...reviews.flatMap(r => [r.completionPhotoWorkshop, r.completionPhotoDriver].filter(Boolean) as string[])];
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        {allImages.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhuma foto disponível.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {allImages.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative group cursor-pointer hover:shadow-lg transition-all">
                                        <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'avaliacoes':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-orange-50 p-6 rounded-3xl flex items-center justify-between border border-orange-100">
                            <div>
                                <p className="text-sm font-bold text-gray-700">Nota Geral</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-extrabold text-gray-900">{workshop.rating?.toFixed(1)}</span>
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(workshop.rating || 0) ? 'fill-current' : 'text-gray-300'}`} />)}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{workshop.ratingCount || reviews.length} avaliações</p>
                            </div>
                            <Award className="w-16 h-16 text-orange-200" />
                        </div>
                        {reviews.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm py-8 bg-white rounded-3xl border border-gray-100 border-dashed">Nenhuma avaliação ainda.</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm font-bold text-gray-900">{review.driverName}</p>
                                            {review.rating && <div className="flex text-yellow-400 text-xs">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating! ? 'fill-current' : 'text-gray-300'}`} />)}</div>}
                                        </div>
                                        {review.review && <p className="text-sm text-gray-600 italic">"{review.review}"</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'sobre':
            default:
                return (
                    <div className="md:hidden">
                        <SidebarInfo />
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mt-6">
                            <h4 className="font-bold text-gray-900 mb-2">Sobre</h4>
                            <p className="text-sm text-gray-600 leading-relaxed text-justify">{workshop.description || "Oficina parceira MIOTO."}</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 md:bg-black/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center overflow-y-auto md:overflow-hidden md:p-6 transition-all duration-300">
            <div className="w-full min-h-full md:min-h-0 md:h-[90vh] md:max-w-6xl bg-gray-50 md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-300">

                {/* Sidebar */}
                <div className="w-full md:w-[320px] lg:w-[400px] md:border-r md:border-gray-200 md:bg-white md:flex md:flex-col md:overflow-y-auto relative no-scrollbar">
                    <div className="relative h-64 md:h-72 flex-shrink-0">
                        <img src={workshop.coverImage || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200"} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors z-20">
                            <div className="hidden md:block"><X className="w-6 h-6" /></div>
                            <div className="md:hidden"><ArrowLeft className="w-6 h-6" /></div>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
                            <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-xl flex-shrink-0 mb-1 relative"><img src={workshop.image || `https://ui-avatars.com/api/?name=${workshop.name}`} className="w-full h-full object-cover rounded-xl" /></div>
                            <div className="text-white"><h2 className="text-2xl font-bold leading-tight shadow-black drop-shadow-md">{workshop.name}</h2></div>
                        </div>
                    </div>

                    <div className="hidden md:block p-6 space-y-6 bg-white flex-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{workshop.description || "Oficina parceira."}</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><MapPin className="w-5 h-5 text-primary" /><div className="text-sm"><p className="font-bold text-gray-900">Endereço</p><p className="text-gray-500">{workshop.address}</p></div></div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Phone className="w-5 h-5 text-green-600" /><div className="text-sm"><p className="font-bold text-gray-900">Telefone</p><p className="text-gray-500">{workshop.phone}</p></div></div>
                        </div>
                        <div className="pt-4 mt-auto"><button onClick={() => setShowRequestModal(true)} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">Solicitar Serviço</button></div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-gray-50 md:bg-white h-full overflow-hidden">
                    <div className="bg-white border-b border-gray-100 shadow-sm z-30 sticky top-0">
                        <div className="flex px-4 md:px-8 overflow-x-auto no-scrollbar gap-6">
                            {(['sobre', 'servicos', 'galeria', 'avaliacoes'] as TabType[]).map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 text-sm font-bold border-b-2 transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'} ${tab === 'sobre' ? 'md:hidden' : ''}`}>{tab}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">{renderContent()}</div>
                    <div className="md:hidden bg-white p-4 border-t border-gray-100 safe-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50">
                        <div className="flex gap-3">
                            <button className="p-3.5 border border-gray-200 rounded-xl text-green-600 hover:bg-green-50"><Phone className="w-5 h-5" /></button>
                            <button onClick={() => setShowRequestModal(true)} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">Solicitar Serviço</button>
                        </div>
                    </div>
                </div>
            </div>

            {showRequestModal && (
                <ServiceRequestModal
                    workshop={workshop}
                    onClose={() => setShowRequestModal(false)}
                    onSelectService={handleFinalizeRequest}
                    isLoading={requesting}
                />
            )}
        </div>
    );
};

export default WorkshopDetails;