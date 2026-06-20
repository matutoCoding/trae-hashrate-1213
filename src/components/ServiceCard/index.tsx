import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Service } from '@/types';
import { categoryMap } from '@/data/mockServices';
import { formatDuration } from '@/utils/timeSlot';
import styles from './index.module.scss';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, selected, onSelect, compact }) => {
  const category = categoryMap[service.category];

  return (
    <View
      className={classnames(styles.serviceCard, selected && styles.selected, compact && styles.compact)}
      onClick={onSelect}
    >
      <View className={styles.header}>
        <View className={styles.categoryIcon}>{category.icon}</View>
        <View className={styles.titleRow}>
          <Text className={styles.name}>{service.name}</Text>
          {service.hot && <View className={styles.hotTag}>热门</View>}
        </View>
        {onSelect && (
          <View className={classnames(styles.checkbox, selected && styles.checked)}>
            {selected && <Text className={styles.checkMark}>✓</Text>}
          </View>
        )}
      </View>

      <Text className={styles.description}>{service.description}</Text>

      <View className={styles.meta}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>时长</Text>
          <Text className={styles.metaValue}>{formatDuration(service.duration)}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>适用</Text>
          <Text className={styles.metaValue}>{service.suitableFor.join('、')}</Text>
        </View>
      </View>

      <View className={styles.priceRow}>
        <View className={styles.priceWrapper}>
          <Text className={styles.currency}>¥</Text>
          <Text className={styles.price}>{service.price}</Text>
          {service.originalPrice && (
            <Text className={styles.originalPrice}>¥{service.originalPrice}</Text>
          )}
        </View>
        <View className={styles.categoryTag}>{category.name}</View>
      </View>
    </View>
  );
};

export default ServiceCard;
