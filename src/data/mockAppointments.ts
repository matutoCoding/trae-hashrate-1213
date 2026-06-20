import { Appointment } from '@/types';

export const mockAppointments: Appointment[] = [
  {
    id: 'ap001',
    orderNo: 'MF20260621001',
    customerId: 'c001',
    customerName: '李雨桐',
    customerPhone: '138****6688',
    serviceIds: ['sv002', 'sv008'],
    totalDuration: 240,
    totalPrice: 956,
    discountPrice: 860,
    appointmentDate: '2026-06-21',
    startTime: '10:00',
    endTime: '14:00',
    stylistId: 's001',
    stationId: 'st01',
    status: 'servicing',
    queueNumber: 'A001',
    memberDiscount: 0.9,
    useWallet: 200,
    createTime: '2026-06-20 18:30:00'
  },
  {
    id: 'ap002',
    orderNo: 'MF20260621002',
    customerId: 'c002',
    customerName: '张晓冉',
    customerPhone: '139****2233',
    serviceIds: ['sv006'],
    totalDuration: 150,
    totalPrice: 458,
    discountPrice: 412,
    appointmentDate: '2026-06-21',
    startTime: '11:00',
    endTime: '13:30',
    stylistId: 's002',
    stationId: 'st02',
    status: 'confirmed',
    queueNumber: 'A002',
    memberDiscount: 0.9,
    createTime: '2026-06-20 20:15:00'
  },
  {
    id: 'ap003',
    orderNo: 'MF20260621003',
    customerId: 'c003',
    customerName: '王建国',
    customerPhone: '137****5566',
    serviceIds: ['sv001'],
    totalDuration: 60,
    totalPrice: 128,
    appointmentDate: '2026-06-21',
    startTime: '10:30',
    endTime: '11:30',
    stylistId: 's003',
    stationId: 'st03',
    status: 'servicing',
    queueNumber: 'A003',
    createTime: '2026-06-21 09:00:00'
  },
  {
    id: 'ap004',
    orderNo: 'MF20260621004',
    customerId: 'c004',
    customerName: '刘思琪',
    customerPhone: '136****8899',
    serviceIds: ['sv004', 'sv007'],
    totalDuration: 300,
    totalPrice: 1016,
    discountPrice: 863,
    appointmentDate: '2026-06-21',
    startTime: '14:00',
    endTime: '19:00',
    stylistId: null,
    stationId: null,
    status: 'pending',
    queueNumber: 'B001',
    memberDiscount: 0.85,
    useWallet: 500,
    createTime: '2026-06-21 08:45:00'
  },
  {
    id: 'ap005',
    orderNo: 'MF20260621005',
    customerId: 'c005',
    customerName: '赵雅婷',
    customerPhone: '135****3344',
    serviceIds: ['sv008'],
    totalDuration: 150,
    totalPrice: 568,
    appointmentDate: '2026-06-21',
    startTime: '09:30',
    endTime: '12:00',
    stylistId: null,
    stationId: 'st08',
    status: 'servicing',
    queueNumber: 'C001',
    createTime: '2026-06-20 22:10:00'
  },
  {
    id: 'ap006',
    orderNo: 'MF20260621006',
    customerId: 'c006',
    customerName: '陈思远',
    customerPhone: '134****7788',
    serviceIds: ['sv001', 'sv003'],
    totalDuration: 105,
    totalPrice: 216,
    appointmentDate: '2026-06-21',
    startTime: '15:00',
    endTime: '16:45',
    stylistId: null,
    stationId: null,
    status: 'pending',
    queueNumber: 'B002',
    createTime: '2026-06-21 10:20:00'
  },
  {
    id: 'ap007',
    orderNo: 'MF20260621007',
    customerId: 'c007',
    customerName: '孙美玲',
    customerPhone: '133****9900',
    serviceIds: ['sv002'],
    totalDuration: 90,
    totalPrice: 388,
    discountPrice: 368,
    appointmentDate: '2026-06-21',
    startTime: '13:00',
    endTime: '14:30',
    stylistId: null,
    stationId: null,
    status: 'arrived',
    queueNumber: 'A004',
    memberDiscount: 0.95,
    createTime: '2026-06-21 09:30:00'
  },
  {
    id: 'ap008',
    orderNo: 'MF20260620008',
    customerId: 'c008',
    customerName: '周小宝',
    customerPhone: '132****1122',
    serviceIds: ['sv012'],
    totalDuration: 40,
    totalPrice: 68,
    appointmentDate: '2026-06-20',
    startTime: '16:00',
    endTime: '16:40',
    stylistId: 's005',
    stationId: 'st05',
    status: 'completed',
    createTime: '2026-06-19 15:00:00'
  },
  {
    id: 'ap009',
    orderNo: 'MF20260620009',
    customerId: 'c009',
    customerName: '吴丽娜',
    customerPhone: '131****4455',
    serviceIds: ['sv004', 'sv008'],
    totalDuration: 330,
    totalPrice: 1256,
    discountPrice: 1068,
    appointmentDate: '2026-06-20',
    startTime: '10:00',
    endTime: '15:30',
    stylistId: 's001',
    stationId: 'st01',
    status: 'completed',
    memberDiscount: 0.85,
    useWallet: 300,
    createTime: '2026-06-18 11:20:00'
  },
  {
    id: 'ap010',
    orderNo: 'MF20260619010',
    customerId: 'c010',
    customerName: '郑伟强',
    customerPhone: '130****6677',
    serviceIds: ['sv001'],
    totalDuration: 60,
    totalPrice: 128,
    appointmentDate: '2026-06-19',
    startTime: '14:00',
    endTime: '15:00',
    stylistId: 's003',
    stationId: 'st03',
    status: 'cancelled',
    createTime: '2026-06-18 09:30:00',
    remark: '顾客临时有事取消'
  }
];

export const getAppointmentById = (id: string): Appointment | undefined => {
  return mockAppointments.find(a => a.id === id);
};

export const getAppointmentsByCustomerId = (customerId: string): Appointment[] => {
  return mockAppointments.filter(a => a.customerId === customerId);
};

export const getTodayAppointments = (): Appointment[] => {
  return mockAppointments.filter(a => a.appointmentDate === '2026-06-21');
};

export const getPendingAppointments = (): Appointment[] => {
  return mockAppointments.filter(a => a.status === 'pending' || a.status === 'arrived');
};

export const getServicingAppointments = (): Appointment[] => {
  return mockAppointments.filter(a => a.status === 'servicing');
};

export const getStatusText = (status: Appointment['status']): string => {
  const map = {
    pending: '待分配',
    confirmed: '已确认',
    arrived: '已到店',
    servicing: '服务中',
    completed: '已完成',
    cancelled: '已取消',
    noShow: '未到店'
  };
  return map[status];
};

export const getStatusColor = (status: Appointment['status']): string => {
  const map = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    arrived: '#8B5CF6',
    servicing: '#10B981',
    completed: '#6B7280',
    cancelled: '#9CA3AF',
    noShow: '#EF4444'
  };
  return map[status];
};
