import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import { Station, Stylist } from '@/types';
import { getStationLoadPercent } from '@/data/mockStations';
import styles from './index.module.scss';

interface StationCardProps {
  station: Station;
  stylist?: Stylist;
  compact?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

const statusConfig = {
  free: { text: '空闲', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  busy: { text: '使用中', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
  maintain: { text: '维护中', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
};

const StationCard: React.FC<StationCardProps> = ({ station, stylist, compact, onClick, showDetails = true }) => {
  const loadPercent = getStationLoadPercent(station);
  const status = statusConfig[station.status];

  const getLoadLevel = () => {
    if (loadPercent < 30) return { text: '空闲推荐', color: '#10B981' };
    if (loadPercent < 60) return { text: '负载正常', color: '#3B82F6' };
    if (loadPercent < 80) return { text: '较忙', color: '#F59E0B' };
    return { text: '繁忙', color: '#EF4444' };
  };

  const loadLevel = getLoadLevel();

  return (
    <View
      className={classnames(styles.stationCard, compact && styles.compact, station.status === 'free' && styles.freeGlow)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.stationCode}>
          <Text className={styles.codeText}>{station.code}</Text>
        </View>
        <View className={styles.stationInfo}>
          <Text className={styles.stationName}>{station.name}</Text>
          <View
            className={styles.statusTag}
            style={{ background: status.bgColor, color: status.color }}
          >
            {status.text}
          </View>
        </View>
        {stylist && !compact && (
          <View className={styles.stylistInfo}>
            <Image
              className={styles.stylistAvatar}
              src={stylist.avatar}
              mode="aspectFill"
            />
          </View>
        )}
      </View>

      {showDetails && (
        <>
          {stylist && (
            <View className={styles.stylistRow}>
              <Text className={styles.stylistLabel}>发型师</Text>
              <Text className={styles.stylistName}>
                {stylist.name} · {stylist.title}
              </Text>
            </View>
          )}

          <View className={styles.loadSection}>
            <View className={styles.loadHeader}>
              <Text className={styles.loadLabel}>今日负载</Text>
              <Text className={styles.loadPercent} style={{ color: loadLevel.color }}>
                {loadPercent}%
              </Text>
              <Text className={styles.loadLevel} style={{ color: loadLevel.color }}>
                {loadLevel.text}
              </Text>
            </View>
            <View className={styles.loadBar}>
              <View
                className={classnames(styles.loadFill, loadPercent >= 80 && styles.loadDanger, loadPercent >= 60 && loadPercent < 80 && styles.loadWarning)}
                style={{ width: `${Math.min(loadPercent, 100)}%` }}
              />
            </View>
            <View className={styles.loadStats}>
              <Text className={styles.loadStat}>
                {station.currentLoad}/{station.maxDailyLoad} 单
              </Text>
              {station.status === 'free' && station.currentLoad < station.maxDailyLoad * 0.3 && (
                <Text className={styles.recommendTag}>✦ 推荐分配</Text>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export default StationCard;
