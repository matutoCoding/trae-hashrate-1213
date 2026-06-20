import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { QueueItem } from '@/types';
import styles from './index.module.scss';

interface QueueDisplayProps {
  callingItem: QueueItem | null;
  waitingItems: QueueItem[];
  servicingItems: QueueItem[];
  onCallNext?: () => void;
  onRecall?: (queueNumber: string) => void;
  onStartService?: (queueNumber: string, stationId: string) => void;
  showActions?: boolean;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({
  callingItem,
  waitingItems,
  servicingItems,
  onCallNext,
  onRecall,
  onStartService,
  showActions = false
}) => {
  return (
    <View className={styles.wrapper}>
      {callingItem && (
        <View className={styles.callingSection}>
          <View className={styles.callingHeader}>
            <View className={styles.callingIcon}>📢</View>
            <Text className={styles.callingLabel}>正在叫号</Text>
            {showActions && onRecall && (
              <View className={styles.recallBtn} onClick={() => onRecall(callingItem.queueNumber)}>
                <Text className={styles.recallText}>再次呼叫</Text>
              </View>
            )}
          </View>

          <View className={styles.callingCard}>
            <View className={styles.callingNumberRow}>
              <Text className={styles.callingNumber}>{callingItem.queueNumber}</Text>
              <View className={styles.callingPulse} />
            </View>
            <Text className={styles.callingName}>{callingItem.customerName}</Text>
            <View className={styles.serviceTags}>
              {callingItem.serviceNames.map((name, idx) => (
                <Text key={idx} className={styles.serviceTag}>{name}</Text>
              ))}
            </View>
            {callingItem.stationId && (
              <View className={styles.stationHint}>
                <Text className={styles.stationHintText}>请前往 {callingItem.stationId.replace('st', '')} 号工位</Text>
              </View>
            )}
            {showActions && onStartService && callingItem.stationId && (
              <View
                className={styles.startServiceBtn}
                onClick={() => onStartService(callingItem.queueNumber, callingItem.stationId!)}
              >
                <Text className={styles.startServiceText}>开始服务</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>服务中 ({servicingItems.length})</Text>
        </View>
        <ScrollView className={styles.servicingScroll} scrollX>
          <View className={styles.servicingRow}>
            {servicingItems.length === 0 ? (
              <View className={styles.emptyMini}>暂无服务中</View>
            ) : (
              servicingItems.map(item => (
                <View key={item.queueNumber} className={styles.servicingCard}>
                  <View className={styles.servicingCode}>{item.stationId?.replace('st', '') || '?'}</View>
                  <Text className={styles.servicingNumber}>{item.queueNumber}</Text>
                  <Text className={styles.servicingName}>{item.customerName}</Text>
                  <View className={styles.servicingProgress}>
                    <View className={styles.progressDot} />
                    <Text className={styles.progressText}>进行中</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>等待中 ({waitingItems.length})</Text>
          {showActions && onCallNext && waitingItems.length > 0 && (
            <View className={styles.callNextBtn} onClick={onCallNext}>
              <Text className={styles.callNextText}>呼叫下一位</Text>
            </View>
          )}
        </View>

        {waitingItems.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎉</Text>
            <Text className={styles.emptyText}>暂无等待顾客</Text>
          </View>
        ) : (
          <View className={styles.waitingList}>
            {waitingItems.map((item, idx) => (
              <View key={item.queueNumber} className={styles.waitingItem}>
                <View className={styles.waitingPosition}>{idx + 1}</View>
                <View className={styles.waitingInfo}>
                  <View className={styles.waitingHeaderRow}>
                    <Text className={styles.waitingNumber}>{item.queueNumber}</Text>
                    <Text className={styles.waitingName}>{item.customerName}</Text>
                  </View>
                  <View className={styles.serviceTagsSmall}>
                    {item.serviceNames.map((name, i) => (
                      <Text key={i} className={styles.serviceTagSmall}>{name}</Text>
                    ))}
                  </View>
                </View>
                <View className={styles.waitingTime}>
                  <Text className={styles.waitingMin}>{item.estimatedWait}</Text>
                  <Text className={styles.waitingMinLabel}>分钟</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default QueueDisplay;
