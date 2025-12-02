// script.js
// Complete UI behaviour for Vikash's portfolio page
// - Nav hamburger + accessible toggling
// - Smooth scrolling with active section highlight
// - Floating avatar parallax effect
// - Project card modal preview
// - Contact form handling (client-side validation & fake send)
// - Small toast notifications
// - Keyboard accessibility (Esc to close modals/menus)

document.addEventListener('DOMContentLoaded', () => {
  initHamburgerNav();
  initSmoothScrollAndActiveLinks();
  initFloatingAvatarParallax();
  initProjectPreviews();
  initContactForm();
  initScrollIndicator();
  initAccessibilityShortcuts();
});

/* --------------------------
   NAV / HAMBURGER
   -------------------------- */
function initHamburgerNav() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  if (!hamburger || !navMenu) return;

  // Toggle menu (mobile)
  hamburger.addEventListener('click', () => {
    const active = navMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', active ? 'true' : 'false');
    // animate hamburger bars
    hamburger.classList.toggle('is-open', active);
    document.body.style.overflow = active ? 'hidden' : '';
  });

  // Close menu when a nav link is clicked (mobile)
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      // allow normal anchor behavior (smooth scroll) but close mobile menu
      if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });
}

/* --------------------------
   SMOOTH SCROLL + ACTIVE LINK HIGHLIGHT
   -------------------------- */
function initSmoothScrollAndActiveLinks() {
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const sections = links
    .map(l => {
      const href = l.getAttribute('href') || '';
      if (!href.startsWith('#')) return null;
      const id = href.replace('#', '');
      return document.getElementById(id);
    })
    .filter(Boolean);

  // For fixed navbar offset
  const navbar = document.querySelector('.navbar');
  function getOffset() {
    return (navbar ? navbar.offsetHeight : 0) + 8;
  }

  // Smooth scroll override to account for fixed navbar
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return; // external links keep default
      e.preventDefault();
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const scrollTop = window.scrollY + rect.top - getOffset();
      window.scrollTo({
        top: Math.max(0, Math.floor(scrollTop)),
        behavior: 'smooth'
      });
    });
  });

  // IntersectionObserver to update active nav item
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      // choose the most visible section
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible) {
        const id = visible.target.id;
        links.forEach(l => {
          if (l.getAttribute('href') === `#${id}`) {
            l.classList.add('active');
            l.style.color = getComputedStyle(document.documentElement).getPropertyValue('--electric-blue') || '';
          } else {
            l.classList.remove('active');
            l.style.color = '';
          }
        });
      }
    }, {
      root: null,
      threshold: buildThresholdList(),
      rootMargin: `-${getOffset()}px 0px -40% 0px`
    });

    sections.forEach(s => observer.observe(s));
  }

  function buildThresholdList() {
    const thresholds = [];
    for (let i=0; i<=1.0; i+=0.05) thresholds.push(i);
    return thresholds;
  }
}

/* --------------------------
   FLOATING AVATAR PARALLAX
   -------------------------- */
function initFloatingAvatarParallax() {
  const avatar = document.querySelector('.avatar-circle');
  if (!avatar) return;

  // gentle mousemove parallax on desktop
  const maxTilt = 12; // degrees
  let bounding = avatar.getBoundingClientRect();

  window.addEventListener('resize', () => bounding = avatar.getBoundingClientRect());

  avatar.addEventListener('mousemove', (e) => {
    const x = e.clientX - (bounding.left + bounding.width / 2);
    const y = e.clientY - (bounding.top + bounding.height / 2);
    const rx = (y / bounding.height) * maxTilt * -1;
    const ry = (x / bounding.width) * maxTilt;
    avatar.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    avatar.style.transition = 'transform 0.05s';
  });

  avatar.addEventListener('mouseleave', () => {
    avatar.style.transform = '';
    avatar.style.transition = 'transform 0.5s ease';
  });

  // small parallax on scroll
  window.addEventListener('scroll', () => {
    const rect = avatar.getBoundingClientRect();
    const screenCenter = window.innerHeight / 2;
    const delta = (rect.top - screenCenter) / window.innerHeight;
    avatar.style.transform = `translateY(${delta * -10}px)`;
  }, { passive: true });
}

/* --------------------------
   PROJECT PREVIEWS (modal)
   -------------------------- */
function initProjectPreviews() {
  const projectLinks = Array.from(document.querySelectorAll('.project-link'));
  if (!projectLinks.length) return;

  projectLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const card = link.closest('.project-card');
      if (!card) return;
      openProjectModal(card);
    });
  });
}

