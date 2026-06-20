import { create } from 'zustand';
import { Appointment, Service } from '@/types';
import { mockAppointments } from '@/data/mockAppointments';

interface AppointmentStore {
  appointments: Appointment[];
  selectedServices: Service[];
  selectedDate: string;
  selectedTime: string | null;
  setSelectedServices: (services: Service[]) => void;
  toggleService: (service: Service) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string | null) => void;
  addAppointment: (apt: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  getCustomerAppointments: (customerId: string) => Appointment[];
  resetSelection: () => void;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [...mockAppointments],
  selectedServices: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedTime: null,

  setSelectedServices: (services) => set({ selectedServices: services }),

  toggleService: (service) => {
    const { selectedServices } = get();
    const exists = selectedServices.find(s => s.id === service.id);
    if (exists) {
      set({ selectedServices: selectedServices.filter(s => s.id !== service.id) });
    } else {
      set({ selectedServices: [...selectedServices, service] });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date, selectedTime: null }),

  setSelectedTime: (time) => set({ selectedTime: time }),

  addAppointment: (apt) => {
    const { appointments } = get();
    set({ appointments: [apt, ...appointments] });
    console.log('[AppointmentStore] 新增预约:', apt.orderNo);
  },

  updateAppointmentStatus: (id, status) => {
    const { appointments } = get();
    set({
      appointments: appointments.map(a =>
        a.id === id ? { ...a, status } : a
      )
    });
    console.log('[AppointmentStore] 更新状态:', id, status);
  },

  getCustomerAppointments: (customerId) => {
    return get().appointments.filter(a => a.customerId === customerId);
  },

  resetSelection: () => {
    set({ selectedServices: [], selectedTime: null });
  }
}));
