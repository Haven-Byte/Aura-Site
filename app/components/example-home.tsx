import Image from "next/image";
import { DreamlikeHeroCanvas } from "./dreamlike-hero-canvas";

const heroQuote =
  "Freedom is the courage to be disliked, we are not here to satisfy the expectations of others but to live our own lives. ʢ˶ᵒ ᵕ ˂˶ʡᶻ";

export function ExampleHome() {
  return (
    <main className="min-h-screen">
      <section id="top" className="dreamlike-fullscreenHero">
        <div className="dreamlike-canvasFill">
          <DreamlikeHeroCanvas isInView />
        </div>

        <header className="dreamlike-headerOverlay">
          <div className="dreamlike-navShell">
            <a href="#top" className="nav-pill">
              Daniel D
            </a>
            <nav className="flex items-center gap-2 sm:gap-4">
              <a href="#top" className="nav-pill">
                Work
              </a>
              <a href="mailto:hello@example.com" className="nav-pill">
                Contact
              </a>
            </nav>
          </div>
        </header>

        <div className="dreamlike-sunButtonWrapper">
          <div className="glass-shell dreamlike-toolbarGlass rounded-full">
            <button
              type="button"
              aria-label="Shader controls"
              className="dreamlike-sunButton"
            >
              <Image src="/sun.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </div>

        <div className="dreamlike-glassOverlay dreamlike-glassOverlayFullscreen">
          <div className="glass-shell rounded-[18px] md:rounded-[24px]">
            <div className="dreamlike-glassContent">
              <p className="dreamlike-bioText dreamlike-bioTextFx" data-text={heroQuote}>
                {heroQuote}
              </p>
              <div className="dreamlike-glassFooter">
                <span className="dreamlike-glassFooterText">Create By Wu Xia</span>
                <span className="dreamlike-glassFooterText">2026-4-21 下午五点</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
