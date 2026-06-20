import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { TimeSlot } from '@/types';
import styles from './index.module.scss';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, selectedTime, onSelect }) => {
  const groupedSlots = useMemo(() => {
    const groups: Record<string, TimeSlot[]> = {};
    slots.forEach(slot => {
      const hour = slot.time.split(':')[0];
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(slot);
    });
    return groups;
  }, [slots]);

  const morningSlots = useMemo(() => {
    return slots.filter(s => {
      const h = parseInt(s.time.split(':')[0]);
      return h >= 9 && h < 12;
    });
  }, [slots]);

  const afternoonSlots = useMemo(() => {
    return slots.filter(s => {
      const h = parseInt(s.time.split(':')[0]);
      return h >= 12 && h < 18;
    });
  }, [slots]);

  const eveningSlots = useMemo(() => {
    return slots.filter(s => {
      const h = parseInt(s.time.split(':')[0]);
      return h >= 18;
    });
  }, [slots]);

  const renderSlotGroup = (title: string, slotsData: TimeSlot[], icon: string) => {
    if (slotsData.length === 0) return null;
    return (
      <View className={styles.group}>
        <View className={styles.groupHeader}>
          <Text className={styles.groupIcon}>{icon}</Text>
          <Text className={styles.groupTitle}>{title}</Text>
          <Text className={styles.groupHint}>
            {slotsData.filter(s => s.available).length}个时段可选
          </Text>
        </View>
        <View className={styles.slotGrid}>
          {slotsData.map(slot => (
            <View
              key={slot.time}
              className={classnames(
                styles.slot,
                !slot.available && styles.disabled,
                selectedTime === slot.time && styles.selected
              )}
              onClick={() => slot.available && onSelect(slot.time)}
            >
              <Text className={styles.slotTime}>{slot.time}</Text>
              <View className={styles.slotStatus}>
                {slot.available ? (
                  <>
                    {slot.remaining <= 1 ? (
                      <Text className={styles.remainingFew}>仅剩{slot.remaining}</Text>
                    ) : (
                      <Text className={styles.remainingOk}>空闲 {slot.remaining}</Text>
                    )}
                  </>
                ) : (
                  <Text className={styles.fullText}>已满</Text>
                )}
              </View>
              {selectedTime === slot.time && (
                <View className={styles.selectedBadge}>已选</View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.wrapper} scrollY>
      {renderSlotGroup('上午 (9:00-12:00)', morningSlots, '🌅')}
      {renderSlotGroup('下午 (12:00-18:00)', afternoonSlots, '☀️')}
      {renderSlotGroup('晚间 (18:00-22:00)', eveningSlots, '🌙')}
    </ScrollView>
  );
};

export default TimeSlotPicker;
