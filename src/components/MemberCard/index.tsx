import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { Member } from '@/types';
import { levelConfig } from '@/data/mockMember';
import styles from './index.module.scss';

interface MemberCardProps {
  member: Member;
  onClick?: () => void;
  compact?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, compact }) => {
  const level = levelConfig[member.level];

  return (
    <View className={styles.memberCard} onClick={onClick}>
      <View className={styles.cardBg} style={{ background: `linear-gradient(135deg, ${level.color}40 0%, ${level.color}15 100%)` }} />

      <View className={styles.header}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={member.avatar}
            mode="aspectFill"
          />
          <View className={styles.infoText}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{member.name}</Text>
              <View className={styles.levelBadge} style={{ background: level.color, color: '#fff' }}>
                {level.name}
              </View>
            </View>
            <Text className={styles.phone}>{member.phone}</Text>
          </View>
        </View>

        <View className={styles.points}>
          <Text className={styles.pointsValue}>{member.points}</Text>
          <Text className={styles.pointsLabel}>积分</Text>
        </View>
      </View>

      <View className={styles.balanceRow}>
        <View className={styles.balanceItem}>
          <Text className={styles.balanceLabel}>储值余额</Text>
          <View className={styles.balanceValueRow}>
            <Text className={styles.currency}>¥</Text>
            <Text className={styles.balanceValue}>{member.walletBalance.toFixed(2)}</Text>
          </View>
        </View>
        <View className={styles.divider} />
        <View className={styles.balanceItem}>
          <Text className={styles.balanceLabel}>会员折扣</Text>
          <Text className={styles.discountValue}>{(member.discount * 10).toFixed(1)}折</Text>
        </View>
      </View>

      {!compact && (
        <View className={styles.benefitsRow}>
          <Text className={styles.benefitsLabel}>会员权益</Text>
          <View className={styles.benefitTags}>
            {level.benefits.slice(0, 3).map((b, i) => (
              <Text key={i} className={styles.benefitTag}>✦ {b}</Text>
            ))}
          </View>
        </View>
      )}

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>¥{member.totalRecharge}</Text>
          <Text className={styles.statLabel}>累计充值</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>¥{member.totalConsume}</Text>
          <Text className={styles.statLabel}>累计消费</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{member.joinDate.slice(0, 10)}</Text>
          <Text className={styles.statLabel}>加入时间</Text>
        </View>
      </View>
    </View>
  );
};

export default MemberCard;
