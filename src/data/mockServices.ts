import { Service } from '@/types';

export const mockServices: Service[] = [
  {
    id: 'sv001',
    name: '精致洗剪吹',
    category: 'cut',
    duration: 60,
    price: 128,
    originalPrice: 168,
    description: '包含专业头皮检测、深层清洁洗发、精修剪裁、造型吹发',
    suitableFor: ['男士', '女士', '儿童'],
    hot: true
  },
  {
    id: 'sv002',
    name: '创意总监剪裁',
    category: 'cut',
    duration: 90,
    price: 388,
    description: '总监级发型师一对一设计，根据脸型气质量身定制专属发型',
    suitableFor: ['女士', '男士'],
    hot: true
  },
  {
    id: 'sv003',
    name: 'SPA养发洗护',
    category: 'wash',
    duration: 45,
    price: 88,
    originalPrice: 128,
    description: '含专业头皮按摩、精油养护、肩颈放松，缓解疲劳',
    suitableFor: ['男士', '女士'],
    hot: false
  },
  {
    id: 'sv004',
    name: '时尚造型烫',
    category: 'perm',
    duration: 180,
    price: 688,
    originalPrice: 888,
    description: '采用进口药水，自然卷度持久，不伤发质',
    suitableFor: ['女士'],
    hot: true
  },
  {
    id: 'sv005',
    name: '韩式冷烫',
    category: 'perm',
    duration: 120,
    price: 398,
    description: '韩式自然卷度，日常易打理，适合追求自然感的顾客',
    suitableFor: ['女士', '男士'],
    hot: false
  },
  {
    id: 'sv006',
    name: '植物染发',
    category: 'color',
    duration: 150,
    price: 458,
    originalPrice: 598,
    description: '植物配方染发，温和不刺激，色牢度高、光泽感强',
    suitableFor: ['男士', '女士'],
    hot: true
  },
  {
    id: 'sv007',
    name: '挑染/挂耳染',
    category: 'color',
    duration: 120,
    price: 328,
    description: '时尚个性挑染，局部点缀造型更有层次感',
    suitableFor: ['女士'],
    hot: false
  },
  {
    id: 'sv008',
    name: '蛋白矫正护理',
    category: 'treatment',
    duration: 150,
    price: 568,
    originalPrice: 798,
    description: '深层修护受损发质，补充胶原蛋白，顺滑有光泽',
    suitableFor: ['男士', '女士'],
    hot: true
  },
  {
    id: 'sv009',
    name: '鱼子酱护发',
    category: 'treatment',
    duration: 90,
    price: 388,
    description: '高端鱼子酱精华护理，修复受损毛鳞片',
    suitableFor: ['男士', '女士'],
    hot: false
  },
  {
    id: 'sv010',
    name: '宴会造型',
    category: 'styling',
    duration: 60,
    price: 258,
    description: '婚礼/派对/宴会专属造型设计，含妆发一体',
    suitableFor: ['女士'],
    hot: false
  },
  {
    id: 'sv011',
    name: '日常编发造型',
    category: 'styling',
    duration: 45,
    price: 168,
    description: '多种编发款式任选，日常出街约会必备',
    suitableFor: ['女士', '儿童'],
    hot: false
  },
  {
    id: 'sv012',
    name: '儿童精剪',
    category: 'cut',
    duration: 40,
    price: 68,
    originalPrice: 98,
    description: '专业儿童发型师，耐心温柔，儿童专属造型',
    suitableFor: ['儿童'],
    hot: true
  }
];

export const categoryMap: Record<Service['category'], { name: string; icon: string }> = {
  cut: { name: '剪发', icon: '✂️' },
  wash: { name: '洗护', icon: '🧴' },
  perm: { name: '烫发', icon: '🌀' },
  color: { name: '染发', icon: '🎨' },
  treatment: { name: '护理', icon: '💆' },
  styling: { name: '造型', icon: '💇' }
};

export const getServicesByCategory = (category: Service['category']): Service[] => {
  return mockServices.filter(s => s.category === category);
};

export const getServiceById = (id: string): Service | undefined => {
  return mockServices.find(s => s.id === id);
};

export const getHotServices = (): Service[] => {
  return mockServices.filter(s => s.hot);
};
