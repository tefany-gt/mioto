
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserType } from '../types';
import { 
  Car, Wrench, ArrowRight, Loader2, X, Image as ImageIcon, Camera, 
  ArrowLeft, Mail, CheckCircle, UserCircle, AlertCircle, MapPin, 
  Hash, Eye, EyeOff, Lock, Bug 
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AuthScreenProps {
  onClose: () => void;
  initialView?: 'login' | 'register';
  initialType?: UserType;
}

// --- Mask Helpers ---
const normalizePhone = (value: string) => {
  if (!value) return "";
  return value.replace(/[\D]/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})(\d+?)/, '$1');
};

const normalizeCpf = (value: string) => {
  if (!value) return "";
  return value.replace(/[\D]/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const normalizeCnpj = (value: string) => {
  if (!value) return "";
  return value.replace(/[\D]/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const normalizeCep = (value: string) => {
  if (!value) return "";
  return value.replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onClose, initialView = 'login', initialType = 'motorista' }) => {
  const { login, register, resetPassword } = useAuth();
  const numberInputRef = useRef<HTMLInputElement>(null);
  
  // Navigation State
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [isForgot, setIsForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [userType, setUserType] = useState<UserType>(initialType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  
  // Endereço State
  const [cep, setCep] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');

  // Driver State
  const [cpf, setCpf] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Workshop State
  const [cnpj, setCnpj] = useState('');
  const [description, setDescription] = useState('');
  
  // Images
  const [profileImage, setProfileImage] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');

  // Limpar erros ao trocar de modo
  useEffect(() => {
    setError('');
    setPassword('');
    setConfirmPassword('');
  }, [isLogin, userType]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeCep(e.target.value);
    setCep(value);
    
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress(`${data.logradouro}${data.bairro ? ', ' + data.bairro : ''}`);
          setLocation(`${data.localidade}, ${data.uf}`);
          setError('');
          // Focar no número após preencher o CEP usando ref
          setTimeout(() => {
             numberInputRef.current?.focus();
          }, 100);
        } else {
          setError('CEP não encontrado.');
        }
      } catch (err) {
        setError('Erro ao buscar endereço.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação de correspondência de senha apenas no cadastro
    if (!isLogin && password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(email.trim().toLowerCase(), password.trim());
        if (!success) setError('E-mail ou senha inválidos.');
      } else {
        const newUser: Omit<User, 'id'> = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          type: userType,
          phone: phone.trim(),
          image: profileImage,
          cep: cep.replace(/\D/g, ''),
          number: houseNumber.trim(),
          address: address.trim(),
          location: location.trim(),
          ...(userType === 'motorista' ? { 
            cpf: cpf.trim(),
            vehicleModel: vehicleModel.trim(), 
            vehicleBrand: vehicleBrand.trim(),
            vehicleYear: vehicleYear.trim(),
            vehiclePlate: vehiclePlate.trim().toUpperCase()
          } : { 
            cnpj: cnpj.trim(),
            description: description.trim(),
            coverImage: coverImage,
            tags: ['Mecânica Geral'], 
            rating: 5.0, 
          })
        };
        const success = await register(newUser, password.trim());
        if (!success) setError('Este e-mail já está em uso.');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        const success = await resetPassword(email.trim().toLowerCase());
        if (success) setResetSent(true);
        else setError('E-mail não encontrado.');
    } catch (err) {
        setError('Erro ao enviar e-mail.');
    } finally {
        setLoading(false);
    }
  };

  const fillTestCredentials = (type: UserType) => {
    setIsLogin(true);
    setPassword('123456');
    if (type === 'motorista') {
      setEmail('motorista@teste.com');
    } else {
      setEmail('contato@iotu.com'); // Baseado no seed do db.ts
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md"><X className="w-5 h-5" /></button>

        <div className="bg-primary p-6 text-center relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
             <div className="mb-2 scale-110">
                 <BrandLogo variant="auth" textClass="text-4xl" className="h-10" />
             </div>
             <p className="text-orange-100 text-xs font-medium tracking-wide">
                {isForgot ? 'Recuperação de Acesso' : (isLogin ? 'Entre para continuar' : 'Crie sua conta')}
             </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          {isForgot ? (
            <div className="space-y-6">
                {!resetSent ? (
                    <>
                        <button onClick={() => setIsForgot(false)} className="text-gray-500 flex items-center gap-1 text-sm font-medium hover:text-primary mb-2"><ArrowLeft className="w-4 h-4" /> Voltar</button>
                        <div className="text-center space-y-2">
                            <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-primary" /></div>
                            <h3 className="text-lg font-bold">Esqueceu sua senha?</h3>
                            <p className="text-sm text-gray-500">Digite seu e-mail cadastrado para redefinir sua senha.</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:bg-white" placeholder="seu@email.com" />
                            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar Recuperação'}</button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">E-mail Enviado!</h3>
                        <p className="text-sm text-gray-500 mb-6">Verifique sua caixa de entrada para redefinir sua senha.</p>
                        <button onClick={() => { setIsForgot(false); setResetSent(false); setIsLogin(true); }} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl">Voltar para Login</button>
                    </div>
                )}
            </div>
          ) : (
            <>
                <div className="flex gap-4 mb-5 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Entrar</button>
                    <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Cadastrar</button>
                </div>

                {!isLogin && (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <button onClick={() => setUserType('motorista')} className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${userType === 'motorista' ? 'border-primary bg-orange-50 text-primary ring-1 ring-primary' : 'border-gray-200 text-gray-500'}`}><Car className="w-6 h-6" /><span className="text-xs font-semibold">Motorista</span></button>
                        <button onClick={() => setUserType('oficina')} className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${userType === 'oficina' ? 'border-primary bg-orange-50 text-primary ring-1 ring-primary' : 'border-gray-200 text-gray-500'}`}><Wrench className="w-6 h-6" /><span className="text-xs font-semibold">Oficina</span></button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:bg-white" placeholder="seu@email.com" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Senha</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400 pointer-events-none" />
                          <input 
                            required 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full pl-9 pr-12 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:bg-white" 
                            placeholder="••••••••" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {isLogin && <div className="flex justify-end mt-2"><button type="button" onClick={() => setIsForgot(true)} className="text-xs font-medium text-primary">Esqueceu sua senha?</button></div>}
                    </div>

                    {!isLogin && (
                        <>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirmar Senha</label>
                            <div className="relative">
                              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400 pointer-events-none" />
                              <input 
                                required 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className={`w-full pl-9 pr-12 py-3 rounded-xl border outline-none text-sm bg-gray-50 focus:bg-white ${password && confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-200'}`} 
                                placeholder="Repita sua senha" 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {password && confirmPassword && password !== confirmPassword && (
                              <p className="text-[10px] text-red-500 mt-1 font-medium">As senhas não coincidem.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">{userType === 'motorista' ? 'Nome Completo' : 'Nome Fantasia'}</label>
                            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="Ex: João Silva" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp</label>
                            <input required type="tel" value={phone} onChange={(e) => setPhone(normalizePhone(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="(11) 99999-9999" maxLength={15} />
                        </div>

                        {/* Endereço com busca por CEP */}
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Endereço</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">CEP</label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                                        <input required type="tel" value={cep} onChange={handleCepChange} className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" placeholder="00000-000" maxLength={9} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Número</label>
                                    <div className="relative">
                                        <Hash className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                                        <input required ref={numberInputRef} type="text" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" placeholder="123" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Rua / Bairro</label>
                                <input required type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" placeholder="Rua, Bairro" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade / UF</label>
                                <input required type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" placeholder="Cidade, UF" />
                            </div>
                        </div>

                        {userType === 'motorista' && (
                            <div className="animate-in slide-in-from-top-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">CPF</label>
                                    <input required type="tel" value={cpf} onChange={(e) => setCpf(normalizeCpf(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="000.000.000-00" maxLength={14} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input required type="text" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="Marca (Ex: Fiat)" />
                                    <input required type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="Modelo (Ex: Uno)" />
                                </div>
                            </div>
                        )}

                        {userType === 'oficina' && (
                            <div className="animate-in slide-in-from-top-2 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">CNPJ</label>
                                    <input required type="tel" value={cnpj} onChange={(e) => setCnpj(normalizeCnpj(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" placeholder="000.000.000/0001-00" maxLength={18} />
                                </div>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 resize-none" placeholder="Descrição curta da oficina..." rows={2} />
                            </div>
                        )}
                        </>
                    )}

                    {error && <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg"><AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span></div>}

                    <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLogin ? 'Entrar' : 'Criar Conta'}<ArrowRight className="w-5 h-5" /></>}
                    </button>
                    
                    {/* Botões de Teste (Preenchimento Automático) */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 justify-center mb-3 text-gray-400">
                          <Bug className="w-3 h-3" />
                          <p className="text-[10px] font-bold uppercase tracking-wide">Acesso Rápido (Teste)</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => fillTestCredentials('motorista')}
                          className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                        >
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Car className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-600">Motorista</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fillTestCredentials('oficina')}
                          className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                        >
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Wrench className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-gray-600">Oficina</span>
                        </button>
                      </div>
                    </div>

                </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
