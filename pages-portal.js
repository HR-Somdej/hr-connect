/* =================================================================== 13 พ.ย. 69: เมนู/ลิงก์ระบบอื่น + เข้าระบบเดียว (SSO)
 * #/admin/portal  ผู้ดูแลสูงสุด: เพิ่มเมนู/ลิงก์ · กำหนดใครเห็น · ลงทะเบียนระบบที่ใช้รหัสผ่าน HR Connect (ออกกุญแจระบบ)
 * #/go/<linkId>   เปิดเมนูที่เชื่อมรหัสผ่าน → ขอบัตรผ่าน → ไปยังระบบปลายทาง (ไม่ต้องพิมพ์รหัสซ้ำ)
 * #/sso?app=<id>&ret=<url>  ระบบอื่นส่งผู้ใช้มาที่นี่ ("เข้าสู่ระบบด้วย HR Connect") → ล็อกอิน (ถ้ายัง) → กลับไปพร้อมบัตรผ่าน */
var PT = null;
var PT_AUD = [['ALL', 'บุคลากรทุกคน'], ['DIV', 'เฉพาะฝ่าย/หน่วยที่เลือก'], ['CODES', 'เฉพาะรหัสบุคลากรที่กำหนด'], ['HEAD', 'หัวหน้า + ผู้ดูแล'], ['ADMIN', 'เฉพาะผู้ดูแลระบบ']];
var PT_PLACE = [['BOTH', 'เมนูด้านข้าง + หน้าแรก'], ['MENU', 'เมนูด้านข้างเท่านั้น'], ['HOME', 'หน้าแรกเท่านั้น']];

/** เมนูจาก boot.links → รายการใน navItems (เรียกจาก app.js) */
function portalNavItems() {
  var L = (S.boot && S.boot.links) || [];
  return L.map(function (l) {
    return { k: 'link:' + l.id, href: l.sso ? '#/go/' + encodeURIComponent(l.id) : l.url, icon: l.icon || 'link', label: l.title, short: l.title, desc: l.desc,
      ext: l.newTab, svc: l.place !== 'MENU', menu: l.place !== 'HOME', portal: true, sso: l.sso };
  });
}

/* ---------- #/go/<linkId> ---------- */
ROUTES.go = function (params) {
  var id = params[0] || '';
  $('#page').innerHTML = '<div class="empty" style="padding:60px 20px">' + ic('link') + '<p>กำลังพาไปยังระบบปลายทาง…</p><p class="small muted">ไม่ต้องพิมพ์รหัสผ่านซ้ำ</p></div>';
  api('ssoTicket', { linkId: id }).then(function (r) { location.replace(r.url); }).catch(function (e) {
    $('#page').innerHTML = '<div class="empty" style="padding:60px 20px">' + ic('alert') + '<p>' + esc(e.message) + '</p><p><a class="btn" href="#/">กลับหน้าแรก</a></p></div>';
  });
};

/* ---------- #/sso?app=&ret= ---------- */
ROUTES.sso = function (params, q) {
  var app = q.app || '', ret = q.ret || '';
  $('#page').innerHTML = '<div class="card" style="max-width:520px;margin:40px auto"><div class="bd" style="text-align:center;padding:32px 24px">' + ic('key') +
    '<h2 style="margin:10px 0 6px" id="ssoT">กำลังตรวจสอบ…</h2><p class="muted" id="ssoS">เข้าสู่ระบบปลายทางด้วยบัญชี SOMDEJ HR Connect ของท่าน</p><div id="ssoA" style="margin-top:16px"></div></div></div>';
  api('ssoTicket', { appId: app, ret: ret }).then(function (r) {
    $('#ssoT').textContent = 'กำลังเข้าสู่ ' + r.app;
    $('#ssoS').textContent = S.me.name + ' · ' + S.me.empCode;
    $('#ssoA').innerHTML = '<a class="btn primary" href="' + esc(r.url) + '">' + ic('arrowr') + 'ไปต่อ</a>';
    setTimeout(function () { location.replace(r.url); }, 600);
  }).catch(function (e) {
    $('#ssoT').textContent = 'เข้าระบบปลายทางไม่ได้';
    $('#ssoS').textContent = e.message;
    $('#ssoA').innerHTML = '<a class="btn" href="#/">กลับหน้าแรก HR Connect</a>';
  });
};

