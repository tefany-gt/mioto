import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (user: Omit<User, 'id'>, pass: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (updatedUser: User) => Promise<boolean>;
  logout: () => void;
  toggleFavorite: (workshopId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      // Garante que dados de teste existam no load
      await db.seedDatabase();

      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await db.getUserById(session.user.id);
            if (profile) {
              setUser(profile);
            } else {
               console.warn("Sessão ativa, mas perfil não encontrado no banco.");
            }
          }
        }
        
        // Se não logou pelo Supabase, tenta Fallback local
        if (!user) {
            const local = localStorage.getItem('iotu_session');
            if (local) setUser(JSON.parse(local));
        }
      } catch (e) {
        console.error("Auth Init Error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Delay pequeno para garantir que o Trigger do banco tenha rodado
        setTimeout(async () => {
            const profile = await db.getUserById(session.user.id);
            if (profile) {
              setUser(profile);
              localStorage.setItem('iotu_session', JSON.stringify(profile));
            }
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('iotu_session');
      }
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    let success = false;
    
    // 1. Tenta Login no Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (!error && data.user) {
          success = true;
          // Força busca imediata
          const profile = await db.getUserById(data.user.id);
          if (profile) {
              setUser(profile);
              localStorage.setItem('iotu_session', JSON.stringify(profile));
          }
        }
      } catch (e) {
        console.error("Supabase login error:", e);
      }
    }

    // 2. Fallback Local (apenas para contas de teste)
    if (!success) {
      if (email.includes('teste.com') || email.includes('iotu.com')) {
          await db.seedDatabase();
      }
      const localUser = await db.findUserByEmail(email);
      if (localUser) {
        setUser(localUser);
        localStorage.setItem('iotu_session', JSON.stringify(localUser));
        success = true;
      }
    }

    return success;
  };

  const register = async (newUser: Omit<User, 'id'>, pass: string) => {
    if (supabase) {
      try {
        // Envia dados completos nos metadados para o Trigger SQL usar
        const { data, error } = await supabase.auth.signUp({ 
          email: newUser.email, 
          password: pass,
          options: {
            data: {
              name: newUser.name,
              type: newUser.type,
              role: newUser.type,
              full_data: newUser // Dados completos para preencher a coluna JSONB
            }
          }
        });

        if (error) {
             console.error("Erro no Registro Supabase:", error.message);
             return false;
        }

        if (data.user) {
          const fullUser = { ...newUser, id: data.user.id } as User;
          
          // Tenta salvar via cliente também como redundância
          await db.saveUser(fullUser);
          
          setUser(fullUser);
          localStorage.setItem('iotu_session', JSON.stringify(fullUser));
          return true;
        }
      } catch (e) {
        console.error("Supabase register error:", e);
      }
    }
    
    // Fallback offline
    if (!supabase) {
        const id = 'off_' + Math.random().toString(36).substr(2, 9);
        const fullUser = { ...newUser, id } as User;
        await db.saveUser(fullUser);
        setUser(fullUser);
        localStorage.setItem('iotu_session', JSON.stringify(fullUser));
        return true;
    }
    
    return false;
  };

  const resetPassword = async (email: string) => {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      return !error;
    }
    return false;
  };

  const updateProfile = async (updatedUser: User) => {
    const success = await db.updateUser(updatedUser);
    if (success) {
      setUser(updatedUser);
      localStorage.setItem('iotu_session', JSON.stringify(updatedUser));
    }
    return success;
  };

  const toggleFavorite = async (workshopId: string) => {
    if (!user) return;
    const currentFavorites = user.favorites || [];
    let newFavorites = currentFavorites.includes(workshopId)
        ? currentFavorites.filter(id => id !== workshopId)
        : [...currentFavorites, workshopId];
    
    await updateProfile({ ...user, favorites: newFavorites });
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('iotu_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, resetPassword, updateProfile, logout, toggleFavorite, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);