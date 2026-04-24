"use client";

import { useEffect, useMemo, useState } from "react";
import { buildClockSnapshot } from "./clock-snapshot";
import { ClockVisual } from "./clock-visual";
import styles from "../page.module.css";

export function LiveClockModule() {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const syncTime = () => {
      setTimestamp(Date.now());
    };

    syncTime();
    const intervalId = window.setInterval(syncTime, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const snapshot = useMemo(
    () => (timestamp === null ? null : buildClockSnapshot(timestamp)),
    [timestamp]
  );

  return (
    <>
      <aside className={styles.dateCard} aria-hidden={!snapshot} style={!snapshot ? { opacity: 0 } : undefined}>
        <p className={styles.dateMonth}>{snapshot?.month ?? ""}</p>
        <p className={styles.dateNumber}>{snapshot?.day ?? ""}</p>
        <p className={styles.dateYear}>{snapshot?.year ?? ""}</p>
      </aside>
      <div className={styles.clockWrap} aria-hidden="true">
        <ClockVisual angles={snapshot?.angles ?? null} isReady={snapshot !== null} />
      </div>
    </>
  );
}
