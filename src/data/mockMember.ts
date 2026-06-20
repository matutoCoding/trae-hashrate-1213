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

export const levelConfig = [
  { level: 'bronze' as const, name: '青铜会员', threshold: 0, discount: 0.98, pointsRate: 1, color: '#CD7F32', birthdayGift: 50 },
  { level: 'silver' as const, name: '白银会员', threshold: 1000, discount: 0.95, pointsRate: 1.2, color: '#C0C0C0', birthdayGift: 100 },
  { level: 'gold' as const, name: '黄金会员', threshold: 3000, discount: 0.85, pointsRate: 1.5, color: '#FFD700', birthdayGift: 200 },
  { level: 'diamond' as const, name: '钻石会员', threshold: 8000, discount: 0.80, pointsRate: 2, color: '#B9F2FF', birthdayGift: 500 }
];

export const getNextLevel = (currentLevel: Member['level']): { level: Member['level']; threshold: number } | null => {
  const idx = levelConfig.findIndex(l => l.level === currentLevel);
  if (idx < 0 || idx >= levelConfig.length - 1) return null;
  const next = levelConfig[idx + 1];
  return {
    level: next.level,
    threshold: next.threshold
  };
};

export const rechargePackages = [
  { id: 'pkg1', amount: 500, gift: 30, slogan: '新人首充推荐', hot: false },
  { id: 'pkg2', amount: 1000, gift: 100, slogan: '高性价比之选', hot: false },
  { id: 'pkg3', amount: 2000, gift: 250, slogan: '老会员最爱', hot: true },
  { id: 'pkg4', amount: 3000, gift: 500, slogan: '多充多送超值', hot: false },
  { id: 'pkg5', amount: 5000, gift: 1000, slogan: '升级钻石必备', hot: false },
  { id: 'pkg6', amount: 10000, gift: 2500, slogan: 'VIP至尊待遇', hot: false }
];
