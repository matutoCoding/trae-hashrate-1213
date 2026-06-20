import { Stylist, Station, Appointment, Service, AllocationResult, LoadBalanceResult } from '@/types';
import { getAvailableStylistsAtTime, calculateEndTime } from './timeSlot';

interface AllocationContext {
  date: string;
  startTime: string;
  services: Service[];
  stylists: Stylist[];
  stations: Station[];
  appointments: Appointment[];
}

export const allocateStylistAndStation = (ctx: AllocationContext): AllocationResult => {
  const { date, startTime, services, stylists, stations, appointments } = ctx;

  console.log('[Allocator] 开始分配', { date, startTime, services: services.map(s => s.name) });

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const endTime = calculateEndTime(startTime, totalDuration);
  const serviceCategories = services.map(s => s.category);

  const availableStylists = getAvailableStylistsAtTime(startTime, stylists, appointments, date, totalDuration);

  if (availableStylists.length === 0) {
    console.warn('[Allocator] 当前时段无可用发型师');
    return {
      success: false,
      stylistId: null,
      stationId: null,
      reason: '该时段暂无空闲发型师，请选择其他时段',
      suggestions: findNearbyAvailableSlots(ctx)
    };
  }

  const scoredCandidates: LoadBalanceResult[] = availableStylists.map(stylist => {
    return scoreCandidate(stylist, serviceCategories, totalDuration, stations, appointments, date, startTime);
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  console.log('[Allocator] 候选项评分:', scoredCandidates.map(c => ({
    stylistId: c.stylistId,
    score: c.score,
    reason: c.reason
  })));

  const best = scoredCandidates[0];

  if (best.stationId === null) {
    const freeStation = stations.find(s => s.status === 'free' && !s.stylistId);
    if (freeStation) {
      best.stationId = freeStation.id;
    }
  }

  return {
    success: best.stationId !== null,
    stylistId: best.stylistId,
    stationId: best.stationId,
    reason: best.reason,
    suggestions: best.stationId === null ? ['当前工位已满，请稍后再试或选择其他时段'] : undefined
  };
};

const scoreCandidate = (
  stylist: Stylist,
  categories: Service['category'][],
  duration: number,
  stations: Station[],
  appointments: Appointment[],
  date: string,
  startTime: string
): LoadBalanceResult => {
  let score = 0;
  const reasons: string[] = [];
  let fragmentsAvoided = 0;

  const skillMatch = categories.filter(cat =>
    stylist.skills.some(skill => skillMatchesCategory(skill, cat))
  ).length;
  const skillScore = (skillMatch / categories.length) * 40;
  score += skillScore;
  if (skillMatch === categories.length) {
    reasons.push('技能完全匹配');
  } else if (skillMatch > 0) {
    reasons.push(`匹配${skillMatch}项技能`);
  }

  const loadScore = Math.max(0, 30 - stylist.todayLoad * 2 - stylist.weekLoad * 0.5);
  score += loadScore;
  if (stylist.todayLoad <= 2) {
    reasons.push('负载较轻，优先分配');
    fragmentsAvoided += stylist.todayLoad;
  }

  const ratingScore = (stylist.rating - 4.5) * 20;
  score += Math.max(0, ratingScore);
  if (stylist.rating >= 4.9) reasons.push('高好评率');

  const levelPriority = { director: 15, expert: 10, senior: 5, junior: 0 };
  score += levelPriority[stylist.level] * 0.5;

  let stationId = null;
  if (stylist.stationId) {
    const station = stations.find(s => s.id === stylist.stationId);
    if (station && station.status === 'free') {
      stationId = station.id;
      score += 10;
      reasons.push('有专属工位');
      const stationLoadScore = Math.max(0, 15 - station.currentLoad);
      score += stationLoadScore * 0.5;
    }
  }

  const fragmentScore = calculateFragmentAvoidance(
    stylist, appointments, date, startTime, duration
  );
  score += fragmentScore;
  fragmentsAvoided += fragmentScore > 0 ? 1 : 0;
  if (fragmentScore > 5) reasons.push('有效避免碎片时间');

  return {
    stylistId: stylist.id,
    stationId,
    score: Math.round(score * 100) / 100,
    reason: reasons.join('、') || '综合评分最优',
    fragmentsAvoided
  };
};

const skillMatchesCategory = (skill: string, category: Service['category']): boolean => {
  const map: Record<Service['category'], string[]> = {
    cut: ['剪发'],
    wash: ['洗发', '洗护', '护发'],
    perm: ['烫发'],
    color: ['染发'],
    treatment: ['护发', '护理'],
    styling: ['造型', '接发']
  };
  return map[category]?.includes(skill) || false;
};

const calculateFragmentAvoidance = (
  stylist: Stylist,
  appointments: Appointment[],
  date: string,
  startTime: string,
  duration: number
): number => {
  const stylistApts = appointments.filter(
    a => a.stylistId === stylist.id && a.appointmentDate === date
  );

  if (stylistApts.length === 0) return 8;

  const [sH, sM] = startTime.split(':').map(Number);
  const startMinutes = sH * 60 + sM;
  const endMinutes = startMinutes + duration;

  let beforeGap = startMinutes;
  let afterGap = (22 - 0) * 60 - endMinutes;

  stylistApts.forEach(apt => {
    const [aSH, aSM] = apt.startTime.split(':').map(Number);
    const [aEH, aEM] = apt.endTime.split(':').map(Number);
    const aptStart = aSH * 60 + aSM;
    const aptEnd = aEH * 60 + aEM;

    if (aptEnd <= startMinutes) {
      beforeGap = Math.min(beforeGap, startMinutes - aptEnd);
    }
    if (aptStart >= endMinutes) {
      afterGap = Math.min(afterGap, aptStart - endMinutes);
    }
  });

  let score = 0;
  if (beforeGap === 0 || beforeGap >= 60) score += 5;
  else if (beforeGap >= 30) score += 3;
  else if (beforeGap < 15) score -= 3;

  if (afterGap === 0 || afterGap >= 60) score += 5;
  else if (afterGap >= 30) score += 3;
  else if (afterGap < 15) score -= 3;

  return score;
};

const findNearbyAvailableSlots = (ctx: AllocationContext): string[] => {
  const suggestions: string[] = [];
  const baseHour = parseInt(ctx.startTime.split(':')[0]);

  for (let offset = 1; offset <= 4; offset++) {
    const candidateHour = baseHour + offset;
    if (candidateHour < 22) {
      suggestions.push(`${String(candidateHour).padStart(2, '0')}:00 可能有空位`);
    }
    const candidateHour2 = baseHour - offset;
    if (candidateHour2 >= 9 && candidateHour2 < baseHour) {
      suggestions.unshift(`${String(candidateHour2).padStart(2, '0')}:00 可能有空位`);
    }
  }

  return suggestions.slice(0, 3);
};
