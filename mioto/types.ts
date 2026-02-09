
import { LucideIcon } from 'lucide-react';

export type UserType = 'motorista' | 'oficina';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
}

export interface DaySchedule {
  start: string; // "08:00"
  end: string;   // "18:00"
  isClosed: boolean;
}

export interface OpeningHours {
  seg: DaySchedule;
  ter: DaySchedule;
  qua: DaySchedule;
  qui: DaySchedule;
  sex: DaySchedule;
  sab: DaySchedule;
  dom: DaySchedule;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  phone?: string; 
  image?: string; 
  coverImage?: string; 
  
  // Endereço
  cep?: string;
  number?: string;
  address?: string; 
  location?: string; 

  // Favoritos
  favorites?: string[]; 

  // Oficina specific
  cnpj?: string;
  rating?: number;
  ratingCount?: number;
  tags?: string[];
  description?: string; 
  
  services?: ServiceItem[]; // LISTA SIMPLES (Tags/Especialidades)
  detailedServices?: ServiceItem[]; // LISTA DETALHADA (Vitrine com Foto/Preço)
  
  gallery?: string[]; 
  
  // Status e Horários
  isOpen?: boolean; 
  openingHours?: OpeningHours;

  // Motorista specific
  cpf?: string; 
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleYear?: string;
  vehiclePlate?: string;
}

export type OrderStatus = 'criado' | 'pago' | 'a_caminho' | 'chegou' | 'concluido' | 'cancelado';
export type PaymentMethod = 'credit_card' | 'pay_on_site';
export type ScheduleStatus = 'imediato' | 'pendente' | 'confirmado' | 'negociacao';

export interface ServiceOrder {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  workshopId: string;
  workshopName: string;
  workshopPhone?: string;
  serviceName: string;
  serviceDescription?: string; 
  price?: number; 
  paymentMethod?: PaymentMethod; 
  date: string; 
  status: OrderStatus;
  vehicle: string; 
  vehiclePlate?: string;
  
  scheduleDate?: string; 
  scheduleTime?: string; 
  scheduleStatus?: ScheduleStatus; 
  workshopProposedDate?: string; 
  workshopProposedTime?: string;

  completionPhotoWorkshop?: string; 
  completionPhotoDriver?: string; 
  rating?: number; 
  review?: string; 
}

export interface Notification {
  id: string;
  type: 'order' | 'security' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLink?: string; 
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface Workshop extends User {
  // Extends user
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}
