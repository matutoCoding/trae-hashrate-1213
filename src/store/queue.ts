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
  addToQueue: (item: QueueItem) => void;
  callNext: () => QueueItem | null;
  startServicing: (queueNumber: string, stationId: string) => void;
  completeServicing: (queueNumber: string) => void;
  recall: (queueNumber: string) => void;
  cancelCalling: () => void;
  updateServicingStation: (appointmentId: string, newStationId: string) => boolean;
  getWaitingCount: () => number;
  getMyQueuePosition: (appointmentId: string) => number;
}

const pickLeastLoadedFreeStation = (): Station | null => {
  const stylistStore = useStylistStore.getState();
  return stylistStore.getLeastLoadedFreeStation();
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

  addToQueue: (item) => {
    const { queue } = get();
    set({ queue: [...queue, item] });
    console.log('[QueueStore] 加入队列:', item.queueNumber);
  },

  callNext: () => {
    const { queue, currentCalling } = get();
    const stylistStore = useStylistStore.getState();

    if (currentCalling?.stationId) {
      stylistStore.setStationCalling(currentCalling.stationId, null);
    }

    const waiting = queue.filter(q => q.status === 'waiting');
    if (waiting.length === 0) return null;

    const station = stylistStore.getLeastLoadedFreeStation();
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
      queue: queue.map(q => q.appointmentId === next.appointmentId ? called : q),
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

    const stylistStore = useStylistStore.getState();
    stylistStore.setStationCalling(stationId, null);
    stylistStore.updateStationStatus(stationId, 'busy');
    stylistStore.incrementStationLoad(stationId);
    stylistStore.setStationAppointment(stationId, item.appointmentId);

    const servicing = { ...item, status: 'servicing' as const, stationId };
    set({
      queue: queue.filter(q => q.queueNumber !== queueNumber),
      servicingItems: [...servicingItems, servicing],
      currentCalling: null
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
    set({
      servicingItems: servicingItems.filter(q => q.queueNumber !== queueNumber)
    });
    console.log('[QueueStore] 服务完成:', queueNumber);
  },

  recall: (queueNumber) => {
    const { queue, currentCalling } = get();
    const stylistStore = useStylistStore.getState();

    if (currentCalling?.stationId && currentCalling.queueNumber !== queueNumber) {
      stylistStore.setStationCalling(currentCalling.stationId, null);
    }

    const item = queue.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    let station = item.stationId;
    if (!station) {
      const freeStation = stylistStore.getLeastLoadedFreeStation();
      if (freeStation) {
        station = freeStation.id;
        stylistStore.setStationCalling(freeStation.id, item.appointmentId);
      }
    }

    const recalled = { ...item, status: 'calling' as const, stationId: station, callCount: item.callCount + 1 };
    set({
      queue: queue.map(q => q.queueNumber === queueNumber ? recalled : q),
      currentCalling: recalled
    });
    console.log('[QueueStore] 重新叫号:', queueNumber, station);
  },

  cancelCalling: () => {
    const { currentCalling, queue } = get();
    if (!currentCalling) return;

    const stylistStore = useStylistStore.getState();
    if (currentCalling.stationId) {
      stylistStore.setStationCalling(currentCalling.stationId, null);
    }

    const reverted = { ...currentCalling, status: 'waiting' as const };
    set({
      queue: queue.map(q => q.appointmentId === currentCalling.appointmentId ? reverted : q),
      currentCalling: null
    });
    console.log('[QueueStore] 取消叫号:', currentCalling.queueNumber);
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
  }
}));
