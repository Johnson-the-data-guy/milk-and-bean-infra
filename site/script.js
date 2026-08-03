// Mobile nav toggle.

const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("primary-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.getAttribute("data-open") === "true";
    setOpen(!open);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.getAttribute("data-open") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    const isOpen = nav.getAttribute("data-open") === "true";
    if (isOpen && !nav.contains(event.target) && !toggle.contains(event.target)) {
      setOpen(false);
    }
  });

  function setOpen(open) {
    nav.setAttribute("data-open", String(open));
    toggle.setAttribute("aria-expanded", String(open));
  }
}

// Scroll reveal — staggers items within any .reveal-stagger container,
// then fades/settles every .reveal element in as it enters the viewport.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll(".reveal-stagger").forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.style.transitionDelay = `${Math.min(i, 7) * 70}ms`;
  });
});

document.querySelectorAll(".reveal[data-reveal-index]").forEach((el) => {
  el.style.transitionDelay = `${Number(el.dataset.revealIndex) * 120}ms`;
});

const revealEls = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

// Doughnut case arrow buttons — the case itself is native scroll-snap
// (works with trackpad/touch with no JS at all); these are just a
// discoverable nudge for mouse users.

document.querySelectorAll(".donut-case-wrap").forEach((wrapEl) => {
  const track = wrapEl.querySelector(".donut-case");
  const prevBtn = wrapEl.querySelector(".case-prev");
  const nextBtn = wrapEl.querySelector(".case-next");
  if (!track || !prevBtn || !nextBtn) return;

  function stepWidth() {
    const card = track.querySelector(".donut-card");
    return card ? card.getBoundingClientRect().width + 16 : 200;
  }

  prevBtn.addEventListener("click", () => {
    track.scrollBy({ left: -stepWidth(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
  nextBtn.addEventListener("click", () => {
    track.scrollBy({ left: stepWidth(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
});
