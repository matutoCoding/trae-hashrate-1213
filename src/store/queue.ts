import { create } from 'zustand';
import { QueueItem, Station } from '@/types';
import { useStylistStore } from './stylist';

const mockQueue: QueueItem[] = [
  {
    appointmentId: 'ap007',
    queueNumber: 'A004',
    customerName: '孙美玲',
    serviceNames: ['创意总监剪裁'],
    estimatedWait: 0,
    status: 'calling',
    stationId: 'st02',
    callCount: 2
  },
  {
    appointmentId: 'ap004',
    queueNumber: 'B001',
    customerName: '刘思琪',
    serviceNames: ['时尚造型烫', '挑染/挂耳染'],
    estimatedWait: 45,
    status: 'waiting',
    callCount: 0
  },
  {
    appointmentId: 'ap006',
    queueNumber: 'B002',
    customerName: '陈思远',
    serviceNames: ['精致洗剪吹', 'SPA养发洗护'],
    estimatedWait: 90,
    status: 'waiting',
    callCount: 0
  }
];

interface QueueStore {
  queue: QueueItem[];
  currentCalling: QueueItem | null;
  servicingItems: QueueItem[];
  completedCount: number;
  noShowCount: number;
  holdItems: QueueItem[];
  addToQueue: (item: QueueItem) => void;
  callNext: () => QueueItem | null;
  startServicing: (queueNumber: string, stationId: string) => void;
  completeServicing: (queueNumber: string) => void;
  recall: (queueNumber: string) => void;
  cancelCalling: () => void;
  holdCalling: (queueNumber: string) => void;
  requeueCalling: (queueNumber: string) => void;
  markNoShow: (queueNumber: string) => void;
  restoreHold: (queueNumber: string) => void;
  updateServicingStation: (appointmentId: string, newStationId: string) => boolean;
  getWaitingCount: () => number;
  getMyQueuePosition: (appointmentId: string) => number;
  getTodayStatsByStylist: () => Record<string, { waiting: number; calling: number; servicing: number; completed: number }>;
  getTodayStatsByStation: () => Record<string, { waiting: number; calling: number; servicing: number; completed: number; noShow: number }>;
}

const pickLeastLoadedFreeStation = (): Station | null => {
  const stylistStore = useStylistStore.getState();
  return stylistStore.getLeastLoadedFreeStation();
};

