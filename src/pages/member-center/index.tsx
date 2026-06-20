import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useMemberStore } from '@/store/member';
import { rechargePackages, levelConfig } from '@/data/mockMember';
import styles from './index.module.scss';

const TABS = [
  { key: 'info', label: '会员信息' },
  { key: 'recharge', label: '充值中心' },
  { key: 'records', label: '消费记录' }
];

const MemberCenterPage: React.FC = () => {
  const router = useRouter();
  const { member, consumeRecords, rechargeRecords, recharge } = useMemberStore();
  const initialTab = router.params.tab || 'info';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  const memberLevel = useMemo(() =>
    levelConfig.find(l => l.level === member.level), [member.level]
  );

  const nextLevel = useMemo(() => {
    const idx = levelConfig.findIndex(l => l.level === member.level);
    return idx < levelConfig.length - 1 ? levelConfig[idx + 1] : null;
  }, [member.level]);

  const levelProgress = useMemo(() => {
    if (!nextLevel) return 100;
    const current = member.totalConsume;
    const threshold = nextLevel.threshold;
    const prevThreshold = memberLevel?.threshold || 0;
    return Math.round(((current - prevThreshold) / (threshold - prevThreshold)) * 100);
  }, [member.totalConsume, nextLevel, memberLevel]);

  const allRecords = useMemo(() => {
    const list = [
      ...rechargeRecords.map(r => ({
        ...r,
        type: 'in' as const,
        title: `充值¥${r.amount}${r.gift ? ` 送¥${r.gift}` : ''}`,
        subtitle: `${r.date} · ${r.payMethod}`
      })),
      ...consumeRecords.map(c => ({
        ...c,
        type: 'out' as const,
        title: c.description,
        subtitle: `${c.date} · ${c.payMethod}`
      }))
    ];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rechargeRecords, consumeRecords]);

  const handleRecharge = () => {
    if (!selectedPkg) {
      Taro.showToast({ title: '请选择充值套餐', icon: 'none' });
      return;
    }
    const pkg = rechargePackages.find(p => p.id === selectedPkg);
    if (!pkg) return;
    Taro.showModal({
      title: '确认充值',
      content: `充值¥${pkg.amount}，赠送¥${pkg.gift}，实际到账¥${pkg.amount + pkg.gift}`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          recharge(pkg.amount, pkg.gift);
          Taro.showToast({ title: '充值成功！', icon: 'success' });
        }
      }
    });
  };

  const renderMemberInfo = () => (
    <>
      <View className={styles.vipCard}>
        <View className={styles.vipHeader}>
          <View className={styles.vipLevel}>👑 {memberLevel?.name}</View>
          <View className={styles.vipLogo}>MAGIC HAIR</View>
        </View>
        <View className={styles.vipNo}>会员卡号  MF{member.id.slice(1).toUpperCase()}</View>
        <View className={styles.vipBalance}>
          <View className={styles.vipLabel}>储值余额</View>
          <View>
            <Text className={styles.vipAmount}>{member.walletBalance.toFixed(2)}</Text>
            <Text className={styles.vipUnit}>元</Text>
          </View>
        </View>
      </View>

      <View className={styles.benefitsCard}>
        <View className={styles.benefitsTitle}>🎁 会员权益</View>
        <View className={styles.benefitsGrid}>
          <View className={styles.benefitItem}>
            <View className={`${styles.benefitIcon} ${styles.benefitPurple}`}>💰</View>
            <View className={styles.benefitName}>会员折扣</View>
            <View className={styles.benefitValue}>{(memberLevel?.discount * 10).toFixed(1)}折</View>
          </View>
          <View className={styles.benefitItem}>
            <View className={`${styles.benefitIcon} ${styles.benefitPink}`}>🎁</View>
            <View className={styles.benefitName}>积分倍率</View>
            <View className={styles.benefitValue}>{memberLevel?.pointsRate}倍</View>
          </View>
          <View className={styles.benefitItem}>
            <View className={`${styles.benefitIcon} ${styles.benefitGreen}`}>🎂</View>
            <View className={styles.benefitName}>生日礼</View>
            <View className={styles.benefitValue}>¥{(memberLevel?.birthdayGift || 0)}</View>
          </View>
          <View className={styles.benefitItem}>
            <View className={`${styles.benefitIcon} ${styles.benefitOrange}`}>⭐</View>
            <View className={styles.benefitName}>积分</View>
            <View className={styles.benefitValue}>{member.points}</View>
          </View>
        </View>
      </View>

      <View className={styles.levelProgress}>
        <View className={styles.levelHeader}>
          <View className={styles.levelTitle}>📊 等级进度</View>
          <View className={styles.levelNext}>
            {nextLevel ? (
              <>距离 <strong>{nextLevel.name}</strong> 还需 ¥{Math.max(0, nextLevel.threshold - member.totalConsume)}</>
            ) : (<>已达最高等级 🎉</>)}
          </View>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${levelProgress}%` }} />
        </View>
        <View className={styles.progressText}>
          <Text>累计消费 <strong>¥{member.totalConsume}</strong></Text>
          {nextLevel && <Text>下一级 <strong>¥{nextLevel.threshold}</strong></Text>}
        </View>
      </View>
    </>
  );

  const renderRecharge = () => (
    <>
      <View style={{ padding: '32px 32px 0' }}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>💳</Text>
            选择充值套餐
          </View>
        </View>
        <View className={styles.rechargePackages}>
          {rechargePackages.map((pkg, idx) => (
            <View
              key={pkg.id}
              className={`${styles.packageCard} ${selectedPkg === pkg.id ? styles.packageHot : ''}`}
              onClick={() => setSelectedPkg(pkg.id)}
            >
              {pkg.hot && <View className={styles.hotBadge}>🔥 推荐</View>}
              <View>
                <Text className={styles.packageAmount}>{pkg.amount}</Text>
                <Text className={styles.packageUnit}>元</Text>
              </View>
              <View className={styles.packageGift}>赠送 ¥{pkg.gift}</View>
              <View className={styles.packageSlogan}>{pkg.slogan}</View>
              <View className={`${styles.packageBtn} ${selectedPkg === pkg.id ? styles.btnPrimary : styles.btnOutline}`}>
                {selectedPkg === pkg.id ? '✓ 已选择' : '立即充值'}
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderRecords = () => (
    <View style={{ padding: '32px 32px 0' }}>
      <View className={styles.sectionHeader}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>📋</Text>
          账户明细
        </View>
        <View className={styles.viewAll}>共{allRecords.length}条</View>
      </View>
      <View className={styles.recordsList}>
        {allRecords.map((record, idx) => (
          <View key={idx} className={styles.recordItem}>
            <View className={`${styles.recordIcon} ${record.type === 'in' ? styles.iconRecharge : styles.iconConsume}`}>
              {record.type === 'in' ? '↙️' : '↗️'}
            </View>
            <View className={styles.recordInfo}>
              <View className={styles.recordTitle}>{record.title}</View>
              <View className={styles.recordSubtitle}>{record.subtitle}</View>
            </View>
            <View className={`${styles.recordAmount} ${record.type === 'in' ? styles.amountIn : styles.amountOut}`}>
              {record.type === 'in' ? '+' : '-'}¥{record.amount}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView className={styles.page} scrollY>
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

      {activeTab === 'info' && renderMemberInfo()}
      {activeTab === 'recharge' && renderRecharge()}
      {activeTab === 'records' && renderRecords()}

      {activeTab === 'recharge' && (
        <View className={styles.bottomBar}>
          <View className={styles.confirmBtn} onClick={handleRecharge}>
            {selectedPkg
              ? `确认充值 ${rechargePackages.find(p => p.id === selectedPkg)?.amount}元`
              : '请选择充值套餐'
            }
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default MemberCenterPage;
