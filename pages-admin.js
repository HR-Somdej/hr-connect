/* SOMDEJ HR Connect — pages-admin.js : แดชบอร์ด · ติดตาม · รายงาน · อีเมล · กิจกรรม · รายชื่อ · หัวหน้า · ตั้งค่า */

var AD = { events: null };
var STATUS_TH = { ORDERED: 'จองแล้ว', DECLINED: 'ไม่ประสงค์', '': 'ยังไม่ตอบ' };
function stTh(ev, st) {
  if (st === 'ORDERED' && ev) { if (ev.type === 'PICK') return 'เลือกแล้ว'; if (ev.type === 'NOMINATE') return 'เสนอชื่อแล้ว'; if (ev.type === 'CHECKIN') return 'เช็กอินแล้ว'; }
  if (!st && ev && ev.type === 'CHECKIN') return 'ยังไม่เข้าร่วม';
  return STATUS_TH[st || ''];
}
var FLAG_TH = { NEW_API: 'พบใหม่จาก API', NOT_IN_API: 'ไม่พบใน API', MANUAL: 'เพิ่มเอง' };
function pickItems(ev) { var m = {}; ((ev.config || {}).items || []).forEach(function (it) { m[it.key] = it; }); return m; }
var MAIL_TH = { ANNOUNCE: 'ประกาศเปิดกิจกรรมถึงทุกคน', REMIND_STAFF: 'เตือนบุคลากรที่ยังไม่ตอบ', HEAD_SUMMARY: 'สรุปถึงหัวหน้าฝ่าย/หน่วย', ADMIN_SUMMARY: 'สรุปภาพรวมถึงผู้ดูแล', CONFIRM: 'ยืนยันการบันทึกถึงบุคลากร' };

function needAdmin() { if (!isAdmin()) { $('#page').innerHTML = '<div class="card empty">' + ic('shield') + '<p>เฉพาะผู้ดูแลระบบ</p></div>'; return false; } return true; }
function needSuper() { if (!isSuper()) { $('#page').innerHTML = '<div class="card empty">' + ic('shield') + '<p>เมนูนี้สำหรับผู้ดูแลสูงสุดเท่านั้น</p></div>'; return false; } return true; }
function needViewer() { if (!isAdmin() && !isHead()) { $('#page').innerHTML = '<div class="card empty">' + ic('shield') + '<p>เฉพาะผู้ดูแลระบบและหัวหน้าฝ่าย/หน่วย</p></div>'; return false; } return true; }
function loadEvents(force) {
  if (!isAdmin()) return Promise.resolve(AD.events = (S.boot.events || []).filter(function (e) { return ['ORDER', 'QUESTION', 'CHECKIN'].indexOf(e.type) < 0; }));
  if (AD.events && !force) return Promise.resolve(AD.events);
  return api('listEvents', {}).then(function (l) {
    // ผู้ดูแลกิจกรรมที่เป็นหัวหน้าด้วย: เห็นกิจกรรมอื่นในฐานะหัวหน้า (ดูอย่างเดียว)
    if (isHead() && !isSuper()) (S.boot.events || []).forEach(function (e) { if (['ORDER', 'QUESTION', 'CHECKIN'].indexOf(e.type) < 0 && !l.some(function (x) { return x.id === e.id; })) l.push(e); });
    AD.events = l; return l;
  });
}
function eventPicker(cur, base) {
  if (S.inWs) return '';
  var list = AD.events || S.boot.events || [];
  if (list.length < 2) return '';
  return '<select class="input" style="width:auto;min-height:40px" onchange="go(\'#/admin/' + base + '/\'+this.value)">' + list.map(function (e) { return '<option value="' + esc(e.id) + '" ' + (e.id === cur ? 'selected' : '') + '>' + esc(e.title) + '</option>'; }).join('') + '</select>';
}
function withEvent(params, base, fn) {
  if (!needViewer()) return;
  $('#page').innerHTML = skel(3);
  loadEvents().then(function (list) {
    var id = params[0] || (list[0] && list[0].id);
    if (!id) { $('#page').innerHTML = '<div class="card empty">' + ic('layers') + '<p>ยังไม่มีกิจกรรม</p>' + (isAdmin() ? '<a class="btn primary" href="#/admin/events">สร้างกิจกรรม</a>' : '') + '</div>'; return; }
    if (!params[0]) { history.replaceState(null, '', '#/admin/' + base + '/' + id); }
    S.lastAdminEvent = id;
    var ev = list.filter(function (e) { return e.id === id; })[0];
    setAccent(ev ? ev.color : '#8E4B9D');
    fn(id, ev);
  }).catch(errToast);
}
function scopeNote(evId) {
  if (evId ? canEv(evId) : isSuper()) return '';
  return '<div class="announce" style="background:var(--info-soft);border-color:#cfe0fb;color:#1e40af">' + ic('info') + '<div>ท่านเห็นข้อมูลเฉพาะ: <b>' + S.me.scopes.map(function (s) { return (s.level === 'UNIT' ? 'หน่วย ' : '') + esc(s.scope.replace(/^รพ\.สมเด็จฯ - /, '')); }).join(', ') + '</b> (ดูอย่างเดียว)</div></div>';
}

