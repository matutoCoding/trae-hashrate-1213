import { create } from 'zustand';
import { QueueItem } from '@/types';

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
  getWaitingCount: () => number;
  getMyQueuePosition: (appointmentId: string) => number;
}

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
    const { queue } = get();
    const waiting = queue.filter(q => q.status === 'waiting');
    if (waiting.length === 0) return null;

    const next = waiting[0];
    const called = { ...next, status: 'calling' as const, callCount: next.callCount + 1 };

    set({
      queue: queue.map(q => q.appointmentId === next.appointmentId ? called : q),
      currentCalling: called
    });
    console.log('[QueueStore] 叫号:', called.queueNumber);
    return called;
  },

  startServicing: (queueNumber, stationId) => {
    const { queue, servicingItems } = get();
    const item = queue.find(q => q.queueNumber === queueNumber);
    if (!item) return;

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
    set({
      servicingItems: servicingItems.filter(q => q.queueNumber !== queueNumber)
    });
    console.log('[QueueStore] 服务完成:', queueNumber);
  },

  recall: (queueNumber) => {
    const { queue } = get();
    set({
      queue: queue.map(q =>
        q.queueNumber === queueNumber
          ? { ...q, callCount: q.callCount + 1, status: 'calling' as const }
          : q
      )
    });
    console.log('[QueueStore] 重新叫号:', queueNumber);
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
