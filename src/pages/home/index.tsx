import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import ServiceCard from '@/components/ServiceCard';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { Service, TimeSlot, Appointment } from '@/types';
import { mockServices, categoryMap, getHotServices } from '@/data/mockServices';
import { useAppointmentStore } from '@/store/appointment';
import { useStylistStore } from '@/store/stylist';
import { useMemberStore } from '@/store/member';
import { useQueueStore } from '@/store/queue';
import { generateTimeSlots, generateNextNDates, getDateLabel, formatDate, calculateEndTime, formatDuration } from '@/utils/timeSlot';
import { allocateStylistAndStation } from '@/utils/allocator';
import { generateQueueNumber } from '@/utils/loadBalancer';
import styles from './index.module.scss';

type Step = 'service' | 'date' | 'time' | 'confirm';

const HomePage: React.FC = () => {
  const {
    selectedServices,
    selectedDate,
    selectedTime,
    toggleService,
    setSelectedDate,
    setSelectedTime,
    addAppointment,
    appointments,
    validateSelectedTime
  } = useAppointmentStore();

  const { stylists, stations } = useStylistStore();
  const { member, getDiscount, isLoggedIn } = useMemberStore();
  const { addToQueue } = useQueueStore();

  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [activeCategory, setActiveCategory] = useState<string>('hot');
  const [dates] = useState(generateNextNDates(10));

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0);
  }, [selectedServices]);

  const timeSlots: TimeSlot[] = useMemo(() => {
    return generateTimeSlots(selectedDate, stylists, appointments, Math.max(30, totalDuration));
  }, [selectedDate, stylists, appointments, totalDuration]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const discount = getDiscount();
  const discountPrice = useMemo(() => {
    return Math.round(totalPrice * discount * 100) / 100;
  }, [totalPrice, discount]);

  const displayedServices = useMemo(() => {
    if (activeCategory === 'hot') return getHotServices();
    return mockServices.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  const categories = useMemo(() => [
    { key: 'hot', name: '热门推荐', icon: '🔥' },
    ...Object.entries(categoryMap).map(([key, val]) => ({
      key,
      name: val.name,
      icon: val.icon
    }))
  ], []);

  const handleNextStep = () => {
    if (currentStep === 'service' && selectedServices.length === 0) {
      Taro.showToast({ title: '请选择服务项目', icon: 'none' });
      return;
    }
    if (currentStep === 'time' && !selectedTime) {
      Taro.showToast({ title: '请选择预约时间', icon: 'none' });
      return;
    }

    const steps: Step[] = ['service', 'date', 'time', 'confirm'];
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps: Step[] = ['service', 'date', 'time', 'confirm'];
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(steps[idx - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (!validateSelectedTime(stylists, stations)) {
      Taro.showModal({
        title: '时段已不可用',
        content: '抱歉，该时段预约情况已发生变化，请重新选择时间。',
        showCancel: false,
        success: () => {
          setSelectedTime(null);
          setCurrentStep('time');
        }
      });
      return;
    }

    Taro.showLoading({ title: '智能分配中...' });

    const result = allocateStylistAndStation({
      date: selectedDate,
      startTime: selectedTime!,
      services: selectedServices,
      stylists,
      stations,
      appointments
    });

    await new Promise(r => setTimeout(r, 800));
    Taro.hideLoading();

    if (!result.success) {
      Taro.showModal({
        title: '预约失败',
        content: result.reason + (result.suggestions ? '\n建议：' + result.suggestions.join('；') : ''),
        showCancel: false
      });
      return;
    }

    const endTime = calculateEndTime(selectedTime!, totalDuration);
    const orderNo = `MF${formatDate(new Date()).replace(/-/g, '')}${String(Date.now()).slice(-4)}`;

    const newAppointment: Appointment = {
      id: `ap${Date.now()}`,
      orderNo,
      customerId: member!.id,
      customerName: member!.name,
      customerPhone: member!.phone,
      serviceIds: selectedServices.map(s => s.id),
      totalDuration,
      totalPrice,
      discountPrice: discountPrice < totalPrice ? discountPrice : undefined,
      appointmentDate: selectedDate,
      startTime: selectedTime!,
      endTime,
      stylistId: result.stylistId,
      stationId: result.stationId,
      status: 'confirmed',
      queueNumber: generateQueueNumber('A', appointments.length),
      memberDiscount: discount < 1 ? discount : undefined,
      createTime: new Date().toISOString()
    };

    addAppointment(newAppointment);

    addToQueue({
      appointmentId: newAppointment.id,
      queueNumber: newAppointment.queueNumber!,
      customerName: member!.name,
      serviceNames: selectedServices.map(s => s.name),
      estimatedWait: 0,
      status: 'waiting',
      callCount: 0
    });

    console.log('[HomePage] 预约成功:', {
      orderNo,
      stylist: result.stylistId,
      station: result.stationId,
      reason: result.reason
    });

    Taro.showModal({
      title: '预约成功',
      content: `系统为您智能分配：\n发型师ID: ${result.stylistId}\n工位ID: ${result.stationId}\n分配依据: ${result.reason}`,
      confirmText: '查看详情',
      cancelText: '返回首页',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: `/pages/appointment-detail/index?id=${newAppointment.id}` });
        } else {
          useAppointmentStore.getState().resetSelection();
          setCurrentStep('service');
        }
      }
    });
  };

  const stepConfig: Record<Step, { num: number; text: string }> = {
    service: { num: 1, text: '选项目' },
    date: { num: 2, text: '选日期' },
    time: { num: 3, text: '选时间' },
    confirm: { num: 4, text: '确认' }
  };

  const steps: Step[] = ['service', 'date', 'time', 'confirm'];
  const currentIdx = steps.indexOf(currentStep);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className="pageContainer">
        <View className={styles.hero}>
          <Text className={styles.heroTitle}>✨ 智能预约，为你省心</Text>
          <Text className={styles.heroSubtitle}>系统自动匹配最优发型师，告别碎片等待</Text>
          <View className={styles.heroStats}>
            <View className={styles.heroStat}>
              <Text className={styles.heroStatValue}>{stylists.filter(s => s.status === 'onDuty').length}</Text>
              <Text className={styles.heroStatLabel}>位在岗发型师</Text>
            </View>
            <View className={styles.heroStat}>
              <Text className={styles.heroStatValue}>{stations.filter(s => s.status === 'free').length}</Text>
              <Text className={styles.heroStatLabel}>个空闲工位</Text>
            </View>
            <View className={styles.heroStat}>
              <Text className={styles.heroStatValue}>{timeSlots.filter(t => t.available).length}</Text>
              <Text className={styles.heroStatLabel}>个可约时段</Text>
            </View>
          </View>
        </View>

        <View className={styles.stepIndicator}>
          {steps.map((step, idx) => (
            <React.Fragment key={step}>
              <View className={styles.step}>
                <View className={classnames(
                  styles.stepDot,
                  idx < currentIdx && styles.done,
                  idx === currentIdx && styles.active
                )}>
                  {idx < currentIdx ? '✓' : stepConfig[step].num}
                </View>
                <Text className={classnames(
                  styles.stepText,
                  idx === currentIdx && styles.activeText
                )}>
                  {stepConfig[step].text}
                </Text>
              </View>
              {idx < steps.length - 1 && (
                <View className={classnames(
                  styles.stepLine,
                  idx < currentIdx && styles.activeLine
                )} />
              )}
            </React.Fragment>
          ))}
        </View>

        {currentStep === 'service' && (
          <>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>选择服务项目</Text>
              <Text className={styles.sectionHint}>可多选</Text>
            </View>

            <ScrollView scrollX className={styles.dateScroll} style={{ marginBottom: 24 }}>
              <View style={{ display: 'flex', gap: 16, paddingBottom: 8 }}>
                {categories.map(cat => (
                  <View
                    key={cat.key}
                    className={classnames({
                      [styles.dateItem]: true,
                      [styles.selected]: activeCategory === cat.key
                    })}
                    style={{ width: 'auto', padding: '16rpx 28rpx', flexDirection: 'row', gap: 8 }}
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    <Text>{cat.icon}</Text>
                    <Text className={classnames(styles.dateLabel, { [styles.dateDay]: activeCategory === cat.key })}>
                      {cat.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {displayedServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={!!selectedServices.find(s => s.id === service.id)}
                onSelect={() => {
                  const hadTime = !!selectedTime;
                  toggleService(service, stylists, stations);
                  if (hadTime && !useAppointmentStore.getState().selectedTime) {
                    Taro.showToast({ title: '服务变更，已清空时间', icon: 'none' });
                  }
                }}
              />
            ))}
          </>
        )}

        {currentStep === 'date' && (
          <>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>选择预约日期</Text>
            </View>

            <View className={styles.datePicker}>
              <ScrollView scrollX className={styles.dateScroll}>
                <View className={styles.dateList}>
                  {dates.map((date) => {
                    const dateStr = formatDate(date);
                    const isSelected = dateStr === selectedDate;
                    const weekday = getDateLabel(date);
                    return (
                      <View
                        key={dateStr}
                        className={classnames(styles.dateItem, isSelected && styles.selected)}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <Text className={styles.dateLabel}>{weekday}</Text>
                        <Text className={styles.dateDay}>{date.getDate()}</Text>
                        <Text className={styles.dateMonth}>{date.getMonth() + 1}月</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className={styles.sectionHeader} style={{ marginTop: 16 }}>
              <Text className={styles.sectionTitle}>已选服务</Text>
            </View>
            {selectedServices.map(s => (
              <ServiceCard key={s.id} service={s} compact />
            ))}
          </>
        )}

        {currentStep === 'time' && (
          <>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>选择预约时段</Text>
              <Text className={styles.sectionHint}>系统智能分配发型师</Text>
            </View>

            <View style={{ height: 800 }}>
              <TimeSlotPicker
                slots={timeSlots}
                selectedTime={selectedTime}
                onSelect={(t) => setSelectedTime(t)}
              />
            </View>
          </>
        )}

        {currentStep === 'confirm' && (
          <>
            <View className={styles.summaryCard}>
              <View className={styles.summaryHeader}>
                <Text className={styles.summaryTitle}>预约信息确认</Text>
                <View className={styles.summaryCount}>
                  <Text>{selectedServices.length} 项服务</Text>
                </View>
              </View>

              <View className={styles.summaryServices}>
                {selectedServices.map(s => (
                  <View key={s.id} className={styles.summaryServiceRow}>
                    <Text className={styles.summaryServiceName}>{s.name}</Text>
                    <Text className={styles.summaryServicePrice}>¥{s.price}</Text>
                  </View>
                ))}
              </View>

              <View className={styles.summaryInfoRow}>
                <Text className={styles.summaryLabel}>服务总时长</Text>
                <Text className={styles.summaryValue}>{formatDuration(totalDuration)}</Text>
              </View>

              <View className={styles.summaryInfoRow}>
                <Text className={styles.summaryLabel}>预约日期</Text>
                <Text className={styles.summaryValue}>{selectedDate}</Text>
              </View>

              <View className={styles.summaryInfoRow}>
                <Text className={styles.summaryLabel}>预约时段</Text>
                <Text className={classnames(styles.summaryValue, styles.highlight)}>
                  {selectedTime} - {calculateEndTime(selectedTime!, totalDuration)}
                </Text>
              </View>

              <View className={styles.summaryDivider} />

              <View className={styles.summaryInfoRow}>
                <Text className={styles.summaryLabel}>会员折扣</Text>
                <Text className={styles.summaryValue}>
                  {member ? `${(member.discount * 10).toFixed(1)}折` : '无'}
                </Text>
              </View>

              <View className={styles.summaryTotal}>
                <Text className={styles.summaryTotalLabel}>应付金额</Text>
                <View className={styles.summaryTotalValue}>
                  {discount < 1 && (
                    <Text className={styles.summaryDiscount}>
                      已省¥{(totalPrice - discountPrice).toFixed(0)}
                    </Text>
                  )}
                  <Text className={styles.summaryCurrency}>¥</Text>
                  <Text className={styles.summaryPrice}>
                    {discount < 1 ? discountPrice : totalPrice}
                  </Text>
                  {discount < 1 && (
                    <Text className={styles.summaryOriginal}>¥{totalPrice}</Text>
                  )}
                </View>
              </View>

              <View className={styles.allocationHint}>
                <Text className={styles.allocationIcon}>🤖</Text>
                <Text className={styles.allocationText}>
                  系统将根据技能匹配度、负载均衡、避免碎片时间等原则，智能为您分配最佳发型师和工位
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomInfo}>
          {currentStep !== 'service' ? (
            <>
              <View className={styles.bottomPrice}>
                <Text className={styles.bottomCurrency}>¥</Text>
                <Text className={styles.bottomAmount}>
                  {discount < 1 && selectedServices.length > 0 ? discountPrice : totalPrice}
                </Text>
              </View>
              <Text className={styles.bottomHint}>
                {selectedServices.length > 0 ? `${selectedServices.length}项服务 · ${formatDuration(totalDuration)}` : '请选择服务项目'}
              </Text>
            </>
          ) : (
            <>
              <Text className={styles.bottomHint} style={{ fontSize: 26, color: '#4E5969' }}>
                已选 {selectedServices.length} 项
              </Text>
              <Text className={styles.bottomHint}>
                {selectedServices.length > 0 ? '点击下一步继续' : '请先选择服务项目'}
              </Text>
            </>
          )}
        </View>

        {currentStep !== 'service' && currentIdx > 0 && (
          <Button
            className={styles.submitBtn}
            style={{ background: '#E5E7EB', color: '#6B7280', boxShadow: 'none', padding: '24rpx 32rpx' }}
            onClick={handlePrevStep}
          >
            上一步
          </Button>
        )}

        <Button
          className={classnames(
            styles.submitBtn,
            (currentStep === 'service' && selectedServices.length === 0) ||
            (currentStep === 'time' && !selectedTime)
              ? styles.disabled
              : ''
          )}
          onClick={currentStep === 'confirm' ? handleSubmit : handleNextStep}
        >
          {currentStep === 'confirm' ? '提交预约' : '下一步'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default HomePage;
