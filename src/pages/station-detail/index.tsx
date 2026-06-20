import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useStylistStore } from '@/store/stylist';
import { useAppointmentStore } from '@/store/appointment';
import { useQueueStore } from '@/store/queue';
import { getStatusText, getStatusColor } from '@/data/mockAppointments';
import styles from './index.module.scss';

const StationDetailPage: React.FC = () => {
  const router = useRouter();
  const stationId = router.params.id as string;

  const { stations, stylists } = useStylistStore();
  const { getAppointmentsByStation, getServiceNames, getStatsByStation, getStatsByPeriod } = useAppointmentStore();
  const { completeServicing, servicingItems, currentCalling } = useQueueStore();

  const station = useMemo(() => stations.find(s => s.id === stationId), [stations, stationId]);
  const stylist = useMemo(() => station ? stylists.find(s => s.id === station.stylistId) : undefined, [station, stylists]);
  const apts = useMemo(() => getAppointmentsByStation(stationId), [stationId, getAppointmentsByStation]);
  const stats = useMemo(() => getStatsByStation()[stationId] || {
    total: 0, waiting: 0, calling: 0, servicing: 0,
    completed: 0, noShow: 0, cancelled: 0, revenue: 0
  }, [stationId, getStatsByStation]);

  const loadPercent = station ? Math.round((station.currentLoad / station.maxDailyLoad) * 100) : 0;

  const getLoadLevel = (load: number, max: number) => {
    const pct = load / max;
    if (pct < 0.3) return { text: '空闲', color: '#10B981' };
    if (pct < 0.6) return { text: '正常', color: '#3B82F6' };
    if (pct < 0.8) return { text: '较忙', color: '#F59E0B' };
    return { text: '繁忙', color: '#EF4444' };
  };

  const handleComplete = (queueNumber: string) => {
    Taro.showModal({
      title: '确认完成',
      content: `确认 ${queueNumber} 服务完成？`,
      success: (res) => {
        if (res.confirm) {
          completeServicing(queueNumber);
          Taro.showToast({ title: '已完成', icon: 'success' });
        }
      }
    });
  };

  const getQueueNumberForApt = (apt: any) => {
    const svc = servicingItems.find(q => q.appointmentId === apt.id);
    if (svc) return svc.queueNumber;
    if (currentCalling?.appointmentId === apt.id) return currentCalling.queueNumber;
    return apt.queueNumber || apt.orderNo.slice(-4);
  };

  const getDisplayStatus = (apt: any) => {
    if (currentCalling?.appointmentId === apt.id) return '叫号中';
    const svc = servicingItems.find(q => q.appointmentId === apt.id);
    if (svc) return '服务中';
    return getStatusText(apt.status);
  };

  const getDisplayStatusColor = (apt: any) => {
    if (currentCalling?.appointmentId === apt.id) return '#8B5CF6';
    const svc = servicingItems.find(q => q.appointmentId === apt.id);
    if (svc) return '#F59E0B';
    return getStatusColor(apt.status);
  };

  if (!station) {
    return (
      <View className={styles.page}>
        <Text className={styles.empty}>工位不存在</Text>
      </View>
    );
  }

  const level = getLoadLevel(station.currentLoad, station.maxDailyLoad);
  const sortedApts = [...apts].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <ScrollView className={styles.page} scrollY>
      <View className="pageContainer">
        <View className={styles.header}>
          <View className={styles.headerRow}>
            <View className={styles.codeBox}>{station.code}</View>
            <View className={styles.headerInfo}>
              <Text className={styles.stationName}>{station.name}</Text>
              <Text className={styles.stationStylist}>
                {stylist ? `${stylist.name} · ${stylist.title}` : '未分配发型师'}
              </Text>
            </View>
            <View
              className={styles.statusTag}
              style={{ color: level.color, background: `${level.color}15` }}
            >
              {level.text}
            </View>
          </View>

          <View className={styles.loadSection}>
            <View className={styles.loadRow}>
              <Text className={styles.loadLabel}>今日负载</Text>
              <Text className={styles.loadPercent}>{loadPercent}%</Text>
              <Text className={styles.loadCount}>{station.currentLoad}/{station.maxDailyLoad}单</Text>
            </View>
            <View className={styles.loadBar}>
              <View
                className={styles.loadFill}
                style={{
                  width: `${Math.min(loadPercent, 100)}%`,
                  background: level.color
                }}
              />
            </View>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#F59E0B' }}>{stats.servicing}</Text>
              <Text className={styles.statsLabel}>服务中</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#3B82F6' }}>{stats.waiting}</Text>
              <Text className={styles.statsLabel}>等待</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#10B981' }}>{stats.completed}</Text>
              <Text className={styles.statsLabel}>已完成</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#EF4444' }}>{stats.noShow}</Text>
              <Text className={styles.statsLabel}>未到</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#8B5CF6' }}>{stats.total}</Text>
              <Text className={styles.statsLabel}>合计</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#F472B6' }}>¥{stats.revenue}</Text>
              <Text className={styles.statsLabel}>营收</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📋 当日明细（按时间）</Text>

          {sortedApts.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>本日暂无业务记录</Text>
            </View>
          ) : (
            <View className={styles.detailList}>
              {sortedApts.map(apt => {
                const serviceNames = getServiceNames(apt.serviceIds);
                const statusText = getDisplayStatus(apt);
                const statusColor = getDisplayStatusColor(apt);
                const queueNumber = getQueueNumberForApt(apt);
                const isServicing = servicingItems.some(q => q.appointmentId === apt.id);

                return (
                  <View key={apt.id} className={styles.detailItem} style={{
                    borderLeftColor: statusColor,
                    borderLeftWidth: '6rpx',
                    borderLeftStyle: 'solid'
                  }}>
                    <View className={styles.detailHeader}>
                      <View className={styles.detailLeft}>
                        <Text className={styles.detailTime}>{apt.startTime}-{apt.endTime}</Text>
                        <Text className={styles.detailQueue}>{queueNumber}</Text>
                        <Text className={styles.detailName}>{apt.customerName}</Text>
                      </View>
                      <View
                        className={styles.statusBadge}
                        style={{ color: statusColor, borderColor: statusColor, background: `${statusColor}10` }}
                      >
                        {statusText}
                      </View>
                    </View>

                    <View className={styles.serviceTags}>
                      {serviceNames.map((name, i) => (
                        <Text key={i} className={styles.serviceTag}>{name}</Text>
                      ))}
                    </View>

                    <View className={styles.detailFooter}>
                      <Text className={styles.detailPrice}>
                        金额 ¥{apt.discountPrice || apt.totalPrice}
                        {apt.memberDiscount && ` · ${Math.round(apt.memberDiscount * 10)}折`}
                      </Text>
                      {isServicing && (
                        <View className={styles.completeBtn} onClick={() => handleComplete(queueNumber)}>
                          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>完成服务</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default StationDetailPage;
