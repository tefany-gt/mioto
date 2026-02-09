
import { User, ServiceOrder, Workshop } from '../types';
import { supabase } from './supabase';

const USERS_KEY = 'iotu_users';
const ORDERS_KEY = 'iotu_orders';

// Utilitário para verificar se é um UUID válido
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || (id && id.length > 20 && !id.includes('-default'));

// Gerador de UUID robusto
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const db = {
  checkConnection: async (): Promise<{ status: 'online' | 'offline', message?: string }> => {
    if (!supabase) {
        return { status: 'offline', message: 'Configuração do Supabase não encontrada.' };
    }

    try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            if (error.code === '42P01') return { status: 'offline', message: "Tabela 'profiles' não existe. Execute o script SQL." };
            return { status: 'offline', message: error.message };
        }
        return { status: 'online' };
    } catch (e: any) {
        return { status: 'offline', message: 'Erro de rede ou CORS.' };
    }
  },

  seedDatabase: async (): Promise<boolean> => {
      try {
          const stored = localStorage.getItem(USERS_KEY);
          let users: User[] = stored ? JSON.parse(stored) : [];
          
          const testUsers = [
            {
                id: 'w-default',
                name: 'Oficina Central MIOTO (Teste)',
                email: 'contato@iotu.com',
                type: 'oficina',
                location: 'Suzano, SP',
                address: 'Rua Benjamin Constant, 100',
                phone: '(11) 99999-9999',
                rating: 5.0,
                tags: ['Mecânica', 'Elétrica', 'Suspensão'],
                image: 'https://ui-avatars.com/api/?name=MIOTO&background=FF8B00&color=fff',
                description: 'Esta é uma oficina de teste. Conecte seu Supabase para ver dados reais do banco.',
                services: [
                  { id: 's1', name: 'Óleo', price: 0 },
                  { id: 's2', name: 'Freios', price: 0 }
                ],
                detailedServices: [],
                gallery: []
            } as User,
            {
                id: 'd-default',
                name: 'Motorista Teste',
                email: 'motorista@teste.com',
                type: 'motorista',
                phone: '(11) 98888-8888',
                location: 'Suzano, SP',
                image: 'https://ui-avatars.com/api/?name=Motorista+Teste&background=0D8ABC&color=fff'
            } as User
          ];

          let updated = false;
          testUsers.forEach(testUser => {
              if (!users.find(u => u.email === testUser.email)) {
                  users.push(testUser);
                  updated = true;
              }
          });

          if (updated) {
              localStorage.setItem(USERS_KEY, JSON.stringify(users));
              return true;
          }
      } catch (e) {}
      return false;
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    if (supabase && id.length > 20) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
            if (!error && data) return { ...data.data, id: data.id, email: data.email, type: data.type };
        } catch (e) {}
    }
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find(u => u.id === id);
  },

  findUserByEmail: async (email: string): Promise<User | undefined> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
            if (!error && data) return { ...data.data, id: data.id, email: data.email, type: data.type };
        } catch (e) {}
    }
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  saveUser: async (user: User): Promise<boolean> => {
    if (supabase && user.id.length > 20) {
      try {
          await supabase.from('profiles').upsert({ 
              id: user.id, 
              email: user.email.toLowerCase(), 
              name: user.name, 
              type: user.type, 
              data: user 
          });
      } catch (e) {}
    }
    
    try {
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.id === user.id);
        if (index === -1) users.push(user);
        else users[index] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    } catch (e) { return false; }
  },

  updateUser: async (updatedUser: User): Promise<boolean> => {
    if (supabase && updatedUser.id.length > 20) {
       try {
           await supabase.from('profiles').update({ 
               name: updatedUser.name, 
               data: updatedUser 
           }).eq('id', updatedUser.id);
       } catch (e) {}
    }
    try {
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
        return true;
    } catch (e) { return true; }
  },

  getWorkshops: async (): Promise<Workshop[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('type', 'oficina');
            if (!error && data && data.length > 0) {
                 return data.map(d => ({ ...d.data, id: d.id }));
            }
        } catch (e) {}
    }
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.filter(u => u.type === 'oficina') as Workshop[];
  },

  getOrders: async (): Promise<ServiceOrder[]> => {
    if (supabase) {
      try {
          const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (!error && data) return data.map(o => ({ ...o.data, id: o.id, status: o.status }));
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  },

  createOrder: async (order: ServiceOrder) => {
    if (supabase && order.driverId.length > 20) {
      try {
          await supabase.from('orders').insert({ 
              id: order.id, 
              driver_id: order.driverId, 
              workshop_id: order.workshopId, 
              status: order.status, 
              data: order 
          });
      } catch (e) {}
    }
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  },

  updateOrderStatus: async (orderId: string, status: ServiceOrder['status'], extraData?: Partial<ServiceOrder>) => {
    if (supabase && orderId.length > 20) {
       try {
           const { data: current } = await supabase.from('orders').select('data').eq('id', orderId).maybeSingle();
           if (current) {
               const newData = { ...current.data, ...extraData, status };
               await supabase.from('orders').update({ status, data: newData }).eq('id', orderId);
           }
       } catch (e) {}
    }
    try {
        const orders: ServiceOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...extraData, status };
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        }
    } catch (e) {}
  },

  addOrderReview: async (orderId: string, rating: number, review?: string, photo?: string) => {
    if (supabase && orderId.length > 20) {
      try {
        const { data: current } = await supabase.from('orders').select('data').eq('id', orderId).maybeSingle();
        if (current) {
          const newData = { ...current.data, rating, review, completionPhotoDriver: photo };
          await supabase.from('orders').update({ data: newData }).eq('id', orderId);
        }
      } catch (e) {}
    }
    try {
        const orders: ServiceOrder[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          orders[index] = { ...orders[index], rating, review, completionPhotoDriver: photo };
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        }
    } catch (e) {}
  }
};
