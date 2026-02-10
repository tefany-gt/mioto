
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, MapPin, Car, Mail, ShieldCheck, Phone, FileText, Camera, Fingerprint, Star, Briefcase, Edit2, Save, X, Trash2, PlusCircle, Download, Monitor, Clock, CalendarDays, Power, Check, ChevronRight, Heart, Droplet, Disc, Battery, Zap, Wrench } from 'lucide-react';
import { db, generateUUID } from '../services/db';
import WorkshopServices from './WorkshopServices';
import { downloadLogoSvg } from './BrandLogo';
import { OpeningHours, DaySchedule, Workshop, ServiceOrder, PaymentMethod } from '../types';
import ServiceRequestModal from './ServiceRequestModal';
import { useNavigate } from 'react-router-dom';

const normalizePhone = (value: string) => {
    if (!value) return "";
    return value.replace(/[\D]/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})(\d+?)/, '$1');
};

const normalizeCep = (value: string) => {
    if (!value) return "";
    return value.replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
};

// Default hours structure
const defaultHours: OpeningHours = {
    seg: { start: '08:00', end: '18:00', isClosed: false },
    ter: { start: '08:00', end: '18:00', isClosed: false },
    qua: { start: '08:00', end: '18:00', isClosed: false },
    qui: { start: '08:00', end: '18:00', isClosed: false },
    sex: { start: '08:00', end: '18:00', isClosed: false },
    sab: { start: '08:00', end: '12:00', isClosed: false },
    dom: { start: '00:00', end: '00:00', isClosed: true },
};

// Helper for Real-Time Open Check (Same as WorkshopList/Details)
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

