import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { QueueItem } from '@/types';
import styles from './index.module.scss';

interface QueueDisplayProps {
  callingItem: QueueItem | null;
  waitingItems: QueueItem[];
  servicingItems: QueueItem[];
  holdItems: QueueItem[];
  stations: { id: string; code: string; name: string }[];
  onCallNext?: () => void;
  onRecall?: (queueNumber: string) => void;
  onStartService?: (queueNumber: string, stationId: string) => void;
  onHold?: (queueNumber: string) => void;
  onRequeue?: (queueNumber: string) => void;
  onNoShow?: (queueNumber: string) => void;
  onRestoreHold?: (queueNumber: string) => void;
  onComplete?: (queueNumber: string) => void;
  onOpenStation?: (stationId: string) => void;
  showActions?: boolean;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({
  callingItem,
  waitingItems,
  servicingItems,
  holdItems,
  stations,
  onCallNext,
  onRecall,
  onStartService,
  onHold,
  onRequeue,
  onNoShow,
  onRestoreHold,
  onComplete,
  onOpenStation,
  showActions = false
}) => {
  const getStationCode = (stationId?: string) => {
    if (!stationId) return '';
    const s = stations.find(st => st.id === stationId);
    return s ? s.code : stationId.replace('st', '');
  };

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
              <View className={styles.stationHint} onClick={() => onOpenStation?.(callingItem.stationId!)}>
                <Text className={styles.stationHintText}>请前往 {getStationCode(callingItem.stationId)} 工位</Text>
              </View>
            )}
            {showActions && callingItem.stationId && (
              <View className={styles.callingActions}>
                {onStartService && (
                  <View
                    className={styles.startServiceBtn}
                    onClick={() => onStartService(callingItem.queueNumber, callingItem.stationId!)}
                  >
                    <Text className={styles.startServiceText}>开始服务</Text>
                  </View>
                )}
                {onHold && (
                  <View className={styles.holdBtn} onClick={() => onHold(callingItem.queueNumber)}>
                    <Text className={styles.actionBtnText}>暂不服务</Text>
                  </View>
                )}
                {onRequeue && (
                  <View className={styles.requeueBtn} onClick={() => onRequeue(callingItem.queueNumber)}>
                    <Text className={styles.actionBtnText}>重新排队</Text>
                  </View>
                )}
                {onNoShow && (
                  <View className={styles.noshowBtn} onClick={() => onNoShow(callingItem.queueNumber)}>
                    <Text className={styles.actionBtnText}>未到店</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {holdItems.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>暂不服务 ({holdItems.length})</Text>
          </View>
          <View className={styles.holdList}>
            {holdItems.map(item => (
              <View key={item.queueNumber} className={styles.holdItem}>
                <View className={styles.holdInfo}>
                  <Text className={styles.holdNumber}>{item.queueNumber}</Text>
                  <Text className={styles.holdName}>{item.customerName}</Text>
                </View>
                {showActions && onRestoreHold && (
                  <View className={styles.restoreBtn} onClick={() => onRestoreHold(item.queueNumber)}>
                    <Text className={styles.actionBtnText}>恢复排队</Text>
                  </View>
                )}
                {showActions && onRequeue && (
                  <View className={styles.requeueBtn} style={{ marginLeft: 8 }} onClick={() => onRequeue(item.queueNumber)}>
                    <Text className={styles.actionBtnText}>重排</Text>
                  </View>
                )}
                {showActions && onNoShow && (
                  <View className={styles.noshowBtn} style={{ marginLeft: 8 }} onClick={() => onNoShow(item.queueNumber)}>
                    <Text className={styles.actionBtnText}>未到</Text>
                  </View>
                )}
              </View>
            ))}
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
                  <View
                    className={styles.servicingCode}
                    onClick={() => onOpenStation?.(item.stationId!)}
                  >
                    {getStationCode(item.stationId)}
                  </View>
                  <Text className={styles.servicingNumber}>{item.queueNumber}</Text>
                  <Text className={styles.servicingName}>{item.customerName}</Text>
                  <View className={styles.servicingProgress}>
                    <View className={styles.progressDot} />
                    <Text className={styles.progressText}>进行中</Text>
                  </View>
                  {showActions && onComplete && (
                    <View className={styles.completeBtn} onClick={() => onComplete(item.queueNumber)}>
                      <Text className={styles.actionBtnText}>完成</Text>
                    </View>
                  )}
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
