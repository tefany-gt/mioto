import React from 'react';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { NavItem } from '../types';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'profile', label: 'Perfil', icon: User },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 safe-bottom z-50 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
            >
              {isActive && (
                 <div className="absolute -top-[1px] w-8 h-1 bg-primary rounded-b-full"></div>
              )}
              
              <div className={`
                p-1.5 rounded-full transition-all duration-300
                ${isActive ? 'bg-orange-50' : 'bg-transparent'}
              `}>
                  <item.icon 
                    className={`w-5 h-5 ${isActive ? 'text-primary stroke-[2.5px]' : 'text-gray-400 stroke-2'}`} 
                  />
              </div>
              
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;