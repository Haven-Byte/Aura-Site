import { useId } from "react";
import type { ClockAngles } from "./clock-snapshot";
import styles from "./clock-visual.module.css";

type ClockVisualProps = {
  angles: ClockAngles | null;
  isReady: boolean;
};

type Point = {
  x: number;
  y: number;
};

const VIEWBOX = 900;
const CENTER = { x: 450, y: 450 };
const OUTER_RADIUS = 330;
const DIAL_RADIUS = 210;
const NODE_RADIUS = 16;
const NUMERALS = [
  { label: "XII", x: CENTER.x, y: 220 },
  { label: "III", x: 706, y: CENTER.y + 4 },
  { label: "VI", x: CENTER.x, y: 708 },
  { label: "IX", x: 194, y: CENTER.y + 4 },
];
const CARDINAL_NODES = [
  { x: CENTER.x, y: CENTER.y - OUTER_RADIUS },
  { x: CENTER.x + OUTER_RADIUS, y: CENTER.y },
  { x: CENTER.x, y: CENTER.y + OUTER_RADIUS },
  { x: CENTER.x - OUTER_RADIUS, y: CENTER.y },
];
const TICKS = Array.from({ length: 60 }, (_, index) => index);

function roundValue(value: number) {
  return Math.round(value * 1000) / 1000;
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number): Point {
  const radians = ((degrees - 90) * Math.PI) / 180;

  return {
    x: roundValue(cx + Math.cos(radians) * radius),
    y: roundValue(cy + Math.sin(radians) * radius),
  };
}

function rotateAroundCenter(angle: number) {
  return `rotate(${angle} ${CENTER.x} ${CENTER.y})`;
}

