import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import QueueDisplay from '@/components/QueueDisplay';
import { useQueueStore } from '@/store/queue';
import { useStylistStore } from '@/store/stylist';
import { getOverallLoadStats, calculateStationLoadBalance } from '@/utils/loadBalancer';
import styles from './index.module.scss';

const QueuePage: React.FC = () => {
  const {
    queue, currentCalling, servicingItems, holdItems, completedCount, noShowCount,
    callNext, recall, startServicing, getWaitingCount, completeServicing,
    updateServicingStation, holdCalling, requeueCalling, markNoShow, restoreHold,
    getTodayStatsByStation
  } = useQueueStore();
  const { stations, stylists } = useStylistStore();

  const [showTransferSuggestions] = useState(true);

  const loadStats = useMemo(() => getOverallLoadStats(stations), [stations]);
  const loadBalance = useMemo(() => calculateStationLoadBalance(stations), [stations]);
  const stationStats = useMemo(() => getTodayStatsByStation(), [stations, queue, servicingItems]);

  const waitingItems = useMemo(() => queue.filter(q => q.status === 'waiting'), [queue]);

  const findQueueItemByAptId = (aptId: string | null) => {
    if (!aptId) return null;
    return queue.find(q => q.appointmentId === aptId) ||
      servicingItems.find(q => q.appointmentId === aptId) ||
      holdItems.find(q => q.appointmentId === aptId) ||
      currentCalling?.appointmentId === aptId ? currentCalling : null;
  };

  const transferSuggestions = useMemo(() => {
    if (!showTransferSuggestions) return [];
    const suggestions: {
      fromId: string; toId: string; from: string; to: string;
      fromName: string; toName: string; diff: number;
      appointmentId: string | null;
    }[] = [];

    const busyWithApt = stations
      .filter(s => s.status === 'busy' && s.currentAppointmentId)
      .sort((a, b) => (b.currentLoad / b.maxDailyLoad) - (a.currentLoad / a.maxDailyLoad));

    const freeIdle = stations
      .filter(s => s.status === 'free' && !s.callingAppointmentId)
      .sort((a, b) => (a.currentLoad / a.maxDailyLoad) - (b.currentLoad / b.maxDailyLoad));

    if (busyWithApt.length > 0 && freeIdle.length > 0) {
      const busiest = busyWithApt[0];
      const idlest = freeIdle[0];
      const busyPct = busiest.currentLoad / busiest.maxDailyLoad;
      const idlePct = idlest.currentLoad / idlest.maxDailyLoad;
      const diffPct = busyPct - idlePct;

      if (diffPct >= 0.2) {
        suggestions.push({
          fromId: busiest.id,
          toId: idlest.id,
          from: busiest.code,
          to: idlest.code,
          fromName: busiest.name,
          toName: idlest.name,
          diff: Math.round(diffPct * 100),
          appointmentId: busiest.currentAppointmentId
        });
      }
    }

    return suggestions;
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

  const handleHold = (queueNumber: string) => {
    holdCalling(queueNumber);
    Taro.showToast({ title: `${queueNumber} 暂不服务`, icon: 'none' });
  };

  const handleRequeue = (queueNumber: string) => {
    Taro.showModal({
      title: '重新排队确认',
      content: `确认将 ${queueNumber} 放回队尾重新排队？`,
      success: (res) => {
        if (res.confirm) {
          requeueCalling(queueNumber);
          Taro.showToast({ title: '已重新排队', icon: 'success' });
        }
      }
    });
  };

  const handleNoShow = (queueNumber: string) => {
    Taro.showModal({
      title: '标记未到店',
      content: `确认将 ${queueNumber} 标记为未到店？`,
      confirmText: '确认标记',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          markNoShow(queueNumber);
          Taro.showToast({ title: '已标记未到店', icon: 'none' });
        }
      }
    });
  };

  const handleRestoreHold = (queueNumber: string) => {
    restoreHold(queueNumber);
    Taro.showToast({ title: `${queueNumber} 已恢复排队`, icon: 'success' });
  };

  const handleTransfer = (appointmentId: string | null, fromId: string, toId: string, fromCode: string, toCode: string) => {
    if (!appointmentId) {
      Taro.showToast({ title: '没有可调剂的顾客', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '跨工位调剂确认',
      content: `确认将 ${fromCode} 工位的服务顾客调剂至 ${toCode} 工位？\n（负载差超过20%，建议均衡）`,
      confirmText: '执行调剂',
      success: (res) => {
        if (res.confirm) {
          const ok = updateServicingStation(appointmentId, toId);
          if (ok) {
            Taro.showToast({ title: '调剂成功', icon: 'success' });
          } else {
            Taro.showToast({ title: '调剂失败', icon: 'error' });
          }
        }
      }
    });
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

  const handleOpenStation = (stationId: string) => {
    Taro.navigateTo({ url: `/pages/station-detail/index?id=${stationId}` });
  };

  const handleOpenDashboard = () => {
    Taro.navigateTo({ url: '/pages/dashboard/index' });
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
          <View className={styles.headerRow}>
            <Text className={styles.headerTitle}>📢 实时叫号大屏</Text>
            <View className={styles.dashboardBtn} onClick={handleOpenDashboard}>
              <Text style={{ fontSize: 22, color: '#8B5CF6', fontWeight: 600 }}>运营看板</Text>
            </View>
          </View>
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
              <Text className={styles.statValue}>{holdItems.length}</Text>
              <Text className={styles.statLabel}>暂不服务</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{completedCount}</Text>
              <Text className={styles.statLabel}>已完成</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{noShowCount}</Text>
              <Text className={styles.statLabel}>未到店</Text>
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
          holdItems={holdItems}
          stations={stations}
          onCallNext={handleCallNext}
          onRecall={handleRecall}
          onStartService={handleStartService}
          onHold={handleHold}
          onRequeue={handleRequeue}
          onNoShow={handleNoShow}
          onRestoreHold={handleRestoreHold}
          onComplete={handleComplete}
          onOpenStation={handleOpenStation}
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
              const load = Math.round((station.currentLoad / station.maxDailyLoad) * 100);
              const stylist = stylists.find(s => s.id === station.stylistId);
              const stats = stationStats[station.id] || { waiting: 0, calling: 0, servicing: 0, completed: 0, noShow: 0 };
              const servicingItem = station.currentAppointmentId
                ? (findQueueItemByAptId(station.currentAppointmentId) ||
                   servicingItems.find(q => q.appointmentId === station.currentAppointmentId))
                : null;
              const callingItem = station.callingAppointmentId
                ? (findQueueItemByAptId(station.callingAppointmentId) ||
                   (currentCalling?.appointmentId === station.callingAppointmentId ? currentCalling : null))
                : null;

              return (
                <View
                  key={station.id}
                  className={styles.miniStation}
                  onClick={() => handleOpenStation(station.id)}
                >
                  <View className={styles.miniHeader}>
                    <View className={styles.miniCode}>{station.code}</View>
                    <Text className={styles.miniName}>{station.name}</Text>
                    <View className={classnames(styles.miniStatus, statusMap[station.status].cls)}>
                      {statusMap[station.status].text}
                    </View>
                  </View>
                  {stylist && (
                    <Text style={{ fontSize: 22, color: '#6B7280', marginBottom: 8 }}>
                      {stylist.name} · {stylist.title}
                    </Text>
                  )}
                  {servicingItem && (
                    <View className={styles.miniCustomer} style={{ background: 'rgba(245,158,11,0.08)', marginBottom: 6 }}>
                      <Text style={{ fontSize: 20, color: '#F59E0B', fontWeight: 600 }}>服务中</Text>
                      <Text style={{ fontSize: 22, color: '#1F2937', fontWeight: 600, marginLeft: 8 }}>
                        {servicingItem.queueNumber} {servicingItem.customerName}
                      </Text>
                    </View>
                  )}
                  {callingItem && !servicingItem && (
                    <View className={styles.miniCustomer} style={{ background: 'rgba(139,92,246,0.08)', marginBottom: 6 }}>
                      <Text style={{ fontSize: 20, color: '#8B5CF6', fontWeight: 600 }}>叫号中</Text>
                      <Text style={{ fontSize: 22, color: '#1F2937', fontWeight: 600, marginLeft: 8 }}>
                        {callingItem.queueNumber} {callingItem.customerName}
                      </Text>
                    </View>
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
                      <Text style={{ fontSize: 20, color: '#9CA3AF', marginLeft: 10 }}>
                        完成{stats.completed} 未到{stats.noShow}
                      </Text>
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
                    <Text style={{ fontSize: 22, color: '#6B7280' }}>{s.fromName}</Text>
                  </View>
                  <Text className={styles.transferArrow}>→</Text>
                  <View className={styles.transferFrom}>
                    <View className={styles.transferCode} style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>{s.to}</View>
                    <Text style={{ fontSize: 22, color: '#6B7280' }}>{s.toName}</Text>
                  </View>
                  <View
                    className={styles.transferBtn}
                    onClick={() => handleTransfer(s.appointmentId, s.fromId, s.toId, s.from, s.to)}
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
