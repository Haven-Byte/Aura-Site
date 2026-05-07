"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import styles from "../page.module.css";

const STORY_SHEET_SPRING = {
  type: "spring" as const,
  stiffness: 118,
  damping: 22,
  mass: 0.92,
  restDelta: 0.18,
  restSpeed: 0.18,
};
const TIMELINE_DOT_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};
const TIMELINE_LABEL_SIZE = 13;
const TIMELINE_GAP = 24;
const TIMELINE_STEP = TIMELINE_LABEL_SIZE + TIMELINE_GAP;
const TIMELINE_DOT_SIZE = 16;
const TIMELINE_DOT_TOP_BASE = TIMELINE_LABEL_SIZE / 2 - TIMELINE_DOT_SIZE / 2;

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
    author: "F. Scott Fitzgerald",
    title: "The Great Gatsby",
    copy:
      "So we beat on, boats against the current, borne back ceaselessly into the past.",
    buttonLabel: "Read the ending",
    language: "en",
    enabled: true,
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
    </>
  );
}

type StoryTransition = {
  id: number;
  fromIndex: number;
  toIndex: number;
  direction: 1 | -1;
};

export function StorySwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<StoryTransition | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const transitionIdRef = useRef(0);
  const activeStory = stories[activeIndex];
  const buttonStory = transition ? stories[transition.toIndex] : activeStory;

  const handleSelect = (nextIndex: number) => {
    if (!stories[nextIndex]?.enabled || nextIndex === activeIndex || transition) {
      return;
    }

    const nextDirection = nextIndex > activeIndex ? 1 : -1;

    if (shouldReduceMotion) {
      setActiveIndex(nextIndex);
      return;
    }

    transitionIdRef.current += 1;
    setTransition({
      id: transitionIdRef.current,
      fromIndex: activeIndex,
      toIndex: nextIndex,
      direction: nextDirection,
    });
    setActiveIndex(nextIndex);
  };

  return (
    <section className={styles.storyPanel}>
      <aside className={styles.timeline}>
        <div className={styles.timelineTrack}>
          <motion.span
            className={styles.timelineDot}
            initial={false}
            animate={{
              top: `${TIMELINE_DOT_TOP_BASE + (shouldReduceMotion ? 0 : activeIndex * TIMELINE_STEP)}px`,
            }}
            transition={shouldReduceMotion ? { duration: 0 } : TIMELINE_DOT_SPRING}
          >
            <span className={styles.timelineDotCore} />
          </motion.span>
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
            {transition ? (
              <motion.div
                key={transition.id}
                className={styles.storyTrackStack}
                initial={{ y: transition.direction > 0 ? "0%" : "-100%" }}
                animate={{ y: transition.direction > 0 ? "-100%" : "0%" }}
                transition={STORY_SHEET_SPRING}
                onAnimationComplete={() => {
                  setTransition((current) =>
                    current?.id === transition.id ? null : current,
                  );
                }}
              >
                {transition.direction > 0 ? (
                  <>
                    <div className={styles.storyTrackFrame}>
                      <div className={styles.storySheet}>
                        <StoryCard story={stories[transition.fromIndex]} />
                      </div>
                    </div>
                    <div className={styles.storyTrackFrame}>
                      <div className={styles.storySheet}>
                        <StoryCard story={stories[transition.toIndex]} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.storyTrackFrame}>
                      <div className={styles.storySheet}>
                        <StoryCard story={stories[transition.toIndex]} />
                      </div>
                    </div>
                    <div className={styles.storyTrackFrame}>
                      <div className={styles.storySheet}>
                        <StoryCard story={stories[transition.fromIndex]} />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <div className={styles.storyStaticFrame}>
                <div className={styles.storySheet}>
                  <StoryCard story={activeStory} />
                </div>
              </div>
            )}
          </div>

          <div className={styles.heroButtonDock}>
            <button type="button" className={styles.heroButton}>
              <span>{buttonStory.buttonLabel}</span>
              <span>↗</span>
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