export function ClockVisual({ angles, isReady }: ClockVisualProps) {
  const id = useId().replace(/:/g, "");
  const dialSurfaceId = `clock-dial-surface-${id}`;
  const wellSurfaceId = `clock-well-surface-${id}`;
  const handSurfaceId = `clock-hand-surface-${id}`;
  const nodeSurfaceId = `clock-node-surface-${id}`;
  const capSurfaceId = `clock-cap-surface-${id}`;
  const dialShadowId = `clock-dial-shadow-${id}`;
  const detailShadowId = `clock-detail-shadow-${id}`;
  const hourAngle = angles?.hour ?? 0;
  const minuteAngle = angles?.minute ?? 0;
  const secondAngle = angles?.accent ?? 0;

  return (
    <div className={`${styles.root} ${isReady ? styles.ready : ""}`}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={dialSurfaceId} cx="36%" cy="28%" r="78%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.99)" />
            <stop offset="54%" stopColor="rgba(246, 249, 254, 0.97)" />
            <stop offset="100%" stopColor="rgba(234, 239, 248, 0.95)" />
          </radialGradient>
          <radialGradient id={wellSurfaceId} cx="42%" cy="38%" r="80%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.78)" />
            <stop offset="100%" stopColor="rgba(234, 239, 248, 0.9)" />
          </radialGradient>
          <linearGradient id={handSurfaceId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(241, 245, 252, 0.98)" />
            <stop offset="100%" stopColor="rgba(191, 200, 219, 0.9)" />
          </linearGradient>
          <linearGradient id={nodeSurfaceId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(252, 253, 255, 0.98)" />
            <stop offset="100%" stopColor="rgba(226, 232, 243, 0.96)" />
          </linearGradient>
          <linearGradient id={capSurfaceId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(252, 253, 255, 0.98)" />
            <stop offset="100%" stopColor="rgba(221, 228, 240, 0.96)" />
          </linearGradient>
          <filter id={dialShadowId} x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="-10" dy="-10" stdDeviation="12" floodColor="#ffffff" floodOpacity="0.84" />
            <feDropShadow dx="20" dy="22" stdDeviation="16" floodColor="#d7ddea" floodOpacity="0.68" />
          </filter>
          <filter id={detailShadowId} x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="-5" dy="-5" stdDeviation="6" floodColor="#ffffff" floodOpacity="0.78" />
            <feDropShadow dx="6" dy="7" stdDeviation="7" floodColor="#d6ddea" floodOpacity="0.56" />
          </filter>
        </defs>

        <g className={styles.outerLayer}>
          <circle className={styles.outerRing} cx={CENTER.x} cy={CENTER.y} r={OUTER_RADIUS} />
          <circle className={styles.outerHighlight} cx={CENTER.x} cy={CENTER.y} r="286" />

          {CARDINAL_NODES.map((node, index) => (
            <g key={`${node.x}-${node.y}-${index}`}>
              <circle
                className={styles.outerNode}
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={`url(#${nodeSurfaceId})`}
                filter={`url(#${detailShadowId})`}
              />
              <circle className={styles.outerNodeCore} cx={node.x} cy={node.y} r="4.8" />
            </g>
          ))}
        </g>

        <g className={styles.romanLayer}>
          {NUMERALS.map((numeral) => (
            <text key={numeral.label} className={styles.numeral} x={numeral.x} y={numeral.y}>
              {numeral.label}
            </text>
          ))}
        </g>

        <g className={styles.dialLayer}>
          <circle
            className={styles.dialFace}
            cx={CENTER.x}
            cy={CENTER.y}
            r={DIAL_RADIUS}
            fill={`url(#${dialSurfaceId})`}
            filter={`url(#${dialShadowId})`}
          />
          <circle className={styles.dialInnerRing} cx={CENTER.x} cy={CENTER.y} r="130" />
          <circle className={styles.dialWell} cx={CENTER.x} cy={CENTER.y} r="34" fill={`url(#${wellSurfaceId})`} />
        </g>

        <g className={styles.tickLayer}>
          {TICKS.map((tick) => {
            const angle = tick * 6;
            const isCardinal = tick % 15 === 0;
            const isMajor = tick % 5 === 0;
            const outer = polarPoint(CENTER.x, CENTER.y, 178, angle);
            const inner = polarPoint(
              CENTER.x,
              CENTER.y,
              isCardinal ? 148 : isMajor ? 154 : 162,
              angle
            );

            return (
              <line
                key={tick}
                className={
                  isCardinal ? styles.tickCardinal : isMajor ? styles.tickMajor : styles.tickMinor
                }
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
              />
            );
          })}
        </g>

        <g className={styles.handLayer}>
          <g transform={rotateAroundCenter(hourAngle)}>
            <rect
              className={styles.handHour}
              x={CENTER.x - 2.4}
              y={CENTER.y - 150}
              width="4.8"
              height="154"
              rx="2.4"
              fill={`url(#${handSurfaceId})`}
              filter={`url(#${detailShadowId})`}
            />
          </g>
          <g transform={rotateAroundCenter(minuteAngle)}>
            <rect
              className={styles.handMinute}
              x={CENTER.x - 1.7}
              y={CENTER.y - 188}
              width="3.4"
              height="194"
              rx="1.7"
              fill={`url(#${handSurfaceId})`}
              filter={`url(#${detailShadowId})`}
            />
          </g>
          <g transform={rotateAroundCenter(secondAngle)}>
            <line
              className={styles.handSecond}
              x1={CENTER.x}
              y1={CENTER.y + 22}
              x2={CENTER.x}
              y2={CENTER.y - 186}
            />
            <circle
              className={styles.handSecondTip}
              cx={CENTER.x}
              cy={CENTER.y - 186}
              r="4.6"
              filter={`url(#${detailShadowId})`}
            />
          </g>
          <circle
            className={styles.centerCap}
            cx={CENTER.x}
            cy={CENTER.y}
            r="22"
            fill={`url(#${capSurfaceId})`}
            filter={`url(#${detailShadowId})`}
          />
          <circle className={styles.centerCore} cx={CENTER.x} cy={CENTER.y} r="5.2" />
        </g>
      </svg>
    </div>
  );
}
