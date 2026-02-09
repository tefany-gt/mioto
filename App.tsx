import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserType, Workshop } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import ServiceGrid from './components/ServiceGrid';
import WorkshopList from './components/WorkshopList';
import PartnerBanner from './components/PartnerBanner';
import BottomNav from './components/BottomNav';
import AuthScreen from './components/AuthScreen';
import Orders from './components/Orders';
import Profile from './components/Profile';
import AIChat from './components/AIChat';
import WorkshopDetails from './components/WorkshopDetails';
import { AlertTriangle, Bot, X, Truck, Battery, Key, Fuel, Phone, Siren } from 'lucide-react';
import { db } from './services/db';

const AppContent: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showSplash, setShowSplash] = useState(true);
  const [selectedWorkshopDetail, setSelectedWorkshopDetail] = useState<Workshop | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosStep, setSosStep] = useState<'menu' | 'searching'>('menu');
  // Callbacks simplificados para teste
  const checkDbConnection = useCallback(async () => {
    setDbStatus('checking');
    try {
      const result = await db.checkConnection();
      setDbStatus(result.status);
      return result; // Fixes lint error: Header expects a return value
    } catch (e) {
      console.error(e);
      return { status: 'offline', message: 'Erro ao verificar' };
    }
  }, []);

  useEffect(() => {
    checkDbConnection();

    // Auto-dismiss Splash Screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);

    return () => clearTimeout(timer);
  }, [checkDbConnection]);

  const handleOpenAuth = useCallback(() => setShowAuthModal(true), []);
  const handleTabChange = useCallback((tabId: string) => setActiveTab(tabId), []);

  const handleOpenWorkshopDetails = useCallback((workshop: Workshop) => {
    setSelectedWorkshopDetail(workshop);
  }, []);

  const handleSOSAction = (action: string) => {
    if (!user) {
      setShowSOSModal(false);
      handleOpenAuth();
      return;
    }
    setSosStep('searching');
    setTimeout(() => {
      alert('Solicitação de ' + action + ' enviada!');
      setSosStep('menu');
      setShowSOSModal(false);
    }, 2000);
  };

  // Splash Screen com a nova identidade visual
  if (showSplash || isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/30 animate-bounce">
          <Truck className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-brand font-bold text-gray-900 mb-2 tracking-tight">MIOTO</h1>
        <p className="text-gray-500 font-medium animate-pulse">Carregando sistema...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (selectedWorkshopDetail) {
      return (
        <WorkshopDetails
          workshop={selectedWorkshopDetail}
          onBack={() => setSelectedWorkshopDetail(null)}
          onNavigate={handleTabChange}
        />
      );
    }

    switch (activeTab) {
      case 'ai-chat': return <AIChat onBack={() => setActiveTab('home')} />;
      case 'orders': return <Orders />;
      case 'profile': return <Profile />;
      case 'home':
      default:
        return (
          <div className="space-y-6">
            <Hero />
            <div className="w-full grid grid-cols-5 gap-3">
              <button onClick={() => setShowSOSModal(true)} className="col-span-3 bg-red-600 text-white rounded-xl p-4 flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                <Siren className="w-6 h-6" /> <span className="font-bold">SOS 24h</span>
              </button>
              <button onClick={() => setActiveTab('ai-chat')} className="col-span-2 bg-gray-900 text-white rounded-xl p-4 flex flex-col items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 mb-1 text-primary" /> <span className="text-xs">Mecânico IA</span>
              </button>
            </div>
            <ServiceGrid />
            <WorkshopList
              onRequireAuth={() => handleOpenAuth()}
              onNavigate={handleTabChange}
              onOpenDetails={handleOpenWorkshopDetails}
            />
            {/* COMPONENTE COM BUG CRITICO - DESATIVADO PARA RESTAURAR O APP
            <PartnerBanner onClick={() => handleOpenAuth()} />
            */}
          </div>
        );
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-24 relative">
      {/* HEADER */}
      {!selectedWorkshopDetail && (
        <Header
          user={user}
          onOpenAuth={handleOpenAuth}
          onNavigate={handleTabChange}
          dbStatus={dbStatus}
          onRecheck={checkDbConnection}
          onOpenDetails={handleOpenWorkshopDetails}
        />
      )}

      {/* AUTH MODAL */}
      {showAuthModal && !user && <AuthScreen onClose={() => setShowAuthModal(false)} initialView="login" initialType="motorista" />}

      {/* SOS MODAL SIMPLIFICADO */}
      {showSOSModal && (
        <div className="fixed inset-0 z-[90] bg-red-900/90 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">SOS - Debug</h2>
            <button onClick={() => setShowSOSModal(false)} className="bg-gray-200 p-2 rounded">Fechar</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto pt-20 px-4">
        {renderContent()}
      </main>

      {/* BOTTOM NAV */}
      {!selectedWorkshopDetail && (
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
