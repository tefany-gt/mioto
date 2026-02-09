
import React, { useState } from 'react';
import { Workshop } from '../types';
import { X, Wrench, ChevronRight, AlertCircle, CreditCard, Banknote, ArrowLeft, Loader2, CheckCircle, Calendar, Lock, Clock, ShoppingBag, ImageIcon } from 'lucide-react';

interface ServiceRequestModalProps {
  workshop: Workshop;
  onClose: () => void;
  onSelectService: (
    serviceName: string, 
    price: number | undefined, 
    description: string | undefined, 
    paymentMethod: 'credit_card' | 'pay_on_site',
    scheduleData?: { date: string, time: string }
  ) => void;
  isLoading: boolean;
}

const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({ workshop, onClose, onSelectService, isLoading }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<{name: string, price?: number, description?: string} | null>(null);

  // Schedule State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Credit Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const formatPrice = (val?: number) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : 'A Combinar';

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(val.slice(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    setCardExpiry(val);
  };

  const handleServiceClick = (name: string, price?: number, description?: string) => {
    setSelectedService({ name, price, description });
    setStep(2); 
  };

  const handleScheduleConfirm = (scheduled: boolean) => {
    setIsScheduled(scheduled);
    if (scheduled) {
        if (!scheduleDate || !scheduleTime) {
            alert("Por favor, selecione dia e horário.");
            return;
        }
    }
    setStep(3);
  };

  const handlePaymentSelect = (method: 'credit_card' | 'pay_on_site') => {
    if (method === 'credit_card') {
      setStep(4);
    } else {
      submitOrder(method);
    }
  };

  const submitOrder = (method: 'credit_card' | 'pay_on_site') => {
    if (selectedService) {
        const scheduleData = isScheduled ? { date: scheduleDate, time: scheduleTime } : undefined;
        onSelectService(selectedService.name, selectedService.price, selectedService.description, method, scheduleData);
    }
  };

  const processCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) return;
    setIsProcessingPayment(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessingPayment(false);
    setStep(5);
    setTimeout(() => { submitOrder('credit_card'); }, 1000);
  };

  const isLocked = isProcessingPayment || step === 5;
  const isCardFormValid = cardNumber.length >= 19 && cardName.length > 3 && cardExpiry.length === 5 && cardCvv.length >= 3;

  const getStepTitle = () => {
      switch(step) {
          case 1: return 'Escolha um Serviço';
          case 2: return 'Agendamento';
          case 3: return 'Forma de Pagamento';
          case 4: return 'Dados do Cartão';
          case 5: return 'Concluído';
      }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-lg bg-white md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-2">
            {step > 1 && !isLocked && (
              <button onClick={() => setStep(prev => (prev - 1) as any)} className="p-1 hover:bg-gray-100 rounded-full mr-1">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h3 className="font-bold text-lg text-gray-900">{getStepTitle()}</h3>
              {step !== 5 && <p className="text-sm text-gray-500">em {workshop.name}</p>}
            </div>
          </div>
          {!isLocked && <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h4 className="font-bold text-gray-800 text-sm">Disponível na Vitrine</h4>
              </div>

              {/* LISTA EXCLUSIVA DA VITRINE */}
              <div className="grid grid-cols-1 gap-3">
                 {workshop.detailedServices?.map(s => (
                     <button 
                        key={s.id} 
                        onClick={() => handleServiceClick(s.name, s.price, s.description)} 
                        className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all text-left group"
                     >
                         <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                            {s.image ? (
                                <img src={s.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 leading-tight mb-1">{s.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1 mb-1">{s.description || 'Sem descrição'}</p>
                            <p className="text-primary font-bold text-sm">{formatPrice(s.price)}</p>
                         </div>
                         <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors"/>
                     </button>
                 ))}
              </div>

              {(!workshop.detailedServices || workshop.detailedServices.length === 0) && (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                      <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <h4 className="font-bold text-gray-600">Vitrine Vazia</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">Esta oficina ainda não cadastrou serviços no catálogo detalhado.</p>
                  </div>
              )}
            </div>
          )}

          {step === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 text-sm mb-1">Serviço Selecionado</h4>
                    <p className="text-gray-700 font-medium">{selectedService?.name}</p>
                    <p className="text-primary font-bold mt-1">{formatPrice(selectedService?.price)}</p>
                </div>
                <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-700">Quando?</p>
                    <button onClick={() => handleScheduleConfirm(false)} className="w-full p-4 border rounded-xl flex items-center gap-4 text-left hover:bg-orange-50 hover:border-primary group bg-white">
                        <div className="w-10 h-10 bg-orange-100 text-primary rounded-full flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                        <div className="flex-1"><h4 className="font-bold text-gray-800">O mais rápido possível</h4><p className="text-xs text-gray-500">Imediato</p></div>
                    </button>
                    <div className="border rounded-xl p-4 space-y-4 bg-white">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                            <div><h4 className="font-bold text-gray-800">Agendar</h4></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs font-bold text-gray-500">Dia</label><input type="date" value={scheduleDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-gray-50" /></div>
                            <div><label className="text-xs font-bold text-gray-500">Hora</label><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-gray-50" /></div>
                        </div>
                        <button onClick={() => handleScheduleConfirm(true)} className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50" disabled={!scheduleDate || !scheduleTime}>Confirmar Agendamento</button>
                    </div>
                </div>
             </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 space-y-2">
                  <h4 className="text-sm font-bold text-gray-700">Resumo</h4>
                  <div className="flex justify-between"><span className="text-gray-600 text-sm">Serviço</span><span className="font-medium text-sm">{selectedService?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 text-sm">Valor</span><span className="font-bold text-sm text-primary">{formatPrice(selectedService?.price)}</span></div>
                  {isScheduled ? (
                      <div className="flex justify-between items-center text-blue-600 bg-blue-50 p-2 rounded-lg text-xs font-bold"><span>Agendado</span><span>{scheduleDate.split('-').reverse().join('/')} às {scheduleTime}</span></div>
                  ) : <div className="flex justify-between items-center text-orange-600 bg-orange-50 p-2 rounded-lg text-xs font-bold"><span>Urgência</span><span>Imediato</span></div>}
               </div>
               <p className="text-sm text-gray-600 font-medium">Pagamento</p>
               <button onClick={() => handlePaymentSelect('credit_card')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-orange-50 transition-all group bg-white">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
                  <div className="text-left flex-1"><h4 className="font-bold text-gray-800">Cartão de Crédito</h4><p className="text-xs text-gray-500">Pagar agora pelo app</p></div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
               </button>
               <button onClick={() => handlePaymentSelect('pay_on_site')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group bg-white">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Banknote className="w-6 h-6" /></div>
                  <div className="text-left flex-1"><h4 className="font-bold text-gray-800">Pagar na Hora</h4><p className="text-xs text-gray-500">Dinheiro ou máquina</p></div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
               </button>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={processCardPayment} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex items-center gap-2 mb-2 bg-blue-50 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div><p className="text-xs text-gray-500">Total a pagar</p><p className="font-bold text-gray-900">{formatPrice(selectedService?.price)}</p></div>
                </div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Número do Cartão</label><input required type="text" value={cardNumber} onChange={handleCardNumberChange} className="w-full p-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="0000 0000 0000 0000" disabled={isProcessingPayment} /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Nome no Cartão</label><input required type="text" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="w-full p-3 rounded-xl border border-gray-200 outline-none text-sm uppercase bg-gray-50" placeholder="NOME COMO NO CARTÃO" disabled={isProcessingPayment} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Validade</label><input required type="text" value={cardExpiry} onChange={handleExpiryChange} className="w-full p-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="MM/AA" maxLength={5} disabled={isProcessingPayment} /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">CVV</label><input required type="tel" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="123" disabled={isProcessingPayment} /></div>
                </div>
                <button type="submit" disabled={isProcessingPayment || !isCardFormValid} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-70">
                    {isProcessingPayment ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><CreditCard className="w-5 h-5" /> Confirmar Pagamento</>}
                </button>
            </form>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center h-full py-10 animate-in zoom-in duration-300">
                <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pedido Enviado!</h3>
                <p className="text-gray-500 text-center text-sm">Aguarde a confirmação da oficina.</p>
                <div className="mt-8 flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...</div>
            </div>
          )}

          {isLoading && step !== 5 && step !== 4 && (
             <div className="flex flex-col items-center justify-center h-40"><Loader2 className="w-10 h-10 text-primary animate-spin mb-2" /><p className="text-gray-500 font-medium">Enviando pedido...</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestModal;
