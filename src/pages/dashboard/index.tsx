import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppointmentStore } from '@/store/appointment';
import { useStylistStore } from '@/store/stylist';
import { useQueueStore } from '@/store/queue';
import { getStatusText, getStatusColor } from '@/data/mockAppointments';
import styles from './index.module.scss';

type TabType = 'stylist' | 'station';

const DashboardPage: React.FC = () => {
  const {
    getTodayAppointments, getServiceNames, getStatsByStylist,
    getStatsByStation, getStatsByPeriod, getTimePeriod,
    getAppointmentsByStylist, getAppointmentsByStation
  } = useAppointmentStore();
  const { stations, stylists } = useStylistStore();
  const { completedCount, noShowCount, servicingItems, holdItems, getWaitingCount } = useQueueStore();

  const [tab, setTab] = useState<TabType>('stylist');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const todayApts = useMemo(() => getTodayAppointments(), [getTodayAppointments]);
  const stylistStats = useMemo(() => getStatsByStylist(), [getStatsByStylist]);
  const stationStats = useMemo(() => getStatsByStation(), [getStatsByStation]);
  const periodStats = useMemo(() => getStatsByPeriod(), [getStatsByPeriod]);

  const totals = useMemo(() => {
    const total = todayApts.length;
    const completed = todayApts.filter(a => a.status === 'completed').length;
    const servicing = todayApts.filter(a => a.status === 'servicing').length;
    const waiting = todayApts.filter(a => a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived').length;
    const cancelled = todayApts.filter(a => a.status === 'cancelled').length;
    const noShow = todayApts.filter(a => a.status === 'noShow').length;
    const revenue = todayApts
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.discountPrice || a.totalPrice), 0);
    return { total, completed, servicing, waiting, cancelled, noShow, hold: holdItems.length, revenue };
  }, [todayApts, holdItems]);

  const periodLabels: Record<string, { label: string; icon: string }> = {
    morning: { label: '上午', icon: '🌅' },
    afternoon: { label: '下午', icon: '☀️' },
    evening: { label: '晚间', icon: '🌙' }
  };

  const toggleExpand = (key: string) => {
    const next = new Set(expanded);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpanded(next);
  };

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

  const renderAptList = (apts: any[]) => {
    if (apts.length === 0) {
      return <Text className={styles.emptyList}>暂无记录</Text>;
    }
    return (
      <View className={styles.aptList}>
        {apts.map((apt: any) => (
          <View key={apt.id} className={styles.aptRow}>
            <View className={styles.aptLeft}>
              <Text className={styles.aptTime}>{apt.startTime}-{apt.endTime}</Text>
              <Text className={styles.aptNumber}>{apt.queueNumber || apt.orderNo.slice(-4)}</Text>
              <Text className={styles.aptName}>{apt.customerName}</Text>
            </View>
            <View className={styles.aptRight}>
              <View
                className={styles.aptStatus}
                style={{ color: getStatusColor(apt.status), borderColor: getStatusColor(apt.status) }}
              >
                {getStatusText(apt.status)}
              </View>
              <Text className={styles.aptPrice}>¥{apt.discountPrice || apt.totalPrice}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className="pageContainer">
        <View className={styles.header}>
          <View>
            <Text className={styles.headerTitle}>📊 当天经营日报</Text>
            <Text className={styles.headerDate}>2026年6月21日 周日</Text>
          </View>
          <Text className={styles.headerRevenue}>
            ¥{totals.revenue.toFixed(0)}
            <Text style={{ fontSize: 20, fontWeight: 400, opacity: 0.9 }}> 营收</Text>
          </Text>
        </View>

        <View className={styles.overviewGrid}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{totals.total}</Text>
            <Text className={styles.overviewLabel}>总预约</Text>
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
            <Text className={styles.overviewValue}>{totals.waiting + totals.hold}</Text>
            <Text className={styles.overviewLabel}>排队中</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
            <Text className={styles.overviewValue}>{totals.noShow}</Text>
            <Text className={styles.overviewLabel}>未到店</Text>
          </View>
          <View className={styles.overviewCard} style={{ background: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)' }}>
            <Text className={styles.overviewValue}>{totals.cancelled}</Text>
            <Text className={styles.overviewLabel}>已取消</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>� 时段分布</Text>
          <View className={styles.periodGrid}>
            {(['morning', 'afternoon', 'evening'] as const).map(p => {
              const stats = periodStats[p];
              const info = periodLabels[p];
              return (
                <View key={p} className={styles.periodCard}>
                  <View className={styles.periodHeader}>
                    <Text className={styles.periodIcon}>{info.icon}</Text>
                    <Text className={styles.periodLabel}>{info.label}</Text>
                  </View>
                  <View className={styles.periodStats}>
                    <View className={styles.periodStat}>
                      <Text className={styles.periodNum}>{stats.appointments}</Text>
                      <Text className={styles.periodUnit}>预约</Text>
                    </View>
                    <View className={styles.periodDivider} />
                    <View className={styles.periodStat}>
                      <Text className={styles.periodNum} style={{ color: '#10B981' }}>{stats.completed}</Text>
                      <Text className={styles.periodUnit}>完成</Text>
                    </View>
                    <View className={styles.periodDivider} />
                    <View className={styles.periodStat}>
                      <Text className={styles.periodNum} style={{ color: '#8B5CF6' }}>¥{stats.revenue}</Text>
                      <Text className={styles.periodUnit}>营收</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.tabBar}>
            <View
              className={tab === 'stylist' ? styles.tabItemActive : styles.tabItem}
              onClick={() => setTab('stylist')}
            >
              <Text>� 按发型师</Text>
            </View>
            <View
              className={tab === 'station' ? styles.tabItemActive : styles.tabItem}
              onClick={() => setTab('station')}
            >
              <Text>💺 按工位</Text>
            </View>
          </View>

          {tab === 'stylist' && (
            <View className={styles.list}>
              {stylists.map(s => {
                const stats = stylistStats[s.id] || {
                  total: 0, waiting: 0, calling: 0, servicing: 0,
                  completed: 0, noShow: 0, cancelled: 0, revenue: 0
                };
                if (stats.total === 0 && !s.isActive) return null;
                const key = `stylist-${s.id}`;
                const isExpanded = expanded.has(key);
                const apts = getAppointmentsByStylist(s.id);

                return (
                  <View key={s.id} className={styles.listCard}>
                    <View className={styles.listHeader} onClick={() => toggleExpand(key)}>
                      <View className={styles.listLeft}>
                        <View className={styles.avatar}>{s.name.charAt(0)}</View>
                        <View>
                          <Text className={styles.listName}>{s.name}</Text>
                          <Text className={styles.listSub}>{s.title} · {s.levelName}</Text>
                        </View>
                      </View>
                      <View className={styles.listRight}>
                        <Text className={styles.listRevenue}>¥{stats.revenue}</Text>
                        <Text className={styles.listExpand}>{isExpanded ? '收起 ▲' : '展开 ▼'}</Text>
                      </View>
                    </View>
                    <View className={styles.statsRow}>
                      <View className={styles.statMini}><Text style={{ color: '#F59E0B' }}>{stats.servicing}</Text><Text>服务中</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#3B82F6' }}>{stats.waiting}</Text><Text>等待</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#10B981' }}>{stats.completed}</Text><Text>完成</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#EF4444' }}>{stats.noShow}</Text><Text>未到</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#8B5CF6', fontWeight: 700 }}>{stats.total}</Text><Text>合计</Text></View>
                    </View>
                    {isExpanded && (
                      <View className={styles.expandContent}>
                        {renderAptList(apts)}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'station' && (
            <View className={styles.list}>
              {stations.map(st => {
                const stats = stationStats[st.id] || {
                  total: 0, waiting: 0, calling: 0, servicing: 0,
                  completed: 0, noShow: 0, cancelled: 0, revenue: 0
                };
                const stylist = stylists.find(s => s.id === st.stylistId);
                const level = getLoadLevel(st.currentLoad, st.maxDailyLoad);
                const key = `station-${st.id}`;
                const isExpanded = expanded.has(key);
                const apts = getAppointmentsByStation(st.id);

                return (
                  <View key={st.id} className={styles.listCard}>
                    <View
                      className={styles.listHeader}
                      onClick={() => {
                        if (apts.length > 0) {
                          toggleExpand(key);
                        }
                      }}
                    >
                      <View className={styles.listLeft}>
                        <View className={styles.stationCode}>{st.code}</View>
                        <View>
                          <Text className={styles.listName}>{st.name}</Text>
                          <Text className={styles.listSub}>
                            {stylist ? stylist.name : '未分配'} · {level.text}
                          </Text>
                        </View>
                      </View>
                      <View className={styles.listRight}>
                        <Text className={styles.listRevenue}>¥{stats.revenue}</Text>
                        <Text className={styles.listExpand} onClick={(e) => { e.stopPropagation(); handleOpenStation(st.id); }}>
                          详情 →
                        </Text>
                      </View>
                    </View>
                    <View className={styles.statsRow}>
                      <View className={styles.statMini}><Text style={{ color: '#F59E0B' }}>{stats.servicing}</Text><Text>服务中</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#3B82F6' }}>{stats.waiting}</Text><Text>等待</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#10B981' }}>{stats.completed}</Text><Text>完成</Text></View>
                      <View className={styles.statMini}><Text style={{ color: '#EF4444' }}>{stats.noShow}</Text><Text>未到</Text></View>
                      <View className={styles.statMini}>
                        <Text style={{ color: level.color, fontWeight: 700 }}>{st.currentLoad}/{st.maxDailyLoad}</Text>
                        <Text>负载</Text>
                      </View>
                    </View>
                    {isExpanded && (
                      <View className={styles.expandContent}>
                        {renderAptList(apts)}
                      </View>
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

export default DashboardPage;
