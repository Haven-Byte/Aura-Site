"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties } from "react";
import styles from "../page.module.css";

const STORY_TRANSITION_MS = 560;
const STORY_EASE = [0.16, 1, 0.3, 1] as const;

type Story = {
  id: string;
  author: string;
  title: string;
  copy: string;
  buttonLabel: string;
  language?: "en" | "zh";
  enabled: boolean;
};

const stories: Story[] = [
  {
    id: "01",
    author: "Jorge Luis Borges",
    title: "A New Refutation of Time",
    copy:
      "Time is not something you possess; it is what you are made of. It carries you away, yet you yourself are that river.",
    buttonLabel: "Read the essay",
    language: "en",
    enabled: true,
  },
  {
    id: "02",
    author: "Saint Augustine",
    title: "Confessions",
    copy:
      "What is time? If no one asks me, I know; if I try to explain it, I do not. Augustine ties time to memory, attention, and expectation.",
    buttonLabel: "Read Book XI",
    language: "en",
    enabled: true,
  },
  {
    id: "03",
    author: "",
    title: "",
    copy: "",
    buttonLabel: "",
    enabled: false,
  },
];

type StoryCardProps = {
  story: Story;
};

function StoryCard({ story }: StoryCardProps) {
  return (
    <>
      <div className={styles.heroEyebrow}>
        <span className={styles.heroEyebrowName}>{story.author}</span>
      </div>

      <div className={styles.heroHeading}>
        <h1 className={styles.heroTitle} lang={story.language === "zh" ? "zh-CN" : undefined}>
          {story.title}
        </h1>
        <div className={styles.heroDash} aria-hidden="true" />
      </div>

      <p
        className={`${styles.heroCopy} ${story.language === "zh" ? styles.heroCopyZh : ""}`}
        lang={story.language === "zh" ? "zh-CN" : undefined}
      >
        {story.copy}
      </p>

      <button type="button" className={styles.heroButton}>
        <span>{story.buttonLabel}</span>
        <span>↗</span>
      </button>
    </>
  );
}

export function StorySwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const shouldReduceMotion = useReducedMotion();
  const activeStory = stories[activeIndex];

  const handleSelect = (nextIndex: number) => {
    if (!stories[nextIndex]?.enabled || nextIndex === activeIndex) {
      return;
    }

    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const panelStyle = {
    "--timeline-active-index": activeIndex,
    "--story-card-duration": `${STORY_TRANSITION_MS}ms`,
  } as CSSProperties;

  const getInitialY = (currentDirection: 1 | -1) => {
    if (shouldReduceMotion) {
      return "0%";
    }

    return currentDirection > 0 ? "18%" : "-18%";
  };

  const getExitY = (currentDirection: 1 | -1) => {
    if (shouldReduceMotion) {
      return "0%";
    }

    return currentDirection > 0 ? "-18%" : "18%";
  };

  return (
    <section className={styles.storyPanel} style={panelStyle}>
      <aside className={styles.timeline}>
        <div className={styles.timelineTrack}>
          <span className={styles.timelineDot} />
        </div>

        <div className={styles.timelineLabels}>
          {stories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              className={`${styles.timelineButton} ${
                activeIndex === index ? styles.timelineButtonActive : ""
              } ${!story.enabled ? styles.timelineButtonDisabled : ""}`}
              onClick={() => handleSelect(index)}
              disabled={!story.enabled}
              aria-current={activeIndex === index ? "step" : undefined}
            >
              {story.id}
            </button>
          ))}
        </div>
      </aside>

      <div className={styles.heroViewport}>
        <article className={styles.heroCard}>
          <div className={styles.storySheetViewport}>
            <AnimatePresence initial={false} custom={direction} mode="sync">
              <motion.div
                key={activeStory.id}
                className={styles.storySheet}
                custom={direction}
                initial={(currentDirection: 1 | -1) => ({
                  y: getInitialY(currentDirection),
                  opacity: shouldReduceMotion ? 1 : 0.92,
                })}
                animate={{ y: "0%", opacity: 1 }}
                exit={(currentDirection: 1 | -1) => ({
                  y: getExitY(currentDirection),
                  opacity: shouldReduceMotion ? 1 : 0.92,
                })}
                transition={{
                  duration: shouldReduceMotion ? 0 : STORY_TRANSITION_MS / 1000,
                  ease: STORY_EASE,
                }}
              >
                <StoryCard story={activeStory} />
              </motion.div>
            </AnimatePresence>
          </div>
        </article>
      </div>
    </section>
  );
}
