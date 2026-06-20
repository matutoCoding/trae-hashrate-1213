import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import QueueDisplay from '@/components/QueueDisplay';
import { useQueueStore } from '@/store/queue';
import { useStylistStore } from '@/store/stylist';
import { getOverallLoadStats, calculateStationLoadBalance, crossStationTransfer, dispatchQueueToStations } from '@/utils/loadBalancer';
import { getStationLoadPercent } from '@/data/mockStations';
import { getStylistById } from '@/data/mockStylists';
import styles from './index.module.scss';

const QueuePage: React.FC = () => {
  const { queue, currentCalling, servicingItems, callNext, recall, startServicing, getWaitingCount } = useQueueStore();
  const { stations, stylists } = useStylistStore();

  const [showTransferSuggestions] = useState(true);

  const loadStats = useMemo(() => getOverallLoadStats(stations), [stations]);
  const loadBalance = useMemo(() => calculateStationLoadBalance(stations), [stations]);

  const waitingItems = useMemo(() => queue.filter(q => q.status === 'waiting'), [queue]);

  const transferSuggestions = useMemo(() => {
    if (!showTransferSuggestions) return [];
    const suggestions: { from: string; to: string; reason: string; queueNumber?: string }[] = [];

    const busyStations = stations
      .map(s => ({ station: s, load: getStationLoadPercent(s) }))
      .filter(x => x.load >= 60)
      .sort((a, b) => b.load - a.load);

    const freeStations = stations
      .filter(s => s.status === 'free')
      .map(s => ({ station: s, load: getStationLoadPercent(s) }))
      .sort((a, b) => a.load - b.load);

    busyStations.forEach(busy => {
      freeStations.forEach(free => {
        const result = crossStationTransfer(
          busy.station,
          free.station,
          { id: 'temp', orderNo: '', customerId: '', customerName: '', customerPhone: '', serviceIds: [], totalDuration: 0, totalPrice: 0, appointmentDate: '', startTime: '', endTime: '', stylistId: null, stationId: busy.station.id, status: 'servicing', createTime: '' }
        );
        if (result.success) {
          suggestions.push({
            from: busy.station.code,
            to: free.station.code,
            reason: result.reason,
            queueNumber: free.station.currentAppointmentId ? undefined : undefined
          });
        }
      });
    });

    return suggestions.slice(0, 3);
  }, [stations, showTransferSuggestions]);

  const handleCallNext = () => {
    const called = callNext();
    if (called) {
      Taro.showToast({ title: `已叫号 ${called.queueNumber}`, icon: 'success' });
    } else {
      Taro.showToast({ title: '暂无等待顾客', icon: 'none' });
    }
  };

  const handleRecall = (queueNumber: string) => {
    recall(queueNumber);
    Taro.showToast({ title: `重新呼叫 ${queueNumber}`, icon: 'success' });
  };

  const handleStartService = (queueNumber: string, stationId: string) => {
    startServicing(queueNumber, stationId);
    Taro.showToast({ title: `${queueNumber} 开始服务`, icon: 'success' });
  };

  const handleTransfer = (from: string, to: string) => {
    Taro.showModal({
      title: '跨工位调剂确认',
      content: `确认将 ${from} 工位的等待顾客调剂至 ${to} 工位？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '调剂成功', icon: 'success' });
        }
      }
    });
  };

  const getLoadColor = (percent: number) => {
    if (percent < 30) return 'linear-gradient(90deg, #10B981 0%, #34D399 100%)';
    if (percent < 60) return 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)';
    if (percent < 80) return 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)';
    return 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)';
  };

  const statusMap = {
    free: { text: '空闲', cls: 'free' },
    busy: { text: '使用中', cls: 'busy' },
    maintain: { text: '维护', cls: 'maintain' }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className="pageContainer">
        <View className={styles.headerCard}>
          <Text className={styles.headerTitle}>📢 实时叫号大屏</Text>
          <View className={styles.statsRow}>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{servicingItems.length}</Text>
              <Text className={styles.statLabel}>服务中</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{getWaitingCount()}</Text>
              <Text className={styles.statLabel}>等待中</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{stations.filter(s => s.status === 'free').length}</Text>
              <Text className={styles.statLabel}>空闲工位</Text>
            </View>
          </View>
        </View>

        <View className={styles.loadSection}>
          <View className={styles.loadHeader}>
            <Text className={styles.loadTitle}>工位整体负载</Text>
            <Text className={styles.loadPercent}>{loadStats.overallLoadPercent}%</Text>
          </View>
          <View className={styles.loadBar}>
            <View
              className={styles.loadFill}
              style={{ width: `${Math.min(loadStats.overallLoadPercent, 100)}%` }}
            />
          </View>
          <View className={styles.loadBreakdown}>
            <View className={styles.breakdownItem}>
              <View className={styles.breakdownDot} style={{ background: '#10B981' }} />
              <Text className={styles.breakdownText}>空闲 {loadStats.freeCount} 个</Text>
            </View>
            <View className={styles.breakdownItem}>
              <View className={styles.breakdownDot} style={{ background: '#F59E0B' }} />
              <Text className={styles.breakdownText}>忙碌 {loadStats.busyCount} 个</Text>
            </View>
            <View className={styles.breakdownItem}>
              <View className={styles.breakdownDot} style={{ background: '#EF4444' }} />
              <Text className={styles.breakdownText}>维护 {loadStats.maintainCount} 个</Text>
            </View>
          </View>
        </View>

        <QueueDisplay
          callingItem={currentCalling}
          waitingItems={waitingItems}
          servicingItems={servicingItems}
          onCallNext={handleCallNext}
          onRecall={handleRecall}
          onStartService={handleStartService}
          showActions={true}
        />

        <View className={styles.balanceTip}>
          <Text className={styles.balanceIcon}>⚖️</Text>
          <View className={styles.balanceContent}>
            <Text className={styles.balanceTitle}>智能负载均衡运行中</Text>
            <Text className={styles.balanceText}>
              系统持续监控各工位负载，自动将新顾客引导至最空闲工位。当前空闲工位优先推荐度：
              {loadBalance.filter(l => l.suggestion === 'priority').map(l => {
                const s = stations.find(st => st.id === l.stationId);
                return s ? ` ${s.code}(负载${l.loadPercent}%)` : '';
              }).join('、')}
            </Text>
          </View>
        </View>

        <View className={styles.stationsSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>工位实时状态</Text>
            <View className={styles.sectionHint}>
              <Text>共 {stations.length} 个工位</Text>
            </View>
          </View>
          <View className={styles.stationsGrid}>
            {stations.map(station => {
              const load = getStationLoadPercent(station);
              const stylist = station.stylistId ? getStylistById(station.stylistId) : undefined;
              return (
                <View key={station.id} className={styles.miniStation}>
                  <View className={styles.miniHeader}>
                    <View className={styles.miniCode}>{station.code}</View>
                    <Text className={styles.miniName}>{station.name}</Text>
                    <View className={classnames(styles.miniStatus, statusMap[station.status].cls)}>
                      {statusMap[station.status].text}
                    </View>
                  </View>
                  {stylist && (
                    <Text style={{ fontSize: 22, color: '#6B7280', marginBottom: 8 }}>
                      {stylist.name}
                    </Text>
                  )}
                  <View className={styles.miniLoad}>
                    <View className={styles.miniLoadBar}>
                      <View
                        className={styles.miniLoadFill}
                        style={{
                          width: `${Math.min(load, 100)}%`,
                          background: getLoadColor(load)
                        }}
                      />
                    </View>
                    <View className={styles.miniLoadText}>
                      {station.currentLoad}/{station.maxDailyLoad}单 · {load}%
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.transferSection}>
          <View className={styles.transferHeader}>
            <Text className={styles.transferIcon}>🔄</Text>
            <Text className={styles.transferTitle}>跨窗口调剂建议</Text>
          </View>
          {transferSuggestions.length === 0 ? (
            <View className={styles.emptyTransfer}>
              当前负载均衡，无需调剂
            </View>
          ) : (
            <View className={styles.transferList}>
              {transferSuggestions.map((s, idx) => (
                <View key={idx} className={styles.transferItem}>
                  <View className={styles.transferFrom}>
                    <View className={styles.transferCode}>{s.from}</View>
                    <Text style={{ fontSize: 24, color: '#6B7280' }}>工位</Text>
                  </View>
                  <Text className={styles.transferArrow}>→</Text>
                  <View className={styles.transferFrom}>
                    <View className={styles.transferCode} style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>{s.to}</View>
                    <Text style={{ fontSize: 24, color: '#6B7280' }}>工位</Text>
                  </View>
                  <View
                    className={styles.transferBtn}
                    onClick={() => handleTransfer(s.from, s.to)}
                  >
                    调剂
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default QueuePage;
