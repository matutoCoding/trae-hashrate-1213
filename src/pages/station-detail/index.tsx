import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useQueueStore } from '@/store/queue';
import { useStylistStore } from '@/store/stylist';
import { useAppointmentStore } from '@/store/appointment';
import styles from './index.module.scss';

const StationDetailPage: React.FC = () => {
  const router = useRouter();
  const stationId = router.params.id as string;

  const { stations, stylists } = useStylistStore();
  const { queue, servicingItems, holdItems, currentCalling, completeServicing, getTodayStatsByStation } = useQueueStore();
  const { appointments } = useAppointmentStore();

  const station = useMemo(() => stations.find(s => s.id === stationId), [stations, stationId]);
  const stylist = useMemo(() => station ? stylists.find(s => s.id === station.stylistId) : undefined, [station, stylists]);
  const stationStats = useMemo(() => getTodayStatsByStation(), [stations, queue, servicingItems]);
  const stats = station ? (stationStats[station.id] || { waiting: 0, calling: 0, servicing: 0, completed: 0, noShow: 0 }) : null;

  const todayItems = useMemo(() => {
    if (!station) return [];
    const items: Array<{
      type: 'servicing' | 'calling' | 'waiting' | 'hold' | 'completed' | 'noShow';
      aptId: string;
      queueNumber: string;
      customerName: string;
      services: string[];
      time?: string;
    }> = [];

    servicingItems.forEach(q => {
      if (q.stationId === stationId) {
        items.push({ type: 'servicing', aptId: q.appointmentId, queueNumber: q.queueNumber, customerName: q.customerName, services: q.serviceNames });
      }
    });
    queue.forEach(q => {
      if (q.stationId === stationId) {
        if (q.status === 'calling') items.push({ type: 'calling', aptId: q.appointmentId, queueNumber: q.queueNumber, customerName: q.customerName, services: q.serviceNames });
        if (q.status === 'waiting') items.push({ type: 'waiting', aptId: q.appointmentId, queueNumber: q.queueNumber, customerName: q.customerName, services: q.serviceNames });
        if (q.status === 'completed') items.push({ type: 'completed', aptId: q.appointmentId, queueNumber: q.queueNumber, customerName: q.customerName, services: q.serviceNames });
        if (q.status === 'noShow') items.push({ type: 'noShow', aptId: q.appointmentId, queueNumber: q.queueNumber, customerName: q.customerName, services: q.serviceNames });
      }
    });
    if (currentCalling?.stationId === stationId && !items.find(i => i.aptId === currentCalling.appointmentId)) {
      items.push({ type: 'calling', aptId: currentCalling.appointmentId, queueNumber: currentCalling.queueNumber, customerName: currentCalling.customerName, services: currentCalling.serviceNames });
    }
    holdItems.forEach(q => {
      if (q.stationId === stationId && !items.find(i => i.aptId === q.appointmentId)) {
        items.push({ type: 'hold', aptId: q.appointmentId, queueNumber: q.queueNumber, customerName: q.customerName, services: q.serviceNames });
      }
    });

    appointments.forEach(a => {
      if (a.stationId === stationId) {
        if (!items.find(i => i.aptId === a.id)) {
          const svcNames = a.serviceIds.map(id => '服务').filter(Boolean);
          items.push({
            type: a.status === 'completed' ? 'completed' : (a.status === 'noShow' ? 'noShow' : 'waiting'),
            aptId: a.id,
            queueNumber: a.queueNumber || a.orderNo.slice(-4),
            customerName: a.customerName,
            services: svcNames.length ? svcNames : ['预约服务'],
            time: `${a.startTime}-${a.endTime}`
          });
        }
      }
    });

    return items;
  }, [station, stationId, servicingItems, queue, holdItems, currentCalling, appointments]);

  if (!station) {
    return (
      <View className={styles.page}>
        <Text className={styles.empty}>工位不存在</Text>
      </View>
    );
  }

  const loadPercent = Math.round((station.currentLoad / station.maxDailyLoad) * 100);
  const typeMap: Record<string, { label: string; color: string; bg: string }> = {
    servicing: { label: '服务中', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    calling: { label: '叫号中', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
    waiting: { label: '等待中', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    hold: { label: '暂不服务', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
    completed: { label: '已完成', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    noShow: { label: '未到店', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' }
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

  return (
    <ScrollView className={styles.page} scrollY>
      <View className="pageContainer">
        <View className={styles.header}>
          <View className={styles.headerRow}>
            <View className={styles.codeBox}>{station.code}</View>
            <View className={styles.headerInfo}>
              <Text className={styles.stationName}>{station.name}</Text>
              <Text className={styles.stationStylist}>{stylist ? `${stylist.name} · ${stylist.title}` : '未分配发型师'}</Text>
            </View>
            <View className={styles.statusTag} style={{
              color: station.status === 'free' ? '#10B981' : station.status === 'busy' ? '#F59E0B' : '#EF4444',
              background: station.status === 'free' ? 'rgba(16,185,129,0.1)' : station.status === 'busy' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
            }}>
              {station.status === 'free' ? '空闲' : station.status === 'busy' ? '使用中' : '维护'}
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
                  background: loadPercent >= 80 ? '#EF4444' : loadPercent >= 60 ? '#F59E0B' : loadPercent >= 30 ? '#3B82F6' : '#10B981'
                }}
              />
            </View>
          </View>
          {stats && (
            <View className={styles.statsGrid}>
              <View className={styles.statsItem}>
                <Text className={styles.statsValue} style={{ color: '#F59E0B' }}>{stats.servicing}</Text>
                <Text className={styles.statsLabel}>服务中</Text>
              </View>
              <View className={styles.statsItem}>
                <Text className={styles.statsValue} style={{ color: '#8B5CF6' }}>{stats.calling}</Text>
                <Text className={styles.statsLabel}>叫号</Text>
              </View>
              <View className={styles.statsItem}>
                <Text className={styles.statsValue} style={{ color: '#10B981' }}>{stats.completed}</Text>
                <Text className={styles.statsLabel}>已完成</Text>
              </View>
              <View className={styles.statsItem}>
                <Text className={styles.statsValue} style={{ color: '#EF4444' }}>{stats.noShow}</Text>
                <Text className={styles.statsLabel}>未到</Text>
              </View>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📋 当日明细</Text>
          {todayItems.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>本日暂无业务记录</Text>
            </View>
          ) : (
            <View className={styles.detailList}>
              {todayItems.map(item => {
                const t = typeMap[item.type];
                return (
                  <View key={item.aptId} className={styles.detailItem} style={{ background: t.bg }}>
                    <View className={styles.detailMain}>
                      <View className={styles.detailLeft}>
                        <View className={styles.typeTag} style={{ color: t.color, borderColor: t.color }}>
                          {t.label}
                        </View>
                        <Text className={styles.queueNumber}>{item.queueNumber}</Text>
                        <Text className={styles.customerName}>{item.customerName}</Text>
                      </View>
                      {item.type === 'servicing' && (
                        <View className={styles.completeBtn} onClick={() => handleComplete(item.queueNumber)}>
                          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>完成</Text>
                        </View>
                      )}
                    </View>
                    <View className={styles.detailServices}>
                      {item.services.map((s, i) => (
                        <Text key={i} className={styles.serviceTag}>{s}</Text>
                      ))}
                    </View>
                    {item.time && (
                      <Text className={styles.detailTime}>时段：{item.time}</Text>
                    )}
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
