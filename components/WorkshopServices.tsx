import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ServiceItem } from '../types';
import { Plus, Trash2, Tag, X, Loader2, Wrench, Image as ImageIcon, Edit2, Save, Droplet, Disc, Battery, Zap, Wind, PaintBucket, Truck, Key, Car, Circle, Gauge } from 'lucide-react';

const WorkshopServices: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // --- Estado para Serviço Simples (Tags) ---
  const [serviceName, setServiceName] = useState('');

  // --- Estado para Serviço Detalhado (Vitrine) ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // ID do item sendo editado
  
  const [detName, setDetName] = useState('');
  const [detPrice, setDetPrice] = useState('');
  const [detDesc, setDetDesc] = useState('');
  const [detImage, setDetImage] = useState('');

  if (!user || user.type !== 'oficina') return null;

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

  // --- Lógica Serviço Simples (Tags) ---
  const handleAddSimpleService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || isSaving) return;

    setIsSaving(true);
    try {
        const newService: ServiceItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: serviceName.trim(), 
          price: 0
        };
        const currentServices = user.services || [];
        // Evita duplicatas
        if (currentServices.some(s => s.name.toLowerCase() === serviceName.trim().toLowerCase())) {
            alert("Esta especialidade já existe na lista.");
            setIsSaving(false); return;
        }
        await updateProfile({ ...user, services: [newService, ...currentServices] });
        setServiceName('');
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  const handleDeleteSimple = async (id: string) => {
      if(!confirm("Remover esta especialidade?")) return;
      const updated = (user.services || []).filter(s => s.id !== id);
      await updateProfile({ ...user, services: updated });
  };

  // --- Lógica Serviço Detalhado (Vitrine) ---

  const resetForm = () => {
      setDetName('');
      setDetPrice('');
      setDetDesc('');
      setDetImage('');
      setEditingId(null);
      setIsFormOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Máximo 2MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setDetImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (service: ServiceItem) => {
      setEditingId(service.id);
      setDetName(service.name);
      setDetDesc(service.description || '');
      setDetPrice(service.price ? service.price.toFixed(2).replace('.', ',') : '');
      setDetImage(service.image || '');
      setIsFormOpen(true);
      
      // Scroll suave para o formulário
      window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSaveDetailed = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!detName || isSaving) return;
      setIsSaving(true);
      
      try {
          const priceValue = parseFloat(detPrice.replace(',', '.')) || 0;
          
          const serviceData: ServiceItem = {
              id: editingId || 'det_' + Math.random().toString(36).substr(2, 9),
              name: detName,
              description: detDesc,
              price: priceValue,
              image: detImage
          };

          let updatedList = [...(user.detailedServices || [])];

          if (editingId) {
              // Editando existente
              updatedList = updatedList.map(s => s.id === editingId ? serviceData : s);
          } else {
              // Criando novo
              updatedList = [serviceData, ...updatedList];
          }

          await updateProfile({ ...user, detailedServices: updatedList });
          resetForm();
      } catch (e) { 
          console.error(e); 
          alert("Erro ao salvar serviço.");
      } finally { 
          setIsSaving(false); 
      }
  };

  const handleDeleteDetailed = async (id: string) => {
      if(!confirm("Tem certeza que deseja excluir este serviço da vitrine?")) return;
      
      setIsDeleting(id);
      try {
        const updated = (user.detailedServices || []).filter(s => s.id !== id);
        await updateProfile({ ...user, detailedServices: updated });
        
        // Se estava editando o item que foi excluído, fecha o form
        if (editingId === id) resetForm();

      } catch (e) {
          console.error(e);
      } finally {
          setIsDeleting(null);
      }
  };

  const formatCurrency = (val?: number) => val ? `R$ ${val.toFixed(2).replace('.', ',')}` : 'Sob Consulta';

  return (
    <div className="space-y-6">
        
      {/* SEÇÃO 1: SERVIÇOS RÁPIDOS (TAGS) */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-500" />
            Especialidades (Lista Rápida)
            </h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Liste o que você faz (ex: Suspensão, Freios, Motor) para ser encontrado na busca.</p>

        <form onSubmit={handleAddSimpleService} className="flex gap-2 mb-4">
            <input 
                type="text" 
                placeholder="Nome da especialidade (ex: Freios)..." 
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary outline-none text-sm"
            />
            <button disabled={!serviceName || isSaving} className="bg-gray-800 text-white px-4 rounded-xl font-bold text-sm hover:bg-black transition-colors">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
        </form>

        <div className="flex flex-wrap gap-2">
            {user.services?.map(s => {
                const Icon = getServiceIcon(s.name);
                return (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-primary transition-colors">
                        <Icon className="w-4 h-4 text-primary" />
                        {s.name}
                        <button type="button" onClick={() => handleDeleteSimple(s.id)} className="text-gray-400 hover:text-red-500 ml-1 p-1">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
            {(!user.services || user.services.length === 0) && <p className="text-xs text-gray-400 italic">Nenhuma especialidade cadastrada.</p>}
        </div>
      </div>

      {/* SEÇÃO 2: VITRINE DETALHADA */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Vitrine de Serviços & Promoções
            </h3>
            {!isFormOpen && (
                <button 
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4"/> Novo Item
                </button>
            )}
        </div>

        {isFormOpen && (
            <form onSubmit={handleSaveDetailed} className="bg-orange-50 p-5 rounded-2xl mb-6 border border-orange-100 animate-in slide-in-from-top-2 relative">
                <button 
                    type="button" 
                    onClick={resetForm} 
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-orange-100 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    {editingId ? <><Edit2 className="w-4 h-4"/> Editar Serviço</> : <><Plus className="w-4 h-4"/> Adicionar Novo</>}
                </h4>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <label className="w-full md:w-32 h-32 bg-white rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary overflow-hidden relative group flex-shrink-0">
                        {detImage ? (
                            <>
                                <img src={detImage} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageIcon className="w-6 h-6 text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-orange-300 p-2 text-center">
                                <ImageIcon className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-bold">Foto</span>
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Serviço</label>
                            <input 
                                required 
                                placeholder="Ex: Troca de Óleo Premium" 
                                value={detName} 
                                onChange={e => setDetName(e.target.value)} 
                                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100 bg-white text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">R$</span>
                                <input 
                                    type="text" 
                                    placeholder="0,00" 
                                    value={detPrice} 
                                    onChange={e => setDetPrice(e.target.value.replace(/[^0-9,]/g, ''))} 
                                    className="w-full pl-9 p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100 bg-white text-sm" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descrição</label>
                    <textarea 
                        placeholder="Descreva detalhes do serviço, peças inclusas, tempo estimado..." 
                        value={detDesc} 
                        onChange={e => setDetDesc(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100 bg-white text-sm resize-none" 
                        rows={3} 
                    />
                </div>

                <div className="flex gap-3">
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={resetForm} 
                            className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={isSaving || !detName} 
                        className="flex-[2] bg-gray-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> {editingId ? 'Atualizar Serviço' : 'Salvar na Vitrine'}</>}
                    </button>
                </div>
            </form>
        )}

        <div className="grid gap-4">
            {user.detailedServices?.map(s => (
                <div key={s.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-primary/30 transition-all shadow-sm group">
                    <div className="w-full sm:w-24 h-32 sm:h-24 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                        {s.image ? (
                            <img src={s.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={s.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><ImageIcon /></div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{s.name}</h4>
                            <div className="flex gap-1 pl-2">
                                <button 
                                    onClick={() => handleEditClick(s)} 
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteDetailed(s.id)} 
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    {isDeleting === s.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        
                        <p className="text-primary font-bold text-base mt-1 mb-1">{formatCurrency(s.price)}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{s.description || 'Sem descrição.'}</p>
                    </div>
                </div>
            ))}
            
            {(!user.detailedServices || user.detailedServices.length === 0) && !isFormOpen && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Sua vitrine está vazia.</p>
                    <p className="text-xs mt-1">Clique em "Novo Item" para adicionar destaques.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopServices;