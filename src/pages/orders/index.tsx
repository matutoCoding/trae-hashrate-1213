import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppointmentStore } from '@/store/appointment';
import { useStylistStore } from '@/store/stylist';
import { Appointment } from '@/types';
import { getStatusText, getStatusColor, getAppointmentById } from '@/data/mockAppointments';
import { mockServices } from '@/data/mockServices';
import { formatDuration } from '@/utils/timeSlot';
import styles from './index.module.scss';

type TabKey = 'all' | 'pending' | 'confirmed' | 'servicing' | 'completed' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待分配' },
  { key: 'confirmed', label: '已确认' },
  { key: 'servicing', label: '服务中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
];

const OrdersPage: React.FC = () => {
  const { appointments } = useAppointmentStore();
  const { stylists, stations } = useStylistStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const stats = useMemo(() => {
    return {
      today: appointments.filter(a => a.appointmentDate === '2026-06-21').length,
      servicing: appointments.filter(a => a.status === 'servicing').length,
      pending: appointments.filter(a => a.status === 'pending' || a.status === 'arrived').length,
      completed: appointments.filter(a => a.status === 'completed').length
    };
  }, [appointments]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return appointments;
    if (activeTab === 'pending') {
      return appointments.filter(a => a.status === 'pending' || a.status === 'arrived');
    }
    return appointments.filter(a => a.status === activeTab);
  }, [appointments, activeTab]);

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds.map(id => mockServices.find(s => s.id === id)?.name).filter(Boolean);
  };

  const getStylistInfo = (stylistId: string | null) => {
    if (!stylistId) return null;
    return stylists.find(s => s.id === stylistId);
  };

  const getStationInfo = (stationId: string | null) => {
    if (!stationId) return null;
    return stations.find(s => s.id === stationId);
  };

  const handleCancelOrder = (order: Appointment) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已取消预约', icon: 'success' });
        }
      }
    });
  };

  const handleViewDetail = (order: Appointment) => {
    Taro.navigateTo({
      url: `/pages/appointment-detail/index?id=${order.id}`
    });
  };

  const handleArrived = (order: Appointment) => {
    Taro.showToast({ title: '已标记到店', icon: 'success' });
  };

  const renderOrderCard = (order: Appointment) => {
    const services = getServiceNames(order.serviceIds);
    const stylist = getStylistInfo(order.stylistId);
    const station = getStationInfo(order.stationId);
    const statusColor = getStatusColor(order.status);

    const renderActions = () => {
      const btns = [];
      btns.push(
        <View key="detail" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => handleViewDetail(order)}>
          查看详情
        </View>
      );
      if (order.status === 'pending' || order.status === 'confirmed') {
        btns.push(
          <View key="cancel" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handleCancelOrder(order)}>
            取消预约
          </View>
        );
      }
      if (order.status === 'confirmed') {
        btns.push(
          <View key="arrive" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleArrived(order)}>
            我已到店
          </View>
        );
      }
      return btns;
    };

    return (
      <View key={order.id} className={styles.orderCard}>
        <View className={styles.orderHeader}>
          <Text className={styles.orderNo}>{order.orderNo}</Text>
          <Text
            className={styles.orderStatus}
            style={{ background: `${statusColor}15`, color: statusColor }}
          >
            {getStatusText(order.status)}
          </Text>
        </View>

        <View className={styles.orderBody}>
          <View className={styles.customerInfo}>
            <Text className={styles.customerName}>{order.customerName}</Text>
            <Text className={styles.customerPhone}>{order.customerPhone}</Text>
            <View className={styles.serviceTags}>
              {services.map((name, idx) => (
                <Text key={idx} className={styles.serviceTag}>{name}</Text>
              ))}
            </View>
            {stylist && (
              <View className={styles.stylistInfo}>
                <Image className={styles.stylistAvatar} src={stylist.avatar} mode="aspectFill" />
                <View className={styles.stylistMeta}>
                  <Text className={styles.stylistName}>{stylist.name}</Text>
                  <Text className={styles.stylistTitle}>{stylist.title} · 评分{stylist.rating}</Text>
                </View>
                {station && (
                  <Text className={styles.stationBadge}>{station.name}</Text>
                )}
              </View>
            )}
            {order.queueNumber && (order.status === 'pending' || order.status === 'arrived') && (
              <View className={styles.queueInfo}>
                <Text className={styles.queueNumber}>{order.queueNumber}</Text>
                <Text className={styles.queueText}>等待叫号</Text>
              </View>
            )}
          </View>
          <View className={styles.timeInfo}>
            <Text className={styles.timeDate}>{order.appointmentDate.slice(5)}</Text>
            <Text className={styles.timeRange}>{order.startTime} - {order.endTime}</Text>
            <Text className={styles.timeDuration}>{formatDuration(order.totalDuration)}</Text>
          </View>
        </View>

        <View className={styles.orderFooter}>
          <View className={styles.priceInfo}>
            {order.discountPrice && order.discountPrice < order.totalPrice && (
              <Text className={styles.originalPrice}>¥{order.totalPrice}</Text>
            )}
            <Text className={styles.finalPrice}>¥{order.discountPrice || order.totalPrice}</Text>
            <Text className={styles.priceUnit}></Text>
            {order.useWallet ? (
              <Text className={styles.queueText}>含储值¥{order.useWallet}</Text>
            ) : null}
          </View>
          <View className={styles.actionBtns}>{renderActions()}</View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.page} scrollY refresherEnabled onRefresherRefresh={() => {
      Taro.showToast({ title: '刷新成功', icon: 'success' });
      Taro.stopPullDownRefresh();
    }}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>订单中心</Text>
        <Text className={styles.headerSubtitle}>管理您的所有预约订单</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.today}</Text>
            <Text className={styles.statLabel}>今日预约</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.servicing}</Text>
            <Text className={styles.statLabel}>服务中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabsContainer}>
        <View className={styles.tabs}>
          {TABS.map(tab => (
            <View
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.orderList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>📋</View>
            <Text className={styles.emptyTitle}>暂无订单</Text>
            <Text className={styles.emptyDesc}>快去预约一个喜欢的发型吧～</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default OrdersPage;
