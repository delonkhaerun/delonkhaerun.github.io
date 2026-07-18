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
    }, { threshold: 0, rootMargin: '50px' }); // More lenient: threshold 0 and 50px margin
    revealEls.forEach(function (el) { revealObserver.observe(el); });
    
    // Aggressive safety check: ensure all reveal elements that should be visible are revealed
    function revealSafetyCheck(){
      revealEls.forEach(function(el){
        if (el.classList.contains('is-visible')) return;
        var r = el.getBoundingClientRect();
        // Mark visible if ANY part is in viewport
        if (r.top < window.innerHeight && r.bottom > 0){
          el.classList.add('is-visible');
        }
      });
    }
    // Multiple checks at increasing delays to catch various timing issues
    setTimeout(revealSafetyCheck, 100);
    setTimeout(revealSafetyCheck, 300);
    setTimeout(revealSafetyCheck, 800);
    // Also run on every scroll, resize, and orientation change
    window.addEventListener('scroll', revealSafetyCheck);
    window.addEventListener('resize', revealSafetyCheck);
    window.addEventListener('orientationchange', revealSafetyCheck);
    // Run on DOMContentLoaded to catch late-loading content
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', revealSafetyCheck);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Project tag filters for projects page
function initProjectFilters() {
  var filterContainer = document.getElementById('projectFilters');
  var projectCards = Array.from(document.querySelectorAll('.projects-grid .project-card'));
  if (!filterContainer || projectCards.length === 0) return;

  var allTags = {};
  projectCards.forEach(function(card) {
    var tagEl = card.querySelector('.project-tag');
    if (!tagEl) return;
    var tags = tagEl.textContent.split('·').map(function(item) { return item.trim(); }).filter(Boolean);
    card.dataset.projectTags = tags.join('|');
    tags.forEach(function(tag) { allTags[tag] = true; });
  });

  var tagNames = Object.keys(allTags).sort(function(a, b) { return a.localeCompare(b); });
  if (tagNames.length === 0) return;

  function setSelectedFilter(filter) {
    projectCards.forEach(function(card) {
      var tags = (card.dataset.projectTags || '').split('|');
      var matches = filter === 'All' || tags.indexOf(filter) !== -1;
      card.style.display = matches ? 'flex' : 'none';
    });
  }

  function createFilterButton(tag, selected) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip' + (selected ? ' is-selected' : '');
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    button.textContent = tag;
    button.addEventListener('click', function() {
      filterContainer.querySelectorAll('.chip').forEach(function(chip) {
        var isSelected = chip === button;
        chip.classList.toggle('is-selected', isSelected);
        chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });
      setSelectedFilter(tag);
    });
    return button;
  }

  filterContainer.appendChild(createFilterButton('All', true));
  tagNames.forEach(function(tag) {
    filterContainer.appendChild(createFilterButton(tag, false));
  });
  setSelectedFilter('All');
}

initProjectFilters();

