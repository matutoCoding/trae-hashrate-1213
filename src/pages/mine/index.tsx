import React from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemberStore } from '@/store/member';
import MemberCard from '@/components/MemberCard';
import styles from './index.module.scss';

const levelConfig: Record<string, { class: string; text: string }> = {
  bronze: { class: styles.levelBronze, text: '青铜会员' },
  silver: { class: styles.levelSilver, text: '白银会员' },
  gold: { class: styles.levelGold, text: '黄金会员' },
  diamond: { class: styles.levelDiamond, text: '钻石会员' }
};

const quickActions = [
  { icon: '👑', label: '会员中心', style: styles.actionPurple, path: '/pages/member-center/index' },
  { icon: '💇', label: '发型师', style: styles.actionPink, path: '/pages/stylist-manage/index' },
  { icon: '🪑', label: '工位管理', style: styles.actionBlue, path: '/pages/station-manage/index' },
  { icon: '📅', label: '我的预约', style: styles.actionGreen, path: '/pages/orders/index' },
  { icon: '💳', label: '充值中心', style: styles.actionOrange, path: '/pages/member-center/index' },
  { icon: '🎫', label: '优惠券', style: styles.actionRed, path: '' },
  { icon: '⭐', label: '我的收藏', style: styles.actionTeal, path: '' },
  { icon: '📞', label: '联系客服', style: styles.actionIndigo, path: '' }
];

const menuItems = [
  { icon: '📊', bg: 'rgba(139, 92, 246, 0.1)', text: '消费记录', badge: null },
  { icon: '🎁', bg: 'rgba(244, 114, 182, 0.1)', text: '我的积分', badge: '2880' },
  { icon: '📝', bg: 'rgba(59, 130, 246, 0.1)', text: '服务评价', badge: '3待评价' },
  { icon: '🔔', bg: 'rgba(245, 158, 11, 0.1)', text: '消息通知', badge: '新' },
  { icon: '📍', bg: 'rgba(16, 185, 129, 0.1)', text: '门店地址', badge: null },
  { icon: '⚙️', bg: 'rgba(107, 114, 128, 0.1)', text: '设置', badge: null }
];

const MinePage: React.FC = () => {
  const { member, levelConfig: levelCfg } = useMemberStore();
  const levelInfo = levelConfig[member.level];

  const handleAction = (path: string) => {
    if (!path) {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    if (path.startsWith('/pages/orders')) {
      Taro.switchTab({ url: path });
    } else {
      Taro.navigateTo({ url: path });
    }
  };

  const handleRecharge = () => {
    Taro.navigateTo({ url: '/pages/member-center/index?tab=recharge' });
  };

  const handleMenuItem = (index: number) => {
    if (index === 5) {
      Taro.navigateTo({ url: '/pages/member-center/index' });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.memberHeader}>
        <View className={styles.userRow}>
          <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
          <View className={styles.userInfo}>
            <View className={styles.userName}>
              {member.name}
              <Text className={`${styles.levelBadge} ${levelInfo.class}`}>{levelInfo.text}</Text>
            </View>
            <Text className={styles.userPhone}>{member.phone}</Text>
            <Text className={styles.joinDate}>加入时间：{member.joinDate}</Text>
          </View>
          <View className={styles.settingsIcon} onClick={() => handleMenuItem(5)}>
            ⚙️
          </View>
        </View>
      </View>

      <View className={styles.balanceCard}>
        <View className={styles.balanceTop}>
          <View className={styles.balanceLeft}>
            <View className={styles.balanceIcon}>💰</View>
            <View>
              <View className={styles.balanceLabel}>储值余额</View>
              <View>
                <Text className={styles.balanceAmount}>{member.walletBalance.toFixed(2)}</Text>
                <Text className={styles.balanceUnit}>元</Text>
              </View>
            </View>
          </View>
          <View className={styles.rechargeBtn} onClick={handleRecharge}>
            立即充值
          </View>
        </View>
        <View className={styles.statsGrid}>
          <View className={styles.statBlock}>
            <View className={styles.statValue}>{member.totalRecharge}</View>
            <View className={styles.statName}>累计充值</View>
          </View>
          <View className={styles.statBlock}>
            <View className={styles.statValue}>{member.totalConsume}</View>
            <View className={styles.statName}>累计消费</View>
          </View>
          <View className={styles.statBlock}>
            <View className={styles.statValue}>{member.points}</View>
            <View className={styles.statName}>积分</View>
          </View>
          <View className={styles.statBlock}>
            <View className={styles.statValue}>{(levelCfg.find(l => l.level === member.level)?.discount * 10).toFixed(1)}折</View>
            <View className={styles.statName}>会员折扣</View>
          </View>
        </View>
      </View>

      <View className={styles.quickActions}>
        <View className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>🚀</Text>
          快捷入口
        </View>
        <View className={styles.actionsGrid}>
          {quickActions.map((action, idx) => (
            <View key={idx} className={styles.actionItem} onClick={() => handleAction(action.path)}>
              <View className={`${styles.actionIconWrap} ${action.style}`}>
                {action.icon}
              </View>
              <Text className={styles.actionLabel}>{action.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.promotionCard}>
        <View className={styles.promoIcon}>🎉</View>
        <View className={styles.promoContent}>
          <View className={styles.promoTitle}>限时充值优惠</View>
          <View className={styles.promoDesc}>充500送100，充1000送300，充2000送800！</View>
        </View>
        <View className={styles.promoBtn} onClick={handleRecharge}>去充值</View>
      </View>

      <View className={styles.menuList}>
        {menuItems.map((item, idx) => (
          <View key={idx} className={styles.menuItem} onClick={() => handleMenuItem(idx)}>
            <View className={styles.menuIcon} style={{ background: item.bg }}>{item.icon}</View>
            <Text className={styles.menuText}>{item.text}</Text>
            {item.badge && <Text className={styles.menuBadge}>{item.badge}</Text>}
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>

      <Text className={styles.versionText}>魔发预约 v1.0.0</Text>
    </ScrollView>
  );
};

export default MinePage;
