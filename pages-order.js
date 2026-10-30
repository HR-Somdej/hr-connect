/* SOMDEJ HR Connect — pages-order.js : กิจกรรมแบบสั่งซื้อ (ORDER)
 * บุคลากร: เลือกไซซ์+จำนวน → ยืนยัน → QR พร้อมเพย์ (ใส่ยอดให้) → แนบสลิป (อ่าน QR บนสลิปกันซ้ำ) → ติดตามสถานะ
 * แอดมิน: ตรวจสลิป · ยืนยัน/ตีกลับ · เปลี่ยนสถานะจัดส่งทีละหลายรายการ · สร้าง/แก้แทน · สรุปไซซ์ + Excel */

var PAY_TH = { UNPAID: 'รอชำระเงิน', PENDING: 'รอตรวจสลิป', PAID: 'ชำระแล้ว', REJECTED: 'สลิปไม่ถูกต้อง' };
var FULFIL_TH = { PREPARING: 'กำลังจัดเตรียมคำสั่งซื้อ', ORDERED: 'สั่งซื้อแล้ว รอจัดส่ง', SHIPPED: 'ส่งแล้ว รอรับ', RECEIVED: 'รับแล้ว' };
var FULFIL_KEYS = ['PREPARING', 'ORDERED', 'SHIPPED', 'RECEIVED'];

/* ---------- ไลบรารี (อยู่ใน repo เดียวกัน ไม่พึ่ง CDN) ---------- */
function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = src + '?v=' + HRC_BUILD;
    s.onload = function () { res(window[globalName]); }; s.onerror = function () { rej(new Error('โหลด ' + src + ' ไม่สำเร็จ')); };
    document.head.appendChild(s);
  });
}

/* ---------- QR พร้อมเพย์ (EMVCo · ทดสอบตรงกับไลบรารี promptpay-qr) ---------- */
function emv(id, v) { return id + ('0' + v.length).slice(-2) + v; }
function crc16(s) { var c = 0xFFFF; for (var i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; c &= 0xFFFF; } return ('000' + c.toString(16).toUpperCase()).slice(-4); }
function promptpayPayload(id, amount) {
  id = String(id || '').replace(/\D/g, '');
  var target = id.length >= 15 ? emv('03', id) : id.length >= 13 ? emv('02', id) : emv('01', ('0000000000000' + id.replace(/^0/, '66')).slice(-13));
  var p = emv('00', '01') + emv('01', amount ? '12' : '11') + emv('29', emv('00', 'A000000677010111') + target) + emv('58', 'TH') + emv('53', '764') + (amount ? emv('54', (+amount).toFixed(2)) : '') + '6304';
  return p + crc16(p);
}
function promptpayQrDataUrl(id, amount) {
  return loadScript('lib-qrcode.js', 'qrcode').then(function (qrcode) {
    var q = qrcode(0, 'M'); q.addData(promptpayPayload(id, amount)); q.make();
    var n = q.getModuleCount(), scale = Math.max(4, Math.floor(520 / (n + 8))), pad = 4 * scale, size = n * scale + pad * 2;
    var cv = document.createElement('canvas'); cv.width = cv.height = size; var g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = '#0b2a4a';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(pad + c * scale, pad + r * scale, scale, scale);
    return cv.toDataURL('image/png');
  });
}
function fmtPP(id) { id = String(id || ''); return id.length === 10 ? id.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') : id; }
function baht(n) { return (+n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

/* ---------- สลิป: ย่อรูป + อ่าน QR ---------- */
function readImage(file) {
  return new Promise(function (res, rej) {
    if (!/^image\//.test(file.type)) return rej(new Error('กรุณาเลือกไฟล์รูปภาพสลิป (JPG/PNG)'));
    var fr = new FileReader();
    fr.onload = function () { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('เปิดรูปไม่ได้ ลองถ่ายภาพหน้าจอสลิปใหม่')); }; im.src = fr.result; };
    fr.onerror = function () { rej(new Error('อ่านไฟล์ไม่ได้')); };
    fr.readAsDataURL(file);
  });
}
function drawScaled(im, maxW) { var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, maxW / w); var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); return cv; }
function prepareSlip(file) {
  return Promise.all([readImage(file), loadScript('lib-jsqr.js', 'jsQR').catch(function () { return null; })]).then(function (r) {
    var im = r[0], jsQR = r[1], ref = '';
    if (jsQR) {
      [1400, 900, 600].some(function (w) {
        var cv = drawScaled(im, w), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height);
        var q = jsQR(d.data, cv.width, cv.height, { inversionAttempts: 'attemptBoth' });
        if (q && q.data) { ref = q.data; return true; }
        // ลองเฉพาะครึ่งล่าง (QR สลิปมักอยู่ด้านล่าง)
        var hh = Math.floor(cv.height / 2), d2 = g.getImageData(0, hh, cv.width, cv.height - hh);
        q = jsQR(d2.data, cv.width, cv.height - hh, { inversionAttempts: 'attemptBoth' });
        if (q && q.data) { ref = q.data; return true; }
        return false;
      });
    }
    var out = drawScaled(im, 1400);
    return { dataUrl: out.toDataURL('image/jpeg', 0.85), ref: ref, w: out.width, h: out.height };
  });
}

