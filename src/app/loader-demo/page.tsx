'use client';

import React from 'react';
import AnimatedLoader from '@/components/AnimatedLoader';
import styles from './page.module.css';

export default function LoaderDemo() {
  return (
    <div className={styles.container}>
      <div className={styles.darkSection}>
        <h2>Dark Background (Original Style)</h2>
        <div className={styles.loaderBox}>
          <AnimatedLoader size="large" color="#4a9eff" />
        </div>
      </div>

      <div className={styles.lightSection}>
        <h2>Light Background Variations</h2>
        <div className={styles.gridContainer}>
          <div className={styles.demoBox}>
            <h3>Small</h3>
            <AnimatedLoader size="small" />
          </div>
          <div className={styles.demoBox}>
            <h3>Medium</h3>
            <AnimatedLoader size="medium" />
          </div>
          <div className={styles.demoBox}>
            <h3>Large</h3>
            <AnimatedLoader size="large" />
          </div>
        </div>

        <h2>Custom Colors</h2>
        <div className={styles.gridContainer}>
          <div className={styles.demoBox}>
            <AnimatedLoader color="#10b981" />
          </div>
          <div className={styles.demoBox}>
            <AnimatedLoader color="#f59e0b" />
          </div>
          <div className={styles.demoBox}>
            <AnimatedLoader color="#ef4444" />
          </div>
        </div>
      </div>

      <div className={styles.fullscreenDemo}>
        <h2>Fullscreen Loading (Click to view)</h2>
        <button 
          className={styles.fullscreenButton}
          onClick={() => {
            const elem = document.getElementById('fullscreenLoader');
            if (elem) {
              elem.style.display = 'flex';
              setTimeout(() => {
                elem.style.display = 'none';
              }, 3000);
            }
          }}
        >
          Show Fullscreen Loader
        </button>
      </div>

      <div id="fullscreenLoader" className={styles.fullscreenLoader}>
        <AnimatedLoader size="large" color="#ffffff" />
      </div>
    </div>
  );
}