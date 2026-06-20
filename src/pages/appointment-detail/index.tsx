import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppointmentStore } from '@/store/appointment';
import { useStylistStore } from '@/store/stylist';
import { mockServices } from '@/data/mockServices';
import { getStatusText, getStatusColor } from '@/data/mockAppointments';
import { formatDuration } from '@/utils/timeSlot';
import styles from './index.module.scss';

const AppointmentDetailPage: React.FC = () => {
  const router = useRouter();
  const { appointments } = useAppointmentStore();
  const { stylists, stations } = useStylistStore();
  const id = router.params.id;

  const appointment = useMemo(() => appointments.find(a => a.id === id), [appointments, id]);

  const services = useMemo(() => {
    if (!appointment) return [];
    return appointment.serviceIds.map(id => mockServices.find(s => s.id === id)).filter(Boolean);
  }, [appointment]);

  const stylist = useMemo(() => {
    if (!appointment?.stylistId) return null;
    return stylists.find(s => s.id === appointment.stylistId);
  }, [appointment, stylists]);

  const station = useMemo(() => {
    if (!appointment?.stationId) return null;
    return stations.find(s => s.id === appointment.stationId);
  }, [appointment, stations]);

  const timeline = useMemo(() => {
    if (!appointment) return [];
    const items = [
      { time: appointment.createTime, title: '预约提交', desc: '您的预约已成功提交', active: true },
      { time: appointment.createTime, title: '系统分配', desc: '系统已自动分配最优发型师和工位', active: appointment.status !== 'pending' || appointment.stylistId }
    ];
    if (appointment.status === 'arrived' || appointment.status === 'servicing' || appointment.status === 'completed') {
      items.push({ time: '2026-06-21 ' + appointment.startTime, title: '顾客到店', desc: '已到店等待叫号', active: true });
    }
    if (appointment.status === 'servicing' || appointment.status === 'completed') {
      items.push({ time: '2026-06-21 ' + appointment.startTime, title: '开始服务', desc: `${stylist?.name || '发型师'} 已开始为您服务`, active: true });
    }
    if (appointment.status === 'completed') {
      items.push({ time: '2026-06-21 ' + appointment.endTime, title: '服务完成', desc: '感谢您的光临，期待下次再见！', active: true });
    }
    if (appointment.status === 'cancelled') {
      items.push({ time: appointment.remark ? '取消时间' : '2026-06-21', title: '预约取消', desc: appointment.remark || '预约已取消', active: true });
    }
    return items;
  }, [appointment, stylist]);

  const statusBanner = useMemo(() => {
    if (!appointment) return { icon: '📋', title: '预约详情', desc: '' };
    const map: Record<string, { icon: string; title: string; desc: string }> = {
      pending: { icon: '⏳', title: '等待分配', desc: '系统正在为您匹配最优发型师，请稍候...' },
      confirmed: { icon: '✅', title: '预约已确认', desc: `${appointment.appointmentDate} ${appointment.startTime} 准时到店哦` },
      arrived: { icon: '📍', title: '已到店', desc: `叫号 ${appointment.queueNumber}，请耐心等待` },
      servicing: { icon: '💇', title: '服务中', desc: `${stylist?.name || '发型师'} 正在为您精心打造` },
      completed: { icon: '🎉', title: '服务已完成', desc: '感谢您的信任，期待下次光临' },
      cancelled: { icon: '❌', title: '已取消', desc: appointment.remark || '预约已取消' },
      noShow: { icon: '⚠️', title: '未到店', desc: '您错过了本次预约时间' }
    };
    return map[appointment.status];
  }, [appointment, stylist]);

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？取消后无法恢复。',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已取消预约', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1500);
        }
      }
    });
  };

  const handleArrived = () => {
    Taro.showToast({ title: '已确认到店', icon: 'success' });
  };

  const handleEvaluate = () => {
    Taro.showToast({ title: '评价功能开发中', icon: 'none' });
  };

  if (!appointment) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 120, textAlign: 'center' }}>
          <Text style={{ fontSize: 80 }}>❓</Text>
          <Text style={{ display: 'block', marginTop: 24, fontSize: 32 }}>预约不存在</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(appointment.status);
  const canCancel = ['pending', 'confirmed', 'arrived'].includes(appointment.status);
  const canArrive = appointment.status === 'confirmed';
  const canEvaluate = appointment.status === 'completed';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statusBanner} style={{ background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)` }}>
        <View className={styles.statusIcon}>{statusBanner.icon}</View>
        <View className={styles.statusTitle}>{statusBanner.title}</View>
        <View className={styles.statusDesc}>{statusBanner.desc}</View>
      </View>

      <View className={styles.orderInfoCard}>
        <View className={styles.orderNoRow}>
          <Text className={styles.orderNoLabel}>订单编号</Text>
          <Text className={styles.orderNoValue}>{appointment.orderNo}</Text>
        </View>

        <View className={styles.infoSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>👤</Text>
            顾客信息
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>姓名</Text>
            <Text className={styles.infoValue}>{appointment.customerName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>手机号</Text>
            <Text className={styles.infoValue}>{appointment.customerPhone}</Text>
          </View>
        </View>

        <View className={styles.infoSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📅</Text>
            预约时间
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>日期</Text>
            <Text className={styles.infoValue}>{appointment.appointmentDate}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时段</Text>
            <Text className={styles.infoValue} style={{ color: '$primary', fontWeight: 600 }}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>总时长</Text>
            <Text className={styles.infoValue}>{formatDuration(appointment.totalDuration)}</Text>
          </View>
        </View>

        {stylist && (
          <View className={styles.infoSection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>💇</Text>
              服务资源
            </View>
            <View className={styles.stylistCard}>
              <Image className={styles.stylistAvatar} src={stylist.avatar} mode="aspectFill" />
              <View className={styles.stylistInfo}>
                <View className={styles.stylistName}>{stylist.name}</View>
                <View className={styles.stylistMeta}>
                  {stylist.title} · 评分 {stylist.rating}
                  {'\n'}技能：{stylist.skills.slice(0, 3).join('、')}
                </View>
              </View>
              {station && <Text className={styles.stationBadge}>{station.name}</Text>}
            </View>
          </View>
        )}

        <View className={styles.infoSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>✂️</Text>
            服务项目
          </View>
          <View className={styles.serviceList}>
            {services.map((svc, idx) => (
              <View key={idx} className={styles.serviceItem}>
                <View>
                  <View className={styles.serviceName}>{svc?.name}</View>
                  <View className={styles.serviceDuration}>{formatDuration(svc?.duration || 0)}</View>
                </View>
                <Text className={styles.servicePrice}>¥{svc?.price}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.infoSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>💰</Text>
            费用明细
          </View>
          <View className={styles.priceBreakdown}>
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>服务总价</Text>
              <Text className={styles.priceValue}>¥{appointment.totalPrice}</Text>
            </View>
            {appointment.memberDiscount && appointment.discountPrice && (
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>会员折扣 ({(appointment.memberDiscount * 10).toFixed(1)}折)</Text>
                <Text className={styles.priceValue} style={{ color: '#EF4444' }}>-¥{appointment.totalPrice - appointment.discountPrice}</Text>
              </View>
            )}
            {appointment.useWallet ? (
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>储值抵扣</Text>
                <Text className={styles.priceValue} style={{ color: '#EF4444' }}>-¥{appointment.useWallet}</Text>
              </View>
            ) : null}
            <View className={styles.priceDivider} />
            <View className={styles.totalRow}>
              <Text className={styles.totalLabel}>实付金额</Text>
              <View>
                <Text className={styles.totalValue}>¥{appointment.discountPrice || appointment.totalPrice}</Text>
                <Text className={styles.totalUnit}></Text>
              </View>
            </View>
          </View>
        </View>

        {appointment.remark && (
          <View className={styles.infoSection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>📝</Text>
              备注
            </View>
            <Text style={{ fontSize: 26, color: '#666', lineHeight: 1.6 }}>{appointment.remark}</Text>
          </View>
        )}
      </View>

      <View className={styles.timelineCard}>
        <View className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>🕐</Text>
          服务进度
        </View>
        <View className={styles.timeline}>
          {timeline.map((item, idx) => (
            <View key={idx} className={styles.timelineItem}>
              <View className={`${styles.timelineDot} ${item.active ? styles.active : ''}`} />
              <View className={styles.timelineTime}>{item.time}</View>
              <View className={styles.timelineTitle}>{item.title}</View>
              <View className={styles.timelineDesc}>{item.desc}</View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        {canCancel && (
          <View className={`${styles.btn} ${styles.btnDanger}`} onClick={handleCancel}>取消预约</View>
        )}
        {canArrive && (
          <View className={`${styles.btn} ${styles.btnOutline}`} onClick={handleArrived}>我已到店</View>
        )}
        {canEvaluate ? (
          <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleEvaluate}>立即评价</View>
        ) : (
          <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
            再次预约
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AppointmentDetailPage;
