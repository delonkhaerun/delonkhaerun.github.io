// Mobile nav toggle
var navToggle = document.getElementById('navToggle');
var navMenu = document.getElementById('navMenu');
navToggle.addEventListener('click', function () {
    var isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
});
navMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Theme toggle
var themeToggle = document.getElementById('themeToggle');
var htmlElement = document.documentElement;

function initTheme() {
  var savedTheme = localStorage.getItem('theme') || 'light';
  htmlElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  var currentTheme = htmlElement.getAttribute('data-theme');
  var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

initTheme();
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

  // Active nav link on scroll
var sections = document.querySelectorAll('main section[id]');
var navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  // Scroll reveal
var revealEls = document.querySelectorAll('.reveal');
var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();