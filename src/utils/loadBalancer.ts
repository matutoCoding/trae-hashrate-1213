import { Station, Stylist, Appointment, QueueItem } from '@/types';

export interface LoadBalanceInfo {
  stationId: string;
  loadPercent: number;
  rank: number;
  suggestion: 'priority' | 'normal' | 'avoid';
}

export const calculateStationLoadBalance = (stations: Station[]): LoadBalanceInfo[] => {
  const result: LoadBalanceInfo[] = stations.map(station => {
    const loadPercent = Math.round((station.currentLoad / station.maxDailyLoad) * 100);
    let suggestion: LoadBalanceInfo['suggestion'] = 'normal';

    if (loadPercent < 30) suggestion = 'priority';
    else if (loadPercent >= 80) suggestion = 'avoid';

    return {
      stationId: station.id,
      loadPercent,
      rank: 0,
      suggestion
    };
  });

  result.sort((a, b) => a.loadPercent - b.loadPercent);
  result.forEach((r, idx) => r.rank = idx + 1);

  console.log('[LoadBalancer] 工位负载均衡分析:', result);
  return result;
};

export const dispatchQueueToStations = (
  queue: QueueItem[],
  stations: Station[],
  stylists: Stylist[]
): { queueItem: QueueItem; suggestedStationId: string }[] => {
  const loadInfo = calculateStationLoadBalance(stations);
  const freeStations = stations.filter(s => s.status === 'free');
  const waitingItems = queue.filter(q => q.status === 'waiting');

  const dispatches: { queueItem: QueueItem; suggestedStationId: string }[] = [];

  waitingItems.forEach(item => {
    const availableStations = freeStations.filter(s => !dispatches.find(d => d.suggestedStationId === s.id));
    if (availableStations.length === 0) return;

    const stationWithStylist = availableStations.find(s => s.stylistId);
    if (stationWithStylist) {
      dispatches.push({ queueItem: item, suggestedStationId: stationWithStylist.id });
      return;
    }

    const priorityStation = availableStations
      .map(s => {
        const info = loadInfo.find(l => l.stationId === s.id);
        return { station: s, info };
      })
      .filter(x => x.info?.suggestion === 'priority')
      .sort((a, b) => (a.info?.rank || 0) - (b.info?.rank || 0))[0];

    if (priorityStation) {
      dispatches.push({ queueItem: item, suggestedStationId: priorityStation.station.id });
    } else {
      const leastLoad = [...availableStations].sort((a, b) => a.currentLoad - b.currentLoad)[0];
      if (leastLoad) {
        dispatches.push({ queueItem: item, suggestedStationId: leastLoad.id });
      }
    }
  });

  console.log('[LoadBalancer] 队列分配建议:', dispatches.map(d => ({
    queue: d.queueItem.queueNumber,
    station: d.suggestedStationId
  })));

  return dispatches;
};

export const crossStationTransfer = (
  sourceStation: Station,
  targetStation: Station,
  appointment: Appointment
): { success: boolean; reason: string } => {
  if (targetStation.status !== 'free') {
    return { success: false, reason: '目标工位非空闲状态' };
  }

  const sourceLoad = sourceStation.currentLoad / sourceStation.maxDailyLoad;
  const targetLoad = targetStation.currentLoad / targetStation.maxDailyLoad;

  if (sourceLoad - targetLoad < 0.2) {
    return { success: false, reason: '负载差异不足20%，无需调剂' };
  }

  console.log('[LoadBalancer] 跨工位调剂建议:', {
    from: sourceStation.code,
    to: targetStation.code,
    appointmentId: appointment.id
  });

  return {
    success: true,
    reason: `从${sourceStation.name}调剂到${targetStation.name}，负载差${Math.round((sourceLoad - targetLoad) * 100)}%`
  };
};

export const getLeastLoadedStation = (stations: Station[]): Station | null => {
  const freeStations = stations.filter(s => s.status === 'free');
  if (freeStations.length === 0) return null;

  return freeStations.reduce((least, station) => {
    const leastLoad = least.currentLoad / least.maxDailyLoad;
    const stationLoad = station.currentLoad / station.maxDailyLoad;
    return stationLoad < leastLoad ? station : least;
  });
};

export const getBusiestStation = (stations: Station[]): Station | null => {
  const busyStations = stations.filter(s => s.status === 'busy');
  if (busyStations.length === 0) return null;

  return busyStations.reduce((busiest, station) => {
    const busiestLoad = busiest.currentLoad / busiest.maxDailyLoad;
    const stationLoad = station.currentLoad / station.maxDailyLoad;
    return stationLoad > busiestLoad ? station : busiest;
  });
};

export const getOverallLoadStats = (stations: Station[]) => {
  const totalLoad = stations.reduce((sum, s) => sum + s.currentLoad, 0);
  const totalCapacity = stations.reduce((sum, s) => sum + s.maxDailyLoad, 0);
  const freeCount = stations.filter(s => s.status === 'free').length;
  const busyCount = stations.filter(s => s.status === 'busy').length;
  const maintainCount = stations.filter(s => s.status === 'maintain').length;

  return {
    overallLoadPercent: totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0,
    totalLoad,
    totalCapacity,
    freeCount,
    busyCount,
    maintainCount,
    stationCount: stations.length,
    avgLoadPerStation: stations.length > 0 ? Math.round(totalLoad / stations.length) : 0
  };
};

export const generateQueueNumber = (prefix: string = 'A', count: number): string => {
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
};
