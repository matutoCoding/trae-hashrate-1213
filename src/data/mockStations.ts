import { Station } from '@/types';

export const mockStations: Station[] = [
  {
    id: 'st01',
    name: 'Vip 工位 1',
    code: 'V1',
    status: 'busy',
    currentLoad: 4,
    maxDailyLoad: 12,
    stylistId: 's001',
    currentAppointmentId: 'ap001'
  },
  {
    id: 'st02',
    name: 'Vip 工位 2',
    code: 'V2',
    status: 'free',
    currentLoad: 2,
    maxDailyLoad: 12,
    stylistId: 's002',
    currentAppointmentId: null
  },
  {
    id: 'st03',
    name: '标准工位 1',
    code: 'A1',
    status: 'busy',
    currentLoad: 6,
    maxDailyLoad: 15,
    stylistId: 's003',
    currentAppointmentId: 'ap003'
  },
  {
    id: 'st04',
    name: '标准工位 2',
    code: 'A2',
    status: 'free',
    currentLoad: 3,
    maxDailyLoad: 15,
    stylistId: 's004',
    currentAppointmentId: null
  },
  {
    id: 'st05',
    name: '标准工位 3',
    code: 'A3',
    status: 'free',
    currentLoad: 1,
    maxDailyLoad: 15,
    stylistId: 's005',
    currentAppointmentId: null
  },
  {
    id: 'st06',
    name: '快剪工位 1',
    code: 'B1',
    status: 'free',
    currentLoad: 0,
    maxDailyLoad: 20,
    stylistId: null,
    currentAppointmentId: null
  },
  {
    id: 'st07',
    name: '快剪工位 2',
    code: 'B2',
    status: 'maintain',
    currentLoad: 0,
    maxDailyLoad: 20,
    stylistId: null,
    currentAppointmentId: null
  },
  {
    id: 'st08',
    name: '染烫专区',
    code: 'C1',
    status: 'busy',
    currentLoad: 5,
    maxDailyLoad: 10,
    stylistId: null,
    currentAppointmentId: 'ap005'
  }
];

export const getStationById = (id: string): Station | undefined => {
  return mockStations.find(s => s.id === id);
};

export const getFreeStations = (): Station[] => {
  return mockStations.filter(s => s.status === 'free');
};

export const getStationByStylistId = (stylistId: string): Station | undefined => {
  return mockStations.find(s => s.stylistId === stylistId);
};

export const getStationLoadPercent = (station: Station): number => {
  return Math.round((station.currentLoad / station.maxDailyLoad) * 100);
};
