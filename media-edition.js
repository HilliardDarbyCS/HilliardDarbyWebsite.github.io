
(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const enabled = () =>
    !preference.matches && !root.classList.contains("motion-off");
  const running = new Set();

  function animate(el, frames, options) {
    if (!enabled() || !el.animate) return;
    const animation = el.animate(frames, {
      duration: 950,
      easing: "cubic-bezier(.2,.7,.2,1)",
      fill: "backwards",
      ...options
    });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  }

  const chapters = [...document.querySelectorAll(".media-chapter")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const copy = entry.target.querySelector(".media-copy");
        const media = entry.target.querySelector(".media-window, .rocket-player");
        if (copy) animate(copy, [
          { opacity: 0, transform: "translateY(30px)" },
          { opacity: 1, transform: "translateY(0)" }
        ]);
        if (media) animate(media, [
          { clipPath: "inset(0 0 12% 0)", opacity: .2 },
          { clipPath: "inset(0 0 0 0)", opacity: 1 }
        ], { duration: 1100 });
      });
    }, { threshold: .12 });
    chapters.forEach(chapter => observer.observe(chapter));
  }

  const windows = [...document.querySelectorAll(".media-window")];
  let scheduled = false;

  function paint() {
    scheduled = false;
    windows.forEach(frame => {
      const box = frame.getBoundingClientRect();
      const offset = enabled()
        ? Math.max(-12, Math.min(12,
            (innerHeight / 2 - box.top - box.height / 2) * .035))
        : 0;
      frame.style.setProperty("--media-y", offset + "px");
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(paint);
  }

  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  new MutationObserver(() => {
    if (!enabled()) running.forEach(animation => animation.cancel());
    schedule();
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
  preference.addEventListener("change", () => {
    if (!enabled()) running.forEach(animation => animation.cancel());
    schedule();
  });
  paint();

  // Videos are intentionally user-controlled and never autoplay.
  const videos = [...document.querySelectorAll(".rocket-player video")];
  videos.forEach(video => {
    video.addEventListener("play", () => {
      videos.forEach(other => {
        if (other !== video) other.pause();
      });
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) videos.forEach(video => video.pause());
  });

  // A failed remote image leaves a readable fallback, not a broken icon.
  document.querySelectorAll("img[data-media-photo]").forEach(img => {
    const fail = () => {
      if (!img.isConnected) return;
      const fallback = document.createElement("div");
      fallback.className = "media-error";
      fallback.textContent = img.alt + " — photograph unavailable.";
      img.replaceWith(fallback);
    };
    img.addEventListener("error", fail, { once: true });
    if (img.complete && img.naturalWidth === 0) fail();
  });
})();
