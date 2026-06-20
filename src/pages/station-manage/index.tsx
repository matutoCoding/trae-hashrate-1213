import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStylistStore } from '@/store/stylist';
import styles from './index.module.scss';

const stationTypes: Record<string, string> = {
  VIP: 'VIP室',
  STANDARD: '标准',
  QUICK: '快剪',
  PERM: '染烫'
};

const statusClassMap = {
  free: styles.statusFree,
  busy: styles.statusBusy,
  maintain: styles.statusMaintain
};

const cardClassMap = {
  free: styles.stationFree,
  busy: styles.stationBusy,
  maintain: styles.stationMaintain
};

const statusTextMap = {
  free: '空闲',
  busy: '使用中',
  maintain: '维护'
};

const StationManagePage: React.FC = () => {
  const { stations, stylists } = useStylistStore();

  const stats = useMemo(() => {
    const total = stations.length;
    const free = stations.filter(s => s.status === 'free').length;
    const busy = stations.filter(s => s.status === 'busy').length;
    const maintain = stations.filter(s => s.status === 'maintain').length;
    const totalLoad = stations.reduce((sum, s) => sum + s.currentLoad, 0);
    const totalMax = stations.reduce((sum, s) => sum + s.maxDailyLoad, 0);
    const loadPercent = Math.round((totalLoad / totalMax) * 100);
    return { total, free, busy, maintain, totalLoad, totalMax, loadPercent };
  }, [stations]);

  const loadSuggestions = useMemo(() => {
    const sorted = [...stations].sort((a, b) => b.currentLoad / b.maxDailyLoad - a.currentLoad / a.maxDailyLoad);
    const suggestions = [];
    if (sorted.length >= 2) {
      const busiest = sorted[0];
      const idlest = sorted[sorted.length - 1];
      const busiestPct = busiest.currentLoad / busiest.maxDailyLoad;
      const idlestPct = idlest.currentLoad / idlest.maxDailyLoad;
      if (busiestPct - idlestPct >= 0.2) {
        suggestions.push({
          from: busiest,
          to: idlest,
          diff: Math.round((busiestPct - idlestPct) * 100)
        });
      }
    }
    return suggestions;
  }, [stations]);

  const getStylistByStation = (stationId: string) => {
    return stylists.find(s => s.stationId === stationId);
  };

  const loadPercent = (station: typeof stations[0]) =>
    Math.round((station.currentLoad / station.maxDailyLoad) * 100);

  const loadClass = (pct: number) => {
    if (pct >= 80) return styles.loadHigh;
    if (pct >= 50) return styles.loadBusy;
    return styles.loadFree;
  };

  const handleStationClick = (station: typeof stations[0]) => {
    Taro.showActionSheet({
      itemList: ['查看详情', '切换状态', '更换发型师', '设置负载上限'],
      success: (res) => {
        const actions = ['查看详情', '切换状态', '更换发型师', '设置负载上限'];
        Taro.showToast({ title: `${actions[res.tapIndex]}：${station.name}`, icon: 'none' });
      }
    });
  };

  const handleTransfer = (suggestion: any) => {
    Taro.showModal({
      title: '跨工位调剂',
      content: `建议将部分顾客从 ${suggestion.from.name} 调剂到 ${suggestion.to.name}，负载差 ${suggestion.diff}%`,
      confirmText: '执行调剂',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已执行跨工位调剂', icon: 'success' });
        }
      }
    });
  };

  const handleAddStation = () => {
    Taro.showToast({ title: '新增工位功能开发中', icon: 'none' });
  };

  const handleLoadBalance = () => {
    Taro.showToast({ title: '正在执行负载均衡优化...', icon: 'none' });
    setTimeout(() => {
      Taro.showToast({ title: '负载均衡优化完成', icon: 'success' });
    }, 1500);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>工位管理</Text>
        <Text className={styles.headerSubtitle}>实时监控各工位负载与运行状态</Text>

        <View className={styles.loadOverview}>
          <View className={styles.overviewHeader}>
            <Text className={styles.overviewLabel}>整体负载率</Text>
            <Text className={styles.overviewPercent}>{stats.loadPercent}%</Text>
          </View>
          <View className={styles.overviewBar}>
            <View className={styles.overviewFill} style={{ width: `${stats.loadPercent}%` }} />
          </View>
          <View className={styles.overviewStats}>
            <View className={styles.overviewStat}>
              <Text><View className={styles.statDot} style={{ background: '#10B981' }} />空闲</Text>
              <View className={styles.statNum}>{stats.free}</View>
              <View className={styles.statText}>可用</View>
            </View>
            <View className={styles.overviewStat}>
              <Text><View className={styles.statDot} style={{ background: '#F59E0B' }} />忙碌</Text>
              <View className={styles.statNum}>{stats.busy}</View>
              <View className={styles.statText}>使用中</View>
            </View>
            <View className={styles.overviewStat}>
              <Text><View className={styles.statDot} style={{ background: '#EF4444' }} />维护</Text>
              <View className={styles.statNum}>{stats.maintain}</View>
              <View className={styles.statText}>暂停</View>
            </View>
          </View>
        </View>
      </View>

      {loadSuggestions.length > 0 && (
        <View style={{ margin: '-24px 32px 0' }}>
          <View className={styles.transferSection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>⚖️</Text>
              跨工位调剂建议
            </View>
            <View className={styles.transferList}>
              {loadSuggestions.map((s, idx) => (
                <View key={idx} className={styles.transferItem}>
                  <View className={styles.transferIcon}>🔄</View>
                  <View className={styles.transferInfo}>
                    <View className={styles.transferText}>
                      {s.from.name} → {s.to.name}
                    </View>
                    <View className={styles.transferDesc}>
                      负载差 {s.diff}%，建议调剂平衡
                    </View>
                  </View>
                  <View className={styles.transferBtn} onClick={() => handleTransfer(s)}>
                    调剂
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View className={styles.gridSection}>
        <View className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>🪑</Text>
          工位列表（共{stats.total}个）
        </View>
        <View className={styles.stationsGrid}>
          {stations.map(station => {
            const stylist = getStylistByStation(station.id);
            const pct = loadPercent(station);
            return (
              <View
                key={station.id}
                className={`${styles.stationCard} ${cardClassMap[station.status]}`}
                onClick={() => handleStationClick(station)}
              >
                <View className={styles.stationTop}>
                  <Text className={styles.stationCode}>{station.code}</Text>
                  <Text className={`${styles.stationStatus} ${statusClassMap[station.status]}`}>
                    {statusTextMap[station.status]}
                  </Text>
                </View>
                <View className={styles.stationName}>{station.name}</View>
                <View className={styles.stationType}>{stationTypes[station.code.slice(0, 2)] || '标准工位'}</View>

                <View className={styles.loadBar}>
                  <View className={`${styles.loadFill} ${loadClass(pct)}`} style={{ width: `${pct}%` }} />
                </View>
                <View className={styles.loadText}>
                  <Text>负载 <strong>{pct}%</strong></Text>
                  <Text><strong>{station.currentLoad}</strong>/{station.maxDailyLoad}</Text>
                </View>

                <View className={styles.stylistRow}>
                  {stylist ? (
                    <>
                      <Image className={styles.stylistAvatar} src={stylist.avatar} mode="aspectFill" />
                      <View className={styles.stylistMeta}>
                        <View className={styles.stylistName}>{stylist.name}</View>
                        <View className={styles.stylistTitle}>{stylist.title}</View>
                      </View>
                    </>
                  ) : (
                    <Text className={styles.noStylist}>暂无绑定发型师</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnOutline}`} onClick={handleLoadBalance}>
          负载均衡
        </View>
        <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddStation}>
          + 新增工位
        </View>
      </View>
    </ScrollView>
  );
};

export default StationManagePage;
