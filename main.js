/* S.M.K Supply Chain — site script */

/* ---- Configuration ----
   FORM_KEY: Web3Forms access key (https://web3forms.com). While it starts with "YOUR_",
   the quote form is treated as NOT connected: it opens a pre-filled email instead.
   GA_ID: Google Analytics 4 Measurement ID. Analytics loads only once a real ID is set. */
var FORM_KEY = 'bf26b445-d19c-49c7-ba7e-180cecfc376d';
var GA_ID = 'G-XXXXXXXXXX';
var CONTACT_EMAIL = 'info@smksupplychain.com';
var CONTACT_PHONE = '825-488-5555';

(function () {
  if (!/^G-X+$/.test(GA_ID)) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }
})();

function track(name, params) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
}

/* Mobile menu */
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('mainnav');
  if (!btn || !nav) return;
  function close() { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { close(); btn.focus(); }
  });
})();

/* Click tracking for contact links */
document.addEventListener('click', function (e) {
  var a = e.target.closest('a');
  if (!a) return;
  var h = a.getAttribute('href') || '';
  if (h.indexOf('mailto:') === 0) track('click_email');
  else if (h.indexOf('tel:') === 0) track('click_phone');
  else if (h.indexOf('google.com/maps') > -1) track('click_map');
  else if (/(^|\/)quote\/(index\.html)?([?#]|$)/.test(h)) track('click_quote_cta', { link_text: a.textContent.trim().slice(0, 60) });
});

/* Quote form */
(function () {
  var form = document.getElementById('quote-form');
  if (!form) return;
  var connected = FORM_KEY.indexOf('YOUR_') !== 0;
  var notice = document.getElementById('form-notice');
  var status = document.getElementById('form-status');
  var submit = form.querySelector('button[type="submit"]');
  var submitText = submit.textContent;
  if (connected && notice) notice.hidden = true;

  /* Prefill from links such as /quote/?service=freight-customs&industry=packaging */
  var q = new URLSearchParams(location.search);
  var svc = q.get('service');
  if (svc) {
    var opt = form.querySelector('#f-service option[data-key="' + svc.replace(/[^a-z-]/g, '') + '"]');
    if (opt) opt.selected = true;
  }
  var ind = q.get('industry');
  var indLabels = {
    'packaging': 'Packaging & warehouse supplies',
    'material-handling': 'Material handling equipment',
    'industrial': 'Industrial & custom manufacturing',
    'furniture': 'Commercial furniture & millwork'
  };
  if (ind && indLabels[ind]) {
    form.querySelector('#f-industry').value = indLabels[ind];
    var chip = document.getElementById('industry-chip');
    chip.textContent = 'Industry: ' + indLabels[ind];
    chip.hidden = false;
  }

  var rules = {
    name: function (v) { return v ? '' : 'Please enter your name.'; },
    email: function (v) {
      if (!v) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address, for example name@company.ca.';
    },
    service: function (v) { return v ? '' : 'Please choose the service you need.'; },
    details: function (v) { return v.length >= 10 ? '' : (v ? 'Please add a little more detail (at least 10 characters).' : 'Please describe your project.'); }
  };

  function check(field) {
    var rule = rules[field.name];
    if (!rule) return true;
    var msg = rule(field.value.trim());
    var err = document.getElementById(field.id + '-err');
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg; err.classList.toggle('show', !!msg); }
    return !msg;
  }

  Object.keys(rules).forEach(function (n) {
    var f = form.elements[n];
    f.addEventListener('blur', function () { if (f.value.trim() || f.getAttribute('aria-invalid')) check(f); });
    f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    f.addEventListener('change', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
  });

  function setStatus(kind, html) {
    status.className = 'status ' + kind;
    status.innerHTML = html;
  }

  function summary() {
    var labels = [
      ['name', 'Name'], ['company', 'Company'], ['email', 'Email'], ['phone', 'Phone'],
      ['service', 'Service needed'], ['industry', 'Industry'], ['product', 'Product / cargo'],
      ['quantity', 'Quantity'], ['destination', 'Delivery destination'], ['timeline', 'Target timeline'],
      ['details', 'Project details']
    ];
    return labels.map(function (p) {
      var v = (form.elements[p[0]] && form.elements[p[0]].value.trim()) || '';
      return v ? p[1] + ': ' + v : '';
    }).filter(Boolean).join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (n) {
      if (!check(form.elements[n]) && !firstBad) firstBad = form.elements[n];
    });
    if (firstBad) {
      setStatus('bad', 'Please check the highlighted fields.');
      firstBad.focus();
      return;
    }
    if (form.elements.botcheck && form.elements.botcheck.checked) return;

    var service = form.elements.service.value;
    var subject = 'Quote request: ' + service + ' — ' + form.elements.name.value.trim();

    if (!connected) {
      var href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary());
      setStatus('info', '<strong>Your request has not been sent yet.</strong> Your email app should open with these details filled in — press <em>Send</em> there to deliver it. ' +
        'If nothing opens, email <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a> or call <a href="tel:+18254885555">' + CONTACT_PHONE + '</a>.');
      track('quote_mailto_fallback', { service: service });
      window.location.href = href;
      return;
    }

    var data = new FormData(form);
    data.append('access_key', FORM_KEY);
    data.append('subject', subject);
    data.append('from_name', 'SMK website');
    data.append('replyto', form.elements.email.value.trim());
    submit.disabled = true;
    submit.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    setStatus('info', 'Sending your request…');

    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.success) {
          setStatus('ok', '<strong>Thank you — your request was sent to SMK.</strong> We will reply to ' + form.elements.email.value.trim() + '.');
          track('generate_lead', { service: service });
          form.reset();
        } else {
          throw new Error(res.j.message || 'Submission failed');
        }
      })
      .catch(function () {
        setStatus('bad', '<strong>Your request could not be sent.</strong> Nothing was lost — your details are still in the form. Please try again, or email <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a> or call <a href="tel:+18254885555">' + CONTACT_PHONE + '</a>.');
      })
      .then(function () {
        if (timer) clearTimeout(timer);
        submit.disabled = false;
        submit.textContent = submitText;
        form.removeAttribute('aria-busy');
        status.focus();
      });
  });
})();
