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
  var ZH = (document.documentElement.lang || '').indexOf('zh') === 0;
  var MAIL = '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>';
  var CALL = '<a href="tel:+18254885555">' + CONTACT_PHONE + '</a>';
  var T = ZH ? {
    name: '请填写您的姓名。',
    email: '请填写您的邮箱。',
    emailBad: '邮箱格式不正确，例如 name@company.ca。',
    service: '请选择需要的服务。',
    details: '请描述一下您的项目。',
    detailsShort: '请再多写一点（至少 10 个字）。',
    fix: '请检查标红的栏目。',
    industry: '行业：',
    sending: '发送中…',
    sendingStatus: '正在发送您的询价…',
    mailto: '<strong>询价还没有发出。</strong>您的邮件程序应该已经打开，内容已填好，请在邮件程序里点"发送"。如果没有打开，请直接发邮件到 ' + MAIL + '，或致电 ' + CALL + '。',
    ok: function (e) { return '<strong>谢谢，您的询价已发送给 SMK。</strong>我们会在 24 小时内回复到 ' + e + '。'; },
    bad: '<strong>询价没有发送成功。</strong>您填写的内容还在表单里，请再试一次，或发邮件到 ' + MAIL + '，或致电 ' + CALL + '。'
  } : {
    name: 'Please enter your name.',
    email: 'Please enter your email address.',
    emailBad: 'Please enter a valid email address, for example name@company.ca.',
    service: 'Please choose the service you need.',
    details: 'Please describe your project.',
    detailsShort: 'Please add a little more detail (at least 10 characters).',
    fix: 'Please check the highlighted fields.',
    industry: 'Industry: ',
    sending: 'Sending…',
    sendingStatus: 'Sending your request…',
    mailto: '<strong>Your request has not been sent yet.</strong> Your email app should open with these details filled in — press <em>Send</em> there to deliver it. If nothing opens, email ' + MAIL + ' or call ' + CALL + '.',
    ok: function (e) { return '<strong>Thank you — your request was sent to SMK.</strong> We will reply to ' + e + ' within 24 hours.'; },
    bad: '<strong>Your request could not be sent.</strong> Nothing was lost — your details are still in the form. Please try again, or email ' + MAIL + ' or call ' + CALL + '.'
  };
  function esc(v) { return v.replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

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
  /* [value sent in the email, label shown on the Chinese page] */
  var indLabels = {
    'packaging': ['Packaging & warehouse supplies', '包装与仓储用品'],
    'material-handling': ['Material handling equipment', '物料搬运设备'],
    'industrial': ['Industrial & custom manufacturing', '工业与定制制造'],
    'furniture': ['Commercial furniture & millwork', '商业家具与木作']
  };
  if (ind && indLabels[ind]) {
    form.querySelector('#f-industry').value = indLabels[ind][0];
    var chip = document.getElementById('industry-chip');
    chip.textContent = T.industry + indLabels[ind][ZH ? 1 : 0];
    chip.hidden = false;
  }

  var rules = {
    name: function (v) { return v ? '' : T.name; },
    email: function (v) {
      if (!v) return T.email;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : T.emailBad;
    },
    service: function (v) { return v ? '' : T.service; },
    details: function (v) { return v.length >= 10 ? '' : (v ? T.detailsShort : T.details); }
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

  /* Email field labels stay in English so every enquiry arrives in the same format */
  function summary() {
    var labels = [
      ['name', 'Name'], ['company', 'Company'], ['email', 'Email'], ['phone', 'Phone'],
      ['service', 'Service needed'], ['industry', 'Industry'], ['product', 'Product / cargo'],
      ['quantity', 'Quantity'], ['destination', 'Delivery destination'], ['timeline', 'Target timeline'],
      ['details', 'Project details']
    ];
    var lines = labels.map(function (p) {
      var v = (form.elements[p[0]] && form.elements[p[0]].value.trim()) || '';
      return v ? p[1] + ': ' + v : '';
    }).filter(Boolean);
    if (ZH) lines.unshift('Site language: Chinese');
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (n) {
      if (!check(form.elements[n]) && !firstBad) firstBad = form.elements[n];
    });
    if (firstBad) {
      setStatus('bad', T.fix);
      firstBad.focus();
      return;
    }
    if (form.elements.botcheck && form.elements.botcheck.checked) return;

    var service = form.elements.service.value;
    var subject = (ZH ? '[中文] ' : '') + 'Quote request: ' + service + ' — ' + form.elements.name.value.trim();

    if (!connected) {
      var href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary());
      setStatus('info', T.mailto);
      track('quote_mailto_fallback', { service: service });
      window.location.href = href;
      return;
    }

    var data = new FormData(form);
    data.append('access_key', FORM_KEY);
    data.append('subject', subject);
    data.append('from_name', 'SMK website');
    data.append('replyto', form.elements.email.value.trim());
    if (ZH) data.append('site_language', 'Chinese');
    submit.disabled = true;
    submit.textContent = T.sending;
    form.setAttribute('aria-busy', 'true');
    setStatus('info', T.sendingStatus);

    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.success) {
          setStatus('ok', T.ok(esc(form.elements.email.value.trim())));
          track('generate_lead', { service: service, language: ZH ? 'zh' : 'en' });
          form.reset();
        } else {
          throw new Error(res.j.message || 'Submission failed');
        }
      })
      .catch(function () {
        setStatus('bad', T.bad);
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

/* Photo viewer for case photos: opens full size, arrows step through the photos of the same case */
(function () {
  var links = document.querySelectorAll('.proj a.ph');
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  var ZH = (document.documentElement.lang || '').indexOf('zh') === 0;
  var dlg = document.createElement('dialog');
  dlg.className = 'viewer';
  dlg.setAttribute('aria-label', ZH ? '照片查看' : 'Photo viewer');
  dlg.innerHTML = '<p class="v-count"></p><button class="v-close" type="button" aria-label="' + (ZH ? '关闭' : 'Close') + '">&times;</button>' +
    '<button class="v-prev" type="button" aria-label="' + (ZH ? '上一张' : 'Previous photo') + '">&#8249;</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="v-next" type="button" aria-label="' + (ZH ? '下一张' : 'Next photo') + '">&#8250;</button>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img'), cap = dlg.querySelector('figcaption'), count = dlg.querySelector('.v-count');
  var group = [], i = 0;
  function show() {
    var a = group[i];
    img.src = a.getAttribute('href');
    img.alt = a.getAttribute('data-cap') || '';
    cap.textContent = a.getAttribute('data-cap') || '';
    count.textContent = (i + 1) + ' / ' + group.length;
    dlg.querySelector('.v-prev').hidden = dlg.querySelector('.v-next').hidden = group.length < 2;
  }
  function step(d) { i = (i + d + group.length) % group.length; show(); }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      group = Array.prototype.slice.call(a.closest('.proj').querySelectorAll('a.ph'));
      i = group.indexOf(a);
      show();
      dlg.showModal();
    });
  });
  dlg.querySelector('.v-close').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.v-prev').addEventListener('click', function () { step(-1); });
  dlg.querySelector('.v-next').addEventListener('click', function () { step(1); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  dlg.addEventListener('close', function () { img.removeAttribute('src'); });
})();