/* =================================================================== แดชบอร์ด */
ROUTES['admin/dashboard'] = function (params) {
  withEvent(params, 'dashboard', function (id) {
    document.title = 'แดชบอร์ด · SOMDEJ HR Connect';
    var draw = function (d) { if (S.wsTab === 'overview') drawDash(d); };
    api('getDashboard', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
  });
};
function drawDash(d) {
  var k = d.kpi, ev = d.event;
  var h = pageHead('ภาพรวม', 'ข้อมูล ณ ' + esc(thShort(d.generatedAt)),
    eventPicker(ev.id, 'dashboard') + '<button class="btn" id="dRefresh">' + ic('refresh') + 'รีเฟรช</button><button class="btn primary" id="dExport" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'ส่งออก Excel</button>', 'แดชบอร์ด');
  h += scopeNote(ev.id);
  var isPick = ev.type === 'PICK';
  h += '<div class="kpis"><div class="kpi hero"><small>' + ic('chart') + ' ความคืบหน้า</small><b class="num">' + k.pct + '%</b><div class="sub">ตอบแล้ว ' + nf(k.done) + ' จาก ' + nf(k.target) + ' คน</div>' + ring(k.pct, 70) + '</div>' +
    '<div class="kpi"><small>' + ic('shirt') + (isPick ? ' เลือกแล้ว' : ' จองแล้ว') + '</small><b class="num" style="color:var(--ok)">' + nf(k.ordered) + '</b><div class="sub">' + (isPick ? 'คน' : 'รวม ' + nf(k.pieces) + ' ตัว' + (k.extra ? ' (สั่งเพิ่ม ' + nf(k.extra) + ')' : '')) + '</div></div>' +
    '<div class="kpi"><small>' + ic('ban') + ' ไม่ประสงค์</small><b class="num" style="color:var(--muted)">' + nf(k.declined) + '</b><div class="sub">' + (k.declinedAdmin ? 'ตอบเอง ' + nf(k.declinedSelf) + ' · HR บันทึก ' + nf(k.declinedAdmin) : 'นับว่าตอบแล้ว') + '</div></div>' +
    '<a class="kpi" href="#/admin/tracking/' + esc(ev.id) + '?status=pending" style="text-decoration:none;color:inherit"><small>' + ic('alert') + ' ยังไม่ตอบ</small><b class="num" style="color:var(--warn)">' + nf(k.pending) + '</b><div class="sub">กดเพื่อดูรายชื่อ ' + ic('arrowr') + '</div></a>' +
    '<div class="kpi"><small>' + ic('users') + ' เป้าหมาย</small><b class="num">' + nf(k.target) + '</b><div class="sub">' + (k.byAdmin ? 'HR บันทึกแทน ' + nf(k.byAdmin) + ' · ' : '') + (k.outside ? 'นอกเป้า ' + k.outside : 'บุคลากรที่ต้องตอบ') + '</div></div></div>';

  // ขนาด
  var maxc = 1; d.sizes.forEach(function (o) { o.sizes.forEach(function (s) { maxc = Math.max(maxc, s.count); }); });
  var bars = d.sizes.map(function (o, i) {
    return '<h4><span>' + esc(o.label) + '</span><span class="num">' + nf(o.total) + ' ตัว</span></h4>' + o.sizes.filter(function (s) { return !s.hidden || s.count; }).map(function (s) {
      return '<div class="b"><span class="lbl">' + esc(s.code) + '</span><div class="track"><div class="fill ' + (i % 2 ? 'f' : '') + '" style="width:' + (s.count / maxc * 100) + '%"></div></div><span class="val">' + nf(s.count) + '</span></div>';
    }).join('');
  }).join('<div style="height:10px"></div>');
  var totalForm = d.form.reduce(function (a, f) { return a + f.count; }, 0);
  var formHtml = '<div class="formcopy">' + d.form.map(function (f, i) { return '<div class="fc" data-copy="' + f.count + '" title="คลิกเพื่อคัดลอก"><span><span class="n">' + (i + 3) + '.</span> ' + esc(f.label) + '</span><b>' + f.count + '</b></div>'; }).join('') + '</div>';
  var coord = d.coordinator && d.coordinator.name ? d.coordinator.name + ' โทร ' + d.coordinator.phone : '';

  var divs = d.byDivision.slice().sort(function (a, b) { return a.pct - b.pct; });
  var tl = d.timeline.slice(-21), maxT = 1; tl.forEach(function (t) { maxT = Math.max(maxT, t.n); });

  if (isPick) {
    var its = (d.items || []).filter(function (x) { return x.eligible || x.chosen; }).sort(function (a, b) { return b.chosen - a.chosen || b.eligible - a.eligible; }), maxI = 1;
    its.forEach(function (x) { maxI = Math.max(maxI, x.eligible); });
    bars = its.length ? its.map(function (x) {
      return '<div class="pbar"><div class="row between" style="gap:8px;flex-wrap:nowrap"><span class="lbl2">' + esc(x.label) + '</span><span class="small num" style="white-space:nowrap"><b>' + nf(x.chosen) + '</b> / ' + nf(x.eligible) + '</span></div>' +
        '<div class="track"><div class="fill" style="width:' + (x.chosen / maxI * 100) + '%"></div><div class="fill ghost" style="width:' + (x.eligible / maxI * 100) + '%"></div></div></div>';
    }).join('') : '<div class="muted small">ยังไม่มีรายชื่อผู้มีสิทธิ์ — นำเข้าที่แท็บ "ตั้งค่ากิจกรรม"</div>';
  }
  h += '<div class="dgrid"><div class="stack">' +
    (isPick ? '<div class="card"><div class="hd"><div><h3>' + ic('shirt') + ' จำนวนผู้เลือกต่อรายการ</h3><div class="small muted">ตัวเลข = เลือกแล้ว / มีสิทธิ์เลือก · แถบจาง = จำนวนผู้มีสิทธิ์</div></div><span class="chip acc num">เลือกแล้ว ' + nf(k.ordered) + ' คน</span></div><div class="bd">' + bars + '</div></div>'
      : '<div class="card"><div class="hd"><h3>' + ic('shirt') + ' จำนวนตามไซซ์</h3><span class="chip acc num">รวม ' + nf(k.pieces) + ' ตัว</span></div><div class="bd bars">' + bars + '</div></div>') +
    (ev.type === 'CHOICE' ? '<div class="card"><div class="hd"><div><h3>' + ic('send') + ' สรุปส่งจัดซื้อ (เรียงตามแบบฟอร์ม)</h3><div class="small muted">คลิกตัวเลขเพื่อคัดลอกไปวางในช่องของ MS Forms ทีละช่อง</div></div>' +
      '<div class="row"><button class="btn sm" id="cpAll">' + ic('copy') + 'คัดลอกทั้งชุด</button></div></div><div class="bd">' +
      '<div class="fc" data-copy="' + esc(d.exportUnit) + '" style="margin-bottom:8px"><span><span class="n">1.</span> หน่วยงาน</span><b style="font-size:14px">' + esc(d.exportUnit) + '</b></div>' + formHtml +
      (coord ? '<div class="fc" data-copy="' + esc(coord) + '" style="margin-top:8px"><span><span class="n">20.</span> ผู้ประสานงาน</span><b style="font-size:14px">' + esc(coord) + '</b></div>' : '') +
      '<div class="row between" style="margin-top:12px"><span class="muted small">รวมทุกไซซ์</span><b class="num" style="font-size:18px">' + nf(totalForm) + ' ตัว</b></div></div></div>' : '') +
    '</div><div class="stack">' +
    '<div class="card"><div class="hd"><h3>' + ic('building') + ' ความคืบหน้ารายฝ่าย</h3><a class="btn sm ghost" href="#/admin/reports/' + esc(ev.id) + '">ดูทั้งหมด ' + ic('arrowr') + '</a></div><div class="bd" style="padding-top:8px;max-height:430px;overflow:auto">' +
    divs.map(function (g) { return '<a href="#/admin/tracking/' + esc(ev.id) + '?div=' + encodeURIComponent(g.name) + '&status=pending" style="display:block;text-decoration:none;color:inherit;padding:8px 0;border-bottom:1px dashed var(--line)"><div class="row between"><span style="font-weight:600;font-size:14px">' + esc(g.name) + '</span><span class="small num">' + g.done + '/' + g.target + ' · <b>' + g.pct + '%</b></span></div>' + progBar(g.pct) + '</a>'; }).join('') + '</div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('calendar') + ' การตอบรายวัน</h3></div><div class="bd">' + (tl.length ? '<div class="timeline">' + tl.map(function (t) { return '<div class="col" title="' + esc(thDate(t.d)) + ': ' + t.n + ' คน"><b class="num">' + t.n + '</b><i style="height:' + (t.n / maxT * 78) + '%"></i><small>' + esc(thShort(t.d).replace(/ \d\d:\d\d$/, '')) + '</small></div>'; }).join('') + '</div>' : '<div class="muted small">ยังไม่มีข้อมูล</div>') + '</div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('history') + ' ล่าสุด</h3></div><div class="bd" style="padding-top:4px"><ul class="recent">' + (d.recent.length ? d.recent.map(function (r) {
      return '<li><div class="avatar" style="width:32px;height:32px;font-size:13px">' + esc(initials(r.name)) + '</div><div style="flex:1;min-width:0"><b style="font-size:13.5px">' + esc(r.name) + '</b><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.unit || r.division) + '</div></div>' +
        (r.status === 'DECLINED' ? '<span class="chip">ไม่ประสงค์</span>' : '<span class="chip acc" style="max-width:190px;overflow:hidden;text-overflow:ellipsis" title="' + esc(isPick ? (pickItems(ev)[r.optKey] || {}).label || r.optKey : '') + '">' + esc(isPick ? (pickItems(ev)[r.optKey] || {}).label || r.optKey : r.optKey + ' · ' + r.sizeCode) + '</span>') + '<span class="small muted">' + esc(thShort(r.at)) + '</span></li>';
    }).join('') : '<li class="muted">ยังไม่มีการตอบ</li>') + '</ul></div></div>' +
    '</div></div>';
  $('#page').innerHTML = h;
  $$('[data-copy]').forEach(function (el) { el.onclick = function () { copyText(el.dataset.copy).then(function () { el.classList.add('copied'); }); }; });
  var ca = $('#cpAll'); if (ca) ca.onclick = function () { copyText([d.exportUnit].concat(d.form.map(function (f) { return f.count; })).concat(coord ? [coord] : []).join('\n'), 'ทั้งชุด (1 บรรทัดต่อ 1 ช่อง)'); };
  $('#dRefresh').onclick = function () { var b = this; busy(b, api('getDashboard', { eventId: ev.id }, { fresh: true })).then(function (x) { drawDash(x); toast('อัปเดตข้อมูลล่าสุดแล้ว', 'ok'); }).catch(errToast); };
  $('#dExport').onclick = function () { busy(this, api('getExport', { eventId: ev.id }).then(exportWorkbook)).catch(errToast); };
}

/* ---------- ส่งออกไฟล์รวม ---------- */
function trackObjs(t) { return t.rows.map(function (r) { var o = {}; t.cols.forEach(function (c, i) { o[c] = r[i]; }); return o; }); }
function exportWorkbook(x) {
  if (x.dashboard.event.type === 'PICK') return exportPickWorkbook(x);
  var d = x.dashboard, t = x.tracking, rows = trackObjs(t), ev = d.event, contact = t.canSeeContact;
  var coord = d.coordinator && d.coordinator.name ? d.coordinator.name + ' โทร ' + d.coordinator.phone : '';
  var sheets = [];
  if (ev.type === 'CHOICE') {
    var f = [['ลำดับข้อในแบบฟอร์ม', 'หัวข้อ', 'จำนวน (ตัว)'], [1, 'หน่วยงาน', d.exportUnit]];
    d.form.forEach(function (x, i) { f.push([i + 3, x.label + ' (ระบุจำนวนตัว)', x.count]); });
    f.push(['', 'รวมทั้งหมด', d.form.reduce(function (a, x) { return a + x.count; }, 0)]);
    if (coord) f.push([20, 'ชื่อ-นามสกุล และเบอร์โทรติดต่อของผู้ประสานงาน', coord]);
    f.push([], ['', 'ข้อมูล ณ', thDate(d.generatedAt)]);
    sheets.push({ name: 'สรุปส่งจัดซื้อ', rows: f, widths: [12, 48, 40] });
  }
  var sizeCols = [];
  (ev.config.options || []).forEach(function (o) { o.sizes.forEach(function (s) { sizeCols.push({ k: o.key + '|' + s.code, h: s.code + ' ' + o.label.replace(/^แบบ/, '') }); }); });
  function pivot(name, keyFn) {
    var m = {};
    rows.forEach(function (r) {
      var k = keyFn(r) || '(ไม่ระบุ)', g = m[k] || (m[k] = { t: 0, o: 0, dc: 0, p: 0, s: {} });
      if (r.target) g.t++;
      if (r.status === 'ORDERED') { g.o++; var kk = r.optKey + '|' + r.sizeCode; g.s[kk] = (g.s[kk] || 0) + (+r.qty || 1) + (+r.extraQty || 0); }
      else if (r.status === 'DECLINED') g.dc++; else if (r.target) g.p++;
    });
    var out = [[name, 'เป้าหมาย', 'จองแล้ว', 'ไม่ประสงค์', 'ยังไม่ตอบ', '% ตอบแล้ว'].concat(ev.type === 'CHOICE' ? sizeCols.map(function (c) { return c.h; }) : [])];
    Object.keys(m).sort().forEach(function (k) { var g = m[k]; out.push([k, g.t, g.o, g.dc, g.p, g.t ? Math.round((g.o + g.dc) * 1000 / g.t) / 10 : '-'].concat(ev.type === 'CHOICE' ? sizeCols.map(function (c) { return g.s[c.k] || 0; }) : [])); });
    return out;
  }
  sheets.push({ name: 'สรุปรายฝ่าย', rows: pivot('ฝ่าย', function (r) { return r.division; }) });
  sheets.push({ name: 'สรุปรายหน่วย', rows: pivot('หน่วย', function (r) { return (r.unit || '-') + ' (' + r.division + ')'; }) });
  sheets.push({ name: 'สรุปรายตำแหน่ง', rows: pivot('ตำแหน่ง', function (r) { return r.position; }) });
  var head = ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วย', 'ฝ่าย', 'กลุ่ม', 'สถานะ', 'แบบ', 'ไซซ์', 'จำนวน', 'สั่งเพิ่ม', 'บันทึกล่าสุด', 'HR บันทึกแทน', 'หมายเหตุ'].concat(contact ? ['โทรศัพท์', 'อีเมล'] : []);
  function list(filter) {
    var out = [head], n = 0;
    rows.filter(filter).forEach(function (r) {
      var o = (ev.config.options || []).filter(function (x) { return x.key === r.optKey; })[0];
      out.push([++n, r.empCode, r.name, r.position, r.unit, r.division, r.group, r.target || r.status ? STATUS_TH[r.status] : 'นอกเป้าหมาย', o ? o.label : '', r.sizeCode, r.status === 'ORDERED' ? r.qty : '', r.extraQty || '', r.updatedAt ? thDate(r.updatedAt) : '', r.byAdmin ? 'ใช่' : '', r.note].concat(contact ? [r.phone, r.email] : []));
    });
    return out;
  }
  sheets.push({ name: 'รายชื่อทั้งหมด', rows: list(function () { return true; }) });
  sheets.push({ name: 'ยังไม่ตอบ', rows: list(function (r) { return r.target && !r.status; }) });
  return exportXlsx('สรุป_' + ev.title.replace(/[\\\/:*?"<>|]/g, '').slice(0, 40) + '_' + localIso().slice(0, 10) + '.xlsx', sheets);
}

/** ส่งออก Excel กิจกรรม PICK: สรุปยอดต่อรายการ (ส่งจัดหา) + รายฝ่าย + รายชื่อแยกสถานะ */
function exportPickWorkbook(x) {
  var d = x.dashboard, t = x.tracking, rows = trackObjs(t), ev = d.event, contact = t.canSeeContact, items = d.items || [], IT = pickItems(ev);
  var stx = function (r) { return r.status === 'ORDERED' ? 'เลือกแล้ว' : r.status === 'DECLINED' ? (r.byAdmin ? 'ไม่ประสงค์รับ (HR บันทึก)' : 'ไม่ประสงค์รับ (ตอบเอง)') : (r.target ? 'ยังไม่ตอบ (ถือว่าไม่ประสงค์รับ)' : 'นอกรายชื่อ'); };
  var sum = [['ลำดับ', 'รหัสรายการ', 'รายการผ้า / ชุดปฏิบัติงาน', 'ประเภท', 'จำนวนผู้เลือก (คน)', 'ผู้มีสิทธิ์เลือก (คน)']];
  items.forEach(function (it) { sum.push([it.no, it.key, it.label, it.kind, it.chosen, it.eligible]); });
  sum.push([], ['', '', 'รวมผู้เลือก', '', d.kpi.ordered, ''], ['', '', 'ไม่ประสงค์รับ (ตอบเอง)', '', d.kpi.declinedSelf, ''], ['', '', 'ไม่ประสงค์รับ (HR บันทึก)', '', d.kpi.declinedAdmin, ''],
    ['', '', 'ยังไม่ตอบ (ถือว่าไม่ประสงค์รับ)', '', d.kpi.pending, ''], ['', '', 'ผู้มีรายชื่อทั้งหมด', '', d.kpi.target, ''], [], ['', '', 'ข้อมูล ณ', thDate(d.generatedAt)]);
  var used = items.filter(function (it) { return it.eligible || it.chosen; });
  var piv = function (name, keyFn) {
    var m = {};
    rows.forEach(function (r) { var k = keyFn(r) || '(ไม่ระบุ)', g = m[k] || (m[k] = { t: 0, o: 0, dc: 0, p: 0, s: {} }); if (r.target) g.t++; if (r.status === 'ORDERED') { g.o++; g.s[r.optKey] = (g.s[r.optKey] || 0) + 1; } else if (r.status === 'DECLINED') g.dc++; else if (r.target) g.p++; });
    var out = [[name, 'ผู้มีรายชื่อ', 'เลือกแล้ว', 'ไม่ประสงค์', 'ยังไม่ตอบ', '% ตอบแล้ว'].concat(used.map(function (it) { return it.label; }))];
    Object.keys(m).sort().forEach(function (k) { var g = m[k]; out.push([k, g.t, g.o, g.dc, g.p, g.t ? Math.round((g.o + g.dc) * 1000 / g.t) / 10 : '-'].concat(used.map(function (it) { return g.s[it.key] || 0; }))); });
    return out;
  };
  var head = ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วยที่ปฏิบัติงาน', 'ฝ่ายที่ปฏิบัติงาน', 'ฝ่ายต้นสังกัด (HRMi)', 'กลุ่ม', 'สถานะ', 'รายการที่เลือก', 'ตัวเลือกที่มีสิทธิ์', 'บันทึกล่าสุด', 'หมายเหตุ'].concat(contact ? ['มือถือ', 'เบอร์ภายใน', 'อีเมล'] : []);
  var list = function (f) { var out = [head], n = 0; rows.filter(f).forEach(function (r) { out.push([++n, r.empCode, r.name, r.position, r.unit, r.division, r.hrmiDivision, r.group, stx(r), r.status === 'ORDERED' && IT[r.optKey] ? IT[r.optKey].label : '', String(r.opts || '').split(',').filter(Boolean).map(function (k) { return IT[k] ? IT[k].label : k; }).join(' | '), r.updatedAt ? thDate(r.updatedAt) : '', r.note].concat(contact ? [r.phone, r.extPhone, r.email] : [])); }); return out; };
  return exportXlsx('สรุป_' + ev.title.replace(/[\\\/:*?"<>|]/g, '').slice(0, 40) + '_' + localIso().slice(0, 10) + '.xlsx', [
    { name: 'สรุปยอดต่อรายการ', rows: sum, widths: [7, 10, 60, 10, 16, 18] },
    { name: 'สรุปรายฝ่าย', rows: piv('ฝ่ายที่ปฏิบัติงาน', function (r) { return r.division; }) },
    { name: 'สรุปรายหน่วย', rows: piv('หน่วย (ฝ่าย)', function (r) { return (r.unit || '-') + ' (' + r.division + ')'; }) },
    { name: 'รายชื่อทั้งหมด', rows: list(function () { return true; }) },
    { name: 'เลือกแล้ว', rows: list(function (r) { return r.status === 'ORDERED'; }) },
    { name: 'ไม่ประสงค์รับ', rows: list(function (r) { return r.status === 'DECLINED'; }) },
    { name: 'ยังไม่ตอบ', rows: list(function (r) { return r.target && !r.status; }) }]);
}

/* =================================================================== ติดตามรายบุคคล */
var TR = null;
ROUTES['admin/tracking'] = function (params, q) {
  withEvent(params, 'tracking', function (id, ev) {
    document.title = 'ติดตาม · SOMDEJ HR Connect';
    TR = { id: id, ev: ev, data: null, rows: [], f: { q: '', div: q.div || '', unit: '', pos: '', group: '', status: q.status || 'all', flag: '' }, page: 1, size: 50, sort: 'unit', sel: {} };
    var draw = function (d) { if (S.wsTab !== 'tracking') return; TR.data = d; TR.ev = d.event; TR.rows = trackObjs(d); drawTracking(); };
    api('getTracking', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
  });
};
function trFiltered() {
  var f = TR.f, q = f.q.toLowerCase();
  return TR.rows.filter(function (r) {
    if (f.status === 'pending' && !(r.target && !r.status)) return false;
    if (f.status === 'ordered' && r.status !== 'ORDERED') return false;
    if (f.status === 'declined' && r.status !== 'DECLINED') return false;
    if (f.status === 'done' && !r.status) return false;
    if (f.div && r.division !== f.div) return false;
    if (f.unit && r.unit !== f.unit) return false;
    if (f.pos && r.position !== f.pos) return false;
    if (f.group && r.group !== f.group) return false;
    if (f.flag && r.flag !== f.flag) return false;
    if (q && (r.empCode + ' ' + r.name + ' ' + r.position + ' ' + r.unit + ' ' + r.phone).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function uniq(list, k, where) { var m = {}; list.forEach(function (r) { if (!where || where(r)) m[r[k] || ''] = 1; }); return Object.keys(m).filter(Boolean).sort(); }
function drawTracking() {
  var d = TR.data, f = TR.f, all = TR.rows, admin = d.canSeeContact;
  var cnt = { all: all.length, pending: 0, ordered: 0, declined: 0 };
  var base = all.filter(function (r) { return (!f.div || r.division === f.div) && (!f.unit || r.unit === f.unit) && (!f.pos || r.position === f.pos) && (!f.group || r.group === f.group); });
  cnt.all = base.length; base.forEach(function (r) { if (r.status === 'ORDERED') cnt.ordered++; else if (r.status === 'DECLINED') cnt.declined++; else if (r.target) cnt.pending++; });
  var h = pageHead('ติดตามรายบุคคล', esc(d.event.title) + ' · ข้อมูล ณ ' + esc(thShort(d.generatedAt)),
    eventPicker(TR.id, 'tracking') + '<button class="btn" id="tRefresh">' + ic('refresh') + 'รีเฟรช</button>', 'ติดตาม');
  h += scopeNote(TR.id);
  h += '<div class="card"><div class="bd" style="padding-bottom:10px"><div class="filters">' +
    '<input class="input search" id="fQ" placeholder="ค้นหา รหัส / ชื่อ / ตำแหน่ง / หน่วย" value="' + esc(f.q) + '">' +
    sel('fDiv', 'ทุกฝ่าย', uniq(all, 'division'), f.div) + sel('fUnit', 'ทุกหน่วย', uniq(all, 'unit', function (r) { return !f.div || r.division === f.div; }), f.unit) +
    sel('fPos', 'ทุกตำแหน่ง', uniq(all, 'position', function (r) { return (!f.div || r.division === f.div) && (!f.unit || r.unit === f.unit); }), f.pos) + sel('fGroup', 'ทุกกลุ่ม', uniq(all, 'group'), f.group) +
    (f.div || f.unit || f.pos || f.group || f.q ? '<button class="btn sm ghost" id="fClear">' + ic('x') + 'ล้างตัวกรอง</button>' : '') + '</div>' +
    '<div class="row between" style="margin-top:12px"><div class="seg" id="fStatus">' +
    [['all', 'ทั้งหมด', cnt.all], ['pending', 'ยังไม่ตอบ', cnt.pending], ['ordered', stTh(TR.ev, 'ORDERED'), cnt.ordered], ['declined', 'ไม่ประสงค์', cnt.declined]].map(function (s) { return '<button class="' + (f.status === s[0] ? 'on' : '') + '" data-st="' + s[0] + '">' + s[1] + '<span class="c num">' + nf(s[2]) + '</span></button>'; }).join('') +
    '</div><div class="row">' + (admin ? piiBtn() : '') + '<button class="btn sm" id="tExport">' + ic('download') + 'ส่งออกที่กรอง</button>' +
    (admin ? '<button class="btn sm" id="tPhones">' + ic('phone') + 'คัดลอกเบอร์ผู้ยังไม่ตอบ</button><button class="btn sm primary" id="tRemind">' + ic('mail') + 'อีเมลเตือนผู้ยังไม่ตอบ</button>' : '') + '</div></div></div>' +
    (admin && !isTh(d.event) && (d.event.config || {}).allowDecline !== false ? '<div class="bulkbar" id="tBulk"></div>' : '') +
    '<div id="tTable"></div></div>';
  $('#page').innerHTML = h;
  S.piiRedraw = drawTrackTable;
  drawTrackTable();
  $('#fQ').oninput = debounce(function () { TR.f.q = $('#fQ').value.trim(); TR.page = 1; drawTrackTable(); }, 200);
  [['fDiv', 'div'], ['fUnit', 'unit'], ['fPos', 'pos'], ['fGroup', 'group']].forEach(function (p) {
    $('#' + p[0]).onchange = function () { TR.f[p[1]] = this.value; if (p[1] === 'div') { TR.f.unit = ''; TR.f.pos = ''; } if (p[1] === 'unit') TR.f.pos = ''; TR.page = 1; drawTracking(); };
  });
  var fc = $('#fClear'); if (fc) fc.onclick = function () { TR.f = { q: '', div: '', unit: '', pos: '', group: '', status: TR.f.status, flag: '' }; TR.page = 1; drawTracking(); };
  $$('#fStatus [data-st]').forEach(function (b) { b.onclick = function () { TR.f.status = b.dataset.st; TR.page = 1; drawTracking(); }; });
  $('#tRefresh').onclick = function () { busy(this, api('getTracking', { eventId: TR.id }, { fresh: true })).then(function (x) { TR.data = x; TR.rows = trackObjs(x); drawTracking(); toast('อัปเดตข้อมูลล่าสุดแล้ว', 'ok'); }).catch(errToast); };
  $('#tExport').onclick = function () { exportTrackList(trFiltered()); };
  if (admin) {
    $('#tPhones').onclick = function () {
      var p = trFiltered().filter(function (r) { return r.target && !r.status && r.phone; });
      if (!p.length) return toast('ไม่มีเบอร์โทรของผู้ที่ยังไม่ตอบในรายการที่กรอง', 'warn');
      copyText(p.map(function (r) { return r.name + '\t' + r.phone + '\t' + (r.unit || r.division); }).join('\n'), p.length + ' รายชื่อพร้อมเบอร์');
    };
    $('#tRemind').onclick = function () { remindFiltered(); };
  }
}
function sel(id, all, list, cur) { return '<select class="input" id="' + id + '"><option value="">' + all + '</option>' + list.map(function (v) { return '<option ' + (v === cur ? 'selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select>'; }
function statusChip(r) {
  if (r.status === 'ORDERED') return '<span class="chip ok">' + ic('check') + ' ' + stTh(TR && TR.ev, 'ORDERED') + '</span>';
  if (r.status === 'DECLINED') return '<span class="chip">ไม่ประสงค์</span>';
  return r.target ? '<span class="chip warn dot">' + (TR && TR.ev && TR.ev.type === 'CHECKIN' ? 'ยังไม่เข้าร่วม' : TR && TR.ev && TR.ev.type === 'NOMINATE' ? 'ยังไม่เสนอชื่อ' : 'ยังไม่ตอบ') + '</span>' : '<span class="chip">นอกเป้าหมาย</span>';
}
function sizeTxt(r) {
  if (TR.ev.type === 'NOMINATE') return r.status === 'ORDERED' ? '<span class="small">เสนอ <b>' + nf(r.qty) + '</b> ชื่อ</span>' : '<span class="muted">–</span>';
  if (TR.ev.type === 'CHECKIN') return r.status === 'ORDERED' ? '<span class="small">' + (r.note === 'DESK' ? 'โต๊ะลงทะเบียน' : 'สแกน QR') + '</span>' : '<span class="muted">–</span>';
  if (TR.ev.type === 'PICK') {
    var IT = pickItems(TR.ev), opts = String(r.opts || '').split(',').filter(Boolean);
    if (r.status === 'ORDERED') return '<b class="small">' + esc(IT[r.optKey] ? IT[r.optKey].label : r.optKey) + '</b>';
    return opts.length ? '<span class="small muted">มีสิทธิ์: ' + esc(opts.map(function (k) { return IT[k] ? IT[k].label : k; }).join(' / ')) + '</span>' : '<span class="small muted">ไม่มีตัวเลือก</span>';
  }
  if (r.status !== 'ORDERED') return '<span class="muted">–</span>'; var o = (TR.ev.config.options || []).filter(function (x) { return x.key === r.optKey; })[0]; return '<b>' + esc(r.sizeCode) + '</b> <span class="small muted">' + esc(o ? o.label.replace(/^แบบ/, '') : r.optKey) + (r.extraQty ? ' +' + r.extraQty : '') + '</span>'; }
function drawTrackTable() {
  var list = trFiltered(), admin = TR.data.canSeeContact;
  list.sort(function (a, b) { return (a.division + a.unit + a.name) > (b.division + b.unit + b.name) ? 1 : -1; });
  var pages = Math.max(1, Math.ceil(list.length / TR.size)); if (TR.page > pages) TR.page = pages;
  var slice = list.slice((TR.page - 1) * TR.size, TR.page * TR.size);
  var canBulk = !!$('#tBulk'), selectable = function (r) { return r.target && !r.status; };
  var pageSel = slice.filter(selectable), allOn = pageSel.length && pageSel.every(function (r) { return TR.sel[r.empCode]; });
  var h = '<div class="tablewrap resp"><table class="t"><thead><tr>' + (canBulk ? '<th style="width:34px"><input type="checkbox" id="tSelPage" title="เลือกผู้ยังไม่ตอบในหน้านี้" ' + (allOn ? 'checked' : '') + (pageSel.length ? '' : ' disabled') + '></th>' : '') + '<th>รหัส / ชื่อ</th><th>ตำแหน่ง</th><th>หน่วย / ฝ่าย</th><th>สถานะ</th><th>' + (TR.ev.type === 'PICK' ? 'รายการ' : 'ไซซ์') + '</th>' + (admin ? '<th>ติดต่อ</th><th></th>' : '') + '</tr></thead><tbody>' +
    (slice.length ? slice.map(function (r) {
      return '<tr' + (TR.sel[r.empCode] ? ' class="selrow"' : '') + '>' + (canBulk ? '<td>' + (selectable(r) ? '<input type="checkbox" data-sel="' + esc(r.empCode) + '" ' + (TR.sel[r.empCode] ? 'checked' : '') + '>' : '') + '</td>' : '') + '<td><div class="nm">' + esc(r.name) + (r.flag ? ' <span class="chip info" title="' + esc(FLAG_TH[r.flag] || r.flag) + '">' + esc(FLAG_TH[r.flag] || r.flag) + '</span>' : '') + '</div><div class="sub num">' + esc(r.empCode) + (r.lastLoginAt ? '' : ' · ยังไม่เคยเข้าระบบ') + '</div></td>' +
        '<td>' + esc(r.position) + '<div class="sub">' + esc(r.group) + '</div></td><td>' + esc(r.unit || '-') + '<div class="sub">' + esc(r.division) + (r.hrmiDivision && r.hrmiDivision !== r.division ? ' <span title="ฝ่ายต้นสังกัดตาม HRMi">(HRMi: ' + esc(r.hrmiDivision) + ')</span>' : '') + '</div></td>' +
        '<td>' + statusChip(r) + (r.byAdmin ? '<div class="sub">HR บันทึกแทน</div>' : '') + (r.updatedAt ? '<div class="sub">' + esc(thShort(r.updatedAt)) + '</div>' : '') + '</td><td>' + sizeTxt(r) + '</td>' +
        (admin ? '<td>' + (r.phone ? pii(r.phone, 'tel') : '<span class="muted small">ไม่มีเบอร์</span>') + (r.extPhone ? ' <span class="sub">ต่อ ' + esc(r.extPhone) + '</span>' : '') + (r.email ? '<div class="sub">' + pii(r.email, 'email') + '</div>' : '') + '</td>' +
          '<td class="r" style="white-space:nowrap">' + (isTh(TR.ev) ? '' : '<button class="btn sm" data-proxy="' + esc(r.empCode) + '">' + ic('edit') + (r.status ? 'แก้แทน' : 'บันทึกแทน') + '</button> ') + '<button class="iconbtn" data-hist="' + esc(r.empCode) + '" title="ประวัติ">' + ic('history') + '</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="7"><div class="empty">' + ic('search') + '<p>ไม่พบรายชื่อตามเงื่อนไข</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + slice.map(function (r) {
      return '<div class="mi"><div class="avatar" style="width:36px;height:36px;font-size:14px">' + esc(initials(r.name)) + '</div><div class="x"><b>' + esc(r.name) + '</b><small>' + esc(r.empCode + ' · ' + r.position) + '</small><small>' + esc(r.unit || r.division) + '</small>' +
        '<div class="row" style="margin-top:5px">' + (canBulk && selectable(r) ? '<label class="chip"><input type="checkbox" data-sel="' + esc(r.empCode) + '" ' + (TR.sel[r.empCode] ? 'checked' : '') + '> เลือก</label>' : '') + statusChip(r) + (r.status === 'ORDERED' ? '<span class="chip acc" style="white-space:normal">' + (TR.ev.type === 'PICK' ? esc((pickItems(TR.ev)[r.optKey] || {}).label || r.optKey) : esc(r.optKey + ' · ' + r.sizeCode)) + '</span>' : '') + '</div></div>' +
        (admin ? '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + (r.phone ? '<a class="btn sm" href="tel:' + esc(r.phone) + '">' + ic('phone') + '</a>' : '') + (isTh(TR.ev) ? '' : '<button class="btn sm" data-proxy="' + esc(r.empCode) + '">' + ic('edit') + '</button>') + '</div>' : '') + '</div>';
    }).join('') + '</div></div>' +
    '<div class="pager"><span>แสดง ' + (list.length ? ((TR.page - 1) * TR.size + 1) + '–' + Math.min(list.length, TR.page * TR.size) : 0) + ' จาก ' + nf(list.length) + ' คน</span><div class="row">' +
    '<button class="btn sm" id="pPrev" ' + (TR.page <= 1 ? 'disabled' : '') + '>' + ic('arrowl') + '</button><span class="num">หน้า ' + TR.page + '/' + pages + '</span><button class="btn sm" id="pNext" ' + (TR.page >= pages ? 'disabled' : '') + '>' + ic('arrowr') + '</button></div></div>';
  $('#tTable').innerHTML = h;
  $('#pPrev').onclick = function () { TR.page--; drawTrackTable(); };
  $('#pNext').onclick = function () { TR.page++; drawTrackTable(); };
  $$('[data-proxy]').forEach(function (b) { b.onclick = function () { proxyModal(TR.rows.filter(function (r) { return r.empCode === b.dataset.proxy; })[0]); }; });
  $$('[data-hist]').forEach(function (b) { b.onclick = function () { histModal(b.dataset.hist); }; });
  if (canBulk) {
    $$('[data-sel]').forEach(function (c) { c.onchange = function () { if (c.checked) TR.sel[c.dataset.sel] = 1; else delete TR.sel[c.dataset.sel]; drawTrackTable(); }; });
    var sp = $('#tSelPage'); if (sp) sp.onchange = function () { pageSel.forEach(function (r) { if (sp.checked) TR.sel[r.empCode] = 1; else delete TR.sel[r.empCode]; }); drawTrackTable(); };
    drawBulkBar();
  }
}
/** แถบทำรายการหลายคน: เลือกผู้ยังไม่ตอบทั้งหมด → ตั้งเป็น "ไม่ประสงค์" */
function drawBulkBar() {
  var bar = $('#tBulk'); if (!bar) return;
  var pend = trFiltered().filter(function (r) { return r.target && !r.status; }), n = Object.keys(TR.sel).length, lbl = (TR.ev.config || {}).declineLabel || 'ไม่ประสงค์รับ';
  bar.innerHTML = ic('check') + '<span>' + (n ? 'เลือกแล้ว <b class="num">' + nf(n) + '</b> คน' : 'ติ๊กเลือกผู้ยังไม่ตอบ เพื่อบันทึกแทนครั้งละหลายคน') + '</span>' +
    (pend.length ? '<button class="btn sm" id="bkAll">' + ic('users') + 'เลือกผู้ยังไม่ตอบทั้งหมดที่กรอง (' + nf(pend.length) + ')</button>' : '') +
    (n ? '<button class="btn sm ghost" id="bkClear">' + ic('x') + 'ล้างการเลือก</button><span class="spacer"></span><button class="btn sm dangerfill" id="bkDecl">' + ic('ban') + 'ตั้งเป็น "' + esc(lbl) + '" (' + nf(n) + ')</button>' : '');
  var a = $('#bkAll'); if (a) a.onclick = function () { pend.forEach(function (r) { TR.sel[r.empCode] = 1; }); drawTrackTable(); };
  var c = $('#bkClear'); if (c) c.onclick = function () { TR.sel = {}; drawTrackTable(); };
  var dcl = $('#bkDecl'); if (dcl) dcl.onclick = function () {
    var codes = Object.keys(TR.sel);
    var m = modal({ title: '', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn dangerfill" id="bkGo" data-busy="กำลังบันทึก…">' + ic('ban') + 'ยืนยัน ' + nf(codes.length) + ' คน</button>',
      body: '<div class="center"><div class="bigicon warn">' + ic('ban') + '</div><h3 style="font-size:20px">ตั้ง "' + esc(lbl) + '" ให้ ' + nf(codes.length) + ' คน?</h3><p class="muted">เฉพาะผู้ที่ยังไม่ตอบ (คนที่ตอบแล้วระบบข้ามให้) · บันทึกเป็น "HR บันทึกแทน" พร้อมประวัติ · แก้ทีละคนภายหลังได้ · ไม่ส่งอีเมลแจ้ง</p></div>' +
        '<div class="field"><label class="f" for="bkNote">หมายเหตุ</label><input class="input" id="bkNote" maxlength="300" value="ไม่ตอบภายในกำหนด (HR บันทึก)"></div>' });
    $('#bkGo').onclick = function () {
      busy(this, api('bulkResponse', { eventId: TR.id, empCodes: codes, status: 'DECLINED', note: $('#bkNote').value.trim(), onlyPending: true })).then(function (r) {
        m.close(); TR.sel = {}; toast('บันทึก ' + nf(r.done) + ' คน' + (r.skipped ? ' · ข้าม ' + nf(r.skipped) + ' คน (ตอบแล้ว)' : ''), 'ok', 'ตั้ง "' + lbl + '" เรียบร้อย');
        return api('getTracking', { eventId: TR.id }, { fresh: true }).then(function (x) { TR.data = x; TR.rows = trackObjs(x); drawTracking(); });
      }).catch(errToast);
    };
  };
}
function exportTrackList(list) {
  var ev = TR.ev, contact = TR.data.canSeeContact;
  var rows = [['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วย', 'ฝ่าย', 'กลุ่ม', 'สถานะ', 'แบบ', 'ไซซ์', 'บันทึกล่าสุด'].concat(contact ? ['โทรศัพท์', 'อีเมล'] : [])];
  var IT = pickItems(ev);
  list.forEach(function (r, i) { var o = (ev.config.options || []).filter(function (x) { return x.key === r.optKey; })[0]; rows.push([i + 1, r.empCode, r.name, r.position, r.unit, r.division, r.group, r.target || r.status ? stTh(ev, r.status) : 'นอกเป้าหมาย', ev.type === 'PICK' ? (IT[r.optKey] ? IT[r.optKey].label : '') : (o ? o.label : ''), r.sizeCode, r.updatedAt ? thDate(r.updatedAt) : ''].concat(contact ? [r.phone, r.email] : [])); });
  exportXlsx('รายชื่อ_' + (TR.f.status === 'pending' ? 'ยังไม่ตอบ_' : '') + (TR.f.div || 'ทั้งหมด').slice(0, 30) + '_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'รายชื่อ', rows: rows }]).catch(errToast);
}
function remindFiltered() {
  var p = trFiltered().filter(function (r) { return r.target && !r.status; }), withMail = p.filter(function (r) { return r.email; });
  if (!p.length) return toast('ไม่มีผู้ที่ยังไม่ตอบในรายการที่กรอง', 'info');
  confirmBox({ title: 'ส่งอีเมลเตือน ' + withMail.length + ' คน?', icon: 'mail', ok: 'ส่งอีเมล',
    msg: 'ผู้ที่ยังไม่ตอบในรายการที่กรอง ' + p.length + ' คน · มีอีเมลใน HR ' + withMail.length + ' คน' + (p.length > withMail.length ? '<br><span style="color:var(--warn)">อีก ' + (p.length - withMail.length) + ' คนไม่มีอีเมล — ใช้เบอร์โทรหรือแจ้งหัวหน้าแทน</span>' : '') }).then(function (y) {
    if (!y || !withMail.length) return;
    toast('กำลังส่งอีเมล…', 'info');
    api('sendMail', { eventId: TR.id, type: 'REMIND_STAFF', opt: { codes: withMail.map(function (r) { return r.empCode; }) } }).then(function (r) {
      toast('ส่งแล้ว ' + r.sent + ' ฉบับ' + (r.failed ? ' · ล้มเหลว ' + r.failed : '') + (r.remaining ? ' · ค้าง ' + r.remaining + ' (กดส่งอีกครั้ง)' : ''), r.failed ? 'warn' : 'ok', 'ส่งอีเมลเตือน');
    }).catch(errToast);
  });
}
function proxyModal(r) {
  if (TR.ev.type === 'PICK') return proxyPickModal(r);
  var ev = TR.ev, cfg = ev.config || {}, opts = cfg.options || [];
  var cur = r.status === 'ORDERED' ? r.optKey : (opts.filter(function (o) { return o.key === r.gender; })[0] || opts[0] || {}).key;
  var body = '<div class="row" style="margin-bottom:12px"><div class="avatar">' + esc(initials(r.name)) + '</div><div><b>' + esc(r.name) + '</b><div class="small muted">' + esc(r.empCode + ' · ' + r.position + ' · ' + (r.unit || r.division)) + '</div></div></div>' +
    '<div class="seg" id="pxMode" style="margin-bottom:14px"><button class="' + (r.status !== 'DECLINED' ? 'on' : '') + '" data-m="ORDERED">จอง</button>' + (cfg.allowDecline !== false ? '<button class="' + (r.status === 'DECLINED' ? 'on' : '') + '" data-m="DECLINED">' + esc(cfg.declineLabel || 'ไม่ประสงค์') + '</button>' : '') + '</div>' +
    '<div id="pxOrder" class="grid2"><div class="field"><label class="f">แบบ</label><select class="input" id="pxOpt">' + opts.map(function (o) { return '<option value="' + esc(o.key) + '" ' + (o.key === cur ? 'selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label class="f">ไซซ์</label><select class="input" id="pxSize"></select></div></div>' +
    '<div class="field"><label class="f">หมายเหตุ / เหตุผลที่บันทึกแทน</label><input class="input" id="pxNote" maxlength="300" value="' + esc(r.note || '') + '" placeholder="เช่น โทรสอบถามแล้ว"></div>' +
    '<div class="small muted">' + ic('info') + ' บันทึกแทนได้แม้ปิดรับแล้ว · ระบบบันทึกประวัติว่าใครแก้อะไร</div>';
  var m = modal({ title: (r.status ? 'แก้ไขแทน' : 'บันทึกแทน'), body: body, foot: (r.status ? '<button class="btn danger" id="pxReset" style="margin-right:auto">' + ic('trash') + 'ล้างคำตอบ</button>' : '') + '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="pxSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  var mode = r.status === 'DECLINED' ? 'DECLINED' : 'ORDERED';
  var fillSizes = function () { var o = opts.filter(function (x) { return x.key === $('#pxOpt').value; })[0] || { sizes: [] }; $('#pxSize').innerHTML = o.sizes.filter(function (s) { return !s.hidden; }).map(function (s) { return '<option ' + (s.code === r.sizeCode && o.key === r.optKey ? 'selected' : '') + '>' + esc(s.code) + '</option>'; }).join(''); };
  fillSizes(); $('#pxOpt').onchange = fillSizes;
  $$('#pxMode [data-m]').forEach(function (b) { b.onclick = function () { mode = b.dataset.m; $$('#pxMode button').forEach(function (x) { x.classList.toggle('on', x === b); }); $('#pxOrder').style.display = mode === 'ORDERED' ? '' : 'none'; }; });
  $('#pxOrder').style.display = mode === 'ORDERED' ? '' : 'none';
  $('#pxSave').onclick = function () {
    busy(this, api('saveResponseFor', { eventId: TR.id, empCode: r.empCode, status: mode, optKey: $('#pxOpt').value, sizeCode: $('#pxSize').value, note: $('#pxNote').value.trim() })).then(function (d) {
      m.close(); Object.assign(r, { status: d.mine.status, optKey: d.mine.optKey, sizeCode: d.mine.sizeCode, qty: d.mine.qty, updatedAt: d.mine.updatedAt, byAdmin: 1, note: d.mine.note });
      drawTracking(); toast(r.name + ' · ' + (mode === 'DECLINED' ? 'ไม่ประสงค์' : d.mine.optKey + ' ' + d.mine.sizeCode) + (d.mailed ? ' · ส่งอีเมลยืนยันแล้ว' : ''), 'ok', 'บันทึกแทนเรียบร้อย');
    }).catch(errToast);
  };
  var rs = $('#pxReset');
  if (rs) rs.onclick = function () {
    confirmBox({ title: 'ล้างคำตอบของ ' + r.name + '?', msg: 'สถานะจะกลับเป็น "ยังไม่ตอบ" (มีบันทึกประวัติ)', danger: true, ok: 'ล้างคำตอบ' }).then(function (y) {
      if (!y) return;
      api('resetResponse', { eventId: TR.id, empCode: r.empCode, reason: $('#pxNote') ? $('#pxNote').value : '' }).then(function () { m.close(); r.status = ''; r.optKey = ''; r.sizeCode = ''; drawTracking(); toast('ล้างคำตอบแล้ว', 'ok'); }).catch(errToast);
    });
  };
}
function proxyPickModal(r) {
  var ev = TR.ev, cfg = ev.config || {}, IT = pickItems(ev), mineK = String(r.opts || '').split(',').filter(Boolean), lbl = cfg.declineLabel || 'ไม่ประสงค์รับ';
  var others = (cfg.items || []).filter(function (it) { return mineK.indexOf(it.key) < 0; });
  var cur = r.status === 'DECLINED' ? 'X' : r.status === 'ORDERED' ? r.optKey : (mineK.length === 1 ? mineK[0] : '');
  var body = '<div class="row" style="margin-bottom:12px"><div class="avatar">' + esc(initials(r.name)) + '</div><div><b>' + esc(r.name) + '</b><div class="small muted">' + esc(r.empCode + ' · ' + r.position + ' · ' + (r.unit || r.division)) + '</div></div></div>' +
    '<div class="field"><label class="f">เลือกแทน</label><select class="input" id="pxPick"><option value="">— เลือก —</option><optgroup label="รายการที่มีสิทธิ์">' + mineK.map(function (k) { return '<option value="' + esc(k) + '" ' + (cur === k ? 'selected' : '') + '>' + esc(IT[k] ? IT[k].label : k) + '</option>'; }).join('') + '</optgroup>' +
    (cfg.allowDecline !== false ? '<option value="X" ' + (cur === 'X' ? 'selected' : '') + '>' + esc(lbl) + '</option>' : '') +
    '<optgroup label="รายการอื่น (นอกสิทธิ์ — ใช้เมื่อจำเป็น)">' + others.map(function (it) { return '<option value="' + esc(it.key) + '" ' + (cur === it.key ? 'selected' : '') + '>' + esc(it.label) + '</option>'; }).join('') + '</optgroup></select></div>' +
    '<div class="field"><label class="f">หมายเหตุ / เหตุผลที่บันทึกแทน</label><input class="input" id="pxNote" maxlength="300" value="' + esc(r.note || '') + '" placeholder="เช่น โทรสอบถามแล้ว"></div>' +
    '<div class="small muted">' + ic('info') + ' บันทึกแทนได้แม้ปิดรับแล้ว · ระบบบันทึกประวัติว่าใครแก้อะไร</div>';
  var m = modal({ title: (r.status ? 'แก้ไขแทน' : 'บันทึกแทน'), body: body, foot: (r.status ? '<button class="btn danger" id="pxReset" style="margin-right:auto">' + ic('trash') + 'ล้างคำตอบ</button>' : '') + '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="pxSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  $('#pxSave').onclick = function () {
    var v = $('#pxPick').value; if (!v) return toast('กรุณาเลือกรายการ', 'warn');
    busy(this, api('saveResponseFor', { eventId: TR.id, empCode: r.empCode, status: v === 'X' ? 'DECLINED' : 'ORDERED', optKey: v === 'X' ? '' : v, note: $('#pxNote').value.trim() })).then(function (d) {
      m.close(); Object.assign(r, { status: d.mine.status, optKey: d.mine.optKey, updatedAt: d.mine.updatedAt, byAdmin: 1, note: d.mine.note }); delete TR.sel[r.empCode];
      drawTracking(); toast(r.name + ' · ' + (v === 'X' ? lbl : IT[v].label), 'ok', 'บันทึกแทนเรียบร้อย');
    }).catch(errToast);
  };
  var rs = $('#pxReset');
  if (rs) rs.onclick = function () {
    confirmBox({ title: 'ล้างคำตอบของ ' + r.name + '?', msg: 'สถานะจะกลับเป็น "ยังไม่ตอบ" (มีบันทึกประวัติ)', danger: true, ok: 'ล้างคำตอบ' }).then(function (y) {
      if (!y) return;
      api('resetResponse', { eventId: TR.id, empCode: r.empCode, reason: $('#pxNote') ? $('#pxNote').value : '' }).then(function () { m.close(); r.status = ''; r.optKey = ''; drawTracking(); toast('ล้างคำตอบแล้ว', 'ok'); }).catch(errToast);
    });
  };
}
function histModal(code) {
  var m = modal({ title: 'ประวัติการแก้ไข · ' + esc(code), body: skel(1) });
  api('getResponseHistory', { eventId: TR.id, empCode: code }).then(function (l) {
    $('.mb', m.el).innerHTML = l.length ? '<ul class="recent">' + l.map(function (a) { return '<li><span class="chip ' + (a.action === 'RESPONSE_BY_ADMIN' ? 'info' : a.action === 'RESPONSE_RESET' ? 'danger' : 'acc') + '">' + esc({ RESPONSE_NEW: 'บันทึกใหม่', RESPONSE_EDIT: 'แก้ไขเอง', RESPONSE_BY_ADMIN: 'HR บันทึกแทน', RESPONSE_RESET: 'ล้าง' }[a.action] || a.action) + '</span><div style="flex:1"><b>' + esc(a.detail) + '</b><div class="small muted">โดย ' + esc(a.actor) + ' · ' + esc(thDate(a.ts)) + '</div></div></li>'; }).join('') + '</ul>' : '<div class="empty">ยังไม่มีประวัติ</div>';
  }).catch(errToast);
}

/* =================================================================== รายงาน */
var RP = null;
ROUTES['admin/reports'] = function (params, q) {
  withEvent(params, 'reports', function (id) {
    document.title = 'รายงาน · SOMDEJ HR Connect';
    RP = { id: id, by: q.by || 'division', x: null };
    var draw = function (x) { if (S.wsTab !== 'reports') return; RP.x = x; drawReport(); };
    api('getExport', { eventId: id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
  });
};
function drawReport() {
  var x = RP.x, d = x.dashboard, rows = trackObjs(x.tracking), ev = d.event, by = RP.by;
  var keyFn = { division: function (r) { return r.division; }, unit: function (r) { return r.unit || '(ไม่ระบุหน่วย)'; }, position: function (r) { return r.position; }, group: function (r) { return r.group; } }[by];
  var sizeCols = []; (ev.config.options || []).forEach(function (o) { o.sizes.forEach(function (s) { if (!s.hidden) sizeCols.push({ k: o.key + '|' + s.code, h: s.code, o: o.label.replace(/^แบบ/, '') }); }); });
  var m = {}, tot = { t: 0, o: 0, dc: 0, p: 0, s: {}, sub: '' };
  rows.forEach(function (r) {
    var k = keyFn(r) || '(ไม่ระบุ)', g = m[k] || (m[k] = { name: k, sub: by === 'unit' ? r.division : '', t: 0, o: 0, dc: 0, p: 0, s: {} });
    [g, tot].forEach(function (z) {
      if (r.target) z.t++;
      if (r.status === 'ORDERED') { z.o++; var kk = r.optKey + '|' + r.sizeCode; z.s[kk] = (z.s[kk] || 0) + (+r.qty || 1) + (+r.extraQty || 0); }
      else if (r.status === 'DECLINED') z.dc++; else if (r.target) z.p++;
    });
  });
  var list = Object.keys(m).map(function (k) { var g = m[k]; g.pct = pct(g.o + g.dc, g.t); return g; }).sort(function (a, b) { return a.pct - b.pct || b.p - a.p; });
  var showSizes = ev.type === 'CHOICE';
  if (ev.type === 'PICK') { var IT = pickItems(ev), used = {}; rows.forEach(function (r) { if (r.status === 'ORDERED') used[r.optKey] = 1; }); sizeCols = Object.keys(used).sort().map(function (k) { return { k: k, h: k, o: IT[k] ? IT[k].label : '' }; }); showSizes = sizeCols.length > 0;
    list.forEach(function (g) { g.s = {}; }); tot.s = {}; rows.forEach(function (r) { if (r.status !== 'ORDERED') return; var g = m[keyFn(r) || '(ไม่ระบุ)']; g.s[r.optKey] = (g.s[r.optKey] || 0) + 1; tot.s[r.optKey] = (tot.s[r.optKey] || 0) + 1; }); }
  var h = pageHead('รายงาน', esc(ev.title) + ' · ข้อมูล ณ ' + esc(thShort(d.generatedAt)), eventPicker(ev.id, 'reports') + '<button class="btn" onclick="window.print()">' + ic('download') + 'พิมพ์</button><button class="btn primary" id="rExport" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'ส่งออก Excel (ทุกแผ่น)</button>', 'รายงาน');
  h += scopeNote(ev.id);
  h += '<div class="tabs">' + [['division', 'รายฝ่าย', 'building'], ['unit', 'รายหน่วย', 'layers'], ['position', 'รายตำแหน่ง', 'user'], ['group', 'รายกลุ่มบุคลากร', 'users']].map(function (t) { return '<a href="#/admin/reports/' + esc(ev.id) + '?by=' + t[0] + '" class="' + (by === t[0] ? 'on' : '') + '">' + ic(t[2]) + t[1] + '</a>'; }).join('') + '</div>';
  var hdr = '<tr><th>' + { division: 'ฝ่าย (ที่ปฏิบัติงาน)', unit: 'หน่วย', position: 'ตำแหน่ง', group: 'กลุ่ม' }[by] + '</th><th class="r">เป้าหมาย</th><th class="r">' + (ev.type === 'PICK' ? 'เลือก' : 'จอง') + '</th><th class="r">ไม่ประสงค์</th><th class="r">ค้าง</th><th style="min-width:130px">ตอบแล้ว</th>' +
    (showSizes ? sizeCols.map(function (c) { return '<th class="r" title="' + esc(c.o) + '">' + esc(c.h) + '<div class="sub" style="font-weight:500">' + esc(c.o) + '</div></th>'; }).join('') : '') + '</tr>';
  var line = function (g, isTot) {
    return '<tr' + (isTot ? ' style="font-weight:700;background:var(--surface-2)"' : '') + '><td><div class="nm">' + esc(isTot ? 'รวมทั้งหมด' : g.name) + '</div>' + (g.sub ? '<div class="sub">' + esc(g.sub) + '</div>' : '') + '</td><td class="r num">' + nf(g.t) + '</td><td class="r num" style="color:var(--ok)">' + nf(g.o) + '</td><td class="r num">' + nf(g.dc) + '</td>' +
      '<td class="r num" style="color:' + (g.p ? 'var(--warn)' : 'inherit') + '">' + (g.p && !isTot && by === 'division' ? '<a href="#/admin/tracking/' + esc(ev.id) + '?div=' + encodeURIComponent(g.name) + '&status=pending">' + nf(g.p) + '</a>' : nf(g.p)) + '</td>' +
      '<td><div class="row" style="gap:8px;flex-wrap:nowrap">' + progBar(pct(g.o + g.dc, g.t)) + '<span class="small num">' + pct(g.o + g.dc, g.t) + '%</span></div></td>' +
      (showSizes ? sizeCols.map(function (c) { return '<td class="r num">' + (g.s[c.k] || '<span class="muted">·</span>') + '</td>'; }).join('') : '') + '</tr>';
  };
  h += '<div class="card"><div class="tablewrap" style="max-height:70vh"><table class="t"><thead>' + hdr + '</thead><tbody>' + line(tot, true) + list.map(function (g) { return line(g); }).join('') + '</tbody></table></div></div>';
  $('#page').innerHTML = h;
  $('#rExport').onclick = function () { busy(this, exportWorkbook(RP.x)).catch(errToast); };
}

/* =================================================================== อีเมลติดตาม */
ROUTES['admin/mail'] = function (params) {
  if (!needAdmin()) return;
  if (params[0] && !canEv(params[0])) { $('#page').innerHTML = '<div class="card empty">' + ic('shield') + '<p>ท่านไม่ได้เป็นผู้ดูแลกิจกรรมนี้</p></div>'; return; }
  withEvent(params, 'mail', function (id) {
    document.title = 'อีเมลติดตาม · SOMDEJ HR Connect';
    loadEvents(true).then(function () { drawMail(id); }).catch(errToast);
  });
};
function drawMail(id) {
  var ev = AD.events.filter(function (e) { return e.id === id; })[0], mc = ev.mail || {};
  var days = mc.days || [];
  if (ev.type === 'CHECKIN') { $('#page').innerHTML = pageHead('อีเมล', esc(ev.title)) + '<div class="card pad empty">' + ic('mail') + '<p>กิจกรรมเช็กอินไม่ส่งอีเมล · ประกาศงานรวมอยู่ในอีเมลประกาศของกิจกรรมเสนอชื่อ</p></div>'; return; }
  var th = isTh(ev), ANN = ['ANNOUNCE', 'send', 'ประกาศเปิดกิจกรรมถึงบุคลากรทุกคน', 'ส่งครั้งเดียวถึงทุกคนที่มีอีเมล รวมทุกกิจกรรม Town Hall ในฉบับเดียว · โควตาไม่พอระบบส่งต่อวันถัดไปจนครบ (ไม่ส่งซ้ำคนเดิม)', 'announce', true];
  var cards = ev.type === 'NOMINATE' ? [['CONFIRM', 'check', 'ยืนยันการเสนอชื่อถึงผู้เสนอ', 'ส่งทันทีเมื่อบันทึก/แก้ไข แสดงรายชื่อที่ท่านเสนอ (เห็นเฉพาะเจ้าของอีเมล)', 'confirm', false], ANN,
      ['REMIND_STAFF', 'alert', 'เตือนผู้ที่ยังไม่เสนอชื่อ', 'ส่งรายบุคคลถึงผู้ที่ยังไม่เสนอชื่อ ตามวันก่อนปิดรับที่ตั้งไว้ด้านล่าง', 'remindStaff', true],
      ['HEAD_SUMMARY', 'building', 'สรุปถึงหัวหน้าฝ่าย/หน่วย', 'ร้อยละการมีส่วนร่วมในสังกัด (ไม่แสดงว่าใครเสนอชื่อใคร)', 'headSummary', true],
      ['ADMIN_SUMMARY', 'chart', 'สรุปภาพรวมถึงผู้ดูแล', 'ตัวเลขการมีส่วนร่วมรวม', 'adminSummary', true]]
    : ev.type === 'QUESTION' ? [ANN, ['REMIND_STAFF', 'alert', 'เชิญชวนส่งคำถาม (ก่อนปิดรับ)', 'ส่งถึงบุคลากรทุกคนที่มีอีเมล ตามวันก่อนปิดรับที่ตั้งไว้ด้านล่าง', 'remindStaff', true]]
    : ev.type === 'ORDER' ? [['CONFIRM', 'check', 'แจ้งสถานะคำสั่งซื้ออัตโนมัติ', 'ส่งถึงผู้สั่ง (ถ้ามีอีเมลใน HR) เมื่อ: รับคำสั่งซื้อ · ยืนยันชำระ · ตีกลับสลิป · เปลี่ยนสถานะจัดส่ง (เมื่อติ๊ก "แจ้งทางอีเมล")', 'confirm', false]] : [
    ['CONFIRM', 'check', 'ยืนยันการบันทึกถึงบุคลากร', 'ส่งทันทีที่บุคลากรบันทึก/แก้ไข พร้อมรายละเอียดที่เลือก (เฉพาะผู้มีอีเมล)', 'confirm', false],
    ['REMIND_STAFF', 'alert', 'เตือนบุคลากรที่ยังไม่ตอบ', 'ส่งรายบุคคลถึงผู้ที่ยังไม่บันทึก พร้อมปุ่มเข้าระบบ (ครั้งละไม่เกิน 400 ฉบับ)', 'remindStaff', true],
    ['HEAD_SUMMARY', 'building', 'สรุปถึงหัวหน้าฝ่าย/หน่วย', 'รายชื่อผู้ที่ยังไม่ตอบในสังกัด + ความคืบหน้า (ส่งตามรอบเฉพาะสังกัดที่ยังค้าง)', 'headSummary', true],
    ['ADMIN_SUMMARY', 'chart', 'สรุปภาพรวมถึงผู้ดูแล', 'ตัวเลขรวม ยอดต่อรายการ/ไซซ์ และฝ่ายที่ยังค้าง ถึงผู้ดูแลสูงสุดและผู้ดูแลกิจกรรมนี้ที่มีอีเมล', 'adminSummary', true]
  ];
  var h = pageHead('อีเมลติดตาม', esc(ev.title), eventPicker(id, 'mail'), 'อีเมล');
  h += '<div class="mailcards">' + cards.map(function (c) {
    return '<div class="mailcard"><div class="row between"><div class="ic">' + ic(c[1]) + '</div><label class="switch" title="ส่งอัตโนมัติ"><input type="checkbox" data-auto="' + c[4] + '" ' + (mc[c[4]] ? 'checked' : '') + '><span class="tr"></span><span class="small">' + (c[0] === 'CONFIRM' ? 'เปิดใช้' : 'ส่งตามรอบ') + '</span></label></div>' +
      '<h4>' + c[2] + '</h4><p>' + c[3] + '</p><div class="row"><button class="btn sm" data-pv="' + c[0] + '">' + ic('eye') + 'ดูตัวอย่าง</button>' + (c[5] ? '<button class="btn sm" data-test="' + c[0] + '">' + ic('send') + 'ส่งทดสอบ</button><button class="btn sm primary" data-send="' + c[0] + '">ส่งตอนนี้</button>' : '') + '</div></div>';
  }).join('') + '</div>';
  if (ev.type === 'ORDER') h += '<div class="card pad small muted" style="margin-top:18px">' + ic('info') + ' กด "บันทึกการตั้งค่า" หลังเปิด/ปิดสวิตช์ <button class="btn primary sm" id="mSave" data-busy="กำลังบันทึก…" style="margin-left:8px">' + ic('check') + 'บันทึกการตั้งค่า</button><span class="hide"><select id="mHour"><option value="9">9</option></select><select id="mBefore"><option value="0">0</option></select></span></div>';
  else h += '<div class="card" style="margin-top:18px"><div class="hd"><h3>' + ic('calendar') + ' รอบส่งอัตโนมัติ</h3><button class="btn primary sm" id="mSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึกการตั้งค่า</button></div><div class="bd"><div class="grid3">' +
    '<div class="field"><label class="f">วันที่ส่ง</label><div class="daypick">' + TH_DAY.map(function (d, i) { return '<label><input type="checkbox" data-day="' + i + '" ' + (days.indexOf(i) >= 0 ? 'checked' : '') + '><span>' + d + '</span></label>'; }).join('') + '</div></div>' +
    '<div class="field"><label class="f">เวลา (ประมาณ)</label><select class="input" id="mHour">' + [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(function (x) { return '<option value="' + x + '" ' + ((mc.hour == null ? 9 : +mc.hour) === x ? 'selected' : '') + '>' + x + ':00 น.</option>'; }).join('') + '</select><div class="hint">ระบบตรวจทุกชั่วโมง ส่งในชั่วโมงนั้น</div></div>' +
    (th ? '<div class="field"><label class="f">ส่งก่อนปิดรับ (วัน · คั่นด้วย ,)</label><input class="input" id="mBefore" value="' + esc(mc.beforeCloseDays == null ? '' : mc.beforeCloseDays) + '" placeholder="เช่น 3,1"><div class="hint">3,1 = ส่ง 3 วันและ 1 วันก่อนปิด · ว่าง = ไม่ส่ง</div></div>' + (mc.announce != null || ev.type === 'NOMINATE' ? '<div class="field"><label class="f">เวลาส่งอีเมลประกาศ</label><input class="input" type="datetime-local" id="mAnnAt" value="' + esc(String(mc.announceAt || '').slice(0, 16)) + '"><div class="hint">ส่งเมื่อถึงเวลานี้และกิจกรรมเปิดรับแล้ว</div></div>' : '') : '<div class="field"><label class="f">ส่งเพิ่มก่อนปิดรับ</label><select class="input" id="mBefore">' + [0, 1, 2, 3, 5, 7].map(function (x) { return '<option value="' + x + '" ' + ((+mc.beforeCloseDays || 0) === x ? 'selected' : '') + '>' + (x ? x + ' วันก่อนปิด' : 'ไม่ส่ง') + '</option>'; }).join('') + '</select></div>') + '</div>' +
    '<div class="small muted">' + ic('info') + ' ต้อง Run <b>installTriggers</b> ใน Apps Script หนึ่งครั้งเพื่อเปิดตัวตั้งเวลา · ส่งจากบัญชีที่ Deploy (Workspace ~1,500 ฉบับ/วัน) · หัวหน้าต้องมีอีเมลในเมนู "หัวหน้าฝ่าย/หน่วย"</div></div></div>';
  h += '<div class="card" style="margin-top:18px"><div class="hd"><h3>' + ic('history') + ' บันทึกการส่ง</h3><button class="btn sm" id="mLogR">' + ic('refresh') + '</button></div><div id="mLog">' + skel(1) + '</div></div>';
  $('#page').innerHTML = h;
  var loadLog = function () {
    api('listMailLog', { eventId: id, limit: 300 }).then(function (l) {
      $('#mLog').innerHTML = l.length ? '<div class="tablewrap"><table class="t"><thead><tr><th>เวลา</th><th>ชนิด</th><th>วิธี</th><th class="r">ผู้รับ</th><th class="r">สำเร็จ</th><th class="r">ล้มเหลว</th><th>โดย</th><th>หมายเหตุ</th></tr></thead><tbody>' +
        l.map(function (r) { return '<tr><td class="num">' + esc(thShort(r.ts)) + '</td><td>' + esc(MAIL_TH[r.type] || r.type) + '</td><td><span class="chip ' + (r.trigger === 'AUTO' ? 'info' : 'acc') + '">' + (r.trigger === 'AUTO' ? 'อัตโนมัติ' : 'กดส่ง') + '</span></td><td class="r num">' + r.recipients + '</td><td class="r num" style="color:var(--ok)">' + r.sent + '</td><td class="r num" style="color:' + (+r.failed ? 'var(--danger)' : 'inherit') + '">' + r.failed + '</td><td>' + esc(r.actor) + '</td><td class="small">' + esc(r.type === 'CONFIRM' ? r.detail : r.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">ยังไม่มีการส่งอีเมล</div>';
    }).catch(errToast);
  };
  loadLog(); $('#mLogR').onclick = loadLog;
  $$('[data-pv]').forEach(function (b) { b.onclick = function () { previewMail(id, b.dataset.pv); }; });
  $$('[data-test]').forEach(function (b) {
    b.onclick = function () {
      var me = ''; try { me = localStorage.getItem('hrc_testmail') || ''; } catch (e) { }
      var m = modal({ title: 'ส่งทดสอบ · ' + MAIL_TH[b.dataset.test], body: '<div class="field"><label class="f">ส่งถึงอีเมล</label><input class="input" id="tmTo" type="email" value="' + esc(me) + '" placeholder="you@redcross.or.th"></div><div class="small muted">ส่ง 1 ฉบับ (หัวเรื่องขึ้นต้น [ทดสอบ]) ด้วยข้อมูลจริงของผู้รับรายแรก</div>',
        foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="tmGo" data-busy="กำลังส่ง…">' + ic('send') + 'ส่งทดสอบ</button>' });
      $('#tmGo').onclick = function () { var to = $('#tmTo').value.trim(); try { localStorage.setItem('hrc_testmail', to); } catch (e) { } busy(this, api('sendMail', { eventId: id, type: b.dataset.test, testTo: to })).then(function () { m.close(); toast('ส่งอีเมลทดสอบถึง ' + to + ' แล้ว', 'ok'); loadLog(); }).catch(errToast); };
    };
  });
  $$('[data-send]').forEach(function (b) {
    b.onclick = function () {
      var t = b.dataset.send;
      busy(b, api('previewMail', { eventId: id, type: t })).then(function (pv) {
        return confirmBox({ title: 'ส่ง "' + MAIL_TH[t] + '" ตอนนี้?', icon: 'send', ok: 'ส่ง ' + pv.recipients + ' ฉบับ', msg: esc(pv.note) + (pv.recipients ? '' : '<br><b>ไม่มีผู้รับที่มีอีเมล</b>') }).then(function (y) {
          if (!y || !pv.recipients) return;
          toast('กำลังส่ง ' + pv.recipients + ' ฉบับ อาจใช้เวลาสักครู่…', 'info');
          return busy(b, api('sendMail', { eventId: id, type: t })).then(function (r) {
            toast('ส่งแล้ว ' + r.sent + '/' + r.recipients + (r.failed ? ' · ล้มเหลว ' + r.failed : '') + (r.remaining ? ' · ค้าง ' + r.remaining + ' กดส่งอีกครั้งเพื่อส่งต่อ' : '') + ' · โควตาคงเหลือวันนี้ ' + r.quotaLeft, r.failed ? 'warn' : 'ok', MAIL_TH[t]);
            loadLog();
          });
        });
      }).catch(errToast);
    };
  });
  $('#mSave').onclick = function () {
    var mail = Object.assign({}, mc);
    $$('[data-auto]').forEach(function (c) { mail[c.dataset.auto] = c.checked; });
    mail.days = $$('[data-day]').filter(function (c) { return c.checked; }).map(function (c) { return +c.dataset.day; });
    mail.hour = +$('#mHour').value; mail.beforeCloseDays = th ? $('#mBefore').value.replace(/[^\d,]/g, '') : +$('#mBefore').value;
    if ($('#mAnnAt')) mail.announceAt = $('#mAnnAt').value;
    var e2 = Object.assign({}, ev, { mail: mail });
    busy(this, api('saveEvent', { event: e2 })).then(function () { ev.mail = mail; toast('บันทึกการตั้งค่าอีเมลแล้ว', 'ok'); }).catch(errToast);
  };
  $$('[data-auto]').forEach(function (c) { c.onchange = function () { toast('กด "บันทึกการตั้งค่า" เพื่อยืนยัน', 'info'); }; });
}
function previewMail(id, type) {
  var m = modal({ title: 'ตัวอย่าง · ' + MAIL_TH[type], size: 'lg', body: skel(1) });
  api('previewMail', { eventId: id, type: type }).then(function (pv) {
    $('.mb', m.el).innerHTML = '<div class="small muted" style="margin-bottom:8px"><b>หัวเรื่อง:</b> ' + esc(pv.subject) + '<br>' + esc(pv.note) + '</div><iframe class="mailframe" id="pvFrame"></iframe>';
    var f = $('#pvFrame'); f.srcdoc = pv.html;
  }).catch(function (e) { m.close(); errToast(e); });
}

/* =================================================================== กิจกรรม */
var COLORS = ['#8E4B9D', '#C8202E', '#1F6FB2', '#0F8B6E', '#D97706', '#BE185D', '#334155', '#7C3AED'];
ROUTES['admin/events'] = function (params) {
  if (!needAdmin()) return;
  document.title = 'กิจกรรม · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  if (params[0] === 'edit') { if (params[1] === 'new' && !needSuper()) return; return editEvent(params[1]); }
  $('#page').innerHTML = skel(2);
  loadEvents(true).then(function (list) {
    list = list.filter(function (e) { return canEv(e.id); });
    var h = pageHead('กิจกรรม', isSuper() ? 'สร้างและจัดการกิจกรรมทั้งหมดในระบบ' : 'กิจกรรมที่ท่านได้รับมอบหมายให้ดูแล', isSuper() ? '<a class="btn primary" href="#/admin/events/edit/new">' + ic('plus') + 'สร้างกิจกรรม</a>' : '', 'จัดการ');
    h += list.length ? '<div class="evgrid">' + list.map(function (e) {
      var aud = e.audience.mode === 'LIST' ? 'ตามรายชื่อ ' + nf(e.eligible || 0) + ' คน' : e.audience.mode === 'FILTER' ? 'เฉพาะกลุ่ม' : 'ทุกคน';
      return '<div class="evcard" style="--ec:' + esc(e.color) + '"><div class="cover" style="height:110px">' + (e.config.image ? imgTag(e.config.image, '') : '') + '<div class="tag">' + evStatusChip(e.status) + '</div></div><div class="body"><h3>' + esc(e.title) + '</h3>' +
        '<div class="meta"><span>' + esc(TYPE_TH[e.type] || e.type) + '</span><span>' + ic('users') + ' ' + aud + '</span><span>' + ic('check') + ' ตอบแล้ว ' + nf(e.responded) + '</span></div>' +
        '<div class="meta"><span>' + ic('calendar') + ' ' + esc(thDate(e.openAt)) + ' – ' + esc(thDate(e.closeAt)) + '</span></div>' +
        (isSuper() ? '<div class="meta"><span>' + ic('shield') + ' ผู้ดูแลกิจกรรม: ' + (e.admins && e.admins.length ? esc(e.admins.join(', ')) : '<span class="muted">เฉพาะผู้ดูแลสูงสุด</span>') + '</span></div>' : '') +
        '<div class="mystate"><a class="btn sm" href="#/admin/ev/' + esc(e.id) + '/settings">' + ic('edit') + 'ตั้งค่า</a><a class="btn sm primary" href="#/admin/ev/' + esc(e.id) + '">' + ic('arrowr') + 'เข้าทำงาน</a></div></div></div>';
    }).join('') + '</div>' : '<div class="card empty">' + ic('layers') + '<p>ยังไม่มีกิจกรรม</p></div>';
    if (isSuper()) h += '<div class="card pad" style="margin-top:20px"><h3 style="font-size:16px;margin-bottom:6px">' + ic('sparkle') + ' ชนิดกิจกรรมที่ใช้ได้</h3><p class="muted small" style="margin:0"><b>เลือกแบบ + ไซซ์</b> (เสื้อม่วง) · <b>เลือก 1 รายการตามรายชื่อ</b> (ผ้า/ชุดปฏิบัติงาน — แต่ละคนมีตัวเลือกต่างกัน) · <b>สั่งซื้อ + ชำระเงิน</b> · แผนถัดไป: โหวตบุคลากรดีเด่น · ส่งคำถาม Town Hall · ลงทะเบียน · คำขอ</p></div>';
    $('#page').innerHTML = h;
  }).catch(errToast);
};
function dtLocal(v) { return String(v || '').slice(0, 16); }
function editEvent(id) {
  $('#page').innerHTML = skel(3);
  loadEvents(true).then(function (list) {
    var isNew = id === 'new', e = isNew ? { type: 'CHOICE', title: '', color: '#8E4B9D', published: false, audience: { mode: 'ALL' }, openAt: localIso().slice(0, 16), closeAt: '',
      config: { itemName: '', image: '', sizeNote: '', qtyPerPerson: 1, allowExtra: false, extraMax: 0, extraPrice: 0, allowDecline: true, declineLabel: 'ไม่ประสงค์รับ', coordinator: { name: '', phone: '' }, exportUnit: S.boot.brand.orgName,
        options: [{ key: 'M', label: 'แบบชาย', sizes: [{ code: 'S', chest: '', length: '' }] }, { key: 'F', label: 'แบบหญิง', sizes: [{ code: 'S', chest: '', length: '' }] }] }, mail: { confirm: true, days: [1, 4], hour: 9, beforeCloseDays: 2 } } : JSON.parse(JSON.stringify(list.filter(function (x) { return x.id === id; })[0] || null));
    if (!e) { $('#page').innerHTML = '<div class="card empty">ไม่พบกิจกรรม</div>'; return; }
    var ED = e; setAccent(e.color);
    var draw = function () {
      var c = ED.config, a = ED.audience || { mode: 'ALL' };
      var h = pageHead(isNew ? 'สร้างกิจกรรม' : 'แก้ไขกิจกรรม', isNew ? '' : esc(ED.title), '<a class="btn" href="#/admin/events">ยกเลิก</a><button class="btn primary" id="evSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>', '<a href="#/admin/events">กิจกรรม</a>');
      h += '<div class="dgrid"><div class="stack"><div class="card"><div class="hd"><h3>ข้อมูลกิจกรรม</h3></div><div class="bd">' +
        '<div class="field"><label class="f">ชื่อกิจกรรม *</label><input class="input" data-k="title" value="' + esc(ED.title) + '"></div>' +
        '<div class="field"><label class="f">คำอธิบายย่อ (บรรทัดรอง)</label><input class="input" data-k="subtitle" value="' + esc(ED.subtitle || '') + '"></div>' +
        '<div class="field"><label class="f">รายละเอียด</label><textarea class="input" data-k="description">' + esc(ED.description || '') + '</textarea></div>' +
        '<div class="grid2"><div class="field"><label class="f">ชนิด</label><select class="input" data-k="type"' + (isNew ? '' : ' disabled') + '><option value="CHOICE">เลือกแบบ + ไซซ์ (ไม่เก็บเงิน)</option><option value="PICK" ' + (ED.type === 'PICK' ? 'selected' : '') + '>เลือก 1 รายการ ตามรายชื่อ (ตัวเลือกเฉพาะบุคคล เช่น ผ้า/ชุด)</option><option value="ORDER" ' + (ED.type === 'ORDER' ? 'selected' : '') + '>สั่งซื้อ + ชำระเงิน (QR พร้อมเพย์ + แนบสลิป)</option><option value="REGISTER" ' + (ED.type === 'REGISTER' ? 'selected' : '') + '>ลงทะเบียนเข้าร่วม (รุ่นถัดไป)</option><option value="REQUEST" ' + (ED.type === 'REQUEST' ? 'selected' : '') + '>คำขอ / ขอสิทธิ (รุ่นถัดไป)</option>' + (isTh(ED) ? '<option value="' + ED.type + '" selected>' + esc(TYPE_TH[ED.type]) + '</option>' : '') + '</select></div>' +
        '<div class="field"><label class="f">สีประจำกิจกรรม</label><div class="colorpick">' + COLORS.map(function (x) { return '<button type="button" data-color="' + x + '" class="' + (x.toLowerCase() === String(ED.color).toLowerCase() ? 'on' : '') + '" style="background:' + x + '"></button>'; }).join('') + '</div></div></div>' +
        '<div class="grid2"><div class="field"><label class="f">เปิดรับ</label><input class="input" type="datetime-local" data-k="openAt" value="' + esc(dtLocal(ED.openAt)) + '"></div><div class="field"><label class="f">ปิดรับ</label><input class="input" type="datetime-local" data-k="closeAt" value="' + esc(dtLocal(ED.closeAt)) + '"><div class="hint">ขยายเวลาได้ตลอด · หลังปิดแอดมินยังบันทึกแทนได้</div></div></div>' +
        '<label class="switch"><input type="checkbox" id="evPub" ' + (ED.published ? 'checked' : '') + '><span class="tr"></span>เผยแพร่ (บุคลากรมองเห็น)</label></div></div>' +
        (ED.type === 'PICK' ? eligibilityCard(ED, isNew) : '<div class="card"><div class="hd"><h3>ผู้มีสิทธิ์เข้าร่วม</h3></div><div class="bd"><div class="seg" id="audMode"><button class="' + (a.mode !== 'FILTER' ? 'on' : '') + '" data-m="ALL">บุคลากรทุกคน</button><button class="' + (a.mode === 'FILTER' ? 'on' : '') + '" data-m="FILTER">เฉพาะกลุ่ม</button></div>' +
        '<div id="audBox" style="margin-top:12px;' + (a.mode === 'FILTER' ? '' : 'display:none') + '"><div class="field"><label class="f">ฝ่าย (ชื่อเต็ม คั่นด้วยบรรทัด)</label><textarea class="input" data-a="divisions" placeholder="รพ.สมเด็จฯ - ฝ่ายการพยาบาล">' + esc((a.divisions || []).join('\n')) + '</textarea></div>' +
        '<div class="grid2"><div class="field"><label class="f">กลุ่มบุคลากร</label><textarea class="input" data-a="groups">' + esc((a.groups || []).join('\n')) + '</textarea></div><div class="field"><label class="f">ตำแหน่ง</label><textarea class="input" data-a="positions">' + esc((a.positions || []).join('\n')) + '</textarea></div></div>' +
        '<div class="field"><label class="f">รหัสพนักงานเพิ่มเติม (คั่นด้วย , หรือบรรทัด)</label><textarea class="input" data-a="codes">' + esc((a.codes || []).join('\n')) + '</textarea><div class="hint">เงื่อนไขต่างหมวดต้องตรงทุกข้อ · รหัสที่ระบุได้สิทธิ์เสมอ</div></div></div></div>') + '</div></div>' +
        '<div class="stack">' + (isTh(ED) ? thEditor(ED) : ED.type === 'CHOICE' || ED.type === 'ORDER' ? choiceEditor(c, ED.type) : ED.type === 'PICK' ? pickEditor(c) : '<div class="card pad empty">' + ic('layers') + '<p>แบบฟอร์มสำหรับกิจกรรมชนิดนี้จะเปิดในรุ่นถัดไป</p></div>') + '</div></div>';
      $('#page').innerHTML = h;
      bindEditor();
      if (ED.type === 'PICK') bindPickEditor(ED, readForm, draw, isNew);
      if (isTh(ED)) thBindEditor(ED, readForm, draw);
    };
    var readForm = function () {
      $$('[data-k]').forEach(function (i) { ED[i.dataset.k] = i.value; });
      ED.published = $('#evPub').checked;
      var a = ED.audience = ED.audience || { mode: 'ALL' };
      $$('[data-a]').forEach(function (t) { a[t.dataset.a] = t.value.split(/[\n,]+/).map(function (x) { return x.trim(); }).filter(Boolean); });
      if (ED.type === 'PICK') readPickForm(ED);
      if (isTh(ED)) thReadForm(ED);
      if (ED.type === 'CHOICE' || ED.type === 'ORDER') {
        var c = ED.config;
        $$('[data-c]').forEach(function (i) { var k = i.dataset.c; c[k] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? +i.value : i.value; });
        if ($('#coName')) c.coordinator = { name: $('#coName').value.trim(), phone: $('#coPhone').value.trim() };
        if (ED.type === 'ORDER') {
          c.payment = { promptpay: $('#pyId').value.replace(/\D/g, ''), accountName: $('#pyName').value.trim(), note: $('#pyNote').value.trim() };
          c.shipping = c.shipping || {}; c.shipping.enabled = $('#shOn').checked; c.shipping.label = $('#shLabel').value.trim() || 'ค่าส่ง';
          c.shipping.table = $('#shTable').value.split(/\n+/).map(function (l) { var m = l.match(/(\d+)\D+(\d+(?:\.\d+)?)/); return m ? [+m[1], +m[2]] : null; }).filter(Boolean);
        }
        $$('[data-oi]').forEach(function (box) {
          var o = c.options[+box.dataset.oi], prev = o.sizes || [];
          o.label = $('[data-ol]', box).value.trim(); o.key = $('[data-ok]', box).value.trim().toUpperCase();
          o.sizes = $$('tr[data-si]', box).map(function (tr) {
            var s = Object.assign({}, prev[+tr.dataset.si] || {}); delete s.note; delete s.hidden;   // เก็บค่าที่ไม่มีช่องแก้ (ความยาวแขน/ชายเสื้อ)
            s.code = $('[data-s=code]', tr).value.trim().toUpperCase(); s.chest = $('[data-s=chest]', tr).value.trim(); s.length = $('[data-s=length]', tr).value.trim();
            var note = $('[data-s=note]', tr).value.trim(); if (note) s.note = note; if ($('[data-s=hidden]', tr).checked) s.hidden = true;
            var pr = $('[data-s=price]', tr); if (pr) s.price = +pr.value || 0;
            if (s.chest !== '') s.chest = +s.chest; if (s.length !== '') s.length = +s.length; return s;
          }).filter(function (s) { return s.code; });
        });
      }

    };
    var bindEditor = function () {
      var tsel = $('[data-k=type]'); if (tsel) tsel.onchange = function () { readForm(); if (ED.type === 'PICK') { ED.audience = { mode: 'LIST' }; ED.config = Object.assign({ items: [{ key: 'P01', label: '', kind: '' }], notice: [], allowDecline: true, declineLabel: 'ไม่ประสงค์รับ', showImages: false, contact: { name: '', phone: '' } }, ED.config.items ? ED.config : {}); } if (ED.type === 'ORDER') { ED.config.payment = ED.config.payment || { promptpay: '', accountName: '' }; ED.config.shipping = ED.config.shipping || { enabled: false, label: 'ค่าส่ง EMS', table: [] }; ED.config.orderPrefix = ED.config.orderPrefix || 'OD'; ED.audience = { mode: 'FILTER', codes: [] }; } draw(); };
      $$('[data-color]').forEach(function (b) { b.onclick = function () { readForm(); ED.color = b.dataset.color; setAccent(ED.color); draw(); }; });
      $$('#audMode [data-m]').forEach(function (b) { b.onclick = function () { readForm(); ED.audience.mode = b.dataset.m; draw(); }; });
      $$('[data-addsize]').forEach(function (b) { b.onclick = function () { readForm(); ED.config.options[+b.dataset.addsize].sizes.push({ code: '', chest: '', length: '' }); draw(); }; });
      $$('[data-delsize]').forEach(function (b) { b.onclick = function () { readForm(); var p = b.dataset.delsize.split(':'); ED.config.options[+p[0]].sizes.splice(+p[1], 1); draw(); }; });
      $$('[data-mv]').forEach(function (b) { b.onclick = function () { readForm(); var p = b.dataset.mv.split(':'), arr = ED.config.options[+p[0]].sizes, i = +p[1], j = i + (+p[2]); if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; draw(); }; });
      $$('[data-delopt]').forEach(function (b) { b.onclick = function () { readForm(); ED.config.options.splice(+b.dataset.delopt, 1); draw(); }; });
      var imgIn = $('#imgIn');
      if (imgIn) {
        var pv = function () {
          var src = imgIn.value.trim(), meta = $('#imgMeta');
          if (/^img:/.test(src)) { loadImg(src).then(function (u) { ['#imgPv1', '#imgPv2'].forEach(function (k) { var im = $(k); if (im) { im.style.display = ''; im.src = u; } }); meta.innerHTML = '<span style="color:var(--ok)">' + ic('check') + ' รูปที่อัปโหลดในระบบ</span>'; }).catch(function () { meta.textContent = 'โหลดรูปไม่ได้'; }); return; }
          ['#imgPv1', '#imgPv2'].forEach(function (k) { var im = $(k); im.style.display = src ? '' : 'none'; if (src) im.src = src; });
          if (!src) { meta.textContent = 'ไม่มีรูป — การ์ดจะแสดงเป็นแถบสีประจำกิจกรรม'; return; }
          var t = new Image();
          t.onload = function () { var w = t.naturalWidth, h = t.naturalHeight, r = w / h; meta.innerHTML = 'ขนาด ' + w + '×' + h + ' px · ' + (w < 900 ? '<span style="color:var(--warn)">ภาพเล็ก อาจไม่คมบนจอใหญ่ (แนะนำกว้าง 1,200–1,600 px)</span>' : '<span style="color:var(--ok)">ความละเอียดเหมาะสม</span>') + (r < 1.2 ? ' · <span style="color:var(--warn)">ภาพแนวตั้ง จะเหลือขอบซ้าย-ขวา (แนะนำภาพแนวนอน ~2:1)</span>' : ''); };
          t.onerror = function () { meta.innerHTML = '<span style="color:var(--danger)">' + ic('alert') + ' โหลดรูปไม่ได้ — ตรวจชื่อไฟล์ (ตัวพิมพ์เล็ก/ใหญ่ต้องตรง) หรือรอ GitHub อัปเดต 1–2 นาที</span>'; };
          t.src = src;
        };
        imgIn.oninput = debounce(pv, 400); pv();
        var up = $('#imgUp'); if (up) up.onclick = function () { if (isNew) return toast('กด "บันทึก" กิจกรรมก่อน แล้วจึงอัปโหลดรูป', 'warn'); uploadImgFlow(ED.id, up).then(function (ref) { if (ref) { imgIn.value = ref; pv(); toast('อัปโหลดรูปแล้ว กด "บันทึก" เพื่อใช้รูปนี้', 'ok'); } }); };
      }
      var ao = $('#addOpt'); if (ao) ao.onclick = function () { readForm(); ED.config.options.push({ key: 'X' + ED.config.options.length, label: 'แบบใหม่', sizes: [{ code: 'S', chest: '', length: '' }] }); draw(); };
      $('#evSave').onclick = function () {
        readForm();
        if (!ED.title.trim()) return toast('กรุณาระบุชื่อกิจกรรม', 'warn');
        if (!ED.closeAt) return toast('กรุณาระบุวันปิดรับ', 'warn');
        if (ED.type === 'PICK' && ED.config.items.some(function (it) { return !it.label.trim(); })) return toast('กรุณากรอกชื่อรายการให้ครบ (หรือลบแถวที่ว่าง)', 'warn');
        busy(this, api('saveEvent', { event: ED })).then(function (r) {
          AD.events = null; toast('บันทึกกิจกรรม "' + r.title + '" แล้ว', 'ok');
          refreshBoot().catch(function () { }); go(isNew ? '#/admin/ev/' + r.id + '/settings' : '#/admin/ev/' + r.id);
        }).catch(errToast);
      };
    };
    draw();
  }).catch(errToast);
}
function choiceEditor(c, type) {
  var ord = type === 'ORDER';
  return '<div class="card"><div class="hd"><h3>รายการ / ไซซ์</h3><button class="btn sm" id="addOpt">' + ic('plus') + 'เพิ่มแบบ</button></div><div class="bd">' +
    '<div class="grid2"><div class="field"><label class="f">ชื่อสิ่งของ</label><input class="input" data-c="itemName" value="' + esc(c.itemName || '') + '"></div><div class="field"><label class="f">รูปประกอบ</label><div class="row" style="flex-wrap:nowrap"><input class="input" data-c="image" id="imgIn" value="' + esc(c.image || '') + '" placeholder="ชื่อไฟล์ / URL / อัปโหลด"><button type="button" class="btn" id="imgUp" data-busy="กำลังอัปโหลด…">' + ic('upload') + 'อัปโหลด</button></div><div class="hint">อัปโหลดรูปจากเครื่องได้เลย (ระบบย่อให้อัตโนมัติ) หรือใส่ชื่อไฟล์ใน GitHub / URL</div></div></div>' +
    '<div class="imgprev"><div class="box"><small>ตัวอย่าง: การ์ดหน้าแรก (ภาพแสดงเต็ม ไม่ตัดขอบ)</small><div class="frame" style="height:120px"><img id="imgPv1" alt=""></div></div>' +
    '<div class="box"><small>ตัวอย่าง: หน้ากิจกรรม (กดขยายดูเต็มได้)</small><div class="frame" style="height:120px"><img id="imgPv2" alt=""></div></div>' +
    '<div class="meta muted" id="imgMeta" style="grid-column:1/-1"></div></div>' +
    (c.options || []).map(function (o, oi) {
      return '<div data-oi="' + oi + '" style="border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:12px"><div class="row" style="margin-bottom:8px"><input class="input" data-ol value="' + esc(o.label) + '" style="flex:1;min-width:140px" placeholder="ชื่อแบบ"><input class="input" data-ok value="' + esc(o.key) + '" style="width:80px" placeholder="รหัส" title="รหัสแบบ (ห้ามเปลี่ยนเมื่อมีคนจองแล้ว)"><button class="iconbtn" data-delopt="' + oi + '" title="ลบแบบ">' + ic('trash') + '</button></div>' +
        '<div class="tablewrap"><table class="t sizeeditor"><thead><tr><th>ไซซ์</th>' + (ord ? '<th>ราคา (฿)</th>' : '') + '<th>อก (นิ้ว)</th><th>ยาว (นิ้ว)</th><th>หมายเหตุ</th><th title="ซ่อนจากผู้ใช้">ซ่อน</th><th></th></tr></thead><tbody>' +
        o.sizes.map(function (s, si) {
          return '<tr data-si="' + si + '"><td><input class="input" data-s="code" value="' + esc(s.code) + '" style="width:70px"></td>' + (ord ? '<td><input class="input" data-s="price" type="number" min="0" value="' + esc(s.price || 0) + '" style="width:84px"></td>' : '') + '<td><input class="input" data-s="chest" type="number" step="0.5" value="' + esc(s.chest) + '" style="width:76px"></td><td><input class="input" data-s="length" type="number" step="0.5" value="' + esc(s.length) + '" style="width:76px"></td>' +
            '<td><input class="input" data-s="note" value="' + esc(s.note || '') + '" placeholder="-"></td><td><input type="checkbox" data-s="hidden" ' + (s.hidden ? 'checked' : '') + '></td><td style="white-space:nowrap"><button class="iconbtn" data-mv="' + oi + ':' + si + ':-1">' + ic('up') + '</button><button class="iconbtn" data-mv="' + oi + ':' + si + ':1">' + ic('down') + '</button><button class="iconbtn" data-delsize="' + oi + ':' + si + '">' + ic('trash') + '</button></td></tr>';
        }).join('') + '</tbody></table></div><button class="btn sm ghost" data-addsize="' + oi + '" style="margin-top:6px">' + ic('plus') + 'เพิ่มไซซ์</button></div>';
    }).join('') +
    '<div class="field"><label class="f">หมายเหตุตารางไซซ์</label><input class="input" data-c="sizeNote" value="' + esc(c.sizeNote || '') + '"></div>' +
    (ord ? orderSettingsHtml(c) : '<div class="grid3"><div class="field"><label class="f">จำนวนต่อคน</label><input class="input" type="number" min="1" data-c="qtyPerPerson" value="' + esc(c.qtyPerPerson || 1) + '"></div><div class="field"><label class="f">สั่งเพิ่มได้สูงสุด</label><input class="input" type="number" min="0" data-c="extraMax" value="' + esc(c.extraMax || 0) + '"></div><div class="field"><label class="f">ราคาต่อตัวที่สั่งเพิ่ม (บาท)</label><input class="input" type="number" min="0" data-c="extraPrice" value="' + esc(c.extraPrice || 0) + '"></div></div>' +
    '<div class="row" style="gap:20px;margin-bottom:14px"><label class="switch"><input type="checkbox" data-c="allowExtra" ' + (c.allowExtra ? 'checked' : '') + '><span class="tr"></span>อนุญาตสั่งเพิ่ม (จ่ายเงินเพิ่ม)</label><label class="switch"><input type="checkbox" data-c="allowDecline" ' + (c.allowDecline !== false ? 'checked' : '') + '><span class="tr"></span>มีตัวเลือก "ไม่ประสงค์"</label><label class="switch"><input type="checkbox" data-c="requireReason" ' + (c.requireReason ? 'checked' : '') + '><span class="tr"></span>บังคับเหตุผล</label></div>' +
    '<div class="field"><label class="f">ข้อความปุ่ม "ไม่ประสงค์"</label><input class="input" data-c="declineLabel" value="' + esc(c.declineLabel || '') + '"></div>' +
    '<div class="grid2"><div class="field"><label class="f">หน่วยงาน (สำหรับแบบฟอร์มจัดซื้อ)</label><input class="input" data-c="exportUnit" value="' + esc(c.exportUnit || '') + '"></div><div class="field"><label class="f">ผู้ประสานงาน</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="coName" value="' + esc((c.coordinator || {}).name || '') + '" placeholder="ชื่อ-สกุล"><input class="input" id="coPhone" value="' + esc((c.coordinator || {}).phone || '') + '" placeholder="เบอร์โทร" style="max-width:150px"></div></div></div>') + '</div></div>';
}

/* =================================================================== รายชื่อบุคลากร */
var RS = null;
ROUTES['admin/roster'] = function () {
  if (!needSuper()) return;
  document.title = 'รายชื่อบุคลากร · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  RS = RS || { q: '', status: 'ACTIVE', flag: '', div: '', page: 1, size: 50 };
  $('#page').innerHTML = skel(3);
  var draw = function (d) { if (S.route !== 'admin/roster') return; RS.d = d; RS.rows = d.rows.map(function (r) { var o = {}; d.cols.forEach(function (c, i) { o[c] = r[i]; }); return o; }); drawRoster(); };
  api('listRoster', {}, { fresh: true, onCache: draw }).then(draw).catch(errToast);
};
function rName(p) { return ((p.title || '') + (p.firstName || '') + ' ' + (p.lastName || '')).trim(); }
function selfPending(p) { var se = {}; try { se = JSON.parse(p.selfEdit || '{}') || {}; } catch (e) { } return Object.keys(se).filter(function (k) { return !se[k].done; }).map(function (k) { return Object.assign({ k: k }, se[k]); }); }
function drawRoster() {
  var all = RS.rows, c = { total: all.length, ACTIVE: 0, INACTIVE: 0, NEW_API: 0, NOT_IN_API: 0, MANUAL: 0, noPhone: 0, SELF: 0, WORK: 0, NOPW: 0 };
  all.forEach(function (p) { c[p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE']++; if (p.flag) c[p.flag] = (c[p.flag] || 0) + 1; if (p.status !== 'INACTIVE' && !p.phone) c.noPhone++; if (selfPending(p).length) c.SELF++; if (p.workDivision || p.workUnit) c.WORK++; if (p.status !== 'INACTIVE' && !p.pwStatus) c.NOPW++; });
  var h = pageHead('รายชื่อบุคลากร', 'ฐานรายชื่อสำหรับติดตาม · นำเข้าจาก HRMi · ซิงก์เบอร์/อีเมล/เพศ จาก SmartAPI ทุกคืน',
    '<button class="btn" id="rsTpl">' + ic('download') + 'เทมเพลต</button><button class="btn" id="rsExp">' + ic('download') + 'ส่งออก</button><button class="btn" id="rsWork">' + ic('building') + 'นำเข้าฝ่ายที่ปฏิบัติงาน</button><button class="btn" id="rsSync" data-busy="กำลังซิงก์กับ API…">' + ic('refresh') + 'ซิงก์ API</button><button class="btn" id="rsAdd">' + ic('plus') + 'เพิ่มบุคลากร</button><button class="btn primary" id="rsImp">' + ic('upload') + 'นำเข้า Excel</button>', 'จัดการ');
  h += '<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">' +
    [['ใช้งาน', c.ACTIVE, 'ok', 'ACTIVE', ''], ['ไม่ใช้งาน', c.INACTIVE, '', 'INACTIVE', ''], ['แก้ข้อมูลเอง · รอ HRMi', c.SELF, 'warn', '', 'SELF'], ['พบใหม่จาก API', c.NEW_API, 'info', '', 'NEW_API'], ['ไม่พบใน API', c.NOT_IN_API, 'warn', '', 'NOT_IN_API'], ['เพิ่มเอง', c.MANUAL, '', '', 'MANUAL'], ['ไม่มีเบอร์โทร', c.noPhone, '', 'ACTIVE', 'NOPHONE'], ['มีฝ่ายที่ปฏิบัติงาน', c.WORK, 'info', '', 'WORK'], ['ยังไม่ตั้งรหัสผ่าน', c.NOPW, '', 'ACTIVE', 'NOPW']].map(function (k) {
      return '<button class="kpi" data-kf="' + k[3] + '|' + k[4] + '" style="text-align:left;cursor:pointer;' + (RS.status === k[3] && RS.flag === k[4] ? 'outline:2px solid var(--accent)' : '') + '"><small>' + k[0] + '</small><b class="num" style="font-size:26px;color:' + (k[2] ? 'var(--' + k[2] + ')' : 'inherit') + '">' + nf(k[1]) + '</b></button>';
    }).join('') + '</div>';
  h += '<div class="card"><div class="bd" style="padding-bottom:8px"><div class="filters"><input class="input search" id="rsQ" placeholder="ค้นหา รหัส / ชื่อ / ตำแหน่ง / หน่วย / เบอร์" value="' + esc(RS.q) + '">' + sel('rsDiv', 'ทุกฝ่าย', uniq(all, 'division'), RS.div) + piiBtn() +
    '<select class="input" id="rsSt"><option value="">ทุกสถานะ</option><option value="ACTIVE" ' + (RS.status === 'ACTIVE' ? 'selected' : '') + '>ใช้งาน</option><option value="INACTIVE" ' + (RS.status === 'INACTIVE' ? 'selected' : '') + '>ไม่ใช้งาน</option></select>' +
    (RS.flag ? '<span class="chip info">' + esc(FLAG_TH[RS.flag] || { NOPHONE: 'ไม่มีเบอร์โทร', SELF: 'แก้ข้อมูลเอง · รอ HRMi', WORK: 'มีฝ่ายที่ปฏิบัติงาน', NOPW: 'ยังไม่ตั้งรหัสผ่าน' }[RS.flag]) + ' <button class="iconbtn" style="width:20px;height:20px" id="rsFlagX">' + ic('x') + '</button></span>' : '') + '</div>' +
    (RS.flag === 'SELF' ? '<div class="bulkbar">' + ic('info') + '<span>บุคลากรแก้ข้อมูลติดต่อเอง <b>' + nf(c.SELF) + '</b> คน — ส่งออก Excel ไปอัปเดตใน HRMi แล้วกด "อัปเดต HRMi แล้ว"</span><span class="spacer"></span><button class="btn sm" id="rsSelfExp">' + ic('download') + 'ส่งออกไปอัปเดต HRMi</button><button class="btn sm primary" id="rsSelfDone">' + ic('check') + 'ทำเครื่องหมาย "อัปเดต HRMi แล้ว" (' + nf(rsFiltered().length) + ')</button></div>' : '') +
    '</div><div id="rsTable"></div></div>';
  $('#page').innerHTML = h;
  S.piiRedraw = drawRosterTable;
  drawRosterTable();
  $('#rsQ').oninput = debounce(function () { RS.q = $('#rsQ').value.trim(); RS.page = 1; drawRosterTable(); }, 200);
  $('#rsDiv').onchange = function () { RS.div = this.value; RS.page = 1; drawRosterTable(); };
  $('#rsSt').onchange = function () { RS.status = this.value; RS.page = 1; drawRoster(); };
  var fx = $('#rsFlagX'); if (fx) fx.onclick = function () { RS.flag = ''; drawRoster(); };
  $$('[data-kf]').forEach(function (b) { b.onclick = function () { var p = b.dataset.kf.split('|'); RS.status = p[0]; RS.flag = p[1]; RS.page = 1; drawRoster(); }; });
  $('#rsTpl').onclick = rosterTemplate;
  $('#rsWork').onclick = importWorkFlow;
  var se1 = $('#rsSelfExp'); if (se1) se1.onclick = function () { exportSelfEdits(rsFiltered()); };
  var se2 = $('#rsSelfDone'); if (se2) se2.onclick = function () {
    var list = rsFiltered();
    confirmBox({ title: 'อัปเดต HRMi แล้ว ' + nf(list.length) + ' คน?', icon: 'check', ok: 'ยืนยัน', msg: 'ใช้หลังจากนำข้อมูลไปแก้ใน HRMi เรียบร้อย · ระบบยังใช้ค่าที่บุคลากรแก้ จนกว่า SmartAPI จะส่งค่าเดียวกันมา (ธงจะหายเองหลังซิงก์)' }).then(function (y) {
      if (!y) return;
      busy(se2, api('markHrmiDone', { codes: list.map(function (p) { return p.empCode; }) })).then(function (r) { toast('ทำเครื่องหมายแล้ว ' + nf(r.done) + ' คน', 'ok'); ROUTES['admin/roster'](); }).catch(errToast);
    });
  };
  $('#rsExp').onclick = function () {
    var rows = [['EmpCode', 'Title', 'FirstName', 'LastName', 'Gender', 'PositionName', 'DivisionName', 'WardName', 'HireName', 'LevelName', 'Phone', 'เบอร์ภายใน', 'Email', 'ฝ่ายที่ปฏิบัติงาน', 'หน่วยที่ปฏิบัติงาน', 'สถานะ', 'ที่มา', 'ธง', 'แก้ข้อมูลเอง (รอ HRMi)', 'รหัสผ่าน', 'ซิงก์ API ล่าสุด', 'เข้าระบบล่าสุด']];
    rsFiltered().forEach(function (p) { rows.push([p.empCode, p.title, p.firstName, p.lastName, p.gender, p.position, p.division, p.unit, p.empGroup, p.level, p.phone, p.extPhone, p.email, p.workDivision, p.workUnit, p.status === 'INACTIVE' ? 'ไม่ใช้งาน' : 'ใช้งาน', p.source, FLAG_TH[p.flag] || '', selfPending(p).map(function (x) { return CT_TH[x.k]; }).join(', '), { SET: 'ตั้งแล้ว', TEMP: 'รหัสชั่วคราว' }[p.pwStatus] || 'ยังไม่ตั้ง', p.apiSyncedAt, p.lastLoginAt]); });
    exportXlsx('รายชื่อบุคลากร_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'รายชื่อ', rows: rows }]).catch(errToast);
  };
  $('#rsSync').onclick = function () {
    var b = this;
    confirmBox({ title: 'ซิงก์กับ SmartAPI ทั้งหมด?', icon: 'refresh', ok: 'เริ่มซิงก์', msg: 'ดึงเบอร์โทร อีเมล เพศ ของบุคลากรที่ใช้งาน ' + nf(c.ACTIVE) + ' คน (ประมาณ 1–2 นาที) · ระบบทำอัตโนมัติทุกคืน 01:00 อยู่แล้ว' }).then(function (y) {
      if (!y) return;
      busy(b, api('syncApiNow', {})).then(function (r) { toast('ตรวจ ' + nf(r.checked) + ' · พบ ' + nf(r.found) + ' · ไม่พบ ' + nf(r.missing), 'ok', 'ซิงก์เสร็จ'); ROUTES['admin/roster'](); }).catch(errToast);
    });
  };
  $('#rsAdd').onclick = function () { personModal(null); };
  $('#rsImp').onclick = importRosterFlow;
}
function rsFiltered() {
  var q = RS.q.toLowerCase();
  return RS.rows.filter(function (p) {
    if (RS.status && (p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') !== RS.status) return false;
    if (RS.flag === 'NOPHONE') { if (p.phone) return false; } else if (RS.flag === 'SELF') { if (!selfPending(p).length) return false; } else if (RS.flag === 'WORK') { if (!p.workDivision && !p.workUnit) return false; } else if (RS.flag === 'NOPW') { if (p.pwStatus) return false; } else if (RS.flag && p.flag !== RS.flag) return false;
    if (RS.div && p.division !== RS.div) return false;
    if (q && (p.empCode + ' ' + rName(p) + ' ' + p.position + ' ' + p.unit + ' ' + p.phone).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function drawRosterTable() {
  var list = rsFiltered(), pages = Math.max(1, Math.ceil(list.length / RS.size)); if (RS.page > pages) RS.page = pages;
  var slice = list.slice((RS.page - 1) * RS.size, RS.page * RS.size);
  $('#rsTable').innerHTML = '<div class="tablewrap resp"><table class="t"><thead><tr><th>รหัส / ชื่อ</th><th>ตำแหน่ง</th><th>หน่วย / ฝ่าย</th><th>ติดต่อ</th><th>สถานะ</th></tr></thead><tbody>' +
    (slice.length ? slice.map(function (p) {
      return '<tr class="click" data-p="' + esc(p.empCode) + '"><td><div class="nm">' + esc(rName(p)) + '</div><div class="sub num">' + esc(p.empCode) + ' · ' + (p.gender === 'M' ? 'ชาย' : p.gender === 'F' ? 'หญิง' : '-') + '</div></td><td>' + esc(p.position) + '<div class="sub">' + esc(p.empGroup) + '</div></td>' +
        '<td>' + esc(p.workUnit || p.unit || '-') + '<div class="sub">' + esc(String(p.workDivision || p.division).replace(/^รพ\.สมเด็จฯ - /, '')) + (p.workDivision ? ' <span class="chip info" title="ฝ่ายที่ปฏิบัติงาน (HRMi: ' + esc(p.division) + ')">ปฏิบัติงาน</span>' : '') + '</div></td><td class="num">' + (p.phone ? pii(p.phone) : '-') + (p.extPhone ? ' <span class="sub">ต่อ ' + esc(p.extPhone) + '</span>' : '') + '<div class="sub">' + pii(p.email, 'email') + '</div>' + (selfPending(p).length ? '<span class="chip warn" title="บุคลากรแก้เอง รอ HR อัปเดตใน HRMi">แก้เอง: ' + esc(selfPending(p).map(function (x) { return CT_TH[x.k]; }).join(', ')) + '</span>' : '') + '</td>' +
        '<td>' + (p.status === 'INACTIVE' ? '<span class="chip">ไม่ใช้งาน</span>' : '<span class="chip ok">ใช้งาน</span>') + (p.flag ? ' <span class="chip ' + (p.flag === 'NOT_IN_API' ? 'warn' : 'info') + '">' + esc(FLAG_TH[p.flag] || p.flag) + '</span>' : '') + '<div class="sub">' + esc(p.source) + (p.lastLoginAt ? ' · เข้าระบบแล้ว' : '') + ' · ' + ({ SET: 'มีรหัสผ่าน', TEMP: 'รหัสชั่วคราว' }[p.pwStatus] || 'ยังไม่ตั้งรหัส') + '</div></td></tr>';
    }).join('') : '<tr><td colspan="5"><div class="empty">' + ic('users') + '<p>' + (RS.rows.length ? 'ไม่พบรายชื่อตามเงื่อนไข' : 'ยังไม่มีรายชื่อ — กด "นำเข้า Excel" เพื่อนำเข้าไฟล์จาก HRMi') + '</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + slice.map(function (p) { return '<div class="mi" data-p="' + esc(p.empCode) + '"><div class="avatar" style="width:36px;height:36px;font-size:14px">' + esc(initials(p.firstName)) + '</div><div class="x"><b>' + esc(rName(p)) + '</b><small>' + esc(p.empCode + ' · ' + p.position) + '</small><small>' + esc(p.unit || p.division) + '</small></div>' + (p.flag ? '<span class="chip info">' + esc(FLAG_TH[p.flag]) + '</span>' : '') + '</div>'; }).join('') + '</div></div>' +
    '<div class="pager"><span>' + nf(list.length) + ' คน</span><div class="row"><button class="btn sm" id="rpPrev" ' + (RS.page <= 1 ? 'disabled' : '') + '>' + ic('arrowl') + '</button><span class="num">หน้า ' + RS.page + '/' + pages + '</span><button class="btn sm" id="rpNext" ' + (RS.page >= pages ? 'disabled' : '') + '>' + ic('arrowr') + '</button></div></div>';
  $('#rpPrev').onclick = function () { RS.page--; drawRosterTable(); };
  $('#rpNext').onclick = function () { RS.page++; drawRosterTable(); };
  $$('[data-p]', $('#rsTable')).forEach(function (tr) { tr.onclick = function () { personModal(RS.rows.filter(function (p) { return p.empCode === tr.dataset.p; })[0]); }; });
}
function personModal(p) {
  var isNew = !p; p = p || { status: 'ACTIVE' };
  var f = function (k, label, extra) { return '<div class="field"><label class="f">' + label + '</label><input class="input" data-pf="' + k + '" value="' + esc(p[k] || '') + '" ' + (extra || '') + '></div>'; };
  var body = (isNew ? '<div class="row" style="align-items:flex-end;margin-bottom:6px"><div class="field" style="flex:1;margin:0"><label class="f">รหัสพนักงาน *</label><input class="input" data-pf="empCode" inputmode="numeric"></div><button class="btn" id="pfLook" data-busy="กำลังค้น…">' + ic('search') + 'ดึงข้อมูลจาก API</button></div><div class="hint small muted" style="margin-bottom:12px">สำหรับพนักงานใหม่ที่ยังไม่อยู่ในไฟล์ HRMi · ถ้า API ไม่พบ กรอกเองได้ (บุคคลนั้นจะเข้าระบบเองไม่ได้จนกว่า HR บันทึกในระบบหลัก — ให้ HR บันทึกแทน)</div>'
    : '<div class="row" style="margin-bottom:12px"><div class="avatar">' + esc(initials(p.firstName)) + '</div><div><b>' + esc(rName(p)) + '</b><div class="small muted">' + esc(p.empCode) + ' · ที่มา ' + esc(p.source) + (p.apiSyncedAt ? ' · ซิงก์ ' + esc(thShort(p.apiSyncedAt)) : '') + '</div></div></div>' +
      (p.flag ? '<div class="announce" style="margin-bottom:12px">' + ic('info') + '<div>ธง: <b>' + esc(FLAG_TH[p.flag]) + '</b> ' + (p.flag === 'NOT_IN_API' ? '— อาจพ้นสภาพแล้ว ตรวจสอบก่อนเปลี่ยนสถานะเป็น "ไม่ใช้งาน"' : '') + ' <label class="switch" style="margin-left:8px"><input type="checkbox" id="pfClear"><span class="tr"></span>ตรวจแล้ว (ลบธง)</label></div></div>' : '')) +
    '<div class="grid3">' + f('title', 'คำนำหน้า') + f('firstName', 'ชื่อ *') + f('lastName', 'นามสกุล') + '</div>' +
    '<div class="grid2">' + f('position', 'ตำแหน่ง') + f('empGroup', 'กลุ่มบุคลากร') + f('division', 'ฝ่ายต้นสังกัด HRMi (ชื่อเต็ม)', 'list="dlDiv"') + f('unit', 'หน่วย (HRMi)', 'list="dlUnit"') +
      f('workDivision', 'ฝ่ายที่ปฏิบัติงานจริง (ว่าง = ตาม HRMi)', 'list="dlDiv"') + f('workUnit', 'หน่วยที่ปฏิบัติงานจริง', 'list="dlUnit"') + f('phone', 'มือถือ') + f('extPhone', 'เบอร์ภายใน') + f('email', 'อีเมล') + '</div>' +
    (!isNew && selfPending(p).length ? '<div class="announce">' + ic('info') + '<div><b>บุคลากรแก้ข้อมูลเอง (รออัปเดต HRMi)</b><br>' + selfPending(p).map(function (x) { return esc(CT_TH[x.k] + ': ' + (x.from || '-') + ' → ' + (x.to || '-') + ' (' + thShort(x.at) + ')'); }).join('<br>') + '</div></div>' : '') +
    (!isNew ? '<div class="row" style="margin:4px 0 12px;gap:8px"><span class="chip ' + (p.pwStatus === 'SET' ? 'ok' : p.pwStatus === 'TEMP' ? 'warn' : '') + '">' + ic('key') + ' ' + ({ SET: 'ตั้งรหัสผ่านแล้ว', TEMP: 'ใช้รหัสชั่วคราวจาก HR' }[p.pwStatus] || 'ยังไม่ได้ตั้งรหัสผ่าน (เข้าด้วยเลขบัตร)') + '</span>' + (p.pwStatus ? '<button type="button" class="btn sm" id="pfReset">' + ic('refresh') + 'รีเซ็ตรหัสผ่าน</button>' : '') + '</div>' : '') +
    '<div class="grid2"><div class="field"><label class="f">เพศ (ค่าเริ่มต้นแบบเสื้อ)</label><select class="input" data-pf="gender"><option value="">-</option><option value="M" ' + (p.gender === 'M' ? 'selected' : '') + '>ชาย</option><option value="F" ' + (p.gender === 'F' ? 'selected' : '') + '>หญิง</option></select></div>' +
    '<div class="field"><label class="f">สถานะ</label><select class="input" data-pf="status"><option value="ACTIVE">ใช้งาน (นับในเป้าหมาย)</option><option value="INACTIVE" ' + (p.status === 'INACTIVE' ? 'selected' : '') + '>ไม่ใช้งาน (ไม่นับ)</option></select></div></div>' +
    '<datalist id="dlDiv">' + uniq(RS.rows, 'division').map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist><datalist id="dlUnit">' + uniq(RS.rows, 'unit').map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist>';
  var m = modal({ title: isNew ? 'เพิ่มบุคลากร' : 'แก้ไขข้อมูลบุคลากร', size: 'lg', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="pfSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
  var lk = $('#pfLook');
  if (lk) lk.onclick = function () {
    var code = $('[data-pf=empCode]').value.trim(); if (!code) return toast('กรอกรหัสพนักงานก่อน', 'warn');
    busy(lk, api('lookupPerson', { empCode: code })).then(function (r) {
      if (r.inRoster) return toast('รหัสนี้มีในรายชื่อแล้ว: ' + rName(r.inRoster), 'warn');
      if (!r.api) return toast('ไม่พบใน API — กรอกข้อมูลเองได้', 'warn');
      Object.keys(r.api).forEach(function (k) { var i = $('[data-pf=' + k + ']', m.el); if (i && r.api[k]) i.value = r.api[k]; });
      toast('ดึงข้อมูลจาก API แล้ว', 'ok');
    }).catch(errToast);
  };
  var pr = $('#pfReset'); if (pr) pr.onclick = function () { resetPwFlow(p.empCode, rName(p)); };
  $('#pfSave').onclick = function () {
    var o = { empCode: isNew ? $('[data-pf=empCode]').value.trim() : p.empCode };
    $$('[data-pf]', m.el).forEach(function (i) { if (i.dataset.pf !== 'empCode') o[i.dataset.pf] = i.value.trim(); });
    if ($('#pfClear') && $('#pfClear').checked) o.flag = '';
    busy(this, api('savePerson', { person: o, isNew: isNew })).then(function () { m.close(); toast((isNew ? 'เพิ่ม ' : 'บันทึก ') + (o.firstName || o.empCode) + ' แล้ว', 'ok'); ROUTES['admin/roster'](); }).catch(errToast);
  };
}
var CT_TH = { phone: 'มือถือ', extPhone: 'เบอร์ภายใน', email: 'อีเมล' };
function exportSelfEdits(list) {
  var rows = [['EmpCode', 'ชื่อ-สกุล', 'ฝ่าย (HRMi)', 'หน่วย (HRMi)', 'ข้อมูล', 'ค่าเดิม', 'ค่าใหม่ (บุคลากรแก้)', 'แก้เมื่อ', 'สถานะ']];
  list.forEach(function (p) { selfPending(p).forEach(function (x) { rows.push([p.empCode, rName(p), p.division, p.unit, CT_TH[x.k], x.from, x.to, thDate(x.at), 'รออัปเดต HRMi']); }); });
  exportXlsx('ข้อมูลติดต่อที่บุคลากรแก้_อัปเดตHRMi_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'รออัปเดต HRMi', rows: rows, widths: [10, 30, 30, 24, 12, 26, 26, 18, 16] }]).catch(errToast);
}
function importWorkFlow() {
  var go = function (file) {
    return readSheetFile(file).then(function (raw) {
      var rows = raw.map(function (r) { return { empCode: pickCol(r, ['EmpCode', 'รหัสพนักงาน', 'รหัสประจำตัว']).replace(/\D/g, ''), workDivision: pickCol(r, ['ฝ่ายที่ปฏิบัติงาน', 'WorkDivision']), workUnit: pickCol(r, ['หน่วยที่ปฏิบัติงาน', 'WorkUnit']) }; }).filter(function (r) { return r.empCode; });
      if (!rows.length) return toast('ไม่พบคอลัมน์ EmpCode ในไฟล์', 'warn');
      confirmBox({ title: 'อัปเดตฝ่าย/หน่วยที่ปฏิบัติงาน ' + nf(rows.length) + ' คน?', icon: 'building', ok: 'นำเข้า', msg: 'หัวหน้าฝ่าย/หน่วยจะเห็นบุคลากรตามที่ปฏิบัติงานจริง · ช่องว่างทั้งคู่ = กลับไปใช้ตาม HRMi' }).then(function (y) {
        if (y) api('importWorkUnits', { rows: rows, fileName: file.name }).then(function (r) { toast('อัปเดต ' + nf(r.updated) + ' คน' + (r.missing ? ' · ไม่พบในรายชื่อ ' + nf(r.missing) : ''), 'ok', 'นำเข้าฝ่ายที่ปฏิบัติงานแล้ว'); ROUTES['admin/roster'](); }).catch(errToast);
      });
    });
  };
  var m = modal({ title: ic('building') + ' นำเข้าฝ่าย/หน่วยที่ปฏิบัติงานจริง', body: '<p class="muted" style="margin-top:0">ใช้เมื่อบุคลากรสังกัด HRMi ฝ่ายหนึ่ง แต่ปฏิบัติงานอีกฝ่ายหนึ่ง (เช่น HRMi = ฝ่ายการพยาบาล แต่ปฏิบัติงานที่ฝ่ายวิชาการ) → หัวหน้าฝ่ายที่ปฏิบัติงานจะเป็นผู้ติดตาม</p>' +
    '<p class="small muted">ไฟล์ Excel คอลัมน์: <b>EmpCode</b> · <b>ฝ่ายที่ปฏิบัติงาน</b> · <b>หน่วยที่ปฏิบัติงาน</b> (ชื่อฝ่ายแบบสั้นได้ ระบบเติมชื่อเต็มให้)</p>',
    foot: '<button class="btn" id="wkTpl">' + ic('download') + 'เทมเพลต</button><button class="btn primary" id="wkPick">' + ic('upload') + 'เลือกไฟล์</button>' });
  $('#wkTpl').onclick = function () { exportXlsx('เทมเพลตฝ่ายที่ปฏิบัติงาน.xlsx', [{ name: 'ฝ่ายที่ปฏิบัติงาน', rows: [['EmpCode', 'ชื่อ-สกุล', 'ฝ่ายที่ปฏิบัติงาน', 'หน่วยที่ปฏิบัติงาน'], ['5XXXXXX', 'ตัวอย่าง (ไว้อ่านตรวจ)', 'ฝ่ายวิชาการและวิจัย', '']] }]).catch(errToast); };
  $('#wkPick').onclick = function () { pickFile('.xlsx,.xls,.csv').then(function (f) { if (f) { m.close(); go(f).catch(errToast); } }); };
}
/** รีเซ็ตรหัสผ่าน → แสดงรหัสชั่วคราวครั้งเดียว */
function resetPwFlow(emp, name, after) {
  var m = modal({ title: ic('key') + ' รีเซ็ตรหัสผ่าน · ' + esc(name || emp), body: '<p style="margin-top:0">ระบบจะออก<b>รหัสผ่านชั่วคราว</b> (ใช้ได้ 72 ชั่วโมง) ให้ท่านแจ้งเจ้าตัวทางโทรศัพท์/LINE · เมื่อเจ้าตัวเข้าระบบด้วยรหัสนี้ ระบบจะให้ตั้งรหัสใหม่ทันที · รหัสเดิมและทุกเครื่องที่เคยเข้าจะใช้ไม่ได้</p>' +
    '<div class="announce">' + ic('shield') + '<div><b>ก่อนรีเซ็ต กรุณายืนยันตัวตนผู้ขอ</b> เช่น ถามชื่อ-สกุล ตำแหน่ง หน่วยงาน หรือโทรกลับเบอร์ในระบบ · ห้ามขอเลขบัตรประชาชนหรือรหัสผ่านเดิม</div></div>' +
    '<div class="field"><label class="f" for="rpWhy">หมายเหตุ (เช่น ช่องทางที่ติดต่อมา)</label><input class="input" id="rpWhy" maxlength="200" placeholder="เช่น โทรมาที่ 23400 ยืนยันตัวตนแล้ว"></div>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="rpGo" data-busy="กำลังออกรหัส…">' + ic('key') + 'ออกรหัสชั่วคราว</button>' });
  $('#rpGo').onclick = function () {
    busy(this, api('adminResetPassword', { empCode: emp, reason: $('#rpWhy').value.trim() })).then(function (r) {
      m.close();
      var msg = 'รหัสผ่านชั่วคราวของท่านคือ ' + r.temp + ' (ใช้ได้ถึง ' + thDate(r.expiresAt) + ') เข้า SOMDEJ HR Connect ด้วยรหัสพนักงาน + รหัสนี้ แล้วระบบจะให้ตั้งรหัสใหม่';
      modal({ title: ic('check') + ' ออกรหัสชั่วคราวแล้ว', body: '<div class="center"><div class="small muted">รหัสผ่านชั่วคราวของ ' + esc(name || emp) + '</div><div class="tempw num">' + esc(r.temp) + '</div><div class="small muted">ใช้ได้ถึง ' + esc(thDate(r.expiresAt)) + ' · ตัวพิมพ์เล็ก/ใหญ่ต้องตรง · แสดงครั้งเดียว</div></div>' +
        '<div class="field" style="margin-top:14px"><label class="f">ข้อความสำหรับส่งให้เจ้าตัว</label><textarea class="input" readonly style="min-height:84px">' + esc(msg) + '</textarea></div>',
        foot: '<button class="btn" id="tpCopy">' + ic('copy') + 'คัดลอกข้อความ</button><button class="btn primary" data-x>เสร็จแล้ว</button>', sticky: true });
      $('#tpCopy').onclick = function () { copyText(msg, 'ข้อความ'); };
      if (after) after();
    }).catch(errToast);
  };
}

/* =================================================================== ช่วยเหลือบุคลากร (รหัสผ่าน) */
ROUTES['admin/helpdesk'] = function () {
  if (!needAdmin()) return;
  document.title = 'ช่วยเหลือบุคลากร · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  var b = S.boot.brand || {};
  var h = pageHead('ช่วยเหลือบุคลากร', 'บุคลากรโทร/ทัก LINE มาแจ้งลืมรหัสผ่าน หรือเข้าระบบไม่ได้', '', 'ช่วยเหลือ');
  h += '<div class="dgrid"><div class="stack"><div class="card"><div class="hd"><h3>' + ic('search') + ' ค้นหาบุคลากร</h3></div><div class="bd"><form id="hdForm" class="row" style="flex-wrap:nowrap"><input class="input" id="hdCode" inputmode="numeric" placeholder="รหัสพนักงาน" style="flex:1"><button class="btn primary" id="hdGo" data-busy="กำลังค้น…">' + ic('search') + 'ค้นหา</button></form><div id="hdRes" style="margin-top:14px"></div></div></div></div>' +
    '<div class="stack"><div class="card pad small"><h3 style="font-size:16px;margin-bottom:8px">' + ic('info') + ' ขั้นตอนช่วยเหลือ</h3><ol class="helpsteps">' +
    ['<b>มีอีเมลในระบบ</b> → แนะนำให้กด "ลืมรหัสผ่าน" ที่หน้าเข้าสู่ระบบ ระบบส่งรหัสยืนยันทางอีเมลเอง (ไม่ต้องรีเซ็ตให้)', '<b>ไม่มีอีเมล / ไม่ได้รับอีเมล</b> → ยืนยันตัวตนผู้ขอ แล้วกด "รีเซ็ตรหัสผ่าน" ได้รหัสชั่วคราว 72 ชม.', 'แจ้งรหัสชั่วคราวทางโทรศัพท์/LINE → เจ้าตัวเข้าระบบแล้วตั้งรหัสใหม่เอง', '<b>ยังไม่เคยตั้งรหัส</b> → ให้เลือกแท็บ "เข้าครั้งแรก (เลขบัตร)" · แนะนำให้เพิ่มอีเมลในหน้าแรกเพื่อกู้รหัสเองครั้งหน้า']
      .map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><div class="helptips"><b>' + ic('shield') + ' ข้อห้าม</b><ul><li>ห้ามขอเลขบัตรประชาชนหรือรหัสผ่านเดิมของบุคลากร</li><li>ผู้ดูแลกิจกรรมรีเซ็ตได้เฉพาะบุคลากรทั่วไป · ผู้ดูแล/หัวหน้า ให้ผู้ดูแลสูงสุดรีเซ็ต</li><li>ทุกการรีเซ็ตบันทึกประวัติ และส่งอีเมลแจ้งเจ้าตัว (ถ้ามีอีเมล)</li></ul></div>' +
    '<p class="muted" style="margin:12px 0 0">ช่องทางที่แจ้งบุคลากร: โทร <b>' + esc(helpContact(b).phone) + '</b> · LINE <b>' + esc(helpContact(b).lineId) + '</b></p></div></div></div>';
  $('#page').innerHTML = h;
  $('#hdCode').oninput = function () { digitsOnly(this, 10); };
  setTimeout(function () { $('#hdCode').focus(); }, 50);
  var look = function () {
    var code = $('#hdCode').value.trim(); if (!code) return;
    busy($('#hdGo'), api('helpdeskLookup', { empCode: code })).then(function (x) {
      $('#hdRes').innerHTML = '<div class="row" style="margin-bottom:10px"><div class="avatar">' + esc(initials(x.name)) + '</div><div><b>' + esc(x.name) + '</b><div class="small muted">' + esc(x.empCode + ' · ' + x.position) + '</div><div class="small muted">' + esc([x.unit, x.division].filter(Boolean).join(' · ')) + '</div></div></div>' +
        '<dl class="kv"><dt>สถานะ</dt><dd>' + (x.status === 'INACTIVE' ? '<span class="chip">ไม่ใช้งาน</span>' : '<span class="chip ok">ใช้งาน</span>') + (x.flag ? ' <span class="chip warn">' + esc(FLAG_TH[x.flag] || x.flag) + '</span>' : '') + '</dd>' +
        '<dt>รหัสผ่าน</dt><dd>' + ({ SET: '<span class="chip ok">ตั้งแล้ว</span> ' + esc(thDate(x.pwSetAt)), TEMP: '<span class="chip warn">รหัสชั่วคราว</span> หมดอายุ ' + esc(thDate(x.tempExpiresAt)) }[x.pw] || '<span class="chip">ยังไม่ตั้ง — เข้าด้วยเลขบัตร (แท็บ "เข้าครั้งแรก")</span>') + '</dd>' +
        '<dt>อีเมล</dt><dd>' + (x.email ? pii(x.email, 'email') + (x.emailVerified ? ' <span class="chip ok">ยืนยันแล้ว</span>' : '') + '<div class="small muted">กู้รหัสเองได้ทาง "ลืมรหัสผ่าน"</div>' : '<span class="chip warn">ไม่มีอีเมล</span>') + '</dd>' +
        '<dt>มือถือ</dt><dd class="num">' + (x.phone ? pii(x.phone) : '-') + (x.extPhone ? ' · ต่อ ' + esc(x.extPhone) : '') + '</dd><dt>เข้าระบบล่าสุด</dt><dd>' + esc(x.lastLoginAt ? thDate(x.lastLoginAt) : 'ยังไม่เคย') + '</dd></dl>' +
        '<div class="row" style="margin-top:12px">' + (x.canReset ? '<button class="btn primary" id="hdReset">' + ic('key') + 'รีเซ็ตรหัสผ่าน (ออกรหัสชั่วคราว)</button>' : '<span class="chip warn">' + ic('shield') + ' บัญชีผู้ดูแล/หัวหน้า — ให้ผู้ดูแลสูงสุดรีเซ็ต</span>') + '</div>';
      var r = $('#hdReset'); if (r) r.onclick = function () { resetPwFlow(x.empCode, x.name, look); };
    }).catch(function (e) { $('#hdRes').innerHTML = '<div class="empty">' + ic('search') + '<p>' + esc(e.message) + '</p></div>'; });
  };
  $('#hdForm').onsubmit = function (e) { e.preventDefault(); look(); };
};

var TITLES = ['แพทย์หญิง', 'นายแพทย์', 'ทันตแพทย์หญิง', 'ทันตแพทย์', 'เภสัชกรหญิง', 'เภสัชกร', 'นางสาว', 'นาง', 'นาย', 'ว่าที่ร้อยตรีหญิง', 'ว่าที่ร้อยตรี', 'ว่าที่ ร.ต.', 'ดร.', 'พว.', 'นพ.', 'พญ.', 'ทพ.', 'ทพญ.', 'ภก.', 'ภญ.', 'น.ส.'];
function pickCol(row, names) { for (var i = 0; i < names.length; i++) { if (row.hasOwnProperty(names[i]) && String(row[names[i]]).trim() !== '') return String(row[names[i]]).trim(); } return ''; }
function mapImportRow(r) {
  var code = pickCol(r, ['EmpCode', 'รหัสพนักงาน', 'รหัส', 'empCode']).replace(/\D/g, '');
  var title = pickCol(r, ['Title', 'คำนำหน้า']), fn = pickCol(r, ['FirstName', 'ชื่อ']), ln = pickCol(r, ['LastName', 'นามสกุล']);
  var full = pickCol(r, ['FullName', 'ชื่อ-สกุล', 'ชื่อ-นามสกุล', 'ชื่อสกุล']);
  if (full && !fn) {
    var s = full.replace(/\s+/g, ' ').trim();
    if (title && s.indexOf(title) === 0) s = s.slice(title.length).trim();   // ไฟล์ HRMi: FullName มีคำนำหน้าซ้ำกับคอลัมน์ Title (เช่น พว. / แพทย์หญิง / รศ.นพ.)
    else for (var i = 0; i < TITLES.length; i++) { if (s.indexOf(TITLES[i]) === 0) { title = TITLES[i]; s = s.slice(TITLES[i].length).trim(); break; } }
    var parts = s.split(' '); fn = parts.shift() || ''; ln = parts.join(' ');
  }
  var st = pickCol(r, ['WorkingStatus', 'สถานะ', 'status']);
  var g = pickCol(r, ['Gender', 'เพศ']);
  if (!g) g = /^(นาย|ว่าที่ร้อยตรี$|นพ\.|ทพ\.|ภก\.)/.test(title) ? 'M' : /^(นาง|น\.ส\.|ว่าที่ร้อยตรีหญิง|พญ\.|ทพญ\.|ภญ\.)/.test(title) ? 'F' : '';
  return { empCode: code, title: title, firstName: fn, lastName: ln, gender: g,
    position: pickCol(r, ['PositionName', 'ตำแหน่ง']), division: pickCol(r, ['DivisionName', 'SourceDivisionName', 'ฝ่าย']),
    unit: pickCol(r, ['WardName', 'emOrgUnitName', 'OrgUnitName', 'หน่วย', 'หน่วยงาน']), empGroup: pickCol(r, ['HireName', 'GroupName', 'Benefits', 'กลุ่ม', 'ประเภทบุคลากร']),
    level: pickCol(r, ['LevelName', 'ระดับ']), phone: pickCol(r, ['Phone', 'เบอร์โทร', 'โทรศัพท์']), email: pickCol(r, ['Email', 'อีเมล']),
    status: /ลาออก|พ้น|เกษียณ|เสียชีวิต|เลิกจ้าง|ไม่ใช้งาน|INACTIVE|ออก/.test(st) ? 'INACTIVE' : 'ACTIVE' };
}
function importRosterFlow() {
  pickFile('.xls,.xlsx,.csv').then(function (file) {
    if (!file) return;
    toast('กำลังอ่านไฟล์ ' + file.name + '…', 'info');
    return readSheetFile(file).then(function (raw) {
      // ไม่อ่าน/ไม่ส่งคอลัมน์ IdentityCard, PassportNo, BookNo ฯลฯ — เลือกเฉพาะคอลัมน์ที่ใช้
      var rows = raw.map(mapImportRow), valid = rows.filter(function (r) { return /^\d{4,10}$/.test(r.empCode); });
      var seen = {}, dup = 0; valid = valid.filter(function (r) { if (seen[r.empCode]) { dup++; return false; } seen[r.empCode] = 1; return true; });
      var ina = valid.filter(function (r) { return r.status === 'INACTIVE'; }).length;
      var existing = {}; (RS.rows || []).forEach(function (p) { existing[p.empCode] = 1; });
      var nNew = valid.filter(function (r) { return !existing[r.empCode]; }).length;
      var divs = uniq(valid, 'division');
      var body = '<div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">' + [['ในไฟล์', raw.length], ['นำเข้าได้', valid.length], ['ใหม่', nNew], ['ปรับปรุง', valid.length - nNew]].map(function (k) { return '<div class="kpi"><small>' + k[0] + '</small><b class="num" style="font-size:24px">' + nf(k[1]) + '</b></div>'; }).join('') + '</div>' +
        (raw.length - valid.length - dup > 0 ? '<div class="announce">' + ic('alert') + '<div>ข้าม ' + (raw.length - valid.length - dup) + ' แถวที่ไม่มีรหัสพนักงาน</div></div>' : '') + (dup ? '<div class="announce">' + ic('alert') + '<div>รหัสซ้ำในไฟล์ ' + dup + ' แถว (ใช้แถวแรก)</div></div>' : '') +
        '<div class="small muted" style="margin-bottom:6px">' + divs.length + ' ฝ่าย · สถานะไม่ใช้งาน ' + ina + ' คน · ตัวอย่าง 5 แถวแรก</div><div class="tablewrap"><table class="t"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>ตำแหน่ง</th><th>หน่วย</th><th>ฝ่าย</th><th>กลุ่ม</th></tr></thead><tbody>' +
        valid.slice(0, 5).map(function (r) { return '<tr><td class="num">' + esc(r.empCode) + '</td><td>' + esc(r.title + r.firstName + ' ' + r.lastName) + '</td><td>' + esc(r.position) + '</td><td>' + esc(r.unit) + '</td><td class="small">' + esc(r.division) + '</td><td class="small">' + esc(r.empGroup) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="stack" style="margin-top:14px"><label class="switch"><input type="checkbox" id="imDeact"><span class="tr"></span>ตั้ง "ไม่ใช้งาน" ให้คนที่มาจาก HRMi เดิมแต่ไม่อยู่ในไฟล์นี้ (ใช้เมื่อไฟล์เป็นรายชื่อครบทั้ง รพ.)</label>' +
        '<label class="switch"><input type="checkbox" id="imSync" checked><span class="tr"></span>หลังนำเข้า ดึงเบอร์โทร/อีเมล/เพศ จาก SmartAPI ทันที (1–2 นาที)</label></div>' +
        '<div class="small muted" style="margin-top:10px">' + ic('shield') + ' ระบบอ่านเฉพาะคอลัมน์ที่ใช้งาน — <b>ไม่อ่านและไม่ส่งเลขบัตรประชาชน</b> หรือข้อมูลอื่นในไฟล์</div>';
      var m = modal({ title: 'นำเข้ารายชื่อ · ' + esc(file.name), size: 'lg', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="imGo" data-busy="กำลังนำเข้า…" ' + (valid.length ? '' : 'disabled') + '>' + ic('upload') + 'นำเข้า ' + nf(valid.length) + ' คน</button>' });
      $('#imGo').onclick = function () {
        var deact = $('#imDeact').checked, sync = $('#imSync').checked, b = this;
        var run = function () {
          return busy(b, api('importRoster', { rows: valid, deactivateMissing: deact, fileName: file.name })).then(function (r) {
            toast('เพิ่ม ' + nf(r.added) + ' · ปรับปรุง ' + nf(r.updated) + (r.deactivated ? ' · ปิดใช้งาน ' + nf(r.deactivated) : ''), 'ok', 'นำเข้าเรียบร้อย');
            m.close();
            if (sync) { toast('กำลังดึงเบอร์โทร/อีเมลจาก SmartAPI… (ทำงานต่อได้)', 'info'); api('syncApiNow', {}).then(function (s) { toast('ซิงก์ ' + nf(s.found) + ' คน · ไม่พบใน API ' + nf(s.missing), 'ok', 'ซิงก์ API เสร็จ'); if (S.route === 'admin/roster') ROUTES['admin/roster'](); }).catch(errToast); }
            ROUTES['admin/roster']();
          });
        };
        (deact ? confirmBox({ title: 'ยืนยันปิดใช้งานคนที่ไม่อยู่ในไฟล์?', danger: true, ok: 'นำเข้าและปิดใช้งาน', msg: 'คนที่เคยนำเข้าจาก HRMi แต่ไม่อยู่ในไฟล์นี้จะไม่ถูกนับในการติดตาม (ข้อมูลการจองยังอยู่)' }) : Promise.resolve(true)).then(function (y) { if (y) run().catch(errToast); });
      };
    });
  }).catch(errToast);
}
function rosterTemplate() {
  exportXlsx('เทมเพลตนำเข้ารายชื่อ_SOMDEJ_HR_Connect.xlsx', [
    { name: 'รายชื่อ', rows: [['EmpCode', 'FullName', 'PositionName', 'DivisionName', 'WardName', 'HireName', 'LevelName', 'WorkingStatus', 'Gender', 'Phone', 'Email'],
      ['5600001', 'นาย ตัวอย่าง ข้อมูลสมมติ', 'เจ้าหน้าที่บริหารงานทั่วไป', 'รพ.สมเด็จฯ - ฝ่ายทรัพยากรบุคคล', 'งานบริหารงานบุคคล', 'เจ้าหน้าที่สภากาชาดไทย ประเภท ก', 'เจ้าหน้าที่ ระดับ 4', 'ทำงาน', 'M', '', '']] },
    { name: 'คำอธิบาย', rows: [['คอลัมน์', 'ความหมาย', 'จำเป็น'], ['EmpCode', 'รหัสพนักงาน (ตัวเลข)', 'ใช่'], ['FullName', 'คำนำหน้า ชื่อ นามสกุล (หรือใช้ Title / FirstName / LastName แยกคอลัมน์)', 'ใช่'],
      ['PositionName', 'ตำแหน่ง', ''], ['DivisionName', 'ฝ่าย (ชื่อเต็มตาม HRMi)', 'แนะนำ'], ['WardName', 'หน่วย/งาน', 'แนะนำ'], ['HireName', 'กลุ่มบุคลากร', ''], ['LevelName', 'ระดับ', ''],
      ['WorkingStatus', 'ทำงาน / ลาออก / พ้นสภาพ (ว่าง = ทำงาน)', ''], ['Gender', 'M / F (ว่าง = เดาจากคำนำหน้า และอัปเดตจาก API)', ''], ['Phone, Email', 'ว่างได้ — ระบบดึงจาก SmartAPI', ''],
      [], ['หมายเหตุ', 'ไฟล์ export จาก HRMi (emEmployee) นำเข้าได้ทันทีโดยไม่ต้องแก้ไข · ระบบไม่อ่านคอลัมน์ IdentityCard', '']] }
  ]).catch(errToast);
}

/* =================================================================== หัวหน้าฝ่าย/หน่วย */
ROUTES['admin/heads'] = function () {
  if (!needSuper()) return;
  document.title = 'หัวหน้าฝ่าย/หน่วย · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  $('#page').innerHTML = skel(2);
  api('listHeads', {}).then(drawHeads).catch(errToast);
};
function drawHeads(d) {
  var covered = {}; d.heads.forEach(function (h) { if (h.active && h.level === 'DIVISION') covered[h.scope] = 1; });
  var missing = d.divisions.filter(function (x) { return !covered[x.name]; });
  var h = pageHead('หัวหน้าฝ่าย/หน่วย', 'ผู้รับอีเมลสรุปและผู้ที่ดูรายงานเฉพาะสังกัดของตน (ดูอย่างเดียว) · นับตามฝ่าย/หน่วยที่ปฏิบัติงานจริง',
    '<button class="btn" id="hdTpl">' + ic('download') + 'ส่งออก / เทมเพลต</button><button class="btn" id="hdImp">' + ic('upload') + 'นำเข้า</button><button class="btn primary" id="hdAdd">' + ic('plus') + 'เพิ่มหัวหน้า</button>', 'จัดการ');
  if (missing.length) h += '<div class="announce">' + ic('alert') + '<div><b>' + missing.length + ' ฝ่ายยังไม่มีหัวหน้า</b>: ' + missing.slice(0, 12).map(function (x) { return esc(x.short); }).join(', ') + (missing.length > 12 ? ' …' : '') + '</div></div>';
  h += '<div class="card"><div class="tablewrap resp"><table class="t"><thead><tr><th>ชื่อ</th><th>ระดับ</th><th>ฝ่าย/หน่วยที่ดูแล</th><th class="r">บุคลากร</th><th>อีเมล</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
    (d.heads.length ? d.heads.map(function (x) {
      return '<tr><td><div class="nm">' + esc(x.name || '-') + '</div><div class="sub">' + esc(x.empCode || 'ไม่มีรหัส (รับอีเมลอย่างเดียว)') + (x.position ? ' · ' + esc(x.position) : '') + '</div></td><td><span class="chip ' + (x.level === 'UNIT' ? 'info' : 'acc') + '">' + (x.level === 'UNIT' ? 'หน่วย' : 'ฝ่าย') + '</span></td><td>' + esc(x.scopeShort) + '</td><td class="r num">' + nf(x.scopeCount) + '</td>' +
        '<td>' + (x.email ? esc(x.email) : '<span class="chip warn">ไม่มีอีเมล</span>') + '</td><td>' + (x.active ? '<span class="chip ok">ใช้งาน</span>' : '<span class="chip">ปิด</span>') + '</td><td class="r"><button class="iconbtn" data-he="' + esc(x.id) + '">' + ic('edit') + '</button><button class="iconbtn" data-hd="' + esc(x.id) + '">' + ic('trash') + '</button></td></tr>';
    }).join('') : '<tr><td colspan="7"><div class="empty">' + ic('building') + '<p>ยังไม่มีหัวหน้า · เพิ่มทีละคน หรือส่งออกเทมเพลตเพื่อกรอกแล้วนำเข้า</p></div></td></tr>') + '</tbody></table>' +
    '<div class="mlist">' + d.heads.map(function (x) { return '<div class="mi" data-he="' + esc(x.id) + '"><div class="x"><b>' + esc(x.name) + '</b><small>' + (x.level === 'UNIT' ? 'หน่วย ' : '') + esc(x.scopeShort) + '</small><small>' + esc(x.email || 'ไม่มีอีเมล') + '</small></div></div>'; }).join('') + '</div></div></div>';
  $('#page').innerHTML = h;
  $('#hdAdd').onclick = function () { headModal(null, d); };
  $$('[data-he]').forEach(function (b) { b.onclick = function () { headModal(d.heads.filter(function (x) { return x.id === b.dataset.he; })[0], d); }; });
  $$('[data-hd]').forEach(function (b) {
    b.onclick = function () { var x = d.heads.filter(function (y) { return y.id === b.dataset.hd; })[0]; confirmBox({ title: 'ลบ ' + (x.name || x.email) + '?', msg: 'ออกจากหัวหน้า ' + esc(x.scopeShort), danger: true, ok: 'ลบ' }).then(function (y) { if (y) api('deleteHead', { id: x.id }).then(function (r) { toast('ลบแล้ว', 'ok'); drawHeads(r); }).catch(errToast); }); };
  });
  $('#hdTpl').onclick = function () {
    var rows = [['รหัสพนักงาน', 'ชื่อ-สกุล', 'อีเมล', 'ระดับ (ฝ่าย/หน่วย)', 'ฝ่ายหรือหน่วยที่ดูแล', 'สถานะ (ใช้งาน/ปิด)']];
    d.heads.forEach(function (x) { rows.push([x.empCode, x.name, x.email, x.level === 'UNIT' ? 'หน่วย' : 'ฝ่าย', x.scopeShort, x.active ? 'ใช้งาน' : 'ปิด']); });
    missing.forEach(function (x) { rows.push(['', '', '', 'ฝ่าย', x.short, 'ใช้งาน']); });
    exportXlsx('หัวหน้าฝ่าย_หน่วย_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'หัวหน้า', rows: rows }, { name: 'รายชื่อฝ่าย', rows: [['ฝ่าย', 'จำนวนบุคลากร']].concat(d.divisions.map(function (x) { return [x.short, x.count]; })) }, { name: 'รายชื่อหน่วย', rows: [['หน่วย', 'จำนวนบุคลากร']].concat(d.units.map(function (x) { return [x.name, x.count]; })) }]).catch(errToast);
  };
  $('#hdImp').onclick = function () {
    pickFile('.xlsx,.xls,.csv').then(function (file) {
      if (!file) return;
      return readSheetFile(file).then(function (raw) {
        var rows = raw.map(function (r) { return { empCode: pickCol(r, ['รหัสพนักงาน', 'EmpCode']), name: pickCol(r, ['ชื่อ-สกุล', 'Name']), email: pickCol(r, ['อีเมล', 'Email']), level: /หน่วย|UNIT/i.test(pickCol(r, ['ระดับ (ฝ่าย/หน่วย)', 'ระดับ', 'Level'])) ? 'UNIT' : 'DIVISION', scope: pickCol(r, ['ฝ่ายหรือหน่วยที่ดูแล', 'Scope']), active: !/ปิด|false|0/i.test(pickCol(r, ['สถานะ (ใช้งาน/ปิด)', 'สถานะ', 'Active'])) }; })
          .filter(function (r) { return r.scope && (r.empCode || r.email); });
        if (!rows.length) return toast('ไม่พบแถวที่มีทั้ง "ฝ่ายหรือหน่วยที่ดูแล" และ "รหัสพนักงาน/อีเมล"', 'warn');
        var m = modal({ title: 'นำเข้าหัวหน้า ' + rows.length + ' รายการ', body: '<p class="muted">จากไฟล์ ' + esc(file.name) + '</p><label class="switch"><input type="checkbox" id="hdRep"><span class="tr"></span>แทนที่รายการเดิมทั้งหมด</label>',
          foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="hdGo" data-busy="กำลังนำเข้า…">นำเข้า</button>' });
        $('#hdGo').onclick = function () { busy(this, api('importHeads', { rows: rows, replace: $('#hdRep').checked, fileName: file.name })).then(function (r) { m.close(); toast('นำเข้าหัวหน้า ' + rows.length + ' รายการ', 'ok'); drawHeads(r); }).catch(errToast); };
      });
    }).catch(errToast);
  };
}
function headModal(x, d) {
  x = x || { level: 'DIVISION', active: true };
  var body = '<div class="grid2"><div class="field"><label class="f">รหัสพนักงาน</label><input class="input" id="hmCode" value="' + esc(x.empCode || '') + '" inputmode="numeric"><div class="hint">มีรหัส = เข้าระบบดูรายงานของสังกัดได้</div></div><div class="field"><label class="f">ชื่อ-สกุล</label><input class="input" id="hmName" value="' + esc(x.name || '') + '" placeholder="ว่าง = ดึงจากรายชื่อ"></div></div>' +
    '<div class="field"><label class="f">อีเมล (รับสรุป)</label><input class="input" id="hmEmail" type="email" value="' + esc(x.email || '') + '" placeholder="name@redcross.or.th"></div>' +
    '<div class="grid2"><div class="field"><label class="f">ระดับ</label><select class="input" id="hmLevel"><option value="DIVISION">ฝ่าย</option><option value="UNIT" ' + (x.level === 'UNIT' ? 'selected' : '') + '>หน่วย</option></select></div>' +
    '<div class="field"><label class="f">ฝ่าย/หน่วยที่ดูแล</label><input class="input" id="hmScope" list="dlScope" value="' + esc(x.scope || '') + '"></div></div>' +
    '<label class="switch"><input type="checkbox" id="hmAct" ' + (x.active ? 'checked' : '') + '><span class="tr"></span>ใช้งาน</label>' +
    '<datalist id="dlScope"></datalist>';
  var m = modal({ title: x.id ? 'แก้ไขหัวหน้า' : 'เพิ่มหัวหน้า', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="hmSave" data-busy="กำลังบันทึก…">บันทึก</button>' });
  var fill = function () { var lv = $('#hmLevel').value; $('#dlScope').innerHTML = (lv === 'UNIT' ? d.units.map(function (u) { return u.name; }) : d.divisions.map(function (v) { return v.name; })).map(function (v) { return '<option value="' + esc(v) + '">'; }).join(''); };
  fill(); $('#hmLevel').onchange = fill;
  $('#hmSave').onclick = function () {
    busy(this, api('saveHead', { head: { id: x.id, empCode: $('#hmCode').value, name: $('#hmName').value, email: $('#hmEmail').value, level: $('#hmLevel').value, scope: $('#hmScope').value, active: $('#hmAct').checked } }))
      .then(function (r) { m.close(); toast('บันทึกหัวหน้าแล้ว', 'ok'); drawHeads(r); }).catch(errToast);
  };
}

/* =================================================================== ตั้งค่า */
ROUTES['admin/settings'] = function (params) {
  if (!needSuper()) return;
  document.title = 'ตั้งค่า · SOMDEJ HR Connect';
  setAccent('#8E4B9D');
  var tab = params[0] || 'general';
  var tabs = [['general', 'ทั่วไป', 'settings'], ['admins', 'ผู้ดูแลระบบ', 'shield'], ['api', 'การเชื่อมต่อ', 'link'], ['audit', 'ประวัติการใช้งาน', 'history']];
  $('#page').innerHTML = pageHead('ตั้งค่าระบบ', 'SOMDEJ HR Connect v' + HRC_VERSION + ' · ' + HRC_BUILD, '', 'จัดการ') +
    '<div class="tabs">' + tabs.map(function (t) { return '<a href="#/admin/settings/' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + ic(t[2]) + t[1] + '</a>'; }).join('') + '</div><div id="stBody">' + skel(2) + '</div>';
  if (tab === 'admins') return settingsAdmins();
  if (tab === 'audit') return settingsAudit();
  api('getSettings', {}).then(function (d) { tab === 'api' ? settingsApi(d) : settingsGeneral(d); }).catch(errToast);
};
function sf(k, label, v, opt) { opt = opt || {}; return '<div class="field"><label class="f">' + label + '</label>' + (opt.area ? '<textarea class="input" data-st="' + k + '">' + esc(v) + '</textarea>' : '<input class="input" data-st="' + k + '" value="' + esc(v) + '">') + (opt.hint ? '<div class="hint">' + opt.hint + '</div>' : '') + '</div>'; }
function saveSettingsBtn(scope) {
  $('#stSave').onclick = function () {
    var o = {}; $$('[data-st]', scope).forEach(function (i) { o[i.dataset.st] = i.type === 'checkbox' ? (i.checked ? 'TRUE' : 'FALSE') : i.value; });
    busy(this, api('saveSettings', { settings: o })).then(function () { toast('บันทึกการตั้งค่าแล้ว', 'ok'); refreshBoot().then(shell).catch(function () { }); }).catch(errToast);
  };
}
function settingsGeneral(d) {
  var s = d.settings;
  $('#stBody').innerHTML = '<div class="dgrid"><div class="card"><div class="hd"><h3>องค์กรและการติดต่อ</h3><button class="btn primary sm" id="stSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button></div><div class="bd">' +
    sf('orgName', 'ชื่อโรงพยาบาล', s.orgName) + '<div class="grid2">' + sf('deptName', 'หน่วยงานผู้ดูแลระบบ', s.deptName) + sf('contactPhone', 'เบอร์ติดต่อ (แสดงในระบบ)', s.contactPhone) + '</div>' +
    sf('signature', 'ลายเซ็นท้ายอีเมล', s.signature, { area: true }) + '<div class="grid2">' + sf('mailSenderName', 'ชื่อผู้ส่งอีเมล', s.mailSenderName) + sf('mailReplyTo', 'Reply-To (ถ้ามี)', s.mailReplyTo) + '</div>' +
    sf('webUrl', 'ลิงก์หน้าเว็บ (ใช้ในอีเมล)', s.webUrl, { hint: 'เช่น https://hr-somdej.github.io/hr-connect/' }) + sf('divisionPrefix', 'คำนำหน้าชื่อฝ่ายที่ตัดตอนแสดงผล', s.divisionPrefix) + '</div></div>' +
    '<div class="stack"><div class="card"><div class="hd"><h3>ประกาศ / สถานะระบบ</h3></div><div class="bd">' + sf('announcement', 'ข้อความประกาศ (แสดงบนทุกหน้าและหน้าเข้าสู่ระบบ)', s.announcement, { area: true, hint: 'ว่าง = ไม่แสดง' }) +
    '<label class="switch"><input type="checkbox" data-st="maintenance" ' + (s.maintenance === 'TRUE' ? 'checked' : '') + '><span class="tr"></span>ปิดปรับปรุง (เฉพาะผู้ดูแลใช้งานได้)</label></div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('shield') + ' ความปลอดภัย / ช่องทางช่วยเหลือ</h3></div><div class="bd">' +
    '<label class="switch" style="margin-bottom:6px"><input type="checkbox" data-st="pwRequireAll" ' + (s.pwRequireAll === 'TRUE' ? 'checked' : '') + '><span class="tr"></span>บังคับบุคลากร<b>ทุกคน</b>ตั้งรหัสผ่าน</label>' +
    '<div class="hint" style="margin-bottom:14px">ปิด = บุคลากรทั่วไปเลือกตั้งเองได้ (ระบบชวนทุกวัน) · ผู้ดูแล/หัวหน้า บังคับเสมอ · แนะนำเปิดหลังกิจกรรมที่ทุกคนต้องตอบปิดรับแล้ว (เปิดแล้วคนที่ยังไม่ตั้งจะต้องตั้งในการเข้าครั้งถัดไป)</div>' +
    '<div class="grid2">' + sf('supportPhone', 'เบอร์ช่วยเหลือเรื่องรหัสผ่าน', s.supportPhone) + sf('lineId', 'LINE Official ID', s.lineId) + '</div>' + sf('lineUrl', 'ลิงก์ปุ่ม LINE', s.lineUrl, { hint: 'แสดงเป็นปุ่มสีเขียวในหน้าเข้าสู่ระบบและหน้าลืมรหัสผ่าน' }) + '</div></div>' +
    '<div class="card pad"><h3 style="font-size:16px">ลิงก์สำหรับประชาสัมพันธ์</h3><p class="small muted">แชร์ในกลุ่มไลน์ หรือพิมพ์ QR ติดประกาศ</p><div class="row"><input class="input" readonly value="' + esc(s.webUrl) + '" style="flex:1"><button class="btn" id="cpUrl">' + ic('copy') + '</button></div>' +
    '<div style="margin-top:12px;text-align:center"><img alt="QR" style="width:180px;height:180px;border-radius:12px;border:1px solid var(--line)" src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=' + encodeURIComponent(s.webUrl) + '"><div class="small muted">คลิกขวา › บันทึกรูปภาพ</div></div></div>' +
    '<div class="card pad small muted">โควตาอีเมลคงเหลือวันนี้: <b>' + (d.mailQuota == null ? '-' : nf(d.mailQuota)) + '</b> ฉบับ · หลังบ้าน build <b>' + esc(d.build) + '</b>' + (d.build !== HRC_API_BUILD ? ' <span class="chip warn">หน้าเว็บรุ่นนี้ใช้คู่กับหลังบ้าน ' + HRC_API_BUILD + ' — Deploy New version</span>' : ' <span class="chip ok">ตรงกับหน้าเว็บ</span>') + '</div></div></div>';
  saveSettingsBtn($('#stBody'));
  $('#cpUrl').onclick = function () { copyText(s.webUrl, 'ลิงก์'); };
}
function settingsApi(d) {
  var s = d.settings;
  $('#stBody').innerHTML = '<div class="dgrid"><div class="card"><div class="hd"><h3>SmartAPI (HR)</h3><button class="btn primary sm" id="stSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button></div><div class="bd">' +
    '<div class="announce" style="background:' + (d.apiConfigured ? 'var(--ok-soft);border-color:#bfe3cf;color:var(--ok)' : 'var(--danger-soft);border-color:#f3c2c4;color:var(--danger)') + '">' + ic(d.apiConfigured ? 'check' : 'alert') + '<div>' + (d.apiConfigured ? 'ตั้งค่าบัญชี SMARTAPI_USER / SMARTAPI_PASS ใน Script Properties แล้ว' : 'ยังไม่ได้ตั้งค่า SMARTAPI_USER / SMARTAPI_PASS ใน Script Properties') + '</div></div>' +
    sf('apiBase', 'URL หลัก', s.apiBase) + sf('apiEmpPath', 'Path ข้อมูลพนักงาน + ตรวจ Cid', s.apiEmpPath, { hint: 'ตอนนี้ยังเป็น /uat/ — เมื่อไอทีประกาศ production แก้ที่นี่ได้เลย' }) +
    '<label class="switch"><input type="checkbox" data-st="nightlySync" ' + (s.nightlySync !== 'FALSE' ? 'checked' : '') + '><span class="tr"></span>ซิงก์เบอร์/อีเมล/เพศ ทุกคืน 01:00</label>' +
    '<div class="row" style="margin-top:16px"><button class="btn" id="apiTest" data-busy="กำลังทดสอบ…">' + ic('link') + 'ทดสอบการเชื่อมต่อ</button><span id="apiRes" class="small"></span></div></div></div>' +
    '<div class="card pad small"><h3 style="font-size:16px;margin-bottom:8px">วิธีเข้าสู่ระบบของบุคลากร</h3><p class="muted">หน้าเว็บส่งรหัสพนักงาน + เลขบัตรประชาชน → หลังบ้าน (Apps Script) เรียก <code>emp-info</code> พร้อม <code>{"Empcode","Cid"}</code> → ผ่านเมื่อ <code>islogin = true</code> เท่านั้น</p>' +
    '<p class="muted">ระบบไม่บันทึกเลขบัตรประชาชน · ผิด 5 ครั้งพัก 10 นาที · จดจำ 7 วัน · ถ้า API ไม่ตอบ ผู้ใช้จะเห็นข้อความให้ลองใหม่/ติดต่อ HR</p></div></div>';
  saveSettingsBtn($('#stBody'));
  $('#apiTest').onclick = function () { busy(this, api('testApi', {})).then(function (r) { $('#apiRes').innerHTML = '<span class="chip ok">token ' + esc(r.token) + '</span> <span class="chip ok">' + esc(r.empInfo) + '</span>'; toast('เชื่อมต่อ SmartAPI สำเร็จ', 'ok'); }).catch(function (e) { $('#apiRes').innerHTML = '<span class="chip danger">' + esc(e.message) + '</span>'; errToast(e); }); };
}
function settingsAdmins() {
  api('listAdmins', {}).then(function drawA(d) {
    var h = '<div class="card"><div class="hd"><div><h3>ผู้ดูแลระบบ</h3><div class="small muted"><b>ผู้ดูแลสูงสุด</b> ทำได้ทุกอย่าง · <b>ผู้ดูแลกิจกรรม</b> จัดการได้เฉพาะกิจกรรมที่กำหนด (แดชบอร์ด ติดตาม บันทึกแทน อีเมล ตั้งค่ากิจกรรม นำเข้าผู้มีสิทธิ์ ช่วยรีเซ็ตรหัสผ่านบุคลากร) · ทุกคนต้องตั้งรหัสผ่านของตนเอง</div></div>' + (d.canManage ? '<button class="btn primary sm" id="adAdd">' + ic('plus') + 'เพิ่มผู้ดูแล</button>' : '') + '</div>' +
      '<div class="tablewrap"><table class="t"><thead><tr><th>ชื่อ</th><th>บทบาท</th><th>กิจกรรมที่ดูแล</th><th>อีเมล (รับสรุป)</th><th>เพิ่มโดย</th><th></th></tr></thead><tbody>' +
      d.admins.map(function (a) {
        var evT = (a.events || []).map(function (id) { var e = d.events.filter(function (x) { return x.id === id; })[0]; return e ? '<span class="chip" style="white-space:normal"><span class="edot" style="background:' + esc(e.color) + '"></span>' + esc(e.title) + '</span>' : ''; }).join(' ');
        return '<tr><td><div class="nm">' + esc(a.name || '-') + (a.empCode === d.me ? ' <span class="chip acc">คุณ</span>' : '') + '</div><div class="sub">' + esc(a.empCode) + (a.division ? ' · ' + esc(a.division) : '') + '</div></td><td><span class="chip ' + (a.role === 'SUPER' ? 'danger' : 'acc') + '">' + (a.role === 'SUPER' ? 'ผู้ดูแลสูงสุด' : 'ผู้ดูแลกิจกรรม') + '</span>' + (a.active ? '' : ' <span class="chip">ปิด</span>') +
          '<div class="sub">' + ({ SET: ic('key') + ' ตั้งรหัสผ่านแล้ว', TEMP: ic('key') + ' รหัสชั่วคราว' }[a.pw] || '<span style="color:var(--warn)">ยังไม่ตั้งรหัสผ่าน (จะถูกบังคับตั้งตอนเข้าครั้งแรก)</span>') + '</div></td>' +
          '<td>' + (a.role === 'SUPER' ? '<span class="small muted">ทุกกิจกรรม + ระบบ</span>' : '<div class="row" style="gap:4px">' + (evT || '<span class="chip warn">ยังไม่กำหนด</span>') + '</div>') + '</td>' +
          '<td>' + esc(a.email || '-') + '</td><td class="small muted">' + esc(a.addedBy || '') + (a.addedAt ? ' · ' + esc(thShort(a.addedAt)) : '') + '</td><td class="r">' + (d.canManage && !a.locked ? '<button class="iconbtn" data-ae="' + esc(a.empCode) + '">' + ic('edit') + '</button>' + (a.empCode !== d.me ? '<button class="iconbtn" data-ar="' + esc(a.empCode) + '">' + ic('trash') + '</button>' : '') : '') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    $('#stBody').innerHTML = h;
    var edit = function (a) {
      a = a || { role: 'ADMIN', active: true, events: [] };
      var m = modal({ title: a.empCode ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแล', size: 'md', body: '<div class="field"><label class="f">รหัสพนักงาน</label><input class="input" id="aeCode" value="' + esc(a.empCode || '') + '" ' + (a.empCode ? 'readonly' : '') + ' inputmode="numeric"></div>' +
        '<div class="grid2"><div class="field"><label class="f">บทบาท</label><select class="input" id="aeRole"><option value="ADMIN">ผู้ดูแลกิจกรรม</option><option value="SUPER" ' + (a.role === 'SUPER' ? 'selected' : '') + '>ผู้ดูแลสูงสุด</option></select></div><div class="field"><label class="f">อีเมล (รับสรุปภาพรวม)</label><input class="input" id="aeEmail" type="email" value="' + esc(a.email || '') + '"></div></div>' +
        '<div class="field" id="aeEvBox"><label class="f">กิจกรรมที่จัดการได้</label><div class="evchecks">' + d.events.map(function (e) { return '<label class="docopt' + ((a.events || []).indexOf(e.id) >= 0 ? ' on' : '') + '"><input type="checkbox" data-aev="' + esc(e.id) + '" ' + ((a.events || []).indexOf(e.id) >= 0 ? 'checked' : '') + '><span><b>' + esc(e.title) + '</b><small>' + esc(e.id) + ' · ' + esc({ OPEN: 'เปิดรับ', UPCOMING: 'ยังไม่เปิด', CLOSED: 'ปิดรับแล้ว', DRAFT: 'ฉบับร่าง' }[e.status] || e.status) + '</small></span></label>'; }).join('') + '</div></div>' +
        '<label class="switch"><input type="checkbox" id="aeAct" ' + (a.active !== false ? 'checked' : '') + '><span class="tr"></span>ใช้งาน</label>', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="aeSave" data-busy="กำลังบันทึก…">บันทึก</button>' });
      var tog = function () { $('#aeEvBox').style.display = $('#aeRole').value === 'SUPER' ? 'none' : ''; }; tog(); $('#aeRole').onchange = tog;
      $$('[data-aev]', m.el).forEach(function (c) { c.onchange = function () { c.closest('label').classList.toggle('on', c.checked); }; });
      $('#aeSave').onclick = function () { busy(this, api('saveAdmin', { empCode: $('#aeCode').value.trim(), role: $('#aeRole').value, email: $('#aeEmail').value.trim(), active: $('#aeAct').checked, events: $$('[data-aev]', m.el).filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.aev; }) })).then(function (r) { m.close(); toast('บันทึกผู้ดูแลแล้ว', 'ok'); drawA(r); }).catch(errToast); };
    };
    var add = $('#adAdd'); if (add) add.onclick = function () { edit(null); };
    $$('[data-ae]').forEach(function (b) { b.onclick = function () { edit(d.admins.filter(function (a) { return a.empCode === b.dataset.ae; })[0]); }; });
    $$('[data-ar]').forEach(function (b) { b.onclick = function () { confirmBox({ title: 'ถอดสิทธิ์ผู้ดูแล ' + b.dataset.ar + '?', danger: true, ok: 'ถอดสิทธิ์', msg: 'มีผลทันที' }).then(function (y) { if (y) api('removeAdmin', { empCode: b.dataset.ar }).then(function (r) { toast('ถอดสิทธิ์แล้ว', 'ok'); drawA(r); }).catch(errToast); }); }; });
  }).catch(errToast);
}
var AUDIT_TH = { PW_SET: 'ตั้งรหัสผ่าน', PW_CHANGE: 'เปลี่ยนรหัสผ่าน', PW_RESET_SELF: 'ตั้งรหัสใหม่ (ลืมรหัส/รหัสชั่วคราว)', PW_RESET_BY_ADMIN: 'HR รีเซ็ตรหัสผ่าน', PW_FORGOT_OTP: 'ขอรหัสยืนยันลืมรหัส', PW_FORGOT_NOEMAIL: 'ลืมรหัส (ไม่มีอีเมล)', LOGIN_TEMP: 'เข้าด้วยรหัสชั่วคราว',
  CONTACT_SELF_EDIT: 'บุคลากรแก้ข้อมูลติดต่อ', HRMI_DONE: 'อัปเดต HRMi แล้ว', WORKUNIT_IMPORT: 'นำเข้าฝ่ายที่ปฏิบัติงาน', ELIGIBILITY_IMPORT: 'นำเข้าผู้มีสิทธิ์', RESPONSE_BULK: 'ตั้งไม่ประสงค์หลายคน', IMAGE_UPLOAD: 'อัปโหลดรูป', ADMIN_MIGRATE: 'ย้ายสิทธิ์ผู้ดูแล',
  LOGIN: 'เข้าสู่ระบบ', RESPONSE_NEW: 'บันทึกใหม่', RESPONSE_EDIT: 'แก้ไขคำตอบ', RESPONSE_BY_ADMIN: 'HR บันทึกแทน', RESPONSE_RESET: 'ล้างคำตอบ', ROSTER_IMPORT: 'นำเข้ารายชื่อ', ROSTER_ADD: 'เพิ่มบุคลากร', ROSTER_EDIT: 'แก้ไขบุคลากร', ROSTER_NEW_FROM_API: 'พบใหม่จาก API', API_SYNC: 'ซิงก์ API', API_SYNC_FAIL: 'ซิงก์ API ล้มเหลว', EVENT_NEW: 'สร้างกิจกรรม', EVENT_EDIT: 'แก้ไขกิจกรรม', SETTINGS: 'ตั้งค่า', ADMIN_ADD: 'เพิ่มผู้ดูแล', ADMIN_EDIT: 'แก้ผู้ดูแล', ADMIN_REMOVE: 'ถอดผู้ดูแล', HEAD_ADD: 'เพิ่มหัวหน้า', HEAD_EDIT: 'แก้หัวหน้า', HEAD_REMOVE: 'ลบหัวหน้า', HEAD_IMPORT: 'นำเข้าหัวหน้า', MAIL_SEND: 'ส่งอีเมล', MAIL_TEST: 'ส่งอีเมลทดสอบ' };
function settingsAudit() {
  var load = function (q) {
    api('listAudit', { limit: 400, q: q || '' }).then(function (l) {
      $('#auList').innerHTML = l.length ? '<div class="tablewrap"><table class="t"><thead><tr><th>เวลา</th><th>ผู้ทำ</th><th>รายการ</th><th>เป้าหมาย</th><th>รายละเอียด</th></tr></thead><tbody>' + l.map(function (a) { return '<tr><td class="num small" style="white-space:nowrap">' + esc(thShort(a.ts)) + '</td><td class="num">' + esc(a.actor) + '</td><td><span class="chip">' + esc(AUDIT_TH[a.action] || a.action) + '</span></td><td class="small">' + esc(a.target) + '</td><td class="small">' + esc(a.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">ไม่พบรายการ</div>';
    }).catch(errToast);
  };
  $('#stBody').innerHTML = '<div class="card"><div class="hd"><h3>ประวัติการใช้งาน (ล่าสุด)</h3><input class="input" id="auQ" placeholder="ค้นหา รหัส / รายการ" style="max-width:280px;min-height:38px"></div><div id="auList">' + skel(1) + '</div></div>';
  $('#auQ').oninput = debounce(function () { load($('#auQ').value.trim()); }, 400);
  load('');
}

/* =================================================================== พื้นที่ทำงานต่อกิจกรรม (แยกแต่ละกิจกรรมชัดเจน) */
function wsTabs(ev) {
  if (isTh(ev)) return thWsTabs(ev);
  var t = ev.type === 'ORDER'
    ? [['orders', 'คำสั่งซื้อ / ตรวจสลิป', 'shirt'], ['summary', 'สรุปสำหรับสั่งต่อ', 'table'], ['print', 'พิมพ์ / ใบเซ็นรับ', 'printer'], ['mail', 'อีเมล', 'mail'], ['settings', 'ตั้งค่ากิจกรรม', 'settings']]
    : ev.type === 'PICK'
      ? [['overview', 'ภาพรวม', 'chart'], ['tracking', 'ติดตามรายบุคคล', 'users'], ['reports', 'รายงาน', 'table'], ['mail', 'อีเมลติดตาม', 'mail'], ['settings', 'ตั้งค่า / ผู้มีสิทธิ์', 'settings']]
      : [['overview', 'ภาพรวม', 'chart'], ['tracking', 'ติดตามรายบุคคล', 'users'], ['reports', 'รายงาน', 'table'], ['print', 'พิมพ์ / ใบเซ็นรับ', 'printer'], ['mail', 'อีเมลติดตาม', 'mail'], ['settings', 'ตั้งค่ากิจกรรม', 'settings']];
  if (!canEv(ev.id)) t = t.filter(function (x) { return ['overview', 'tracking', 'reports', 'print'].indexOf(x[0]) >= 0; });
  return t;
}
ROUTES['admin/ev'] = function (params, q) {
  if (!needViewer()) return;
  $('#page').innerHTML = skel(3);
  loadEvents().then(function (list) {
    list = list.filter(function (e) { return ['ORDER', 'QUESTION', 'CHECKIN'].indexOf(e.type) < 0 || canEv(e.id); });
    var id = params[0] || S.lastAdminEvent || (list[0] && list[0].id), ev = list.filter(function (e) { return e.id === id; })[0];
    if (!ev) { $('#page').innerHTML = '<div class="card empty">' + ic('layers') + '<p>ไม่พบกิจกรรม</p><a class="btn" href="#/admin/events">กิจกรรมทั้งหมด</a></div>'; return; }
    var tabs = wsTabs(ev), tab = params[1] && tabs.some(function (t) { return t[0] === params[1]; }) ? params[1] : tabs[0][0];
    S.lastAdminEvent = ev.id; S.inWs = true; S.wsTab = tab;
    setAccent(ev.color); shell();
    document.title = ev.title + ' · ' + tabs.filter(function (t) { return t[0] === tab; })[0][1];
    $('#evbar').innerHTML = '<div class="evbar" style="--ec:' + esc(ev.color) + '">' + (isAdmin() ? '<a class="crumb" href="#/admin/events" style="text-decoration:none">' + ic('arrowl') + ' กิจกรรมทั้งหมด</a>' : '') +
      '<div class="row between" style="align-items:flex-start;margin-top:4px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span class="evicon">' + ic(ev.type === 'ORDER' ? 'shirt' : ev.type === 'NOMINATE' ? 'award' : ev.type === 'QUESTION' ? 'chat' : ev.type === 'CHECKIN' ? 'qr' : 'layers') + '</span><div><h1>' + esc(ev.title) + '</h1>' +
      '<div class="row small muted" style="gap:8px;margin-top:4px">' + evStatusChip(ev.status) + '<span class="chip">' + esc(TYPE_TH[ev.type] || ev.type) + '</span><span>' + ic('calendar') + ' ' + esc(thDate(ev.openAt, false)) + ' – ' + esc(thDate(ev.closeAt)) + '</span>' + (ev.audience && ev.audience.mode === 'FILTER' ? '<span>' + ic('users') + ' เฉพาะกลุ่ม</span>' : ev.audience && ev.audience.mode === 'LIST' ? '<span>' + ic('users') + ' ตามรายชื่อ' + (ev.eligible ? ' ' + nf(ev.eligible) + ' คน' : '') + '</span>' : '') + (!canEv(ev.id) ? '<span class="chip info">ดูอย่างเดียว (หัวหน้า)</span>' : '') + '</div></div></div>' +
      '<div class="row">' + (isAdmin() && (AD.events || []).length > 1 ? '<select class="input" id="wsSwitch" style="width:auto;min-height:38px">' + AD.events.map(function (e) { return '<option value="' + esc(e.id) + '" ' + (e.id === ev.id ? 'selected' : '') + '>' + esc(e.title) + '</option>'; }).join('') + '</select>' : '') +
      helpBtn() + '<a class="btn sm" href="#/event/' + esc(ev.id) + '">' + ic('eye') + 'มุมมองบุคลากร</a></div></div>' +
      '<div class="tabs" style="margin:14px 0 0;border:0">' + tabs.map(function (t) { return '<a href="#/admin/ev/' + esc(ev.id) + '/' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + ic(t[2]) + t[1] + '</a>'; }).join('') + '</div></div>';
    var sw = $('#wsSwitch'); if (sw) sw.onchange = function () { go('#/admin/ev/' + sw.value); };
    $('#page').classList.add('ws');
    var id1 = [ev.id];
    clearInterval(window._thTimer);
    (Object.assign({ overview: function () { ROUTES['admin/dashboard'](id1); }, tracking: function () { ROUTES['admin/tracking'](id1, q || {}); }, reports: function () { ROUTES['admin/reports'](id1, q || {}); },
      mail: function () { ROUTES['admin/mail'](id1); }, settings: function () { editEvent(ev.id); }, orders: function () { adminOrdersPage(ev.id); }, print: function () { printPage(ev); }, summary: function () { adminOrderSummaryPage(ev.id); } }, isTh(ev) ? thTabFns(ev) : {}))[tab]();
  }).catch(errToast);
};

function orderSettingsHtml(c) {
  var p = c.payment || {}, sh = c.shipping || {};
  return '<h4 style="margin:6px 0 10px">' + ic('send') + ' การชำระเงิน</h4><div class="grid3"><div class="field"><label class="f">พร้อมเพย์ (เบอร์/เลขบัตร/เลขภาษี)</label><input class="input" id="pyId" inputmode="numeric" value="' + esc(p.promptpay || '') + '"></div>' +
    '<div class="field"><label class="f">ชื่อบัญชีผู้รับ (ให้ผู้โอนตรวจ)</label><input class="input" id="pyName" value="' + esc(p.accountName || '') + '"></div><div class="field"><label class="f">คำนำหน้าเลขที่คำสั่งซื้อ</label><input class="input" data-c="orderPrefix" value="' + esc(c.orderPrefix || 'OD') + '" maxlength="6"></div></div>' +
    '<div class="grid2"><div class="field"><label class="f">ข้อความถึงผู้โอน</label><input class="input" id="pyNote" value="' + esc(p.note || '') + '"></div><div class="field"><label class="f">สั่งได้สูงสุดต่อคำสั่งซื้อ (0 = ไม่จำกัด)</label><input class="input" type="number" min="0" data-c="maxPerOrder" value="' + esc(c.maxPerOrder || 0) + '"></div></div>' +
    '<h4 style="margin:6px 0 10px">' + ic('send') + ' ค่าส่ง</h4><label class="switch" style="margin-bottom:10px"><input type="checkbox" id="shOn" ' + (sh.enabled ? 'checked' : '') + '><span class="tr"></span>คิดค่าส่ง (ปิด = รวมส่งทั้ง รพ. ไม่มีค่าส่ง)</label>' +
    '<div class="grid2"><div class="field"><label class="f">ชื่อรายการค่าส่ง</label><input class="input" id="shLabel" value="' + esc(sh.label || 'ค่าส่ง EMS') + '"></div><div class="field"><label class="f">ตารางค่าส่ง (บรรทัดละ "จำนวน,ค่าส่ง")</label><textarea class="input" id="shTable" style="min-height:90px">' + esc((sh.table || []).map(function (r) { return r[0] + ',' + r[1]; }).join('\n')) + '</textarea><div class="hint">เกินตาราง = ค่าส่งแถวสุดท้าย +10 บาท/ตัว</div></div></div>' +
    '<div class="small muted">' + ic('info') + ' รายชื่อผู้ที่สั่งได้: ตั้งที่กล่อง "ผู้มีสิทธิ์เข้าร่วม" ด้านซ้าย (เฉพาะกลุ่ม › รหัสพนักงาน) หรือแท็บ คำสั่งซื้อ › รายชื่อที่อนุญาต</div>';
}


/* =================================================================== กิจกรรมชนิด PICK: รายการ · รูป · ผู้มีสิทธิ์ */
/** เลือกรูปจากเครื่อง → ย่อ → อัปโหลด → คืน 'img:ID' */
function uploadImgFlow(eventId, btn) {
  return pickFile('image/*').then(function (file) {
    if (!file) return null;
    return busy(btn, shrinkImage(file, 1400, 0.84).then(function (dataUrl) { return api('uploadImage', { eventId: eventId, dataUrl: dataUrl, name: file.name }); })).then(function (r) { return r.ref; });
  }).catch(function (e) { errToast(e, 'อัปโหลดรูปไม่สำเร็จ'); return null; });
}
function pickEditor(c) {
  var items = c.items || [];
  return '<div class="card"><div class="hd"><div><h3>รายการให้เลือก (' + items.length + ')</h3><div class="small muted">แต่ละคนจะเห็นเฉพาะรายการที่ตนมีสิทธิ์ (ตามรายชื่อที่นำเข้า)</div></div><button class="btn sm" id="pkAdd">' + ic('plus') + 'เพิ่มรายการ</button></div><div class="bd">' +
    '<div class="grid2"><div class="field"><label class="f">ชื่อเรียกรวม</label><input class="input" data-pc="itemName" value="' + esc(c.itemName || '') + '" placeholder="เช่น ผ้า/ชุดปฏิบัติงาน ประจำปี 2570"></div>' +
    '<div class="field"><label class="f">รูปปกกิจกรรม (ถ้ามี)</label><div class="row" style="flex-wrap:nowrap"><input class="input" data-pc="image" id="pkCover" value="' + esc(c.image || '') + '" placeholder="ว่าง = แสดงแถบสี"><button type="button" class="btn" id="pkCoverUp" data-busy="กำลังอัปโหลด…">' + ic('upload') + '</button></div></div></div>' +
    '<label class="switch" style="margin-bottom:12px"><input type="checkbox" data-pc="showImages" ' + (c.showImages ? 'checked' : '') + '><span class="tr"></span>แสดงรูปประกอบของแต่ละรายการให้บุคลากรเห็น</label>' +
    '<div class="tablewrap"><table class="t pkedit"><thead><tr><th style="width:62px">รหัส</th><th>ชื่อรายการ</th><th style="width:110px">ประเภท</th><th style="width:150px">รูป</th><th style="width:40px"></th></tr></thead><tbody>' +
    items.map(function (it, i) {
      return '<tr data-pi="' + i + '"><td><input class="input" data-p="key" value="' + esc(it.key) + '" ' + (it._new ? '' : 'readonly title="รหัสเปลี่ยนไม่ได้หลังบันทึก"') + ' style="width:58px"></td><td><input class="input" data-p="label" value="' + esc(it.label) + '"></td>' +
        '<td><input class="input" data-p="kind" value="' + esc(it.kind || '') + '" list="dlKind"></td><td><div class="row" style="flex-wrap:nowrap;gap:6px">' + (it.image ? '<span class="pthumb">' + imgTag(it.image, '') + '</span>' : '') + '<input type="hidden" data-p="image" value="' + esc(it.image || '') + '">' +
        '<button type="button" class="btn sm" data-pimg="' + i + '" data-busy="…">' + ic('upload') + (it.image ? '' : 'รูป') + '</button>' + (it.image ? '<button type="button" class="iconbtn" data-pimgx="' + i + '" title="เอารูปออก">' + ic('x') + '</button>' : '') + '</div></td>' +
        '<td><button type="button" class="iconbtn" data-pdel="' + i + '" title="ลบรายการ">' + ic('trash') + '</button></td></tr>';
    }).join('') + '</tbody></table></div><datalist id="dlKind"><option value="ผ้า"><option value="ชุด/เสื้อ"></datalist>' +
    '<div class="field" style="margin-top:14px"><label class="f">คำชี้แจง (บรรทัดละ 1 ข้อ)</label><textarea class="input" data-pc="notice" style="min-height:110px">' + esc((c.notice || []).join('\n')) + '</textarea></div>' +
    '<div class="field"><label class="f">ข้อความเมื่อไม่มีรายการให้เลือก</label><input class="input" data-pc="noOptionNote" value="' + esc(c.noOptionNote || '') + '"></div>' +
    '<div class="row" style="gap:20px;margin-bottom:14px"><label class="switch"><input type="checkbox" data-pc="allowDecline" ' + (c.allowDecline !== false ? 'checked' : '') + '><span class="tr"></span>มีตัวเลือก "ไม่ประสงค์"</label></div>' +
    '<div class="grid2"><div class="field"><label class="f">ข้อความปุ่ม "ไม่ประสงค์"</label><input class="input" data-pc="declineLabel" value="' + esc(c.declineLabel || 'ไม่ประสงค์รับ') + '"></div>' +
    '<div class="field"><label class="f">ผู้รับผิดชอบ / ติดต่อสอบถาม</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="pkCtName" value="' + esc((c.contact || {}).name || '') + '" placeholder="หน่วยงาน"><input class="input" id="pkCtPhone" value="' + esc((c.contact || {}).phone || '') + '" placeholder="โทร" style="max-width:110px"></div></div></div></div></div>';
}
function readPickForm(ED) {
  var c = ED.config;
  $$('[data-pc]').forEach(function (i) { var k = i.dataset.pc; c[k] = i.type === 'checkbox' ? i.checked : k === 'notice' ? i.value.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean) : i.value.trim(); });
  c.contact = { name: ($('#pkCtName') || {}).value || '', phone: ($('#pkCtPhone') || {}).value || '' };
  c.items = $$('tr[data-pi]').map(function (tr) {
    var prev = c.items[+tr.dataset.pi] || {};
    var o = { key: $('[data-p=key]', tr).value.trim().toUpperCase(), label: $('[data-p=label]', tr).value.trim(), kind: $('[data-p=kind]', tr).value.trim(), image: $('[data-p=image]', tr).value };
    if (prev._new) o._new = true;
    return o;
  });
  ED.audience = { mode: 'LIST' };
}
function bindPickEditor(ED, readForm, draw, isNew) {
  var nextKey = function () { var n = 0; ED.config.items.forEach(function (it) { var m = /^P(\d+)$/.exec(it.key); if (m) n = Math.max(n, +m[1]); }); return 'P' + ('0' + (n + 1)).slice(-2); };
  $('#pkAdd').onclick = function () { readForm(); ED.config.items.push({ key: nextKey(), label: '', kind: '', image: '', _new: true }); draw(); setTimeout(function () { var l = $$('[data-p=label]'); l[l.length - 1].focus(); }, 30); };
  $$('[data-pdel]').forEach(function (b) { b.onclick = function () { readForm(); var it = ED.config.items[+b.dataset.pdel]; confirmBox({ title: 'ลบรายการ ' + it.key + '?', msg: esc(it.label || '(ว่าง)') + '<br>ถ้ามีผู้มีสิทธิ์หรือผู้เลือกแล้ว ระบบจะไม่ยอมให้ลบตอนบันทึก', danger: true, ok: 'ลบ' }).then(function (y) { if (y) { ED.config.items.splice(+b.dataset.pdel, 1); draw(); } }); }; });
  $$('[data-pimg]').forEach(function (b) { b.onclick = function () { if (isNew) return toast('กด "บันทึก" กิจกรรมก่อน แล้วจึงอัปโหลดรูป', 'warn'); readForm(); uploadImgFlow(ED.id, b).then(function (ref) { if (ref) { ED.config.items[+b.dataset.pimg].image = ref; draw(); toast('อัปโหลดรูปแล้ว กด "บันทึก" เพื่อใช้รูปนี้', 'ok'); } }); }; });
  $$('[data-pimgx]').forEach(function (b) { b.onclick = function () { readForm(); ED.config.items[+b.dataset.pimgx].image = ''; draw(); }; });
  var cu = $('#pkCoverUp'); if (cu) cu.onclick = function () { if (isNew) return toast('กด "บันทึก" กิจกรรมก่อน แล้วจึงอัปโหลดรูป', 'warn'); readForm(); uploadImgFlow(ED.id, cu).then(function (ref) { if (ref) { ED.config.image = ref; draw(); toast('อัปโหลดรูปปกแล้ว กด "บันทึก" เพื่อใช้รูปนี้', 'ok'); } }); };
  if (!isNew) loadEligibilitySummary(ED);
  var ib = $('#elImp'); if (ib) ib.onclick = function () { importEligibilityFlow(ED); };
  var tb = $('#elTpl'); if (tb) tb.onclick = function () { eligibilityTemplate(ED); };
}
function eligibilityCard(ED, isNew) {
  return '<div class="card"><div class="hd"><div><h3>' + ic('users') + ' ผู้มีสิทธิ์ + ตัวเลือกของแต่ละคน</h3><div class="small muted">นำเข้าจาก Excel: รหัสพนักงาน + ตัวเลือก 1–3 (ข้อความหรือรหัสรายการ)</div></div></div><div class="bd">' +
    (isNew ? '<div class="muted small">กด "บันทึก" กิจกรรมก่อน แล้วจึงนำเข้ารายชื่อผู้มีสิทธิ์</div>'
      : '<div id="elSum">' + skel(1) + '</div><div class="row" style="margin-top:12px"><button type="button" class="btn primary" id="elImp">' + ic('upload') + 'นำเข้ารายชื่อผู้มีสิทธิ์</button><button type="button" class="btn" id="elTpl">' + ic('download') + 'เทมเพลต</button></div>' +
        '<div class="small muted" style="margin-top:8px">' + ic('info') + ' ข้อความที่สะกดต่างกันเล็กน้อย (ช่องว่าง จุด # ฎ/ฏ) ระบบจับคู่ให้ · ข้อความที่ไม่ตรงรายการใดเลยจะแสดงให้ตรวจหลังนำเข้า</div>') + '</div></div>';
}
function loadEligibilitySummary(ED) {
  api('listEligibility', { eventId: ED.id }).then(function (d) {
    var box = $('#elSum'); if (!box) return;
    var used = d.items.filter(function (x) { return x.eligible; }).sort(function (a, b) { return b.eligible - a.eligible; });
    box.innerHTML = '<div class="kpis" style="grid-template-columns:repeat(2,1fr);margin-bottom:10px"><div class="kpi"><small>ผู้มีสิทธิ์</small><b class="num" style="font-size:26px">' + nf(d.total) + '</b><div class="sub">คน</div></div><div class="kpi"><small>รายการที่มีผู้มีสิทธิ์</small><b class="num" style="font-size:26px">' + used.length + '</b><div class="sub">จาก ' + d.items.length + ' รายการ</div></div></div>' +
      (d.notInRoster ? '<div class="announce">' + ic('alert') + '<div>' + nf(d.notInRoster) + ' รหัสไม่อยู่ในรายชื่อบุคลากร — จะไม่ปรากฏในหน้าติดตามจนกว่าจะเพิ่มในรายชื่อ (หรือเจ้าตัวเข้าระบบเอง)</div></div>' : '') +
      (used.length ? '<div class="tablewrap" style="max-height:240px"><table class="t"><thead><tr><th>รายการ</th><th class="r">มีสิทธิ์</th></tr></thead><tbody>' + used.map(function (x) { return '<tr><td class="small"><b>' + esc(x.key) + '</b> ' + esc(x.label) + '</td><td class="r num">' + nf(x.eligible) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="muted small">ยังไม่มีรายชื่อผู้มีสิทธิ์</div>');
  }).catch(errToast);
}
function eligibilityTemplate(ED) {
  exportXlsx('เทมเพลตผู้มีสิทธิ์_' + ED.id + '.xlsx', [
    { name: 'ผู้มีสิทธิ์', rows: [['EmpCode', 'ชื่อ-สกุล', 'ตัวเลือก1', 'ตัวเลือก2', 'ตัวเลือก3', 'ฝ่ายที่ปฏิบัติงาน', 'หน่วยที่ปฏิบัติงาน'],
      ['5XXXXXX', 'นางสาว ตัวอย่าง ข้อมูลสมมติ', (ED.config.items[0] || {}).label || 'P01', (ED.config.items[1] || {}).key || '', '', 'ฝ่ายการพยาบาล', 'OPD 4']] },
    { name: 'รายการ', rows: [['รหัส', 'ชื่อรายการ', 'ประเภท']].concat(ED.config.items.map(function (it) { return [it.key, it.label, it.kind]; })) },
    { name: 'คำอธิบาย', rows: [['คอลัมน์', 'ความหมาย'], ['EmpCode', 'รหัสพนักงาน (จำเป็น)'], ['ตัวเลือก1–3', 'ชื่อรายการ (ตรงกับแผ่น "รายการ") หรือรหัส เช่น P29 · มีกี่ช่องก็ได้'],
      ['ฝ่าย/หน่วยที่ปฏิบัติงาน', 'ไม่บังคับ · ใช้ให้หัวหน้าฝ่ายที่คนนั้นปฏิบัติงานจริงเป็นผู้ติดตาม (ผู้ดูแลสูงสุดเลือกอัปเดตได้ตอนนำเข้า)'], ['ชื่อ-สกุล', 'ไว้อ่านตรวจเท่านั้น ระบบไม่ใช้']] }
  ]).catch(errToast);
}
function importEligibilityFlow(ED) {
  pickFile('.xlsx,.xls,.csv').then(function (file) {
    if (!file) return;
    toast('กำลังอ่านไฟล์ ' + file.name + '…', 'info');
    return readSheetFile(file).then(function (raw) {
      var optCols = raw.length ? Object.keys(raw[0]).filter(function (k) { return /^(ตัวเลือก|เลือก|option|opt)\s*_?\d+$/i.test(k.trim()) || /^รหัสรายการ/.test(k.trim()); }) : [];
      var rows = raw.map(function (r) {
        return { empCode: pickCol(r, ['EmpCode', 'รหัสพนักงาน', 'รหัสประจำตัว', 'รหัส', 'empCode']).replace(/\D/g, ''), name: pickCol(r, ['ชื่อ-สกุล', 'ชื่อสกุล', 'FullName']),
          options: optCols.map(function (k) { return String(r[k] || '').trim(); }).filter(Boolean),
          workDivision: pickCol(r, ['ฝ่ายที่ปฏิบัติงาน', 'WorkDivision']), workUnit: pickCol(r, ['หน่วยที่ปฏิบัติงาน', 'WorkUnit']) };
      }).filter(function (r) { return r.empCode; });
      if (!rows.length) return toast('ไม่พบคอลัมน์ EmpCode / รหัสพนักงาน ในไฟล์', 'warn');
      if (!optCols.length) return toast('ไม่พบคอลัมน์ ตัวเลือก1, ตัวเลือก2 … ในไฟล์ (ดูเทมเพลต)', 'warn');
      var hasWork = rows.some(function (r) { return r.workDivision || r.workUnit; }), noOpt = rows.filter(function (r) { return !r.options.length; }).length;
      var body = '<div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">' + [['แถวที่อ่านได้', rows.length], ['คอลัมน์ตัวเลือก', optCols.length], ['ไม่มีตัวเลือก', noOpt]].map(function (k) { return '<div class="kpi"><small>' + k[0] + '</small><b class="num" style="font-size:24px">' + nf(k[1]) + '</b></div>'; }).join('') + '</div>' +
        '<div class="small muted" style="margin-bottom:6px">ตัวอย่าง 5 แถวแรก · คอลัมน์ตัวเลือก: ' + esc(optCols.join(', ')) + '</div><div class="tablewrap"><table class="t"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>ตัวเลือก</th>' + (hasWork ? '<th>ฝ่าย/หน่วยที่ปฏิบัติงาน</th>' : '') + '</tr></thead><tbody>' +
        rows.slice(0, 5).map(function (r) { return '<tr><td class="num">' + esc(r.empCode) + '</td><td class="small">' + esc(r.name) + '</td><td class="small">' + esc(r.options.join(' | ')) + '</td>' + (hasWork ? '<td class="small">' + esc([r.workDivision, r.workUnit].filter(Boolean).join(' · ')) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="stack" style="margin-top:14px"><label class="switch"><input type="checkbox" id="elRep" checked><span class="tr"></span>แทนที่รายชื่อเดิมของกิจกรรมนี้ทั้งหมด (คนที่ไม่อยู่ในไฟล์จะหมดสิทธิ์ · คำตอบที่บันทึกแล้วยังอยู่)</label>' +
        (hasWork && isSuper() ? '<label class="switch"><input type="checkbox" id="elWork" checked><span class="tr"></span>อัปเดต "ฝ่าย/หน่วยที่ปฏิบัติงาน" ในรายชื่อบุคลากรด้วย (หัวหน้าจะเห็นตามที่ปฏิบัติงานจริง)</label>' : '') + '</div>';
      var m = modal({ title: 'นำเข้าผู้มีสิทธิ์ · ' + esc(file.name), size: 'lg', body: body, foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="elGo" data-busy="กำลังนำเข้า…">' + ic('upload') + 'นำเข้า ' + nf(rows.length) + ' แถว</button>' });
      $('#elGo').onclick = function () {
        busy(this, api('importEligibility', { eventId: ED.id, rows: rows.map(function (r) { return { empCode: r.empCode, options: r.options, workDivision: r.workDivision, workUnit: r.workUnit }; }), replace: $('#elRep').checked, updateWork: !!($('#elWork') && $('#elWork').checked), fileName: file.name }))
          .then(function (r) {
            m.close();
            modal({ title: ic('check') + ' นำเข้าเรียบร้อย', size: 'lg', body: '<div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">' + [['เพิ่ม', r.added], ['ปรับปรุง', r.updated], ['ลบออก', r.removed], ['รวมผู้มีสิทธิ์', r.summary.total]].map(function (k) { return '<div class="kpi"><small>' + k[0] + '</small><b class="num" style="font-size:24px">' + nf(k[1]) + '</b></div>'; }).join('') + '</div>' +
              (r.unknown.length ? '<div class="announce">' + ic('alert') + '<div><b>ข้อความตัวเลือกที่ไม่ตรงรายการใด ' + r.unknown.length + ' แบบ</b> (ไม่ได้นำเข้าเฉพาะตัวเลือกนั้น — แก้ในไฟล์ หรือเพิ่มรายการ แล้วนำเข้าใหม่)<ul style="margin:6px 0 0;padding-left:18px">' + r.unknown.slice(0, 30).map(function (u) { return '<li>' + esc(u.text) + ' <span class="muted">(' + u.count + ' แถว)</span></li>'; }).join('') + '</ul></div></div>' : '<div class="announce" style="background:var(--ok-soft);border-color:#bfe3cf;color:var(--ok)">' + ic('check') + '<div>ตัวเลือกทุกข้อจับคู่กับรายการได้ครบ</div></div>') +
              (r.notInRosterCount ? '<div class="announce">' + ic('info') + '<div>' + nf(r.notInRosterCount) + ' รหัสไม่อยู่ในรายชื่อบุคลากร: <span class="small num">' + esc(r.notInRoster.slice(0, 30).join(', ')) + (r.notInRosterCount > 30 ? ' …' : '') + '</span></div></div>' : '') +
              (r.dupRows ? '<div class="small muted">รหัสซ้ำในไฟล์ ' + r.dupRows + ' แถว (รวมตัวเลือกให้)</div>' : '') + (r.noOption ? '<div class="small muted">ไม่มีตัวเลือก ' + r.noOption + ' คน (เห็นกิจกรรม เลือกได้เฉพาะ "ไม่ประสงค์")</div>' : '') +
              (r.workUpdated ? '<div class="small muted">อัปเดตฝ่าย/หน่วยที่ปฏิบัติงาน ' + nf(r.workUpdated) + ' คน</div>' : '') });
            loadEligibilitySummary(ED);
          }).catch(errToast);
      };
    });
  }).catch(errToast);
}