/* =================================================================== บุคลากร */
var OS = null;
function drawOrderEvent(ev, data) {
  OS = OS && OS.ev && OS.ev.id === ev.id ? OS : { ev: ev, cart: {}, editing: null, showForm: false };
  OS.ev = ev; OS.orders = data.orders; OS.payment = data.payment || (ev.config || {}).payment || {};
  var cfg = ev.config || {}, open = ev.status === 'OPEN', live = OS.orders.filter(function (o) { return !o.cancelled; });
  setAccent(ev.color);
  if (!live.length && open) OS.showForm = true;
  var h = '<div class="row between crumbrow"><div class="crumb"><a href="#/">' + ic('arrowl') + ' หน้าแรก</a></div>' + helpBtn() + '</div>' + eventHeroHtml(ev);
  // คำสั่งซื้อของฉัน
  if (OS.orders.length) {
    h += '<div class="row between" style="margin:6px 0 12px"><h2 style="font-size:19px">คำสั่งซื้อของฉัน</h2>' + (open && !OS.showForm ? '<button class="btn primary" id="oNew">' + ic('plus') + 'สั่งซื้อเพิ่ม</button>' : '') + '</div>';
    h += '<div class="stack" style="margin-bottom:18px">' + OS.orders.map(orderCardHtml).join('') + '</div>';
  }
  if (!open && !live.length) h += '<div class="card pad" style="text-align:center">' + (ev.status === 'UPCOMING' ? ic('clock') + ' เปิดรับ ' + esc(thDate(ev.openAt)) : ic('ban') + ' ปิดรับคำสั่งซื้อแล้ว ติดต่อฝ่ายทรัพยากรบุคคล โทร ' + esc(S.boot.brand.contactPhone)) + '</div>';
  if (open && OS.showForm) h += orderFormHtml(ev);
  $('#page').innerHTML = h;
  bindOrderEvent();
}
function eventHeroHtml(ev) {
  var cfg = ev.config || {};
  return '<div class="evhero">' + (cfg.image ? '<div class="pic" id="evPic"><img src="' + esc(cfg.image) + '" alt="' + esc(cfg.itemName || ev.title) + '"><span class="zoom">' + ic('zoom') + ' ดูแบบเต็ม</span></div>' : '') +
    '<div class="info"><div class="row">' + evStatusChip(ev.status) + '<span class="chip">' + ic('calendar') + ' ปิดรับ ' + esc(thDate(ev.closeAt)) + '</span></div>' +
    '<h1>' + esc(ev.title) + '</h1>' + (ev.subtitle ? '<div class="subt">' + esc(ev.subtitle) + '</div>' : '') + '<div class="desc">' + esc(ev.description || '') + '</div>' +
    (ev.status === 'OPEN' ? '<div class="countdown" id="cd"></div>' : '') + '<div><button class="btn sm ghost" id="btnChart">' + ic('table') + ' ตารางไซซ์และราคา</button></div></div></div>';
}
function payChip(o) {
  if (o.cancelled) return '<span class="chip">ยกเลิกแล้ว</span>';
  if (o.payStatus === 'PAID') return '<span class="chip ok">' + ic('check') + ' ' + esc(FULFIL_TH[o.fulfil] || 'ชำระแล้ว') + '</span>';
  return '<span class="chip ' + ({ UNPAID: 'warn dot', PENDING: 'info dot live', REJECTED: 'danger' }[o.payStatus] || '') + '">' + esc(PAY_TH[o.payStatus] || o.payStatus) + '</span>';
}
function orderSteps(o) {
  var steps = ['สั่งซื้อ', 'ชำระ/แนบสลิป', 'ตรวจสลิป', 'จัดเตรียม', 'รอจัดส่ง', 'ส่งแล้ว รอรับ', 'รับแล้ว'];
  var at = o.payStatus === 'UNPAID' || o.payStatus === 'REJECTED' ? 1 : o.payStatus === 'PENDING' ? 2 : 3 + Math.max(0, FULFIL_KEYS.indexOf(o.fulfil));
  return '<div class="osteps">' + steps.map(function (s, i) { return '<div class="' + (i < at ? 'done' : i === at ? 'now' + (o.payStatus === 'REJECTED' && i === 1 ? ' bad' : '') : '') + '"><i></i><span>' + s + '</span></div>'; }).join('') + '</div>';
}
function itemsHtml(items) { return items.map(function (i) { return '<span class="chip acc">' + esc(i.optLabel.replace(/^แบบ/, '') + ' ' + i.sizeCode) + ' × ' + i.qty + '</span>'; }).join(' '); }
function orderCardHtml(o) {
  var canPay = !o.cancelled && (o.payStatus === 'UNPAID' || o.payStatus === 'REJECTED') && OS.ev.status !== 'DRAFT';
  var canEdit = canPay && OS.ev.status === 'OPEN';
  return '<div class="card ocard' + (o.cancelled ? ' cancelled' : '') + '"><div class="bd"><div class="row between"><div><div class="small muted">เลขที่คำสั่งซื้อ · ' + esc(thShort(o.createdAt)) + '</div><b style="font-size:18px;font-family:var(--font-head)">' + esc(o.id) + '</b></div>' + payChip(o) + '</div>' +
    '<div style="margin:10px 0" class="row">' + itemsHtml(o.items) + '</div>' +
    '<div class="row between"><div class="muted small">' + o.qty + ' ตัว' + (o.payMethod === 'CASH' ? ' · ชำระเงินสด' : '') + (o.shipping ? ' · ค่าส่ง ' + baht(o.shipping) + ' บาท' : '') + '</div><div style="font-family:var(--font-head);font-size:22px">' + baht(o.total) + ' <small style="font-size:14px">บาท</small></div></div>' +
    (o.payStatus === 'REJECTED' && !o.cancelled ? '<div class="announce" style="background:var(--danger-soft);border-color:#f3c2c4;color:var(--danger);margin:10px 0 0">' + ic('alert') + '<div><b>สลิปไม่ผ่านการตรวจ:</b> ' + esc(o.rejectReason) + ' — กรุณาแนบสลิปใหม่</div></div>' : '') +
    (o.cancelled ? '' : orderSteps(o)) +
    '<div class="row" style="margin-top:12px">' + (canPay ? '<button class="btn primary" data-pay="' + esc(o.id) + '">' + ic('send') + (o.hasSlip ? 'แนบสลิปใหม่' : 'ชำระเงิน / แนบสลิป') + '</button>' : '') +
    (o.hasSlip ? '<button class="btn" data-slip="' + esc(o.id) + '">' + ic('eye') + 'ดูสลิป</button>' : '') +
    (canEdit ? '<button class="btn ghost" data-edit="' + esc(o.id) + '">' + ic('edit') + 'แก้ไข</button><button class="btn ghost danger" data-cancel="' + esc(o.id) + '">' + ic('trash') + 'ยกเลิก</button>' : '') + '</div></div></div>';
}
function cartTotal(ev) {
  var cfg = ev.config || {}, qty = 0, sub = 0;
  (cfg.options || []).forEach(function (o) { o.sizes.forEach(function (s) { var q = OS.cart[o.key + '|' + s.code] || 0; qty += q; sub += q * (+s.price || 0); }); });
  var ship = 0, sh = cfg.shipping || {};
  if (sh.enabled && qty && sh.table && sh.table.length) { var row = sh.table.filter(function (r) { return +r[0] === qty; })[0], last = sh.table[sh.table.length - 1]; ship = row ? +row[1] : qty > +last[0] ? +last[1] + 10 * (qty - +last[0]) : +sh.table[0][1]; }
  return { qty: qty, sub: sub, ship: ship, total: sub + ship };
}
function orderFormHtml(ev) {
  var cfg = ev.config || {}, t = cartTotal(ev);
  var h = '<div class="step" id="oForm"><div class="sh"><span class="no">' + ic('shirt') + '</span><div><h3>' + (OS.editing ? 'แก้ไขคำสั่งซื้อ ' + esc(OS.editing) : 'เลือกไซซ์และจำนวน') + '</h3><div class="small muted">กด + / − เพื่อเพิ่ม/ลดจำนวน · สั่งหลายไซซ์ในคำสั่งซื้อเดียวได้' + (+cfg.maxPerOrder ? ' · สูงสุด ' + cfg.maxPerOrder + ' ตัว' : '') + '</div></div></div>';
  (cfg.options || []).forEach(function (o) {
    h += '<h4 style="margin:14px 0 8px;font-size:15px">' + esc(o.label) + '</h4><div class="qgrid">' + o.sizes.filter(function (s) { return !s.hidden; }).map(function (s) {
      var k = o.key + '|' + s.code, q = OS.cart[k] || 0;
      return '<div class="qcell' + (q ? ' on' : '') + '"><div class="qtop"><b>' + esc(s.code) + '</b><span class="price">' + baht(s.price) + ' ฿</span></div><small>' + (s.chest ? 'อก ' + s.chest + '″' + (s.length ? ' · ยาว ' + s.length + '″' : '') : esc(s.note || '')) + '</small>' +
        '<div class="stepper"><button type="button" data-q="' + esc(k) + '" data-d="-1" ' + (q ? '' : 'disabled') + ' aria-label="ลด">−</button><input inputmode="numeric" data-qi="' + esc(k) + '" value="' + q + '" aria-label="จำนวน ' + esc(o.label + ' ' + s.code) + '"><button type="button" data-q="' + esc(k) + '" data-d="1" aria-label="เพิ่ม">+</button></div></div>';
    }).join('') + '</div>';
  });
  h += '<div class="field" style="margin-top:14px"><label class="f" for="oNote">หมายเหตุถึง HR (ถ้ามี)</label><input class="input" id="oNote" maxlength="300" placeholder="เช่น ฝากรับแทนที่หน่วยงาน" value="' + esc(OS.note || '') + '"></div></div>';
  h += '<div class="actionbar" id="oBar"><div class="sum"><small>' + t.qty + ' ตัว' + (t.ship ? ' · ค่าส่ง ' + baht(t.ship) + ' ฿' : '') + '</small><b>รวม ' + baht(t.total) + ' บาท</b></div>' +
    (OS.orders.some(function (o) { return !o.cancelled; }) || OS.editing ? '<button class="btn" id="oCancelForm" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)">ยกเลิก</button>' : '') +
    '<button class="btn primary" id="oSubmit" ' + (t.qty ? '' : 'disabled') + '>' + ic('check') + (OS.editing ? 'บันทึกการแก้ไข' : 'ยืนยันคำสั่งซื้อ') + '</button></div>';
  return h;
}
function updateOrderBar() {
  var t = cartTotal(OS.ev), bar = $('#oBar'); if (!bar) return;
  $('.sum', bar).innerHTML = '<small>' + t.qty + ' ตัว' + (t.ship ? ' · ค่าส่ง ' + baht(t.ship) + ' ฿' : '') + '</small><b>รวม ' + baht(t.total) + ' บาท</b>';
  $('#oSubmit').disabled = !t.qty;
}
function bindOrderEvent() {
  var ev = OS.ev, cfg = ev.config || {};
  var pic = $('#evPic'); if (pic) pic.onclick = function () { modal({ title: esc(cfg.itemName || ev.title), size: 'xl', body: '<div class="lightbox"><img src="' + esc(cfg.image) + '" alt=""></div>' }); };
  $('#btnChart').onclick = function () { modal({ title: 'ตารางไซซ์และราคา', size: 'lg', body: orderChartHtml(cfg) }); };
  startCountdown(ev);
  var bn = $('#oNew'); if (bn) bn.onclick = function () { OS.showForm = true; OS.editing = null; OS.cart = {}; OS.note = ''; drawOrderEvent(ev, { orders: OS.orders, payment: OS.payment }); setTimeout(function () { $('#oForm').scrollIntoView({ behavior: 'smooth' }); }, 50); };
  $$('[data-q]').forEach(function (b) {
    b.onclick = function () {
      var k = b.dataset.q, q = Math.max(0, (OS.cart[k] || 0) + (+b.dataset.d));
      OS.cart[k] = q; var cell = b.closest('.qcell'); $('input', cell).value = q; cell.classList.toggle('on', q > 0); $('[data-d="-1"]', cell).disabled = !q; updateOrderBar();
    };
  });
  $$('[data-qi]').forEach(function (inp) {
    inp.oninput = function () { var v = Math.max(0, Math.min(500, parseInt(inp.value.replace(/\D/g, ''), 10) || 0)); OS.cart[inp.dataset.qi] = v; var cell = inp.closest('.qcell'); cell.classList.toggle('on', v > 0); $('[data-d="-1"]', cell).disabled = !v; updateOrderBar(); };
    inp.onblur = function () { inp.value = OS.cart[inp.dataset.qi] || 0; };
    inp.onfocus = function () { inp.select(); };
  });
  var no = $('#oNote'); if (no) no.oninput = function () { OS.note = no.value; };
  var cf = $('#oCancelForm'); if (cf) cf.onclick = function () { OS.showForm = false; OS.editing = null; OS.cart = {}; drawOrderEvent(ev, { orders: OS.orders, payment: OS.payment }); };
  var sb = $('#oSubmit'); if (sb) sb.onclick = confirmOrder;
  $$('[data-pay]').forEach(function (b) { b.onclick = function () { payModal(OS.orders.filter(function (o) { return o.id === b.dataset.pay; })[0]); }; });
  $$('[data-slip]').forEach(function (b) { b.onclick = function () { showSlip(b.dataset.slip); }; });
  $$('[data-edit]').forEach(function (b) {
    b.onclick = function () {
      var o = OS.orders.filter(function (x) { return x.id === b.dataset.edit; })[0]; OS.cart = {}; o.items.forEach(function (i) { OS.cart[i.optKey + '|' + i.sizeCode] = i.qty; });
      OS.editing = o.id; OS.note = o.note; OS.showForm = true; drawOrderEvent(ev, { orders: OS.orders, payment: OS.payment }); setTimeout(function () { $('#oForm').scrollIntoView({ behavior: 'smooth' }); }, 50);
    };
  });
  $$('[data-cancel]').forEach(function (b) {
    b.onclick = function () {
      confirmBox({ title: 'ยกเลิกคำสั่งซื้อ ' + b.dataset.cancel + '?', msg: 'ยกเลิกได้เฉพาะก่อนแนบสลิป', danger: true, ok: 'ยกเลิกคำสั่งซื้อ' }).then(function (y) {
        if (!y) return;
        api('cancelMyOrder', { orderId: b.dataset.cancel }).then(function () { toast('ยกเลิกคำสั่งซื้อ ' + b.dataset.cancel + ' แล้ว', 'ok'); reloadOrders(); }).catch(errToast);
      });
    };
  });
}
function startCountdown(ev) {
  clearInterval(window._cdTimer);
  var cd = $('#cd'); if (!cd) return;
  var tick = function () {
    var ms = parseLocal(ev.closeAt) - new Date();
    if (!document.body.contains(cd)) return clearInterval(window._cdTimer);
    if (ms <= 0) { cd.innerHTML = '<span class="chip">ปิดรับแล้ว</span>'; return clearInterval(window._cdTimer); }
    var d = Math.floor(ms / 86400000), hh = Math.floor(ms % 86400000 / 3600000), mm = Math.floor(ms % 3600000 / 60000);
    cd.innerHTML = '<div class="cd"><b>' + d + '</b><small>วัน</small></div><div class="cd"><b>' + hh + '</b><small>ชั่วโมง</small></div><div class="cd"><b>' + mm + '</b><small>นาที</small></div><div class="small muted" style="align-self:center">ก่อนปิดรับ</div>';
  };
  tick(); window._cdTimer = setInterval(tick, 30000);
}
function orderChartHtml(cfg) {
  return (cfg.options || []).map(function (o) {
    var sz = o.sizes.filter(function (s) { return !s.hidden; });
    var row = function (lbl, k) { return sz.some(function (s) { return s[k]; }) ? '<tr><th>' + lbl + '</th>' + sz.map(function (s) { return '<td>' + (s[k] || '–') + '</td>'; }).join('') + '</tr>' : ''; };
    return '<h4 style="margin:10px 0 0">' + esc(o.label) + '</h4><div class="chartwrap"><table class="chart"><tr><th>SIZE</th>' + sz.map(function (s) { return '<th>' + esc(s.code) + '</th>'; }).join('') + '</tr>' +
      row('รอบอก (นิ้ว)', 'chest') + row('ความยาว (นิ้ว)', 'length') + row('ความยาวแขน (นิ้ว)', 'sleeve') + row('ความกว้างชายเสื้อ (นิ้ว)', 'hem') +
      '<tr><th>ราคา (บาท)</th>' + sz.map(function (s) { return '<td><b>' + baht(s.price) + '</b></td>'; }).join('') + '</tr></table></div>';
  }).join('') + (cfg.sizeNote ? '<p class="small muted">' + esc(cfg.sizeNote) + '</p>' : '') + ((cfg.shipping || {}).enabled ? '<p class="small">' + ic('info') + ' มีค่าส่ง EMS ตามจำนวนตัว (ระบบคำนวณให้)</p>' : '');
}
function confirmOrder() {
  var ev = OS.ev, cfg = ev.config, t = cartTotal(ev), items = [];
  (cfg.options || []).forEach(function (o) { o.sizes.forEach(function (s) { var q = OS.cart[o.key + '|' + s.code] || 0; if (q) items.push({ optKey: o.key, sizeCode: s.code, qty: q, label: o.label + ' ' + s.code, price: s.price }); }); });
  if (+cfg.maxPerOrder && t.qty > +cfg.maxPerOrder) return toast('สั่งได้ไม่เกิน ' + cfg.maxPerOrder + ' ตัวต่อคำสั่งซื้อ', 'warn');
  var m = modal({ title: OS.editing ? 'ยืนยันการแก้ไข ' + esc(OS.editing) : 'ยืนยันคำสั่งซื้อ', foot: '<button class="btn" data-x>กลับไปแก้</button><button class="btn primary" id="coOk" data-busy="กำลังบันทึก…">' + ic('check') + 'ยืนยัน · ไปชำระเงิน</button>',
    body: '<table class="t"><thead><tr><th>รายการ</th><th class="r">จำนวน</th><th class="r">บาท</th></tr></thead><tbody>' + items.map(function (i) { return '<tr><td>' + esc(i.label) + ' <span class="small muted">@' + baht(i.price) + '</span></td><td class="r num">' + i.qty + '</td><td class="r num">' + baht(i.qty * i.price) + '</td></tr>'; }).join('') +
      (t.ship ? '<tr><td>' + esc((cfg.shipping || {}).label || 'ค่าส่ง') + '</td><td></td><td class="r num">' + baht(t.ship) + '</td></tr>' : '') +
      '<tr style="font-weight:700"><td>รวมทั้งสิ้น</td><td class="r num">' + t.qty + '</td><td class="r num" style="font-size:18px">' + baht(t.total) + '</td></tr></tbody></table>' +
      '<p class="small muted" style="margin:12px 0 0">' + ic('info') + ' ขั้นต่อไป: สแกน QR พร้อมเพย์ชำระตามยอด แล้วแนบสลิป · แก้ไข/ยกเลิกได้จนกว่าจะแนบสลิป</p>' });
  $('#coOk').onclick = function () {
    busy(this, api('placeOrder', { eventId: ev.id, orderId: OS.editing || '', items: items, note: OS.note || '' })).then(function (d) {
      m.close(); toast('คำสั่งซื้อ ' + d.order.id + ' · ' + baht(d.order.total) + ' บาท', 'ok', d.isNew ? 'บันทึกคำสั่งซื้อแล้ว' : 'แก้ไขคำสั่งซื้อแล้ว');
      OS.cart = {}; OS.note = ''; OS.editing = null; OS.showForm = false; OS.payment = d.payment || OS.payment;
      reloadOrders().then(function () { var o = OS.orders.filter(function (x) { return x.id === d.order.id; })[0]; if (o) payModal(o); });
    }).catch(function (e) { errToast(e, 'บันทึกคำสั่งซื้อไม่สำเร็จ'); });
  };
}
function reloadOrders() {
  return api('getMyOrders', { eventId: OS.ev.id }).then(function (d) {
    OS.orders = d.orders; S.boot.orders = S.boot.orders || {};
    if (S.route === 'event') drawOrderEvent(d.event, d);
    return d;
  }).catch(errToast);
}
function payModal(o) {
  var pay = OS.payment || {};
  var m = modal({ title: 'ชำระเงิน · ' + esc(o.id), size: 'lg', foot: '<button class="btn" data-x>ไว้ภายหลัง</button><button class="btn primary" id="pySend" data-busy="กำลังส่งสลิป…" disabled>' + ic('send') + 'ส่งสลิปให้ HR ตรวจ</button>',
    body: '<div class="paygrid"><div class="qrbox"><div class="pphead"><b>PromptPay</b><span>พร้อมเพย์</span></div><div id="pyQr" class="qrimg">' + skel(1) + '</div>' +
      '<div class="amt"><small>ยอดที่ต้องโอน</small><b class="num">' + baht(o.total) + '</b> บาท</div><div class="small">' + esc(fmtPP(pay.promptpay)) + (pay.accountName ? '<br>' + esc(pay.accountName) : '') + '</div>' +
      '<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm" id="pySave">' + ic('download') + 'บันทึกรูป QR</button><button class="btn sm" id="pyCopy">' + ic('copy') + 'คัดลอกเลขพร้อมเพย์</button></div></div>' +
      '<div><ol class="paysteps"><li><b>สแกน QR</b> ด้วยแอปธนาคาร (หรือบันทึกรูป QR แล้วเลือกจากอัลบั้มในแอป) ยอดเงินถูกใส่ไว้แล้ว</li><li>ตรวจชื่อบัญชีผู้รับ และยอด <b>' + baht(o.total) + ' บาท</b> ให้ตรง</li><li>บันทึกสลิป แล้ว<b>แนบสลิป</b>ด้านล่าง</li></ol>' +
      (pay.note ? '<p class="small muted">' + esc(pay.note) + '</p>' : '') + '<p class="small muted">' + ic('info') + ' ชำระเป็นเงินสด: ติดต่อฝ่ายทรัพยากรบุคคล เจ้าหน้าที่จะบันทึกการรับเงินให้ในระบบ (ไม่ต้องแนบสลิป)</p>' +
      '<label class="dropzone" id="pyDrop" style="display:block"><input type="file" id="pyFile" accept="image/*" class="sr">' + ic('upload') + '<div><b>แตะเพื่อเลือกรูปสลิป</b></div><div class="small muted">หรือลากไฟล์มาวาง · JPG/PNG</div></label>' +
      '<div id="pyPrev" style="margin-top:12px"></div></div></div>' });
  promptpayQrDataUrl(pay.promptpay, o.total).then(function (url) {
    $('#pyQr').innerHTML = '<img src="' + url + '" alt="QR พร้อมเพย์ ' + baht(o.total) + ' บาท">';
    $('#pySave').onclick = function () { var a = document.createElement('a'); a.href = url; a.download = 'QR_' + o.id + '_' + o.total + 'บาท.png'; document.body.appendChild(a); a.click(); a.remove(); toast('บันทึกรูป QR แล้ว เปิดแอปธนาคาร › สแกน › เลือกรูปจากอัลบั้ม', 'ok'); };
  }).catch(function (e) { $('#pyQr').innerHTML = '<div class="muted small">' + esc(e.message) + '<br>โอนไปที่พร้อมเพย์ ' + esc(fmtPP(pay.promptpay)) + '</div>'; });
  $('#pyCopy').onclick = function () { copyText(String(pay.promptpay || ''), 'เลขพร้อมเพย์'); };
  var slip = null, drop = $('#pyDrop');
  var take = function (file) {
    if (!file) return;
    $('#pyPrev').innerHTML = '<div class="small muted"><span class="spin" style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite"></span> กำลังอ่านสลิป…</div>';
    prepareSlip(file).then(function (s) {
      slip = s;
      $('#pyPrev').innerHTML = '<div class="slipprev"><img src="' + s.dataUrl + '" alt="สลิป"><div>' + (s.ref ? '<span class="chip ok">' + ic('check') + ' อ่าน QR บนสลิปได้</span>' : '<span class="chip warn">' + ic('alert') + ' อ่าน QR บนสลิปไม่ได้</span><div class="small muted" style="margin-top:6px">ส่งได้ แต่ HR จะตรวจละเอียดขึ้น · แนะนำใช้ภาพสลิปจากแอป (ไม่ครอป) ที่เห็น QR มุมขวาล่าง</div>') +
        '<div class="small muted" style="margin-top:8px">ตรวจว่าเป็นสลิปยอด <b>' + baht(o.total) + ' บาท</b></div><button class="btn sm ghost" id="pyRe" style="margin-top:6px">เลือกรูปใหม่</button></div></div>';
      $('#pySend').disabled = false;
      $('#pyRe').onclick = function () { $('#pyFile').click(); };
    }).catch(function (e) { slip = null; $('#pySend').disabled = true; $('#pyPrev').innerHTML = ''; errToast(e, 'แนบสลิปไม่สำเร็จ'); });
  };
  $('#pyFile').onchange = function () { take(this.files[0]); };
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); take(e.dataTransfer.files[0]); });
  $('#pySend').onclick = function () {
    if (!slip) return;
    busy(this, api('uploadSlip', { orderId: o.id, dataUrl: slip.dataUrl, slipRef: slip.ref })).then(function (d) {
      m.close();
      modal({ title: '', foot: '<button class="btn primary block" data-x>เรียบร้อย</button>', body: '<div class="success-burst center"><div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3 style="font-size:22px">ส่งสลิปเรียบร้อย</h3><p class="muted">คำสั่งซื้อ ' + esc(o.id) + ' · ' + baht(o.total) + ' บาท<br>รอ HR ตรวจสอบ ระบบจะแจ้งสถานะในหน้านี้' + (S.me ? ' และทางอีเมล (ถ้ามี)' : '') + '</p></div>' });
      toast('ส่งสลิปคำสั่งซื้อ ' + o.id + ' แล้ว รอตรวจสอบ', 'ok');
      reloadOrders();
    }).catch(function (e) { errToast(e, 'ส่งสลิปไม่สำเร็จ'); });
  };
}
function showSlip(id) {
  var m = modal({ title: 'สลิป · ' + esc(id), body: skel(1) });
  api('getSlip', { orderId: id }).then(function (d) { $('.mb', m.el).innerHTML = '<div class="lightbox"><img src="' + d.dataUrl + '" alt="สลิป"></div><div class="small muted" style="margin-top:6px">แนบเมื่อ ' + esc(thDate(d.slipAt)) + '</div>'; }).catch(function (e) { m.close(); errToast(e); });
}

