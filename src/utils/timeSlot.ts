import { TimeSlot, Stylist, Appointment } from '@/types';
import dayjs from 'dayjs';

const BUSINESS_START = 9;
const BUSINESS_END = 22;
const SLOT_INTERVAL = 30;

export const generateTimeSlots = (
  date: string,
  stylists: Stylist[],
  appointments: Appointment[],
  serviceDuration: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const totalStylists = stylists.filter(s => s.status === 'onDuty').length;

  for (let hour = BUSINESS_START; hour < BUSINESS_END; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const availableStylists = getAvailableStylistsAtTime(time, stylists, appointments, date, serviceDuration);
      const remaining = availableStylists.length;
      const capacity = Math.max(totalStylists, 1);

      slots.push({
        time,
        available: remaining > 0,
        capacity,
        remaining
      });
    }
  }

  return slots;
};

export const getAvailableStylistsAtTime = (
  time: string,
  stylists: Stylist[],
  appointments: Appointment[],
  date: string,
  serviceDuration: number = 30
): Stylist[] => {
  const [hour, minute] = time.split(':').map(Number);
  const slotStart = hour * 60 + minute;
  const slotEnd = slotStart + serviceDuration;

  return stylists.filter(stylist => {
    if (stylist.status !== 'onDuty') return false;

    const dayOfWeek = dayjs(date).day();
    if (!stylist.workSchedule.workDays.includes(dayOfWeek)) return false;

    const [startH, startM] = stylist.workSchedule.startTime.split(':').map(Number);
    const [endH, endM] = stylist.workSchedule.endTime.split(':').map(Number);
    const workStart = startH * 60 + startM;
    const workEnd = endH * 60 + endM;

    if (slotStart < workStart || slotEnd > workEnd) return false;

    const [breakSH, breakSM] = stylist.workSchedule.breakStart.split(':').map(Number);
    const [breakEH, breakEM] = stylist.workSchedule.breakEnd.split(':').map(Number);
    const breakStart = breakSH * 60 + breakSM;
    const breakEnd = breakEH * 60 + breakEM;

    const overlapsBreak = slotStart < breakEnd && slotEnd > breakStart;
    if (overlapsBreak) return false;

    const stylistAppointments = appointments.filter(
      a => a.stylistId === stylist.id &&
        a.appointmentDate === date &&
        (a.status === 'confirmed' || a.status === 'arrived' || a.status === 'servicing')
    );

    const conflict = stylistAppointments.some(apt => {
      const [sH, sM] = apt.startTime.split(':').map(Number);
      const [eH, eM] = apt.endTime.split(':').map(Number);
      const aptStart = sH * 60 + sM;
      const aptEnd = eH * 60 + eM;
      return slotStart < aptEnd && slotEnd > aptStart;
    });

    return !conflict;
  });
};

export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hour, minute] = startTime.split(':').map(Number);
  const totalMinutes = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const getDateLabel = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === tomorrow.toDateString()) return '明天';
  if (date.toDateString() === dayAfterTomorrow.toDateString()) return '后天';

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};

export const generateNextNDates = (n: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const formatDate = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};
