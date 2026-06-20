import { create } from 'zustand';
import { QueueItem, Station } from '@/types';
import { useStylistStore } from './stylist';
import { useAppointmentStore } from './appointment';

const pickLeastLoadedFreeStation = (): Station | null => {
  const stylistStore = useStylistStore.getState();
  return stylistStore.getLeastLoadedFreeStation();
};

const releaseStationCalling = (stationId?: string) => {
  if (!stationId) return;
  const stylistStore = useStylistStore.getState();
  stylistStore.setStationCalling(stationId, null);
};

const buildQueueItemFromAppointment = (apt: any, status: QueueItem['status'], stationId?: string, callCount = 0): QueueItem => {
  const aptStore = useAppointmentStore.getState();
  const serviceNames = aptStore.getServiceNames(apt.serviceIds);
  return {
    appointmentId: apt.id,
    queueNumber: apt.queueNumber || apt.orderNo.slice(-4),
    customerName: apt.customerName,
    serviceNames,
    estimatedWait: 0,
    status,
    stationId: stationId || apt.stationId || undefined,
    callCount
  };
};

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
  syncFromAppointments: () => void;
}

const initQueueFromAppointments = (): QueueItem[] => {
  const { getTodayAppointments } = useAppointmentStore.getState();
  const today = getTodayAppointments();
  const items: QueueItem[] = [];

  today.forEach(apt => {
    if (apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'arrived') {
      items.push(buildQueueItemFromAppointment(apt, 'waiting'));
    }
  });

  return items;
};

const initCurrentCalling = (): QueueItem | null => {
  const { stations } = useStylistStore.getState();
  const callingStation = stations.find(s => s.callingAppointmentId);
  if (!callingStation) return null;

  const { getTodayAppointments, getServiceNames } = useAppointmentStore.getState();
  const apt = getTodayAppointments().find(a => a.id === callingStation.callingAppointmentId);
  if (!apt) return null;

  return {
    appointmentId: apt.id,
    queueNumber: apt.queueNumber || apt.orderNo.slice(-4),
    customerName: apt.customerName,
    serviceNames: getServiceNames(apt.serviceIds),
    estimatedWait: 0,
    status: 'calling',
    stationId: callingStation.id,
    callCount: 2
  };
};

const initServicingFromAppointments = (): QueueItem[] => {
  const { getTodayAppointments, getServiceNames } = useAppointmentStore.getState();
  const today = getTodayAppointments();
  const items: QueueItem[] = [];

  today.forEach(apt => {
    if (apt.status === 'servicing' && apt.stationId) {
      items.push({
        appointmentId: apt.id,
        queueNumber: apt.queueNumber || apt.orderNo.slice(-4),
        customerName: apt.customerName,
        serviceNames: getServiceNames(apt.serviceIds),
        estimatedWait: 0,
        status: 'servicing',
        stationId: apt.stationId || undefined,
        callCount: 1
      });
    }
  });

  return items;
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  queue: initQueueFromAppointments(),
  currentCalling: initCurrentCalling(),
  servicingItems: initServicingFromAppointments(),
  completedCount: 5,
  noShowCount: 1,
  holdItems: [],

  syncFromAppointments: () => {
    set({
      queue: initQueueFromAppointments(),
      currentCalling: initCurrentCalling(),
      servicingItems: initServicingFromAppointments()
    });
  },

  addToQueue: (item) => {
    const { queue } = get();
    set({ queue: [...queue, item] });
    console.log('[QueueStore] 加入队列:', item.queueNumber);
  },

  callNext: () => {
    const { queue, currentCalling, holdItems } = get();
    const stylistStore = useStylistStore.getState();
    const aptStore = useAppointmentStore.getState();

    if (currentCalling?.stationId) {
      releaseStationCalling(currentCalling.stationId);
    }

    if (currentCalling) {
      const fallback: QueueItem = { ...currentCalling, status: 'hold' as const };
      aptStore.updateAppointmentStatus(currentCalling.appointmentId, 'confirmed');
      set({
        holdItems: [...holdItems, fallback],
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
    const apt = aptStore.getTodayAppointments().find(a => a.id === next.appointmentId);

    if (station && apt) {
      stylistStore.setStationCalling(station.id, next.appointmentId);
      aptStore.updateAppointmentStation(apt.id, station.id, apt.stylistId);
    }

    const called: QueueItem = {
      ...next,
      status: 'calling',
      stationId: station?.id,
      callCount: next.callCount + 1
    };

    if (apt) {
      aptStore.updateAppointmentStatus(apt.id, 'arrived');
    }

    set({
      queue: get().queue.map(q => q.appointmentId === next.appointmentId ? called : q),
      currentCalling: called
    });
    console.log('[QueueStore] 叫号:', called.queueNumber, '分配工位:', station?.code || '无空闲');
    return called;
  },

  startServicing: (queueNumber, stationId) => {
    const { queue, servicingItems, currentCalling } = get();
    const item = queue.find(q => q.queueNumber === queueNumber) || currentCalling;
    if (!item) return;

    releaseStationCalling(stationId);

    const stylistStore = useStylistStore.getState();
    stylistStore.updateStationStatus(stationId, 'busy');
    stylistStore.incrementStationLoad(stationId);
    stylistStore.setStationAppointment(stationId, item.appointmentId);

    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStatus(item.appointmentId, 'servicing');
    aptStore.updateAppointmentStation(item.appointmentId, stationId);

    const servicing = { ...item, status: 'servicing' as const, stationId };
    set({
      queue: queue.filter(q => q.queueNumber !== queueNumber),
      servicingItems: [...servicingItems, servicing],
      currentCalling: currentCalling?.queueNumber === queueNumber ? null : currentCalling,
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

    const aptStore = useAppointmentStore.getState();
    if (item) {
      aptStore.updateAppointmentStatus(item.appointmentId, 'completed');
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
    const aptStore = useAppointmentStore.getState();

    if (currentCalling?.stationId && currentCalling.queueNumber !== queueNumber) {
      releaseStationCalling(currentCalling.stationId);
      const oldHold: QueueItem = { ...currentCalling, status: 'hold' as const };
      aptStore.updateAppointmentStatus(currentCalling.appointmentId, 'confirmed');
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
        aptStore.updateAppointmentStation(item.appointmentId, station);
      }
    } else {
      stylistStore.setStationCalling(station, item.appointmentId);
    }

    aptStore.updateAppointmentStatus(item.appointmentId, 'arrived');

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

    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStatus(currentCalling.appointmentId, 'confirmed');

    const reverted = { ...currentCalling, status: 'waiting' as const };
    set({
      queue: queue.map(q => q.appointmentId === currentCalling.appointmentId ? reverted : q),
      currentCalling: null
    });
    console.log('[QueueStore] 取消叫号:', currentCalling.queueNumber);
  },

  holdCalling: (queueNumber) => {
    const { currentCalling, queue, holdItems } = get();
    const item = currentCalling?.queueNumber === queueNumber
      ? currentCalling
      : queue.find(q => q.queueNumber === queueNumber);
    if (!item) return;

    releaseStationCalling(item.stationId);

    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStatus(item.appointmentId, 'confirmed');

    const held: QueueItem = { ...item, status: 'hold' as const };
    set({
      queue: queue.map(q => q.queueNumber === queueNumber ? held : q),
      holdItems: [...holdItems.filter(q => q.queueNumber !== queueNumber), held],
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

    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStatus(item.appointmentId, 'confirmed');

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

    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStatus(item.appointmentId, 'noShow');

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

    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStation(appointmentId, newStationId);

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
