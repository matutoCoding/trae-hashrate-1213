import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStylistStore } from '@/store/stylist';
import { Stylist } from '@/types';
import styles from './index.module.scss';

const levelMap = {
  junior: { class: styles.levelJunior, text: '助理' },
  senior: { class: styles.levelSenior, text: '发型师' },
  expert: { class: styles.levelExpert, text: '高级' },
  director: { class: styles.levelDirector, text: '总监' }
};

const statusMap = {
  onDuty: { class: styles.statusOnDuty, text: '在岗' },
  break: { class: styles.statusBreak, text: '休息中' },
  offDuty: { class: styles.statusOffDuty, text: '下班' },
  leave: { class: styles.statusLeave, text: '请假' }
};

const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'onDuty', label: '在岗' },
  { key: 'break', label: '休息中' },
  { key: 'offDuty', label: '下班' },
  { key: 'leave', label: '请假' }
];

const StylistManagePage: React.FC = () => {
  const { stylists, stations } = useStylistStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const stats = useMemo(() => ({
    total: stylists.length,
    onDuty: stylists.filter(s => s.status === 'onDuty').length,
    avgLoad: Math.round(stylists.reduce((sum, s) => sum + s.todayLoad, 0) / stylists.length),
    avgRating: (stylists.reduce((sum, s) => sum + s.rating, 0) / stylists.length).toFixed(1)
  }), [stylists]);

  const filteredStylists = useMemo(() => {
    if (activeFilter === 'all') return stylists;
    return stylists.filter(s => s.status === activeFilter);
  }, [stylists, activeFilter]);

  const getStationByStylist = (stylistId: string) => {
    return stations.find(s => s.stylistId === stylistId);
  };

  const loadPercent = (load: number) => Math.min(100, Math.round((load / 12) * 100));

  const handleStylistClick = (stylist: Stylist) => {
    Taro.showActionSheet({
      itemList: ['查看详情', '调整排班', '修改工位', '调整状态'],
      success: (res) => {
        const actions = ['查看详情', '调整排班', '修改工位', '调整状态'];
        Taro.showToast({ title: `${actions[res.tapIndex]}：${stylist.name}`, icon: 'none' });
      }
    });
  };

  const handleAddStylist = () => {
    Taro.showToast({ title: '新增发型师功能开发中', icon: 'none' });
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const stars = [];
    for (let i = 0; i < full; i++) stars.push('★');
    if (half) stars.push('☆');
    while (stars.length < 5) stars.push('☆');
    return stars.join('');
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>发型师团队</Text>
        <Text className={styles.headerSubtitle}>管理发型师档案、排班与工位</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>总人数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.onDuty}</Text>
            <Text className={styles.statLabel}>在岗</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.avgLoad}</Text>
            <Text className={styles.statLabel}>人均单量</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.avgRating}</Text>
            <Text className={styles.statLabel}>平均分</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {FILTERS.map(f => (
          <View
            key={f.key}
            className={`${styles.filterChip} ${activeFilter === f.key ? styles.filterChipActive : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </View>
        ))}
      </View>

      <View className={styles.stylistList}>
        {filteredStylists.map(stylist => {
          const station = getStationByStylist(stylist.id);
          const levelInfo = levelMap[stylist.level];
          const statusInfo = statusMap[stylist.status];
          return (
            <View key={stylist.id} className={styles.stylistCard} onClick={() => handleStylistClick(stylist)}>
              <View className={styles.stylistHeader}>
                <Image className={styles.avatar} src={stylist.avatar} mode="aspectFill" />
                <View className={styles.stylistInfo}>
                  <View className={styles.nameRow}>
                    <Text className={styles.stylistName}>{stylist.name}</Text>
                    <Text className={`${styles.levelBadge} ${levelInfo.class}`}>{levelInfo.text}</Text>
                    <Text className={`${styles.statusBadge} ${statusInfo.class}`}>{statusInfo.text}</Text>
                  </View>
                  <View className={styles.titleRow}>
                    {stylist.title}
                    {station ? ` · ${station.name}` : ' · 暂无工位'}
                  </View>
                  <View className={styles.ratingRow}>
                    <Text className={styles.ratingStar} style={{ fontSize: 24 }}>{renderStars(stylist.rating)}</Text>
                    <Text className={styles.rating}>{stylist.rating.toFixed(1)}</Text>
                  </View>
                </View>
              </View>

              <View className={styles.skillsSection}>
                <View className={styles.sectionLabel}>擅长技能</View>
                <View className={styles.skillTags}>
                  {stylist.skills.map((skill, idx) => (
                    <Text key={idx} className={styles.skillTag}>{skill}</Text>
                  ))}
                </View>
              </View>

              <View className={styles.loadSection}>
                <View className={styles.loadHeader}>
                  <Text className={styles.loadLabel}>今日负载</Text>
                  <Text className={styles.loadValue}>{loadPercent(stylist.todayLoad)}%</Text>
                </View>
                <View className={styles.loadBar}>
                  <View className={styles.loadFill} style={{ width: `${loadPercent(stylist.todayLoad)}%` }} />
                </View>
                <View className={styles.loadStats}>
                  <Text className={styles.loadStat}>今日：<strong>{stylist.todayLoad}</strong>单</Text>
                  <Text className={styles.loadStat}>本周：<strong>{stylist.weekLoad}</strong>单</Text>
                </View>
              </View>

              <View className={styles.scheduleSection}>
                <View className={styles.sectionLabel}>工作排班</View>
                <View className={styles.scheduleGrid}>
                  <View className={styles.scheduleItem}>上班<strong>{stylist.workSchedule.startTime}</strong></View>
                  <View className={styles.scheduleItem}>下班<strong>{stylist.workSchedule.endTime}</strong></View>
                  <View className={styles.scheduleItem}>午休<strong>{stylist.workSchedule.breakStart}-{stylist.workSchedule.breakEnd}</strong></View>
                </View>
                <View className={styles.weekDays}>
                  {[1, 2, 3, 4, 5, 6, 0].map(day => (
                    <Text
                      key={day}
                      className={`${styles.dayChip} ${stylist.workSchedule.workDays.includes(day) ? styles.dayChipActive : ''}`}
                    >
                      周{weekDayNames[day === 0 ? 6 : day - 1]}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.addBtn} onClick={handleAddStylist}>+ 新增发型师</View>
      </View>
    </ScrollView>
  );
};

export default StylistManagePage;
