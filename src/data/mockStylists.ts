import { Stylist } from '@/types';

export const mockStylists: Stylist[] = [
  {
    id: 's001',
    name: '林慕风',
    avatar: 'https://picsum.photos/id/64/200/200',
    title: '首席造型总监',
    level: 'director',
    skills: ['剪发', '烫发', '染发', '造型', '接发'],
    rating: 4.98,
    todayLoad: 4,
    weekLoad: 28,
    stationId: 'st01',
    status: 'onDuty',
    workSchedule: {
      workDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '21:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    }
  },
  {
    id: 's002',
    name: '苏婉清',
    avatar: 'https://picsum.photos/id/91/200/200',
    title: '资深造型师',
    level: 'expert',
    skills: ['剪发', '染发', '造型', '护发'],
    rating: 4.92,
    todayLoad: 2,
    weekLoad: 20,
    stationId: 'st02',
    status: 'onDuty',
    workSchedule: {
      workDays: [1, 2, 3, 4, 5, 6, 0],
      startTime: '10:00',
      endTime: '22:00',
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  },
  {
    id: 's003',
    name: '陈俊豪',
    avatar: 'https://picsum.photos/id/177/200/200',
    title: '高级造型师',
    level: 'senior',
    skills: ['剪发', '烫发', '造型'],
    rating: 4.85,
    todayLoad: 6,
    weekLoad: 32,
    stationId: 'st03',
    status: 'onDuty',
    workSchedule: {
      workDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '20:00',
      breakStart: '12:30',
      breakEnd: '13:30'
    }
  },
  {
    id: 's004',
    name: '王思琪',
    avatar: 'https://picsum.photos/id/338/200/200',
    title: '高级造型师',
    level: 'senior',
    skills: ['剪发', '染发', '护发', '造型'],
    rating: 4.88,
    todayLoad: 3,
    weekLoad: 18,
    stationId: 'st04',
    status: 'break',
    workSchedule: {
      workDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:30',
      endTime: '21:30',
      breakStart: '12:00',
      breakEnd: '13:00'
    }
  },
  {
    id: 's005',
    name: '赵云飞',
    avatar: 'https://picsum.photos/id/1027/200/200',
    title: '造型师',
    level: 'junior',
    skills: ['剪发', '洗发', '护发'],
    rating: 4.75,
    todayLoad: 1,
    weekLoad: 12,
    stationId: 'st05',
    status: 'onDuty',
    workSchedule: {
      workDays: [1, 2, 3, 4, 5, 6, 0],
      startTime: '09:00',
      endTime: '20:00',
      breakStart: '11:30',
      breakEnd: '12:30'
    }
  },
  {
    id: 's006',
    name: '周雅琳',
    avatar: 'https://picsum.photos/id/1027/200/200?random=2',
    title: '造型师',
    level: 'junior',
    skills: ['剪发', '洗发', '造型'],
    rating: 4.70,
    todayLoad: 0,
    weekLoad: 8,
    stationId: null,
    status: 'offDuty',
    workSchedule: {
      workDays: [2, 3, 4, 5, 6, 0],
      startTime: '10:00',
      endTime: '20:00',
      breakStart: '14:00',
      breakEnd: '15:00'
    }
  }
];

export const getStylistById = (id: string): Stylist | undefined => {
  return mockStylists.find(s => s.id === id);
};

export const getOnDutyStylists = (): Stylist[] => {
  return mockStylists.filter(s => s.status === 'onDuty');
};

export const getLevelText = (level: Stylist['level']): string => {
  const map = {
    junior: '初级',
    senior: '高级',
    expert: '资深',
    director: '首席'
  };
  return map[level];
};
