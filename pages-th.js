/* SOMDEJ HR Connect — pages-th.js : Hospital Town Hall
 *   บุคลากร: เสนอชื่อบุคลากรดีเด่น (NOMINATE) · ส่งคำถามถึงผู้บริหาร (QUESTION) · วันงาน: เช็กอิน + แบบประเมิน (CHECKIN)
 *   ผู้ดูแล: ผลการเสนอชื่อ/ตรวจคุณสมบัติ · รายชื่อ+หมวดตำแหน่ง · จัดการคำถาม · ส่งผู้บริหาร · จอถามในห้อง · จอเช็กอิน · โต๊ะลงทะเบียน · ผลแบบประเมิน
 * รุ่น 2569-10-31.1 */

var TH_ICON = { NOMINATE: 'award', QUESTION: 'chat', CHECKIN: 'calendar' };
var CORE_VALUES = [['H', 'Humanity', 'มีมนุษยธรรม'], ['A', 'Accountability', 'รับผิดชอบ โปร่งใส'], ['S', 'Sustainability', 'สร้างคุณค่าอย่างยั่งยืน'],
  ['C', 'Compassion', 'เอื้ออาทร'], ['C', 'Collaboration', 'ผสานพลัง'], ['C', 'Continuous Learning & Resilience', 'เรียนรู้ ปรับตัวไว']];
