"use strict";

(() => {
  const root = document.documentElement;
  const menu = document.getElementById("site-menu");
  const backTop = document.querySelector(".back-top");
  const heroImage = document.querySelector(".home-image");
  const osMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  let userMotionOff = false;
  let observer = null;
  let scrollFrame = null;
  let leaving = false;
  let departureTimer = null;

  const animations = new Set();
  const parallaxImages = [...document.querySelectorAll(".page-photo img")];
  const dividers = [...document.querySelectorAll(".section-divider")];

  try {
    userMotionOff = localStorage.getItem("darby-motion") === "off";
  } catch (_) {}

  const motionEnabled = () => !osMotion.matches && !userMotionOff;

  function play(element, frames, options = {}) {
    if (!motionEnabled() || !element?.animate) return null;

    const animation = element.animate(frames, {
      duration: 800,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "backwards",
      ...options
    });

    animations.add(animation);
    animation.finished.then(
      () => animations.delete(animation),
      () => animations.delete(animation)
    );

    return animation;
  }

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }

  /* Motion preference button */

  const motionButton = document.createElement("button");
  motionButton.type = "button";
  motionButton.className = "motion-toggle";

  const footerContact = document.querySelector(".footer-grid > div");
  footerContact?.append(motionButton);

  function syncMotion() {
    root.classList.toggle("motion-off", !motionEnabled());

    motionButton.disabled = osMotion.matches;
    motionButton.textContent = osMotion.matches
      ? "Motion reduced by device settings"
      : userMotionOff
        ? "Animations off"
        : "Animations on";

    motionButton.setAttribute("aria-pressed", String(motionEnabled()));
    motionButton.setAttribute("aria-label", "Enable site animations");

    if (!motionEnabled()) {
      cancelAnimations();
      observer?.disconnect();
      resetCurtain();

      document.querySelectorAll(".page-photo img").forEach(img => {
        img.style.removeProperty("--photo-y");
      });

      if (heroImage) heroImage.style.transform = "none";

      document.querySelectorAll(".depth-card,.button").forEach(element => {
        [
          "--tilt-x", "--tilt-y", "--mag-x", "--mag-y"
        ].forEach(property => element.style.removeProperty(property));
      });
    }

    scheduleScroll();
  }

  motionButton.addEventListener("click", () => {
    userMotionOff = !userMotionOff;

    try {
      localStorage.setItem("darby-motion", userMotionOff ? "off" : "on");
    } catch (_) {}

    syncMotion();
    if (motionEnabled()) setupReveals();
  });

  osMotion.addEventListener("change", () => {
    syncMotion();
    if (motionEnabled()) setupReveals();
  });

  /* Native menu stays usable without JavaScript. */

  document.addEventListener("click", event => {
    if (menu?.open && !menu.contains(event.target)) {
      menu.open = false;
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu?.open) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
  });

  menu?.addEventListener("toggle", () => {
    if (!menu.open) return;

    const panel = menu.querySelector(".menu-panel");
    play(panel, [
      { opacity: 0, transform: "translateY(-14px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 420 });

    menu.querySelectorAll(".menu-group").forEach((group, i) => {
      play(group, [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 550, delay: Math.min(i * 40, 280) });
    });
  });

  /* Current-page indicator */

  const currentFile = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".primary a,.related a").forEach(anchor => {
    const destination = new URL(anchor.href).pathname.split("/").pop();
    if (destination === currentFile) {
      anchor.setAttribute("aria-current", "page");
    }
  });

  /* Split display headings into independently animated words.
     Existing spans and line breaks are preserved. */

  function splitHeading(heading) {
    if (heading.dataset.wordsReady) return;

    const clone = heading.cloneNode(true);
    clone.querySelectorAll("br").forEach(br => {
      br.replaceWith(document.createTextNode(" "));
    });

    const accessibleLabel = clone.textContent.replace(/\s+/g, " ").trim();
    heading.setAttribute("aria-label", accessibleLabel);

    const walker = document.createTreeWalker(
      heading,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();

      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;

        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          return;
        }

        const mask = document.createElement("span");
        mask.className = "word-mask";
        mask.setAttribute("aria-hidden", "true");

        const inner = document.createElement("span");
        inner.className = "word-inner";
        inner.textContent = part;

        mask.append(inner);
        fragment.append(mask);
      });

      node.replaceWith(fragment);
    });

    heading.dataset.wordsReady = "true";
  }

  const displayHeadings = [
    ...document.querySelectorAll(
      ".home-copy h1,.mast h1,.section-heading h2,.club-panel h2"
    )
  ];

  displayHeadings.forEach(splitHeading);

  function animateHeading(heading) {
    if (heading.dataset.animated === "true") return;
    heading.dataset.animated = "true";

    heading.querySelectorAll(".word-inner").forEach((word, index) => {
      play(word, [
        {
          transform: "translateY(115%) rotate(5deg)",
          opacity: 0
        },
        {
          transform: "translateY(0) rotate(0deg)",
          opacity: 1
        }
      ], {
        duration: 1000,
        delay: Math.min(index * 65, 450)
      });
    });
  }

  /* Section, image, and card entrances */

  function revealElement(element) {
    if (element.dataset.revealed === "true") return;
    element.dataset.revealed = "true";

    if (element.matches("h1,h2")) {
      animateHeading(element);
      return;
    }

    if (element.matches(".page-photo")) {
      play(element, [
        {
          clipPath: "inset(0 0 100% 0)",
          opacity: .3
        },
        {
          clipPath: "inset(0 0 0% 0)",
          opacity: 1
        }
      ], { duration: 1050 });
      return;
    }

    if (element.matches(".section-heading,.club-panel")) {
      element.querySelectorAll("h2").forEach(animateHeading);
      return;
    }

    if (element.matches(".block")) {
      const title = element.querySelector(":scope > h2");
      if (title) {
        play(title, [
          { opacity: 0, transform: "translateY(22px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 650 });
      }

      const children = element.querySelectorAll(
        ":scope > p, .resource, .person, .program, .table-wrap, .story"
      );

      children.forEach((child, index) => {
        /* Animate individual children rather than hiding a large section. */
        if (child.dataset.revealed === "true") return;
        child.dataset.revealed = "true";

        const frames = child.matches(".person,.program,.story")
          ? [
              { opacity: 0, translate: "0 35px" },
              { opacity: 1, translate: "0 0" }
            ]
          : [
              { opacity: 0, transform: "translateY(20px)" },
              { opacity: 1, transform: "translateY(0)" }
            ];

        play(child, frames, {
          duration: 750,
          delay: Math.min(index * 45, 300)
        });
      });

      return;
    }

    play(element, [
      { opacity: 0, translate: "0 32px" },
      { opacity: 1, translate: "0 0" }
    ], {
      duration: 850,
      delay: Number(element.dataset.delay || 0)
    });
  }

  function setupReveals() {
    observer?.disconnect();

    if (!motionEnabled() || !("IntersectionObserver" in window)) return;

    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: .05,
      rootMargin: "0px 0px -20px 0px"
    });

    document.querySelectorAll(
      ".feature-grid .feature,.news-section .story"
    ).forEach((element, index) => {
      element.dataset.delay = String((index % 3) * 90);
    });

    const targets = new Set([
      ...document.querySelectorAll(".reveal"),
      ...document.querySelectorAll(".page-photo"),
      ...displayHeadings
    ]);

    targets.forEach(element => {
      /*
        Cards nested in content blocks receive their stagger from
        the block, avoiding duplicate transform animations.
      */
      if (
        element.matches(".program,.person,.story") &&
        element.closest(".block")
      ) return;

      if (element.dataset.revealed !== "true") {
        observer.observe(element);
      }
    });
  }

  /* Never leave keyboard-focused content in the middle of an entrance. */

  document.addEventListener("focusin", event => {
    const target = event.target;

    [...animations].forEach(animation => {
      const animatedElement = animation.effect?.target;

      if (
        animatedElement instanceof Element &&
        (animatedElement === target || animatedElement.contains(target))
      ) {
        animation.cancel();
      }
    });
  });

  /* Pointer effects, limited to precise-pointer desktop devices. */

  function pointerEffectsAllowed() {
    return motionEnabled() && finePointer.matches && innerWidth > 800;
  }

  document.querySelectorAll(".button").forEach(button => {
    button.addEventListener("pointermove", event => {
      if (!pointerEffectsAllowed()) return;

      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .1;
      const y = (event.clientY - rect.top - rect.height / 2) * .15;

      button.style.setProperty("--mag-x", `${Math.max(-8, Math.min(8, x))}px`);
      button.style.setProperty("--mag-y", `${Math.max(-5, Math.min(5, y))}px`);
    });

    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--mag-x", "0px");
      button.style.setProperty("--mag-y", "0px");
    });
  });

  document.querySelectorAll(
    ".feature,.program,.person,.story"
  ).forEach(card => {
    card.classList.add("depth-card");

    card.addEventListener("pointermove", event => {
      if (!pointerEffectsAllowed()) return;

      const rect = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

      card.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
      card.style.setProperty("--tilt-y", `${(x - 0.5) * 5}deg`);
      card.style.setProperty("--shine-x", `${x * 100}%`);
      card.style.setProperty("--shine-y", `${y * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });

  /* Scroll-linked motion: one animation frame per scroll update. */

  function paintScroll() {
    const y = scrollY;
    const height = innerHeight;
    const total = root.scrollHeight - height;

    root.style.setProperty(
      "--progress",
      total > 0 ? Math.max(0, Math.min(1, y / total)) : 0
    );

    if (backTop) backTop.hidden = y < 650;

    if (motionEnabled()) {
      if (heroImage) {
        heroImage.style.transform =
          `translate3d(0,${Math.min(90, y * .11)}px,0) scale(1.035)`;
      }

      parallaxImages.forEach(img => {
        const rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > height) return;

        const center = rect.top + rect.height / 2;
        const distance = (center - height / 2) / height;
        const shift = Math.max(-12, Math.min(12, -distance * 18));

        img.style.setProperty("--photo-y", `${shift}px`);
      });

      dividers.forEach(divider => {
        const rect = divider.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > height) return;

        const amount = Math.max(-12, Math.min(12, (rect.top / height - .5) * 24));
        const labels = divider.querySelectorAll("span");

        labels.forEach((label, index) => {
          label.style.transform =
            `translateX(${index === 0 ? amount : -amount}px)`;
        });
      });
    } else {
      dividers.forEach(divider => {
        divider.querySelectorAll("span").forEach(label => {
          label.style.transform = "none";
        });
      });
    }

    scrollFrame = null;
  }

  function scheduleScroll() {
    if (scrollFrame === null) {
      scrollFrame = requestAnimationFrame(paintScroll);
    }
  }

  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll);
  addEventListener("load", scheduleScroll);

  backTop?.addEventListener("click", () => {
    scrollTo({
      top: 0,
      behavior: motionEnabled() ? "smooth" : "instant"
    });
  });

  /* Retain the generated site's directory search. */

  const search = document.getElementById("page-search");

  if (search) {
    const entries = [...document.querySelectorAll(".directory-results .resource")];
    const count = document.getElementById("result-count");
    const empty = document.getElementById("no-results");

    function filterPages() {
      const query = search.value.trim().toLowerCase();
      let visible = 0;

      entries.forEach(entry => {
        const matches = entry.textContent.toLowerCase().includes(query);
        entry.hidden = !matches;
        if (matches) visible++;
      });

      if (count) count.textContent = `${visible} matching pages and resources`;
      if (empty) empty.hidden = visible !== 0;
      scheduleScroll();
    }

    search.addEventListener("input", filterPages);
    filterPages();
  }

  /* Cross-page transitions preserve actual separate HTML pages. */

  const curtain = document.createElement("div");
  curtain.className = "page-curtain";
  curtain.setAttribute("aria-hidden", "true");

  const curtainLabel = document.createElement("span");
  curtainLabel.textContent = "DARBY.";
  curtain.append(curtainLabel);
  document.body.append(curtain);

  function resetCurtain() {
    curtain?.classList.remove("is-covering");
    curtain?.getAnimations().forEach(animation => animation.cancel());
    if (curtain) curtain.style.transform = "translateY(105%)";
  }

  /*
    Only intercept ordinary clicks on relative HTML page links.
    External links, downloads, fragments, modified clicks, and new-tab
    links keep their normal browser behavior.
  */
  document.addEventListener("click", event => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
      !motionEnabled()
    ) return;

    const anchor = event.target.closest("a[href]");
    if (!anchor || anchor.hasAttribute("download")) return;
    if (anchor.target && anchor.target !== "_self") return;

    const raw = anchor.getAttribute("href");

    if (
      !raw ||
      raw.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(raw) ||
      raw.startsWith("//")
    ) return;

    const destination = new URL(raw, location.href);

    if (!destination.pathname.endsWith(".html")) return;
    if (destination.origin !== location.origin) return;
    if (
      destination.pathname === location.pathname &&
      destination.search === location.search
    ) return;

    if (leaving) {
      event.preventDefault();
      return;
    }

    if (!curtain.animate) return;

    event.preventDefault();
    leaving = true;
    if (menu) menu.open = false;

    /*
      Navigation is scheduled independently of animation completion,
      so an interrupted animation cannot trap the visitor.
    */
    departureTimer = setTimeout(() => {
      location.assign(destination.href);
    }, 360);

    curtain.classList.add("is-covering");

    try {
      sessionStorage.setItem("darby-arrival", destination.pathname);
    } catch (_) {}

    curtain.animate([
      { transform: "translateY(105%)" },
      { transform: "translateY(0%)" }
    ], {
      duration: 350,
      easing: "cubic-bezier(.76,0,.24,1)",
      fill: "forwards"
    });
  });

  /* Reveal the destination after an internal page transition. */

  let arrival = false;
  try {
    arrival = sessionStorage.getItem("darby-arrival") === location.pathname;
    sessionStorage.removeItem("darby-arrival");
  } catch (_) {}

  function showArrival() {
    if (!arrival || !motionEnabled() || !curtain.animate) return;

    curtain.classList.add("is-covering");

    const animation = curtain.animate([
      { transform: "translateY(0%)" },
      { transform: "translateY(-105%)" }
    ], {
      duration: 600,
      easing: "cubic-bezier(.76,0,.24,1)",
      fill: "forwards"
    });

    animation.finished.then(resetCurtain, resetCurtain);
  }

  addEventListener("pageshow", event => {
    if (event.persisted) {
      clearTimeout(departureTimer);
      leaving = false;
      resetCurtain();
    }
    scheduleScroll();
  });

  /* Recover from a cancelled browser navigation as well. */
  addEventListener("pagehide", () => {
    clearTimeout(departureTimer);
  });

  syncMotion();
  setupReveals();
  showArrival();
  paintScroll();
})();