/* ---------- #/admin/portal ---------- */
ROUTES['admin/portal'] = function (params) {
  if (!needSuper()) return;
  document.title = 'เมนูและระบบที่เชื่อมรหัสผ่าน · SOMDEJ HR Connect';
  $('#page').innerHTML = skel(3);
  api('getPortal', {}).then(function (d) { PT = { d: d, links: JSON.parse(JSON.stringify(d.links)), tab: params[0] === 'sso' ? 'sso' : 'links', dirty: false }; ptDraw(); }).catch(errToast);
};
function ptDraw() {
  var h = pageHead('เมนูและระบบที่เชื่อมรหัสผ่าน', 'เพิ่มเมนู/ลิงก์ไปยังระบบอื่นของโรงพยาบาล · ให้ระบบอื่นใช้รหัสบุคลากร + รหัสผ่านเดียวกับ HR Connect');
  h += '<div class="seg" style="margin-bottom:14px">' + [['links', ic('link') + ' เมนู/ลิงก์ (' + PT.links.length + ')'], ['sso', ic('key') + ' ระบบที่เชื่อมรหัสผ่าน (' + PT.d.apps.length + ')']].map(function (x) {
    return '<button data-pt="' + x[0] + '" class="' + (PT.tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>';
  h += PT.tab === 'links' ? ptLinksHtml() : ptAppsHtml();
  $('#page').innerHTML = h;
  $$('[data-pt]').forEach(function (b) { b.onclick = function () { PT.tab = b.dataset.pt; ptDraw(); }; });
  if (PT.tab === 'links') ptBindLinks(); else ptBindApps();
}
function ptAudText(a) {
  a = a || {}; var m = a.mode || 'ALL', t = (PT_AUD.filter(function (x) { return x[0] === m; })[0] || PT_AUD[0])[1];
  if (m === 'DIV') t += ': ' + (a.divisions || []).join(', ');
  if (m === 'CODES' || (m === 'DIV' && (a.codes || []).length)) t += (m === 'DIV' ? ' + ' : ': ') + (a.codes || []).length + ' คน';
  return t;
}
function ptLinksHtml() {
  var apps = {}; PT.d.apps.forEach(function (a) { apps[a.id] = a; });
  return '<div class="card"><div class="hd"><div><h3>' + ic('link') + ' เมนู/ลิงก์</h3><div class="small muted">ลากลำดับด้วยปุ่มลูกศร · เมนูที่ "เชื่อมรหัสผ่าน" กดแล้วเข้าระบบปลายทางได้ทันทีไม่ต้องพิมพ์รหัสซ้ำ</div></div>' +
    '<div class="row"><button class="btn" id="ptAdd">' + ic('plus') + 'เพิ่มเมนู</button><button class="btn primary" id="ptSave" data-busy="กำลังบันทึก…"' + (PT.dirty ? '' : ' disabled') + '>' + ic('check') + 'บันทึก</button></div></div>' +
    (PT.links.length ? '<div class="tablewrap"><table class="t"><thead><tr><th style="width:70px">ลำดับ</th><th>เมนู</th><th>ใครเห็น</th><th>แสดงที่</th><th>เข้าระบบ</th><th style="width:110px"></th></tr></thead><tbody>' +
      PT.links.map(function (l, i) {
        return '<tr' + (l.enabled === false ? ' style="opacity:.5"' : '') + '><td><button class="iconbtn" data-up="' + i + '"' + (i ? '' : ' disabled') + '>' + ic('up') + '</button><button class="iconbtn" data-dn="' + i + '"' + (i < PT.links.length - 1 ? '' : ' disabled') + '>' + ic('down') + '</button></td>' +
          '<td><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="si" style="color:' + esc(l.color || 'var(--accent)') + '">' + ic(l.icon || 'link') + '</span><div><b>' + esc(l.title) + '</b>' + (l.enabled === false ? ' <span class="chip">ปิดไว้</span>' : '') +
          '<div class="small muted" style="word-break:break-all">' + esc(l.url) + '</div></div></div></td>' +
          '<td class="small">' + esc(ptAudText(l.audience)) + '</td><td class="small">' + esc((PT_PLACE.filter(function (x) { return x[0] === (l.place || 'BOTH'); })[0] || PT_PLACE[0])[1]) + '</td>' +
          '<td class="small">' + (l.app ? '<span class="chip ok">' + ic('key') + ' ' + esc((apps[l.app] || {}).name || l.app) + '</span>' : '<span class="muted">ลิงก์ธรรมดา</span>') + '</td>' +
          '<td><button class="btn sm" data-ed="' + i + '">' + ic('edit') + 'แก้</button><button class="iconbtn" data-del="' + i + '" title="ลบ">' + ic('trash') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty">' + ic('link') + '<p>ยังไม่มีเมนู — กด "เพิ่มเมนู"</p></div>') + '</div>' +
    '<div class="small muted" style="margin-top:10px">' + ic('info') + ' เมนู "ค่าน้ำ–ค่าไฟที่พักของฉัน" และ "ใบประกอบวิชาชีพของฉัน" เป็นเมนูประจำของระบบ แสดงให้ทุกคนอยู่แล้ว</div>';
}
function ptBindLinks() {
  var dirty = function () { PT.dirty = true; ptDraw(); };
  $('#ptAdd').onclick = function () { ptEditLink(-1); };
  $$('[data-ed]').forEach(function (b) { b.onclick = function () { ptEditLink(+b.dataset.ed); }; });
  $$('[data-del]').forEach(function (b) { b.onclick = function () { var l = PT.links[+b.dataset.del]; confirmBox({ title: 'ลบเมนู "' + l.title + '"?', msg: 'กด "บันทึก" หลังลบเพื่อให้มีผล', ok: 'ลบ' }).then(function (y) { if (y) { PT.links.splice(+b.dataset.del, 1); dirty(); } }); }; });
  $$('[data-up]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.up, t = PT.links[i]; PT.links[i] = PT.links[i - 1]; PT.links[i - 1] = t; dirty(); }; });
  $$('[data-dn]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.dn, t = PT.links[i]; PT.links[i] = PT.links[i + 1]; PT.links[i + 1] = t; dirty(); }; });
  $('#ptSave').onclick = function () {
    busy(this, api('savePortalLinks', { links: PT.links })).then(function (d) {
      PT.d = d; PT.links = JSON.parse(JSON.stringify(d.links)); PT.dirty = false; ptDraw();
      toast('บันทึกเมนูแล้ว · บุคลากรเห็นเมนูใหม่เมื่อเปิดหน้าใหม่', 'ok');
      api('bootstrap', {}).then(function (b) { S.boot = b; S.me = b.me; shell(); }).catch(function () { });
    }).catch(errToast);
  };
}
function ptEditLink(i) {
  var l = i >= 0 ? JSON.parse(JSON.stringify(PT.links[i])) : { title: '', url: 'https://', desc: '', icon: 'link', color: '', place: 'BOTH', newTab: true, enabled: true, app: '', audience: { mode: 'ALL', divisions: [], codes: [] } };
  l.audience = l.audience || { mode: 'ALL' };
  var a = l.audience, divSel = {}; (a.divisions || []).forEach(function (d) { divSel[d] = 1; });
  var m = modal({ title: i >= 0 ? 'แก้เมนู' : 'เพิ่มเมนู', size: 'lg', body:
    '<div class="grid2"><div class="field"><label class="f">ชื่อเมนู *</label><input class="input" id="peT" maxlength="80" value="' + esc(l.title) + '" placeholder="เช่น ระบบสอบออนไลน์ TalentGate"></div>' +
    '<div class="field"><label class="f">คำอธิบายสั้น (บนหน้าแรก)</label><input class="input" id="peD" maxlength="120" value="' + esc(l.desc || '') + '" placeholder="เช่น สอบคัดเลือก · กรรมการให้คะแนน"></div></div>' +
    '<div class="field"><label class="f">ลิงก์ (ขึ้นต้นด้วย https://) *</label><input class="input" id="peU" value="' + esc(l.url) + '"></div>' +
    '<div class="grid2"><div class="field"><label class="f">ไอคอน</label><div class="row" style="gap:4px;flex-wrap:wrap" id="peI">' + PT.d.icons.map(function (x) { return '<button type="button" class="iconbtn' + (l.icon === x ? ' on' : '') + '" data-ic="' + x + '" style="' + (l.icon === x ? 'background:var(--accent-soft,#f3e8f7);outline:2px solid var(--accent)' : '') + '">' + ic(x) + '</button>'; }).join('') + '</div></div>' +
    '<div class="field"><label class="f">แสดงที่</label><select class="input" id="peP">' + PT_PLACE.map(function (x) { return '<option value="' + x[0] + '"' + ((l.place || 'BOTH') === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
    '<label class="row small" style="margin-top:8px;gap:6px"><input type="checkbox" id="peN"' + (l.newTab !== false ? ' checked' : '') + '> เปิดในแท็บใหม่</label><label class="row small" style="gap:6px"><input type="checkbox" id="peE"' + (l.enabled !== false ? ' checked' : '') + '> เปิดใช้เมนูนี้</label></div></div>' +
    '<div class="field"><label class="f">เข้าระบบปลายทาง</label><select class="input" id="peA"><option value="">ลิงก์ธรรมดา (ระบบปลายทางให้ล็อกอินเอง)</option>' + PT.d.apps.map(function (x) { return '<option value="' + esc(x.id) + '"' + (l.app === x.id ? ' selected' : '') + (x.enabled ? '' : ' disabled') + '>เชื่อมรหัสผ่าน: ' + esc(x.name) + (x.enabled ? '' : ' (ปิดไว้)') + '</option>'; }).join('') + '</select>' +
    '<div class="hint">ต้องลงทะเบียนระบบที่แท็บ "ระบบที่เชื่อมรหัสผ่าน" ก่อน · ลิงก์ต้องขึ้นต้นด้วยที่อยู่ที่ลงทะเบียนไว้</div></div>' +
    '<div class="field"><label class="f">ใครเห็นเมนูนี้</label><select class="input" id="peM">' + PT_AUD.map(function (x) { return '<option value="' + x[0] + '"' + (a.mode === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>' +
    '<div id="peDiv" class="field"><label class="f">ฝ่าย/หน่วย (ตามฝ่ายที่ปฏิบัติงาน)</label><input class="input search" id="peDq" placeholder="ค้นหาฝ่าย"><div class="pe-divs" id="peDl" style="max-height:200px;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:6px;margin-top:6px"></div></div>' +
    '<div id="peCod" class="field"><label class="f">รหัสบุคลากร (คั่นด้วย , หรือขึ้นบรรทัดใหม่)</label><textarea class="input" id="peC" rows="3">' + esc((a.codes || []).join('\n')) + '</textarea></div>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="peOk">' + ic('check') + 'ตกลง</button>' });
  var drawDiv = function () {
    var q = ($('#peDq').value || '').trim();
    $('#peDl').innerHTML = PT.d.divisions.filter(function (d) { return !q || d.name.indexOf(q) >= 0 || divSel[d.name]; }).map(function (d) {
      return '<label class="row small" style="gap:6px;padding:3px 4px"><input type="checkbox" data-dv="' + esc(d.name) + '"' + (divSel[d.name] ? ' checked' : '') + '> ' + esc(d.name) + ' <span class="muted">(' + nf(d.n) + ')</span></label>'; }).join('') || '<div class="small muted">ไม่พบ</div>';
    $$('[data-dv]', m.el).forEach(function (x) { x.onchange = function () { if (x.checked) divSel[x.dataset.dv] = 1; else delete divSel[x.dataset.dv]; }; });
  };
  var vis = function () { var md = $('#peM').value; $('#peDiv').style.display = md === 'DIV' ? '' : 'none'; $('#peCod').style.display = md === 'CODES' || md === 'DIV' ? '' : 'none'; };
  $('#peM').onchange = vis; vis(); drawDiv(); $('#peDq').oninput = debounce(drawDiv, 150);
  $$('[data-ic]', m.el).forEach(function (b) { b.onclick = function () { l.icon = b.dataset.ic; $$('[data-ic]', m.el).forEach(function (x) { x.style.background = ''; x.style.outline = ''; }); b.style.background = 'var(--accent-soft,#f3e8f7)'; b.style.outline = '2px solid var(--accent)'; }; });
  $('#peOk').onclick = function () {
    l.title = $('#peT').value.trim(); l.desc = $('#peD').value.trim(); l.url = $('#peU').value.trim(); l.place = $('#peP').value; l.newTab = $('#peN').checked; l.enabled = $('#peE').checked; l.app = $('#peA').value;
    l.audience = { mode: $('#peM').value, divisions: Object.keys(divSel), codes: $('#peC').value.split(/[\s,;]+/).filter(Boolean) };
    if (!l.title) return toast('ใส่ชื่อเมนู', 'warn');
    if (!/^https:\/\/\S+$/i.test(l.url)) return toast('ลิงก์ต้องขึ้นต้นด้วย https://', 'warn');
    if (l.audience.mode === 'DIV' && !l.audience.divisions.length && !l.audience.codes.length) return toast('เลือกฝ่าย/หน่วยอย่างน้อย 1', 'warn');
    if (l.audience.mode === 'CODES' && !l.audience.codes.length) return toast('ใส่รหัสบุคลากร', 'warn');
    if (l.app) { var ap = PT.d.apps.filter(function (x) { return x.id === l.app; })[0]; if (ap && !ap.returnUrls.some(function (u) { return l.url.indexOf(u) === 0; })) return toast('ลิงก์ต้องขึ้นต้นด้วยที่อยู่ที่ลงทะเบียนไว้กับ ' + ap.name + ': ' + ap.returnUrls.join(', '), 'warn'); }
    if (i >= 0) PT.links[i] = l; else PT.links.push(l);
    m.close(); PT.dirty = true; ptDraw(); toast('กด "บันทึก" เพื่อให้มีผล', 'info');
  };
}
function ptAppsHtml() {
  return '<div class="card"><div class="hd"><div><h3>' + ic('key') + ' ระบบที่ใช้รหัสผ่าน HR Connect</h3><div class="small muted">แต่ละระบบได้ "กุญแจระบบ (appKey)" ไว้ใส่ใน Script Properties ของระบบนั้น — ระบบนั้นจึงตรวจรหัสผ่านบุคลากรผ่าน HR Connect ได้ โดยไม่เห็นรหัสผ่านที่เก็บไว้</div></div>' +
    '<button class="btn primary" id="paAdd">' + ic('plus') + 'ลงทะเบียนระบบ</button></div>' +
    (PT.d.apps.length ? '<div class="tablewrap"><table class="t"><thead><tr><th>ระบบ</th><th>ที่อยู่ที่อนุญาต</th><th>ข้อมูลที่ส่งให้</th><th>ใช้ล่าสุด</th><th></th></tr></thead><tbody>' + PT.d.apps.map(function (a, i) {
      return '<tr' + (a.enabled ? '' : ' style="opacity:.55"') + '><td><b>' + esc(a.name) + '</b>' + (a.enabled ? '' : ' <span class="chip">ปิดไว้</span>') + '<div class="small muted">รหัสระบบ <code>' + esc(a.id) + '</code> · กุญแจลงท้าย …' + esc(a.keyHint) + '</div></td>' +
        '<td class="small" style="word-break:break-all">' + a.returnUrls.map(esc).join('<br>') + '</td><td class="small">' + a.fields.map(esc).join(', ') + '</td>' +
        '<td class="small">' + (a.lastUsedAt ? esc(thShort(a.lastUsedAt)) + ' · ' + nf(a.uses) + ' ครั้ง' : '<span class="muted">ยังไม่เคยใช้</span>') + '</td>' +
        '<td><button class="btn sm" data-pe="' + i + '">' + ic('edit') + 'แก้</button><button class="btn sm" data-pk="' + i + '">' + ic('key') + 'ออกกุญแจใหม่</button><button class="iconbtn" data-pd="' + i + '" title="ลบ">' + ic('trash') + '</button></td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="empty">' + ic('key') + '<p>ยังไม่มีระบบที่เชื่อมรหัสผ่าน</p></div>') + '</div>' +
    '<div class="card" style="margin-top:14px"><div class="hd"><h3>' + ic('book') + ' ข้อมูลสำหรับผู้พัฒนาระบบปลายทาง</h3></div><div class="bd small">' +
    '<div><b>ที่อยู่ API ของ HR Connect:</b> <code style="word-break:break-all">' + esc(typeof API_URL !== 'undefined' ? API_URL : '') + '</code></div>' +
    '<div style="margin-top:6px"><b>ปุ่ม "เข้าสู่ระบบด้วย HR Connect":</b> <code style="word-break:break-all">' + esc(location.origin + location.pathname) + '#/sso?app=&lt;รหัสระบบ&gt;&amp;ret=&lt;หน้าเว็บของระบบ&gt;</code></div>' +
    '<div style="margin-top:6px">ดูไลบรารี HRConnectSSO.gs และชุดพรอมพ์ (คำสั่งสำหรับ AI) ในโฟลเดอร์ <code>HR-Connect/07_เชื่อมระบบอื่น_SSO/</code></div></div></div>';
}
function ptBindApps() {
  $('#paAdd').onclick = function () { ptEditApp(null); };
  $$('[data-pe]').forEach(function (b) { b.onclick = function () { ptEditApp(PT.d.apps[+b.dataset.pe]); }; });
  $$('[data-pk]').forEach(function (b) { b.onclick = function () { var a = PT.d.apps[+b.dataset.pk];
    confirmBox({ title: 'ออกกุญแจใหม่ให้ ' + a.name + '?', icon: 'alert', ok: 'ออกกุญแจใหม่', msg: 'กุญแจเดิมจะใช้ไม่ได้ทันที — ต้องนำกุญแจใหม่ไปใส่ในระบบ ' + esc(a.name) + ' ก่อน บุคลากรจึงจะเข้าระบบนั้นได้อีก' }).then(function (y) {
      if (y) api('saveSsoApp', { app: a, newKey: true }).then(ptShowKey).catch(errToast); }); }; });
  $$('[data-pd]').forEach(function (b) { b.onclick = function () { var a = PT.d.apps[+b.dataset.pd];
    confirmBox({ title: 'ลบ ' + a.name + '?', ok: 'ลบ', msg: 'ระบบนี้จะใช้รหัสผ่าน HR Connect ไม่ได้อีก' }).then(function (y) { if (y) api('deleteSsoApp', { appId: a.id }).then(function (d) { PT.d = d; ptDraw(); toast('ลบแล้ว', 'ok'); }).catch(errToast); }); }; });
}
function ptEditApp(a) {
  var isNew = !a; a = a || { id: '', name: '', returnUrls: ['https://hr-somdej.github.io/'], fields: PT.d.fields.slice(0, 9), enabled: true };
  var m = modal({ title: isNew ? 'ลงทะเบียนระบบที่ใช้รหัสผ่าน HR Connect' : 'แก้ ' + esc(a.name), size: 'lg', body:
    '<div class="grid2"><div class="field"><label class="f">ชื่อระบบ *</label><input class="input" id="paN" value="' + esc(a.name) + '" placeholder="เช่น SOMDEJ TalentGate"></div>' +
    '<div class="field"><label class="f">รหัสระบบ (a–z 0–9 -) *</label><input class="input" id="paI" value="' + esc(a.id) + '" placeholder="เช่น talentgate"' + (isNew ? '' : ' disabled') + '></div></div>' +
    '<div class="field"><label class="f">ที่อยู่หน้าเว็บของระบบที่อนุญาตให้กลับไป (ขึ้นต้นด้วย · บรรทัดละ 1)</label><textarea class="input" id="paU" rows="3">' + esc(a.returnUrls.join('\n')) + '</textarea>' +
    '<div class="hint">เช่น https://hr-somdej.github.io/talentgate/ — บัตรผ่านจะส่งไปเฉพาะที่อยู่ที่ขึ้นต้นด้วยค่านี้ (กันการส่งไปเว็บอื่น)</div></div>' +
    '<div class="field"><label class="f">ข้อมูลบุคลากรที่ส่งให้ระบบนี้ (ส่งเท่าที่จำเป็น)</label><div class="row" style="gap:10px;flex-wrap:wrap">' + PT.d.fields.map(function (f) {
      return '<label class="row small" style="gap:4px"><input type="checkbox" data-fd="' + f + '"' + (a.fields.indexOf(f) >= 0 ? ' checked' : '') + (f === 'empCode' ? ' disabled' : '') + '> ' + f + '</label>'; }).join('') + '</div></div>' +
    '<label class="row small" style="gap:6px"><input type="checkbox" id="paE"' + (a.enabled ? ' checked' : '') + '> เปิดการเชื่อมต่อ</label>',
    foot: '<button class="btn" data-x>ยกเลิก</button><button class="btn primary" id="paOk" data-busy="กำลังบันทึก…">' + ic('check') + (isNew ? 'ลงทะเบียน + ออกกุญแจ' : 'บันทึก') + '</button>' });
  $('#paOk').onclick = function () {
    var o = { id: isNew ? $('#paI').value.trim().toLowerCase() : a.id, name: $('#paN').value.trim(), returnUrls: $('#paU').value.split(/\s+/).filter(Boolean), enabled: $('#paE').checked,
      fields: $$('[data-fd]', m.el).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.fd; }) };
    busy(this, api('saveSsoApp', { app: o, create: isNew })).then(function (d) { m.close(); if (d.newKey) ptShowKey(d); else { PT.d = d; ptDraw(); toast('บันทึกแล้ว', 'ok'); } }).catch(errToast);
  };
}
function ptShowKey(d) {
  PT.d = d; ptDraw();
  var a = d.apps.filter(function (x) { return x.id === d.appId; })[0] || { name: d.appId };
  var m = modal({ title: 'กุญแจระบบ ' + esc(a.name), body: '<div class="announce">' + ic('alert') + '<div><b>คัดลอกเก็บไว้ตอนนี้ — ระบบแสดงกุญแจนี้ครั้งเดียว</b> (HR Connect เก็บแบบเข้ารหัสทางเดียว ดูย้อนหลังไม่ได้)</div></div>' +
    '<div class="field"><label class="f">รหัสระบบ (HRC_APP_ID)</label><input class="input" readonly value="' + esc(d.appId) + '"></div>' +
    '<div class="field"><label class="f">กุญแจระบบ (HRC_APP_KEY)</label><input class="input" readonly id="pkK" value="' + esc(d.newKey) + '" style="font-family:monospace"></div>' +
    '<div class="field"><label class="f">ที่อยู่ API ของ HR Connect (HRC_API_URL)</label><input class="input" readonly value="' + esc(typeof API_URL !== 'undefined' ? API_URL : '') + '"></div>' +
    '<p class="small">นำ 3 ค่านี้ไปใส่ใน <b>Apps Script ของระบบนั้น › การตั้งค่าโปรเจกต์ › Script Properties</b> · ห้ามใส่ในไฟล์ที่ขึ้น GitHub หรือส่งทางแชตกลุ่ม</p>',
    foot: '<button class="btn" id="pkC">' + ic('copy') + 'คัดลอกทั้ง 3 ค่า</button><button class="btn primary" data-x>เก็บแล้ว ปิด</button>' });
  $('#pkC').onclick = function () {
    var t = 'HRC_API_URL=' + (typeof API_URL !== 'undefined' ? API_URL : '') + '\nHRC_APP_ID=' + d.appId + '\nHRC_APP_KEY=' + d.newKey;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('คัดลอกแล้ว', 'ok'); }).catch(function () { $('#pkK').select(); toast('กด Ctrl+C เพื่อคัดลอก', 'info'); });
  };
}
