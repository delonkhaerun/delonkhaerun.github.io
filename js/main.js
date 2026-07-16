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
  prevPageBtn && prevPageBtn.addEventListener('click', function(){ if (pageNum <= 1) return; pageNum--; queueRenderPage(pageNum); });
  nextPageBtn && nextPageBtn.addEventListener('click', function(){ if (!pdfDoc || pageNum >= pdfDoc.numPages) return; pageNum++; queueRenderPage(pageNum); });

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

  zoomInBtn && zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn && zoomOutBtn.addEventListener('click', zoomOut);
  fitWidthBtn && fitWidthBtn.addEventListener('click', fitWidth);
  fitPageBtn && fitPageBtn.addEventListener('click', fitPage);

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

  // open in new tab
  if (openTabBtn){
    openTabBtn.addEventListener('click', function(){
      if (!currentPdfUrl) return;
      window.open(currentPdfUrl, '_blank', 'noopener');
    });
  }

  // download
  if (downloadBtn){
    downloadBtn.addEventListener('click', function(){
      if (!currentPdfUrl) return;
      // create a link and click it to download
      var a = document.createElement('a');
      a.href = currentPdfUrl;
      // attempt to derive filename
      try{
        var parts = currentPdfUrl.split('/');
        var filename = parts[parts.length-1] || 'report.pdf';
        a.download = filename;
      }catch(e){ a.download = 'report.pdf'; }
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

})();