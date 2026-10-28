/* SOMDEJ HR Connect — pages-print.js : เอกสารพิมพ์สำหรับจัดเตรียม/แจกของ (ใช้ได้ทั้งกิจกรรมจองไซซ์และสั่งซื้อ)
 * 1) สรุปจำนวน (รวม + ตารางกลุ่ม × ไซซ์)  2) รายการจัดเตรียมรายไซซ์  3) ใบเซ็นรับ  4) ป้ายติดถุงรายคน */

var PR = null;
var PR_DOCS = [
  ['summary', 'สรุปจำนวน', 'table', 'ยอดรวมทุกไซซ์ + ตาราง ฝ่าย/หน่วย/ตำแหน่ง × ไซซ์ สำหรับแบ่งของ'],
  ['pick', 'รายการจัดเตรียมรายไซซ์', 'layers', 'แต่ละไซซ์มีรายชื่อใครบ้าง พร้อมช่องติ๊ก "จัดแล้ว"'],
  ['sign', 'ใบเซ็นรับเสื้อ', 'edit', 'ตารางรายชื่อพร้อมช่องลงชื่อผู้รับและวันที่ แยกหน้าตามกลุ่ม'],
  ['labels', 'ป้ายติดถุงรายคน', 'user', '10 ป้ายต่อแผ่น A4 · ชื่อ หน่วย ไซซ์ จำนวน · ตัดแปะถุงได้']
];
var PR_GROUPS = [['division', 'รายฝ่าย'], ['unit', 'รายหน่วย'], ['position', 'รายตำแหน่ง'], ['size', 'รายไซซ์'], ['none', 'ไม่แบ่งกลุ่ม']];

function printPage(ev) {
  PR = PR && PR.id === ev.id ? PR : { id: ev.id, doc: 'summary', group: 'division', scope: 'PAID', div: '', sort: 'name', pb: true, note: '', people: null };
  PR.ev = ev;
  $('#page').innerHTML = skel(2);
  var cfg = ev.config || {}, sizeKeys = [];
  (cfg.options || []).forEach(function (o) { o.sizes.forEach(function (s) { sizeKeys.push({ k: o.key + '|' + s.code, opt: o.label, code: s.code, short: o.label.replace(/^แบบ/, '').replace('ไซซ์ใหญ่พิเศษ', 'ใหญ่พิเศษ') + ' ' + s.code }); }); });
  PR.sizeKeys = sizeKeys;
  var load = ev.type === 'ORDER'
    ? api('getOrders', { eventId: ev.id }).then(function (d) { PR.raw = d; return d; })
    : api('getTracking', { eventId: ev.id }).then(function (d) { PR.raw = d; return d; });
  load.then(function () { if (S.wsTab === 'print') drawPrintPage(); }).catch(errToast);
}
/** แปลงข้อมูลเป็น "คน" ที่มีรายการของ (รวมหลายคำสั่งซื้อของคนเดียวกัน) */
function printPeople() {
  var ev = PR.ev, map = {}, label = {};
  PR.sizeKeys.forEach(function (s) { label[s.k] = s; });
  var add = function (p, optKey, sizeCode, qty, ref) {
    var x = map[p.empCode] || (map[p.empCode] = { empCode: p.empCode, name: p.name, position: p.position || '', unit: p.unit || '', division: p.division || '', items: {}, refs: [] });
    var k = optKey + '|' + sizeCode; x.items[k] = (x.items[k] || 0) + qty; if (ref && x.refs.indexOf(ref) < 0) x.refs.push(ref);
  };
  if (ev.type === 'ORDER') {
    PR.raw.orders.forEach(function (o) {
      if (o.cancelled) return;
      if (PR.scope === 'PAID' && o.payStatus !== 'PAID') return;
      o.items.forEach(function (i) { add(o, i.optKey, i.sizeCode, i.qty, o.id); });
    });
  } else {
    trackObjs(PR.raw).forEach(function (r) { if (r.status === 'ORDERED') add(r, r.optKey, r.sizeCode, (+r.qty || 1) + (+r.extraQty || 0)); });
  }
  var list = Object.keys(map).map(function (k) { var x = map[k]; x.qty = Object.keys(x.items).reduce(function (a, k2) { return a + x.items[k2]; }, 0); return x; });
  if (PR.div) list = list.filter(function (x) { return x.division === PR.div; });
  list.sort(function (a, b) { return PR.sort === 'code' ? (a.empCode > b.empCode ? 1 : -1) : (a.name.replace(/^(นาย|นางสาว|นาง)/, '') > b.name.replace(/^(นาย|นางสาว|นาง)/, '') ? 1 : -1); });
  return list;
}
function itemsShort(x) { return PR.sizeKeys.filter(function (s) { return x.items[s.k]; }).map(function (s) { return s.short + (x.items[s.k] > 1 ? ' ×' + x.items[s.k] : ''); }).join(', '); }
function groupKey(x) { return PR.group === 'division' ? x.division || '(ไม่ระบุฝ่าย)' : PR.group === 'unit' ? (x.unit || '(ไม่ระบุหน่วย)') : PR.group === 'position' ? x.position || '(ไม่ระบุตำแหน่ง)' : 'ทั้งหมด'; }
function groupsOf(list) {
  var g = {}, order = [];
  list.forEach(function (x) { var k = groupKey(x); if (!g[k]) { g[k] = []; order.push(k); } g[k].push(x); });
  order.sort(); return order.map(function (k) { return { name: k, people: g[k], sub: PR.group === 'unit' && g[k][0] ? g[k][0].division : '' }; });
}

