import { create } from 'zustand';
import { Appointment, Service, Stylist, Station, TimeSlot } from '@/types';
import { mockAppointments } from '@/data/mockAppointments';
import { mockServices } from '@/data/mockServices';
import { generateTimeSlots } from '@/utils/timeSlot';

type TimePeriod = 'morning' | 'afternoon' | 'evening';

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
  updateAppointmentStation: (id: string, stationId: string | null, stylistId?: string | null) => void;
  getCustomerAppointments: (customerId: string) => Appointment[];
  getTodayAppointments: () => Appointment[];
  resetSelection: () => void;
  validateSelectedTime: (stylists: Stylist[], stations: Station[]) => boolean;
  getServiceNames: (serviceIds: string[]) => string[];
  getStatsByStylist: () => Record<string, {
    total: number; waiting: number; calling: number; servicing: number;
    completed: number; noShow: number; cancelled: number; revenue: number;
  }>;
  getStatsByStation: () => Record<string, {
    total: number; waiting: number; calling: number; servicing: number;
    completed: number; noShow: number; cancelled: number; revenue: number;
  }>;
  getStatsByPeriod: () => Record<TimePeriod, {
    appointments: number; completed: number; revenue: number;
  }>;
  getTimePeriod: (startTime: string) => TimePeriod;
  getAppointmentsByStation: (stationId: string) => Appointment[];
  getAppointmentsByStylist: (stylistId: string) => Appointment[];
}

const getServiceNameById = (id: string): string => {
  const s = mockServices.find(sv => sv.id === id);
  return s ? s.name : '未知服务';
};

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [...mockAppointments],
  selectedServices: [],
  selectedDate: '2026-06-21',
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

  updateAppointmentStation: (id, stationId, stylistId) => {
    const { appointments } = get();
    set({
      appointments: appointments.map(a => {
        if (a.id !== id) return a;
        const updated: Appointment = { ...a, stationId };
        if (stylistId !== undefined) updated.stylistId = stylistId;
        return updated;
      })
    });
    console.log('[AppointmentStore] 更新工位:', id, '→', stationId);
  },

  getCustomerAppointments: (customerId) => {
    return get().appointments.filter(a => a.customerId === customerId);
  },

  getTodayAppointments: () => {
    return get().appointments.filter(a => a.appointmentDate === '2026-06-21');
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

  getServiceNames: (serviceIds) => {
    return serviceIds.map(id => getServiceNameById(id));
  },

  getStatsByStylist: () => {
    const today = get().getTodayAppointments();
    const stats: Record<string, any> = {};

    today.forEach(a => {
      const sid = a.stylistId || 'unassigned';
      if (!stats[sid]) {
        stats[sid] = {
          total: 0, waiting: 0, calling: 0, servicing: 0,
          completed: 0, noShow: 0, cancelled: 0, revenue: 0
        };
      }
      stats[sid].total++;
      const status = a.status;
      if (status === 'pending' || status === 'confirmed' || status === 'arrived') stats[sid].waiting++;
      if (status === 'servicing') stats[sid].servicing++;
      if (status === 'completed') {
        stats[sid].completed++;
        stats[sid].revenue += a.discountPrice || a.totalPrice;
      }
      if (status === 'noShow') stats[sid].noShow++;
      if (status === 'cancelled') stats[sid].cancelled++;
    });

    return stats;
  },

  getStatsByStation: () => {
    const today = get().getTodayAppointments();
    const stats: Record<string, any> = {};

    today.forEach(a => {
      const sid = a.stationId || 'unassigned';
      if (!stats[sid]) {
        stats[sid] = {
          total: 0, waiting: 0, calling: 0, servicing: 0,
          completed: 0, noShow: 0, cancelled: 0, revenue: 0
        };
      }
      stats[sid].total++;
      const status = a.status;
      if (status === 'pending' || status === 'confirmed' || status === 'arrived') stats[sid].waiting++;
      if (status === 'servicing') stats[sid].servicing++;
      if (status === 'completed') {
        stats[sid].completed++;
        stats[sid].revenue += a.discountPrice || a.totalPrice;
      }
      if (status === 'noShow') stats[sid].noShow++;
      if (status === 'cancelled') stats[sid].cancelled++;
    });

    return stats;
  },

  getTimePeriod: (startTime) => {
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  },

  getStatsByPeriod: () => {
    const today = get().getTodayAppointments();
    const periods: Record<TimePeriod, any> = {
      morning: { appointments: 0, completed: 0, revenue: 0 },
      afternoon: { appointments: 0, completed: 0, revenue: 0 },
      evening: { appointments: 0, completed: 0, revenue: 0 }
    };

    today.forEach(a => {
      const p = get().getTimePeriod(a.startTime);
      periods[p].appointments++;
      if (a.status === 'completed') {
        periods[p].completed++;
        periods[p].revenue += a.discountPrice || a.totalPrice;
      }
    });

    return periods;
  },

  getAppointmentsByStation: (stationId) => {
    return get().getTodayAppointments().filter(a => a.stationId === stationId);
  },

  getAppointmentsByStylist: (stylistId) => {
    return get().getTodayAppointments().filter(a => a.stylistId === stylistId);
  },

  resetSelection: () => {
    set({ selectedServices: [], selectedTime: null });
  }
}));
