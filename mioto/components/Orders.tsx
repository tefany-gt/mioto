
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { ServiceOrder, OrderStatus } from '../types';
import { Clock, Car, Calendar, User as UserIcon, MessageCircle, Loader2, Check, MapPin, Flag, CreditCard, Banknote, Edit2, X, Camera, Star, Send, History, Archive, AlertTriangle } from 'lucide-react';

// Status Order Config
const STATUS_STEPS: { id: OrderStatus; label: string; icon: any }[] = [
  { id: 'criado', label: 'Gerado', icon: Clock },
  { id: 'pago', label: 'Pago', icon: CreditCard },
  { id: 'a_caminho', label: 'A Caminho', icon: MapPin },
  { id: 'chegou', label: 'Cheguei', icon: Car },
  { id: 'concluido', label: 'Finalizado', icon: Flag },
];

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'active' | 'history'>('active');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Ref para rastrear se o componente está montado
  const isMounted = useRef(true);

  // Scheduling Negotiation State
  const [negotiatingOrderId, setNegotiatingOrderId] = useState<string | null>(null);
  const [newProposedDate, setNewProposedDate] = useState('');
  const [newProposedTime, setNewProposedTime] = useState('');

  // Workshop Finish State
  const [finishingOrderId, setFinishingOrderId] = useState<string | null>(null);
  const [finishPhoto, setFinishPhoto] = useState<string>('');

  // Driver Review State
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState<string>('');

  const loadOrders = async () => {
    if (!user) return;
    try {
      const all = await db.getOrders();

      // Só atualiza o estado se o componente ainda estiver montado
      if (isMounted.current) {
        if (user.type === 'motorista') {
          setOrders(all.filter(o => o.driverId === user.id));
        } else if (user.type === 'oficina') {
          setOrders(all.filter(o => o.workshopId === user.id));
        }
        setLoading(false);
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos", e);
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    loadOrders();
    const interval = setInterval(loadOrders, 5000); // Poll every 5s for real DB updates

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [user]);

  // Handle file uploads (Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Imagem muito grande. Máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // If workshop tries to finish, intercept and show modal
    if (newStatus === 'concluido' && user?.type === 'oficina') {
      setFinishingOrderId(orderId);
      setFinishPhoto('');
      return;
    }

    // Optimistic update for other statuses
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setEditingOrderId(null);
    await db.updateOrderStatus(orderId, newStatus);
    loadOrders();
  };

  // --- Scheduling Logic ---

  const handleAcceptSchedule = async (order: ServiceOrder) => {
    await db.updateOrderStatus(order.id, order.status, { scheduleStatus: 'confirmado' });
    loadOrders();
  };

  const handleProposeSchedule = async () => {
    if (!negotiatingOrderId || !newProposedDate || !newProposedTime) return;

    await db.updateOrderStatus(negotiatingOrderId, 'criado', {
      scheduleStatus: 'negociacao',
      workshopProposedDate: newProposedDate,
      workshopProposedTime: newProposedTime
    });
    setNegotiatingOrderId(null);
    setNewProposedDate('');
    setNewProposedTime('');
    loadOrders();
  };

  const handleDriverAcceptProposal = async (order: ServiceOrder) => {
    await db.updateOrderStatus(order.id, order.status, {
      scheduleDate: order.workshopProposedDate,
      scheduleTime: order.workshopProposedTime,
      scheduleStatus: 'confirmado',
      workshopProposedDate: undefined,
      workshopProposedTime: undefined
    });
    loadOrders();
  };

  // --- End Scheduling Logic ---

  const submitFinishOrder = async () => {
    if (!finishingOrderId || !finishPhoto) return;

    // Save with photo
    await db.updateOrderStatus(finishingOrderId, 'concluido', { completionPhotoWorkshop: finishPhoto });

    // Cleanup
    setFinishingOrderId(null);
    setFinishPhoto('');
    loadOrders();
  };

  const submitReview = async () => {
    if (!reviewingOrderId || reviewRating === 0) return;

    await db.addOrderReview(reviewingOrderId, reviewRating, reviewText, reviewPhoto);

    // Cleanup
    setReviewingOrderId(null);
    setReviewRating(0);
    setReviewText('');
    setReviewPhoto('');
    loadOrders();
  };

  const getStatusIndex = (status: OrderStatus) => {
    return STATUS_STEPS.findIndex(s => s.id === status);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const number = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${number}`, '_blank');
  };

  // Helper to render Workshop Actions based on current status
  const renderWorkshopActions = (order: ServiceOrder) => {
    const isEditing = editingOrderId === order.id;

    // Scheduling Logic (Workshop Side)
    if (order.scheduleStatus === 'pendente') {
      if (negotiatingOrderId === order.id) {
        return (
          <div className="mt-4 bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in">
            <h4 className="font-bold text-gray-800 text-sm mb-2">Propor Novo Horário</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" className="p-2 rounded-lg text-sm border" value={newProposedDate} onChange={e => setNewProposedDate(e.target.value)} />
              <input type="time" className="p-2 rounded-lg text-sm border" value={newProposedTime} onChange={e => setNewProposedTime(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNegotiatingOrderId(null)} className="flex-1 py-2 text-sm text-gray-500 font-bold bg-white rounded-lg">Cancelar</button>
              <button onClick={handleProposeSchedule} className="flex-1 py-2 text-sm text-white font-bold bg-primary rounded-lg">Enviar Proposta</button>
            </div>
          </div>
        )
      }
      return (
        <div className="mt-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
          <div className="flex items-center gap-2 mb-3 text-yellow-800 font-bold text-sm">
            <Calendar className="w-4 h-4" /> Solicitação de Agendamento
          </div>
          <div className="flex items-center justify-between bg-white p-2 rounded-lg mb-3">
            <span className="text-gray-600 text-xs font-bold">Data Solicitada:</span>
            <span className="text-gray-900 text-sm font-bold">{order.scheduleDate?.split('-').reverse().join('/')} às {order.scheduleTime}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setNegotiatingOrderId(order.id)} className="flex-1 py-2 bg-white text-gray-600 font-bold text-xs rounded-lg border border-gray-200">Sugerir Outro</button>
            <button onClick={() => handleAcceptSchedule(order)} className="flex-1 py-2 bg-green-600 text-white font-bold text-xs rounded-lg shadow-sm">Aceitar Horário</button>
          </div>
        </div>
      );
    }

    if (order.scheduleStatus === 'negociacao') {
      return (
        <div className="mt-4 bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
          <p className="text-xs text-blue-800 font-bold">Aguardando motorista aceitar novo horário.</p>
          <p className="text-xs text-blue-600 mt-1">{order.workshopProposedDate?.split('-').reverse().join('/')} às {order.workshopProposedTime}</p>
        </div>
      );
    }

    // Manual Edit Mode
    if (isEditing) {
      return (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-bold text-gray-700">Alterar status para:</span>
            <button onClick={() => setEditingOrderId(null)} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_STEPS.filter(s => s.id !== 'criado').map((step) => (
              <button
                key={step.id}
                onClick={() => handleStatusChange(order.id, step.id)}
                className={`
                    py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all
                    ${order.status === step.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}
                  `}
              >
                <step.icon className="w-3 h-3" />
                {step.label}
              </button>
            ))}
            <button
              onClick={() => handleStatusChange(order.id, 'cancelado')}
              className="col-span-2 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancelar Pedido
            </button>
          </div>
        </div>
      );
    }

    // Default Sequential Actions
    if (order.status === 'cancelado' || order.status === 'concluido') return null;

    let nextStep: OrderStatus | null = null;
    let buttonLabel = '';

    switch (order.status) {
      case 'criado':
        nextStep = 'pago';
        buttonLabel = 'Confirmar Pagamento';
        break;
      case 'pago':
        nextStep = 'a_caminho';
        buttonLabel = 'Iniciar Deslocamento';
        break;
      case 'a_caminho':
        nextStep = 'chegou';
        buttonLabel = 'Cheguei no Local';
        break;
      case 'chegou':
        nextStep = 'concluido';
        buttonLabel = 'Finalizar Serviço';
        break;
      default:
        return null;
    }

    return (
      <div className="mt-4">
        <div className="flex gap-3">
          {order.status === 'criado' && (
            <button
              onClick={() => handleStatusChange(order.id, 'cancelado')}
              className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50"
            >
              Recusar
            </button>
          )}
          <button
            onClick={() => handleStatusChange(order.id, nextStep!)}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark shadow-md shadow-orange-200 flex items-center justify-center gap-2"
          >
            {nextStep === 'concluido' ? <Camera className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {buttonLabel}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => setEditingOrderId(order.id)}
            className="p-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-primary hover:border-primary transition-colors"
            title="Editar Status Manualmente"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const activeOrders = orders.filter(o => o.status !== 'concluido' && o.status !== 'cancelado');
  const historyOrders = orders.filter(o => o.status === 'concluido' || o.status === 'cancelado');
  const displayedOrders = viewType === 'active' ? activeOrders : historyOrders;

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-900">
        {user?.type === 'motorista' ? 'Meus Pedidos' : 'Gerenciar Serviços'}
      </h2>

      {/* Tabs */}
      <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
        <button
          onClick={() => setViewType('active')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${viewType === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Clock className="w-4 h-4" />
          Em Andamento
          {activeOrders.length > 0 && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeOrders.length}</span>
          )}
        </button>
        <button
          onClick={() => setViewType('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${viewType === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Archive className="w-4 h-4" />
          Histórico
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          {viewType === 'active' ? (
            <Clock className="w-16 h-16 mb-4 opacity-50" />
          ) : (
            <History className="w-16 h-16 mb-4 opacity-50" />
          )}
          <h3 className="text-lg font-medium">
            {viewType === 'active' ? 'Nenhum serviço em andamento' : 'Nenhum histórico encontrado'}
          </h3>
          <p className="text-sm">
            {viewType === 'active' ? 'Seus novos serviços aparecerão aqui.' : 'Seus serviços finalizados aparecerão aqui.'}
          </p>
        </div>
      ) : (
        displayedOrders.map((order) => {
          const contactPhone = user?.type === 'motorista' ? order.workshopPhone : order.driverPhone;
          const currentStepIndex = getStatusIndex(order.status);
          const isCancelled = order.status === 'cancelado';
          const isFinished = order.status === 'concluido';
          const hasReview = !!order.rating;
          const isScheduleConfirmed = order.scheduleStatus === 'confirmado';

          // Workshop Finish Logic
          if (finishingOrderId === order.id) {
            return (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-primary animate-in zoom-in">
                <h3 className="font-bold text-lg mb-2">Finalizar Serviço</h3>
                <p className="text-sm text-gray-500 mb-4">Para concluir, adicione uma foto do serviço realizado.</p>

                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary transition-all mb-4 relative overflow-hidden">
                  {finishPhoto ? (
                    <img src={finishPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-xs font-medium">Toque para adicionar foto</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setFinishPhoto)} />
                </label>

                <div className="flex gap-3">
                  <button onClick={() => setFinishingOrderId(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                  <button
                    onClick={submitFinishOrder}
                    disabled={!finishPhoto}
                    className="flex-1 py-3 bg-primary disabled:bg-gray-300 text-white font-bold rounded-xl shadow-md"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            );
          }

          // Driver Review Logic
          if (reviewingOrderId === order.id) {
            return (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-primary animate-in zoom-in">
                <h3 className="font-bold text-lg mb-1">Avaliar Oficina</h3>
                <p className="text-sm text-gray-500 mb-4">Como foi o serviço de {order.workshopName}?</p>

                {/* Stars */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                      <Star
                        className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary mb-4 resize-none"
                  rows={3}
                  placeholder="Escreva um comentário (opcional)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {reviewPhoto ? (
                      <img src={reviewPhoto} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600 font-medium flex-1">Adicionar foto do resultado</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setReviewPhoto)} />
                </label>

                <div className="flex gap-3">
                  <button onClick={() => setReviewingOrderId(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Depois</button>
                  <button
                    onClick={submitReview}
                    disabled={reviewRating === 0}
                    className="flex-1 py-3 bg-primary disabled:bg-gray-300 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Enviar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">

              {/* Header Info */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  {isCancelled ? (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Cancelado</span>
                  ) : isFinished ? (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                      <Check className="w-3 h-3" /> Concluído
                    </span>
                  ) : isScheduleConfirmed ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                      <Calendar className="w-3 h-3" /> Agendado
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                      Em Andamento
                    </span>
                  )}
                  <h3 className="font-bold text-lg mt-2 text-gray-800 leading-tight">
                    {user?.type === 'motorista' ? order.workshopName : order.serviceName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500 flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {order.date}
                  </div>
                  {order.price && (
                    <div className="text-gray-900 font-bold mt-1 text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.price)}
                    </div>
                  )}
                  {/* Payment Method Badge */}
                  <div className="flex justify-end mt-1">
                    {order.paymentMethod === 'credit_card' ? (
                      <span className="text-[10px] flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        <CreditCard className="w-3 h-3" /> Cartão App
                      </span>
                    ) : (
                      <span className="text-[10px] flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                        <Banknote className="w-3 h-3" /> Pagar na Hora
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scheduled Information Display */}
              {order.scheduleDate && (
                <div className="mb-4 bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-gray-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Horário do Serviço</p>
                    {order.scheduleStatus === 'confirmado' ? (
                      <p className="font-bold text-gray-900">{order.scheduleDate.split('-').reverse().join('/')} às {order.scheduleTime}</p>
                    ) : order.scheduleStatus === 'pendente' ? (
                      <p className="font-bold text-orange-600 flex items-center gap-1">
                        {order.scheduleDate.split('-').reverse().join('/')} às {order.scheduleTime}
                        <span className="text-[10px] bg-orange-200 px-1.5 rounded text-orange-800">Pendente</span>
                      </p>
                    ) : order.scheduleStatus === 'negociacao' ? (
                      <p className="font-bold text-blue-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Negociação em andamento
                      </p>
                    ) : (
                      <p className="font-bold text-gray-900">Imediato</p>
                    )}
                  </div>
                </div>
              )}

              {/* Driver Scheduling Negotiation View */}
              {user?.type === 'motorista' && order.scheduleStatus === 'negociacao' && (
                <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in">
                  <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Oficina sugeriu novo horário
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    Devido a disponibilidade, a oficina propôs: <br />
                    <span className="font-bold text-lg">
                      {order.workshopProposedDate?.split('-').reverse().join('/')} às {order.workshopProposedTime}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(order.id, 'cancelado')}
                      className="flex-1 py-2 bg-white text-red-500 border border-red-200 rounded-lg text-sm font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDriverAcceptProposal(order)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md"
                    >
                      Aceitar Novo Horário
                    </button>
                  </div>
                </div>
              )}

              {/* Stepper / Status Bar */}
              {!isCancelled && (order.scheduleStatus === 'confirmado' || !order.scheduleDate) && (
                <div className="my-6">
                  <div className="relative flex items-center justify-between w-full">
                    {/* Background Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10"></div>

                    {/* Steps */}
                    {STATUS_STEPS.map((step, idx) => {
                      const isActive = idx === currentStepIndex;
                      const isCompleted = idx < currentStepIndex;
                      const isFuture = idx > currentStepIndex;

                      return (
                        <div key={step.id} className="flex flex-col items-center relative">
                          {/* Connector Line (Progress) */}
                          {idx > 0 && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 right-[50%] h-1 w-[200%] transition-colors duration-500 -z-20 
                                    ${idx <= currentStepIndex ? 'bg-primary' : 'bg-transparent'}`}
                            />
                          )}

                          <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 bg-white
                                ${isActive ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-orange-200' : ''}
                                ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                                ${isFuture ? 'border-gray-200 text-gray-300' : ''}
                            `}>
                            <step.icon className="w-4 h-4" />
                          </div>
                          <span className={`
                                text-[10px] font-bold mt-1 absolute -bottom-5 w-20 text-center transition-colors
                                ${isActive ? 'text-primary' : isCompleted ? 'text-gray-600' : 'text-gray-300'}
                            `}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completion Photos Gallery */}
              {isFinished && (order.completionPhotoWorkshop || order.completionPhotoDriver) && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 mt-6">
                  {order.completionPhotoWorkshop && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
                      <img src={order.completionPhotoWorkshop} className="w-full h-full object-cover" alt="Oficina" />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1">Oficina</span>
                    </div>
                  )}
                  {order.completionPhotoDriver && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
                      <img src={order.completionPhotoDriver} className="w-full h-full object-cover" alt="Cliente" />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1">Motorista</span>
                    </div>
                  )}
                </div>
              )}

              {/* Review Display if exists */}
              {hasReview && (
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-4">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < (order.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  {order.review && <p className="text-sm text-gray-700 italic">"{order.review}"</p>}
                </div>
              )}

              <div className="space-y-2 mb-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  {user?.type === 'motorista' ? (
                    <>
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium">Oficina:</span> {order.workshopName}
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium">Cliente:</span> {order.driverName}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <Car className="w-4 h-4 text-primary" />
                  <span className="font-medium">Veículo:</span> {order.vehicle}
                  {order.vehiclePlate && (
                    <span className="bg-white px-1.5 py-0.5 rounded border text-xs font-mono uppercase text-gray-500 ml-1">
                      {order.vehiclePlate}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {contactPhone && !isFinished && (
                  <button
                    onClick={() => openWhatsApp(contactPhone)}
                    className="w-full py-2 bg-white text-green-600 border border-green-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Conversar no WhatsApp
                  </button>
                )}

                {/* Workshop Controls */}
                {user?.type === 'oficina' && renderWorkshopActions(order)}

                {/* Driver Actions */}
                {user?.type === 'motorista' && (
                  <>
                    {order.status === 'criado' && order.scheduleStatus !== 'negociacao' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'cancelado')}
                        className="w-full py-2.5 text-red-500 text-sm font-medium hover:underline"
                      >
                        Cancelar solicitação
                      </button>
                    )}

                    {/* Review Button */}
                    {isFinished && !hasReview && (
                      <button
                        onClick={() => setReviewingOrderId(order.id)}
                        className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 animate-bounce"
                      >
                        <Star className="w-5 h-5 fill-white" /> Avaliar Serviço
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Orders;