/* Modal viewer logic for CV (embed) and project reports (PDF.js) */
(function(){
  console.log('Viewer script: initializing modal viewer');
  var modalOverlay = document.getElementById('modalOverlay');
  var modalClose = document.getElementById('modalClose');
  var modalTitle = document.getElementById('modalTitle');
  var cvEmbed = document.getElementById('cvEmbed');
  var pdfViewer = document.getElementById('pdfViewer');
  var pdfCanvas = document.getElementById('pdfCanvas');
  var pageIndicator = document.getElementById('pageIndicator');
  var prevPageBtn = document.getElementById('prevPage');
  var nextPageBtn = document.getElementById('nextPage');

  var pdfDoc = null;
  var pageNum = 1;
  var pageRendering = false;
  var pageNumPending = null;
  var scale = 1.25; // default render scale
  // Configure PDF.js worker (cdn path provided by loaded script)
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  function openModal(){
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    // cleanup
    cvEmbed.src = '';
    if (pdfDoc){
      pdfDoc = null;
      var ctx = pdfCanvas.getContext('2d');
      ctx && ctx.clearRect(0,0,pdfCanvas.width,pdfCanvas.height);
      pdfViewer.style.display = 'none';
    }
  }

  modalClose && modalClose.addEventListener('click', closeModal);
  modalOverlay && modalOverlay.addEventListener('click', function(e){ if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

  // CV links
  document.querySelectorAll('.cv-link').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      var href = link.getAttribute('href');
      modalTitle.textContent = 'Curriculum Vitae';
      pdfViewer.style.display = 'none';
      cvEmbed.style.display = 'block';
      cvEmbed.src = href;
      openModal();
    });
  });

  // Report links (use PDF.js)
  // new toolbar controls
  var zoomInBtn = document.getElementById('zoomIn');
  var zoomOutBtn = document.getElementById('zoomOut');
  var fitWidthBtn = document.getElementById('fitWidth');
  var fitPageBtn = document.getElementById('fitPage');
  var pageNumInput = document.getElementById('pageNumInput');

  function renderPage(num){
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page){
      // get viewport at current scale
      var viewport = page.getViewport({scale: scale});
      var canvas = pdfCanvas;
      var ctx = canvas.getContext('2d');
      // handle high-DPI displays
      var outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      var renderContext = {canvasContext: ctx, viewport: viewport};
      var renderTask = page.render(renderContext);
      renderTask.promise.then(function(){
        pageRendering = false;
        if (pageNumPending !== null){
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });
      pageIndicator.textContent = 'Page ' + num + ' of ' + pdfDoc.numPages;
      if (pageNumInput) pageNumInput.value = num;
    });
  }
  function queueRenderPage(num){
    if (pageRendering){
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  // zoom handlers
  function zoomIn(){ console.log('viewer: zoomIn before', scale); scale = Math.min(5, scale * 1.25); console.log('viewer: zoomIn after', scale); queueRenderPage(pageNum); }
  function zoomOut(){ console.log('viewer: zoomOut before', scale); scale = Math.max(0.25, scale / 1.25); console.log('viewer: zoomOut after', scale); queueRenderPage(pageNum); }
  function fitWidth(){ console.log('viewer: fitWidth');
    if (!pdfDoc) return;
    pdfDoc.getPage(pageNum).then(function(page){
      var unscaled = page.getViewport({scale:1});
      var containerWidth = pdfViewer.clientWidth - 48; // account for paddings
      var newScale = containerWidth / unscaled.width;
      scale = Math.max(0.25, Math.min(5, newScale));
      queueRenderPage(pageNum);
    });
  }
  function fitPage(){
    console.log('viewer: fitPage');
    if (!pdfDoc) return;
    pdfDoc.getPage(pageNum).then(function(page){
      var unscaled = page.getViewport({scale:1});
      var toolbar = document.querySelector('.pdf-toolbar');
      var toolbarH = toolbar ? toolbar.offsetHeight : 40;
      var containerWidth = pdfViewer.clientWidth - 48;
      var containerHeight = pdfViewer.clientHeight - toolbarH - 48;
      var scaleW = containerWidth / unscaled.width;
      var scaleH = containerHeight / unscaled.height;
      var newScale = Math.min(scaleW, scaleH);
      scale = Math.max(0.25, Math.min(5, newScale));
      queueRenderPage(pageNum);
    });
  }


  if (pageNumInput){
    pageNumInput.addEventListener('change', function(){
      var val = parseInt(pageNumInput.value, 10);
      if (!isNaN(val) && pdfDoc){
        val = Math.max(1, Math.min(pdfDoc.numPages, val));
        pageNum = val;
        queueRenderPage(pageNum);
      } else {
        pageNumInput.value = pageNum;
      }
    });
  }

  // Delegated toolbar click handler on modal overlay (robust across browsers)
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e){
      var btn = e.target.closest('button');
      if (!btn) return;
      // ensure the button is inside the modal
      var modal = document.querySelector('.modal');
      if (!modal || !modal.contains(btn)) return;
      var id = btn.id;
      console.log('viewer: toolbar clicked', id);
      switch(id){
        case 'zoomIn': zoomIn(); break;
        case 'zoomOut': zoomOut(); break;
        case 'fitWidth': fitWidth(); break;
        case 'fitPage': fitPage(); break;
        case 'prevPage': if (pageNum>1){ pageNum--; queueRenderPage(pageNum); } break;
        case 'nextPage': if (pdfDoc && pageNum < pdfDoc.numPages){ pageNum++; queueRenderPage(pageNum); } break;
        case 'openTabBtn': if (currentPdfUrl) window.open(currentPdfUrl, '_blank', 'noopener'); break;
        case 'downloadBtn': if (currentPdfUrl){ var a = document.createElement('a'); a.href = currentPdfUrl; try{ a.download = currentPdfUrl.split('/').pop()||'report.pdf'; }catch(e){ a.download='report.pdf'; } document.body.appendChild(a); a.click(); a.remove(); } break;
        default: break;
      }
    });
  }

  // track current PDF URL for open/download
  var currentPdfUrl = null;
  var openTabBtn = document.getElementById('openTabBtn');
  var downloadBtn = document.getElementById('downloadBtn');

  function setDocButtonsEnabled(enabled){
    if (openTabBtn) openTabBtn.disabled = !enabled;
    if (downloadBtn) downloadBtn.disabled = !enabled;
  }

  document.querySelectorAll('.view-report').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      var href = link.getAttribute('href');
      currentPdfUrl = href;
      modalTitle.textContent = 'Project Report';
      cvEmbed.style.display = 'none';
      pdfViewer.style.display = 'flex';
      openModal();
      // reset controls
      scale = 1.25;
      if (pageNumInput) pageNumInput.value = 1;
      pageIndicator.textContent = '';
      setDocButtonsEnabled(false);
      // load PDF
      if (!window.pdfjsLib){
        // pdf.js not loaded
        var alertMsg = document.createElement('div');
        alertMsg.textContent = 'PDF viewer script not available.';
        alertMsg.style.padding = '1rem';
        alertMsg.style.color = 'red';
        pdfViewer.appendChild(alertMsg);
        return;
      }
      var loadingTask = pdfjsLib.getDocument(href);
      loadingTask.promise.then(function(pdf){
        pdfDoc = pdf;
        pageNum = 1;
        // default to fit width for readability
        fitWidth();
        setDocButtonsEnabled(true);
      }).catch(function(err){
        console.error('Error loading PDF', err);
        var alertMsg = document.createElement('div');
        alertMsg.textContent = 'Unable to load PDF.';
        alertMsg.style.padding = '1rem';
        alertMsg.style.color = 'red';
        pdfViewer.appendChild(alertMsg);
      });
    });
  });

  
})();