const releaseStationCalling = (stationId?: string) => {
  if (!stationId) return;
  const stylistStore = useStylistStore.getState();
  stylistStore.setStationCalling(stationId, null);
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  queue: [...mockQueue],
  currentCalling: mockQueue.find(q => q.status === 'calling') || null,
  servicingItems: [
    {
      appointmentId: 'ap001',
      queueNumber: 'A001',
      customerName: '李雨桐',
      serviceNames: ['创意总监剪裁', '蛋白矫正护理'],
      estimatedWait: 0,
      status: 'servicing',
      stationId: 'st01',
      callCount: 1
    },
    {
      appointmentId: 'ap003',
      queueNumber: 'A003',
      customerName: '王建国',
      serviceNames: ['精致洗剪吹'],
      estimatedWait: 0,
      status: 'servicing',
      stationId: 'st03',
      callCount: 1
    },
    {
      appointmentId: 'ap005',
      queueNumber: 'C001',
      customerName: '赵雅婷',
      serviceNames: ['蛋白矫正护理'],
      estimatedWait: 0,
      status: 'servicing',
      stationId: 'st08',
      callCount: 1
    }
  ],
  completedCount: 12,
  noShowCount: 1,
  holdItems: [],

  addToQueue: (item) => {
    const { queue } = get();
    set({ queue: [...queue, item] });
    console.log('[QueueStore] 加入队列:', item.queueNumber);
  },

  callNext: () => {
    const { queue, currentCalling } = get();
    const stylistStore = useStylistStore.getState();

    if (currentCalling?.stationId) {
      releaseStationCalling(currentCalling.stationId);
    }

    if (currentCalling) {
      const fallback: QueueItem = { ...currentCalling, status: 'hold' as const };
      set({
        holdItems: [...get().holdItems, fallback],
        queue: queue.map(q => q.appointmentId === currentCalling.appointmentId ? fallback : q)
      });
      console.log('[QueueStore] 上一位顾客转暂不服务:', currentCalling.queueNumber);
    }

    const waiting = get().queue.filter(q => q.status === 'waiting');
    if (waiting.length === 0) {
      set({ currentCalling: null });
      return null;
    }

    const station = pickLeastLoadedFreeStation();
    const next = waiting[0];

    if (station) {
      stylistStore.setStationCalling(station.id, next.appointmentId);
    }

    const called: QueueItem = {
      ...next,
      status: 'calling',
      stationId: station?.id,
      callCount: next.callCount + 1
    };

    set({
      queue: get().queue.map(q => q.appointmentId === next.appointmentId ? called : q),
      currentCalling: called
    });
    console.log('[QueueStore] 叫号:', called.queueNumber, '分配工位:', station?.code || '无空闲');
    return called;
  },

  startServicing: (queueNumber, stationId) => {
    const { queue, servicingItems } = get();
    const item = queue.find(q => q.queueNumber === queueNumber) ||
      get().currentCalling;
    if (!item) return;

    releaseStationCalling(stationId);

    const stylistStore = useStylistStore.getState();
    stylistStore.updateStationStatus(stationId, 'busy');
    stylistStore.incrementStationLoad(stationId);
    stylistStore.setStationAppointment(stationId, item.appointmentId);

    const servicing = { ...item, status: 'servicing' as const, stationId };
    set({
      queue: queue.filter(q => q.queueNumber !== queueNumber),
      servicingItems: [...servicingItems, servicing],
      currentCalling: get().currentCalling?.queueNumber === queueNumber ? null : get().currentCalling,
      holdItems: get().holdItems.filter(q => q.queueNumber !== queueNumber)
    });
    console.log('[QueueStore] 开始服务:', queueNumber, stationId);
  },

  completeServicing: (queueNumber) => {
    const { servicingItems } = get();
    const item = servicingItems.find(q => q.queueNumber === queueNumber);
    if (item?.stationId) {
      const stylistStore = useStylistStore.getState();
      stylistStore.updateStationStatus(item.stationId, 'free');
      stylistStore.setStationAppointment(item.stationId, null);
      stylistStore.decrementStationLoad(item.stationId);
    }
    const completed: QueueItem | undefined = servicingItems.find(q => q.queueNumber === queueNumber);
    set({
      servicingItems: servicingItems.filter(q => q.queueNumber !== queueNumber),
      queue: completed ? [...get().queue, { ...completed, status: 'completed' as const }] : get().queue,
      completedCount: get().completedCount + 1
    });
    console.log('[QueueStore] 服务完成:', queueNumber);
  },

  recall: (queueNumber) => {
    const { queue, currentCalling, holdItems } = get();
    const stylistStore = useStylistStore.getState();

    if (currentCalling?.stationId && currentCalling.queueNumber !== queueNumber) {
      releaseStationCalling(currentCalling.stationId);
      const oldHold: QueueItem = { ...currentCalling, status: 'hold' as const };
      set({
        holdItems: [...holdItems, oldHold],
        queue: queue.map(q => q.appointmentId === currentCalling.appointmentId ? oldHold : q)
      });
    }

    const item = queue.find(q => q.queueNumber === queueNumber) ||
      holdItems.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    let station = item.stationId;
    if (!station) {
      const freeStation = pickLeastLoadedFreeStation();
      if (freeStation) {
        station = freeStation.id;
        stylistStore.setStationCalling(freeStation.id, item.appointmentId);
      }
    } else {
      stylistStore.setStationCalling(station, item.appointmentId);
    }

    const recalled: QueueItem = { ...item, status: 'calling' as const, stationId: station, callCount: item.callCount + 1 };
    set({
      queue: get().queue.map(q => q.queueNumber === queueNumber ? recalled : q),
      holdItems: get().holdItems.filter(q => q.queueNumber !== queueNumber),
      currentCalling: recalled
    });
    console.log('[QueueStore] 重新叫号:', queueNumber, station);
  },

  cancelCalling: () => {
    const { currentCalling, queue } = get();
    if (!currentCalling) return;

    releaseStationCalling(currentCalling.stationId);

    const reverted = { ...currentCalling, status: 'waiting' as const };
    set({
      queue: queue.map(q => q.appointmentId === currentCalling.appointmentId ? reverted : q),
      currentCalling: null
    });
    console.log('[QueueStore] 取消叫号:', currentCalling.queueNumber);
  },

  holdCalling: (queueNumber) => {
    const { currentCalling, queue } = get();
    const item = currentCalling?.queueNumber === queueNumber
      ? currentCalling
      : queue.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    releaseStationCalling(item.stationId);

    const held: QueueItem = { ...item, status: 'hold' as const };
    set({
      queue: queue.map(q => q.queueNumber === queueNumber ? held : q),
      holdItems: [...get().holdItems.filter(q => q.queueNumber !== queueNumber), held],
      currentCalling: currentCalling?.queueNumber === queueNumber ? null : currentCalling
    });
    console.log('[QueueStore] 暂不服务:', queueNumber);
  },

  requeueCalling: (queueNumber) => {
    const { currentCalling, queue, holdItems } = get();
    const item = currentCalling?.queueNumber === queueNumber
      ? currentCalling
      : holdItems.find(q => q.queueNumber === queueNumber) ||
        queue.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    releaseStationCalling(item.stationId);

    const requeued: QueueItem = { ...item, status: 'waiting' as const, stationId: undefined, estimatedWait: 15 };
    set({
      queue: queue.filter(q => q.queueNumber !== queueNumber).concat(requeued),
      holdItems: holdItems.filter(q => q.queueNumber !== queueNumber),
      currentCalling: currentCalling?.queueNumber === queueNumber ? null : currentCalling
    });
    console.log('[QueueStore] 重新排队:', queueNumber);
  },

  markNoShow: (queueNumber) => {
    const { currentCalling, queue, holdItems } = get();
    const item = currentCalling?.queueNumber === queueNumber
      ? currentCalling
      : holdItems.find(q => q.queueNumber === queueNumber) ||
        queue.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    releaseStationCalling(item.stationId);

    const noShow: QueueItem = { ...item, status: 'noShow' as const };
    set({
      queue: queue.map(q => q.queueNumber === queueNumber ? noShow : q),
      holdItems: holdItems.filter(q => q.queueNumber !== queueNumber),
      currentCalling: currentCalling?.queueNumber === queueNumber ? null : currentCalling,
      noShowCount: get().noShowCount + 1
    });
    console.log('[QueueStore] 标记未到店:', queueNumber);
  },

  restoreHold: (queueNumber) => {
    const { holdItems, queue } = get();
    const item = holdItems.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    const restored: QueueItem = { ...item, status: 'waiting' as const };
    set({
      queue: queue.map(q => q.queueNumber === queueNumber ? restored : q),
      holdItems: holdItems.filter(q => q.queueNumber !== queueNumber)
    });
    console.log('[QueueStore] 暂不服务恢复排队:', queueNumber);
  },

  updateServicingStation: (appointmentId, newStationId) => {
    const { servicingItems } = get();
    const item = servicingItems.find(q => q.appointmentId === appointmentId);
    if (!item || !item.stationId) return false;

    const stylistStore = useStylistStore.getState();
    const oldStationId = item.stationId;

    stylistStore.setStationAppointment(oldStationId, null);
    stylistStore.decrementStationLoad(oldStationId);
    stylistStore.updateStationStatus(oldStationId, 'free');

    stylistStore.setStationAppointment(newStationId, appointmentId);
    stylistStore.incrementStationLoad(newStationId);
    stylistStore.updateStationStatus(newStationId, 'busy');

    set({
      servicingItems: servicingItems.map(q =>
        q.appointmentId === appointmentId ? { ...q, stationId: newStationId } : q
      )
    });
    console.log('[QueueStore] 调剂工位:', appointmentId, oldStationId, '→', newStationId);
    return true;
  },

  getWaitingCount: () => {
    return get().queue.filter(q => q.status === 'waiting').length;
  },

  getMyQueuePosition: (appointmentId) => {
    const { queue } = get();
    const waiting = queue.filter(q => q.status === 'waiting');
    const idx = waiting.findIndex(q => q.appointmentId === appointmentId);
    return idx >= 0 ? idx + 1 : 0;
  },

  getTodayStatsByStylist: () => {
    const { queue, servicingItems, completedCount } = get();
    const { stations, stylists } = useStylistStore.getState();
    const stats: Record<string, { waiting: number; calling: number; servicing: number; completed: number }> = {};
    stylists.forEach(s => {
      stats[s.id] = { waiting: 0, calling: 0, servicing: 0, completed: 0 };
    });
    const aptIdToStylist: Record<string, string> = {};
    stations.forEach(st => {
      if (st.stylistId && st.currentAppointmentId) {
        aptIdToStylist[st.currentAppointmentId] = st.stylistId;
      }
      if (st.stylistId && st.callingAppointmentId) {
        aptIdToStylist[st.callingAppointmentId] = st.stylistId;
      }
    });
    queue.forEach(q => {
      const sid = aptIdToStylist[q.appointmentId];
      if (!sid) return;
      if (q.status === 'waiting') stats[sid].waiting++;
      if (q.status === 'calling') stats[sid].calling++;
    });
    servicingItems.forEach(q => {
      const sid = aptIdToStylist[q.appointmentId];
      if (sid) stats[sid].servicing++;
    });
    return stats;
  },

  getTodayStatsByStation: () => {
    const { queue, servicingItems } = get();
    const { stations } = useStylistStore.getState();
    const stats: Record<string, { waiting: number; calling: number; servicing: number; completed: number; noShow: number }> = {};
    stations.forEach(st => {
      stats[st.id] = { waiting: 0, calling: 0, servicing: 0, completed: 0, noShow: 0 };
    });
    queue.forEach(q => {
      if (!q.stationId) return;
      const s = stats[q.stationId];
      if (!s) return;
      if (q.status === 'waiting') s.waiting++;
      if (q.status === 'calling') s.calling++;
      if (q.status === 'noShow') s.noShow++;
      if (q.status === 'completed') s.completed++;
    });
    servicingItems.forEach(q => {
      if (q.stationId && stats[q.stationId]) {
        stats[q.stationId].servicing++;
      }
    });
    return stats;
  }
}));