function drawPrintPage() {
  var ev = PR.ev, people = printPeople(), divs = {};
  (ev.type === 'ORDER' ? PR.raw.orders.filter(function (o) { return !o.cancelled; }) : trackObjs(PR.raw).filter(function (r) { return r.status === 'ORDERED'; })).forEach(function (r) { if (r.division) divs[r.division] = 1; });
  var tq = people.reduce(function (a, x) { return a + x.qty; }, 0);
  var h = '<div class="dgrid" style="grid-template-columns:360px 1fr"><div class="stack">' +
    '<div class="card"><div class="hd"><h3>' + ic('printer') + ' เลือกเอกสาร</h3></div><div class="bd"><div class="doclist">' + PR_DOCS.map(function (d) {
      return '<button type="button" class="docopt ' + (PR.doc === d[0] ? 'on' : '') + '" data-doc="' + d[0] + '"><span class="ic">' + ic(d[2]) + '</span><span><b>' + d[1] + '</b><small>' + d[3] + '</small></span></button>';
    }).join('') + '</div></div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('filter') + ' ตัวเลือก</h3></div><div class="bd">' +
    (PR.doc !== 'pick' ? '<div class="field"><label class="f">แบ่งกลุ่ม</label><select class="input" id="prGroup">' + PR_GROUPS.filter(function (g) { return g[0] !== 'size' || PR.doc === 'sign'; }).map(function (g) { return '<option value="' + g[0] + '" ' + (PR.group === g[0] ? 'selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select></div>' : '') +
    (ev.type === 'ORDER' ? '<div class="field"><label class="f">คำสั่งซื้อที่นับ</label><select class="input" id="prScope"><option value="PAID">เฉพาะที่ชำระแล้ว</option><option value="ALL" ' + (PR.scope === 'ALL' ? 'selected' : '') + '>ทุกคำสั่งซื้อ (ไม่รวมยกเลิก)</option></select></div>' : '') +
    '<div class="field"><label class="f">เฉพาะฝ่าย</label><select class="input" id="prDiv"><option value="">ทุกฝ่าย</option>' + Object.keys(divs).sort().map(function (d) { return '<option ' + (PR.div === d ? 'selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label class="f">เรียงรายชื่อ</label><select class="input" id="prSort"><option value="name">ตามชื่อ</option><option value="code" ' + (PR.sort === 'code' ? 'selected' : '') + '>ตามรหัสพนักงาน</option></select></div>' +
    '<div class="field"><label class="f">ข้อความเพิ่มท้ายเอกสาร (ถ้ามี)</label><input class="input" id="prNote" value="' + esc(PR.note) + '" placeholder="เช่น รับเสื้อได้ที่ฝ่าย HR ชั้น 2 วันที่ ..."></div>' +
    '<label class="switch"><input type="checkbox" id="prPb" ' + (PR.pb ? 'checked' : '') + '><span class="tr"></span>ขึ้นหน้าใหม่ทุกกลุ่ม</label>' +
    '<div class="small muted" style="margin-top:12px">' + nf(people.length) + ' คน · ' + nf(tq) + ' ตัว</div></div></div></div>' +
    '<div class="card"><div class="hd"><h3>' + ic('eye') + ' ตัวอย่างก่อนพิมพ์</h3><div class="row"><button class="btn sm" id="prOpen">' + ic('link') + 'เปิดในแท็บใหม่</button><button class="btn primary" id="prPrint">' + ic('printer') + 'พิมพ์ / บันทึก PDF</button></div></div>' +
    '<div class="bd" style="padding:0;background:#e9e6ee"><iframe id="prFrame" class="printframe" title="ตัวอย่างเอกสาร"></iframe></div></div></div>';
  $('#page').innerHTML = h;
  var html = buildPrintHtml(people);
  $('#prFrame').srcdoc = html;
  $$('[data-doc]').forEach(function (b) { b.onclick = function () { PR.doc = b.dataset.doc; if (PR.doc !== 'sign' && PR.group === 'size') PR.group = 'division'; drawPrintPage(); }; });
  [['prGroup', 'group'], ['prScope', 'scope'], ['prDiv', 'div'], ['prSort', 'sort']].forEach(function (p) { var el = $('#' + p[0]); if (el) el.onchange = function () { PR[p[1]] = el.value; drawPrintPage(); }; });
  $('#prNote').oninput = debounce(function () { PR.note = $('#prNote').value; $('#prFrame').srcdoc = buildPrintHtml(printPeople()); }, 500);
  $('#prPb').onchange = function () { PR.pb = this.checked; drawPrintPage(); };
  $('#prPrint').onclick = function () { var f = $('#prFrame'); try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { openPrintTab(html); } };
  $('#prOpen').onclick = function () { openPrintTab(buildPrintHtml(printPeople())); };
}
function openPrintTab(html) {
  var w = window.open('', '_blank');
  if (!w) return toast('เบราว์เซอร์บล็อกหน้าต่างใหม่ — อนุญาต pop-up แล้วลองใหม่', 'warn');
  w.document.open(); w.document.write(html.replace('</body>', '<script>setTimeout(function(){print()},600)<\/script></body>')); w.document.close();
}

/* ---------------- สร้าง HTML เอกสาร ---------------- */
function buildPrintHtml(people) {
  var ev = PR.ev, docName = PR_DOCS.filter(function (d) { return d[0] === PR.doc; })[0][1];
  var groupName = (PR_GROUPS.filter(function (g) { return g[0] === PR.group; })[0] || [])[1] || '';
  var scopeTxt = ev.type === 'ORDER' ? (PR.scope === 'PAID' ? 'เฉพาะคำสั่งซื้อที่ชำระแล้ว' : 'ทุกคำสั่งซื้อที่ไม่ยกเลิก') : 'เฉพาะผู้ที่จองไซซ์';
  var used = PR.sizeKeys.filter(function (s) { return people.some(function (x) { return x.items[s.k]; }); });
  var land = PR.doc === 'summary' && used.length > 9;
  var head = function (sub) {
    return '<div class="dochead"><img src="' + location.href.split('#')[0].replace(/[^\/]*$/, '') + 'logo.jpg" alt=""><div><div class="org">' + esc(S.boot.brand.orgName) + ' · ' + esc(S.boot.brand.deptName) + '</div><h1>' + esc(docName) + (sub ? ' · ' + esc(sub) : '') + '</h1>' +
      '<div class="meta">' + esc(ev.title) + ' · ' + esc(scopeTxt) + (PR.div ? ' · ' + esc(PR.div) : '') + ' · พิมพ์ ' + esc(thDate(localIso())) + '</div></div></div>';
  };
  var foot = PR.note ? '<div class="note">' + esc(PR.note) + '</div>' : '';
  var body = '';
  if (!people.length) body = head() + '<p class="empty">ไม่มีข้อมูลตามเงื่อนไข</p>';
  else if (PR.doc === 'summary') body = docSummary(people, used, head, foot);
  else if (PR.doc === 'pick') body = docPick(people, used, head, foot);
  else if (PR.doc === 'sign') body = docSign(people, used, head, foot, groupName);
  else body = docLabels(people, used);
  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(docName + ' - ' + ev.title) + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"><style>' + PRINT_CSS + '@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:11mm 10mm}</style></head><body>' + body + '</body></html>';
}
var PRINT_CSS = 'body{font-family:Sarabun,"TH Sarabun New",Tahoma,sans-serif;color:#111;font-size:13.5px;margin:0;padding:14px;background:#fff}' +
  '@media screen{body{max-width:1000px;margin:0 auto}}' +
  '.dochead{display:flex;gap:12px;align-items:center;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px}.dochead img{width:42px;height:42px;object-fit:contain}' +
  '.dochead h1{font-size:19px;margin:0;line-height:1.25}.dochead .org{font-size:12px;color:#444}.dochead .meta{font-size:12px;color:#444}' +
  'table{width:100%;border-collapse:collapse;margin:6px 0 10px}th,td{border:1px solid #444;padding:4px 6px;vertical-align:middle}th{background:#eee;font-weight:700;font-size:12.5px}' +
  'thead{display:table-header-group}tr{page-break-inside:avoid}td.c,th.c{text-align:center}td.r,th.r{text-align:right}tfoot td{font-weight:700;background:#f4f4f4}' +
  '.grp{margin-top:14px}.grp.pb{page-break-before:always}.grp:first-of-type{page-break-before:auto}' +
  '.gh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;border-left:5px solid #111;padding:2px 0 2px 8px;margin:8px 0 4px}.gh h2{font-size:16px;margin:0}.gh .s{font-size:12px;color:#333}' +
  '.chips{font-size:12px;margin:2px 0 6px}.chips span{display:inline-block;border:1px solid #888;border-radius:4px;padding:0 6px;margin:0 4px 3px 0}' +
  '.sig{height:30px;min-width:120px}.box{display:inline-block;width:13px;height:13px;border:1.5px solid #111;vertical-align:-2px}' +
  '.signs{display:flex;justify-content:space-around;margin-top:22px;font-size:13px;page-break-inside:avoid}.signs div{text-align:center}' +
  '.note{margin-top:10px;padding:6px 10px;border:1px dashed #666;font-size:13px}.empty{color:#666;text-align:center;padding:40px}' +
  '.labels{display:grid;grid-template-columns:1fr 1fr;gap:0}.lab{border:1px dashed #777;height:54mm;padding:4mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;page-break-inside:avoid;overflow:hidden}' +
  '.lab .ev{font-size:10.5px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lab .nm{font-size:19px;font-weight:700;line-height:1.2;margin:2px 0}.lab .u{font-size:12px;color:#333}' +
  '.lab .it{font-size:17px;font-weight:700;margin-top:auto;padding-top:4px}.lab .it span{display:inline-block;border:2px solid #111;border-radius:6px;padding:0 8px;margin:0 5px 4px 0}' +
  '.lab .rc{font-size:11px;color:#333;display:flex;justify-content:space-between;border-top:1px solid #bbb;padding-top:3px}' +
  '.labels.pb{page-break-after:always}@media print{body{padding:0}.lab{border-color:#999}}';

function sizeTotals(people, used) { var t = {}; used.forEach(function (s) { t[s.k] = 0; }); people.forEach(function (x) { used.forEach(function (s) { t[s.k] += x.items[s.k] || 0; }); }); return t; }
function chipsLine(people, used) { var t = sizeTotals(people, used); return '<div class="chips">' + used.filter(function (s) { return t[s.k]; }).map(function (s) { return '<span>' + esc(s.short) + ' <b>' + t[s.k] + '</b></span>'; }).join('') + '</div>'; }

function docSummary(people, used, head, foot) {
  var tot = sizeTotals(people, used), all = 0, opts = {};
  used.forEach(function (s) { all += tot[s.k]; (opts[s.opt] = opts[s.opt] || []).push(s); });
  var h = head('รวม ' + people.length + ' คน · ' + all + ' ตัว');
  h += '<table><thead><tr><th>แบบ</th>' + '<th>ไซซ์ / จำนวน</th><th class="r">รวม</th></tr></thead><tbody>' + Object.keys(opts).map(function (o) {
    var sum = opts[o].reduce(function (a, s) { return a + tot[s.k]; }, 0);
    return '<tr><td><b>' + esc(o) + '</b></td><td>' + opts[o].map(function (s) { return esc(s.code) + ' = <b>' + tot[s.k] + '</b>'; }).join(' &nbsp;·&nbsp; ') + '</td><td class="r"><b>' + sum + '</b></td></tr>';
  }).join('') + '</tbody><tfoot><tr><td colspan="2">รวมทั้งสิ้น</td><td class="r">' + all + '</td></tr></tfoot></table>';
  if (PR.group !== 'none') {
    var gs = groupsOf(people), gname = (PR_GROUPS.filter(function (g) { return g[0] === PR.group; })[0] || [])[1];
    h += '<div class="gh"><h2>แยก' + esc(gname.replace(/^ราย/, '')) + '</h2><span class="s">' + gs.length + ' กลุ่ม</span></div>';
    h += '<table><thead><tr><th>' + esc(gname.replace(/^ราย/, '')) + '</th><th class="c">คน</th>' + used.map(function (s) { return '<th class="c">' + esc(s.short) + '</th>'; }).join('') + '<th class="c">รวม</th><th class="c">✓</th></tr></thead><tbody>' +
      gs.map(function (g) { var t = sizeTotals(g.people, used), sum = 0; used.forEach(function (s) { sum += t[s.k]; }); return '<tr><td>' + esc(g.name) + (g.sub ? '<div style="font-size:11px;color:#555">' + esc(g.sub) + '</div>' : '') + '</td><td class="c">' + g.people.length + '</td>' + used.map(function (s) { return '<td class="c">' + (t[s.k] || '') + '</td>'; }).join('') + '<td class="c"><b>' + sum + '</b></td><td class="c"><span class="box"></span></td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td>รวม</td><td class="c">' + people.length + '</td>' + used.map(function (s) { return '<td class="c">' + tot[s.k] + '</td>'; }).join('') + '<td class="c">' + all + '</td><td></td></tr></tfoot></table>';
  }
  return h + foot + '<div class="signs"><div>ผู้จัดทำ ...................................<br>(...................................)</div><div>ผู้ตรวจสอบ ...................................<br>(...................................)</div></div>';
}
function docPick(people, used, head, foot) {
  var h = '';
  used.forEach(function (s, i) {
    var list = people.filter(function (x) { return x.items[s.k]; }), n = list.reduce(function (a, x) { return a + x.items[s.k]; }, 0);
    h += '<div class="grp' + (PR.pb && i ? ' pb' : '') + '">' + (i === 0 || PR.pb ? head() : '') + '<div class="gh"><h2>' + esc(s.opt) + ' · ไซซ์ ' + esc(s.code) + '</h2><span class="s">' + list.length + ' คน · ' + n + ' ตัว</span></div>' +
      '<table><thead><tr><th class="c" style="width:34px">#</th><th>ชื่อ-สกุล</th><th>รหัส</th><th>หน่วย / ฝ่าย</th><th class="c" style="width:60px">จำนวน</th><th class="c" style="width:56px">จัดแล้ว</th></tr></thead><tbody>' +
      list.map(function (x, j) { return '<tr><td class="c">' + (j + 1) + '</td><td>' + esc(x.name) + '</td><td>' + esc(x.empCode) + '</td><td>' + esc(x.unit || '-') + ' / ' + esc(x.division) + '</td><td class="c"><b>' + x.items[s.k] + '</b></td><td class="c"><span class="box"></span></td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="4">รวม ' + esc(s.short) + '</td><td class="c">' + n + '</td><td></td></tr></tfoot></table></div>';
  });
  return h + foot;
}
function docSign(people, used, head, foot, groupName) {
  var groups;
  if (PR.group === 'size') {
    groups = used.map(function (s) { return { name: s.opt + ' · ไซซ์ ' + s.code, rows: people.filter(function (x) { return x.items[s.k]; }).map(function (x) { return { x: x, items: s.short, qty: x.items[s.k] }; }) }; });
  } else {
    groups = groupsOf(people).map(function (g) { return { name: g.name, sub: g.sub, people: g.people, rows: g.people.map(function (x) { return { x: x, items: itemsShort(x), qty: x.qty }; }) }; });
  }
  return groups.map(function (g, i) {
    var n = g.rows.reduce(function (a, r) { return a + r.qty; }, 0);
    return '<div class="grp' + (PR.pb && i ? ' pb' : '') + '">' + (i === 0 || PR.pb ? head(PR.group === 'none' ? '' : groupName) : '') +
      (PR.group !== 'none' ? '<div class="gh"><h2>' + esc(g.name) + '</h2><span class="s">' + (g.sub ? esc(g.sub) + ' · ' : '') + g.rows.length + ' คน · ' + n + ' ตัว</span></div>' : '') +
      (g.people ? chipsLine(g.people, used) : '') +
      '<table><thead><tr><th class="c" style="width:30px">#</th><th style="width:62px">รหัส</th><th>ชื่อ-สกุล</th>' + (PR.group === 'unit' ? '' : '<th>หน่วย</th>') + '<th>ไซซ์</th><th class="c" style="width:44px">จำนวน</th><th style="width:130px">ลงชื่อผู้รับ</th><th style="width:70px">วันที่รับ</th></tr></thead><tbody>' +
      g.rows.map(function (r, j) { return '<tr><td class="c">' + (j + 1) + '</td><td>' + esc(r.x.empCode) + '</td><td>' + esc(r.x.name) + '</td>' + (PR.group === 'unit' ? '' : '<td style="font-size:12px">' + esc(r.x.unit || r.x.division) + '</td>') + '<td><b>' + esc(r.items) + '</b></td><td class="c">' + r.qty + '</td><td class="sig"></td><td></td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="' + (PR.group === 'unit' ? 4 : 5) + '">รวม</td><td class="c">' + n + '</td><td colspan="2"></td></tr></tfoot></table>' +
      (PR.pb || i === groups.length - 1 ? '<div class="signs"><div>ผู้จ่ายของ ...................................<br>วันที่ ........./........./.........</div><div>ผู้รับมอบ (ตัวแทนหน่วยงาน) ...................................<br>วันที่ ........./........./.........</div></div>' + foot : '') + '</div>';
  }).join('');
}
function docLabels(people, used) {
  var ev = PR.ev, list = PR.group === 'none' ? people : groupsOf(people).reduce(function (a, g) { return a.concat(g.people); }, []), pages = [];
  for (var i = 0; i < list.length; i += 10) pages.push(list.slice(i, i + 10));
  return pages.map(function (pg, pi) {
    return '<div class="labels' + (pi < pages.length - 1 ? ' pb' : '') + '">' + pg.map(function (x) {
      return '<div class="lab"><div class="ev">' + esc(ev.title) + '</div><div class="nm">' + esc(x.name) + '</div><div class="u">' + esc(x.empCode) + ' · ' + esc(x.unit || '-') + '<br>' + esc(x.division) + '</div>' +
        '<div class="it">' + PR.sizeKeys.filter(function (s) { return x.items[s.k]; }).map(function (s) { return '<span>' + esc(s.short) + ' × ' + x.items[s.k] + '</span>'; }).join('') + '</div>' +
        '<div class="rc"><span>' + (x.refs.length ? esc(x.refs.join(', ')) : 'รวม ' + x.qty + ' ตัว') + '</span><span><span class="box"></span> รับแล้ว ลงชื่อ ................</span></div></div>';
    }).join('') + '</div>';
  }).join('');
}
