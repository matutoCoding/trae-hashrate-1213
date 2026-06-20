import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useQueueStore } from '@/store/queue';
import { useStylistStore } from '@/store/stylist';
import styles from './index.module.scss';

const DashboardPage: React.FC = () => {
  const {
    queue, servicingItems, holdItems, completedCount, noShowCount,
    getTodayStatsByStylist, getTodayStatsByStation, getWaitingCount
  } = useQueueStore();
  const { stations, stylists } = useStylistStore();

  const stylistStats = useMemo(() => getTodayStatsByStylist(), [stations, queue, servicingItems]);
  const stationStats = useMemo(() => getTodayStatsByStation(), [stations, queue, servicingItems]);

  const totals = useMemo(() => {
    const waiting = getWaitingCount();
    const calling = queue.filter(q => q.status === 'calling').length;
    const servicing = servicingItems.length;
    const hold = holdItems.length;
    return { waiting, calling, servicing, hold, completed: completedCount, noShow: noShowCount, total: waiting + calling + servicing + hold + completedCount + noShowCount };
  }, [queue, servicingItems, holdItems, completedCount, noShowCount, getWaitingCount]);

  const handleOpenStation = (stationId: string) => {
    Taro.navigateTo({ url: `/pages/station-detail/index?id=${stationId}` });
  };

  const getLoadLevel = (load: number, max: number) => {
    const pct = load / max;
    if (pct < 0.3) return { text: '空闲', color: '#10B981' };
    if (pct < 0.6) return { text: '正常', color: '#3B82F6' };
    if (pct < 0.8) return { text: '较忙', color: '#F59E0B' };
    return { text: '繁忙', color: '#EF4444' };
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.headerTitle}>📊 当天运营看板</Text>
          <Text className={styles.headerDate}>{new Date().toLocaleDateString('zh-CN')}</Text>
        </View>

        <View className={styles.overviewGrid}>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}>
            <Text className={styles.overviewValue}>{totals.total}</Text>
            <Text className={styles.overviewLabel}>总客流量</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>
            <Text className={styles.overviewValue}>{totals.completed}</Text>
            <Text className={styles.overviewLabel}>已完成</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' }}>
            <Text className={styles.overviewValue}>{totals.servicing}</Text>
            <Text className={styles.overviewLabel}>服务中</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #F472B6 100%)' }}>
            <Text className={styles.overviewValue}>{totals.waiting + totals.calling}</Text>
            <Text className={styles.overviewLabel}>排队中</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
            <Text className={styles.overviewValue}>{totals.hold}</Text>
            <Text className={styles.overviewLabel}>暂不服务</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' }}>
            <Text className={styles.overviewValue}>{totals.noShow}</Text>
            <Text className={styles.overviewLabel}>未到店</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>👤 发型师汇总</Text>
          <View className={styles.table}>
            <View className={styles.tableHeader}>
              <Text className={styles.th}>发型师</Text>
              <Text className={styles.th}>等待</Text>
              <Text className={styles.th}>叫号</Text>
              <Text className={styles.th}>服务中</Text>
              <Text className={styles.th}>合计</Text>
            </View>
            {stylists.map(s => {
              const stats = stylistStats[s.id] || { waiting: 0, calling: 0, servicing: 0, completed: 0 };
              const total = stats.waiting + stats.calling + stats.servicing + stats.completed;
              if (total === 0) return null;
              return (
                <View key={s.id} className={styles.tableRow}>
                  <Text className={styles.tdName}>{s.name} · {s.title}</Text>
                  <Text className={styles.td}>{stats.waiting}</Text>
                  <Text className={styles.td}>{stats.calling}</Text>
                  <Text className={styles.td} style={{ color: '#F59E0B', fontWeight: 600 }}>{stats.servicing}</Text>
                  <Text className={styles.td} style={{ color: '#8B5CF6', fontWeight: 700 }}>{total}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>💺 工位汇总</Text>
          <View className={styles.stationList}>
            {stations.map(st => {
              const stats = stationStats[st.id] || { waiting: 0, calling: 0, servicing: 0, completed: 0, noShow: 0 };
              const level = getLoadLevel(st.currentLoad, st.maxDailyLoad);
              const stylist = stylists.find(s => s.id === st.stylistId);
              return (
                <View key={st.id} className={styles.stationCard} onClick={() => handleOpenStation(st.id)}>
                  <View className={styles.stationHeader}>
                    <View className={styles.stationCode}>{st.code}</View>
                    <View className={styles.stationMeta}>
                      <Text className={styles.stationName}>{st.name}</Text>
                      <Text className={styles.stationStylist}>{stylist ? stylist.name : '未分配'}</Text>
                    </View>
                    <View className={styles.stationLevel} style={{ color: level.color }}>
                      {level.text}
                    </View>
                  </View>
                  <View className={styles.stationStats}>
                    <View className={styles.statItem}>
                      <Text className={styles.statNum}>{stats.servicing}</Text>
                      <Text className={styles.statLab}>服务中</Text>
                    </View>
                    <View className={styles.statItem}>
                      <Text className={styles.statNum}>{stats.calling}</Text>
                      <Text className={styles.statLab}>叫号</Text>
                    </View>
                    <View className={styles.statItem}>
                      <Text className={styles.statNum} style={{ color: '#10B981' }}>{stats.completed}</Text>
                      <Text className={styles.statLab}>已完成</Text>
                    </View>
                    <View className={styles.statItem}>
                      <Text className={styles.statNum}>{st.currentLoad}/{st.maxDailyLoad}</Text>
                      <Text className={styles.statLab}>负载</Text>
                    </View>
                    <View className={styles.statItem}>
                      <Text className={styles.statNum} style={{ color: '#EF4444' }}>{stats.noShow}</Text>
                      <Text className={styles.statLab}>未到</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardPage;