// Ordem correta para exibição
const orderedDaysKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const Profile: React.FC = () => {
    const { user, logout, updateProfile, toggleFavorite } = useAuth();

    const [favoriteWorkshops, setFavoriteWorkshops] = useState<any[]>([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requesting, setRequesting] = useState(false);

    // Modal States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingVehicle, setIsEditingVehicle] = useState(false);
    const [isEditingHours, setIsEditingHours] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Helper for Service Icons (Same as WorkshopList)
    const getServiceIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('óleo') || n.includes('lubrificante') || n.includes('filtro')) return Droplet;
        if (n.includes('freio') || n.includes('pastilha') || n.includes('disco')) return Disc;
        if (n.includes('bateria')) return Battery;
        if (n.includes('elétrica') || n.includes('lâmpada') || n.includes('som')) return Zap;
        if (n.includes('mecanica') || n.includes('mecânica')) return Wrench;
        return Wrench;
    };

    // Force re-render for clock
    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadFavorites = async () => {
            if (user?.favorites && user.favorites.length > 0) {
                try {
                    const allWorkshops = await db.getWorkshops();
                    const favs = allWorkshops.filter(w => user.favorites?.includes(w.id));
                    setFavoriteWorkshops(favs);
                } catch (e) {
                    console.error("Erro ao carregar favoritos no perfil", e);
                }
            } else {
                setFavoriteWorkshops([]);
            }
        };

        loadFavorites();
    }, [user?.favorites]);

    // Profile Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
        address: '',
        number: '',
        location: '',
        cep: ''
    });

    // Hours Form State
    const [hoursData, setHoursData] = useState<OpeningHours>(defaultHours);

    // Vehicle Form State
    const [vehicleData, setVehicleData] = useState({
        brand: '',
        model: '',
        year: '',
        plate: ''
    });

    const handleOpenEditProfile = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                description: user.description || '',
                address: user.address || '',
                number: user.number || '',
                location: user.location || '',
                cep: user.cep || ''
            });
        }
        setIsEditingProfile(true);
    };

    const handleOpenEditVehicle = () => {
        if (user) {
            setVehicleData({
                brand: user.vehicleBrand || '',
                model: user.vehicleModel || '',
                year: user.vehicleYear || '',
                plate: user.vehiclePlate || ''
            });
        }
        setIsEditingVehicle(true);
    };

    const handleOpenEditHours = () => {
        if (user) {
            setHoursData(user.openingHours || defaultHours);
        }
        setIsEditingHours(true);
    };

    if (!user) return null;

    // Real-time status based on config
    const isOpenRealTime = isShopOpenNow(user.openingHours);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'coverImage') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB Limit for Profile Pics
                alert("A imagem deve ter no máximo 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                updateProfile({ ...user, [field]: result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile({
                ...user,
                name: formData.name,
                phone: formData.phone,
                description: formData.description,
                address: formData.address,
                number: formData.number,
                location: formData.location,
                cep: formData.cep
            });
            setIsEditingProfile(false);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveHours = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile({
                ...user,
                openingHours: hoursData
            });
            setIsEditingHours(false);
        } catch (error) {
            console.error("Erro ao salvar horários:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalizeRequest = async (
        serviceName: string,
        price: number | undefined,
        description: string | undefined,
        paymentMethod: PaymentMethod,
        scheduleData?: { date: string, time: string }
    ) => {
        if (!user || user.type !== 'oficina') return;
        setRequesting(true);

        const newOrder: ServiceOrder = {
            id: generateUUID(),
            driverId: user.id, // Current user is the owner, but we use the same structure
            driverName: user.name,
            driverPhone: user.phone,
            workshopId: user.id,
            workshopName: user.name,
            workshopPhone: user.phone,
            serviceName: serviceName,
            serviceDescription: description,
            price: price,
            paymentMethod: paymentMethod,
            date: new Date().toLocaleDateString('pt-BR'),
            status: paymentMethod === 'credit_card' ? 'pago' : 'criado',
            vehicle: 'Uso Administrativo',
            vehiclePlate: '—',
            scheduleDate: scheduleData?.date,
            scheduleTime: scheduleData?.time,
            scheduleStatus: scheduleData ? 'pendente' : 'imediato'
        };

        if (db.createOrder) {
            await db.createOrder(newOrder);
        }
        setRequesting(false);
        setShowRequestModal(false);
        alert("Solicitação registrada com sucesso!");
    };

    const handleSaveVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile({
                ...user,
                vehicleBrand: vehicleData.brand,
                vehicleModel: vehicleData.model,
                vehicleYear: vehicleData.year,
                vehiclePlate: vehicleData.plate
            });
            setIsEditingVehicle(false);
        } catch (error) {
            console.error("Erro ao salvar veículo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveVehicle = async () => {
        if (confirm("Tem certeza que deseja remover este veículo?")) {
            setIsLoading(true);
            try {
                await updateProfile({
                    ...user,
                    vehicleBrand: '',
                    vehicleModel: '',
                    vehicleYear: '',
                    vehiclePlate: ''
                });
                setVehicleData({ brand: '', model: '', year: '', plate: '' });
            } catch (error) {
                console.error("Erro ao remover", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const defaultCover = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${user.name}&background=FF8B00&color=fff&size=128`;
    const hasVehicle = user.vehicleModel || user.vehicleBrand;
    const daysMap: { [key: string]: string } = {
        'seg': 'Segunda-feira', 'ter': 'Terça-feira', 'qua': 'Quarta-feira', 'qui': 'Quinta-feira', 'sex': 'Sexta-feira', 'sab': 'Sábado', 'dom': 'Domingo'
    };

    return (
        <div className="max-w-4xl mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* --- HEADER CARD (Identity) --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group">
                <div className="relative h-32 md:h-48 w-full bg-gray-200">
                    <img src={user.coverImage || defaultCover} alt="Capa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    {user.type === 'oficina' && (
                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/20 z-20 ${isOpenRealTime ? 'bg-green-500 text-white' : 'bg-gray-900/90 text-gray-300'}`}>
                            {isOpenRealTime ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                            {isOpenRealTime ? 'Aberto Agora' : 'Fechado'}
                        </div>
                    )}

                    <label className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full cursor-pointer backdrop-blur-md transition-colors border border-white/20 z-20">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                    </label>
                </div>

                <div className="px-6 pb-6 relative flex flex-col items-center md:items-start md:flex-row md:gap-6 -mt-12 md:-mt-16">
                    <div className="relative group/avatar">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 shadow-xl overflow-hidden relative z-10">
                            <img src={user.image || defaultAvatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <label className="absolute bottom-1 right-1 z-20 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg border-2 border-white hover:scale-105 transition-transform">
                            <Camera className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} />
                        </label>
                    </div>

                    <div className="flex-1 text-center md:text-left pt-3 md:pt-16 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{user.name}</h3>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.type === 'oficina' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.type === 'oficina' ? <Briefcase className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                        {user.type}
                                    </span>
                                    {user.type === 'oficina' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                            <Star className="w-3 h-3 fill-yellow-600" />
                                            {user.rating?.toFixed(1) || '5.0'}
                                        </span>
                                    )}
                                </div>
                                {user.description && <p className="text-gray-300 text-xs md:text-sm mt-2 max-w-lg font-medium drop-shadow-sm line-clamp-2 md:line-clamp-none">"{user.description}"</p>}

                                {user.type === 'oficina' && user.services && user.services.length > 0 && (
                                    <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                                        {user.services.map((service: any) => {
                                            const Icon = getServiceIcon(service.name);
                                            return (
                                                <div key={service.id} className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 min-w-[70px] flex-shrink-0 group-hover:bg-white/20 transition-all">
                                                    <Icon className="w-5 h-5 text-primary mb-1" />
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">{service.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 mt-4 md:mt-16">
                                {user.type === 'oficina' && (
                                    <button
                                        onClick={() => setShowRequestModal(true)}
                                        className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                    >
                                        <Wrench className="w-4 h-4" /> Solicitar Serviço
                                    </button>
                                )}
                                <button
                                    onClick={handleOpenEditProfile}
                                    className="px-4 py-2 border border-white/20 bg-white/5 backdrop-blur-md rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" /> Editar Perfil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- OFICINA MANAGEMENT CARD --- */}
            {user.type === 'oficina' && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-50 mb-4">
                        <CalendarDays className="w-5 h-5 text-primary" /> Gerenciar Oficina
                    </h4>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Real-time Status Display */}
                        <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isOpenRealTime ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold uppercase tracking-wide ${isOpenRealTime ? 'text-green-700' : 'text-red-700'}`}>
                                        Agora
                                    </span>
                                    {isOpenRealTime ? <Clock className="w-5 h-5 text-green-600 animate-pulse" /> : <Power className="w-5 h-5 text-red-500" />}
                                </div>
                                <div>
                                    <h3 className={`text-3xl font-extrabold ${isOpenRealTime ? 'text-green-800' : 'text-red-800'}`}>
                                        {isOpenRealTime ? 'ABERTO' : 'FECHADO'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-2 max-w-[80%]">
                                        Status automático baseado no horário atual.
                                    </p>
                                </div>
                            </div>
                            {/* Decorative Icon */}
                            <div className="absolute -bottom-4 -right-4 opacity-10 transform rotate-12">
                                <Clock className={`w-32 h-32 ${isOpenRealTime ? 'text-green-900' : 'text-red-900'}`} />
                            </div>
                        </div>

                        {/* Hours Config Button */}
                        <button
                            onClick={handleOpenEditHours}
                            className="p-5 rounded-2xl border border-gray-200 hover:border-primary hover:bg-orange-50 transition-all text-left group flex flex-col justify-between bg-white shadow-sm hover:shadow-md"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="bg-orange-100 p-2 rounded-lg text-primary">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary mb-1">Configurar Horários</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">Defina os dias e horas de funcionamento para automatizar seu status.</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* --- DETAILS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card 1: Contato e Pessoal */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-50">
                        <ShieldCheck className="w-5 h-5 text-primary" /> Dados Pessoais
                    </h4>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Mail className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">E-mail</p>
                                <p className="text-sm font-medium text-gray-800 break-all">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><Phone className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">WhatsApp</p>
                                <p className="text-sm font-medium text-gray-800">{user.phone || '—'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                {user.type === 'oficina' ? <FileText className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">{user.type === 'oficina' ? 'CNPJ' : 'CPF'}</p>
                                <p className="text-sm font-medium text-gray-800 font-mono">
                                    {user.type === 'oficina' ? (user.cnpj || '—') : (user.cpf || '—')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Endereço */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-50">
                        <MapPin className="w-5 h-5 text-primary" /> Localização
                    </h4>

                    <div className="flex flex-col gap-4 h-full">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Endereço</p>
                                <p className="text-sm font-medium text-gray-800">{user.address || 'Não informado'}, {user.number}</p>
                                <p className="text-xs text-gray-500 mt-1">{user.location}</p>
                            </div>
                        </div>
                        {user.cep && (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 inline-block w-fit">
                                <p className="text-xs text-gray-400 font-bold uppercase">CEP</p>
                                <p className="text-sm font-mono text-gray-700 tracking-wider">{user.cep}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 3: Dados Específicos (Motorista: Veículo) */}
                {user.type === 'motorista' && (
                    <div className="md:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 flex-shrink-0">
                                <Car className="w-8 h-8 text-primary" />
                            </div>

                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Meu Veículo</h4>
                                        <p className="text-gray-300 text-sm">Informações utilizadas para orçamentos.</p>
                                    </div>
                                    {hasVehicle ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleOpenEditVehicle} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors">
                                                <Edit2 className="w-4 h-4 text-white" />
                                            </button>
                                            <button onClick={handleRemoveVehicle} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white rounded-lg backdrop-blur-md transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={handleOpenEditVehicle} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                                            <PlusCircle className="w-4 h-4" /> Adicionar
                                        </button>
                                    )}
                                </div>

                                {hasVehicle ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Marca</p>
                                            <p className="font-semibold">{user.vehicleBrand || '—'}</p>
                                        </div>
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Modelo</p>
                                            <p className="font-semibold">{user.vehicleModel || '—'}</p>
                                        </div>
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Ano</p>
                                            <p className="font-semibold">{user.vehicleYear || '—'}</p>
                                        </div>
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Placa</p>
                                            <p className="font-mono">{user.vehiclePlate || '—'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-white/10 border-dashed bg-white/5 text-center text-gray-400 text-sm">
                                        Nenhum veículo cadastrado. Adicione para facilitar seus orçamentos.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Card 4: Favoritos (Apenas Motorista) */}
                {user.type === 'motorista' && (
                    <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-50">
                            <Heart className="w-5 h-5 text-primary fill-primary" /> Meus Favoritos
                        </h4>

                        {favoriteWorkshops.length === 0 ? (
                            <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Você ainda não salvou nenhuma oficina favorita.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {favoriteWorkshops.map(shop => (
                                    <div key={shop.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary/30 transition-all">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                            <img src={shop.image || `https://ui-avatars.com/api/?name=${shop.name}`} alt={shop.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-gray-900 truncate">{shop.name}</h5>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-bold text-gray-600">{shop.rating?.toFixed(1) || '5.0'}</span>
                                                <span className="text-[10px] text-gray-400">•</span>
                                                <span className="text-[10px] text-gray-500 truncate">{shop.location}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(shop.id)}
                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Remover dos favoritos"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- WORKSHOP SERVICES (Full Width) --- */}
            {user.type === 'oficina' && (
                <div className="animate-in slide-in-from-bottom-6 duration-700">
                    <WorkshopServices />
                </div>
            )}

            {/* --- BRAND ASSETS / SETTINGS --- */}
            <div className="pt-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                            <Monitor className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Aplicativo</p>
                            <p className="text-xs text-gray-500">Recursos e Identidade Visual</p>
                        </div>
                    </div>
                    <button
                        onClick={downloadLogoSvg}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Baixar Logo SVG
                    </button>
                </div>

                <button
                    onClick={logout}
                    className="w-full md:w-auto md:px-8 mx-auto md:mx-0 flex items-center justify-center gap-2 py-3.5 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                >
                    <LogOut className="w-5 h-5" />
                    Encerrar Sessão
                </button>
                <p className="text-center md:text-left text-xs text-gray-400 mt-4 md:pl-2">
                    MIOTO App • Versão 1.2.0 • Build 2024
                </p>
            </div>

            {/* --- MODAL EDITAR PERFIL --- */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">Editar Perfil</h3>
                            <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Telefone / WhatsApp</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: normalizePhone(e.target.value) })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" required maxLength={15} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Bio / Descrição</label>
                                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">CEP</label>
                                    <input type="text" value={formData.cep} onChange={e => setFormData({ ...formData, cep: normalizeCep(e.target.value) })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" maxLength={9} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
                                    <input type="text" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Endereço (Rua, Bairro)</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Localização (Cidade, UF)</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex justify-center items-center gap-2 mt-4 shadow-lg shadow-orange-200">
                                {isLoading ? "Salvando..." : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL EDITAR HORÁRIOS (Visual Renovado) --- */}
            {isEditingHours && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" /> Horário de Funcionamento
                            </h3>
                            <button onClick={() => setIsEditingHours(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveHours} className="p-6 overflow-y-auto space-y-3">
                            <div className="flex justify-end mb-2">
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">24h Formato</span>
                            </div>

                            {orderedDaysKeys.map((dayKey) => {
                                const isClosed = hoursData[dayKey as keyof OpeningHours].isClosed;
                                return (
                                    <div key={dayKey} className={`flex flex-col sm:flex-row sm:items-center gap-3 py-3 border rounded-xl px-4 transition-all ${isClosed ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                                        <div className="w-32 flex items-center justify-between sm:justify-start gap-2">
                                            <span className={`font-bold text-sm uppercase ${isClosed ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                                                {daysMap[dayKey]}
                                            </span>
                                        </div>

                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        className={`w-full p-2 border rounded-lg text-sm text-center outline-none focus:border-primary font-bold ${isClosed ? 'bg-red-50 text-gray-400 border-red-100' : 'bg-gray-50 text-gray-900 border-gray-200'}`}
                                                        value={hoursData[dayKey as keyof OpeningHours].start}
                                                        onChange={(e) => setHoursData({ ...hoursData, [dayKey]: { ...hoursData[dayKey as keyof OpeningHours], start: e.target.value } })}
                                                        disabled={isClosed}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        className={`w-full p-2 border rounded-lg text-sm text-center outline-none focus:border-primary font-bold ${isClosed ? 'bg-red-50 text-gray-400 border-red-100' : 'bg-gray-50 text-gray-900 border-gray-200'}`}
                                                        value={hoursData[dayKey as keyof OpeningHours].end}
                                                        onChange={(e) => setHoursData({ ...hoursData, [dayKey]: { ...hoursData[dayKey as keyof OpeningHours], end: e.target.value } })}
                                                        disabled={isClosed}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end sm:w-24">
                                            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors border ${isClosed ? 'bg-red-100 border-red-200' : 'bg-green-50 border-green-200 hover:bg-green-100'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={isClosed}
                                                    onChange={(e) => setHoursData({ ...hoursData, [dayKey]: { ...hoursData[dayKey as keyof OpeningHours], isClosed: e.target.checked } })}
                                                />
                                                {isClosed ? (
                                                    <span className="text-xs font-bold text-red-600 flex items-center gap-1"><X className="w-3 h-3" /> FECHADO</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> ABERTO</span>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}

                            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex justify-center items-center gap-2 mt-4 shadow-lg shadow-orange-200">
                                {isLoading ? "Salvando..." : <><Save className="w-5 h-5" /> Salvar Horários</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL EDITAR VEÍCULO --- */}
            {isEditingVehicle && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Car className="w-5 h-5 text-primary" /> Dados do Veículo</h3>
                            <button onClick={() => setIsEditingVehicle(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveVehicle} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Marca (Ex: Fiat, Honda)</label>
                                <input type="text" value={vehicleData.brand} onChange={e => setVehicleData({ ...vehicleData, brand: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Modelo (Ex: Uno, Civic)</label>
                                <input type="text" value={vehicleData.model} onChange={e => setVehicleData({ ...vehicleData, model: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Ano</label>
                                    <input type="text" value={vehicleData.year} onChange={e => setVehicleData({ ...vehicleData, year: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Placa</label>
                                    <input type="text" value={vehicleData.plate} onChange={e => setVehicleData({ ...vehicleData, plate: e.target.value.toUpperCase() })} className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-gray-50 focus:bg-white uppercase" />
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex justify-center items-center gap-2 mt-4 shadow-lg">
                                {isLoading ? "Salvando..." : <><Save className="w-5 h-5" /> Atualizar Veículo</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showRequestModal && user.type === 'oficina' && (
                <ServiceRequestModal
                    workshop={user as any}
                    onClose={() => setShowRequestModal(false)}
                    onSelectService={handleFinalizeRequest}
                    isLoading={requesting}
                />
            )}
        </div>
    );
};

export default Profile;
