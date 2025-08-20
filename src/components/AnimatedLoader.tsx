import React from 'react';
import styles from './AnimatedLoader.module.css';

interface AnimatedLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({ 
  size = 'medium',
  color = '#007bff' 
}) => {
  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  };

  return (
    <div className={styles.loaderContainer}>
      <div className={`${styles.loader} ${sizeClasses[size]}`}>
        <div className={styles.spinner} style={{ borderTopColor: color }}>
          <div className={styles.innerCircle}></div>
        </div>
        <div className={styles.pulseRing} style={{ borderColor: color }}></div>
      </div>
    </div>
  );
};

export default AnimatedLoader;