function thHHMM(iso) { var m = String(iso || '').match(/T(\d{2}):(\d{2})/); return m ? m[1] + '.' + m[2] + ' น.' : ''; }
function thValues() {
  return '<div class="th-values" title="Thai Red Cross Core Values & DNA">' + CORE_VALUES.map(function (v, i) {
    return (i === 3 ? '<span class="sep"></span>' : '') + '<span class="v' + (i < 3 ? '' : ' dna') + '"><b>' + v[0] + '</b><span>' + esc(v[1]) + '<small>' + esc(v[2]) + '</small></span></span>';
  }).join('') + '</div>';
}
function thHero(ev, chips, extra) {
  return '<div class="th-hero"><div class="th-hero-in"><div class="th-kicker">' + ic(TH_ICON[ev.type] || 'star') + ' Hospital Town Hall</div>' +
    '<h1>' + esc(ev.title) + '</h1>' + (ev.subtitle ? '<div class="subt">' + esc(ev.subtitle) + '</div>' : '') +
    '<div class="row th-chips">' + evStatusChip(ev.status) + (chips || '') + '</div>' +
    (ev.description ? '<p class="desc">' + esc(ev.description) + '</p>' : '') + (extra || '') + '</div>' + thValues() + '</div>';
}
function thCrumb() { return '<div class="row between crumbrow"><div class="crumb"><a href="#/">' + ic('arrowl') + ' หน้าแรก</a></div>' + helpBtn() + '</div>'; }
function thDraftKey(id) { return 'hrc_th:' + (S.me ? S.me.empCode : '') + ':' + id; }
function thDraftGet(id) { try { var v = localStorage.getItem(thDraftKey(id)); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function thDraftSet(id, v) { try { if (v == null) localStorage.removeItem(thDraftKey(id)); else localStorage.setItem(thDraftKey(id), JSON.stringify(v)); } catch (e) { } }

/** การ์ดหน้าแรก */
function thCard(ev) {
  var r = S.boot.mine[ev.id], cfg = ev.config || {}, left = daysLeft(ev.closeAt), st, btn, meta;
  if (ev.type === 'NOMINATE') {
    st = r ? '<span class="chip ok">' + ic('check') + ' เสนอชื่อแล้ว ' + nf(r.qty) + ' ชื่อ</span>' : ev.status === 'OPEN' ? '<span class="chip warn dot">ยังไม่ได้เสนอชื่อ</span>' : '<span class="chip">ไม่ได้เสนอชื่อ</span>';
    btn = r ? (ev.status === 'OPEN' ? 'ดู / แก้ไข' : 'ดูการเสนอชื่อ') : ev.status === 'OPEN' ? 'เสนอชื่อ' : 'ดูรายละเอียด';
    meta = '<span>' + ic('calendar') + ' ปิดรับ ' + esc(thDate(ev.closeAt)) + '</span>' + (ev.status === 'OPEN' && left != null ? '<span>' + ic('clock') + ' เหลือ ' + left + ' วัน</span>' : '');
  } else if (ev.type === 'QUESTION') {
    var n = (S.boot.myQuestions || {})[ev.id] || 0;
    st = n ? '<span class="chip ok">' + ic('check') + ' ส่งแล้ว ' + nf(n) + ' คำถาม</span>' : '<span class="chip">' + ic('lock') + ' ไม่ระบุชื่อผู้ถาม</span>';
    btn = ev.status === 'OPEN' ? (n ? 'ส่งเพิ่ม / ดูคำถาม' : 'ส่งคำถาม') : 'ดูรายละเอียด';
    meta = '<span>' + ic('calendar') + ' ปิดรับ ' + esc(thDate(ev.closeAt)) + '</span>' + (ev.status === 'OPEN' && left != null ? '<span>' + ic('clock') + ' เหลือ ' + left + ' วัน</span>' : '');
  } else {
    st = r ? '<span class="chip ok">' + ic('check') + ' เช็กอินแล้ว</span>' : '<span class="chip acc">' + ic('calendar') + ' ' + esc(thDate(cfg.date || cfg.checkinOpenAt, false)) + '</span>';
    btn = r ? 'ทำแบบประเมิน / ดู' : 'ดูกำหนดการ';
    meta = '<span>' + ic('clock') + ' ' + esc(cfg.timeText || thHHMM(cfg.checkinOpenAt)) + '</span><span>' + ic('building') + ' ' + esc(String(cfg.venue || '').split(' ชั้น')[0]) + '</span>';
  }
  return '<a class="evcard th-card" href="#/event/' + esc(ev.id) + '" style="--ec:' + esc(ev.color) + '"><div class="cover th-cover"><div class="th-coverin">' + ic(TH_ICON[ev.type]) + '<span>Hospital Town Hall</span></div>' +
    '<div class="tag">' + evStatusChip(ev.status) + '</div></div><div class="body"><h3>' + esc(ev.title) + '</h3><div class="meta">' + meta + '</div>' +
    '<div class="mystate">' + st + '<span class="btn sm ' + (!r && ev.status === 'OPEN' ? 'primary' : '') + '">' + btn + ' ' + ic('arrowr') + '</span></div></div></a>';
}

/** จุดเข้าหน้ากิจกรรม (เรียกจาก drawEvent) */
function drawTh() {
  var ev = EVS.ev;
  setAccent(ev.color || '#ED1C24');
  document.title = ev.title + ' · SOMDEJ HR Connect';
  clearInterval(window._thTimer);
  if (!EVS.x) { $('#page').innerHTML = thCrumb() + thHero(ev) + skel(2); return; }
  if (ev.type === 'NOMINATE') return drawNominate();
  if (ev.type === 'QUESTION') return drawQuestion();
  return drawDay();
}

/* =================================================================== เสนอชื่อบุคลากรดีเด่น */
var NM = { list: null, by: {}, evId: null };
function nmCfg() { var c = EVS.ev.config || {}; return { cats: c.categories || [], crit: c.criteria || [], short: c.criteriaShort || [], max: +c.maxPerCat || 3, quals: c.qualifications || [], notice: c.notice || [], refDoc: c.refDoc || '', allowSelf: c.allowSelf !== false, reasonMax: +c.reasonMax || 500 }; }
function nmShort(i) { var c = nmCfg(); return c.short[i] || c.crit[i] || ('ข้อ ' + (i + 1)); }
function nmMine() { var p = (EVS.x.nominations || {}).picks || {}, o = {}; Object.keys(p).forEach(function (k) { o[k] = p[k].map(function (x) { return { code: x.code, reasons: x.reasons || [], text: x.text || '' }; }); }); return o; }
function nmCount(d) { var n = 0; Object.keys(d || {}).forEach(function (k) { n += (d[k] || []).length; }); return n; }
function nmPerson(code) { var x = NM.by[code]; return x ? { name: x[1], position: x[2], unit: x[3], division: x[4], cat: x[5] } : null; }
function nmLoad() {
  if (NM.list && NM.evId === EVS.ev.id) return Promise.resolve(NM.list);
  return api('getNominees', { eventId: EVS.ev.id }, { fresh: true }).then(function (d) {
    NM.list = d.list; NM.evId = EVS.ev.id; NM.by = {}; d.list.forEach(function (x) { NM.by[x[0]] = x; }); return d.list;
  });
}
function drawNominate() {
  var ev = EVS.ev, c = nmCfg(), open = ev.status === 'OPEN', mineN = (EVS.x.nominations || {}).count || 0;
  if (EVS.nm == null) {
    var dr = thDraftGet(ev.id);
    EVS.nm = dr && open ? dr : nmMine();
    EVS.editing = !!(dr && open) || (!mineN && open);
    if (dr && open) setTimeout(function () { toast('กู้คืนรายการที่ท่านเลือกไว้แต่ยังไม่ได้กดบันทึก', 'info'); }, 400);
  }
  var h = thCrumb() + thHero(ev, '<span class="chip">' + ic('calendar') + ' ' + esc(thDate(ev.openAt, false)) + ' – ' + esc(thDate(ev.closeAt)) + '</span>', open ? '<div class="countdown" id="cd"></div>' : '');
  h += '<div class="noticebox th-notice">' + ic('info') + '<div><b>การเสนอชื่อ มิใช่การลงคะแนน</b><ul>' + c.notice.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
    '<details class="th-det"><summary>คุณสมบัติผู้ได้รับการพิจารณา</summary><ol>' + c.quals.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol></details>' +
    '<details class="th-det"><summary>หลักเกณฑ์ในการพิจารณา (8 ข้อ)</summary><ol>' + c.crit.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol></details>' +
    (c.refDoc ? '<div class="small muted" style="margin-top:6px">อ้างอิง: ' + esc(c.refDoc) + '</div>' : '') + '</div></div>';
  if (!open && !mineN) h += '<div class="card pad" style="text-align:center">' + (ev.status === 'UPCOMING' ? ic('clock') + ' เปิดรับการเสนอชื่อ ' + esc(thDate(ev.openAt)) : ic('ban') + ' ปิดรับการเสนอชื่อแล้ว ขอบคุณที่ให้ความสนใจ') + '</div>';
  if (!EVS.editing && mineN) h += nmSummaryHtml(open);
  else if (open) h += '<div id="nmForm">' + skel(2) + '</div>';
  $('#page').innerHTML = h;
  thCountdown(ev);
  var be = $('#nmEdit'); if (be) be.onclick = function () { EVS.editing = true; EVS.nm = nmMine(); drawNominate(); setTimeout(function () { var f = $('#nmForm'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); };
  if (EVS.editing && open) nmLoad().then(function () { if (S.route === 'event' && EVS.ev.type === 'NOMINATE') nmDrawForm(); }).catch(function (e) { errToast(e, 'โหลดรายชื่อไม่สำเร็จ'); });
}
function nmSummaryHtml(open) {
  var c = nmCfg(), p = (EVS.x.nominations || {}).picks || {}, n = (EVS.x.nominations || {}).count || 0, mine = EVS.mine;
  var h = '<div class="mybanner"><div class="big">' + ic('award') + '</div><div style="flex:1;min-width:200px"><div class="small" style="color:var(--ok);font-weight:700">' + ic('check') + ' บันทึกการเสนอชื่อแล้ว</div>' +
    '<h3>ท่านเสนอชื่อ ' + nf(n) + ' ชื่อ ใน ' + Object.keys(p).length + ' หมวด</h3><div class="small muted">' + (mine ? 'บันทึกล่าสุด ' + esc(thDate(mine.updatedAt)) + (mine.editCount ? ' · แก้ไข ' + mine.editCount + ' ครั้ง' : '') : '') + '</div></div>' +
    (open ? '<button class="btn" id="nmEdit">' + ic('edit') + ' แก้ไข / เพิ่มชื่อ</button>' : '<span class="chip">ปิดรับแล้ว</span>') + '</div>';
  h += '<div class="th-cats">' + c.cats.filter(function (cat) { return (p[cat.key] || []).length; }).map(function (cat) {
    return '<div class="card th-cat done"><div class="hd"><div><span class="th-catno">' + esc(cat.key) + '</span><b>' + esc(cat.label) + '</b></div></div><div class="bd">' + p[cat.key].map(function (x) {
      return '<div class="th-pk"><div class="avatar">' + esc(initials(x.name)) + '</div><div style="flex:1;min-width:0"><b>' + esc(x.name) + '</b><div class="small muted">' + esc([x.position, x.unit].filter(Boolean).join(' · ')) + '</div>' +
        (x.reasons.length ? '<div class="th-rs">' + x.reasons.map(function (i) { return '<span class="chip acc">' + esc(nmShort(i - 1)) + '</span>'; }).join('') + '</div>' : '') + (x.text ? '<div class="small th-txt">“' + esc(x.text) + '”</div>' : '') + '</div></div>';
    }).join('') + '</div></div>';
  }).join('') + '</div>';
  return h;
}
function nmDrawForm() {
  var c = nmCfg(), d = EVS.nm, total = nmCount(d), lastGroup = '', mine = (EVS.x.nominations || {}).count || 0;
  var h = '<div class="step" style="margin-bottom:10px"><div class="sh"><span class="no">' + ic('award') + '</span><div><h3>เลือกผู้ที่ท่านต้องการเสนอชื่อ</h3><div class="small muted">หมวดละไม่เกิน ' + c.max + ' ชื่อ · เลือกเฉพาะหมวดที่ท่านรู้จักผลงานก็ได้ · เหตุผลไม่บังคับ</div></div></div></div>';
  h += '<div class="th-cats">';
  c.cats.forEach(function (cat) {
    if (cat.group && cat.group !== lastGroup) { h += '<div class="th-group">' + esc(cat.group) + '</div>'; lastGroup = cat.group; }
    var arr = d[cat.key] || [], pool = NM.list.filter(function (x) { return x[5] === cat.key; }).length;
    h += '<div class="card th-cat' + (arr.length ? ' done' : '') + '" data-cat="' + esc(cat.key) + '"><div class="hd"><div style="min-width:0"><span class="th-catno">' + esc(cat.key) + '</span><b>' + esc(cat.label) + '</b>' + (cat.desc ? '<div class="small muted">' + esc(cat.desc) + '</div>' : '') + '</div>' +
      '<span class="chip ' + (arr.length ? 'ok' : '') + ' num">' + arr.length + '/' + c.max + '</span></div><div class="bd">' +
      arr.map(function (x, i) {
        var p = nmPerson(x.code) || { name: x.code, position: '', unit: '' };
        return '<div class="th-pk"><div class="avatar">' + esc(initials(p.name)) + '</div><div style="flex:1;min-width:0"><b>' + esc(p.name) + (x.code === S.me.empCode ? ' <span class="chip info">ตัวท่านเอง</span>' : '') + '</b><div class="small muted">' + esc([p.position, p.unit].filter(Boolean).join(' · ')) + '</div>' +
          '<details class="th-why"' + (x.reasons.length || x.text ? ' open' : '') + '><summary>' + ic('star') + ' เหตุผล / จุดเด่น (ไม่บังคับ)' + (x.reasons.length ? ' · ' + x.reasons.length + ' ข้อ' : '') + '</summary><div class="th-rs">' +
          c.crit.map(function (t, j) { var on = x.reasons.indexOf(j + 1) >= 0; return '<button type="button" class="chip ' + (on ? 'acc on' : '') + '" data-rs="' + cat.key + ':' + i + ':' + (j + 1) + '" title="' + esc(t) + '">' + (on ? ic('check') : '') + esc(nmShort(j)) + '</button>'; }).join('') +
          '</div><textarea class="input" rows="2" maxlength="' + c.reasonMax + '" data-tx="' + cat.key + ':' + i + '" placeholder="ผลงาน/พฤติกรรมที่ประทับใจ (ข้อความนี้ส่งถึงคณะกรรมการตามที่พิมพ์ กรุณาหลีกเลี่ยงข้อความที่ระบุตัวท่าน)">' + esc(x.text) + '</textarea></details></div>' +
          '<button type="button" class="iconbtn" data-rm="' + cat.key + ':' + i + '" title="นำออก" aria-label="นำออก">' + ic('x') + '</button></div>';
      }).join('') +
      (arr.length < c.max ? '<button type="button" class="btn th-add" data-add="' + esc(cat.key) + '"' + (pool ? '' : ' disabled') + '>' + ic('plus') + (pool ? 'เพิ่มชื่อในหมวดนี้' : 'ยังไม่มีรายชื่อในหมวดนี้') + '</button>' : '<div class="small muted">' + ic('check') + ' ครบ ' + c.max + ' ชื่อแล้ว</div>') +
      '</div></div>';
  });
  h += '</div>';
  h += '<div class="actionbar"><div class="sum"><small>' + (mine ? 'แก้ไขการเสนอชื่อ' : 'รายการที่เลือก') + '</small><b>' + (total ? 'เสนอชื่อ ' + nf(total) + ' ชื่อ · ' + Object.keys(d).filter(function (k) { return (d[k] || []).length; }).length + ' หมวด' : '<span style="opacity:.6">ยังไม่ได้เลือก</span>') + '</b></div>' +
    (mine ? '<button class="btn" id="nmCancel" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)">ยกเลิก</button>' : '') +
    '<button class="btn primary" id="nmSave" ' + (total ? '' : 'disabled') + '>' + ic('send') + (mine ? 'บันทึกการแก้ไข' : 'ยืนยันการเสนอชื่อ') + '</button></div>';
  if (mine) h += '<div class="declinelink"><button class="btn ghost" id="nmClear">' + ic('trash') + ' ยกเลิกการเสนอชื่อทั้งหมด</button></div>';
  $('#nmForm').innerHTML = h;
  var save = function () { thDraftSet(EVS.ev.id, EVS.nm); };
  $$('[data-add]').forEach(function (b) { b.onclick = function () { nmPicker(b.dataset.add); }; });
  $$('[data-rm]').forEach(function (b) { b.onclick = function () { var p = b.dataset.rm.split(':'); d[p[0]].splice(+p[1], 1); if (!d[p[0]].length) delete d[p[0]]; save(); nmDrawForm(); }; });
  $$('[data-rs]').forEach(function (b) { b.onclick = function () { var p = b.dataset.rs.split(':'), x = d[p[0]][+p[1]], n = +p[2], i = x.reasons.indexOf(n); if (i >= 0) x.reasons.splice(i, 1); else { x.reasons.push(n); x.reasons.sort(); } save(); nmDrawForm(); }; });
  $$('[data-tx]').forEach(function (t) { t.oninput = debounce(function () { var p = t.dataset.tx.split(':'); d[p[0]][+p[1]].text = t.value; save(); }, 300); });
  var bc = $('#nmCancel'); if (bc) bc.onclick = function () { thDraftSet(EVS.ev.id, null); EVS.editing = false; EVS.nm = null; drawNominate(); };
  var cl = $('#nmClear'); if (cl) cl.onclick = function () {
    confirmBox({ title: 'ยกเลิกการเสนอชื่อทั้งหมด?', msg: 'รายชื่อที่ท่านเคยเสนอจะถูกลบ (เสนอใหม่ได้จนถึงวันปิดรับ)', ok: 'ยกเลิกทั้งหมด', icon: 'trash' }).then(function (y) {
      if (!y) return;
      api('submitNominations', { eventId: EVS.ev.id, clear: true }).then(function (r) { nmAfter(r, 'ยกเลิกการเสนอชื่อแล้ว'); }).catch(errToast);
    });
  };
  $('#nmSave').onclick = nmConfirm;
}
function nmPicker(cat) {
  var c = nmCfg(), catObj = c.cats.filter(function (x) { return x.key === cat; })[0] || {}, taken = (EVS.nm[cat] || []).map(function (x) { return x.code; });
  var list = NM.list.filter(function (x) { return x[5] === cat && taken.indexOf(x[0]) < 0 && (c.allowSelf || x[0] !== S.me.empCode); });
  var m = modal({ title: 'เพิ่มชื่อ · ' + esc(cat + ' ' + (catObj.label || '')), size: 'lg', body: '<input class="input search" id="npQ" placeholder="พิมพ์ชื่อ นามสกุล ตำแหน่ง หรือหน่วยงาน" autocomplete="off"><div class="small muted" style="margin:8px 0" id="npN"></div><div class="th-plist" id="npL"></div>' });
  var draw = function () {
    var q = $('#npQ').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var hit = list.filter(function (x) { var s = (x[1] + ' ' + x[2] + ' ' + x[3] + ' ' + x[4]).toLowerCase(); return q.every(function (w) { return s.indexOf(w) >= 0; }); });
    $('#npN').textContent = q.length ? 'พบ ' + nf(hit.length) + ' คน' + (hit.length > 60 ? ' (แสดง 60 คนแรก พิมพ์เพิ่มเพื่อค้นให้แคบลง)' : '') : 'ในหมวดนี้มี ' + nf(list.length) + ' คน · พิมพ์เพื่อค้นหา';
    $('#npL').innerHTML = (q.length ? hit : hit.slice(0, 30)).slice(0, 60).map(function (x) {
      return '<button type="button" class="th-pitem" data-pk="' + esc(x[0]) + '"><span class="avatar">' + esc(initials(x[1])) + '</span><span style="flex:1;min-width:0;text-align:left"><b>' + esc(x[1]) + (x[0] === S.me.empCode ? ' <span class="chip info">ตัวท่านเอง</span>' : '') + '</b><small>' + esc([x[2], x[3], x[4]].filter(Boolean).join(' · ')) + '</small></span>' + ic('plus') + '</button>';
    }).join('') || '<div class="empty">' + ic('search') + '<p>ไม่พบรายชื่อ</p></div>';
    $$('[data-pk]', m.el).forEach(function (b) { b.onclick = function () { (EVS.nm[cat] = EVS.nm[cat] || []).push({ code: b.dataset.pk, reasons: [], text: '' }); thDraftSet(EVS.ev.id, EVS.nm); m.close(); nmDrawForm(); toast('เพิ่ม ' + NM.by[b.dataset.pk][1] + ' แล้ว', 'ok'); }; });
  };
  $('#npQ').oninput = debounce(draw, 120); draw(); setTimeout(function () { $('#npQ').focus(); }, 60);
}
function nmConfirm() {
  var c = nmCfg(), d = EVS.nm, total = nmCount(d);
  var body = '<div class="center"><div class="bigicon acc">' + ic('award') + '</div><div class="small muted">กรุณาตรวจสอบก่อนยืนยัน</div><div class="pickconfirm">เสนอชื่อ ' + nf(total) + ' ชื่อ</div></div><div class="th-confirm">' +
    c.cats.filter(function (cat) { return (d[cat.key] || []).length; }).map(function (cat) {
      return '<div><b>' + esc(cat.key + ' ' + cat.label) + '</b><ul>' + d[cat.key].map(function (x) { var p = nmPerson(x.code) || { name: x.code }; return '<li>' + esc(p.name) + (x.reasons.length ? ' <span class="small muted">· ' + x.reasons.length + ' หลักการ</span>' : '') + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div><div class="small muted center">แก้ไขได้จนถึง ' + esc(thDate(EVS.ev.closeAt)) + ' · ผลการคัดเลือกเป็นอำนาจของคณะกรรมการ</div>';
  var m = modal({ title: '', body: body, foot: '<button class="btn" data-x>ตรวจสอบอีกครั้ง</button><button class="btn primary" id="nmOk" data-busy="กำลังบันทึก…">' + ic('send') + 'ยืนยันการเสนอชื่อ</button>' });
  $('#nmOk').onclick = function () {
    var picks = {}; Object.keys(d).forEach(function (k) { picks[k] = d[k].map(function (x) { return { code: x.code, reasons: x.reasons, text: x.text }; }); });
    busy(this, api('submitNominations', { eventId: EVS.ev.id, picks: picks })).then(function (r) { m.close(); nmAfter(r, 'บันทึกการเสนอชื่อ ' + nf(total) + ' ชื่อ เรียบร้อย'); }).catch(function (e) { errToast(e, 'บันทึกไม่สำเร็จ'); if (/รีเฟรช/.test(e.message)) { NM.list = null; } });
  };
}
function nmAfter(r, msg) {
  thDraftSet(EVS.ev.id, null);
  EVS.x.nominations = r.nominations; EVS.mine = r.mine; EVS.editing = false; EVS.nm = null;
  if (r.mine) S.boot.mine[EVS.ev.id] = r.mine; else delete S.boot.mine[EVS.ev.id];
  drawNominate(); window.scrollTo(0, 0);
  if (!r.mine) return toast(msg, 'ok');
  modal({ title: '', foot: '<button class="btn primary block" data-x>เรียบร้อย</button>', body: thBurst('ขอบคุณที่ร่วมเสนอชื่อ!', msg + (r.mailed ? '<br>' + ic('mail') + ' ส่งอีเมลยืนยันถึงท่านแล้ว' : '') + '<br>ระบบไม่แสดงชื่อผู้เสนอให้ผู้ใดเห็น') });
}
function thBurst(title, msg) {
  var colors = ['#ED1C24', '#f2b705', '#1f8a5b', '#2563eb', '#8e4b9d'], conf = '';
  for (var i = 0; i < 26; i++) conf += '<i style="left:' + (Math.random() * 100) + '%;background:' + colors[i % colors.length] + ';animation-delay:' + (Math.random() * .3) + 's"></i>';
  return '<div class="success-burst center"><div class="confetti">' + conf + '</div><div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3 style="font-size:22px">' + title + '</h3><p class="muted" style="margin:6px 0 0">' + msg + '</p></div>';
}
function thCountdown(ev) {
  var cd = $('#cd'); if (!cd) return;
  var tick = function () {
    if (!document.body.contains(cd)) return clearInterval(window._thTimer);
    var ms = parseLocal(ev.closeAt) - new Date();
    if (ms <= 0) { cd.innerHTML = '<span class="chip">ปิดรับแล้ว</span>'; return clearInterval(window._thTimer); }
    var d = Math.floor(ms / 86400000), hh = Math.floor(ms % 86400000 / 3600000), mm = Math.floor(ms % 3600000 / 60000);
    cd.innerHTML = '<div class="cd"><b>' + d + '</b><small>วัน</small></div><div class="cd"><b>' + hh + '</b><small>ชั่วโมง</small></div><div class="cd"><b>' + mm + '</b><small>นาที</small></div><div class="small muted" style="align-self:center">ก่อนปิดรับ</div>';
  };
  tick(); window._thTimer = setInterval(tick, 30000);
}

/* =================================================================== ส่งคำถามถึงผู้บริหาร */
function drawQuestion() {
  var ev = EVS.ev, q = EVS.x.qna || {}, ch = q.channel, mine = q.mine || [];
  var h = thCrumb() + thHero(ev, '<span class="chip">' + ic('calendar') + ' รับคำถามถึง ' + esc(thDate(ev.closeAt)) + '</span>', ch === 'ADVANCE' ? '<div class="countdown" id="cd"></div>' : '');
  if (ch === 'ROOM') h += '<div class="announce th-room">' + ic('tv') + '<div><b>ขณะนี้เปิดรับคำถามจากในห้องประชุม</b> · ส่งคำถามได้ทันที ผู้ดำเนินรายการจะคัดเลือกคำถามขึ้นถาม–ตอบ</div></div>';
  h += '<div class="th-privacy"><div class="hd">' + ic('shield') + '<b>คำชี้แจงการคุ้มครองข้อมูลผู้ส่งคำถาม</b></div><p>ฝ่ายทรัพยากรบุคคลจัดช่องทางนี้ขึ้นด้วยเจตนาให้บุคลากรทุกท่านได้สื่อสารกับผู้บริหารอย่างตรงไปตรงมาและปลอดภัย จึงขอเรียนให้ทราบถึงแนวปฏิบัติในการดูแลข้อมูลของท่าน ดังนี้</p><ol>' +
    (q.privacy || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol><p class="muted small" style="margin:6px 0 0">ฝ่ายทรัพยากรบุคคลขอขอบคุณทุกคำถามและทุกความคิดเห็น ซึ่งเป็นส่วนสำคัญในการพัฒนาโรงพยาบาลของเราร่วมกัน</p></div>';
  if (ch) {
    var draft = thDraftGet(ev.id) || {};
    h += '<div class="card th-ask"><div class="hd"><h3>' + ic('chat') + ' พิมพ์คำถามของท่าน</h3><span class="small muted">ส่งได้ไม่จำกัดจำนวน · 1 ประเด็นต่อ 1 คำถาม จะช่วยให้ผู้บริหารตอบได้ตรงขึ้น</span></div><div class="bd">' +
      '<textarea class="input" id="qText" rows="5" maxlength="' + (q.maxLen || 1500) + '" placeholder="เช่น โรงพยาบาลมีแผนพัฒนาที่จอดรถสำหรับบุคลากรอย่างไร">' + esc(draft.text || '') + '</textarea>' +
      '<div class="row between" style="margin-top:8px"><span class="small muted num" id="qCnt"></span>' + (q.allowShowName ? '<label class="th-check"><input type="checkbox" id="qName"' + (draft.showName ? ' checked' : '') + '> ยินดีเปิดเผยชื่อของข้าพเจ้าพร้อมคำถาม (ไม่บังคับ)</label>' : '') + '</div>' +
      '<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary lg" id="qSend" data-busy="กำลังส่ง…">' + ic('send') + 'ส่งคำถาม</button></div></div></div>';
  } else {
    h += '<div class="card pad" style="text-align:center">' + (ev.status === 'UPCOMING' ? ic('clock') + ' เปิดรับคำถาม ' + esc(thDate(ev.openAt)) : ic('check') + ' ปิดรับคำถามล่วงหน้าแล้ว ขอบคุณสำหรับทุกคำถาม · คำตอบของผู้บริหารจะเผยแพร่บนเว็บไซต์โรงพยาบาลภายหลังงาน') + '</div>';
  }
  h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('history') + ' คำถามของฉัน (' + mine.length + ')</h3><span class="small muted">' + ic('lock') + ' เห็นเฉพาะท่าน · ผู้บริหารไม่เห็นชื่อผู้ถาม</span></div><div class="bd">' +
    (mine.length ? mine.map(function (m) {
      var canEdit = (m.channel === 'ROOM' && ch === 'ROOM') || (m.channel !== 'ROOM' && ch === 'ADVANCE');
      return '<div class="th-myq" data-q="' + esc(m.id) + '"><div class="small muted">' + esc(thDate(m.createdAt)) + (m.channel === 'ROOM' ? ' · ถามในห้องประชุม' : '') + (m.showName ? ' · เปิดเผยชื่อ' : ' · ไม่ระบุชื่อ') + (m.updatedAt !== m.createdAt ? ' · แก้ไขแล้ว' : '') + '</div>' +
        '<div class="t">' + esc(m.text).replace(/\n/g, '<br>') + '</div>' + (canEdit ? '<div class="row" style="margin-top:6px"><button class="btn sm" data-qe="' + esc(m.id) + '">' + ic('edit') + 'แก้ไข</button><button class="btn sm danger" data-qd="' + esc(m.id) + '">' + ic('trash') + 'ลบ</button></div>' : '') + '</div>';
    }).join('') : '<div class="muted small">ยังไม่มีคำถาม</div>') + '</div></div>';
  if ((ev.config || {}).contact) h += '<div class="contactbox">' + ic('phone') + '<div>หากมีข้อสงสัย กรุณาติดต่อ <b>' + esc(ev.config.contact.name) + '</b>' + (ev.config.contact.phone ? ' โทร. <b class="num">' + esc(ev.config.contact.phone) + '</b>' : '') + '</div></div>';
  $('#page').innerHTML = h;
  if (ch === 'ADVANCE') thCountdown(ev);
  var tx = $('#qText');
  if (tx) {
    var cnt = function () { $('#qCnt').textContent = tx.value.length + ' / ' + (q.maxLen || 1500) + ' ตัวอักษร'; };
    tx.oninput = function () { cnt(); thDraftSet(ev.id, { text: tx.value, showName: $('#qName') && $('#qName').checked }); }; cnt();
    var nm = $('#qName'); if (nm) nm.onchange = tx.oninput;
    $('#qSend').onclick = function () {
      var text = tx.value.trim(), show = !!($('#qName') && $('#qName').checked);
      if (text.length < 5) return toast('กรุณาพิมพ์คำถามอย่างน้อย 5 ตัวอักษร', 'warn');
      busy(this, api('submitQuestion', { eventId: ev.id, text: text, showName: show })).then(function (r) {
        thDraftSet(ev.id, null); q.mine = r.mine; S.boot.myQuestions = S.boot.myQuestions || {}; S.boot.myQuestions[ev.id] = r.mine.length;
        drawQuestion();
        modal({ title: '', foot: '<button class="btn primary block" data-x>ส่งคำถามเพิ่ม / เสร็จสิ้น</button>', body: thBurst('ส่งคำถามเรียบร้อย', 'ฝ่ายทรัพยากรบุคคลได้รับคำถามของท่านแล้ว<br>คำถามจะส่งถึงผู้บริหาร' + (show ? 'พร้อมชื่อของท่านตามที่ท่านเลือก' : '<b>โดยไม่ระบุชื่อผู้ถาม</b>')) });
      }).catch(function (e) { errToast(e, 'ส่งคำถามไม่สำเร็จ'); });
    };
  }
  $$('[data-qe]').forEach(function (b) {
    b.onclick = function () {
      var m0 = mine.filter(function (x) { return x.id === b.dataset.qe; })[0];
      var m = modal({ title: 'แก้ไขคำถาม', body: '<textarea class="input" id="qeT" rows="6" maxlength="' + (q.maxLen || 1500) + '">' + esc(m0.text) + '</textarea>' + (q.allowShowName ? '<label class="th-check" style="margin-top:8px"><input type="checkbox" id="qeN"' + (m0.showName ? ' checked' : '') + '> ยินดีเปิดเผยชื่อของข้าพเจ้าพร้อมคำถาม</label>' : ''),
        foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="qeOk" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button>' });
      $('#qeOk').onclick = function () { busy(this, api('editMyQuestion', { eventId: ev.id, id: m0.id, text: $('#qeT').value.trim(), showName: !!($('#qeN') && $('#qeN').checked) })).then(function (r) { m.close(); q.mine = r.mine; drawQuestion(); toast('แก้ไขคำถามแล้ว', 'ok'); }).catch(errToast); };
    };
  });
  $$('[data-qd]').forEach(function (b) {
    b.onclick = function () {
      confirmBox({ title: 'ลบคำถามนี้?', msg: 'ลบแล้วกู้คืนไม่ได้', ok: 'ลบคำถาม', icon: 'trash' }).then(function (y) {
        if (!y) return;
        api('deleteMyQuestion', { eventId: ev.id, id: b.dataset.qd }).then(function (r) { q.mine = r.mine; S.boot.myQuestions[ev.id] = r.mine.length; drawQuestion(); toast('ลบคำถามแล้ว', 'ok'); }).catch(errToast);
      });
    };
  });
}

/* =================================================================== วันงาน: กำหนดการ · เช็กอิน · แบบประเมิน */
function drawDay() {
  var ev = EVS.ev, cfg = ev.config || {}, ci = EVS.x.checkin || {};
  if (EVS.evalMode && ci.canEval) return drawEval();
  var h = thCrumb() + thHero(ev, '<span class="chip acc">' + ic('calendar') + ' ' + esc(thDate(cfg.date || cfg.checkinOpenAt, false)) + '</span>' + (cfg.timeText ? '<span class="chip">' + ic('clock') + ' ' + esc(cfg.timeText) + '</span>' : '') + (cfg.venue ? '<span class="chip">' + ic('building') + ' ' + esc(cfg.venue) + '</span>' : ''));
  var st;
  if (ci.checkedIn) {
    st = '<div class="mybanner"><div class="big">' + ic('check') + '</div><div style="flex:1;min-width:200px"><div class="small" style="color:var(--ok);font-weight:700">เช็กอินแล้ว</div><h3>ยินดีต้อนรับสู่ Hospital Town Hall</h3><div class="small muted">' + esc(thDate(ci.checkedAt)) + (ci.method === 'DESK' ? ' · ลงชื่อที่โต๊ะลงทะเบียน' : '') + '</div></div>' +
      (ci.canEval ? '<button class="btn primary" id="goEval">' + ic('edit') + ' ทำแบบประเมิน</button>' : ci.evalDone ? '<span class="chip ok">' + ic('check') + ' ทำแบบประเมินแล้ว ขอบคุณค่ะ/ครับ</span>' : '') + '</div>';
  } else if (ci.window === 'OPEN') {
    st = '<div class="card th-scan"><div class="bd"><div class="bigicon acc">' + ic('qr') + '</div><h3>เช็กอินเข้างาน</h3><p>สแกน <b>QR Code บนจอหน้าห้องประชุม</b> ด้วยกล้องโทรศัพท์ของท่าน ระบบจะบันทึกการเข้าร่วมทันที</p>' +
      (!ci.requireQr ? '<button class="btn primary lg" id="ciNow" data-busy="กำลังเช็กอิน…">' + ic('check') + 'เช็กอินตอนนี้</button>' : '<div class="small muted">ไม่สะดวกสแกน? แจ้งเจ้าหน้าที่ที่โต๊ะลงทะเบียน</div>') + '</div></div>';
  } else if (ci.window === 'BEFORE') {
    st = '<div class="card th-scan"><div class="bd"><div class="bigicon">' + ic('qr') + '</div><h3>เปิดเช็กอิน ' + esc(thDate(cfg.checkinOpenAt)) + '</h3><p>วันงานกรุณาสแกน <b>QR Code บนจอหน้าห้องประชุม</b> ด้วยกล้องโทรศัพท์เพื่อเช็กอิน (เข้าสู่ระบบไว้ล่วงหน้าจะสะดวกขึ้น)</p></div></div>';
  } else {
    st = '<div class="card pad" style="text-align:center">' + ic('ban') + ' ปิดเช็กอินแล้ว' + (ci.canEval ? '<div style="margin-top:12px"><button class="btn primary" id="goEval">' + ic('edit') + ' ทำแบบประเมิน</button></div>' : '') + '</div>';
  }
  h += st;
  var ag = cfg.agenda || [];
  if (ag.length) h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('calendar') + ' กำหนดการ</h3>' + (cfg.timeText ? '<span class="small muted">' + esc(cfg.timeText) + '</span>' : '') + '</div><div class="bd"><ol class="th-agenda">' +
    ag.map(function (a) { return '<li><span class="tm">' + esc(a.time || '') + '</span><div><b>' + esc(a.title) + '</b>' + (a.by ? '<div class="small muted">' + esc(a.by) + '</div>' : '') + '</div></li>'; }).join('') + '</ol></div></div>';
  if (cfg.contact) h += '<div class="contactbox">' + ic('phone') + '<div>สอบถาม <b>' + esc(cfg.contact.name) + '</b>' + (cfg.contact.phone ? ' โทร. <b class="num">' + esc(cfg.contact.phone) + '</b>' : '') + '</div></div>';
  $('#page').innerHTML = h;
  var ge = $('#goEval'); if (ge) ge.onclick = function () { EVS.evalMode = true; drawDay(); window.scrollTo(0, 0); };
  var cn = $('#ciNow'); if (cn) cn.onclick = function () { busy(this, api('checkinSelf', { eventId: ev.id })).then(function (r) { EVS.x.checkin = r.info; S.boot.mine[ev.id] = { status: 'ORDERED' }; drawDay(); toast('เช็กอินเรียบร้อย', 'ok'); }).catch(errToast); };
}
var EV_SCALE = { scale5: ['น้อยที่สุด', 'น้อย', 'ปานกลาง', 'มาก', 'มากที่สุด'], agree5: ['ไม่เห็นด้วยอย่างยิ่ง', 'ไม่เห็นด้วย', 'เฉย ๆ', 'เห็นด้วย', 'เห็นด้วยอย่างยิ่ง'] };
function drawEval() {
  var ev = EVS.ev, cfg = ev.config || {}, secs = cfg.eval || [];
  EVS.ans = EVS.ans || thDraftGet(ev.id + ':eval') || {};
  var A = EVS.ans, req = 0, done = 0;
  secs.forEach(function (s) { (s.items || []).forEach(function (it) { if (it.required) { req++; if (A[it.key] != null && A[it.key] !== '' && !(Array.isArray(A[it.key]) && !A[it.key].length)) done++; } }); });
  var h = '<div class="row between crumbrow"><div class="crumb"><a href="#/event/' + esc(ev.id) + '" id="evBack">' + ic('arrowl') + ' กลับหน้ากิจกรรม</a></div></div>';
  h += '<div class="th-evalhead"><div class="th-kicker">' + ic('edit') + ' แบบประเมินความพึงพอใจ</div><h1>' + esc(ev.title.replace(/ · เช็กอินและแบบประเมิน$/, '')) + '</h1><p>' + esc(cfg.evalIntro || '') + '</p>' + progBar(req ? Math.round(done * 100 / req) : 100) + '<div class="small muted num">ข้อบังคับตอบแล้ว ' + done + ' / ' + req + '</div></div>';
  secs.forEach(function (s, si) {
    h += '<div class="card th-esec"><div class="hd"><div><h3>' + esc(s.title) + '</h3>' + (s.desc ? '<div class="small muted">' + esc(s.desc) + '</div>' : '') + '</div></div><div class="bd">';
    (s.items || []).forEach(function (it) {
      if (it.type === 'heading') { h += '<div class="th-eh">' + esc(it.label) + '</div>'; return; }
      var v = A[it.key], miss = EVS.evalTried && it.required && (v == null || v === '' || (Array.isArray(v) && !v.length));
      h += '<div class="th-eq' + (miss ? ' miss' : '') + '" id="eq_' + esc(it.key) + '"><div class="lbl">' + esc(it.label) + (it.required ? ' <span class="req">*</span>' : '') + '</div>';
      if (EV_SCALE[it.type]) h += '<div class="th-scale">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="' + (+v === n ? 'on' : '') + '" data-ev="' + esc(it.key) + '" data-v="' + n + '" title="' + EV_SCALE[it.type][n - 1] + '"><b>' + n + '</b><small>' + EV_SCALE[it.type][n - 1] + '</small></button>'; }).join('') + '</div>';
      else if (it.type === 'single') h += '<div class="th-opts">' + (it.options || []).map(function (o) { return '<label class="th-opt' + (v === o ? ' on' : '') + '"><input type="radio" name="r_' + esc(it.key) + '" data-es="' + esc(it.key) + '" value="' + esc(o) + '"' + (v === o ? ' checked' : '') + '>' + esc(o) + '</label>'; }).join('') +
        (it.other ? '<label class="th-opt' + (v === '__other' ? ' on' : '') + '"><input type="radio" name="r_' + esc(it.key) + '" data-es="' + esc(it.key) + '" value="__other"' + (v === '__other' ? ' checked' : '') + '>อื่น ๆ <input class="input sm" data-eo="' + esc(it.key) + '" value="' + esc(A[it.key + '_other'] || '') + '" placeholder="ระบุ"></label>' : '') + '</div>';
      else if (it.type === 'multi') h += '<div class="th-opts">' + (it.options || []).map(function (o) { var on = (v || []).indexOf(o) >= 0; return '<label class="th-opt' + (on ? ' on' : '') + '"><input type="checkbox" data-em="' + esc(it.key) + '" value="' + esc(o) + '"' + (on ? ' checked' : '') + '>' + esc(o) + '</label>'; }).join('') +
        (it.other ? '<label class="th-opt">อื่น ๆ <input class="input sm" data-eo="' + esc(it.key) + '" value="' + esc(A[it.key + '_other'] || '') + '" placeholder="ระบุ"></label>' : '') + '</div>';
      else h += '<textarea class="input" rows="3" maxlength="2000" data-et="' + esc(it.key) + '">' + esc(v || '') + '</textarea>';
      h += '</div>';
    });
    h += '</div></div>';
  });
  h += '<div class="actionbar"><div class="sum"><small>แบบประเมิน (ไม่ระบุตัวตน)</small><b>ตอบแล้ว ' + done + ' / ' + req + ' ข้อบังคับ</b></div><button class="btn primary" id="evSend" data-busy="กำลังส่ง…">' + ic('send') + 'ส่งแบบประเมิน</button></div>';
  $('#page').innerHTML = h;
  var save = function () { thDraftSet(ev.id + ':eval', A); };
  $('#evBack').onclick = function (e) { e.preventDefault(); EVS.evalMode = false; drawDay(); };
  $$('[data-ev]').forEach(function (b) { b.onclick = function () { A[b.dataset.ev] = +b.dataset.v; save(); var y = window.scrollY; drawEval(); window.scrollTo(0, y); }; });
  $$('[data-es]').forEach(function (r) { r.onchange = function () { A[r.dataset.es] = r.value; save(); var y = window.scrollY; drawEval(); window.scrollTo(0, y); }; });
  $$('[data-em]').forEach(function (c) { c.onchange = function () { var a = A[c.dataset.em] = A[c.dataset.em] || [], i = a.indexOf(c.value); if (c.checked && i < 0) a.push(c.value); if (!c.checked && i >= 0) a.splice(i, 1); save(); c.parentNode.classList.toggle('on', c.checked); }; });
  $$('[data-eo]').forEach(function (t) { t.oninput = debounce(function () { A[t.dataset.eo + '_other'] = t.value; save(); }, 250); });
  $$('[data-et]').forEach(function (t) { t.oninput = debounce(function () { A[t.dataset.et] = t.value; save(); }, 250); });
  $('#evSend').onclick = function () {
    EVS.evalTried = true;
    var miss = $$('.th-eq').filter(function () { return false; });
    busy(this, api('submitEval', { eventId: ev.id, answers: A })).then(function (r) {
      thDraftSet(ev.id + ':eval', null); EVS.ans = null; EVS.evalMode = false; EVS.x.checkin = r.info; drawDay(); window.scrollTo(0, 0);
      modal({ title: '', foot: '<button class="btn primary block" data-x>เรียบร้อย</button>', body: thBurst('ขอบคุณสำหรับความคิดเห็น', 'ฝ่ายทรัพยากรบุคคลจะนำไปพัฒนาการจัดงานครั้งต่อไป') });
    }).catch(function (e) {
      errToast(e, 'ส่งไม่สำเร็จ');
      if (/ตอบให้ครบ/.test(e.message)) { var y = window.scrollY; drawEval(); window.scrollTo(0, y); var f = $('.th-eq.miss'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  };
}

/** สแกน QR หน้างาน → #/checkin/EVENT?k=CODE */
ROUTES.checkin = function (params, q) {
  var id = params[0];
  if (!id) return go('#/');
  $('#page').innerHTML = '<div class="card pad center" style="margin-top:30px"><div class="bigicon acc">' + ic('qr') + '</div><h3>กำลังเช็กอิน…</h3><p class="muted">' + esc(S.me.name) + '</p></div>';
  api('checkinSelf', { eventId: id, k: q.k || '' }).then(function (r) {
    S.boot.mine[id] = { status: 'ORDERED', updatedAt: r.at };
    $('#page').innerHTML = '<div class="card th-cidone">' + thBurst(r.already ? 'ท่านเช็กอินแล้ว' : 'เช็กอินเรียบร้อย!', esc(r.name) + '<br>' + esc(thDate(r.at)) + '<br>ยินดีต้อนรับสู่ Hospital Town Hall') +
      '<div class="row" style="justify-content:center;margin-top:16px"><a class="btn primary" href="#/event/' + esc(id) + '">' + ic('calendar') + ' ดูกำหนดการ / แบบประเมิน</a></div></div>';
  }).catch(function (e) {
    $('#page').innerHTML = '<div class="card pad center" style="margin-top:30px"><div class="bigicon warn">' + ic('alert') + '</div><h3>เช็กอินไม่สำเร็จ</h3><p>' + esc(e.message) + '</p><div class="row" style="justify-content:center"><a class="btn" href="#/event/' + esc(id) + '">ไปหน้ากิจกรรม</a></div></div>';
  });
};

/* =================================================================== ผู้ดูแล: แท็บของกิจกรรม Town Hall */
function thWsTabs(ev) {
  var t = ev.type === 'NOMINATE'
    ? [['overview', 'ภาพรวม', 'chart'], ['tracking', 'ติดตามรายบุคคล', 'users'], ['results', 'ผลการเสนอชื่อ / ตรวจคุณสมบัติ', 'award'], ['pool', 'รายชื่อ / หมวดตำแหน่ง', 'layers'], ['mail', 'อีเมล', 'mail'], ['settings', 'ตั้งค่า', 'settings']]
    : ev.type === 'QUESTION'
      ? [['questions', 'จัดการคำถาม', 'chat'], ['qstats', 'ภาพรวม', 'chart'], ['exec', 'ส่งผู้บริหาร', 'send'], ['room', 'จอถามในห้อง', 'tv'], ['mail', 'อีเมล', 'mail'], ['settings', 'ตั้งค่า', 'settings']]
      : [['live', 'จอเช็กอิน (QR)', 'qr'], ['desk', 'โต๊ะลงทะเบียน', 'user'], ['overview', 'ผู้เข้าร่วม', 'chart'], ['tracking', 'รายชื่อ', 'users'], ['evalres', 'ผลแบบประเมิน', 'table'], ['settings', 'ตั้งค่า', 'settings']];
  if (!canEv(ev.id)) t = t.filter(function (x) { return ['overview', 'tracking'].indexOf(x[0]) >= 0; });
  return t;
}
function thTabFns(ev) {
  return { overview: function () { thOverview(ev); }, results: function () { awResults(ev); }, pool: function () { awPool(ev); }, questions: function () { qAdmin(ev); }, qstats: function () { qStats(ev); },
    exec: function () { qExec(ev); }, room: function () { qRoom(ev); }, live: function () { ciLive(ev); }, desk: function () { ciDesk(ev); }, evalres: function () { ciEvalRes(ev); } };
}
function thStale(evId, tab) { return S.route !== 'admin/ev' || S.lastAdminEvent !== evId || (tab && S.wsTab !== tab); }
function kpi(label, val, sub, color, icon) { return '<div class="kpi"><small>' + (icon ? ic(icon) + ' ' : '') + esc(label) + '</small><b class="num"' + (color ? ' style="color:' + color + '"' : '') + '>' + val + '</b>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>'; }
function hbars(list, max, opt) {
  opt = opt || {}; max = max || 1;
  return list.map(function (x) { return '<div class="pbar"><div class="row between" style="gap:8px;flex-wrap:nowrap"><span class="lbl2">' + esc(x.label) + '</span><span class="small num" style="white-space:nowrap"><b>' + nf(x.n) + '</b>' + (x.sub ? ' ' + x.sub : '') + '</span></div><div class="track"><div class="fill" style="width:' + (x.n / max * 100) + '%"></div></div></div>'; }).join('') || '<div class="muted small">ยังไม่มีข้อมูล</div>';
}

/* ---------- ภาพรวม (เสนอชื่อ = ความร่วมมือ · เช็กอิน = ผู้เข้าร่วม) ---------- */
function thOverview(ev) {
  $('#page').innerHTML = skel(2);
  var draw = function (d) {
    if (thStale(ev.id, 'overview')) return;
    var k = d.kpi, ci = ev.type === 'CHECKIN', divs = d.byDivision.slice().sort(function (a, b) { return ci ? b.ordered - a.ordered : a.pct - b.pct; });
    var tl = d.timeline.slice(-21), maxT = 1; tl.forEach(function (t) { maxT = Math.max(maxT, t.n); });
    var h = pageHead(ci ? 'ผู้เข้าร่วม' : 'ภาพรวมการเสนอชื่อ', 'ข้อมูล ณ ' + esc(thShort(d.generatedAt)), '<button class="btn" id="oR">' + ic('refresh') + 'รีเฟรช</button>');
    h += scopeNote(ev.id);
    h += '<div class="kpis">' + (ci
      ? kpi('เช็กอินแล้ว', nf(k.ordered), 'คน', 'var(--ok)', 'check') + kpi('บุคลากรทั้งหมด', nf(k.target), 'คน', '', 'users') + kpi('สัดส่วน', k.pct + '%', 'ของบุคลากรทั้งหมด', '', 'chart') + kpi('ลงชื่อที่โต๊ะ', nf(k.byAdmin), 'คน', '', 'user')
      : '<div class="kpi hero"><small>' + ic('chart') + ' ร่วมเสนอชื่อ</small><b class="num">' + k.pct + '%</b><div class="sub">' + nf(k.ordered) + ' จาก ' + nf(k.target) + ' คน</div>' + ring(k.pct, 70) + '</div>' +
        kpi('เสนอชื่อแล้ว', nf(k.ordered), 'คน', 'var(--ok)', 'award') + kpi('ยังไม่เสนอชื่อ', nf(k.pending), 'คน', 'var(--warn)', 'alert') + kpi('บุคลากรทั้งหมด', nf(k.target), 'คน', '', 'users')) + '</div>';
    h += '<div class="dgrid"><div class="stack"><div class="card"><div class="hd"><h3>' + ic('building') + (ci ? ' ผู้เข้าร่วมรายฝ่าย' : ' ความร่วมมือรายฝ่าย') + '</h3></div><div class="bd">' +
      (ci ? hbars(divs.filter(function (g) { return g.ordered; }).map(function (g) { return { label: g.name, n: g.ordered, sub: '/ ' + nf(g.target) }; }), (divs[0] || {}).ordered)
        : divs.map(function (g) { return '<div style="padding:8px 0;border-bottom:1px dashed var(--line)"><div class="row between"><b style="font-size:14px">' + esc(g.name) + '</b><span class="small num">' + nf(g.done) + '/' + nf(g.target) + ' · ' + g.pct + '%</span></div>' + progBar(g.pct) + '</div>'; }).join('')) +
      '</div></div></div><div class="stack"><div class="card"><div class="hd"><h3>' + ic('calendar') + ' รายวัน</h3></div><div class="bd">' + (tl.length ? '<div class="timeline">' + tl.map(function (t) { return '<div class="col" title="' + esc(thDate(t.d, false)) + ' · ' + t.n + '"><div class="bar" style="height:' + Math.max(4, t.n / maxT * 100) + '%"></div><small>' + esc(thShort(t.d).split(' ').slice(0, 2).join(' ')) + '</small></div>'; }).join('') + '</div>' : '<div class="muted small">ยังไม่มีข้อมูล</div>') + '</div></div>' +
      (ev.type === 'NOMINATE' && canEv(ev.id) ? '<div class="card pad small muted">' + ic('lock') + ' หน้านี้แสดงเฉพาะ "ใครร่วมเสนอชื่อแล้ว" — ระบบไม่แสดงว่าใครเสนอชื่อใคร · ผลรวมเสียงดูที่แท็บ "ผลการเสนอชื่อ"</div>' : '') + '</div></div>';
    $('#page').innerHTML = h;
    $('#oR').onclick = function () { busy(this, api('getDashboard', { eventId: ev.id }, { fresh: true })).then(draw).catch(errToast); };
  };
  api('getDashboard', { eventId: ev.id }, { fresh: true, onCache: draw }).then(draw).catch(errToast);
}

/* ---------- ผลการเสนอชื่อ + ตรวจคุณสมบัติ ---------- */
var AW = null;
var AUTO_TH = { PASS: ['ok', 'check', 'ผ่านครบ'], WARN: ['warn', 'alert', 'ควรตรวจ'], FAIL: ['danger', 'x', 'ไม่ผ่าน'] };
function awResults(ev) {
  $('#page').innerHTML = skel(3);
  api('getAwardResults', { eventId: ev.id }).then(function (d) {
    if (thStale(ev.id, 'results')) return;
    AW = { ev: ev, d: d, cat: (AW && AW.ev.id === ev.id && AW.cat) || (d.categories[0] || {}).key, f: (AW && AW.f) || 'all' };
    awDraw();
  }).catch(errToast);
}
function awTopSet(cat, n) {
  var pass = cat.nominees.filter(function (x) { return x.decision === 'PASS'; }), out = {};
  if (!pass.length) return out;
  var cut = pass[Math.min(n, pass.length) - 1].votes;
  pass.forEach(function (x, i) { if (i < n || x.votes === cut) out[x.code] = 1; });
  return out;
}
function awDraw() {
  var d = AW.d, ev = AW.ev, cat = d.categories.filter(function (c) { return c.key === AW.cat; })[0] || d.categories[0];
  var all = [].concat.apply([], d.categories.map(function (c) { return c.nominees; }));
  var autoPass = all.filter(function (x) { return x.check.auto === 'PASS' && !x.decision; }).length, undec = all.filter(function (x) { return !x.decision; }).length;
  var h = pageHead('ผลการเสนอชื่อ', 'ผู้ร่วมเสนอชื่อ ' + nf(d.nominators) + ' คน · ถูกเสนอชื่อรวม ' + nf(d.names) + ' ครั้ง · ' + nf(all.length) + ' คน · ข้อมูล ณ ' + esc(thShort(d.generatedAt)),
    '<button class="btn" id="awR">' + ic('refresh') + 'รีเฟรช</button><button class="btn" id="awXA">' + ic('download') + 'ส่งออกทั้งหมด</button><button class="btn primary" id="awXC">' + ic('download') + 'ส่งออกสำหรับคณะกรรมการ</button>');
  h += '<div class="announce" style="background:#fff;border-color:var(--line)">' + ic('lock') + '<div>ระบบ<b>ไม่แสดงว่าใครเสนอชื่อใคร</b> · เหตุผลแสดงแบบสุ่มลำดับ · ผลตรวจของระบบเป็นการตรวจคร่าว ๆ จากไฟล์ผลประเมิน/วันบรรจุ/หมายเหตุ — <b>HR เป็นผู้ยืนยันขั้นสุดท้าย</b> ก่อนส่งคณะกรรมการ (หมวดละ ' + d.topN + ' ชื่อ ปรับได้ที่แท็บตั้งค่า)</div></div>';
  h += '<div class="card th-awbar"><div class="bd row between"><div class="row">' + ic('check') + '<span>รอตรวจ <b class="num">' + nf(undec) + '</b> คน · ระบบตรวจผ่านครบและยังไม่ได้ยืนยัน <b class="num" style="color:var(--ok)">' + nf(autoPass) + '</b> คน</span></div>' +
    '<button class="btn primary" id="awAll" ' + (autoPass ? '' : 'disabled') + ' data-busy="กำลังบันทึก…">' + ic('check') + 'ยืนยัน "ผ่าน" ทุกคนที่ระบบตรวจผ่านครบ (' + nf(autoPass) + ')</button></div></div>';
  h += '<div class="tabs th-cattabs">' + d.categories.map(function (c) {
    var pend = c.nominees.filter(function (x) { return !x.decision; }).length;
    return '<a href="javascript:void 0" data-cat="' + esc(c.key) + '" class="' + (c.key === cat.key ? 'on' : '') + '" title="' + esc(c.label) + '"><b>' + esc(c.key) + '</b> ' + nf(c.nominees.length) + ' คน' + (pend ? ' <span class="chip warn">' + pend + '</span>' : '') + '</a>';
  }).join('') + '</div>';
  var f = AW.f, list = cat.nominees.filter(function (x) { return f === 'all' || (f === 'todo' ? !x.decision : f === 'PASSD' ? x.decision === 'PASS' : f === 'FAILD' ? x.decision === 'FAIL' : x.check.auto === f && !x.decision); });
  var top = awTopSet(cat, d.topN);
  h += '<div class="card"><div class="hd"><div><h3>' + esc(cat.key + ' ' + cat.label) + '</h3><div class="small muted">' + esc(cat.group || '') + ' · ถูกเสนอชื่อรวม ' + nf(cat.total) + ' ครั้ง</div></div><div class="seg" id="awF">' +
    [['all', 'ทั้งหมด'], ['todo', 'รอตรวจ'], ['PASS', 'ระบบ: ผ่าน'], ['WARN', 'ระบบ: ควรตรวจ'], ['FAIL', 'ระบบ: ไม่ผ่าน'], ['PASSD', 'HR: ผ่าน'], ['FAILD', 'HR: ไม่ผ่าน']].map(function (s) { return '<button data-f="' + s[0] + '" class="' + (f === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div></div>';
  h += '<div class="tablewrap"><table class="t th-awt"><thead><tr><th class="r">#</th><th>ผู้ได้รับการเสนอชื่อ</th><th class="r">ครั้ง</th><th>หลักการที่ถูกเลือกมาก</th><th>ระบบตรวจ</th><th>ผลการตรวจของ HR</th></tr></thead><tbody>' +
    (list.length ? list.map(function (x) {
      var rank = cat.nominees.indexOf(x) + 1, a = AUTO_TH[x.check.auto];
      var rs = x.reasons.map(function (n, i) { return { i: i, n: n }; }).filter(function (r) { return r.n; }).sort(function (p, q) { return q.n - p.n; }).slice(0, 3);
      return '<tr class="' + (top[x.code] ? 'th-top' : '') + '"><td class="r num">' + rank + '</td><td><div class="nm">' + esc(x.name) + (top[x.code] ? ' <span class="chip ok">' + ic('star') + ' ส่งกรรมการ</span>' : '') + '</div><div class="sub">' + esc([x.position, x.unit, x.division].filter(Boolean).join(' · ')) + ' · ' + esc(x.code) + '</div>' +
        (x.texts.length ? '<button class="linkbtn small" data-tx="' + esc(x.code) + '">' + ic('chat') + ' เหตุผลที่พิมพ์ ' + x.texts.length + ' ข้อความ</button>' : '') + '</td>' +
        '<td class="r num"><b style="font-size:17px">' + nf(x.votes) + '</b></td><td>' + (rs.length ? rs.map(function (r) { return '<span class="chip acc" title="' + esc(d.criteria[r.i]) + '">' + esc((((ev.config || {}).criteriaShort) || [])[r.i] || ('ข้อ ' + (r.i + 1))) + ' · ' + r.n + '</span>'; }).join(' ') : '<span class="muted small">–</span>') + '</td>' +
        '<td><span class="chip ' + a[0] + '">' + ic(a[1]) + ' ' + a[2] + '</span><div class="sub">' + esc(x.check.grade ? 'ผลประเมิน ' + x.check.grade : '') + (x.check.years != null ? ' · อายุงาน ' + x.check.years + ' ปี' : '') + '</div>' +
        (x.check.hard.concat(x.check.warn).length ? '<div class="sub" style="color:' + (x.check.hard.length ? 'var(--danger)' : 'var(--warn)') + '">' + esc(x.check.hard.concat(x.check.warn).join(' · ')) + '</div>' : '') + '</td>' +
        '<td style="min-width:180px">' + (x.decision ? '<span class="chip ' + (x.decision === 'PASS' ? 'ok' : 'danger') + '">' + (x.decision === 'PASS' ? 'ผ่าน' : 'ไม่ผ่าน') + '</span>' + (x.decisionReason ? '<div class="sub">' + esc(x.decisionReason) + '</div>' : '') + '<div class="sub">' + esc(x.reviewedBy + ' · ' + thShort(x.reviewedAt)) + '</div>' : '<span class="chip">รอตรวจ</span>') +
        (canEv(ev.id) ? '<div class="row" style="margin-top:6px;gap:6px"><button class="btn sm" data-ok="' + esc(x.code) + '"' + (x.decision === 'PASS' ? ' disabled' : '') + '>' + ic('check') + 'ผ่าน</button><button class="btn sm danger" data-no="' + esc(x.code) + '"' + (x.decision === 'FAIL' ? ' disabled' : '') + '>' + ic('x') + 'ไม่ผ่าน</button>' + (x.decision ? '<button class="btn sm ghost" data-clr="' + esc(x.code) + '" title="ล้างผล">' + ic('refresh') + '</button>' : '') + '</div>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="6"><div class="empty">' + ic('award') + '<p>' + (cat.nominees.length ? 'ไม่มีรายชื่อตามตัวกรอง' : 'ยังไม่มีผู้ได้รับการเสนอชื่อในหมวดนี้') + '</p></div></td></tr>') + '</tbody></table></div></div>';
  $('#page').innerHTML = h;
  $$('[data-cat]').forEach(function (a) { a.onclick = function () { AW.cat = a.dataset.cat; awDraw(); }; });
  $$('#awF [data-f]').forEach(function (b) { b.onclick = function () { AW.f = b.dataset.f; awDraw(); }; });
  $('#awR').onclick = function () { awResults(ev); };
  var rev = function (items, msg) { return api('reviewNominees', { eventId: ev.id, items: items }).then(function () { toast(msg, 'ok'); return api('getAwardResults', { eventId: ev.id }); }).then(function (x) { AW.d = x; awDraw(); }).catch(errToast); };
  $$('[data-ok]').forEach(function (b) { b.onclick = function () { b.disabled = true; rev([{ category: cat.key, empCode: b.dataset.ok, decision: 'PASS', reason: '' }], 'บันทึก "ผ่าน" แล้ว'); }; });
  $$('[data-clr]').forEach(function (b) { b.onclick = function () { rev([{ category: cat.key, empCode: b.dataset.clr, decision: '', reason: '' }], 'ล้างผลการตรวจแล้ว'); }; });
  $$('[data-no]').forEach(function (b) {
    b.onclick = function () {
      var x = cat.nominees.filter(function (n) { return n.code === b.dataset.no; })[0];
      var m = modal({ title: 'ไม่ผ่านคุณสมบัติ · ' + esc(x.name), body: '<div class="field"><label class="f">เหตุผล (จำเป็น)</label><input class="input" id="noR" maxlength="300" value="' + esc(x.check.hard[0] || '') + '" placeholder="เช่น ผลประเมินไม่ถึงระดับดีมาก"></div>',
        foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn danger" id="noOk">' + ic('x') + 'บันทึก "ไม่ผ่าน"</button>' });
      $('#noOk').onclick = function () { var r = $('#noR').value.trim(); if (!r) return toast('กรุณาระบุเหตุผล', 'warn'); m.close(); rev([{ category: cat.key, empCode: x.code, decision: 'FAIL', reason: r }], 'บันทึก "ไม่ผ่าน" แล้ว'); };
    };
  });
  $$('[data-tx]').forEach(function (b) { b.onclick = function () { var x = cat.nominees.filter(function (n) { return n.code === b.dataset.tx; })[0]; modal({ title: 'เหตุผลที่ผู้เสนอพิมพ์ · ' + esc(x.name), size: 'lg', body: '<div class="small muted" style="margin-bottom:8px">' + ic('lock') + ' ไม่แสดงชื่อผู้เสนอ · ลำดับสุ่ม</div><ul class="th-texts">' + x.texts.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' }); }; });
  $('#awAll').onclick = function () {
    var b = this;
    confirmBox({ title: 'ยืนยัน "ผ่าน" ' + nf(autoPass) + ' คน?', icon: 'check', ok: 'ยืนยันผ่าน', msg: 'เฉพาะผู้ที่ระบบตรวจแล้วผ่านครบทุกข้อ (ผลประเมิน ' + esc(((ev.config || {}).passGrades || ['A', 'B']).join('/')) + ' · อายุงานครบ · ไม่มีหมายเหตุวินัย/พ้นหน้าที่) และ HR ยังไม่ได้ตรวจ · รายที่มี ⚠ ให้ตรวจทีละคน' }).then(function (y) {
      if (!y) return;
      busy(b, api('confirmPassing', { eventId: ev.id })).then(function (r) { toast('ยืนยันผ่าน ' + nf(r.done) + ' คน', 'ok'); awResults(ev); }).catch(errToast);
    });
  };
  $('#awXC').onclick = function () { awExport(true); };
  $('#awXA').onclick = function () { awExport(false); };
}
function awExport(committee) {
  var d = AW.d, ev = AW.ev, crit = d.criteria, short = (ev.config || {}).criteriaShort || [], sheets = [], sum = [['หมวด', 'ชื่อหมวด', 'ถูกเสนอชื่อ (คน)', 'ถูกเสนอชื่อ (ครั้ง)', 'HR ตรวจผ่าน', 'ส่งคณะกรรมการ', 'รอตรวจ']];
  var undec = 0;
  d.categories.forEach(function (c) {
    var top = awTopSet(c, d.topN), list = committee ? c.nominees.filter(function (x) { return top[x.code]; }) : c.nominees;
    undec += c.nominees.filter(function (x) { return !x.decision; }).length;
    sum.push([c.key, c.label, c.nominees.length, c.total, c.nominees.filter(function (x) { return x.decision === 'PASS'; }).length, Object.keys(top).length, c.nominees.filter(function (x) { return !x.decision; }).length]);
    var head = ['ลำดับ', 'รหัส', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วยงาน', 'ฝ่าย', 'จำนวนครั้งที่ได้รับการเสนอชื่อ'].concat(crit.map(function (t, i) { return '3.' + (i + 1) + ' ' + (short[i] || t); }));
    if (d.reasonsToCommittee || !committee) head.push('เหตุผลจากผู้เสนอ');
    head = head.concat(['ผลประเมิน', 'อายุงาน (ปี)'], committee ? [] : ['ระบบตรวจ', 'ประเด็นที่พบ', 'ผลการตรวจของ HR', 'เหตุผล HR']);
    var rows = [head];
    list.forEach(function (x, i) {
      var r = [i + 1, x.code, x.name, x.position, x.unit, x.division, x.votes].concat(x.reasons);
      if (d.reasonsToCommittee || !committee) r.push(x.texts.map(function (t) { return '• ' + t; }).join('\n'));
      r = r.concat([x.check.grade, x.check.years == null ? '' : x.check.years]);
      if (!committee) r = r.concat([AUTO_TH[x.check.auto][2], x.check.hard.concat(x.check.warn).join(' · '), x.decision === 'PASS' ? 'ผ่าน' : x.decision === 'FAIL' ? 'ไม่ผ่าน' : 'รอตรวจ', x.decisionReason]);
      rows.push(r);
    });
    sheets.push({ name: c.key + ' ' + c.label.slice(0, 24), rows: rows });
  });
  var go2 = function () {
    sheets.unshift({ name: 'สรุป', rows: sum.concat([[], ['จัดทำโดย SOMDEJ HR Connect ' + thShort(localIso()) + (committee ? ' · ส่งคณะกรรมการหมวดละ ' + d.topN + ' ชื่อ (เฉพาะที่ HR ตรวจผ่าน · คะแนนเท่ากันลำดับสุดท้ายนำเสนอทั้งหมด)' : '')], ['หมายเหตุ: จำนวนครั้งที่ได้รับการเสนอชื่อเป็นข้อมูลประกอบ การตัดสินเป็นอำนาจของคณะกรรมการ · ไม่ระบุชื่อผู้เสนอ']]) });
    exportXlsx((committee ? 'บุคลากรดีเด่น_เสนอคณะกรรมการ_' : 'บุคลากรดีเด่น_ผลการเสนอชื่อทั้งหมด_') + localIso().slice(0, 10) + '.xlsx', sheets).catch(errToast);
  };
  if (committee && undec) confirmBox({ title: 'ยังมีรายชื่อรอตรวจ ' + nf(undec) + ' คน', icon: 'alert', ok: 'ส่งออกต่อ', msg: 'ไฟล์สำหรับคณะกรรมการรวมเฉพาะผู้ที่ HR ตรวจ "ผ่าน" แล้ว · ส่งออกต่อหรือไม่?' }).then(function (y) { if (y) go2(); });
  else go2();
}

/* ---------- รายชื่อผู้มีสิทธิ์ + ตาราง ตำแหน่ง → หมวด ---------- */
var AP = null;
function awPool(ev) {
  $('#page').innerHTML = skel(3);
  Promise.all([api('awardPoolInfo', { eventId: ev.id }), api('listPositionMap', { eventId: ev.id })]).then(function (r) {
    if (thStale(ev.id, 'pool')) return;
    AP = { ev: ev, info: r[0], map: r[1], f: (AP && AP.f) || 'all', q: '', changed: {} };
    apDraw();
  }).catch(errToast);
}
function apDraw() {
  var ev = AP.ev, s = AP.info.summary, cats = AP.map.categories, opts = cats.map(function (c) { return [c.key, c.key + ' ' + c.label]; }).concat([['X', 'X ไม่อยู่ในหมวด (ผู้บริหาร)']]);
  var h = pageHead('รายชื่อผู้มีสิทธิ์ได้รับการเสนอชื่อ', 'เจ้าหน้าที่ประจำ/ลูกจ้างประจำ · ' + nf(s.total) + ' คน' + (s.importedAt ? ' · นำเข้าล่าสุด ' + esc(thShort(s.importedAt)) : ''),
    '<button class="btn" id="apX">' + ic('download') + 'ส่งออกผลตรวจคร่าว ๆ</button><button class="btn primary" id="apI">' + ic('upload') + 'นำเข้าไฟล์ระบบเลื่อนเงินเดือน</button>');
  if (!s.total) h += '<div class="announce">' + ic('alert') + '<div><b>ยังไม่มีรายชื่อ</b> — ดาวน์โหลด Google Sheet "QSMH_ระบบเลื่อนเงินเดือน_ฐานข้อมูล" เป็นไฟล์ .xlsx (ไฟล์ › ดาวน์โหลด › Microsoft Excel) แล้วกด "นำเข้า" · ระบบอ่านแผ่น <b>Employees</b> และ <b>Departments</b> ให้เอง</div></div>';
  h += '<div class="announce" style="background:#fff;border-color:var(--line)">' + ic('info') + '<div>รายชื่อนี้ใช้ <b>เลือกผู้ถูกเสนอชื่อตามหมวด</b> · บุคลากรเห็นเฉพาะชื่อ ตำแหน่ง หน่วยงาน (ไม่เห็นผลประเมิน) · <b>ไม่ตัดสิทธิ์ตามผลประเมินล่วงหน้า</b> ระบบใช้ตรวจคุณสมบัติหลังปิดรับเท่านั้น · นำเข้าซ้ำได้เมื่อผลประเมินอัปเดต</div></div>';
  h += '<div class="card"><div class="hd"><h3>' + ic('chart') + ' ตรวจคร่าว ๆ ตามหมวด</h3><span class="small muted">ผ่าน = ผลประเมิน ' + esc(((ev.config || {}).passGrades || ['A', 'B']).join('/')) + ' · อายุงานครบ · ไม่มีหมายเหตุวินัย/พ้นหน้าที่</span></div><div class="tablewrap"><table class="t"><thead><tr><th>หมวด</th><th class="r">ทั้งหมด</th><th class="r">ผลประเมินผ่าน</th><th class="r">ผ่านครบ</th><th class="r">ควรตรวจ</th><th class="r">ไม่ผ่าน</th></tr></thead><tbody>' +
    s.byCat.map(function (c) { return '<tr><td><b>' + esc(c.key) + '</b> ' + esc(c.label) + '</td><td class="r num">' + nf(c.total) + '</td><td class="r num">' + nf(c.gradeOk) + '</td><td class="r num" style="color:var(--ok)">' + (c.key === 'X' ? '–' : nf(c.pass)) + '</td><td class="r num" style="color:var(--warn)">' + (c.key === 'X' ? '–' : nf(c.warn)) + '</td><td class="r num" style="color:var(--danger)">' + (c.key === 'X' ? '–' : nf(c.fail)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  var rows = AP.map.rows.filter(function (r) { return (AP.f === 'all' || (AP.f === 'todo' ? !r.confirmed : AP.f === 'review' ? r.review && !r.confirmed : r.category === AP.f)) && (!AP.q || r.position.indexOf(AP.q) >= 0); });
  var nTodo = AP.map.rows.filter(function (r) { return !r.confirmed; }).length, nRev = AP.map.rows.filter(function (r) { return r.review && !r.confirmed; }).length, nCh = Object.keys(AP.changed).length;
  h += '<div class="card" style="margin-top:16px"><div class="hd"><div><h3>' + ic('layers') + ' ตาราง ตำแหน่ง → หมวด (' + nf(AP.map.rows.length) + ' ตำแหน่ง)</h3><div class="small muted">ระบบใส่หมวดให้อัตโนมัติจากชื่อตำแหน่ง/ระดับแรกบรรจุ · HR ตรวจแล้วกดยืนยันครั้งเดียว · ยังไม่ยืนยัน ' + nf(nTodo) + ' · ควรตรวจ ' + nf(nRev) + '</div></div>' +
    '<div class="row"><button class="btn" id="apAll" ' + (nTodo ? '' : 'disabled') + ' data-busy="กำลังบันทึก…">' + ic('check') + 'ยืนยันทั้งหมด</button><button class="btn primary" id="apSave" ' + (nCh ? '' : 'disabled') + ' data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึกที่แก้ (' + nCh + ')</button></div></div>' +
    '<div class="bd" style="padding-bottom:6px"><div class="filters"><input class="input search" id="apQ" placeholder="ค้นหาตำแหน่ง" value="' + esc(AP.q) + '"><div class="seg" id="apF">' + [['all', 'ทั้งหมด'], ['todo', 'ยังไม่ยืนยัน'], ['review', 'ควรตรวจ']].concat(opts.map(function (o) { return [o[0], o[0]]; })).map(function (x) { return '<button data-f="' + x[0] + '" class="' + (AP.f === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div></div>' +
    '<div class="tablewrap"><table class="t"><thead><tr><th>ตำแหน่ง</th><th class="r">คน</th><th>ระดับที่พบ</th><th>หมวด</th><th>ที่มา</th></tr></thead><tbody>' +
    rows.map(function (r) {
      var cur = AP.changed[r.position] || r.category;
      return '<tr><td><b>' + esc(r.position) + '</b>' + (r.review && !r.confirmed ? ' <span class="chip warn">ควรตรวจ</span>' : '') + '</td><td class="r num">' + nf(r.count) + '</td><td class="small">' + esc(r.levels) + '</td>' +
        '<td><select class="input" data-pm="' + esc(r.position) + '" style="min-width:220px' + (AP.changed[r.position] ? ';border-color:var(--accent)' : '') + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></td>' +
        '<td class="small">' + (r.confirmed ? '<span class="chip ok">' + ic('check') + ' ยืนยันแล้ว</span> ' : '') + esc(r.category !== r.auto ? 'HR กำหนด (ระบบเสนอ ' + r.auto + ')' : r.reason) + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
  $('#page').innerHTML = h;
  $('#apQ').oninput = debounce(function () { AP.q = $('#apQ').value.trim(); apDraw(); var i = $('#apQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300);
  $$('#apF [data-f]').forEach(function (b) { b.onclick = function () { AP.f = b.dataset.f; apDraw(); }; });
  $$('[data-pm]').forEach(function (sl) { sl.onchange = function () { var r = AP.map.rows.filter(function (x) { return x.position === sl.dataset.pm; })[0]; if (sl.value === r.category) delete AP.changed[r.position]; else AP.changed[r.position] = sl.value; apDraw(); }; });
  var save = function (b, rows, all) { busy(b, api('savePositionMap', { eventId: ev.id, rows: rows, confirmAll: all })).then(function () { toast('บันทึกตารางตำแหน่งแล้ว', 'ok'); awPool(ev); }).catch(errToast); };
  $('#apSave').onclick = function () { save(this, Object.keys(AP.changed).map(function (p) { return { position: p, category: AP.changed[p] }; }), false); };
  $('#apAll').onclick = function () { var b = this; confirmBox({ title: 'ยืนยันหมวดทุกตำแหน่ง?', icon: 'check', ok: 'ยืนยันทั้งหมด', msg: 'ตำแหน่งที่ยังไม่ยืนยัน ' + nf(nTodo) + ' ตำแหน่ง (ควรตรวจ ' + nf(nRev) + ') จะใช้หมวดตามที่แสดงอยู่' + (nCh ? ' รวมที่แก้ ' + nCh + ' รายการ' : '') }).then(function (y) { if (y) save(b, Object.keys(AP.changed).map(function (p) { return { position: p, category: AP.changed[p] }; }), true); }); };
  $('#apI').onclick = function () { apImport(ev); };
  $('#apX').onclick = function () {
    var b = this; busy(b, api('awardPoolInfo', { eventId: ev.id, withRows: true })).then(function (x) {
      var AU = { PASS: 'ผ่านครบ', WARN: 'ควรตรวจ', FAIL: 'ไม่ผ่าน' };
      exportXlsx('ตรวจคุณสมบัติคร่าวๆ_บุคลากรดีเด่น_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'รายชื่อ', rows: [['รหัส', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วยงาน', 'ฝ่าย', 'หมวด', 'ผลประเมิน', 'วันบรรจุ', 'ระบบตรวจ', 'ประเด็น', 'หมายเหตุ']].concat(x.rows.map(function (r) { var o = r.slice(); o[8] = r[5] === 'X' ? 'ไม่อยู่ในหมวด' : AU[r[8]]; return o; })) }]);
    }).catch(errToast);
  };
}
function cellYmd(v) {
  if (v instanceof Date && !isNaN(v)) { var z = function (n) { return ('0' + n).slice(-2); }; return v.getFullYear() + '-' + z(v.getMonth() + 1) + '-' + z(v.getDate()); }
  return v == null ? '' : String(v).trim();
}
/** อ่านไฟล์ Excel ของระบบเลื่อนเงินเดือน: แผ่น Employees (+ Departments ถ้ามี) */
function readPoolFile(file) {
  return loadXLSX().then(function (X) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var wb = X.read(new Uint8Array(fr.result), { type: 'array', cellDates: true }), emp = null, deps = {};
          wb.SheetNames.forEach(function (n) {
            var aoa = X.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: true, blankrows: false });
            for (var i = 0; i < Math.min(15, aoa.length); i++) {
              var hd = (aoa[i] || []).map(function (c) { return String(c).replace(/\s+/g, ' ').trim(); });
              if (!emp && hd.indexOf('รหัสประจำตัว') >= 0 && hd.indexOf('ตำแหน่ง') >= 0) { emp = { hd: hd, rows: aoa.slice(i + 1) }; break; }
              if (hd.indexOf('รหัสฝ่าย') >= 0 && hd.indexOf('ชื่อฝ่าย') >= 0 && hd.indexOf('ตำแหน่ง') < 0) {
                var ci = hd.indexOf('รหัสฝ่าย'), cn = hd.indexOf('ชื่อฝ่าย');
                aoa.slice(i + 1).forEach(function (r) { if (r[ci]) deps[String(r[ci]).trim()] = String(r[cn]).trim(); }); break;
              }
            }
          });
          if (!emp) throw new Error('ไม่พบแผ่นที่มีคอลัมน์ "รหัสประจำตัว" และ "ตำแหน่ง" (แผ่น Employees)');
          var col = function (names) { for (var k = 0; k < names.length; k++) { var j = emp.hd.indexOf(names[k]); if (j >= 0) return j; } return -1; };
          var C = { code: col(['รหัสประจำตัว']), name: col(['ชื่อ-นามสกุล', 'ชื่อ-สกุล', 'ชื่อ']), pos: col(['ตำแหน่ง']), lv: col(['ระดับ']), unit: col(['หน่วยงาน']), start: col(['วันบรรจุ', 'วันเริ่มงาน']),
            grade: col(['เกรด', 'ผลประเมิน']), remark: col(['หมายเหตุ']), dep: col(['รหัสฝ่าย']), div: col(['ฝ่าย', 'ชื่อฝ่าย']) };
          var g = function (r, k) { return C[k] < 0 ? '' : r[C[k]]; };
          res({ rows: emp.rows.filter(function (r) { return String(g(r, 'code')).trim(); }).map(function (r) {
            var dep = String(g(r, 'dep')).trim();
            return { empCode: String(g(r, 'code')).trim(), name: String(g(r, 'name')).trim(), position: String(g(r, 'pos')).trim(), level: String(g(r, 'lv')).trim(), unit: String(g(r, 'unit')).trim(),
              division: String(g(r, 'div')).trim() || deps[dep] || '', startDate: cellYmd(g(r, 'start')), grade: String(g(r, 'grade')).trim(), remark: String(g(r, 'remark')).trim() };
          }), deps: Object.keys(deps).length });
        } catch (e) { rej(new Error('อ่านไฟล์ไม่ได้: ' + e.message)); }
      };
      fr.onerror = function () { rej(new Error('อ่านไฟล์ไม่ได้')); };
      fr.readAsArrayBuffer(file);
    });
  });
}
function apImport(ev) {
  pickFile('.xlsx,.xls').then(function (file) {
    if (!file) return;
    toast('กำลังอ่านไฟล์…', 'info');
    readPoolFile(file).then(function (x) {
      var g = {}; x.rows.forEach(function (r) { g[r.grade || '-'] = (g[r.grade || '-'] || 0) + 1; });
      return confirmBox({ title: 'นำเข้า ' + nf(x.rows.length) + ' คน?', icon: 'upload', ok: 'นำเข้า', msg: esc(file.name) + '<br>ผลประเมิน: ' + Object.keys(g).sort().map(function (k) { return esc(k) + ' ' + nf(g[k]); }).join(' · ') +
        (x.deps ? '<br>ชื่อฝ่ายจากแผ่น Departments ' + x.deps + ' ฝ่าย' : '') + '<br><b>แทนที่รายชื่อเดิมทั้งหมด</b> · ผลที่ HR ตรวจแล้ว และหมวดที่ยืนยันแล้วไม่หาย' }).then(function (y) {
        if (!y) return;
        toast('กำลังนำเข้า…', 'info');
        return api('importAwardPool', { eventId: ev.id, rows: x.rows, fileName: file.name }).then(function (r) {
          toast('นำเข้า ' + nf(r.total) + ' คน' + (r.newPositions.length ? ' · ตำแหน่งใหม่ ' + r.newPositions.length + ' (ตรวจหมวดในตาราง)' : '') + (r.badRows ? ' · ข้าม ' + r.badRows + ' แถว' : ''), 'ok', 'นำเข้าเรียบร้อย');
          awPool(ev);
        });
      });
    }).catch(errToast);
  });
}

/* ---------- จัดการคำถาม ---------- */
var QA = null;
function qAdmin(ev) {
  $('#page').innerHTML = skel(3);
  api('listQuestions', { eventId: ev.id }).then(function (d) {
    if (thStale(ev.id, 'questions')) return;
    var keep = QA && QA.ev.id === ev.id ? QA : null;
    QA = { ev: ev, d: d, f: keep ? keep.f : { q: '', cat: '', exec: '', st: 'ACTIVE', ch: '' }, sel: {}, page: keep ? keep.page : 1 };
    qaDraw();
  }).catch(errToast);
}
function qaExecName(id) { var x = QA.d.execs.filter(function (e) { return e.id === id; })[0]; return x ? x.name : id; }
function qaCatLabel(k) { var x = QA.d.categories.filter(function (c) { return c.key === k; })[0]; return x ? x.label : ''; }
function qaFiltered() {
  var f = QA.f, w = f.q.toLowerCase();
  return QA.d.questions.filter(function (q) {
    return (!f.st || q.status === f.st) && (!f.ch || q.channel === f.ch) && (!f.cat || (f.cat === '_none' ? !q.category : q.category === f.cat)) && (!f.exec || (f.exec === '_none' ? !q.execs.length : q.execs.indexOf(f.exec) >= 0)) && (!w || q.text.toLowerCase().indexOf(w) >= 0 || (q.original || '').toLowerCase().indexOf(w) >= 0);
  });
}
function qaSave(items, msg, redraw) {
  return api('updateQuestions', { eventId: QA.ev.id, items: items }).then(function () {
    items.forEach(function (it) { var q = QA.d.questions.filter(function (x) { return x.id === it.id; })[0]; if (!q) return; Object.keys(it).forEach(function (k) { if (k !== 'id') q[k] = it[k]; }); if (it.editedText != null) { q.text = it.editedText || q.original; q.edited = !!it.editedText && it.editedText !== q.original; } });
    if (msg) toast(msg, 'ok');
    if (redraw !== false) qaDraw();
  }).catch(function (e) { errToast(e); qAdmin(QA.ev); });
}
function qaDraw() {
  var d = QA.d, f = QA.f, list = qaFiltered(), size = 40, pages = Math.max(1, Math.ceil(list.length / size));
  if (QA.page > pages) QA.page = pages;
  var slice = list.slice((QA.page - 1) * size, QA.page * size), act = d.questions.filter(function (q) { return q.status === 'ACTIVE'; });
  var noCat = act.filter(function (q) { return !q.category; }).length, noEx = act.filter(function (q) { return !q.execs.length; }).length, nSel = Object.keys(QA.sel).length;
  var h = pageHead('จัดการคำถาม', 'ทั้งหมด ' + nf(d.questions.length) + ' คำถาม จากบุคลากร ' + nf(d.askers) + ' คน · ' + (d.channel === 'ADVANCE' ? '<span class="chip ok dot live">เปิดรับล่วงหน้า</span>' : d.channel === 'ROOM' ? '<span class="chip ok dot live">เปิดถามในห้อง</span>' : '<span class="chip">ปิดรับ</span>'),
    '<button class="btn" id="qaR">' + ic('refresh') + 'รีเฟรช</button><button class="btn" id="qaX">' + ic('download') + 'ส่งออก Excel (เว็บไซต์ รพ.)</button>');
  h += '<div class="announce" style="background:#fff;border-color:var(--line)">' + ic('lock') + '<div>หน้านี้<b>ไม่แสดงผู้ถาม</b> (ยกเว้นผู้ที่ติ๊กเปิดเผยชื่อ) · เลือก <b>หมวด</b> แล้วระบบเติมผู้บริหารที่ควรตอบให้ (แก้ได้) · ผู้บริหารทุกท่านจะได้รับคำถามทั้งหมด โดยไฮไลต์ข้อของท่าน</div></div>';
  if (noCat || noEx) h += '<div class="announce">' + ic('alert') + '<div>คำถามที่ยังไม่จัดหมวด <b>' + nf(noCat) + '</b> · ยังไม่ระบุผู้บริหาร <b>' + nf(noEx) + '</b> <button class="linkbtn" id="qaTodo">แสดงเฉพาะที่ยังไม่จัดหมวด</button></div></div>';
  h += '<div class="card"><div class="bd" style="padding-bottom:8px"><div class="filters"><input class="input search" id="qaQ" placeholder="ค้นหาข้อความ" value="' + esc(f.q) + '">' +
    '<select class="input" id="qaC"><option value="">ทุกหมวด</option><option value="_none"' + (f.cat === '_none' ? ' selected' : '') + '>ยังไม่จัดหมวด</option>' + d.categories.map(function (c) { return '<option value="' + c.key + '"' + (f.cat === c.key ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') + '</select>' +
    '<select class="input" id="qaE"><option value="">ผู้บริหารทุกท่าน</option><option value="_none"' + (f.exec === '_none' ? ' selected' : '') + '>ยังไม่ระบุผู้บริหาร</option>' + d.execs.map(function (x) { return '<option value="' + x.id + '"' + (f.exec === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>' +
    '<select class="input" id="qaS">' + [['ACTIVE', 'ใช้งาน'], ['', 'ทุกสถานะ'], ['MERGED', 'รวมกับข้ออื่นแล้ว'], ['HIDDEN', 'ซ่อน']].map(function (x) { return '<option value="' + x[0] + '"' + (f.st === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
    '<select class="input" id="qaH">' + [['', 'ทุกช่องทาง'], ['ADVANCE', 'ล่วงหน้า'], ['ROOM', 'ถามในห้อง']].map(function (x) { return '<option value="' + x[0] + '"' + (f.ch === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>' +
    '<div class="bulkbar">' + ic('check') + '<span>' + (nSel ? 'เลือก <b>' + nSel + '</b> คำถาม' : 'ติ๊กเลือกหลายข้อเพื่อจัดหมวดพร้อมกัน') + '</span>' + (nSel ? '<select class="input" id="qaBC" style="width:auto"><option value="">— จัดหมวดเป็น —</option>' + d.categories.map(function (c) { return '<option value="' + c.key + '">' + esc(c.label) + '</option>'; }).join('') + '</select><button class="btn sm ghost" id="qaBX">' + ic('x') + 'ล้างการเลือก</button>' : '<button class="btn sm" id="qaBA">เลือกทั้งหน้า</button>') + '</div></div>';
  h += '<div class="th-qlist">' + (slice.length ? slice.map(function (q) {
    var no = d.questions.indexOf(q) + 1;
    return '<div class="th-q' + (q.status !== 'ACTIVE' ? ' off' : '') + (QA.sel[q.id] ? ' sel' : '') + '"><div class="row between" style="flex-wrap:nowrap;align-items:flex-start;gap:10px"><label class="th-qno"><input type="checkbox" data-sl="' + q.id + '"' + (QA.sel[q.id] ? ' checked' : '') + '> #' + no + '</label>' +
      '<div style="flex:1;min-width:0"><div class="t">' + esc(q.text).replace(/\n/g, '<br>') + '</div>' + (q.edited ? '<details class="small"><summary class="muted">เรียบเรียงถ้อยคำแล้ว · ดูข้อความเดิม</summary><div class="muted">' + esc(q.original).replace(/\n/g, '<br>') + '</div></details>' : '') +
      '<div class="small muted" style="margin-top:4px">' + esc(thDate(q.createdAt)) + (q.channel === 'ROOM' ? ' · <span class="chip info">ถามในห้อง</span>' : '') + (q.displayName ? ' · ผู้ถามเปิดเผยชื่อ: <b>' + esc(q.displayName) + '</b>' : '') + (q.status === 'MERGED' ? ' · <span class="chip">รวมเข้ากับ #' + (d.questions.map(function (x) { return x.id; }).indexOf(q.mergedInto) + 1) + '</span>' : '') + (q.status === 'HIDDEN' ? ' · <span class="chip">ซ่อน</span>' : '') + (q.adminNote ? ' · หมายเหตุ: ' + esc(q.adminNote) : '') + '</div></div></div>' +
      '<div class="th-qctl"><select class="input" data-qc="' + q.id + '"><option value="">— หมวด —</option>' + d.categories.map(function (c) { return '<option value="' + c.key + '"' + (q.category === c.key ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') + '</select>' +
      '<div class="th-ex">' + d.execs.map(function (x) { var on = q.execs.indexOf(x.id) >= 0; return '<button type="button" class="chip ' + (on ? 'acc on' : '') + '" data-qx="' + q.id + ':' + x.id + '" title="' + esc(x.position + ' · ' + (x.units || '')) + '">' + (on ? ic('check') : '') + esc(x.name.replace(/^(รศ\.)?(นพ\.|พญ\.|พว\.|คุณ)/, '')) + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="gap:6px"><button class="btn sm" data-qt="' + q.id + '">' + ic('edit') + 'เรียบเรียง</button><button class="btn sm" data-qm="' + q.id + '">' + ic('merge') + 'รวมกับข้ออื่น</button>' +
      (q.status === 'ACTIVE' ? '<button class="btn sm" data-qh="' + q.id + '">' + ic('eyeoff') + 'ซ่อน</button>' : '<button class="btn sm" data-qa="' + q.id + '">' + ic('eye') + 'ใช้งาน</button>') + '<button class="btn sm ghost" data-qn="' + q.id + '">' + ic('info') + 'หมายเหตุ</button>' +
      (d.canTrace ? '<button class="btn sm ghost danger" data-qtr="' + q.id + '">' + ic('shield') + 'ย้อนดูผู้ถาม</button>' : '') + '</div></div></div>';
  }).join('') : '<div class="empty">' + ic('chat') + '<p>' + (d.questions.length ? 'ไม่พบคำถามตามตัวกรอง' : 'ยังไม่มีคำถาม') + '</p></div>') + '</div>' +
    '<div class="pager"><span>แสดง ' + (list.length ? ((QA.page - 1) * size + 1) + '–' + Math.min(list.length, QA.page * size) : 0) + ' จาก ' + nf(list.length) + '</span><div class="row"><button class="btn sm" id="qaP" ' + (QA.page <= 1 ? 'disabled' : '') + '>' + ic('arrowl') + '</button><span class="num">หน้า ' + QA.page + '/' + pages + '</span><button class="btn sm" id="qaN" ' + (QA.page >= pages ? 'disabled' : '') + '>' + ic('arrowr') + '</button></div></div></div>';
  $('#page').innerHTML = h;
  var setF = function (k, v) { QA.f[k] = v; QA.page = 1; qaDraw(); };
  $('#qaQ').oninput = debounce(function () { QA.f.q = $('#qaQ').value.trim(); QA.page = 1; qaDraw(); var i = $('#qaQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300);
  $('#qaC').onchange = function () { setF('cat', this.value); }; $('#qaE').onchange = function () { setF('exec', this.value); };
  $('#qaS').onchange = function () { setF('st', this.value); }; $('#qaH').onchange = function () { setF('ch', this.value); };
  var td = $('#qaTodo'); if (td) td.onclick = function () { QA.f = { q: '', cat: '_none', exec: '', st: 'ACTIVE', ch: '' }; qaDraw(); };
  $('#qaR').onclick = function () { qAdmin(QA.ev); };
  $('#qaP').onclick = function () { QA.page--; qaDraw(); }; $('#qaN').onclick = function () { QA.page++; qaDraw(); };
  $$('[data-sl]').forEach(function (c) { c.onchange = function () { if (c.checked) QA.sel[c.dataset.sl] = 1; else delete QA.sel[c.dataset.sl]; qaDraw(); }; });
  var ba = $('#qaBA'); if (ba) ba.onclick = function () { slice.forEach(function (q) { QA.sel[q.id] = 1; }); qaDraw(); };
  var bx = $('#qaBX'); if (bx) bx.onclick = function () { QA.sel = {}; qaDraw(); };
  var bc = $('#qaBC'); if (bc) bc.onchange = function () {
    var k = bc.value; if (!k) return; var cat = d.categories.filter(function (c) { return c.key === k; })[0];
    var items = Object.keys(QA.sel).map(function (id) { var q = d.questions.filter(function (x) { return x.id === id; })[0]; return { id: id, category: k, execs: q.execs.length ? q.execs : (cat.execs || []).slice() }; });
    QA.sel = {}; qaSave(items, 'จัดหมวด ' + items.length + ' คำถามแล้ว');
  };
  $$('[data-qc]').forEach(function (s) { s.onchange = function () { var q = d.questions.filter(function (x) { return x.id === s.dataset.qc; })[0], cat = d.categories.filter(function (c) { return c.key === s.value; })[0]; qaSave([{ id: q.id, category: s.value, execs: !q.execs.length && cat ? (cat.execs || []).slice() : q.execs }], 'บันทึกหมวดแล้ว' + (!q.execs.length && cat && cat.execs.length ? ' · เติมผู้บริหารที่แนะนำ' : '')); }; });
  $$('[data-qx]').forEach(function (b) { b.onclick = function () { var p = b.dataset.qx.split(':'), q = d.questions.filter(function (x) { return x.id === p[0]; })[0], ex = q.execs.slice(), i = ex.indexOf(p[1]); if (i >= 0) ex.splice(i, 1); else ex.push(p[1]); qaSave([{ id: q.id, execs: ex }]); }; });
  $$('[data-qh]').forEach(function (b) { b.onclick = function () { qaSave([{ id: b.dataset.qh, status: 'HIDDEN' }], 'ซ่อนคำถามแล้ว (ไม่ส่งผู้บริหาร)'); }; });
  $$('[data-qa]').forEach(function (b) { b.onclick = function () { qaSave([{ id: b.dataset.qa, status: 'ACTIVE', mergedInto: '' }], 'คืนสถานะใช้งานแล้ว'); }; });
  $$('[data-qt]').forEach(function (b) { b.onclick = function () { var q = d.questions.filter(function (x) { return x.id === b.dataset.qt; })[0]; var m = modal({ title: 'เรียบเรียงถ้อยคำ', size: 'lg', body: '<div class="small muted">ข้อความเดิม: ' + esc(q.original) + '</div><textarea class="input" id="qtT" rows="6" style="margin-top:8px">' + esc(q.text) + '</textarea><div class="hint">คงสาระสำคัญ · ตัดข้อความพาดพิงบุคคล/ข้อมูลที่ระบุตัวผู้ถาม</div>', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn ghost" id="qtO">ใช้ข้อความเดิม</button><button class="btn primary" id="qtK">' + ic('check') + 'บันทึก</button>' }); $('#qtO').onclick = function () { m.close(); qaSave([{ id: q.id, editedText: '' }], 'ใช้ข้อความเดิมแล้ว'); }; $('#qtK').onclick = function () { m.close(); qaSave([{ id: q.id, editedText: $('#qtT').value.trim() }], 'บันทึกการเรียบเรียงแล้ว'); }; }; });
  $$('[data-qn]').forEach(function (b) { b.onclick = function () { var q = d.questions.filter(function (x) { return x.id === b.dataset.qn; })[0]; var m = modal({ title: 'หมายเหตุ (เห็นเฉพาะผู้ดูแล)', body: '<input class="input" id="qnT" maxlength="500" value="' + esc(q.adminNote || '') + '">', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="qnK">บันทึก</button>' }); $('#qnK').onclick = function () { m.close(); qaSave([{ id: q.id, adminNote: $('#qnT').value.trim() }], 'บันทึกหมายเหตุแล้ว'); }; }; });
  $$('[data-qm]').forEach(function (b) {
    b.onclick = function () {
      var q = d.questions.filter(function (x) { return x.id === b.dataset.qm; })[0], others = d.questions.filter(function (x) { return x.id !== q.id && x.status === 'ACTIVE'; });
      var m = modal({ title: 'รวมคำถาม #' + (d.questions.indexOf(q) + 1) + ' เข้ากับข้ออื่น', size: 'lg', body: '<div class="small muted" style="margin-bottom:8px">คำถามนี้จะไม่ส่งแยก แต่นับรวมในข้อหลัก (ผู้บริหารเห็นว่ามีผู้ถามประเด็นนี้หลายคน)</div><input class="input search" id="qmQ" placeholder="ค้นหาข้อหลัก"><div class="th-plist" id="qmL"></div>' });
      var dr = function () { var w = $('#qmQ').value.trim(); $('#qmL').innerHTML = others.filter(function (x) { return !w || x.text.indexOf(w) >= 0; }).slice(0, 60).map(function (x) { return '<button type="button" class="th-pitem" data-mt="' + x.id + '"><span style="flex:1;text-align:left"><b>#' + (d.questions.indexOf(x) + 1) + '</b> ' + esc(x.text.slice(0, 160)) + '</span>' + ic('merge') + '</button>'; }).join(''); $$('[data-mt]', m.el).forEach(function (t) { t.onclick = function () { m.close(); qaSave([{ id: q.id, status: 'MERGED', mergedInto: t.dataset.mt }], 'รวมคำถามแล้ว'); }; }); };
      $('#qmQ').oninput = debounce(dr, 200); dr();
    };
  });
  $$('[data-qtr]').forEach(function (b) {
    b.onclick = function () {
      var m = modal({ title: 'ย้อนดูผู้ถาม', body: '<div class="announce">' + ic('alert') + '<div>ตามคำชี้แจงที่ประกาศต่อบุคลากร ใช้ได้<b>เฉพาะกรณีจำเป็นตามกฎหมาย หรือพบการใช้ช่องทางโดยมิชอบ</b> · ระบบบันทึกชื่อผู้ดู เวลา และเหตุผลไว้ตรวจสอบ</div></div><div class="field"><label class="f">เหตุผล (อย่างน้อย 10 ตัวอักษร)</label><textarea class="input" id="trR" rows="3"></textarea></div><div id="trOut"></div>',
        foot: '<button class="btn" data-x>ปิด</button><button class="btn danger" id="trK" data-busy="กำลังตรวจ…">' + ic('shield') + 'ยืนยันย้อนดู</button>' });
      $('#trK').onclick = function () { busy(this, api('traceQuestion', { eventId: QA.ev.id, id: b.dataset.qtr, reason: $('#trR').value.trim() })).then(function (r) { $('#trOut').innerHTML = '<div class="card pad"><b>' + esc(r.name) + '</b> · ' + esc(r.empCode) + '<div class="small muted">' + esc(r.division) + ' · ส่งเมื่อ ' + esc(thDate(r.at)) + '</div></div>'; $('#trK').disabled = true; }).catch(errToast); };
    };
  });
  $('#qaX').onclick = function () {
    var act2 = d.questions.filter(function (q) { return q.status === 'ACTIVE'; });
    var rows = [['ลำดับ', 'คำถาม', 'หมวด', 'ผู้บริหารที่ตอบ', 'จำนวนคำถามที่รวมเข้ามา', 'ช่องทาง', 'วันที่ส่ง', 'คำตอบ (ผู้บริหาร)']].concat(act2.map(function (q, i) {
      return [i + 1, q.text, qaCatLabel(q.category), q.execs.map(qaExecName).join(', '), d.questions.filter(function (x) { return x.mergedInto === q.id && x.status === 'MERGED'; }).length, q.channel === 'ROOM' ? 'ถามในห้อง' : 'ล่วงหน้า', thDate(q.createdAt, false), ''];
    }));
    exportXlsx('คำถามถึงผู้บริหาร_TownHall_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'คำถาม', rows: rows, widths: [7, 80, 34, 40, 10, 12, 16, 60] }]).catch(errToast);
  };
}
function qStats(ev) {
  $('#page').innerHTML = skel(2);
  api('getQuestionStats', { eventId: ev.id }).then(function (d) {
    if (thStale(ev.id, 'qstats')) return;
    var tl = d.timeline.slice(-30), maxT = 1; tl.forEach(function (t) { maxT = Math.max(maxT, t.n); });
    var mc = Math.max.apply(null, d.byCategory.map(function (x) { return x.count; }).concat([1])), me = Math.max.apply(null, d.byExec.map(function (x) { return x.count; }).concat([1]));
    var h = pageHead('ภาพรวมคำถาม', 'ข้อมูล ณ ' + esc(thShort(d.generatedAt)), '<button class="btn" id="qsR">' + ic('refresh') + 'รีเฟรช</button>');
    h += '<div class="kpis">' + kpi('คำถามทั้งหมด', nf(d.total), 'ใช้งาน ' + nf(d.active), '', 'chat') + kpi('ผู้ส่งคำถาม', nf(d.askers), 'คน', '', 'users') + kpi('ยังไม่จัดหมวด', nf(d.uncategorized), 'คำถาม', d.uncategorized ? 'var(--warn)' : 'var(--ok)', 'alert') + kpi('รวม/ซ่อน', nf(d.merged) + ' / ' + nf(d.hidden), 'คำถาม', '', 'merge') + kpi('ถามในห้อง', nf(d.room), 'คำถาม', '', 'tv') + '</div>';
    h += '<div class="dgrid"><div class="stack"><div class="card"><div class="hd"><h3>' + ic('layers') + ' ตามหมวด</h3></div><div class="bd">' + hbars(d.byCategory.map(function (x) { return { label: x.label, n: x.count }; }), mc) + '</div></div>' +
      '<div class="card"><div class="hd"><h3>' + ic('calendar') + ' รายวัน</h3></div><div class="bd">' + (tl.length ? '<div class="timeline">' + tl.map(function (t) { return '<div class="col" title="' + esc(thDate(t.d, false)) + ' · ' + t.n + '"><div class="bar" style="height:' + Math.max(4, t.n / maxT * 100) + '%"></div><small>' + esc(thShort(t.d).split(' ').slice(0, 2).join(' ')) + '</small></div>'; }).join('') + '</div>' : '<div class="muted small">ยังไม่มีคำถาม</div>') + '</div></div></div>' +
      '<div class="stack"><div class="card"><div class="hd"><h3>' + ic('users') + ' มอบหมายผู้บริหาร</h3></div><div class="bd">' + hbars(d.byExec.map(function (x) { return { label: x.name + ' · ' + x.position, n: x.count }; }), me) + '</div></div></div></div>';
    $('#page').innerHTML = h;
    $('#qsR').onclick = function () { qStats(ev); };
  }).catch(errToast);
}
function qExec(ev) {
  $('#page').innerHTML = skel(2);
  api('getExecPack', { eventId: ev.id }).then(function (d) {
    if (thStale(ev.id, 'exec')) return;
    var cfg = ev.config || {}, mode = { CC: 'ส่งสำเนา (CC) ทุกฉบับ', TO: 'ส่งถึงโดยตรงเหมือนผู้บริหารท่านอื่น', NONE: 'ไม่ส่ง' }[d.directorMode];
    var nSend = d.execs.filter(function (x) { return x.send; }).length, noMail = d.execs.filter(function (x) { return x.send && !x.hasEmail; });
    var h = pageHead('ส่งคำถามถึงผู้บริหาร', 'คำถามที่จะส่ง ' + nf(d.total) + ' ข้อ (เฉพาะสถานะใช้งาน) · กำหนดส่ง ' + esc(thDate(cfg.execSendDate, false)),
      '<button class="btn" id="exX">' + ic('download') + 'Excel คำถามทั้งหมด</button><button class="btn" id="exT">' + ic('send') + 'ส่งทดสอบถึงอีเมลฉัน</button><button class="btn primary" id="exS" ' + (d.total ? '' : 'disabled') + ' data-busy="กำลังส่ง…">' + ic('send') + 'ส่งถึงผู้บริหาร ' + nSend + ' ท่าน</button>');
    if (d.uncategorized || d.noExec) h += '<div class="announce">' + ic('alert') + '<div>ยังไม่จัดหมวด <b>' + d.uncategorized + '</b> ข้อ · ยังไม่ระบุผู้บริหาร <b>' + d.noExec + '</b> ข้อ — ส่งได้ แต่ข้อเหล่านี้จะไม่ถูกไฮไลต์ให้ผู้บริหารท่านใด <a href="#/admin/ev/' + esc(ev.id) + '/questions">ไปจัดหมวด</a></div></div>';
    h += '<div class="announce" style="background:#fff;border-color:var(--line)">' + ic('info') + '<div>ทุกท่านได้รับ <b>คำถามทั้งหมด</b> (ไฮไลต์สีเหลืองเฉพาะข้อที่มอบหมายให้ท่าน) + แนบ PDF · ผู้อำนวยการ: <b>' + esc(mode) + '</b> (เปลี่ยนได้ที่แท็บตั้งค่า) · ไม่มีชื่อผู้ถามในอีเมล</div></div>';
    if (noMail.length) h += '<div class="announce">' + ic('alert') + '<div>ไม่มีอีเมล: ' + noMail.map(function (x) { return esc(x.name); }).join(', ') + ' — เพิ่มที่แท็บตั้งค่า</div></div>';
    h += '<div class="card"><div class="tablewrap"><table class="t"><thead><tr><th>ผู้บริหาร</th><th>อีเมล</th><th class="r">ข้อที่มอบหมาย</th><th>การส่ง</th><th class="r"></th></tr></thead><tbody>' +
      d.execs.map(function (x) { return '<tr><td><b>' + esc(x.name) + '</b><div class="sub">' + esc(x.position) + '</div></td><td>' + (x.hasEmail ? '<span class="small">' + esc(x.email) + '</span>' : '<span class="chip warn">ไม่มีอีเมล</span>') + '</td><td class="r num"><b>' + nf(x.count) + '</b></td><td>' + (x.send ? '<span class="chip ok">ส่งถึง</span>' : x.cc ? '<span class="chip info">สำเนา (CC)</span>' : '<span class="chip">ไม่ส่ง</span>') + '</td>' +
        '<td class="r" style="white-space:nowrap">' + (x.send ? '<button class="btn sm" data-pv="' + x.id + '">' + ic('eye') + 'ตัวอย่าง</button> ' : '') + '<button class="btn sm" data-xl="' + x.id + '">' + ic('download') + 'Excel</button></td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('history') + ' บันทึกการส่ง</h3></div><div class="bd">' + (d.log.length ? '<div class="tablewrap"><table class="t"><thead><tr><th>เวลา</th><th class="r">ผู้รับ</th><th class="r">สำเร็จ</th><th class="r">ล้มเหลว</th><th>โดย</th><th>หมายเหตุ</th></tr></thead><tbody>' + d.log.map(function (r) { return '<tr><td>' + esc(thShort(r.ts)) + '</td><td class="r">' + r.recipients + '</td><td class="r" style="color:var(--ok)">' + r.sent + '</td><td class="r">' + r.failed + '</td><td>' + esc(r.actor) + '</td><td class="small">' + esc(r.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="muted small">ยังไม่เคยส่ง</div>') + '</div></div>';
    $('#page').innerHTML = h;
    var xl = function (execId) {
      var ex = d.execs.filter(function (x) { return x.id === execId; })[0], nm = {}; d.execs.forEach(function (x) { nm[x.id] = x.name; });
      var rows = [['ลำดับ', ex ? 'มอบหมายให้ท่าน' : 'ผู้บริหารที่ตอบ', 'คำถาม', 'หมวด', 'ผู้บริหารที่ควรตอบ', 'คำถามที่รวมเข้ามา']].concat(d.list.map(function (q) { return [q.no, ex ? (q.execs.indexOf(ex.id) >= 0 ? '★' : '') : q.execs.map(function (e) { return nm[e]; }).join(', '), q.text, q.catLabel, q.execs.map(function (e) { return nm[e]; }).join(', '), q.merged]; }));
      exportXlsx('คำถามจากบุคลากร' + (ex ? '_' + ex.name.replace(/[^฀-๿a-zA-Z]/g, '') : '') + '_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'คำถาม', rows: rows, widths: [7, 14, 80, 34, 40, 10] }]).catch(errToast);
    };
    $('#exX').onclick = function () { xl(null); };
    $$('[data-xl]').forEach(function (b) { b.onclick = function () { xl(b.dataset.xl); }; });
    $$('[data-pv]').forEach(function (b) { b.onclick = function () { var m = modal({ title: 'ตัวอย่างอีเมล', size: 'lg', body: skel(1) }); api('sendExecQuestions', { eventId: ev.id, preview: b.dataset.pv }).then(function (pv) { $('.mb', m.el).innerHTML = '<div class="small muted" style="margin-bottom:8px"><b>ถึง:</b> ' + esc(pv.to) + '<br><b>หัวเรื่อง:</b> ' + esc(pv.subject) + '</div><iframe class="mailframe" id="pvF"></iframe>'; $('#pvF').srcdoc = pv.html; }).catch(function (e) { m.close(); errToast(e); }); }; });
    $('#exT').onclick = function () {
      var me = ''; try { me = localStorage.getItem('hrc_testmail') || S.me.email || ''; } catch (e) { }
      var m = modal({ title: 'ส่งทดสอบ', body: '<div class="field"><label class="f">ส่งถึงอีเมล</label><input class="input" id="tmTo" type="email" value="' + esc(me) + '"></div><div class="small muted">ส่ง 1 ฉบับ (ตัวอย่างของผู้บริหารท่านแรก) พร้อมไฟล์แนบ</div>', foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="tmGo" data-busy="กำลังส่ง…">' + ic('send') + 'ส่งทดสอบ</button>' });
      $('#tmGo').onclick = function () { var to = $('#tmTo').value.trim(); try { localStorage.setItem('hrc_testmail', to); } catch (e) { } busy(this, api('sendExecQuestions', { eventId: ev.id, testTo: to })).then(function () { m.close(); toast('ส่งอีเมลทดสอบถึง ' + to + ' แล้ว', 'ok'); }).catch(errToast); };
    };
    $('#exS').onclick = function () {
      var b = this;
      confirmBox({ title: 'ส่งคำถาม ' + nf(d.total) + ' ข้อ ถึงผู้บริหาร ' + nSend + ' ท่าน?', icon: 'send', ok: 'ส่งเลย', msg: 'ผู้อำนวยการ: ' + esc(mode) + (d.uncategorized ? '<br><span style="color:var(--warn)">ยังไม่จัดหมวด ' + d.uncategorized + ' ข้อ</span>' : '') + '<br>ส่งซ้ำได้ (เช่น หลังแก้ไข) ผู้บริหารจะได้รับฉบับใหม่' }).then(function (y) {
        if (!y) return;
        busy(b, api('sendExecQuestions', { eventId: ev.id })).then(function (r) { toast('ส่งแล้ว ' + r.sent + '/' + r.recipients + ' ท่าน' + (r.failed ? ' · ไม่สำเร็จ ' + r.failed + ' (' + r.errors.join(', ') + ')' : ''), r.failed ? 'warn' : 'ok', 'ส่งคำถามถึงผู้บริหาร'); qExec(ev); }).catch(errToast);
      });
    };
  }).catch(errToast);
}
/* ---------- จอถามในห้อง (ผู้ดำเนินรายการ) ---------- */
function qrDataUrl(text, color) {
  return loadScript('lib-qrcode.js', 'qrcode').then(function (qrcode) {
    var q = qrcode(0, 'M'); q.addData(text); q.make();
    var n = q.getModuleCount(), scale = Math.max(4, Math.floor(640 / (n + 8))), pad = 4 * scale, size = n * scale + pad * 2;
    var cv = document.createElement('canvas'); cv.width = cv.height = size; var g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = color || '#111';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(pad + c * scale, pad + r * scale, scale, scale);
    return cv.toDataURL('image/png');
  });
}
function thFull(el) { var f = el.requestFullscreen || el.webkitRequestFullscreen; if (document.fullscreenElement) document.exitFullscreen(); else if (f) f.call(el); }
function qRoom(ev) {
  var cfg = ev.config || {}, r = cfg.inRoom || {}, url = (S.boot.brand && S.boot.brand.webUrl) || (location.origin + location.pathname);
  var h = pageHead('จอถามในห้องประชุม', 'คำถามที่ส่งระหว่างงาน (ช่องทาง "ถามในห้อง") · อัปเดตอัตโนมัติทุก 8 วินาที',
    '<button class="btn" id="rmT">' + ic('settings') + (r.enabled ? 'ปิดรับคำถามในห้อง' : 'เปิดรับคำถามในห้อง') + '</button><button class="btn primary" id="rmF">' + ic('expand') + 'เต็มจอ</button>');
  h += '<div class="announce" style="background:#fff;border-color:var(--line)">' + ic('info') + '<div>สถานะ: ' + (r.enabled ? '<b style="color:var(--ok)">เปิด</b> ช่วง ' + esc(thDate(r.openAt)) + ' – ' + esc(thHHMM(r.closeAt)) : '<b>ปิดอยู่</b>') + ' · บุคลากรส่งคำถามจากหน้า "ส่งคำถามถึงผู้บริหาร" เดิม (สแกน QR ด้านขวา)</div></div>';
  h += '<div class="th-room-wrap" id="rmBox"><div class="th-room-list" id="rmL">' + skel(2) + '</div><div class="th-room-side"><img id="rmQ" alt="QR"><div class="small">สแกนเพื่อส่งคำถาม</div><div class="th-room-n" id="rmN">–</div><div class="small">คำถามในห้อง</div></div></div>';
  $('#page').innerHTML = h;
  qrDataUrl(url.replace(/[?#].*$/, '') + '#/event/' + ev.id, '#111').then(function (u) { var im = $('#rmQ'); if (im) im.src = u; });
  var seen = {};
  var load = function () {
    if (thStale(ev.id, 'room')) return clearInterval(window._thTimer);
    api('listQuestions', { eventId: ev.id, channel: 'ROOM' }).then(function (d) {
      if (thStale(ev.id, 'room')) return;
      var l = d.questions.filter(function (q) { return q.status === 'ACTIVE'; }).reverse();
      $('#rmN').textContent = nf(l.length);
      $('#rmL').innerHTML = l.length ? l.map(function (q) { var nw = !seen[q.id]; seen[q.id] = 1; return '<div class="th-rq' + (nw ? ' new' : '') + '"><div class="t">' + esc(q.text).replace(/\n/g, '<br>') + '</div><div class="row between small muted"><span>' + esc(thHHMM(q.createdAt)) + (q.displayName ? ' · ' + esc(q.displayName) : '') + '</span><button class="btn sm ghost" data-hd="' + q.id + '">' + ic('eyeoff') + 'ซ่อน</button></div></div>'; }).join('') : '<div class="empty">' + ic('chat') + '<p>ยังไม่มีคำถามจากในห้อง</p></div>';
      $$('[data-hd]').forEach(function (b) { b.onclick = function () { api('updateQuestions', { eventId: ev.id, items: [{ id: b.dataset.hd, status: 'HIDDEN' }] }).then(load).catch(errToast); }; });
    }).catch(function () { });
  };
  load(); clearInterval(window._thTimer); window._thTimer = setInterval(load, 8000);
  $('#rmF').onclick = function () { thFull($('#rmBox')); };
  $('#rmT').onclick = function () {
    var on = !r.enabled, today = localIso().slice(0, 10);
    var m = modal({ title: on ? 'เปิดรับคำถามในห้อง' : 'ปิดรับคำถามในห้อง', body: on ? '<div class="grid2"><div class="field"><label class="f">เปิด</label><input class="input" type="datetime-local" id="riO" value="' + esc(String(r.openAt || today + 'T13:30').slice(0, 16)) + '"></div><div class="field"><label class="f">ปิด</label><input class="input" type="datetime-local" id="riC" value="' + esc(String(r.closeAt || today + 'T15:30').slice(0, 16)) + '"></div></div><div class="small muted">ระหว่างช่วงเวลานี้ บุคลากรส่งคำถามได้แม้ปิดรับล่วงหน้าแล้ว (ช่องทาง "ถามในห้อง")</div>' : '<p>บุคลากรจะส่งคำถามในห้องไม่ได้อีก</p>',
      foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="riK" data-busy="กำลังบันทึก…">ยืนยัน</button>' });
    $('#riK').onclick = function () {
      var e2 = JSON.parse(JSON.stringify((AD.events || []).filter(function (x) { return x.id === ev.id; })[0] || ev));
      e2.config.inRoom = on ? { enabled: true, openAt: $('#riO').value, closeAt: $('#riC').value } : Object.assign({}, r, { enabled: false });
      busy(this, api('saveEvent', { event: e2 })).then(function () { m.close(); AD.events = null; toast(on ? 'เปิดรับคำถามในห้องแล้ว' : 'ปิดรับคำถามในห้องแล้ว', 'ok'); loadEvents(true).then(function (l) { var x = l.filter(function (y) { return y.id === ev.id; })[0]; qRoom(x || ev); }); }).catch(errToast);
    };
  };
}

/* ---------- วันงาน: จอเช็กอิน (QR หมุนเวียน) ---------- */
function ciLive(ev) {
  var h = pageHead('จอเช็กอิน', 'แสดงบนจอหน้าห้อง · QR เปลี่ยนอัตโนมัติ (กันส่งต่อให้คนนอกห้อง) · อัปเดตทุก 5 วินาที', '<button class="btn primary" id="lvF">' + ic('expand') + 'เต็มจอ</button>');
  h += '<div class="th-live" id="lvBox"><div class="th-live-qr"><div class="th-kicker">' + ic('qr') + ' สแกนเพื่อเช็กอิน</div><img id="lvQ" alt="QR"><div class="small" id="lvT"></div></div>' +
    '<div class="th-live-info"><div class="th-kicker">Hospital Town Hall</div><div class="th-live-n"><b id="lvN">–</b><span>คนเช็กอินแล้ว</span></div><div id="lvW" class="small"></div><div id="lvD" class="th-live-div"></div><div id="lvR" class="th-live-rec"></div></div>' + thValues() + '</div>';
  $('#page').innerHTML = h;
  var lastCode = '', tick = 0;
  var load = function () {
    if (thStale(ev.id, 'live')) return clearInterval(window._thTimer);
    api('getCheckinLive', { eventId: ev.id }).then(function (d) {
      if (thStale(ev.id, 'live')) return;
      $('#lvN').textContent = nf(d.count);
      $('#lvW').innerHTML = d.window === 'OPEN' ? '<span class="chip ok dot live">เปิดเช็กอิน ถึง ' + esc(thHHMM(d.cfg.checkinCloseAt)) + '</span> · ทำแบบประเมินแล้ว ' + nf(d.evals) + ' คน' : d.window === 'BEFORE' ? '<span class="chip warn">ยังไม่ถึงเวลาเช็กอิน (' + esc(thDate(d.cfg.checkinOpenAt)) + ')</span>' : '<span class="chip">ปิดเช็กอินแล้ว</span> · ทำแบบประเมินแล้ว ' + nf(d.evals) + ' คน';
      var mx = (d.byDivision[0] || {}).n || 1;
      $('#lvD').innerHTML = d.byDivision.slice(0, 8).map(function (x) { return '<div class="pbar"><div class="row between"><span class="lbl2">' + esc(x.name) + '</span><b class="num">' + nf(x.n) + '</b></div><div class="track"><div class="fill" style="width:' + (x.n / mx * 100) + '%"></div></div></div>'; }).join('');
      $('#lvR').innerHTML = d.recent.filter(function (r) { return r.name; }).slice(0, 6).map(function (r) { return '<span class="chip">' + ic('check') + esc(r.name) + '</span>'; }).join('');
      if (d.code !== lastCode) { lastCode = d.code; qrDataUrl(d.url, '#111').then(function (u) { var im = $('#lvQ'); if (im) im.src = u; }); }
      tick = d.secLeft;
    }).catch(function (e) { $('#lvW').textContent = e.message; });
  };
  load(); clearInterval(window._thTimer);
  window._thTimer = setInterval(function () { if (thStale(ev.id, 'live')) return clearInterval(window._thTimer); tick = Math.max(0, tick - 1); var t = $('#lvT'); if (t) t.textContent = 'QR ใหม่ใน ' + tick + ' วินาที'; if (tick % 5 === 0) load(); }, 1000);
  $('#lvF').onclick = function () { thFull($('#lvBox')); };
}
/* ---------- โต๊ะลงทะเบียน ---------- */
function ciDesk(ev) {
  var hist = [];
  var h = pageHead('โต๊ะลงทะเบียน', 'สำหรับผู้ที่ไม่สะดวกสแกน QR · พิมพ์เลขประจำตัวบุคลากร 7 หลัก แล้วกด Enter', '');
  h += '<div class="card th-desk"><div class="bd"><div class="row" style="flex-wrap:nowrap"><input class="input" id="dkC" inputmode="numeric" maxlength="10" placeholder="เลขประจำตัวบุคลากร" autocomplete="off" style="font-size:24px;letter-spacing:.08em;max-width:320px"><button class="btn primary lg" id="dkGo" data-busy="กำลังบันทึก…">' + ic('check') + 'เช็กอิน</button></div><div id="dkOut" style="margin-top:14px"></div></div></div>' +
    '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('history') + ' ลงชื่อจากเครื่องนี้</h3></div><div class="bd" id="dkH"><div class="muted small">ยังไม่มี</div></div></div>';
  $('#page').innerHTML = h;
  var inp = $('#dkC'); inp.focus();
  var drawH = function () { $('#dkH').innerHTML = hist.length ? hist.map(function (x, i) { return '<div class="row between" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span><b>' + esc(x.name) + '</b> <span class="small muted">' + esc(x.code + ' · ' + (x.division || '')) + ' · ' + esc(thHHMM(x.at)) + '</span>' + (x.already ? ' <span class="chip">เช็กอินไว้แล้ว</span>' : '') + (x.undone ? ' <span class="chip warn">ยกเลิกแล้ว</span>' : '') + '</span>' + (!x.undone && !x.already ? '<button class="btn sm ghost" data-un="' + i + '">' + ic('x') + 'ยกเลิก</button>' : '') + '</div>'; }).join('') : '<div class="muted small">ยังไม่มี</div>';
    $$('[data-un]').forEach(function (b) { b.onclick = function () { var x = hist[+b.dataset.un]; confirmBox({ title: 'ยกเลิกการเช็กอินของ ' + x.name + '?', ok: 'ยกเลิกเช็กอิน', icon: 'x' }).then(function (y) { if (y) api('deskCheckin', { eventId: ev.id, empCode: x.code, undo: true, reason: 'ลงชื่อผิดคน' }).then(function () { x.undone = true; drawH(); toast('ยกเลิกแล้ว', 'ok'); }).catch(errToast); }); }; }); };
  var go2 = function () {
    var code = inp.value.replace(/\D/g, ''); if (code.length < 4) return toast('กรุณาพิมพ์เลขประจำตัว', 'warn');
    busy($('#dkGo'), api('deskCheckin', { eventId: ev.id, empCode: code })).then(function (r) {
      hist.unshift({ code: code, name: r.name, division: r.division, at: r.at, already: r.already });
      $('#dkOut').innerHTML = '<div class="mybanner" style="margin:0"><div class="big">' + ic('check') + '</div><div><div class="small" style="color:var(--ok);font-weight:700">' + (r.already ? 'เช็กอินไว้แล้วเมื่อ ' + esc(thHHMM(r.at)) : 'เช็กอินเรียบร้อย') + '</div><h3>' + esc(r.name) + '</h3><div class="small muted">' + esc([r.position, r.unit, r.division].filter(Boolean).join(' · ')) + '</div></div></div>';
      inp.value = ''; inp.focus(); drawH();
    }).catch(function (e) { $('#dkOut').innerHTML = '<div class="announce">' + ic('alert') + '<div>' + esc(e.message) + '</div></div>'; inp.select(); });
  };
  $('#dkGo').onclick = go2; inp.onkeydown = function (e) { if (e.key === 'Enter') go2(); };
}
/* ---------- ผลแบบประเมิน ---------- */
function ciEvalRes(ev) {
  $('#page').innerHTML = skel(3);
  api('getEvalResults', { eventId: ev.id }).then(function (d) {
    if (thStale(ev.id, 'evalres')) return;
    var by = {}; d.items.forEach(function (it) { by[it.key] = it; });
    var h = pageHead('ผลแบบประเมิน', 'ข้อมูล ณ ' + esc(thShort(d.generatedAt)) + ' · ไม่มีข้อมูลระบุตัวผู้ตอบ', '<button class="btn" id="erR">' + ic('refresh') + 'รีเฟรช</button><button class="btn primary" id="erX" data-busy="กำลังสร้างไฟล์…">' + ic('download') + 'ส่งออก Excel</button>');
    var sc = d.items.filter(function (x) { return x.mean; }), avg = sc.length ? Math.round(sc.reduce(function (s, x) { return s + x.mean; }, 0) / sc.length * 100) / 100 : 0;
    h += '<div class="kpis">' + kpi('ตอบแบบประเมิน', nf(d.total), 'ฉบับ', '', 'edit') + kpi('ผู้เข้าร่วม (เช็กอิน)', nf(d.attendees), 'คน', '', 'users') + kpi('อัตราการตอบ', d.rate + '%', 'ของผู้เข้าร่วม', '', 'chart') + kpi('คะแนนเฉลี่ยรวม', avg || '–', 'เต็ม 5', 'var(--ok)', 'star') + '</div>';
    d.sections.forEach(function (s) {
      var its = s.keys.map(function (k) { return by[k]; }).filter(Boolean); if (!its.length) return;
      h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + esc(s.title) + '</h3></div><div class="bd">';
      var scale = its.filter(function (x) { return x.dist; }), other = its.filter(function (x) { return !x.dist; });
      if (scale.length) h += '<div class="tablewrap"><table class="t"><thead><tr><th>ข้อ</th><th class="r">n</th><th class="r">เฉลี่ย</th><th class="r">4–5</th><th style="width:34%">การกระจาย (1→5)</th></tr></thead><tbody>' + scale.map(function (x) {
        return '<tr><td>' + esc(x.label) + '</td><td class="r num">' + x.n + '</td><td class="r num"><b>' + (x.n ? x.mean.toFixed(2) : '–') + '</b></td><td class="r num">' + (x.n ? x.top2 + '%' : '–') + '</td><td><div class="th-dist">' + x.dist.map(function (n, i) { return '<i class="d' + (i + 1) + '" style="flex:' + (n || 0.0001) + '" title="' + (i + 1) + ': ' + n + '"></i>'; }).join('') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
      other.forEach(function (x) {
        if (x.counts) { var mx = Math.max.apply(null, x.counts.map(function (c) { return c.n; }).concat([1])); h += '<h4 style="margin:14px 0 6px">' + esc(x.label) + ' <span class="small muted">(n=' + x.n + ')</span></h4>' + hbars(x.counts.map(function (c) { return { label: c.label, n: c.n }; }), mx); }
        else if (x.texts) h += '<details class="th-det" style="margin-top:12px"><summary><b>' + esc(x.label) + '</b> · ' + x.n + ' ข้อความ</summary><ul class="th-texts">' + x.texts.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';
      });
      h += '</div></div>';
    });
    h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('building') + ' ผู้ตอบตามฝ่าย</h3><span class="small muted">ฝ่ายที่มีผู้ตอบน้อยกว่า ' + d.minGroup + ' คน รวมเป็น "อื่น ๆ" เพื่อความเป็นส่วนตัว</span></div><div class="bd">' + hbars(d.byDivision.map(function (x) { return { label: x.name, n: x.n }; }), (d.byDivision[0] || {}).n) + '</div></div>';
    $('#page').innerHTML = h;
    $('#erR').onclick = function () { ciEvalRes(ev); };
    $('#erX').onclick = function () {
      busy(this, api('getEvalResults', { eventId: ev.id, withRaw: true })).then(function (x) {
        var sum = [['ข้อ', 'คำถาม', 'จำนวนผู้ตอบ', 'ค่าเฉลี่ย', 'ร้อยละ 4–5', '1', '2', '3', '4', '5']];
        x.items.forEach(function (it) { if (it.dist) sum.push([it.key, it.label, it.n, it.mean, it.top2].concat(it.dist)); else if (it.counts) { sum.push([it.key, it.label, it.n]); it.counts.forEach(function (c) { sum.push(['', '   ' + c.label, c.n]); }); } });
        var keys = x.items.map(function (it) { return it.key; }), raw = [['#'].concat(x.items.map(function (it) { return it.key + ' ' + it.label.slice(0, 40); }))].concat((x.raw || []).map(function (a, i) { return [i + 1].concat(keys.map(function (k) { var v = a[k]; return Array.isArray(v) ? v.join(', ') : v == null ? '' : v; })); }));
        var txt = [['ข้อ', 'ข้อความ']]; x.items.filter(function (it) { return it.texts; }).forEach(function (it) { it.texts.forEach(function (t) { txt.push([it.label, t]); }); });
        return exportXlsx('ผลแบบประเมิน_TownHall_' + localIso().slice(0, 10) + '.xlsx', [{ name: 'สรุป', rows: sum, widths: [6, 70, 10, 9, 10, 6, 6, 6, 6, 6] }, { name: 'ความคิดเห็น', rows: txt, widths: [50, 90] }, { name: 'ข้อมูลดิบ (ไม่ระบุตัวตน)', rows: raw }]);
      }).catch(errToast);
    };
  }).catch(errToast);
}

/* =================================================================== ตั้งค่ากิจกรรม Town Hall (ใช้ใน editEvent) */
function thGet(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function thSet(o, p, v) { var ks = p.split('.'), last = ks.pop(); ks.forEach(function (k) { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); o[last] = v; }
function thF(label, path, c, opt) {
  opt = opt || {}; var v = thGet(c, path), t = opt.type || 'text';
  if (t === 'check') return '<label class="switch" style="margin:4px 0 12px"><input type="checkbox" data-tc="' + path + '" data-tt="check" ' + (v ? 'checked' : '') + '><span class="tr"></span>' + label + '</label>';
  if (t === 'lines') return '<div class="field"><label class="f">' + label + '</label><textarea class="input" data-tc="' + path + '" data-tt="lines" style="min-height:' + (opt.h || 100) + 'px">' + esc((v || []).join('\n')) + '</textarea>' + (opt.hint ? '<div class="hint">' + opt.hint + '</div>' : '') + '</div>';
  if (t === 'area') return '<div class="field"><label class="f">' + label + '</label><textarea class="input" data-tc="' + path + '" data-tt="text" style="min-height:' + (opt.h || 80) + 'px">' + esc(v || '') + '</textarea></div>';
  if (t === 'select') return '<div class="field"><label class="f">' + label + '</label><select class="input" data-tc="' + path + '" data-tt="text">' + opt.options.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' + (opt.hint ? '<div class="hint">' + opt.hint + '</div>' : '') + '</div>';
  var it = t === 'dt' ? 'datetime-local' : t === 'date' ? 'date' : t === 'num' ? 'number' : 'text';
  var val = t === 'dt' ? String(v || '').slice(0, 16) : t === 'date' ? String(v || '').slice(0, 10) : t === 'csv' ? (v || []).join(', ') : v == null ? '' : v;
  return '<div class="field"><label class="f">' + label + '</label><input class="input" type="' + it + '" data-tc="' + path + '" data-tt="' + t + '" value="' + esc(val) + '"' + (opt.min != null ? ' min="' + opt.min + '"' : '') + (opt.max != null ? ' max="' + opt.max + '"' : '') + '>' + (opt.hint ? '<div class="hint">' + opt.hint + '</div>' : '') + '</div>';
}
function thBox(title, icon, body, sub) { return '<div class="card"><div class="hd"><div><h3>' + ic(icon) + ' ' + title + '</h3>' + (sub ? '<div class="small muted">' + sub + '</div>' : '') + '</div></div><div class="bd">' + body + '</div></div>'; }
function thEditor(ED) {
  var c = ED.config, m = ED.mail || {}, h = '';
  var contact = '<div class="grid2">' + thF('ผู้ประสานงาน', 'contact.name', c) + thF('โทรภายใน', 'contact.phone', c) + '</div>';
  if (ED.type === 'NOMINATE') {
    h += thBox('กติกาการเสนอชื่อ', 'award', '<div class="grid3">' + thF('เสนอได้สูงสุดต่อหมวด (ชื่อ)', 'maxPerCat', c, { type: 'num', min: 1, max: 10 }) + thF('ต้องเสนออย่างน้อย (ชื่อ รวมทุกหมวด)', 'minTotal', c, { type: 'num', min: 1, max: 20 }) + thF('จำนวนอันดับที่ส่งกรรมการ (Top N ต่อหมวด)', 'topN', c, { type: 'num', min: 1, max: 100, hint: 'คะแนนเท่ากันที่อันดับสุดท้ายได้ไปด้วย' }) + '</div>' +
      '<div class="grid2">' + thF('ความยาวเหตุผลสูงสุด (ตัวอักษร)', 'reasonMax', c, { type: 'num', min: 50, max: 3000 }) + '<div>' + thF('เสนอชื่อตนเองได้', 'allowSelf', c, { type: 'check' }) + thF('ส่งข้อความเหตุผลให้คณะกรรมการ (แจ้งบนแบบฟอร์ม)', 'reasonsToCommittee', c, { type: 'check' }) + '</div></div>');
    h += thBox('การตรวจคุณสมบัติเบื้องต้น', 'shield', '<div class="small muted" style="margin-bottom:10px">ระบบใช้ตรวจคร่าว ๆ เพื่อช่วย HR เท่านั้น ไม่ตัดสิทธิ์อัตโนมัติ — HR ยืนยัน/ตัดเองในแท็บ "ผลการเสนอชื่อ"</div><div class="grid3">' +
      thF('เกรดที่ผ่าน (คั่นด้วย ,)', 'passGrades', c, { type: 'csv', hint: 'A = โดดเด่น · B = ดีมาก' }) + thF('อายุงานขั้นต่ำ (ปี)', 'tenureYears', c, { type: 'num', min: 0, max: 30 }) + thF('นับอายุงานถึงวันที่', 'tenureRefDate', c, { type: 'date' }) + '</div>' +
      '<div class="grid2">' + thF('ชื่อที่ไม่อยู่ในรายชื่อให้เสนอ (บรรทัดละ 1 ชื่อ)', 'excludeNames', c, { type: 'lines', h: 140, hint: 'ค่าเริ่มต้น = ผู้บริหาร 13 ท่าน (คณะกรรมการ)' }) + thF('รหัสที่ไม่อยู่ในรายชื่อ (บรรทัดละ 1 รหัส)', 'excludeCodes', c, { type: 'lines', h: 140 }) + '</div>');
    h += '<div class="card"><div class="hd"><div><h3>' + ic('layers') + ' หมวดบุคลากรดีเด่น (' + c.categories.length + ')</h3><div class="small muted">อย่าเปลี่ยน "รหัสหมวด" หลังเปิดให้เสนอชื่อแล้ว</div></div><button type="button" class="btn sm" id="thCatAdd">' + ic('plus') + 'เพิ่มหมวด</button></div><div class="bd"><div class="tablewrap"><table class="t pkedit"><thead><tr><th style="width:64px">รหัส</th><th style="width:28%">ประเภท</th><th>ชื่อหมวด / คำอธิบาย</th><th style="width:40px"></th></tr></thead><tbody>' +
      c.categories.map(function (x, i) { return '<tr data-tcat="' + i + '"><td><input class="input" data-f="key" value="' + esc(x.key) + '"></td><td><input class="input" data-f="group" value="' + esc(x.group || '') + '"></td><td><input class="input" data-f="label" value="' + esc(x.label) + '"><input class="input sm" data-f="desc" value="' + esc(x.desc || '') + '" placeholder="คำอธิบาย (ถ้ามี)" style="margin-top:6px"></td><td><button type="button" class="iconbtn" data-tcdel="' + i + '" title="ลบ">' + ic('trash') + '</button></td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    h += thBox('หลักเกณฑ์ (ให้ผู้เสนอติ๊กเหตุผล)', 'check', '<div class="grid2">' + thF('หลักเกณฑ์ฉบับเต็ม (บรรทัดละ 1 ข้อ)', 'criteria', c, { type: 'lines', h: 200 }) + thF('ชื่อย่อสำหรับปุ่มติ๊ก (ลำดับตรงกับฉบับเต็ม)', 'criteriaShort', c, { type: 'lines', h: 200 }) + '</div>' +
      thF('คุณสมบัติผู้ได้รับการเสนอชื่อ (แสดงให้ผู้เสนออ่าน)', 'qualifications', c, { type: 'lines', h: 120 }) + thF('คำชี้แจงบนแบบฟอร์ม (บรรทัดละ 1 ข้อ)', 'notice', c, { type: 'lines', h: 150 }) + thF('อ้างอิงเอกสาร', 'refDoc', c, { type: 'area', h: 60 }) + contact);
  } else if (ED.type === 'QUESTION') {
    h += thBox('การส่งคำถาม', 'chat', '<div class="grid3">' + thF('ความยาวสูงสุดต่อคำถาม (ตัวอักษร)', 'maxLen', c, { type: 'num', min: 100, max: 5000 }) + thF('ส่งได้สูงสุดต่อคน/วัน (กันสแปม)', 'perDayLimit', c, { type: 'num', min: 1, max: 500 }) + thF('วันส่งคำถามถึงผู้บริหาร', 'execSendDate', c, { type: 'date', hint: 'ใช้แสดงในหน้าจัดการ (กดส่งเองที่แท็บ "ส่งผู้บริหาร")' }) + '</div>' +
      thF('ให้ผู้ถามเลือก "ยินดีเปิดเผยชื่อ" ได้', 'allowShowName', c, { type: 'check' }) +
      thF('ผู้อำนวยการ', 'directorMode', c, { type: 'select', options: [['CC', 'ส่งสำเนา (CC) ทุกฉบับ'], ['TO', 'ส่งถึงโดยตรงเหมือนผู้บริหารท่านอื่น'], ['NONE', 'ไม่ส่ง']] }));
    h += thBox('ถามในห้องประชุม (วันงาน)', 'tv', thF('เปิดรับคำถามในห้อง', 'inRoom.enabled', c, { type: 'check' }) + '<div class="grid2">' + thF('เปิด', 'inRoom.openAt', c, { type: 'dt' }) + thF('ปิด', 'inRoom.closeAt', c, { type: 'dt' }) + '</div><div class="small muted">ช่วงนี้บุคลากรส่งคำถามได้แม้ปิดรับล่วงหน้าแล้ว · เปิด/ปิดด่วนได้ที่แท็บ "จอถามในห้อง"</div>');
    h += '<div class="card"><div class="hd"><div><h3>' + ic('users') + ' ผู้บริหาร (' + c.execs.length + ')</h3><div class="small muted">อีเมลเก็บใน Apps Script เท่านั้น ไม่แสดงในหน้าเว็บบุคลากร</div></div><button type="button" class="btn sm" id="thExAdd">' + ic('plus') + 'เพิ่ม</button></div><div class="bd"><div class="tablewrap"><table class="t pkedit"><thead><tr><th style="width:62px">รหัส</th><th>ชื่อ / ตำแหน่ง</th><th>อีเมล / หน่วยงานที่กำกับ</th><th style="width:70px">ผอ.</th><th style="width:40px"></th></tr></thead><tbody>' +
      c.execs.map(function (x, i) { return '<tr data-tex="' + i + '"><td><input class="input" data-f="id" value="' + esc(x.id) + '"></td><td><input class="input" data-f="name" value="' + esc(x.name) + '"><input class="input sm" data-f="position" value="' + esc(x.position || '') + '" style="margin-top:6px"></td><td><input class="input" type="email" data-f="email" value="' + esc(x.email || '') + '" placeholder="อีเมล"><input class="input sm" data-f="units" value="' + esc(x.units || '') + '" style="margin-top:6px" placeholder="หน่วยงานที่กำกับ"></td><td style="text-align:center"><input type="checkbox" data-f="director" ' + (x.director ? 'checked' : '') + '></td><td><button type="button" class="iconbtn" data-texdel="' + i + '">' + ic('trash') + '</button></td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    h += '<div class="card"><div class="hd"><div><h3>' + ic('layers') + ' หมวดคำถาม → ผู้บริหารที่ควรตอบ</h3><div class="small muted">เมื่อ HR จัดหมวด ระบบเติมผู้บริหารตามตารางนี้ให้ (แก้รายข้อได้)</div></div><button type="button" class="btn sm" id="thQcAdd">' + ic('plus') + 'เพิ่มหมวด</button></div><div class="bd">' +
      c.categories.map(function (x, i) { return '<div data-tqc="' + i + '" style="border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:10px"><div class="row" style="flex-wrap:nowrap"><input class="input" data-f="key" value="' + esc(x.key) + '" style="width:64px"><input class="input" data-f="label" value="' + esc(x.label) + '" style="flex:1"><button type="button" class="iconbtn" data-tqcdel="' + i + '">' + ic('trash') + '</button></div><div class="th-chips" style="margin-top:8px">' + c.execs.map(function (e) { return '<label class="chip"><input type="checkbox" data-qe="' + esc(e.id) + '" ' + ((x.execs || []).indexOf(e.id) >= 0 ? 'checked' : '') + '> ' + esc(e.name) + '</label>'; }).join('') + '</div></div>'; }).join('') + '</div></div>';
    h += thBox('คำชี้แจงความเป็นส่วนตัว', 'lock', thF('แสดงก่อนส่งคำถาม (บรรทัดละ 1 ข้อ)', 'privacy', c, { type: 'lines', h: 180 }) + contact);
  } else {
    h += thBox('วันงาน', 'calendar', '<div class="grid3">' + thF('วันที่จัดงาน', 'date', c, { type: 'date' }) + thF('เวลา (ข้อความ)', 'timeText', c) + thF('สถานที่', 'venue', c) + '</div>' +
      '<div class="tablewrap"><table class="t pkedit"><thead><tr><th style="width:110px">เวลา</th><th>หัวข้อ</th><th style="width:30%">โดย</th><th style="width:40px"></th></tr></thead><tbody>' + (c.agenda || []).map(function (a, i) { return '<tr data-tag="' + i + '"><td><input class="input" data-f="time" value="' + esc(a.time) + '"></td><td><input class="input" data-f="title" value="' + esc(a.title) + '"></td><td><input class="input" data-f="by" value="' + esc(a.by || '') + '"></td><td><button type="button" class="iconbtn" data-tagdel="' + i + '">' + ic('trash') + '</button></td></tr>'; }).join('') + '</tbody></table></div><button type="button" class="btn sm" id="thAgAdd" style="margin-top:8px">' + ic('plus') + 'เพิ่มกำหนดการ</button>');
    h += thBox('เช็กอิน', 'qr', '<div class="grid2">' + thF('เปิดเช็กอิน', 'checkinOpenAt', c, { type: 'dt' }) + thF('ปิดเช็กอิน', 'checkinCloseAt', c, { type: 'dt' }) + '</div>' +
      thF('ต้องสแกน QR ที่จอหน้าห้อง (ปิด = กดเช็กอินจากมือถือได้เลยในช่วงเวลา)', 'requireQr', c, { type: 'check' }) +
      '<div class="grid2">' + thF('QR เปลี่ยนทุก (วินาที)', 'qrRotateSec', c, { type: 'num', min: 15, max: 600 }) + thF('QR เก่ายังใช้ได้อีก (รอบ)', 'qrGraceSlots', c, { type: 'num', min: 0, max: 30, hint: 'เผื่อสแกนแล้วเน็ตช้า · 5 รอบ × 60 วิ = 5 นาที' }) + '</div>' +
      thF('แสดงชื่อผู้เช็กอินล่าสุดบนจอ', 'liveShowNames', c, { type: 'check' }));
    h += thBox('แบบประเมิน', 'star', thF('เปิดแบบประเมิน', 'evalEnabled', c, { type: 'check' }) + thF('ให้ทุกคนทำได้ (ปิด = เฉพาะผู้ที่เช็กอินแล้ว)', 'evalForAll', c, { type: 'check' }) +
      '<div class="grid2">' + thF('เปิดให้ทำตั้งแต่', 'evalOpenAt', c, { type: 'dt', hint: 'ปิดพร้อมวันปิดรับของกิจกรรม' }) + thF('รายงานรายฝ่าย: รวมฝ่ายที่ตอบน้อยกว่า (คน)', 'minGroupReport', c, { type: 'num', min: 1, max: 50 }) + '</div>' + thF('ข้อความนำ', 'evalIntro', c, { type: 'area', h: 60 }));
    var TT = [['scale5', 'ระดับ 1–5 (พึงพอใจ)'], ['agree5', 'ระดับ 1–5 (เห็นด้วย)'], ['single', 'เลือก 1 ข้อ'], ['multi', 'เลือกได้หลายข้อ'], ['text', 'ข้อความ'], ['heading', 'หัวข้อย่อย']];
    h += '<div class="card"><div class="hd"><div><h3>' + ic('edit') + ' ข้อคำถามในแบบประเมิน</h3><div class="small muted">ห้ามเปลี่ยน "รหัสข้อ" หลังมีผู้ตอบแล้ว (ผลจะแยกกัน)</div></div><button type="button" class="btn sm" id="thSecAdd">' + ic('plus') + 'เพิ่มส่วน</button></div><div class="bd">' +
      (c.eval || []).map(function (s, si) {
        return '<details class="th-det" data-tsec="' + si + '"' + (si < 1 ? ' open' : '') + '><summary><b>' + esc(s.title) + '</b> · ' + (s.items || []).length + ' ข้อ</summary><div style="padding:10px 0"><div class="row" style="flex-wrap:nowrap"><input class="input" data-s="title" value="' + esc(s.title) + '"><button type="button" class="iconbtn" data-tsecdel="' + si + '" title="ลบส่วนนี้">' + ic('trash') + '</button></div><input class="input sm" data-s="desc" value="' + esc(s.desc || '') + '" placeholder="คำอธิบายส่วน" style="margin-top:6px">' +
          (s.items || []).map(function (it, ii) {
            var ch = it.type === 'single' || it.type === 'multi';
            return '<div class="th-eitem" data-tit="' + ii + '"><div class="row" style="gap:6px"><input class="input" data-i="key" value="' + esc(it.key) + '" style="width:70px"><select class="input" data-i="type" style="width:auto">' + TT.map(function (t) { return '<option value="' + t[0] + '"' + (it.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' +
              '<label class="small" style="white-space:nowrap"><input type="checkbox" data-i="required" ' + (it.required ? 'checked' : '') + '> บังคับ</label>' + (ch ? '<label class="small" style="white-space:nowrap"><input type="checkbox" data-i="other" ' + (it.other ? 'checked' : '') + '> มี "อื่น ๆ"</label>' : '') +
              '<button type="button" class="iconbtn" data-tmv="' + si + ':' + ii + ':-1">' + ic('up') + '</button><button type="button" class="iconbtn" data-tmv="' + si + ':' + ii + ':1">' + ic('down') + '</button><button type="button" class="iconbtn" data-titdel="' + si + ':' + ii + '">' + ic('trash') + '</button></div>' +
              '<input class="input" data-i="label" value="' + esc(it.label) + '" style="margin-top:6px">' + (ch ? '<textarea class="input sm" data-i="options" style="margin-top:6px;min-height:70px" placeholder="ตัวเลือก บรรทัดละ 1">' + esc((it.options || []).join('\n')) + '</textarea>' : '') + '</div>';
          }).join('') + '<button type="button" class="btn sm" data-titadd="' + si + '">' + ic('plus') + 'เพิ่มข้อ</button></div></details>';
      }).join('') + '</div></div>';
    h += thBox('ติดต่อ', 'phone', contact);
  }
  h += thBox('อีเมล', 'mail', '<div class="small muted">ตั้งรอบส่งอีเมลได้ที่แท็บ "อีเมล" ของกิจกรรม' + (ED.type === 'CHECKIN' ? ' (กิจกรรมนี้ไม่ส่งอีเมล)' : '') + '</div>');
  return h;
}
function thReadForm(ED) {
  var c = ED.config;
  $$('[data-tc]').forEach(function (i) {
    var t = i.dataset.tt, v;
    if (t === 'check') v = i.checked; else if (t === 'num') v = +i.value || 0; else if (t === 'lines') v = i.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    else if (t === 'csv') v = i.value.split(/[,\s]+/).map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean); else v = i.value.trim();
    thSet(c, i.dataset.tc, v);
  });
  var rows = function (sel, fn) { return $$(sel).map(fn); };
  var fv = function (tr, k) { var el = $('[data-f="' + k + '"]', tr); return !el ? '' : el.type === 'checkbox' ? el.checked : el.value.trim(); };
  if (ED.type === 'NOMINATE') c.categories = rows('[data-tcat]', function (tr) { return { key: fv(tr, 'key'), group: fv(tr, 'group'), label: fv(tr, 'label'), desc: fv(tr, 'desc') }; });
  if (ED.type === 'QUESTION') {
    var old = c.execs || [];
    c.execs = rows('[data-tex]', function (tr) { var x = Object.assign({}, old[+tr.dataset.tex] || {}); ['id', 'name', 'position', 'email', 'units'].forEach(function (k) { x[k] = fv(tr, k); }); x.director = fv(tr, 'director'); if (!x.director) delete x.director; return x; });
    c.categories = rows('[data-tqc]', function (b) { return { key: fv(b, 'key'), label: fv(b, 'label'), execs: $$('[data-qe]', b).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.qe; }) }; });
  }
  if (ED.type === 'CHECKIN') {
    c.agenda = rows('[data-tag]', function (tr) { return { time: fv(tr, 'time'), title: fv(tr, 'title'), by: fv(tr, 'by') }; }).filter(function (a) { return a.title; });
    var oldE = c.eval || [];
    c.eval = rows('[data-tsec]', function (sb) {
      var os = oldE[+sb.dataset.tsec] || {};
      return { title: $('[data-s=title]', sb).value.trim(), desc: $('[data-s=desc]', sb).value.trim(), items: $$('[data-tit]', sb).map(function (ib) {
        var o = Object.assign({}, (os.items || [])[+ib.dataset.tit] || {}), g = function (k) { return $('[data-i="' + k + '"]', ib); };
        o.key = g('key').value.trim(); o.type = g('type').value; o.label = g('label').value.trim(); o.required = g('required').checked; if (!o.required) delete o.required;
        if (g('other')) { o.other = g('other').checked; if (!o.other) delete o.other; }
        if (g('options')) o.options = g('options').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        if (o.type !== 'single' && o.type !== 'multi') { delete o.options; delete o.other; }
        return o;
      }) };
    });
  }
}
function thBindEditor(ED, readForm, draw) {
  var c = ED.config, on = function (sel, fn) { $$(sel).forEach(function (b) { b.onclick = function () { readForm(); fn(b); draw(); }; }); };
  on('#thCatAdd', function () { c.categories.push({ key: 'N' + (c.categories.length + 1), group: '', label: '', desc: '' }); });
  on('[data-tcdel]', function (b) { c.categories.splice(+b.dataset.tcdel, 1); });
  on('#thExAdd', function () { c.execs.push({ id: 'E' + ('0' + c.execs.length).slice(-2), name: '', position: '', email: '', units: '' }); });
  on('[data-texdel]', function (b) { c.execs.splice(+b.dataset.texdel, 1); });
  on('#thQcAdd', function () { c.categories.push({ key: 'C' + (c.categories.length + 1), label: '', execs: [] }); });
  on('[data-tqcdel]', function (b) { c.categories.splice(+b.dataset.tqcdel, 1); });
  on('#thAgAdd', function () { (c.agenda = c.agenda || []).push({ time: '', title: '', by: '' }); });
  on('[data-tagdel]', function (b) { c.agenda.splice(+b.dataset.tagdel, 1); });
  on('#thSecAdd', function () { (c.eval = c.eval || []).push({ title: 'ส่วนใหม่', desc: '', items: [] }); });
  on('[data-tsecdel]', function (b) { c.eval.splice(+b.dataset.tsecdel, 1); });
  on('[data-titadd]', function (b) { var s = c.eval[+b.dataset.titadd], n = 1, keys = {}; c.eval.forEach(function (x) { (x.items || []).forEach(function (it) { keys[it.key] = 1; }); }); while (keys['n' + n]) n++; s.items.push({ key: 'n' + n, type: 'scale5', label: '', required: true }); });
  on('[data-titdel]', function (b) { var p = b.dataset.titdel.split(':'); c.eval[+p[0]].items.splice(+p[1], 1); });
  on('[data-tmv]', function (b) { var p = b.dataset.tmv.split(':'), arr = c.eval[+p[0]].items, i = +p[1], j = i + (+p[2]); if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; });
  $$('[data-i=type]').forEach(function (s) { s.onchange = function () { readForm(); draw(); }; });
}
