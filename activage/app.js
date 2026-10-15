/* ActivAge landing page: carousel (auto every 4 s), zoom toggle, swipe, gentle tilt. */
(function () {
  var N = 0, i = 0, timer = null, big = false;
  var root = document.querySelector('.screen.page-bg');
  var car = document.querySelector('.car');
  var stage = document.querySelector('.car-stage');
  var slides = car ? car.querySelectorAll("figure") : [];
  N = slides.length || 1;
  var dots = car ? car.querySelectorAll('.car-dots button') : [];
  var caps = document.querySelectorAll('.car-bar [aria-live] > div');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(k) {
    i = ((k % N) + N) % N;
    for (var n = 0; n < N; n++) {
      var on = n === i;
      if (slides[n]) { slides[n].className = on ? 'slide on' : 'slide'; slides[n].setAttribute('aria-hidden', on ? 'false' : 'true'); }
      if (dots[n]) { dots[n].className = on ? 'dot on' : 'dot'; dots[n].setAttribute('aria-current', on ? 'true' : 'false'); }
      if (caps[n]) caps[n].className = on ? 'cap on' : 'cap';
    }
  }
  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) show(i + 1); }, 4000);
  }
  function go(k) { show(k); start(); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var a = t.getAttribute('data-act');
    if (a === 'prev') go(i - 1);
    else if (a === 'next') go(i + 1);
    else if (a.indexOf('go:') === 0) go(parseInt(a.slice(3), 10));
    else if (a === 'zoom') {
      big = !big;
      root.style.fontSize = (big ? 23 : 19) + 'px';
      t.setAttribute('aria-pressed', big ? 'true' : 'false');
      var label = big ? 'Perkecil tulisan' : 'Perbesar tulisan';
      t.setAttribute('aria-label', label); t.setAttribute('title', label);
      var bar = t.querySelector('svg path:last-child'); if (bar) bar.style.display = big ? 'none' : 'inline';
    }
  });

  // swipe on phones
  var x0 = null;
  if (car) {
    car.addEventListener('touchstart', function (e) { x0 = e.touches && e.touches[0] ? e.touches[0].clientX : null; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var x1 = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : x0;
      var dx = x1 - x0; x0 = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    }, { passive: true });
  }

  show(0); start();
})();
