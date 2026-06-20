import { create } from 'zustand';
import { Appointment, Service, Stylist, Station, TimeSlot } from '@/types';
import { mockAppointments } from '@/data/mockAppointments';
import { generateTimeSlots } from '@/utils/timeSlot';

interface AppointmentStore {
  appointments: Appointment[];
  selectedServices: Service[];
  selectedDate: string;
  selectedTime: string | null;
  setSelectedServices: (services: Service[]) => void;
  toggleService: (service: Service, stylists?: Stylist[], stations?: Station[]) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string | null) => void;
  addAppointment: (apt: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  getCustomerAppointments: (customerId: string) => Appointment[];
  resetSelection: () => void;
  validateSelectedTime: (stylists: Stylist[], stations: Station[]) => boolean;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [...mockAppointments],
  selectedServices: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedTime: null,

  setSelectedServices: (services) => set({ selectedServices: services }),

  toggleService: (service, stylists, stations) => {
    const { selectedServices, selectedDate, selectedTime, appointments } = get();
    const exists = selectedServices.find(s => s.id === service.id);
    const newServices = exists
      ? selectedServices.filter(s => s.id !== service.id)
      : [...selectedServices, service];

    if (selectedTime && stylists && stations && newServices.length > 0) {
      const totalDuration = Math.max(30, newServices.reduce((sum, s) => sum + s.duration, 0));
      const slots: TimeSlot[] = generateTimeSlots(selectedDate, stylists, appointments, totalDuration);
      const stillAvailable = slots.find(s => s.time === selectedTime && s.available);
      if (!stillAvailable) {
        console.log('[AppointmentStore] 服务变更后原时间不可用，清空:', selectedTime);
        set({ selectedServices: newServices, selectedTime: null });
        return;
      }
    }

    if (newServices.length === 0) {
      set({ selectedServices: [], selectedTime: null });
    } else {
      set({ selectedServices: newServices });
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

  validateSelectedTime: (stylists, stations) => {
    const { selectedServices, selectedDate, selectedTime, appointments } = get();
    if (!selectedTime || selectedServices.length === 0) return false;
    const totalDuration = Math.max(30, selectedServices.reduce((sum, s) => sum + s.duration, 0));
    const slots: TimeSlot[] = generateTimeSlots(selectedDate, stylists, appointments, totalDuration);
    const ok = slots.some(s => s.time === selectedTime && s.available);
    if (!ok) {
      console.log('[AppointmentStore] 校验失败：当前时间已不可用', selectedTime);
    }
    return ok;
  },

  resetSelection: () => {
    set({ selectedServices: [], selectedTime: null });
  }
}));
