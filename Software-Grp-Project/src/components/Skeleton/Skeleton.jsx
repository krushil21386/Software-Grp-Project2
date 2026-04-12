import React from 'react';
import styles from './Skeleton.module.css';

/**
 * Reusable skeleton loaders for dashboard pages
 */

export const SkeletonCard = ({ count = 3 }) => (
  <div className={styles.skeletonContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={styles.skeletonCard}>
        <div className={`${styles.skeletonCircle} ${styles.skeletonPulse}`} />
        <div className={styles.skeletonLines}>
          <div className={`${styles.skeletonLine} ${styles.skeletonPulse}`} style={{ width: '70%' }} />
          <div className={`${styles.skeletonLine} ${styles.skeletonPulse}`} style={{ width: '50%' }} />
          <div className={`${styles.skeletonLine} ${styles.skeletonPulse}`} style={{ width: '30%' }} />
        </div>
        <div className={`${styles.skeletonButton} ${styles.skeletonPulse}`} />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className={styles.skeletonPage}>
    {/* Title */}
    <div className={styles.skeletonTitleBlock}>
      <div className={`${styles.skeletonTitle} ${styles.skeletonPulse}`} />
      <div className={`${styles.skeletonSubtitle} ${styles.skeletonPulse}`} />
    </div>

    {/* Stat Cards */}
    <div className={styles.skeletonGrid}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={styles.skeletonStatCard}>
          <div className={`${styles.skeletonStatIcon} ${styles.skeletonPulse}`} />
          <div className={styles.skeletonStatLines}>
            <div className={`${styles.skeletonStatLabel} ${styles.skeletonPulse}`} />
            <div className={`${styles.skeletonStatValue} ${styles.skeletonPulse}`} />
          </div>
        </div>
      ))}
    </div>

    {/* Tab Bar */}
    <div className={styles.skeletonTabBar}>
      <div className={`${styles.skeletonTab} ${styles.skeletonPulse}`} />
      <div className={`${styles.skeletonTab} ${styles.skeletonPulse}`} />
      <div className={`${styles.skeletonTab} ${styles.skeletonPulse}`} />
    </div>

    {/* Content Cards */}
    <SkeletonCard count={3} />
  </div>
);

export const RecordsSkeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonTitleBlock} style={{ alignItems: 'center' }}>
      <div className={`${styles.skeletonTitle} ${styles.skeletonPulse}`} style={{ width: '30%' }} />
      <div className={`${styles.skeletonSubtitle} ${styles.skeletonPulse}`} style={{ width: '45%' }} />
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className={styles.skeletonCard} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className={`${styles.skeletonPulse}`} style={{ width: '25%', height: 24, borderRadius: 8 }} />
          <div className={`${styles.skeletonPulse}`} style={{ width: 80, height: 28, borderRadius: 12 }} />
        </div>
        <div className={`${styles.skeletonPulse}`} style={{ width: '100%', height: 100, borderRadius: 12 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className={`${styles.skeletonPulse}`} style={{ width: 120, height: 36, borderRadius: 10 }} />
          <div className={`${styles.skeletonPulse}`} style={{ width: 120, height: 36, borderRadius: 10 }} />
        </div>
      </div>
    ))}
  </div>
);
