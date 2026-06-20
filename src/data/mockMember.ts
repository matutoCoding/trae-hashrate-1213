import { Member } from '@/types';

export const mockMember: Member = {
  id: 'c001',
  name: '李雨桐',
  phone: '138****6688',
  avatar: 'https://picsum.photos/id/91/200/200',
  level: 'gold',
  walletBalance: 2688.50,
  totalRecharge: 5000,
  totalConsume: 2311.50,
  discount: 0.85,
  points: 2680,
  joinDate: '2024-08-15',
  consumeRecords: [
    {
      id: 'cr001',
      date: '2026-06-20',
      amount: 1068,
      type: 'service',
      description: '时尚造型烫 + 蛋白矫正护理',
      appointmentId: 'ap009',
      payMethod: 'wallet'
    },
    {
      id: 'cr002',
      date: '2026-06-15',
      amount: 458,
      type: 'service',
      description: '植物染发',
      payMethod: 'wechat'
    },
    {
      id: 'cr003',
      date: '2026-06-10',
      amount: 128,
      type: 'service',
      description: '精致洗剪吹',
      payMethod: 'wallet'
    },
    {
      id: 'cr004',
      date: '2026-06-05',
      amount: 388,
      type: 'service',
      description: '创意总监剪裁',
      appointmentId: 'ap008',
      payMethod: 'alipay'
    },
    {
      id: 'cr005',
      date: '2026-05-28',
      amount: 268.5,
      type: 'service',
      description: '鱼子酱护发 + SPA养发洗护',
      payMethod: 'wallet'
    }
  ],
  rechargeRecords: [
    {
      id: 'rr001',
      date: '2026-05-01',
      amount: 2000,
      gift: 200,
      payMethod: 'wechat'
    },
    {
      id: 'rr002',
      date: '2025-12-01',
      amount: 3000,
      gift: 500,
      payMethod: 'alipay'
    }
  ]
};

export const levelConfig = {
  bronze: { name: '青铜会员', minRecharge: 0, discount: 0.98, color: '#CD7F32', benefits: ['生日当月88折', '积分兑换礼品'] },
  silver: { name: '白银会员', minRecharge: 1000, discount: 0.95, color: '#C0C0C0', benefits: ['消费95折', '生日当月85折', '优先预约'] },
  gold: { name: '黄金会员', minRecharge: 3000, discount: 0.85, color: '#FFD700', benefits: ['消费85折', '生日当月7折', '专属发型师', '免费护理1次/月'] },
  diamond: { name: '钻石会员', minRecharge: 10000, discount: 0.75, color: '#B9F2FF', benefits: ['消费75折', '生日免费造型', '总监优先服务', '免费护理2次/月', 'VIP专属工位'] }
};

export const getNextLevel = (currentLevel: Member['level']): { level: Member['level']; needRecharge: number } | null => {
  const levels: Member['level'][] = ['bronze', 'silver', 'gold', 'diamond'];
  const idx = levels.indexOf(currentLevel);
  if (idx >= levels.length - 1) return null;
  const nextLevel = levels[idx + 1];
  return {
    level: nextLevel,
    needRecharge: levelConfig[nextLevel].minRecharge
  };
};

export const rechargePackages = [
  { amount: 500, gift: 30, popular: false },
  { amount: 1000, gift: 100, popular: false },
  { amount: 2000, gift: 250, popular: true },
  { amount: 3000, gift: 500, popular: false },
  { amount: 5000, gift: 1000, popular: false },
  { amount: 10000, gift: 2500, popular: false }
];