function openProjectModal(card) {
  // gather data
  const title = card.querySelector('h3')?.textContent || 'Project';
  const description = card.querySelector('p')?.textContent || '';
  const tags = Array.from(card.querySelectorAll('.project-tags span')).map(s => s.textContent || '');
  const icon = card.querySelector('.project-icon')?.textContent || '';

  // create modal elements
  const overlay = document.createElement('div');
  overlay.className = 'project-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(2,6,23,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px'
  });

  const modal = document.createElement('div');
  modal.className = 'project-modal';
  Object.assign(modal.style, {
    width: 'min(900px, 96%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: 'linear-gradient(180deg, rgba(10,15,31,0.98), rgba(8,10,20,0.98))',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
  });

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="font-size:2.5rem">${escapeHtml(icon)}</div>
        <div>
          <h2 style="margin:0;font-size:1.5rem">${escapeHtml(title)}</h2>
          <div style="color:var(--text-secondary);font-size:0.95rem;margin-top:6px">${escapeHtml(description)}</div>
        </div>
      </div>
      <button aria-label="Close preview" class="modal-close" style="background:transparent;border:0;color:var(--text-secondary);font-size:1.2rem;cursor:pointer">✕</button>
    </div>
    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
      ${tags.map(t => `<span style="padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.03);color:var(--soft-purple);font-weight:600">${escapeHtml(t)}</span>`).join('')}
    </div>
    <div style="margin-top:18px;color:var(--text-secondary);line-height:1.7">
      ${escapeHtml(description)}
    </div>
    <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
      <a class="modal-action" href="#" style="background:linear-gradient(135deg,var(--electric-blue),var(--cerulean));color:white;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:700">Open Demo</a>
      <button class="modal-action-close" style="background:rgba(255,255,255,0.04);color:var(--text-primary);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.04)">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // focus trap basic
  const closeButtons = modal.querySelectorAll('.modal-close, .modal-action-close');
  closeButtons.forEach(b => b.addEventListener('click', closeModal));
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeModal();
  });

  // ESC key closes modal
  function escListener(ev) {
    if (ev.key === 'Escape') closeModal();
  }
  document.addEventListener('keydown', escListener);

  function closeModal() {
    document.removeEventListener('keydown', escListener);
    overlay.remove();
  }
}

/* --------------------------
   CONTACT FORM HANDLING
   -------------------------- */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[type="text"]')?.value.trim() || '';
    const email = form.querySelector('input[type="email"]')?.value.trim() || '';
    const subject = form.querySelectorAll('input[type="text"]')[1]?.value.trim() || form.querySelector('input[placeholder="Subject"]')?.value || '';
    const textarea = form.querySelector('textarea')?.value.trim() || '';

    // Basic validation
    if (!name || !validateEmail(email) || !subject || !textarea) {
      showToast('Please fill all fields correctly.', { type: 'error' });
      return;
    }

    // Simulate sending: you can replace this with a real endpoint
    try {
      showToast('Sending message...', { autoClose: false, id: 'sending' });

      // Small simulated delay
      await new Promise(r => setTimeout(r, 900));

      // clear form
      form.reset();
      showToast('Message sent — I will contact you soon!', { type: 'success' });
      // remove "sending" toast if any
      removeToast('sending');
    } catch (err) {
      removeToast('sending');
      showToast('Failed to send message. Please try again later.', { type: 'error' });
    }
  });
}

function validateEmail(email) {
  // simple regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --------------------------
   SCROLL INDICATOR (hide when scrolled)
   -------------------------- */
function initScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;

  function check() {
    if (window.scrollY > window.innerHeight * 0.2) {
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none';
    } else {
      indicator.style.opacity = '1';
      indicator.style.pointerEvents = '';
    }
  }
  check();
  window.addEventListener('scroll', check, { passive: true });
}

/* --------------------------
   ACCESSIBILITY: ESC to close menu/modal
   -------------------------- */
function initAccessibilityShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // close mobile nav if open
      const navMenu = document.querySelector('.nav-menu');
      const hamburger = document.querySelector('.hamburger');
      if (navMenu?.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburger?.classList.remove('is-open');
        hamburger?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
      // close any project overlay
      const overlay = document.querySelector('.project-overlay');
      if (overlay) overlay.remove();
    }
  });
}

/* --------------------------
   SMALL TOASTS
   -------------------------- */
const _toasts = new Map();
function showToast(message, opts = {}) {
  const id = opts.id || `t_${Math.random().toString(36).slice(2,9)}`;
  const wrapperId = 'vk-toast-wrapper';
  let wrapper = document.getElementById(wrapperId);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = wrapperId;
    Object.assign(wrapper.style, {
      position: 'fixed',
      right: '20px',
      bottom: '24px',
      zIndex: 4000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    });
    document.body.appendChild(wrapper);
  }

  // if a toast with same id exists, update text
  if (_toasts.has(id)) {
    const el = _toasts.get(id);
    el.textContent = message;
    return id;
  }

  const el = document.createElement('div');
  el.className = 'vk-toast';
  el.textContent = message;
  Object.assign(el.style, {
    padding: '10px 14px',
    background: opts.type === 'error' ? 'linear-gradient(90deg,#ff6b6b,#ff8e8e)' : 'linear-gradient(90deg,#00bfff,#7ad6ff)',
    color: '#042034',
    borderRadius: '10px',
    fontWeight: 700,
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
  });

  wrapper.appendChild(el);
  _toasts.set(id, el);

  if (opts.autoClose !== false) {
    setTimeout(() => removeToast(id), opts.duration || 3000);
  }
  return id;
}

function removeToast(id) {
  if (!id) return;
  const el = _toasts.get(id);
  if (!el) return;
  el.remove();
  _toasts.delete(id);
}

/* --------------------------
   UTILITIES
   -------------------------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

