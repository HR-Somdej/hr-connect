/* =================================================================== 13 พ.ย. 69: โหมดทดสอบก่อนใช้งานจริง + ล้างข้อมูลทดสอบ (ผู้ดูแลสูงสุด)
 * เปิดโหมดทดสอบ → กิจกรรมที่เลือก: เห็นเฉพาะผู้ทดสอบ · ใช้ได้ทันทีไม่สนวันเปิด–ปิด · อีเมลส่งเฉพาะผู้ทดสอบ/อีเมลทดสอบ · ตัวตั้งเวลาไม่ส่ง
 * หลังทดสอบ → ล้างข้อมูลทดสอบ (Reset) → ปิดโหมดทดสอบ → ระบบพร้อมใช้งานจริงตามวันเปิดที่ตั้งไว้ */
var TL = null;
ROUTES['admin/testlab'] = function () {
  if (!needSuper()) return;
  document.title = 'โหมดทดสอบก่อนใช้งานจริง · SOMDEJ HR Connect';
  $('#page').innerHTML = skel(3);
  api('getTestMode', {}).then(function (d) { TL = { d: d, draft: null }; tlDraw(); }).catch(errToast);
};
function tlDraw() {
  var d = TL.d, c = TL.draft || (TL.draft = { on: d.cfg.on, events: d.cfg.events.slice(), codes: d.cfg.codes.join('\n'), emails: d.cfg.emails.join('\n'), note: d.cfg.note });
  var th = d.events.filter(function (e) { return ['NOMINATE', 'QUESTION', 'CHECKIN'].indexOf(e.type) >= 0; }), other = d.events.filter(function (e) { return th.indexOf(e) < 0; });
  var h = pageHead('โหมดทดสอบก่อนใช้งานจริง', 'ทดลองใช้ระบบจริงกับคณะกรรมการ โดยไม่กระทบบุคลากรคนอื่น แล้วล้างข้อมูลก่อนเปิดใช้จริง');
  h += d.cfg.on ? '<div class="announce tl-on">' + ic('alert') + '<div><b>โหมดทดสอบเปิดอยู่</b> · ' + d.cfg.events.length + ' กิจกรรม · ผู้ทดสอบ ' + d.cfg.codes.length + ' คน · อีเมลทดสอบ ' + d.cfg.emails.length + ' อีเมล' +
      (d.cfg.updatedAt ? ' <span class="small">(แก้ล่าสุด ' + esc(thShort(d.cfg.updatedAt)) + ' โดย ' + esc(d.cfg.updatedBy) + ')</span>' : '') + '<br>บุคลากรคนอื่น<b>มองไม่เห็น</b>กิจกรรมเหล่านี้ และ<b>ไม่ได้รับอีเมล</b>ใด ๆ · ตัวตั้งเวลาอีเมลหยุดส่งสำหรับกิจกรรมเหล่านี้</div></div>'
    : '<div class="announce" style="background:#fff;border-color:var(--line);color:inherit">' + ic('info') + '<div><b>โหมดทดสอบปิดอยู่</b> — กิจกรรมทำงานตามจริง (เผยแพร่ + วันเปิด–ปิด + อีเมลอัตโนมัติ)</div></div>';
  // ---- ขั้นตอน
  h += '<div class="card"><div class="hd"><h3>' + ic('book') + ' ลำดับการใช้งาน (วันทดสอบกับคณะกรรมการ)</h3></div><div class="bd"><ol class="tl-steps">' +
    '<li><b>ตั้งค่ากิจกรรมให้เป็นวันจริง</b> (เช่น เปิด 16 พ.ย. 09.00 น. · ปิด 25 พ.ย. 23.59 น.) และข้อความอีเมล — ทำได้ตั้งแต่ตอนนี้</li>' +
    '<li><b>เปิดโหมดทดสอบ</b> ด้านล่าง: เลือกกิจกรรม · ใส่รหัสบุคลากรของคณะกรรมการ/ผู้ทดสอบ · ใส่อีเมลทดสอบ → บันทึก</li>' +
    '<li>ผู้ทดสอบเข้าระบบจริงด้วยบัญชีตนเอง → เห็นกิจกรรม <span class="chip warn">โหมดทดสอบ</span> ทดลองเสนอชื่อ ส่งคำถาม เช็กอิน แบบประเมินได้ทันที · HR ทดลองหน้าผู้ดูแล + กด "ส่งตอนนี้" ดูอีเมลจริง (ส่งเฉพาะผู้ทดสอบ)</li>' +
    '<li>จบการทดสอบ → <b>ล้างข้อมูลทดสอบ</b> (กล่องล่างสุด · พิมพ์ RESET)</li>' +
    '<li><b>ปิดโหมดทดสอบ</b> → ตรวจว่ากิจกรรม "เผยแพร่" แล้ว · วันเปิดเป็นวันจริง · ระบบจะเปิดรับและส่งประกาศเองตามเวลาที่ตั้ง</li></ol></div></div>';
  // ---- ตั้งค่า
  var evRow = function (e) {
    var on = c.events.indexOf(e.id) >= 0;
    return '<label class="tl-ev' + (on ? ' on' : '') + '"><input type="checkbox" data-tle="' + esc(e.id) + '"' + (on ? ' checked' : '') + '><span class="dot" style="background:' + esc(e.color || '#888') + '"></span><span><b>' + esc(e.title) + '</b><br><span class="small muted">' +
      (e.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง') + ' · ' + esc(thDate(e.openAt, false)) + ' – ' + esc(thDate(e.closeAt)) + '</span></span></label>';
  };
  h += '<div class="card" style="margin-top:16px"><div class="hd"><h3>' + ic('shield') + ' ตั้งค่าโหมดทดสอบ</h3><div class="row"><label class="switch"><input type="checkbox" id="tlOn"' + (c.on ? ' checked' : '') + '><span class="tr"></span><span><b>' + (c.on ? 'เปิดโหมดทดสอบ' : 'ปิดโหมดทดสอบ') + '</b></span></label>' +
    '<button class="btn primary" id="tlSave" data-busy="กำลังบันทึก…">' + ic('check') + 'บันทึก</button></div></div><div class="bd">' +
    '<div class="field"><label class="f">กิจกรรมที่จะทดสอบ</label><div class="tl-evs">' + th.map(evRow).join('') + '</div>' +
    (other.length ? '<details class="small" style="margin-top:6px"><summary class="muted">กิจกรรมอื่น (ไม่แนะนำ — กิจกรรมที่ใช้งานจริงอยู่จะถูกซ่อนจากบุคลากร)</summary><div class="tl-evs">' + other.map(evRow).join('') + '</div></details>' : '') + '</div>' +
    '<div class="grid2"><div class="field"><label class="f">รหัสบุคลากรของผู้ทดสอบ (คั่นด้วย , หรือขึ้นบรรทัดใหม่)</label><textarea class="input" id="tlCodes" rows="6" placeholder="เช่น 5660101">' + esc(c.codes) + '</textarea>' +
    '<div class="hint">ผู้ทดสอบเห็นกิจกรรมและใช้งานได้จริง · อีเมลยืนยัน/ประกาศ ส่งถึงอีเมลของผู้ทดสอบ (หัวเรื่อง [ทดสอบ])</div>' +
    (d.testers.length ? '<div class="tl-testers">' + d.testers.map(function (x) { return '<span class="chip ' + (x.found ? (x.hasEmail ? 'ok' : 'warn') : 'danger') + '" title="' + esc(x.position || '') + '">' + esc(x.code) + ' ' + esc(x.found ? x.name : 'ไม่พบในรายชื่อ') + (x.found && !x.hasEmail ? ' · ไม่มีอีเมล' : '') + '</span>'; }).join('') + '</div>' : '') + '</div>' +
    '<div class="field"><label class="f">อีเมลทดสอบ (รับตัวอย่างทุกอีเมลของกิจกรรมที่ทดสอบ)</label><textarea class="input" id="tlEmails" rows="6" placeholder="เช่น hr.somdej@redcross.or.th">' + esc(c.emails) + '</textarea>' +
    '<div class="hint">เมื่อกด "ส่งตอนนี้" ในเมนูอีเมล ระบบส่งฉบับตัวอย่างมาที่อีเมลนี้ 1 ฉบับ · อีเมลถึงผู้บริหาร (คำถาม) จะมาที่อีเมลนี้แทน ไม่ถึงผู้บริหารจริง</div></div></div>' +
    '<div class="field"><label class="f">หมายเหตุ (ไม่บังคับ)</label><input class="input" id="tlNote" value="' + esc(c.note || '') + '" placeholder="เช่น ทดสอบกับคณะกรรมการ 13 พ.ย. 69 บ่าย"></div>' +
    '<div class="small muted">' + ic('lock') + ' อีเมลรหัสยืนยัน (OTP) / แจ้งเปลี่ยนรหัสผ่าน ส่งตามปกติเสมอ · กิจกรรมที่ไม่ได้เลือกทำงานตามปกติ</div></div></div>';
  // ---- Reset
  h += '<div class="card tl-reset" style="margin-top:16px"><div class="hd"><h3>' + ic('trash') + ' ล้างข้อมูลทดสอบ (Reset)</h3></div><div class="bd">' +
    '<p class="small">ลบข้อมูลที่เกิดจากการใช้งานของกิจกรรม Hospital Town Hall ที่เลือก ให้กลับเป็นศูนย์ก่อนเปิดใช้จริง · <b>ไม่ลบ</b> รายชื่อผู้มีสิทธิ์ ตารางตำแหน่ง→หมวด ผลตรวจคุณสมบัติที่นำเข้า (ไฟล์ ②) การตั้งค่ากิจกรรม และข้อความอีเมล</p>' +
    '<div class="tablewrap"><table class="t"><thead><tr><th style="width:36px"></th><th>กิจกรรม</th>' + [['Responses', 'การตอบ/เช็กอิน'], ['Nominations', 'เสนอชื่อ'], ['Questions', 'คำถาม'], ['EvalResponses', 'แบบประเมิน'], ['NomineeReview', 'ผลตรวจ HR*']].map(function (x) { return '<th class="r">' + x[1] + '</th>'; }).join('') + '<th>สถานะประกาศ</th></tr></thead><tbody>' +
    th.map(function (e) {
      var k = e.counts, an = (d.announce.filter(function (a) { return a.id === e.id; })[0] || {}).done;
      return '<tr><td><input type="checkbox" data-tlr="' + esc(e.id) + '" checked></td><td><b>' + esc(e.title) + '</b></td>' + ['Responses', 'Nominations', 'Questions', 'EvalResponses', 'NomineeReview'].map(function (t) { return '<td class="r num">' + nf(k[t] || 0) + '</td>'; }).join('') +
        '<td>' + (an ? '<span class="chip warn">ระบบจำว่า "ประกาศแล้ว"</span>' : '<span class="small muted">พร้อมส่งประกาศ</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="small muted" style="margin-top:6px">* ผลตรวจ HR รวมผลตรวจคุณสมบัติรายข้อที่นำเข้าจากไฟล์ ② (ไม่ถูกลบ) · Reset จะล้างสถานะ "ประกาศแล้ว" ให้อีเมลประกาศวันเปิดจริงส่งถึงทุกคนครบ</div>' +
    '<div class="row" style="margin-top:12px"><button class="btn danger" id="tlReset">' + ic('trash') + 'ล้างข้อมูลทดสอบของกิจกรรมที่เลือก…</button><button class="btn" id="tlRef">' + ic('refresh') + 'นับใหม่</button></div></div></div>';
  $('#page').innerHTML = h;
  var keep = function () { c.codes = $('#tlCodes').value; c.emails = $('#tlEmails').value; c.note = $('#tlNote').value; };
  $('#tlOn').onchange = function () { keep(); c.on = this.checked; if (c.on && !c.events.length) c.events = th.map(function (e) { return e.id; }); tlDraw(); };
  $$('[data-tle]').forEach(function (b) { b.onchange = function () { keep(); var i = c.events.indexOf(b.dataset.tle); if (b.checked && i < 0) c.events.push(b.dataset.tle); if (!b.checked && i >= 0) c.events.splice(i, 1); tlDraw(); }; });
  $('#tlRef').onclick = function () { ROUTES['admin/testlab'](); };
  $('#tlSave').onclick = function () {
    keep();
    var b = this, body = { on: c.on, events: c.events, codes: c.codes, emails: c.emails, note: c.note };
    var doSave = function () {
      busy(b, api('saveTestMode', { cfg: body })).then(function (r) {
        TL = { d: r, draft: null }; AD.events = null; tlDraw();
        toast(r.cfg.on ? 'เปิดโหมดทดสอบแล้ว · บุคลากรอื่นมองไม่เห็นกิจกรรมที่เลือก' : 'ปิดโหมดทดสอบแล้ว · กิจกรรมทำงานตามจริง', 'ok', 'บันทึกแล้ว');
      }).catch(errToast);
    };
    if (!c.on && d.cfg.on) {
      var pubs = d.events.filter(function (e) { return d.cfg.events.indexOf(e.id) >= 0; });
      confirmBox({ title: 'ปิดโหมดทดสอบ = เริ่มใช้งานจริง?', icon: 'alert', ok: 'ปิดโหมดทดสอบ', msg: 'ตรวจก่อนกดยืนยัน:<ul style="margin:6px 0 0 18px">' +
        '<li>ล้างข้อมูลทดสอบ (Reset) แล้ว</li><li>วันเปิด–ปิดเป็นวันจริง</li><li>เวลาส่งอีเมลประกาศถูกต้อง (ถ้ากิจกรรมเปิดรับอยู่แล้ว ระบบจะส่งประกาศถึงทุกคนภายใน 1 ชั่วโมง)</li></ul>' +
        '<div style="margin-top:8px">' + pubs.map(function (e) { return '• ' + esc(e.title) + ' — ' + (e.published ? 'เผยแพร่แล้ว' : '<b style="color:var(--danger)">ยังเป็นฉบับร่าง</b>') + ' · เปิด ' + esc(thDate(e.openAt)); }).join('<br>') + '</div>' }).then(function (y) { if (y) doSave(); });
    } else doSave();
  };
  $('#tlReset').onclick = function () {
    var ids = $$('[data-tlr]').filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.tlr; });
    if (!ids.length) return toast('เลือกกิจกรรมก่อน', 'warn');
    var b = this;
    busy(b, api('resetTestData', { eventIds: ids, dryRun: true })).then(function (r) {
      var tot = 0, lines = ids.map(function (id) { var e = d.events.filter(function (x) { return x.id === id; })[0] || { title: id }, k = r.counts[id], n = 0; Object.keys(k).forEach(function (t) { if (t !== 'NomineeReview') n += k[t]; }); tot += n; return '• ' + esc(e.title) + ': ' + nf(n) + ' รายการ'; });
      var m = modal({ title: 'ล้างข้อมูลทดสอบ', body: '<p>จะลบข้อมูลต่อไปนี้ <b>ถาวร</b> (กู้คืนไม่ได้):</p><div class="small">' + lines.join('<br>') + '</div>' +
        '<div class="announce" style="margin:12px 0">' + ic('alert') + '<div>หากมีบุคลากรจริงเสนอชื่อ/ส่งคำถามไว้ (เช่น หลังได้รับอีเมลเมื่อ 12 พ.ย.) ข้อมูลนั้นจะถูกลบด้วย · ถ้าต้องการเก็บไว้ ให้ส่งออก Excel จากแท็บผลการเสนอชื่อ/คำถามก่อน</div></div>' +
        '<div class="field"><label class="f">พิมพ์ <b>RESET</b> เพื่อยืนยัน</label><input class="input" id="tlConf" autocomplete="off"></div>',
        foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn dangerfill" id="tlGo" data-busy="กำลังล้าง…">' + ic('trash') + 'ล้างข้อมูล</button>' });
      $('#tlGo').onclick = function () {
        if ($('#tlConf').value.trim() !== 'RESET') return toast('พิมพ์คำว่า RESET (ตัวพิมพ์ใหญ่)', 'warn');
        busy(this, api('resetTestData', { eventIds: ids, confirm: 'RESET' })).then(function (x) {
          m.close(); var n = 0; Object.keys(x.removed).forEach(function (k) { n += x.removed[k]; });
          toast('ลบ ' + nf(n) + ' รายการ · ล้างสถานะอีเมล ' + x.mailState + ' รายการ', 'ok', 'ล้างข้อมูลทดสอบแล้ว'); AD.events = null; ROUTES['admin/testlab']();
        }).catch(errToast);
      };
    }).catch(errToast);
  };
}
/** แถบเตือนบนหน้าผู้ดูแลของกิจกรรมที่อยู่ในโหมดทดสอบ */
function testChip(ev) { return ev && ev.test ? '<span class="chip warn" title="เห็นเฉพาะผู้ทดสอบ · อีเมลส่งเฉพาะผู้ทดสอบ/อีเมลทดสอบ">' + ic('shield') + ' โหมดทดสอบ</span>' : ''; }
