export interface Stylist {
  id: string;
  name: string;
  avatar: string;
  title: string;
  level: 'junior' | 'senior' | 'expert' | 'director';
  skills: string[];
  rating: number;
  todayLoad: number;
  weekLoad: number;
  stationId: string | null;
  status: 'onDuty' | 'offDuty' | 'break' | 'leave';
  workSchedule: WorkSchedule;
}

export interface WorkSchedule {
  workDays: number[];
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

export interface Service {
  id: string;
  name: string;
  category: 'cut' | 'wash' | 'perm' | 'color' | 'treatment' | 'styling';
  duration: number;
  price: number;
  originalPrice?: number;
  description: string;
  suitableFor: string[];
  hot: boolean;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  status: 'free' | 'busy' | 'maintain';
  currentLoad: number;
  maxDailyLoad: number;
  stylistId: string | null;
  currentAppointmentId: string | null;
  callingAppointmentId?: string | null;
}

export interface Appointment {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceIds: string[];
  totalDuration: number;
  totalPrice: number;
  discountPrice?: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  stylistId: string | null;
  stationId: string | null;
  status: 'pending' | 'confirmed' | 'arrived' | 'servicing' | 'completed' | 'cancelled' | 'noShow';
  queueNumber?: string;
  memberDiscount?: number;
  useWallet?: number;
  createTime: string;
  remark?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  capacity: number;
  remaining: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  level: 'bronze' | 'silver' | 'gold' | 'diamond';
  walletBalance: number;
  totalRecharge: number;
  totalConsume: number;
  discount: number;
  points: number;
  joinDate: string;
  consumeRecords: ConsumeRecord[];
  rechargeRecords: RechargeRecord[];
}

export interface ConsumeRecord {
  id: string;
  date: string;
  amount: number;
  type: 'service' | 'product';
  description: string;
  appointmentId?: string;
  payMethod: 'wallet' | 'wechat' | 'alipay' | 'cash';
}

export interface RechargeRecord {
  id: string;
  date: string;
  amount: number;
  gift?: number;
  payMethod: 'wechat' | 'alipay' | 'cash' | 'card';
}

export interface QueueItem {
  appointmentId: string;
  queueNumber: string;
  customerName: string;
  serviceNames: string[];
  estimatedWait: number;
  status: 'waiting' | 'calling' | 'servicing';
  stationId?: string;
  callCount: number;
}

export interface LoadBalanceResult {
  stylistId: string;
  stationId: string;
  score: number;
  reason: string;
  fragmentsAvoided: number;
}

export interface AllocationResult {
  success: boolean;
  stylistId: string | null;
  stationId: string | null;
  reason: string;
  suggestions?: string[];
}
