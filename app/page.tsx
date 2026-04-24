import styles from "./page.module.css";
import { LiveClockModule } from "./components/live-clock-module";
import { StorySwitcher } from "./components/story-switcher";

const navItems = ["Work", "Services", "Lab", "About", "Contact"];
const pagerDots = Array.from({ length: 5 }, (_, index) => index);

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.brandLights} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>SND Studio</span>
          </div>

          <nav className={styles.nav} aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item} href="#top">
                {item}
              </a>
            ))}
          </nav>

          <div className={styles.toolbar}>
            <div className={styles.modeToggle} aria-hidden="true">
              <span />
            </div>
            <button type="button" className={styles.projectButton}>
              <span>Start a project</span>
              <span>↗</span>
            </button>
          </div>
        </header>

        <div className={styles.stage}>
          <StorySwitcher />

          <section className={styles.labCard}>
            <div className={styles.labBadge} aria-hidden="true" />
            <div className={styles.labContent}>
              <p className={styles.labTitle}>Experimental Digital Lab</p>
              <p className={styles.labCopy}>
                We explore the intersection of design, technology, and human behavior to build
                meaningful interactions.
              </p>
            </div>
          </section>

          <LiveClockModule />

          <footer className={styles.bottomBar}>
            <div className={styles.bottomMeta}>
              <span className={styles.bottomLabel}>Latest Project</span>
              <span className={styles.bottomDot} aria-hidden="true" />
            </div>

            <div className={styles.bottomProject}>
              <span>Spatial Interface for Mindful Productivity</span>
              <span>↗</span>
            </div>

            <div className={styles.bottomControls}>
              <button type="button" className={styles.arrowButton}>
                ←
              </button>
              <div className={styles.paginationDots} aria-hidden="true">
                {pagerDots.map((dot) => (
                  <span key={dot} />
                ))}
              </div>
              <button type="button" className={styles.arrowButton}>
                →
              </button>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
