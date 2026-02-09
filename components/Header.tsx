import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, X, Wrench, Search, LogOut, LogIn, ShoppingBag, Zap, Database, Globe, WifiOff, Heart, ChevronRight, Star } from 'lucide-react';
import { User as UserType, Notification, Workshop } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  user: UserType | null;
  onOpenAuth: (view?: 'login' | 'register') => void;
  onNavigate: (tabId: string, filter?: string) => void;
  dbStatus: 'checking' | 'online' | 'offline';
  onRecheck?: () => Promise<{ status: 'online' | 'offline', message?: string }>;
  onOpenDetails?: (workshop: Workshop) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onNavigate, dbStatus, onRecheck, onOpenDetails }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favoriteWorkshops, setFavoriteWorkshops] = useState<Workshop[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const favRef = useRef<HTMLDivElement>(null);

  const { logout, toggleFavorite } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (favRef.current && !favRef.current.contains(event.target as Node)) {
        setIsFavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setFavoriteWorkshops([]);
      return;
    }

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'criado': return 'Aguardando Pagamento';
        case 'pago': return 'Pagamento Confirmado';
        case 'a_caminho': return 'A Caminho';
        case 'chegou': return 'No Local';
        case 'concluido': return 'Concluído';
        case 'cancelado': return 'Cancelado';
        default: return status;
      }
    };

    const loadData = async () => {
      const generated: Notification[] = [];
      generated.push({
        id: 'sec-1',
        type: 'security',
        title: 'Segurança',
        message: 'Conta conectada com sucesso.',
        timestamp: 'Agora',
        read: true
      });

      try {
        const allOrders = await db.getOrders();
        const myOrders = user.type === 'motorista'
          ? allOrders.filter(o => o.driverId === user.id)
          : allOrders.filter(o => o.workshopId === user.id);

        myOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        myOrders.forEach(order => {
          if (order.status !== 'cancelado') {
            const isFinished = order.status === 'concluido';
            generated.push({
              id: `ord-${order.id}-${order.status}`,
              type: 'order',
              title: isFinished ? 'Serviço Finalizado' : 'Status do Pedido',
              message: `${order.serviceName}: ${getStatusLabel(order.status)}`,
              timestamp: order.date,
              read: isFinished,
              actionLink: 'orders'
            });
          }
        });
      } catch (e) { }

      setNotifications(generated);

      if (user.favorites && user.favorites.length > 0) {
        try {
          const allWorkshops = await db.getWorkshops();
          const favs = allWorkshops.filter(w => user.favorites?.includes(w.id));
          setFavoriteWorkshops(favs);
        } catch (e) {
          console.error("Erro ao carregar favoritos", e);
        }
      } else {
        setFavoriteWorkshops([]);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 3000);
    return () => clearInterval(intervalId);
  }, [user, user?.favorites]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNotif = () => { setIsNotifOpen(!isNotifOpen); setIsFavOpen(false); };
  const toggleFav = () => { setIsFavOpen(!isFavOpen); setIsNotifOpen(false); };

  const handleNavClick = (tabId: string, filter?: string) => {
    onNavigate(tabId, filter);
    setIsMenuOpen(false);
    setIsNotifOpen(false);
    setIsFavOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleTestConnection = async () => {
    if (onRecheck) {
      const result = await onRecheck();
      if (result.status === 'online') {
        alert("✅ CONEXÃO ESTÁVEL!\n\nVocê está conectado ao Supabase com sucesso. Os dados exibidos são reais do servidor.");
      } else {
        alert(`❌ ERRO DE CONEXÃO: ${result.message}\n\nVerifique se as tabelas foram criadas no SQL Editor e se as chaves no .env estão corretas.`);
      }
    }
  };

  const handleFavoriteClick = (shop: Workshop) => {
    if (onOpenDetails) {
      onOpenDetails(shop);
      setIsFavOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-primary z-50 shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">

          {/* LADO ESQUERDO: Menu Mobile + Logo */}
          <div className="flex items-center gap-0">
            <div className="md:hidden">
              <button onClick={toggleMenu} className="p-2 -ml-2 mr-1 rounded-full text-white hover:bg-white/20 transition-colors group">
                <svg viewBox="0 0 30 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-9 w-auto">
                  <rect x="0" y="12" width="6" height="12" rx="2" className="transition-all duration-300 group-hover:translate-y-1" />
                  <rect x="10" y="0" width="6" height="24" rx="2" className="transition-all duration-300 group-hover:translate-y-2" />
                  <rect x="20" y="8" width="6" height="16" rx="2" className="transition-all duration-300 group-hover:translate-y-1.5" />
                </svg>
              </button>
            </div>

            <button
              className="cursor-pointer hover:opacity-90 transition-opacity flex items-center"
              onClick={() => handleNavClick('home')}
            >
              <BrandLogo className="" textClass="text-4xl md:text-5xl" variant="header" />
            </button>
          </div>

          {/* LADO DIREITO: Navegação e Ações */}
          <div className="flex items-center gap-4">

            {/* Status Indicator (Desktop Only) */}
            <div className="hidden md:flex items-center gap-2 mr-2 bg-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/20 transition-all" onClick={handleTestConnection} title="Status da Conexão">
              <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'online' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'}`}></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {dbStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 mr-4">
              <button onClick={() => handleNavClick('home')} className="text-sm font-bold text-white hover:text-orange-100 transition-colors">Início</button>

              {!user ? (
                <>
                  <button onClick={() => handleNavClick('workshops', 'Mecânica')} className="text-sm font-medium text-white/90 hover:text-white transition-colors">Oficinas</button>
                  <button onClick={() => handleNavClick('workshops', 'Auto Peças')} className="text-sm font-medium text-white/90 hover:text-white transition-colors">Auto Peças</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleNavClick('orders')} className="text-sm font-medium text-white/90 hover:text-white transition-colors">Meus Pedidos</button>
                  <button onClick={() => handleNavClick('workshops')} className="text-sm font-medium text-white/90 hover:text-white transition-colors">Parceiros</button>
                </>
              )}
            </nav>

            {user ? (
              <>
                <div className="relative" ref={favRef}>
                  <button onClick={toggleFav} className="p-2 rounded-full text-white hover:bg-white/20 transition-colors relative">
                    <Heart className={`w-6 h-6 ${isFavOpen || (user.favorites && user.favorites.length > 0) ? 'fill-white' : ''}`} />
                  </button>

                  {isFavOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 text-gray-800">
                      <div className="p-4 border-b bg-gray-50/50">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary fill-primary" /> Favoritos
                        </h4>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {favoriteWorkshops.length === 0 ? (
                          <div className="py-8 text-center">
                            <Heart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">Você ainda não tem favoritos.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {favoriteWorkshops.map(shop => (
                              <button
                                key={shop.id}
                                onClick={() => handleFavoriteClick(shop)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 text-left group"
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                  <img src={shop.image || `https://ui-avatars.com/api/?name=${shop.name}`} alt={shop.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{shop.name}</h5>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    {shop.rating?.toFixed(1)}
                                  </div>
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(shop.id);
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover"
                                >
                                  <X className="w-4 h-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={notifRef}>
                  <button onClick={toggleNotif} className="p-2 rounded-full text-white hover:bg-white/20 transition-colors relative">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white animate-in zoom-in">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 text-gray-800">
                      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                        <h4 className="font-bold text-gray-800">Notificações</h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          {dbStatus === 'online' ? <Globe className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-orange-500" />}
                          {dbStatus === 'online' ? 'Cloud Sync' : 'Local Only'}
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-4">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center">
                            <Bell className="w-8 h-8 text-gray-100 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">Nenhuma notificação por enquanto.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {notifications.map(n => (
                              <button
                                key={n.id}
                                onClick={() => {
                                  if (n.actionLink) handleNavClick(n.actionLink);
                                }}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${!n.read ? 'bg-orange-50 border-orange-100 hover:bg-orange-100' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <p className={`text-xs font-bold ${!n.read ? 'text-primary' : 'text-gray-800'}`}>{n.title}</p>
                                  {!n.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                </div>
                                <p className="text-[11px] text-gray-600 mt-0.5">{n.message}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pl-2 border-l border-white/20 ml-2">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[10px] text-orange-100 uppercase tracking-wider">{user.type}</p>
                  </div>
                  <button onClick={() => handleNavClick('profile')} className="w-9 h-9 rounded-full bg-white/20 overflow-hidden border border-white/30 hover:ring-2 hover:ring-white transition-all">
                    <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-xl text-white text-sm md:text-base font-bold bg-white/10 hover:bg-white/20 shadow-md transition-all active:scale-95"
                >
                  Entrar
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 md:px-5 md:py-2.5 bg-white hover:bg-orange-50 text-primary text-xs md:text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap active:scale-95"
                >
                  <span className="md:hidden">Cadastrar</span>
                  <span className="hidden md:inline">Se Cadastrar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleMenu}></div>
          <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b flex items-center justify-between">
              <span className="font-bold text-xl text-primary">Navegar</span>
              <button onClick={toggleMenu} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="mb-6 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-2">Sincronização</p>
                <button onClick={handleTestConnection} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                  <Database className={`w-5 h-5 ${dbStatus === 'online' ? 'text-green-500' : 'text-orange-500'}`} />
                  <div className="text-xs font-bold text-gray-700">
                    Status: <span className={dbStatus === 'online' ? 'text-green-600' : 'text-orange-600'}>
                      {dbStatus === 'online' ? 'Cloud Connected' : 'Local Fallback'}
                    </span>
                    <p className="text-[9px] text-gray-400 font-normal mt-0.5">Toque para testar conexão</p>
                  </div>
                </button>
              </div>

              {!user && (
                <div className="mb-6 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-2">Categorias</p>
                  <button onClick={() => handleNavClick('workshops', 'Mecânica')} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-primary rounded-xl font-bold text-sm text-left">
                    <Wrench className="w-5 h-5" /> Oficinas Mecânicas
                  </button>
                  <button onClick={() => handleNavClick('workshops', 'Elétrica')} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-primary rounded-xl font-bold text-sm text-left">
                    <Zap className="w-5 h-5" /> Oficinas Elétricas
                  </button>
                  <button onClick={() => handleNavClick('workshops', 'Auto Peças')} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-primary rounded-xl font-bold text-sm text-left">
                    <ShoppingBag className="w-5 h-5" /> Auto Peças
                  </button>
                </div>
              )}

              <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-2">Institucional</p>
              <button onClick={() => handleNavClick('home')} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 rounded-xl font-medium text-sm text-left">
                <Search className="w-5 h-5" /> Início / Busca
              </button>

              <div className="pt-4 mt-4 border-t border-gray-100">
                {user ? (
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm text-left">
                    <LogOut className="w-5 h-5" /> Sair
                  </button>
                ) : (
                  <button onClick={() => { onOpenAuth('login'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 bg-primary text-white hover:bg-primary-dark rounded-xl font-bold text-sm text-left shadow-lg shadow-orange-200">
                    <LogIn className="w-5 h-5" /> Entrar ou Cadastrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;