/* =================================================================== แอดมิน: คำสั่งซื้อ */
var AO = null;
function adminOrdersPage(id) {
  $('#page').innerHTML = skel(3);
  AO = AO && AO.id === id ? AO : { id: id, f: 'all', ful: '', q: '', sel: {}, page: 1 };
  var draw = function (d) { if (!$('#page') || S.wsTab !== 'orders') return; AO.d = d; drawAdminOrders(); };
  api('getOrders', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
}
function aoFiltered() {
  var q = AO.q.toLowerCase();
  return AO.d.orders.filter(function (o) {
    if (AO.f === 'cancelled') { if (!o.cancelled) return false; } else if (o.cancelled) return false;
    if (AO.f !== 'all' && AO.f !== 'cancelled' && o.payStatus !== AO.f) return false;
    if (AO.ful && o.fulfil !== AO.ful) return false;
    if (q && (o.id + ' ' + o.empCode + ' ' + o.name + ' ' + o.unit + ' ' + o.division + ' ' + o.phone).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function drawAdminOrders() {
  var d = AO.d, s = d.summary, ev = d.event;
  var cnt = { all: s.orders, PENDING: s.byPay.PENDING || 0, UNPAID: s.byPay.UNPAID || 0, REJECTED: s.byPay.REJECTED || 0, PAID: s.byPay.PAID || 0, cancelled: s.cancelled };
  var h = '<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">' +
    '<div class="kpi hero"><small>' + ic('shirt') + ' คำสั่งซื้อ</small><b class="num">' + nf(s.orders) + '</b><div class="sub">' + nf(s.people) + ' คน · ' + nf(s.qty) + ' ตัว</div></div>' +
    '<div class="kpi"><small>' + ic('check') + ' ชำระแล้ว</small><b class="num" style="color:var(--ok)">' + baht(s.paid) + '</b><div class="sub">' + nf(cnt.PAID) + ' รายการ · ' + nf(s.paidQty) + ' ตัว<br>โอน ' + baht(s.transfer) + ' · เงินสด ' + baht(s.cash) + '</div></div>' +
    '<button class="kpi" data-ff="PENDING" style="text-align:left;cursor:pointer"><small>' + ic('eye') + ' รอตรวจสลิป</small><b class="num" style="color:var(--info)">' + nf(cnt.PENDING) + '</b><div class="sub">' + baht(s.pending) + ' บาท · กดเพื่อตรวจ</div></button>' +
    '<button class="kpi" data-ff="UNPAID" style="text-align:left;cursor:pointer"><small>' + ic('clock') + ' รอชำระ</small><b class="num" style="color:var(--warn)">' + nf(cnt.UNPAID + cnt.REJECTED) + '</b><div class="sub">' + baht(s.unpaid) + ' บาท' + (cnt.REJECTED ? ' · ตีกลับ ' + cnt.REJECTED : '') + '</div></button>' +
    '<div class="kpi"><small>' + ic('users') + ' ยอดรวมทั้งหมด</small><b class="num">' + baht(s.total) + '</b><div class="sub">' + (d.allowedCount != null ? 'อนุญาต ' + nf(d.allowedCount) + ' คน' : 'ทุกคนสั่งได้') + '</div></div></div>';
  h += '<div class="card"><div class="bd" style="padding-bottom:8px"><div class="row between"><div class="seg" id="aoSeg">' + [['all', 'ทั้งหมด'], ['PENDING', 'รอตรวจสลิป'], ['UNPAID', 'รอชำระ'], ['REJECTED', 'ตีกลับ'], ['PAID', 'ชำระแล้ว'], ['cancelled', 'ยกเลิก']].map(function (x) {
    return '<button class="' + (AO.f === x[0] ? 'on' : '') + '" data-f="' + x[0] + '">' + x[1] + '<span class="c num">' + nf(cnt[x[0]] || 0) + '</span></button>'; }).join('') + '</div>' +
    '<div class="row"><button class="btn sm" id="aoAllow">' + ic('users') + 'รายชื่อที่อนุญาต</button><button class="btn sm" id="aoNew">' + ic('plus') + 'สร้างแทน</button><button class="btn sm primary" id="aoExp" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'Excel</button></div></div>' +
    '<div class="filters" style="margin-top:10px"><input class="input search" id="aoQ" placeholder="ค้นหา เลขที่ / รหัส / ชื่อ / หน่วย / เบอร์" value="' + esc(AO.q) + '"><select class="input" id="aoFul"><option value="">ทุกสถานะจัดส่ง</option>' + FULFIL_KEYS.map(function (k) { return '<option value="' + k + '" ' + (AO.ful === k ? 'selected' : '') + '>' + FULFIL_TH[k] + '</option>'; }).join('') + '</select></div>' +
    '<div id="aoBulk"></div></div><div id="aoTable"></div></div>';
  $('#page').innerHTML = h;
  drawAoTable();
  $$('#aoSeg [data-f]').forEach(function (b) { b.onclick = function () { AO.f = b.dataset.f; AO.page = 1; AO.sel = {}; drawAdminOrders(); }; });
  $$('[data-ff]').forEach(function (b) { b.onclick = function () { AO.f = b.dataset.ff; AO.page = 1; drawAdminOrders(); }; });
  $('#aoQ').oninput = debounce(function () { AO.q = $('#aoQ').value.trim(); AO.page = 1; drawAoTable(); }, 200);
  $('#aoFul').onchange = function () { AO.ful = this.value; AO.page = 1; drawAoTable(); };
  $('#aoExp').onclick = function () { busy(this, exportOrders(AO.d)).catch(errToast); };
  $('#aoNew').onclick = function () { adminOrderModal(null); };
  $('#aoAllow').onclick = allowListModal;
}
function drawAoTable() {
  var list = aoFiltered(), pages = Math.max(1, Math.ceil(list.length / 50)); if (AO.page > pages) AO.page = pages;
  var slice = list.slice((AO.page - 1) * 50, AO.page * 50), selN = Object.keys(AO.sel).filter(function (k) { return AO.sel[k]; }).length;
  $('#aoBulk').innerHTML = selN ? '<div class="bulkbar">' + ic('check') + ' เลือก ' + selN + ' รายการ (ชำระแล้ว) · เปลี่ยนสถานะเป็น <select class="input" id="bkSt" style="width:auto;min-height:36px;padding:4px 10px">' + FULFIL_KEYS.map(function (k) { return '<option value="' + k + '">' + FULFIL_TH[k] + '</option>'; }).join('') + '</select>' +
    '<label class="switch small"><input type="checkbox" id="bkMail" checked><span class="tr"></span>แจ้งทางอีเมล</label><button class="btn sm primary" id="bkGo" data-busy="กำลังบันทึก…">บันทึก</button><button class="btn sm ghost" id="bkClr">ล้างที่เลือก</button></div>' : '';
  $('#aoTable').innerHTML = '<div class="tablewrap resp"><table class="t"><thead><tr><th style="width:34px"><input type="checkbox" id="aoAll" title="เลือกทั้งหมดที่ชำระแล้ว"></th><th>เลขที่ / ผู้สั่ง</th><th>รายการ</th><th class="r">ยอด (บาท)</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
    (slice.length ? slice.map(function (o) {
      return '<tr><td>' + (o.payStatus === 'PAID' && !o.cancelled ? '<input type="checkbox" data-sel="' + esc(o.id) + '" ' + (AO.sel[o.id] ? 'checked' : '') + '>' : '') + '</td>' +
        '<td><div class="nm">' + esc(o.id) + ' · ' + esc(o.name) + '</div><div class="sub">' + esc(o.empCode + ' · ' + (o.unit || o.division)) + (o.phone ? ' · ' + pii(o.phone, 'tel') : '') + '</div><div class="sub">' + esc(thShort(o.createdAt)) + (o.note ? ' · 📝 ' + esc(o.note) : '') + '</div></td>' +
        '<td>' + itemsHtml(o.items) + '</td><td class="r num"><b>' + baht(o.total) + '</b>' + (o.shipping ? '<div class="sub">ค่าส่ง ' + baht(o.shipping) + '</div>' : '') + '</td>' +
        '<td>' + payChip(o) + (o.payStatus === 'PAID' ? '<div class="sub">' + (o.payMethod === 'CASH' ? '<span class="chip warn" style="padding:0 8px">' + ic('cash') + ' เงินสด</span> ' : o.payMethod === 'TRANSFER' ? 'โอน · ' : '') + 'โดย ' + esc(o.verifiedBy) + (o.cashNote ? ' · ' + esc(o.cashNote) : '') + '</div>' : '') + (o.payStatus === 'PENDING' && !o.slipRefFull ? '<div class="sub" style="color:var(--warn)">อ่าน QR สลิปไม่ได้</div>' : '') + '</td>' +
        '<td class="r" style="white-space:nowrap">' + (o.hasSlip ? '<button class="btn sm ' + (o.payStatus === 'PENDING' ? 'primary' : '') + '" data-rv="' + esc(o.id) + '">' + ic('eye') + (o.payStatus === 'PENDING' ? 'ตรวจสลิป' : 'สลิป') + '</button> ' : (o.payStatus !== 'PAID' && !o.cancelled ? '<button class="btn sm" data-rv="' + esc(o.id) + '">' + ic('check') + 'ยืนยันชำระ</button> ' : '')) +
        (o.payStatus !== 'PAID' && !o.cancelled ? '<button class="btn sm" data-cash="' + esc(o.id) + '" title="บันทึกรับเงินสด">' + ic('cash') + 'เงินสด</button> ' : '') +
        '<button class="iconbtn" data-ed="' + esc(o.id) + '" title="แก้ไข">' + ic('edit') + '</button><button class="iconbtn" data-hi="' + esc(o.id) + '" title="ประวัติ">' + ic('history') + '</button></td></tr>';
    }).join('') : '<tr><td colspan="6"><div class="empty">' + ic('shirt') + '<p>ไม่มีคำสั่งซื้อในหมวดนี้</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + slice.map(function (o) { return '<div class="mi"><div class="x"><b>' + esc(o.id) + ' · ' + esc(o.name) + '</b><small>' + esc(o.unit || o.division) + '</small><div class="row" style="margin-top:4px">' + itemsHtml(o.items) + '</div><div class="row" style="margin-top:6px">' + payChip(o) + '<b class="num">' + baht(o.total) + ' ฿</b></div></div><div style="display:flex;flex-direction:column;gap:6px">' + (o.hasSlip || (o.payStatus !== 'PAID' && !o.cancelled) ? '<button class="btn sm ' + (o.payStatus === 'PENDING' ? 'primary' : '') + '" data-rv="' + esc(o.id) + '">' + ic('eye') + '</button>' : '') + '<button class="btn sm" data-ed="' + esc(o.id) + '">' + ic('edit') + '</button></div></div>'; }).join('') + '</div></div>' +
    '<div class="pager"><span>' + nf(list.length) + ' รายการ · รวม ' + baht(list.reduce(function (a, o) { return a + o.total; }, 0)) + ' บาท</span><div class="row"><button class="btn sm" id="aoPrev" ' + (AO.page <= 1 ? 'disabled' : '') + '>' + ic('arrowl') + '</button><span class="num">หน้า ' + AO.page + '/' + pages + '</span><button class="btn sm" id="aoNext" ' + (AO.page >= pages ? 'disabled' : '') + '>' + ic('arrowr') + '</button></div></div>';
  $('#aoPrev').onclick = function () { AO.page--; drawAoTable(); };
  $('#aoNext').onclick = function () { AO.page++; drawAoTable(); };
  $$('[data-sel]').forEach(function (c) { c.onchange = function () { AO.sel[c.dataset.sel] = c.checked; drawAoTable(); }; });
  $('#aoAll').onchange = function () { var on = this.checked; aoFiltered().forEach(function (o) { if (o.payStatus === 'PAID' && !o.cancelled) AO.sel[o.id] = on; }); drawAoTable(); };
  $$('[data-rv]').forEach(function (b) { b.onclick = function () { reviewModal(b.dataset.rv); }; });
  $$('[data-cash]').forEach(function (b) { b.onclick = function () { cashModal(AO.d.orders.filter(function (o) { return o.id === b.dataset.cash; })[0]); }; });
  $$('[data-ed]').forEach(function (b) { b.onclick = function () { adminOrderModal(AO.d.orders.filter(function (o) { return o.id === b.dataset.ed; })[0]); }; });
  $$('[data-hi]').forEach(function (b) { b.onclick = function () { orderHistory(b.dataset.hi); }; });
  var go = $('#bkGo');
  if (go) {
    go.onclick = function () {
      var ids = Object.keys(AO.sel).filter(function (k) { return AO.sel[k]; }), st = $('#bkSt').value;
      busy(go, api('setFulfil', { orderIds: ids, fulfil: st, notify: $('#bkMail').checked })).then(function (r) { toast('เปลี่ยนเป็น "' + FULFIL_TH[st] + '" ' + r.changed + ' รายการ', 'ok'); AO.sel = {}; adminOrdersPage(AO.id); }).catch(errToast);
    };
    $('#bkClr').onclick = function () { AO.sel = {}; drawAoTable(); };
  }
}
function reviewModal(id) {
  var o = AO.d.orders.filter(function (x) { return x.id === id; })[0];
  var pend = aoFiltered().filter(function (x) { return x.payStatus === 'PENDING' && x.id !== id; });
  var m = modal({ title: 'ตรวจการชำระ · ' + esc(o.id), size: 'xl',
    foot: (o.payStatus !== 'UNPAID' && !o.cancelled ? '<button class="btn ghost" id="rvUndo" style="margin-right:auto">ย้อนเป็นรอชำระ</button>' : '') + (o.payStatus !== 'PAID' && !o.cancelled ? '<button class="btn" id="rvCash">' + ic('cash') + 'รับเงินสดแทน</button>' : '') + '<button class="btn danger" id="rvRej">' + ic('x') + 'ตีกลับ</button><button class="btn primary" id="rvOk" data-busy="กำลังบันทึก…">' + ic('check') + 'ยืนยันชำระ ' + baht(o.total) + ' บาท' + (pend.length ? ' · ถัดไป' : '') + '</button>',
    body: '<div class="paygrid"><div class="slipbig" id="rvSlip">' + (o.hasSlip ? skel(1) : '<div class="empty">' + ic('info') + '<p>ไม่มีสลิป<br><span class="small">ใช้กรณีชำระเงินสด/โอนแล้วส่งสลิปทางอื่น</span></p></div>') + '</div>' +
      '<div><dl class="kv"><dt>ผู้สั่ง</dt><dd>' + esc(o.name) + '<div class="small muted">' + esc(o.empCode + ' · ' + (o.unit || '') + ' ' + o.division) + '</div></dd><dt>โทร</dt><dd>' + esc(o.phone || '-') + '</dd><dt>สั่งเมื่อ</dt><dd>' + esc(thDate(o.createdAt)) + '</dd>' +
      '<dt>แนบสลิป</dt><dd>' + (o.slipAt ? esc(thDate(o.slipAt)) : '-') + '</dd><dt>QR บนสลิป</dt><dd>' + (o.slipRefFull ? '<span class="chip ok">อ่านได้ ไม่ซ้ำ</span><div class="small muted" style="word-break:break-all">' + esc(o.slipRefFull.slice(0, 60)) + '</div>' : '<span class="chip warn">อ่านไม่ได้ — ตรวจด้วยตา</span>') + '</dd><dt>สถานะ</dt><dd>' + payChip(o) + '</dd></dl>' +
      '<table class="t" style="margin-top:12px"><tbody>' + o.items.map(function (i) { return '<tr><td>' + esc(i.optLabel + ' ' + i.sizeCode) + '</td><td class="r">×' + i.qty + '</td><td class="r num">' + baht(i.amount) + '</td></tr>'; }).join('') +
      (o.shipping ? '<tr><td>ค่าส่ง</td><td></td><td class="r num">' + baht(o.shipping) + '</td></tr>' : '') + '<tr style="font-weight:700;font-size:17px"><td>ยอดที่ต้องตรง</td><td></td><td class="r num" style="color:var(--accent-2)">' + baht(o.total) + ' ฿</td></tr></tbody></table>' +
      '<div class="announce" style="margin-top:12px;background:var(--info-soft);border-color:#cfe0fb;color:#1e40af">' + ic('info') + '<div>ตรวจ 3 อย่างบนสลิป: <b>ยอดเงิน</b> ตรง · <b>ผู้รับ</b> = พร้อมเพย์ ' + esc(fmtPP((AO.d.payment || {}).promptpay)) + ' · <b>วันที่</b> หลังวันสั่งซื้อ</div></div>' +
      '<div class="field" style="margin-top:12px"><label class="f">เหตุผล (กรณีตีกลับ) / หมายเหตุ</label><input class="input" id="rvReason" placeholder="เช่น ยอดไม่ตรง ขาด 150 บาท"></div></div></div>' });
  if (o.hasSlip) api('getSlip', { orderId: id }).then(function (d) { $('#rvSlip').innerHTML = '<img src="' + d.dataUrl + '" alt="สลิป">'; }).catch(function (e) { $('#rvSlip').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  var after = function (r, msg) {
    var i = AO.d.orders.findIndex(function (x) { return x.id === r.id; }); if (i >= 0) AO.d.orders[i] = r;
    toast(msg, 'ok'); m.close();
    if (pend.length) reviewModal(pend[0].id); else adminOrdersPage(AO.id);
  };
  $('#rvOk').onclick = function () { busy(this, api('verifyOrder', { orderId: id, action: 'PAID', reason: $('#rvReason').value.trim() })).then(function (r) { after(r, o.id + ' ยืนยันชำระแล้ว'); }).catch(errToast); };
  $('#rvRej').onclick = function () { var why = $('#rvReason').value.trim(); if (!why) { toast('กรุณาระบุเหตุผลที่ตีกลับ', 'warn'); $('#rvReason').focus(); return; } busy(this, api('verifyOrder', { orderId: id, action: 'REJECT', reason: why })).then(function (r) { after(r, o.id + ' ตีกลับแล้ว ผู้สั่งต้องแนบสลิปใหม่'); }).catch(errToast); };
  var rc = $('#rvCash'); if (rc) rc.onclick = function () { m.close(); cashModal(o); };
  var u = $('#rvUndo'); if (u) u.onclick = function () { busy(this, api('verifyOrder', { orderId: id, action: 'UNPAID', reason: $('#rvReason').value.trim() })).then(function (r) { pend = []; after(r, o.id + ' ย้อนเป็นรอชำระ'); }).catch(errToast); };
}
function orderHistory(id) {
  var m = modal({ title: 'ประวัติ · ' + esc(id), body: skel(1) });
  api('listAudit', { q: id, limit: 50 }).then(function (l) {
    $('.mb', m.el).innerHTML = l.length ? '<ul class="recent">' + l.map(function (a) { return '<li><span class="chip">' + esc(AUDIT_TH[a.action] || a.action) + '</span><div style="flex:1"><b>' + esc(a.detail) + '</b><div class="small muted">โดย ' + esc(a.actor) + ' · ' + esc(thDate(a.ts)) + '</div></div></li>'; }).join('') + '</ul>' : '<div class="empty">ไม่มีประวัติ</div>';
  }).catch(errToast);
}
function adminOrderModal(o) {
  var ev = AO.d.event, cfg = ev.config, cart = {};
  if (o) o.items.forEach(function (i) { cart[i.optKey + '|' + i.sizeCode] = i.qty; });
  var body = (o ? '<div class="small muted" style="margin-bottom:8px">' + esc(o.id) + ' · ' + esc(o.name) + ' · ' + payChip(o) + '</div>' : '<div class="field"><label class="f">รหัสพนักงานผู้สั่ง</label><input class="input" id="amEmp" inputmode="numeric" placeholder="เลขประจำตัวบุคลากร 7 หลัก"></div>') +
    (cfg.options || []).map(function (op) {
      return '<h4 style="margin:10px 0 6px">' + esc(op.label) + '</h4><div class="qgrid sm">' + op.sizes.filter(function (s) { return !s.hidden; }).map(function (s) {
        var k = op.key + '|' + s.code; return '<div class="qcell"><div class="qtop"><b>' + esc(s.code) + '</b><span class="price">' + baht(s.price) + '</span></div><input class="input" type="number" min="0" data-am="' + esc(k) + '" value="' + (cart[k] || 0) + '"></div>';
      }).join('') + '</div>';
    }).join('') + '<div class="grid2" style="margin-top:12px"><div class="field"><label class="f">หมายเหตุผู้สั่ง</label><input class="input" id="amNote" value="' + esc(o ? o.note : '') + '"></div><div class="field"><label class="f">บันทึกของแอดมิน</label><input class="input" id="amAdm" value="' + esc(o ? o.adminNote || '' : '') + '"></div></div>' +
    (!o || o.payStatus !== 'PAID' ? '<div class="row" style="gap:12px;margin-top:4px"><label class="switch"><input type="checkbox" id="amCash"><span class="tr"></span>รับเงินสดแล้ว (บันทึกเป็นชำระแล้ว)</label><input class="input" id="amCashNote" placeholder="เลขใบเสร็จ/หมายเหตุ (ถ้ามี)" style="flex:1;min-width:180px"></div>' : '') +
    (o && o.payStatus === 'PAID' ? '<div class="announce">' + ic('alert') + '<div>คำสั่งซื้อนี้ชำระแล้ว ถ้าแก้จำนวนจนยอดเปลี่ยน ต้องเก็บเงินเพิ่ม/คืนเงินส่วนต่างเอง</div></div>' : '');
  var m = modal({ title: o ? 'แก้ไขคำสั่งซื้อ' : 'สร้างคำสั่งซื้อแทน', size: 'lg', body: body,
    foot: (o ? '<button class="btn danger" id="amCancel" style="margin-right:auto">' + (o.cancelled ? 'คืนสถานะคำสั่งซื้อ' : ic('trash') + 'ยกเลิกคำสั่งซื้อ') + '</button>' : '') + '<button class="btn" data-x>ปิด</button><button class="btn primary" id="amSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  $('#amSave').onclick = function () {
    var items = $$('[data-am]', m.el).map(function (i) { var p = i.dataset.am.split('|'); return { optKey: p[0], sizeCode: p[1], qty: +i.value || 0 }; }).filter(function (i) { return i.qty > 0; });
    var emp = o ? o.empCode : $('#amEmp').value.trim();
    busy(this, api('adminSaveOrder', { eventId: ev.id, orderId: o ? o.id : '', empCode: emp, items: items, note: $('#amNote').value, adminNote: $('#amAdm').value, paidCash: !!($('#amCash') && $('#amCash').checked), cashNote: $('#amCashNote') ? $('#amCashNote').value : '' })).then(function (r) { m.close(); toast((o ? 'แก้ไข ' : 'สร้าง ') + r.id + ' · ' + baht(r.total) + ' บาท', 'ok'); adminOrdersPage(AO.id); }).catch(errToast);
  };
  var c = $('#amCancel');
  if (c) c.onclick = function () {
    var restore = o.cancelled;
    confirmBox({ title: restore ? 'คืนสถานะ ' + o.id + '?' : 'ยกเลิก ' + o.id + '?', danger: !restore, ok: restore ? 'คืนสถานะ' : 'ยกเลิกคำสั่งซื้อ', msg: !restore && o.payStatus === 'PAID' ? '<b style="color:var(--danger)">ชำระแล้ว ' + baht(o.total) + ' บาท — ต้องคืนเงินให้ผู้สั่ง</b>' : '' }).then(function (y) {
      if (!y) return;
      api('adminCancelOrder', { orderId: o.id, restore: restore, reason: $('#amAdm') ? $('#amAdm').value : '' }).then(function () { m.close(); toast(restore ? 'คืนสถานะแล้ว' : 'ยกเลิกแล้ว', 'ok'); adminOrdersPage(AO.id); }).catch(errToast);
    });
  };
}
function allowListModal() {
  var ev = (AD.events || []).filter(function (e) { return e.id === AO.id; })[0] || AO.d.event, a = ev.audience || {};
  var all = a.mode !== 'FILTER';
  var m = modal({ title: 'รายชื่อที่อนุญาตให้สั่ง', size: 'lg', body: '<div class="seg" id="alMode" style="margin-bottom:12px"><button class="' + (all ? 'on' : '') + '" data-m="ALL">บุคลากรทุกคน</button><button class="' + (all ? '' : 'on') + '" data-m="FILTER">เฉพาะรหัสที่ระบุ</button></div>' +
    '<div id="alBox"' + (all ? ' style="display:none"' : '') + '><label class="f">รหัสพนักงาน (คั่นด้วย , เว้นวรรค หรือขึ้นบรรทัดใหม่ · วางจาก Excel ได้)</label><textarea class="input" id="alCodes" style="min-height:180px">' + esc((a.codes || []).join('\n')) + '</textarea><div class="small" id="alInfo" style="margin-top:6px"></div></div>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="alSave" data-busy="กำลังบันทึก…">บันทึก</button>' });
  var mode = all ? 'ALL' : 'FILTER';
  $$('#alMode [data-m]').forEach(function (b) { b.onclick = function () { mode = b.dataset.m; $$('#alMode button').forEach(function (x) { x.classList.toggle('on', x === b); }); $('#alBox').style.display = mode === 'FILTER' ? '' : 'none'; }; });
  var parse = function () { var seen = {}; return $('#alCodes').value.split(/[^0-9]+/).filter(function (x) { if (!/^\d{4,10}$/.test(x) || seen[x]) return false; seen[x] = 1; return true; }); };
  var info = function () { $('#alInfo').innerHTML = '<b>' + parse().length + '</b> รหัส (ไม่นับซ้ำ)'; };
  $('#alCodes').oninput = debounce(info, 200); info();
  $('#alSave').onclick = function () {
    var codes = parse();
    if (mode === 'FILTER' && !codes.length) return toast('กรุณาใส่รหัสอย่างน้อย 1 รหัส', 'warn');
    var e2 = Object.assign({}, ev, { audience: mode === 'ALL' ? { mode: 'ALL' } : { mode: 'FILTER', codes: codes } });
    busy(this, api('saveEvent', { event: e2 })).then(function () { m.close(); AD.events = null; toast(mode === 'ALL' ? 'เปิดให้ทุกคนสั่งได้' : 'บันทึกรายชื่อที่อนุญาต ' + codes.length + ' คน', 'ok'); loadEvents(true).then(function () { adminOrdersPage(AO.id); }); }).catch(errToast);
  };
}

/* ---------- สรุปสำหรับสั่งต่อ ---------- */
function adminOrderSummaryPage(id) {
  $('#page').innerHTML = skel(2);
  api('getOrders', { eventId: id }, { fresh: true }).then(function (d) {
    if (S.wsTab !== 'summary') return;
    var paidOnly = AO && AO.sumPaid;
    var h = '<div class="row between" style="margin-bottom:12px"><div class="seg" id="smSeg"><button class="' + (paidOnly ? '' : 'on') + '" data-p="0">ทุกคำสั่งซื้อ (ไม่รวมยกเลิก)</button><button class="' + (paidOnly ? 'on' : '') + '" data-p="1">เฉพาะชำระแล้ว</button></div>' +
      '<div class="row"><button class="btn sm" id="smCopy">' + ic('copy') + 'คัดลอกตาราง</button><button class="btn sm primary" id="smExp" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'Excel</button></div></div>';
    var tq = 0, tm = 0;
    h += '<div class="dgrid">' + '<div class="card"><div class="hd"><h3>' + ic('shirt') + ' จำนวนตามไซซ์ (สำหรับสั่งต่อ)</h3></div><div class="bd">' + d.sizes.map(function (o) {
      var sum = 0; var rows = o.sizes.map(function (s) { var n = paidOnly ? s.paid : s.all; sum += n; tq += n; tm += n * (+s.price || 0); return '<tr><td><b>' + esc(s.code) + '</b></td><td class="r num">' + baht(s.price) + '</td><td class="r num" style="font-size:16px"><b>' + n + '</b></td><td class="r num">' + baht(n * s.price) + '</td></tr>'; }).join('');
      return '<h4 style="margin:8px 0 4px">' + esc(o.label) + ' · ' + sum + ' ตัว</h4><table class="t"><thead><tr><th>ไซซ์</th><th class="r">ราคา</th><th class="r">จำนวน</th><th class="r">เป็นเงิน</th></tr></thead><tbody>' + rows + '</tbody></table>';
    }).join('') + '<div class="row between" style="margin-top:12px;font-size:17px"><b>รวม ' + nf(tq) + ' ตัว</b><b>' + baht(tm) + ' บาท</b></div></div></div>' +
      '<div class="card"><div class="hd"><h3>' + ic('chart') + ' การเงิน</h3></div><div class="bd"><dl class="kv"><dt>ยอดรวมทั้งหมด</dt><dd>' + baht(d.summary.total) + ' บาท</dd><dt>ชำระแล้ว</dt><dd style="color:var(--ok)">' + baht(d.summary.paid) + ' บาท</dd><dt>· โอน (สลิป)</dt><dd>' + baht(d.summary.transfer) + ' บาท (' + d.summary.transferN + ')</dd><dt>· เงินสด</dt><dd>' + baht(d.summary.cash) + ' บาท (' + d.summary.cashN + ')</dd><dt>รอตรวจสลิป</dt><dd>' + baht(d.summary.pending) + ' บาท</dd><dt>รอชำระ</dt><dd style="color:var(--warn)">' + baht(d.summary.unpaid) + ' บาท</dd><dt>ยกเลิก</dt><dd>' + nf(d.summary.cancelled) + ' รายการ</dd></dl>' +
      '<h4 style="margin:16px 0 6px">สถานะจัดส่ง (ชำระแล้ว)</h4>' + FULFIL_KEYS.map(function (k) { return '<div class="row between" style="padding:4px 0"><span>' + FULFIL_TH[k] + '</span><b class="num">' + nf(d.summary.byFulfil[k] || 0) + '</b></div>'; }).join('') + '</div></div></div>';
    $('#page').innerHTML = h;
    $$('#smSeg [data-p]').forEach(function (b) { b.onclick = function () { AO = AO || {}; AO.sumPaid = b.dataset.p === '1'; adminOrderSummaryPage(id); }; });
    $('#smExp').onclick = function () { busy(this, exportOrders(d)).catch(errToast); };
    $('#smCopy').onclick = function () { var lines = ['แบบ\tไซซ์\tจำนวน']; d.sizes.forEach(function (o) { o.sizes.forEach(function (s) { lines.push(o.label + '\t' + s.code + '\t' + (paidOnly ? s.paid : s.all)); }); }); copyText(lines.join('\n'), 'ตารางไซซ์ (วางใน Excel ได้)'); };
  }).catch(errToast);
}
function exportOrders(d) {
  var ev = d.event, live = d.orders.filter(function (o) { return !o.cancelled; });
  var sz = [['แบบ', 'ไซซ์', 'ราคา', 'จำนวน (ทั้งหมด)', 'จำนวน (ชำระแล้ว)', 'เป็นเงิน (ชำระแล้ว)']];
  d.sizes.forEach(function (o) { o.sizes.forEach(function (s) { sz.push([o.label, s.code, +s.price, s.all, s.paid, s.paid * s.price]); }); });
  var ord = [['เลขที่', 'วันที่สั่ง', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'หน่วย', 'ฝ่าย', 'โทร', 'รายการ', 'จำนวน', 'ค่าส่ง', 'ยอดรวม', 'สถานะชำระ', 'วิธีชำระ', 'สถานะจัดส่ง', 'ตรวจโดย', 'หมายเหตุ', 'ยกเลิก']];
  d.orders.forEach(function (o) { ord.push([o.id, thDate(o.createdAt), o.empCode, o.name, o.unit, o.division, o.phone, o.items.map(function (i) { return i.optLabel.replace(/^แบบ/, '') + ' ' + i.sizeCode + '×' + i.qty; }).join(', '), o.qty, o.shipping, o.total, PAY_TH[o.payStatus], { CASH: 'เงินสด', TRANSFER: 'โอน', OTHER: 'อื่น ๆ' }[o.payMethod] || '', FULFIL_TH[o.fulfil] || '', o.verifiedBy || '', o.note || '', o.cancelled ? 'ยกเลิก' : '']); });
  var lines = [['เลขที่', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'หน่วย', 'ฝ่าย', 'แบบ', 'ไซซ์', 'จำนวน', 'ราคา', 'เป็นเงิน', 'สถานะชำระ']];
  live.forEach(function (o) { o.items.forEach(function (i) { lines.push([o.id, o.empCode, o.name, o.unit, o.division, i.optLabel, i.sizeCode, i.qty, i.price, i.amount, PAY_TH[o.payStatus]]); }); });
  return exportXlsx('คำสั่งซื้อ_' + ev.title.replace(/[\\\/:*?"<>|]/g, '').slice(0, 30) + '_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'สรุปไซซ์', rows: sz }, { name: 'คำสั่งซื้อ', rows: ord }, { name: 'รายการรายตัว', rows: lines }]);
}

function cashModal(o) {
  var m = modal({ title: 'รับเงินสด · ' + esc(o.id), foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="csOk" data-busy="กำลังบันทึก…">' + ic('cash') + 'ยืนยันรับเงินสด ' + baht(o.total) + ' บาท</button>',
    body: '<div class="center"><div class="bigicon acc">' + ic('cash') + '</div><div class="muted">' + esc(o.name) + ' · ' + esc(o.empCode) + '</div><div style="font-family:var(--font-head);font-size:40px;margin:6px 0">' + baht(o.total) + ' <small style="font-size:16px">บาท</small></div><div class="row" style="justify-content:center">' + itemsHtml(o.items) + '</div></div>' +
      '<div class="field" style="margin-top:14px"><label class="f">เลขที่ใบเสร็จ / หมายเหตุ (ถ้ามี)</label><input class="input" id="csNote" placeholder="เช่น ใบเสร็จเล่ม 1 เลขที่ 023"></div>' +
      '<div class="small muted">' + ic('info') + ' ระบบบันทึกว่า "ชำระแล้ว · เงินสด" โดยรหัสของคุณ และส่งอีเมลยืนยันถึงผู้สั่ง (ถ้ามีอีเมล)</div>' });
  $('#csOk').onclick = function () {
    busy(this, api('verifyOrder', { orderId: o.id, action: 'PAID', method: 'CASH', reason: $('#csNote').value.trim() })).then(function () { m.close(); toast(o.id + ' รับเงินสด ' + baht(o.total) + ' บาทแล้ว', 'ok'); adminOrdersPage(AO.id); }).catch(errToast);
  };
}
