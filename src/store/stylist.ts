import { create } from 'zustand';
import { Stylist, Station } from '@/types';
import { mockStylists } from '@/data/mockStylists';
import { mockStations } from '@/data/mockStations';

interface StylistStore {
  stylists: Stylist[];
  stations: Station[];
  updateStylistStatus: (id: string, status: Stylist['status']) => void;
  updateStationStatus: (id: string, status: Station['status']) => void;
  bindStylistToStation: (stylistId: string, stationId: string) => void;
  unbindStylistStation: (stylistId: string) => void;
  addStylist: (stylist: Stylist) => void;
  updateStylist: (id: string, patch: Partial<Stylist>) => void;
  incrementStationLoad: (stationId: string) => void;
  decrementStationLoad: (stationId: string) => void;
  setStationAppointment: (stationId: string, appointmentId: string | null) => void;
  setStationCalling: (stationId: string, appointmentId: string | null) => void;
  executeCrossTransfer: (fromStationId: string, toStationId: string) => boolean;
  getLeastLoadedFreeStation: () => Station | null;
  getAvailableStylists: () => Stylist[];
  getFreeStations: () => Station[];
}

export const useStylistStore = create<StylistStore>((set, get) => ({
  stylists: [...mockStylists],
  stations: [...mockStations],

  updateStylistStatus: (id, status) => {
    const { stylists } = get();
    set({
      stylists: stylists.map(s => s.id === id ? { ...s, status } : s)
    });
    console.log('[StylistStore] 更新发型师状态:', id, status);
  },

  updateStationStatus: (id, status) => {
    const { stations } = get();
    set({
      stations: stations.map(s => s.id === id ? { ...s, status } : s)
    });
    console.log('[StylistStore] 更新工位状态:', id, status);
  },

  bindStylistToStation: (stylistId, stationId) => {
    const { stylists, stations } = get();
    set({
      stylists: stylists.map(s => s.id === stylistId ? { ...s, stationId } : s),
      stations: stations.map(s => s.id === stationId ? { ...s, stylistId } : s)
    });
    console.log('[StylistStore] 绑定:', stylistId, stationId);
  },

  unbindStylistStation: (stylistId) => {
    const { stylists, stations } = get();
    const stylist = stylists.find(s => s.id === stylistId);
    if (!stylist?.stationId) return;

    set({
      stylists: stylists.map(s => s.id === stylistId ? { ...s, stationId: null } : s),
      stations: stations.map(s => s.id === stylist.stationId ? { ...s, stylistId: null } : s)
    });
    console.log('[StylistStore] 解绑:', stylistId);
  },

  addStylist: (stylist) => {
    const { stylists } = get();
    set({ stylists: [...stylists, stylist] });
    console.log('[StylistStore] 新增发型师:', stylist.name);
  },

  updateStylist: (id, patch) => {
    const { stylists } = get();
    set({
      stylists: stylists.map(s => s.id === id ? { ...s, ...patch } : s)
    });
    console.log('[StylistStore] 更新发型师:', id, patch);
  },

  incrementStationLoad: (stationId) => {
    const { stations } = get();
    set({
      stations: stations.map(s =>
        s.id === stationId
          ? { ...s, currentLoad: Math.min(s.maxDailyLoad, s.currentLoad + 1) }
          : s
      )
    });
  },

  decrementStationLoad: (stationId) => {
    const { stations } = get();
    set({
      stations: stations.map(s =>
        s.id === stationId
          ? { ...s, currentLoad: Math.max(0, s.currentLoad - 1) }
          : s
      )
    });
  },

  setStationAppointment: (stationId, appointmentId) => {
    const { stations } = get();
    set({
      stations: stations.map(s =>
        s.id === stationId ? { ...s, currentAppointmentId: appointmentId } : s
      )
    });
  },

  setStationCalling: (stationId, appointmentId) => {
    const { stations } = get();
    set({
      stations: stations.map(s =>
        s.id === stationId ? { ...s, callingAppointmentId: appointmentId } : s
      )
    });
    console.log('[StylistStore] 设置叫号占用:', stationId, appointmentId || '释放');
  },

  executeCrossTransfer: (fromStationId, toStationId) => {
    const { stations } = get();
    const from = stations.find(s => s.id === fromStationId);
    const to = stations.find(s => s.id === toStationId);
    if (!from || !to) return false;

    let movingAptId = from.currentAppointmentId;
    let fromLoadAfter = from.currentLoad - 1;
    let toLoadAfter = to.currentLoad + 1;

    if (!movingAptId && from.callingAppointmentId) {
      movingAptId = from.callingAppointmentId;
      fromLoadAfter = from.currentLoad;
      toLoadAfter = to.currentLoad;
    }

    if (!movingAptId || from.currentLoad < 1) return false;
    if (to.status !== 'free' || to.callingAppointmentId) return false;

    try {
      const { useQueueStore } = require('./queue');
      useQueueStore.getState().updateServicingStation(movingAptId, toStationId);
    } catch (e) {
      set({
        stations: stations.map(s => {
          if (s.id === fromStationId) {
            return {
              ...s,
              currentLoad: Math.max(0, fromLoadAfter),
              currentAppointmentId: null,
              callingAppointmentId: null,
              status: fromLoadAfter > 0 ? 'busy' : 'free' as Station['status']
            };
          }
          if (s.id === toStationId) {
            return {
              ...s,
              currentLoad: Math.min(s.maxDailyLoad, toLoadAfter),
              currentAppointmentId: movingAptId,
              status: 'busy' as Station['status']
            };
          }
          return s;
        })
      });
    }

    console.log('[StylistStore] 跨工位调剂:', fromStationId, '→', toStationId);
    return true;
  },

  getLeastLoadedFreeStation: () => {
    const { stations } = get();
    const free = stations.filter(s => s.status === 'free' && !s.callingAppointmentId);
    if (free.length === 0) return null;
    return free.reduce((least, s) => {
      const leastPct = least.currentLoad / least.maxDailyLoad;
      const sPct = s.currentLoad / s.maxDailyLoad;
      return sPct < leastPct ? s : least;
    });
  },

  getAvailableStylists: () => {
    return get().stylists.filter(s => s.status === 'onDuty');
  },

  getFreeStations: () => {
    return get().stations.filter(s => s.status === 'free');
  }
}));
