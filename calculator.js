/* S.M.K Supply Chain — container loading calculator
   Everything is calculated in the browser; nothing is sent anywhere.
   Sizes are handled internally in millimetres and kilograms. */
(function () {
  var root = document.getElementById('cc');
  if (!root) return;
  var ZH = (document.documentElement.lang || '').indexOf('zh') === 0;
  var QUOTE_URL = ZH ? '/zh/quote/' : '/quote/';

  /* Inside dimensions, door opening and rated payload of a typical dry container.
     Real boxes vary slightly by manufacturer. cost is a rough relative freight cost,
     used only to rank the options; it is never shown. */
  var CONTAINERS = [
    { id: '20GP', name: ZH ? '20 尺普柜 (20GP)' : "20' standard (20GP)", L: 5898, W: 2352, H: 2393, doorW: 2340, doorH: 2280, kg: 28200, cost: 1 },
    { id: '40GP', name: ZH ? '40 尺普柜 (40GP)' : "40' standard (40GP)", L: 12032, W: 2352, H: 2393, doorW: 2340, doorH: 2280, kg: 26700, cost: 1.3 },
    { id: '40HQ', name: ZH ? '40 尺高柜 (40HQ)' : "40' high cube (40HQ)", L: 12032, W: 2352, H: 2698, doorW: 2340, doorH: 2585, kg: 26500, cost: 1.35 }
  ];
  var LCL_MAX = 13;      /* CBM: below this, LCL is usually cheaper than a 20GP */
  var COMPARE_MAX = 20;  /* CBM: between LCL_MAX and this, compare LCL and a 20GP */
  var HEAVY_KG = 20000;  /* warn about road weight limits above this cargo weight per container */
  var IN = 25.4, LB = 0.45359237, CUFT = 35.3147;

  var T = ZH ? {
    enter: '输入纸箱尺寸后，这里会显示每种柜型能装多少箱。',
    tooBig: '这个纸箱太大，放不进任何标准柜（或进不了柜门）。超大件请直接联系我们安排框架柜或平板柜。',
    perCtn: '单箱体积', total: '总体积', totalKg: '总重量',
    rec: '建议', lcl: '拼箱 (LCL)',
    lclWhy: function (cbm) { return '约 ' + cbm + ' CBM，通常拼箱比整柜便宜。拼箱按“重量吨/体积吨取大值”计费：'; },
    compare: function (cbm) { return '约 ' + cbm + ' CBM，处在拼箱和 20 尺整柜的分界附近。建议两种都报价对比，20 尺柜可以全部装下。'; },
    fcl: function (id, n) { return '每个 ' + id + ' 最多装 ' + n + ' 箱'; },
    wm: function (v) { return '计费约 ' + v + ' W/M'; },
    times: ' × ', plus: ' + ',
    noQty: '填写箱数后，会给出需要几个柜、拼箱还是整柜的建议。',
    th: ['柜型', '每柜可装', '体积利用率', '每柜货重', '您的订单需要'],
    ctn: ' 箱', boxes: function (n) { return n + ' 个柜'; },
    lastFill: function (n) { return '最后一柜装 ' + n + ' 箱'; },
    byWeight: '受重量限制',
    heavy: '<strong>重货提醒：</strong>每柜货重超过 20 吨。中国和加拿大的公路限重可能低于集装箱额定载重，订舱前请让 SMK 确认。',
    tip: function (n, c) { return '如果纸箱可以侧放或倒放，每个 ' + c + ' 最多可装 ' + n + ' 箱。'; },
    layout: function (o, nx, ny, nz) { return '纸箱按 ' + o + ' 摆放：长度方向 ' + nx + ' 排 × 宽度方向 ' + ny + ' 列 × 高度 ' + nz + ' 层'; },
    single: function (o) { return '纸箱都按 ' + o + ' 摆放，分区码放以减少空隙'; },
    mixed: '混合摆放：', part: function (n, o) { return n + ' 箱按 ' + o; },
    view: '装柜示意', door: '柜门',
    quoteDetails: function (s) { return '来自装箱计算器：' + s; },
    order: '装货顺序', zoomIn: '放大', zoomOut: '缩小', reset: '重置视角',
    hint: '按住拖动可旋转柜子。拖动“装货顺序”滑块，可以看从柜子最里面装到柜门的过程。',
    copied: '链接已复制。', copyFail: '复制失败，请从地址栏复制链接。',
    bad: '请输入大于 0 的数字。'
  } : {
    enter: 'Enter a carton size to see how many cartons fit in each container.',
    tooBig: 'This carton is too large for a standard container or its door. For oversized cargo, contact us about flat-rack or open-top options.',
    perCtn: 'Carton volume', total: 'Total volume', totalKg: 'Total weight',
    rec: 'Suggested', lcl: 'Less than container load (LCL)',
    lclWhy: function (cbm) { return 'About ' + cbm + ' CBM is usually cheaper to ship as LCL than in a full container. LCL is charged on weight or volume, whichever is greater: '; },
    compare: function (cbm) { return 'About ' + cbm + ' CBM is close to the point where a full 20GP becomes worth it. Compare LCL with a 20GP quote; everything fits in one 20GP.'; },
    fcl: function (id, n) { return 'a ' + id + ' holds up to ' + n + ' cartons'; },
    wm: function (v) { return 'about ' + v + ' W/M chargeable'; },
    times: ' × ', plus: ' + ',
    noQty: 'Add the number of cartons to see how many containers you need, and whether LCL or a full container makes more sense.',
    th: ['Container', 'Cartons per container', 'Volume used', 'Cargo weight per container', 'For your order'],
    ctn: ' cartons', boxes: function (n) { return n + (n === 1 ? ' container' : ' containers'); },
    lastFill: function (n) { return 'last one holds ' + n; },
    byWeight: 'limited by weight',
    heavy: '<strong>Heavy load:</strong> More than 20 tonnes of cargo per container. Road weight limits in China and Canada can be lower than the container’s rated payload, so ask SMK to confirm before booking.',
    tip: function (n, c) { return 'If the cartons can be laid on their side, up to ' + n + ' fit in a ' + c + '.'; },
    layout: function (o, nx, ny, nz) { return 'Cartons placed as ' + o + ': ' + nx + ' along the length × ' + ny + ' across × ' + nz + ' high'; },
    single: function (o) { return 'All cartons placed as ' + o + ', in sections to reduce gaps'; },
    mixed: 'Mixed arrangement: ', part: function (n, o) { return n + ' placed as ' + o; },
    view: 'Loading view', door: 'Door',
    quoteDetails: function (s) { return 'From the container calculator: ' + s; },
    order: 'Loading sequence', zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset view',
    hint: 'Drag to turn the container. Move the loading sequence slider to watch it fill from the far end to the door.',
    copied: 'Link copied.', copyFail: 'Could not copy. Please copy the link from the address bar.',
    bad: 'Please enter a number greater than 0.'
  };

  /* ---------- Packing ----------
     Fills the container with walls and layers of one carton size. It tries every allowed
     orientation, plus up to two guillotine cuts where the next part may turn the cartons,
     and keeps the arrangement that fits the most. */
  function orientations(l, w, h, upright) {
    var list = upright ? [[l, w, h], [w, l, h]] : [[l, w, h], [l, h, w], [w, l, h], [w, h, l], [h, l, w], [h, w, l]];
    var seen = {};
    return list.filter(function (o) { var k = o.join('x'); if (seen[k]) return false; seen[k] = 1; return true; });
  }
  function fl(a, b) { return Math.floor(a / b + 1e-9); }

  function pack(c, dims, upright) {
    var ors = orientations(dims[0], dims[1], dims[2], upright).filter(function (o) {
      return o[1] <= c.doorW && o[2] <= c.doorH;
    });
    var memo = {};
    function best(L, W, H, depth) {
      var key = L + '|' + W + '|' + H + '|' + depth;
      if (memo[key]) return memo[key];
      var top = { n: 0, blocks: [] };
      ors.forEach(function (o) {
        var nx = fl(L, o[0]), ny = fl(W, o[1]), nz = fl(H, o[2]);
        var n = nx * ny * nz;
        if (n > top.n) top = { n: n, blocks: [{ o: o, x: 0, y: 0, z: 0, nx: nx, ny: ny, nz: nz }] };
        if (!depth || !n) return;
        /* Cut along each axis: i slices with this orientation, the rest solved again */
        var size = [L, W, H], cnt = [nx, ny, nz];
        for (var ax = 0; ax < 3; ax++) {
          var per = n / cnt[ax];
          var step = Math.max(1, Math.ceil(cnt[ax] / 150));
          for (var i = step; i < cnt[ax] || (i === cnt[ax] && size[ax] - i * o[ax] > 0); i += step) {
            var rest = size.slice();
            rest[ax] = size[ax] - i * o[ax];
            var r = best(rest[0], rest[1], rest[2], depth - 1);
            var total = i * per + r.n;
            if (total > top.n) {
              var first = { o: o, x: 0, y: 0, z: 0, nx: nx, ny: ny, nz: nz };
              first[['nx', 'ny', 'nz'][ax]] = i;
              var off = [0, 0, 0];
              off[ax] = i * o[ax];
              top = { n: total, blocks: [first].concat(r.blocks.map(function (b) {
                return { o: b.o, x: b.x + off[0], y: b.y + off[1], z: b.z + off[2], nx: b.nx, ny: b.ny, nz: b.nz };
              })) };
            }
          }
        }
      });
      memo[key] = top;
      return top;
    }
    return best(c.L, c.W, c.H, 2);
  }

  /* ---------- Formatting ---------- */
  var nf = new Intl.NumberFormat(ZH ? 'zh-CN' : 'en-CA');
  var nf1 = new Intl.NumberFormat(ZH ? 'zh-CN' : 'en-CA', { maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat(ZH ? 'zh-CN' : 'en-CA', { maximumFractionDigits: 2 });
  var nf3 = new Intl.NumberFormat(ZH ? 'zh-CN' : 'en-CA', { maximumFractionDigits: 3 });
  function imperial() { return root.querySelector('input[name="unit"]:checked').value === 'in'; }
  function len(mm) { return imperial() ? nf1.format(mm / IN) : nf1.format(mm / 10); }
  function lenUnit() { return imperial() ? ' in' : ' cm'; }
  function size3(a) { return len(a[0]) + ' × ' + len(a[1]) + ' × ' + len(a[2]) + lenUnit(); }
  function wt(kg) { return imperial() ? nf.format(Math.round(kg / LB)) + ' lb' : nf.format(Math.round(kg)) + ' kg'; }
  function vol(m3) {
    return nf2.format(m3) + ' CBM' + (imperial() ? ' (' + nf.format(Math.round(m3 * CUFT)) + ' cu ft)' : '');
  }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /* ---------- Inputs ---------- */
  var f = {
    l: root.querySelector('#cc-l'), w: root.querySelector('#cc-w'), h: root.querySelector('#cc-h'),
    kg: root.querySelector('#cc-kg'), qty: root.querySelector('#cc-qty'),
    up: root.querySelector('#cc-up'), product: root.querySelector('#cc-product')
  };
  var out = root.querySelector('#cc-out');
  var unitLabels = root.querySelectorAll('[data-unit-len]');
  var weightLabel = root.querySelector('[data-unit-wt]');
  var current = '40HQ', lastRun = null, used = false;

  function num(el) {
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  }
  function setUnitLabels() {
    unitLabels.forEach(function (s) { s.textContent = imperial() ? 'in' : 'cm'; });
    weightLabel.textContent = imperial() ? 'lb' : 'kg';
  }

  function read() {
    var k = imperial() ? IN : 10;
    return {
      dims: [num(f.l) * k, num(f.w) * k, num(f.h) * k],
      kg: num(f.kg) * (imperial() ? LB : 1),
      qty: Math.floor(num(f.qty)),
      up: f.up.checked
    };
  }

  /* ---------- Calculation ---------- */
  function run() {
    var inp = read();
    if (!inp.dims[0] || !inp.dims[1] || !inp.dims[2]) { lastRun = null; out.innerHTML = '<p class="cc-empty">' + T.enter + '</p>'; return; }
    var cbm = inp.dims[0] * inp.dims[1] * inp.dims[2] / 1e9;
    var rows = CONTAINERS.map(function (c) {
      var p = pack(c, inp.dims, inp.up);
      var byWeight = inp.kg ? Math.floor(c.kg / inp.kg) : Infinity;
      var per = Math.min(p.n, byWeight);
      var free = inp.up ? pack(c, inp.dims, false).n : p.n;
      return {
        c: c, plan: p, per: per, weightLimited: byWeight < p.n, free: free,
        util: per * cbm / (c.L * c.W * c.H / 1e9),
        need: inp.qty && per ? Math.ceil(inp.qty / per) : 0
      };
    });
    if (!rows.some(function (r) { return r.per > 0; })) { lastRun = null; out.innerHTML = '<p class="cc-empty">' + T.tooBig + '</p>'; return; }
    lastRun = { inp: inp, cbm: cbm, rows: rows, rec: recommend(inp, cbm, rows) };
    if (!rows.filter(function (r) { return r.c.id === current; })[0].per) current = rows.filter(function (r) { return r.per; })[0].c.id;
    render();
    if (!used) { used = true; if (typeof track === 'function') track('calculator_used'); }
  }

  /* Cheapest container mix by the rough cost index: n of one type, or full big containers plus one 20GP */
  function recommend(inp, cbm, rows) {
    if (!inp.qty) return null;
    var totalCbm = cbm * inp.qty, totalKg = inp.kg * inp.qty;
    var r20 = rows[0];
    if (totalCbm < COMPARE_MAX && r20.per >= inp.qty) {
      return { kind: totalCbm < LCL_MAX ? 'lcl' : 'compare', cbm: totalCbm, wm: Math.max(totalCbm, totalKg / 1000) };
    }
    var opts = [];
    rows.forEach(function (r) {
      if (!r.per) return;
      opts.push({ parts: [[r.need, r]], cost: r.need * r.c.cost, n: r.need });
      var full = Math.floor(inp.qty / r.per), rem = inp.qty - full * r.per;
      if (r !== r20 && full && rem && r20.per >= rem) opts.push({ parts: [[full, r], [1, r20]], cost: full * r.c.cost + r20.c.cost, n: full + 1 });
    });
    opts.sort(function (a, b) { return a.cost - b.cost || a.n - b.n; });
    return { kind: 'fcl', opt: opts[0] };
  }

  function render() {
    var R = lastRun, inp = R.inp;
    var h = '';
    h += '<dl class="cc-stats"><div><dt>' + T.perCtn + '</dt><dd>' + nf3.format(R.cbm) + ' CBM</dd></div>';
    if (inp.qty) {
      h += '<div><dt>' + T.total + '</dt><dd>' + vol(R.cbm * inp.qty) + '</dd></div>';
      if (inp.kg) h += '<div><dt>' + T.totalKg + '</dt><dd>' + wt(inp.kg * inp.qty) + '</dd></div>';
    }
    h += '</dl>';

    h += '<div class="cc-rec">' + recText(R) + '</div>';

    h += '<div class="cc-tablewrap"><table class="cc-table"><thead><tr>';
    T.th.forEach(function (t, i) { if (i < 4 || inp.qty) h += '<th scope="col">' + t + '</th>'; });
    h += '</tr></thead><tbody>';
    R.rows.forEach(function (r) {
      h += '<tr' + (r.c.id === current ? ' class="on"' : '') + '><th scope="row">' + r.c.name + '</th>';
      h += '<td><strong>' + nf.format(r.per) + '</strong>' + (r.weightLimited ? '<br><small>' + T.byWeight + '</small>' : '') + '</td>';
      h += '<td>' + Math.round(r.util * 100) + '%</td>';
      h += '<td>' + (inp.kg ? wt(r.per * inp.kg) : '—') + '</td>';
      if (inp.qty) {
        var last = inp.qty - (r.need - 1) * r.per;
        h += '<td>' + (r.need ? T.boxes(r.need) + (r.need > 1 && last < r.per ? '<br><small>' + T.lastFill(nf.format(last)) + '</small>' : '') : '—') + '</td>';
      }
      h += '</tr>';
    });
    h += '</tbody></table></div>';

    var heavy = inp.kg && R.rows.some(function (r) { return r.per * inp.kg > HEAVY_KG; });
    if (heavy) h += '<p class="notice cc-note">' + '<span>' + T.heavy + '</span></p>';

    var sel = R.rows.filter(function (r) { return r.c.id === current; })[0];
    h += '<div class="cc-view"><div class="cc-viewhead"><h3>' + T.view + '</h3><div class="cc-tabs" role="group" aria-label="' + T.view + '">';
    R.rows.forEach(function (r) {
      h += '<button type="button" data-ct="' + r.c.id + '" aria-pressed="' + (r.c.id === current) + '"' + (r.per ? '' : ' disabled') + '>' + r.c.id + '</button>';
    });
    h += '</div></div>' + view(sel) + '<p class="cc-layout">' + layoutText(sel) + '</p>';
    if (inp.up && sel.free > sel.plan.n && !sel.weightLimited) h += '<p class="cc-tip">' + T.tip(nf.format(sel.free), sel.c.id) + '</p>';
    h += '</div>';
    out.innerHTML = h;
    if (three === 'ready') mount3D(sel);
    updateLinks();
  }

  function recText(R) {
    var rec = R.rec;
    if (!rec) return '<p>' + T.noQty + '</p>';
    var s = '<p class="eyebrow">' + T.rec + '</p>';
    if (rec.kind === 'lcl') {
      s += '<p class="cc-big">' + T.lcl + '</p><p>' + T.lclWhy(nf1.format(rec.cbm)) + nf2.format(rec.wm) + ' W/M' + (ZH ? '。' : '.') + '</p>';
    } else if (rec.kind === 'compare') {
      s += '<p class="cc-big">' + T.lcl + ' / 1' + T.times + '20GP</p><p>' + T.compare(nf1.format(rec.cbm)) + '</p>';
    } else {
      var notes = rec.opt.parts.map(function (p) { return T.fcl(p[1].c.id, nf.format(p[1].per)); }).join(ZH ? '，' : '; ');
      s += '<p class="cc-big">' + mixText(rec.opt) + '</p><p>' + notes.charAt(0).toUpperCase() + notes.slice(1) + (ZH ? '。' : '.') + '</p>';
    }
    return s;
  }
  function mixText(opt) {
    return opt.parts.map(function (p) { return p[0] + T.times + p[1].c.id; }).join(T.plus);
  }
  function swatch(o, plan) { return '<span class="cc-sw cc-c' + dirIndex(o, plan) + '" aria-hidden="true"></span>'; }
  function dirIndex(o, plan) {
    var keys = [];
    plan.blocks.forEach(function (x) { var k = x.o.join('x'); if (keys.indexOf(k) < 0) keys.push(k); });
    return Math.min(keys.indexOf(o.join('x')), 2);
  }
  function layoutText(r) {
    var b = r.plan.blocks;
    if (b.length === 1) return T.layout(size3(b[0].o), b[0].nx, b[0].ny, b[0].nz);
    /* blocks that only differ by position are reported together */
    var by = {}, keys = [];
    b.forEach(function (x) {
      var k = x.o.join('x');
      if (!by[k]) { by[k] = { o: x.o, n: 0 }; keys.push(k); }
      by[k].n += x.nx * x.ny * x.nz;
    });
    if (keys.length === 1) return T.single(size3(b[0].o));
    return T.mixed + keys.map(function (k) { return swatch(by[k].o, r.plan) + T.part(nf.format(by[k].n), size3(by[k].o)); }).join('; ');
  }

  /* ---------- Drawing ----------
     Oblique view: the long side faces the viewer, depth runs up and to the right,
     the door is on the right. */
  function drawing(r) {
    var c = r.c, K = 0.7, A = Math.PI / 5;
    var s = 860 / (c.L + c.W * K * Math.cos(A));
    function P(x, y, z) {
      return [(x + y * K * Math.cos(A)) * s + 20, (c.H - z + (c.W - y) * K * Math.sin(A)) * s + 20];
    }
    function poly(pts, cls) {
      return '<polygon class="' + cls + '" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    }
    function line(a, b, cls) {
      return '<line class="' + cls + '" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>';
    }
    var vw = Math.ceil(P(c.L, c.W, 0)[0] + 20), vh = Math.ceil(P(0, 0, 0)[1] + 40);
    var g = '';
    /* back and floor of the container */
    g += poly([P(0, c.W, 0), P(c.L, c.W, 0), P(c.L, c.W, c.H), P(0, c.W, c.H)], 'cc-wall');
    g += poly([P(0, 0, 0), P(c.L, 0, 0), P(c.L, c.W, 0), P(0, c.W, 0)], 'cc-floor');
    g += poly([P(0, 0, 0), P(0, c.W, 0), P(0, c.W, c.H), P(0, 0, c.H)], 'cc-wall');

    /* cartons: farther and lower blocks first */
    var blocks = r.plan.blocks.slice();
    var limit = r.per < r.plan.n ? r.per : Infinity;
    blocks.sort(function (a, b) {
      var A1 = ext(a), B1 = ext(b);
      if (A1.x2 <= B1.x1) return -1; if (B1.x2 <= A1.x1) return 1;
      if (A1.z2 <= B1.z1) return -1; if (B1.z2 <= A1.z1) return 1;
      if (A1.y1 >= B1.y2) return -1; if (B1.y1 >= A1.y2) return 1;
      return 0;
    });
    blocks.forEach(function (b) {
      if (limit <= 0) return;
      var n = b.nx * b.ny * b.nz;
      var shown = b;
      /* Weight-limited loads: draw only as many full layers as the weight allows */
      if (n > limit) {
        var layer = b.nx * b.ny;
        var nz = Math.max(1, Math.ceil(limit / layer));
        shown = { o: b.o, x: b.x, y: b.y, z: b.z, nx: b.nx, ny: b.ny, nz: Math.min(nz, b.nz) };
      }
      limit -= n;
      g += '<g class="cc-c' + dirIndex(b.o, r.plan) + '">' + cuboid(shown) + '</g>';
    });

    /* front edges of the container on top */
    var e = [[P(0, 0, 0), P(c.L, 0, 0)], [P(0, 0, c.H), P(c.L, 0, c.H)], [P(0, 0, 0), P(0, 0, c.H)], [P(c.L, 0, 0), P(c.L, 0, c.H)],
      [P(0, 0, c.H), P(0, c.W, c.H)], [P(c.L, 0, c.H), P(c.L, c.W, c.H)], [P(0, c.W, c.H), P(c.L, c.W, c.H)], [P(c.L, 0, 0), P(c.L, c.W, 0)], [P(c.L, c.W, 0), P(c.L, c.W, c.H)]];
    e.forEach(function (p) { g += line(p[0], p[1], 'cc-edge'); });
    var d = P(c.L, c.W / 2, 0);
    g += '<text class="cc-door" x="' + (d[0]).toFixed(1) + '" y="' + (vh - 8) + '" text-anchor="end">' + T.door + ' →</text>';

    return '<svg class="cc-svg" viewBox="0 0 ' + vw + ' ' + vh + '" role="img" aria-label="' + esc(T.view + ': ' + c.name + ', ' + nf.format(r.per) + T.ctn) + '">' + g + '</svg>';

    function ext(b) {
      return { x1: b.x, x2: b.x + b.nx * b.o[0], y1: b.y, y2: b.y + b.ny * b.o[1], z1: b.z, z2: b.z + b.nz * b.o[2] };
    }
    function cuboid(b) {
      var X = ext(b), o = b.o, out = '';
      var front = [P(X.x1, X.y1, X.z1), P(X.x2, X.y1, X.z1), P(X.x2, X.y1, X.z2), P(X.x1, X.y1, X.z2)];
      var top = [P(X.x1, X.y1, X.z2), P(X.x2, X.y1, X.z2), P(X.x2, X.y2, X.z2), P(X.x1, X.y2, X.z2)];
      var side = [P(X.x2, X.y1, X.z1), P(X.x2, X.y2, X.z1), P(X.x2, X.y2, X.z2), P(X.x2, X.y1, X.z2)];
      out += poly(top, 'cc-top') + poly(side, 'cc-side') + poly(front, 'cc-front');
      /* carton seams, skipped when they would be too dense to read */
      var dense = function (count, px) { return count > 1 && px / count >= 3; };
      var i;
      if (dense(b.nx, (X.x2 - X.x1) * s)) for (i = 1; i < b.nx; i++) {
        var x = X.x1 + i * o[0];
        out += line(P(x, X.y1, X.z1), P(x, X.y1, X.z2), 'cc-seam') + line(P(x, X.y1, X.z2), P(x, X.y2, X.z2), 'cc-seam');
      }
      if (dense(b.nz, (X.z2 - X.z1) * s)) for (i = 1; i < b.nz; i++) {
        var z = X.z1 + i * o[2];
        out += line(P(X.x1, X.y1, z), P(X.x2, X.y1, z), 'cc-seam') + line(P(X.x2, X.y1, z), P(X.x2, X.y2, z), 'cc-seam');
      }
      if (dense(b.ny, (X.y2 - X.y1) * s * K)) for (i = 1; i < b.ny; i++) {
        var y = X.y1 + i * o[1];
        out += line(P(X.x1, y, X.z2), P(X.x2, y, X.z2), 'cc-seam') + line(P(X.x2, y, X.z1), P(X.x2, y, X.z2), 'cc-seam');
      }
      return out;
    }
  }

  /* ---------- 3D view ----------
     three.js is loaded only once there are results to show. If it cannot load, or the
     browser has no WebGL, the flat drawing above is shown instead. */
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var COLORS = [0xd88f52, 0x8cabd2, 0x9cc391];
  var YAW = 0.6, PITCH = 0.42;
  var three = 'idle', V = null;

  function load3D() {
    if (three !== 'idle') return;
    three = 'loading';
    var s = document.createElement('script');
    s.src = THREE_URL;
    s.onload = function () {
      try {
        var c = document.createElement('canvas');
        three = window.THREE && (c.getContext('webgl') || c.getContext('experimental-webgl')) ? 'ready' : 'failed';
      } catch (e) { three = 'failed'; }
      if (three === 'ready' && lastRun) render();
    };
    s.onerror = function () { three = 'failed'; };
    document.head.appendChild(s);
  }

  function view(r) {
    if (three !== 'ready') { load3D(); return drawing(r); }
    var n = nf.format(r.per);
    return '<div class="cc-3d"></div>' +
      '<div class="cc-3dbar"><label>' + T.order + ' <input type="range" class="cc-range" min="0" max="' + r.per + '" value="' + r.per + '" step="1"></label>' +
      '<output class="cc-count">' + n + ' / ' + n + '</output>' +
      '<span class="cc-zoom"><button type="button" data-zoom="-1" aria-label="' + T.zoomOut + '">−</button><button type="button" data-zoom="1" aria-label="' + T.zoomIn + '">+</button><button type="button" data-zoom="0">' + T.reset + '</button></span></div>' +
      '<p class="cc-hint">' + T.hint + '</p>';
  }

  function init3D() {
    var T3 = window.THREE;
    var renderer = new T3.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new T3.Scene();
    scene.add(new T3.HemisphereLight(0xffffff, 0x8a96a8, 0.85));
    var sun = new T3.DirectionalLight(0xffffff, 0.55);
    sun.position.set(6, 12, 8);
    scene.add(sun);
    V = { T3: T3, renderer: renderer, scene: scene, camera: new T3.PerspectiveCamera(32, 2, 0.1, 500), group: null, id: null, yaw: YAW, pitch: PITCH, dist: 10, base: 10 };
    var cv = renderer.domElement, drag = null;
    cv.className = 'cc-canvas';
    cv.setAttribute('role', 'img');
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      V.yaw -= (e.clientX - drag.x) * 0.008;
      V.pitch = Math.max(0.05, Math.min(1.45, V.pitch + (e.clientY - drag.y) * 0.006));
      drag.x = e.clientX; drag.y = e.clientY;
      draw3D();
    });
    function end() { drag = null; }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    window.addEventListener('resize', function () { if (cv.isConnected) { size3D(); draw3D(); } });
  }

  function size3D() {
    var w = V.renderer.domElement.parentNode.clientWidth;
    var h = Math.round(Math.max(260, Math.min(440, w * 0.52)));
    V.renderer.setSize(w, h);
    V.camera.aspect = w / h;
    V.camera.updateProjectionMatrix();
  }

  function mount3D(r) {
    if (!V) init3D();
    var cv = V.renderer.domElement;
    out.querySelector('.cc-3d').appendChild(cv);
    cv.setAttribute('aria-label', T.view + ': ' + r.c.name + ', ' + nf.format(r.per) + T.ctn);
    size3D();
    if (V.id !== r.c.id) {
      /* fit the whole container in view whenever the container type changes */
      var hf = Math.atan(Math.tan(V.camera.fov * Math.PI / 360) * V.camera.aspect);
      var span = (r.c.L * Math.cos(YAW) + r.c.W * Math.sin(YAW)) / 1000;
      V.id = r.c.id; V.yaw = YAW; V.pitch = PITCH;
      V.dist = V.base = span * 0.62 / Math.tan(hf);
    }
    build3D(r);
    draw3D();
  }

  function draw3D() {
    var t = new V.T3.Vector3(0, V.c.H / 2000, 0), cp = Math.cos(V.pitch);
    V.camera.position.set(V.dist * cp * Math.sin(V.yaw), t.y + V.dist * Math.sin(V.pitch), V.dist * cp * Math.cos(V.yaw));
    V.camera.lookAt(t);
    V.renderer.render(V.scene, V.camera);
  }

  /* Container length runs along x, height along y; the long side at carton y = 0 faces the viewer
     and the door is at the +x end. Units are metres. */
  function build3D(r) {
    var T3 = V.T3, c = r.c, M = 0.001;
    if (V.group) {
      V.scene.remove(V.group);
      V.group.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
    }
    var g = V.group = new T3.Group();
    var L = c.L * M, W = c.W * M, H = c.H * M;
    g.position.set(-L / 2, 0, W / 2);

    var floor = new T3.Mesh(new T3.PlaneGeometry(L, W), new T3.MeshLambertMaterial({ color: 0xd5dbe3, side: T3.DoubleSide }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(L / 2, -0.002, -W / 2);
    g.add(floor);
    var shell = new T3.LineSegments(new T3.EdgesGeometry(new T3.BoxGeometry(L, H, W)), new T3.LineBasicMaterial({ color: 0x0b2340 }));
    shell.position.set(L / 2, H / 2, -W / 2);
    g.add(shell);
    var door = new T3.LineLoop(new T3.BufferGeometry().setFromPoints([
      new T3.Vector3(L, 0, 0), new T3.Vector3(L, H, 0), new T3.Vector3(L, H, -W), new T3.Vector3(L, 0, -W)
    ]), new T3.LineBasicMaterial({ color: 0xc4520a }));
    g.add(door);
    var lc = document.createElement('canvas');
    lc.width = 256; lc.height = 96;
    var lx = lc.getContext('2d');
    lx.font = '700 54px system-ui, sans-serif';
    lx.fillStyle = '#c4520a'; lx.textAlign = 'center'; lx.textBaseline = 'middle';
    lx.fillText(T.door, 128, 48);
    var label = new T3.Sprite(new T3.SpriteMaterial({ map: new T3.CanvasTexture(lc), depthTest: false }));
    label.scale.set(1.2, 0.45, 1);
    label.position.set(L + 0.8, H * 0.55, -W / 2);
    g.add(label);

    /* one entry per carton, in loading order: far end first, then bottom up */
    var items = [];
    r.plan.blocks.forEach(function (b) {
      var col = dirIndex(b.o, r.plan);
      for (var i = 0; i < b.nx; i++) for (var j = 0; j < b.ny; j++) for (var k = 0; k < b.nz; k++) {
        items.push([b.x + (i + 0.5) * b.o[0], b.y + (j + 0.5) * b.o[1], b.z + (k + 0.5) * b.o[2], b.o, col]);
      }
    });
    items.sort(function (a, b) { return a[0] - b[0] || a[2] - b[2] || b[1] - a[1]; });
    if (items.length > r.per) items.length = r.per;

    var n = items.length;
    function sh(d) { return (d - Math.min(14, d * 0.05)) * M; }
    var mesh = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: 0xffffff }), Math.max(n, 1));
    var m = new T3.Matrix4(), q = new T3.Quaternion(), p = new T3.Vector3(), sc = new T3.Vector3(), col = new T3.Color();
    items.forEach(function (it, idx) {
      var o = it[3];
      p.set(it[0] * M, it[2] * M, -it[1] * M);
      sc.set(sh(o[0]), sh(o[2]), sh(o[1]));
      m.compose(p, q, sc);
      mesh.setMatrixAt(idx, m);
      mesh.setColorAt(idx, col.setHex(COLORS[it[4]]));
    });
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    g.add(mesh);

    /* carton outlines, skipped for very large counts to keep it fast */
    var lines = null;
    if (n <= 6000) {
      var pos = new Float32Array(n * 72), e = 0;
      var v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      var ed = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      items.forEach(function (it) {
        var o = it[3], hx = sh(o[0]) / 2, hy = sh(o[2]) / 2, hz = sh(o[1]) / 2;
        var cx = it[0] * M, cy = it[2] * M, cz = -it[1] * M;
        ed.forEach(function (pr) {
          pr.forEach(function (vi) { pos[e++] = cx + v[vi][0] * hx; pos[e++] = cy + v[vi][1] * hy; pos[e++] = cz + v[vi][2] * hz; });
        });
      });
      var lg = new T3.BufferGeometry();
      lg.setAttribute('position', new T3.BufferAttribute(pos, 3));
      lines = new T3.LineSegments(lg, new T3.LineBasicMaterial({ color: 0x5a3416, transparent: true, opacity: 0.35 }));
      g.add(lines);
    }
    V.mesh = mesh; V.lines = lines; V.c = c;
    V.scene.add(g);
  }

  out.addEventListener('input', function (e) {
    if (!e.target.classList.contains('cc-range') || !V) return;
    var k = +e.target.value;
    V.mesh.count = k;
    if (V.lines) V.lines.geometry.setDrawRange(0, k * 24);
    out.querySelector('.cc-count').textContent = nf.format(k) + ' / ' + nf.format(+e.target.max);
    draw3D();
  });

  /* ---------- Links: shareable URL and quote prefill ---------- */
  var quoteBtn = root.querySelector('#cc-quote');
  function params() {
    var q = new URLSearchParams();
    q.set('u', imperial() ? 'in' : 'cm');
    ['l', 'w', 'h', 'kg', 'qty'].forEach(function (k) { if (f[k].value.trim()) q.set(k, f[k].value.trim()); });
    if (!f.up.checked) q.set('up', '0');
    return q;
  }
  function updateLinks() {
    var q = params();
    var R = lastRun, inp = R && R.inp;
    try { history.replaceState(null, '', location.pathname + (R ? '?' + q.toString() : '')); } catch (e) { /* file:// and old browsers */ }
    var qq = new URLSearchParams({ service: 'freight-customs' });
    if (inp) {
      var u = imperial() ? 'in' : 'cm', wu = imperial() ? 'lb' : 'kg';
      var parts = [(ZH ? '纸箱 ' : 'carton ') + [f.l.value, f.w.value, f.h.value].join(' × ') + ' ' + u];
      if (inp.kg) parts.push(f.kg.value + ' ' + wu + (ZH ? '/箱' : ' each'));
      if (inp.qty) parts.push(nf.format(inp.qty) + T.ctn + ', ' + nf2.format(R.cbm * inp.qty) + ' CBM' + (inp.kg ? ', ' + wt(inp.kg * inp.qty) : ''));
      parts.push(R.rows.map(function (r) { return r.c.id + ' ' + nf.format(r.per) + (ZH ? ' 箱/柜' : '/container'); }).join(', '));
      if (R.rec) parts.push((ZH ? '建议：' : 'suggested: ') + (R.rec.kind === 'fcl' ? mixText(R.rec.opt) : R.rec.kind === 'lcl' ? 'LCL' : 'LCL / 20GP'));
      qq.set('details', T.quoteDetails(parts.join('; ')) + '\n' + location.href);
      if (inp.qty) qq.set('quantity', nf.format(inp.qty) + T.ctn);
    }
    if (f.product.value.trim()) qq.set('product', f.product.value.trim());
    quoteBtn.href = QUOTE_URL + '?' + qq.toString();
  }

  /* ---------- Wiring ---------- */
  var timer;
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 120); }
  root.addEventListener('input', function (e) {
    if (out.contains(e.target)) return;
    if (e.target.name === 'unit') return;
    if (e.target === f.product) { updateLinks(); return; }
    schedule();
  });
  root.addEventListener('change', function (e) {
    if (e.target.name !== 'unit') return;
    /* convert what was typed into the new unit */
    var toIn = e.target.value === 'in';
    ['l', 'w', 'h'].forEach(function (k) { var v = num(f[k]); if (v) f[k].value = nf1.format(toIn ? v / 2.54 : v * 2.54).replace(/[^\d.]/g, ''); });
    var kg = num(f.kg); if (kg) f.kg.value = nf1.format(toIn ? kg / LB : kg * LB).replace(/[^\d.]/g, '');
    setUnitLabels();
    run();
  });
  out.addEventListener('click', function (e) {
    var z = e.target.closest('button[data-zoom]');
    if (z && V) {
      var d = +z.getAttribute('data-zoom');
      if (!d) { V.yaw = YAW; V.pitch = PITCH; V.dist = V.base; }
      else V.dist = Math.max(V.base * 0.3, Math.min(V.base * 2, V.dist * (d > 0 ? 0.8 : 1.25)));
      draw3D();
      return;
    }
    var b = e.target.closest('button[data-ct]');
    if (!b) return;
    current = b.getAttribute('data-ct');
    render();
    out.querySelector('button[data-ct="' + current + '"]').focus();
  });
  root.querySelector('#cc-example').addEventListener('click', function () {
    root.querySelector('input[name="unit"][value="cm"]').checked = true;
    setUnitLabels();
    f.l.value = 60; f.w.value = 40; f.h.value = 40; f.kg.value = 18; f.qty.value = 1200;
    f.up.checked = true;
    run();
  });
  var copyBtn = root.querySelector('#cc-copy'), copyStatus = root.querySelector('#cc-copy-status');
  copyBtn.addEventListener('click', function () {
    var done = function (ok) { copyStatus.textContent = ok ? T.copied : T.copyFail; };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });

  /* Restore a shared calculation from the address */
  var q0 = new URLSearchParams(location.search);
  if (q0.get('u') === 'in') root.querySelector('input[name="unit"][value="in"]').checked = true;
  ['l', 'w', 'h', 'kg', 'qty'].forEach(function (k) {
    var v = q0.get(k);
    if (v && /^\d+([.,]\d+)?$/.test(v)) f[k].value = v;
  });
  if (q0.get('up') === '0') f.up.checked = false;
  setUnitLabels();
  run();
  updateLinks();
})();
