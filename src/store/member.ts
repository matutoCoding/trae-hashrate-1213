import { create } from 'zustand';
import { Member, RechargeRecord, ConsumeRecord } from '@/types';
import { mockMember } from '@/data/mockMember';

interface MemberStore {
  member: Member | null;
  isLoggedIn: boolean;
  login: (phone: string) => boolean;
  logout: () => void;
  recharge: (amount: number, gift?: number, payMethod?: RechargeRecord['payMethod']) => boolean;
  consume: (amount: number, description: string, type?: ConsumeRecord['type'], appointmentId?: string) => boolean;
  useWallet: (amount: number) => boolean;
  getWalletBalance: () => number;
  getDiscount: () => number;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
  member: { ...mockMember },
  isLoggedIn: true,

  login: (phone) => {
    if (phone.length >= 11) {
      set({ isLoggedIn: true });
      console.log('[MemberStore] 登录成功:', phone);
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isLoggedIn: false, member: null });
    console.log('[MemberStore] 退出登录');
  },

  recharge: (amount, gift = 0, payMethod = 'wechat') => {
    const { member } = get();
    if (!member) return false;

    const record: RechargeRecord = {
      id: `rr${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      gift,
      payMethod
    };

    set({
      member: {
        ...member,
        walletBalance: member.walletBalance + amount + gift,
        totalRecharge: member.totalRecharge + amount,
        rechargeRecords: [record, ...member.rechargeRecords]
      }
    });
    console.log('[MemberStore] 储值:', amount, '赠送:', gift);
    return true;
  },

  consume: (amount, description, type = 'service', appointmentId) => {
    const { member } = get();
    if (!member) return false;

    const record: ConsumeRecord = {
      id: `cr${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      type,
      description,
      appointmentId,
      payMethod: 'wallet'
    };

    set({
      member: {
        ...member,
        totalConsume: member.totalConsume + amount,
        points: member.points + Math.floor(amount / 10),
        consumeRecords: [record, ...member.consumeRecords]
      }
    });
    console.log('[MemberStore] 消费:', amount, description);
    return true;
  },

  useWallet: (amount) => {
    const { member } = get();
    if (!member || member.walletBalance < amount) return false;

    set({
      member: {
        ...member,
        walletBalance: member.walletBalance - amount
      }
    });
    console.log('[MemberStore] 钱包扣款:', amount);
    return true;
  },

  getWalletBalance: () => {
    return get().member?.walletBalance || 0;
  },

  getDiscount: () => {
    return get().member?.discount || 1;
  }
}));
