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

  getAvailableStylists: () => {
    return get().stylists.filter(s => s.status === 'onDuty');
  },

  getFreeStations: () => {
    return get().stations.filter(s => s.status === 'free');
  }
}));
