/* Polio Booster Campaign (fIPV & OPV) page - "Block sitrep" design. Loaded only when the page is opened.
   Data: data/fipv_rows.csv, data/fipv_cud.csv, data/fipv_targets.csv (exported from the fIPV workbook on save).
   The sums follow the workbook's Calc sheet: catch-up rows are added only when Day = All.
   Benchmark: coverage at or above the benchmark shows light green; below it shows dark red. Chosen on the page. */
(function () {
  "use strict";
  var DATA = { rows: "data/fipv_rows.csv", cud: "data/fipv_cud.csv", tg: "data/fipv_targets.csv", upd: "data/fipv.updated.txt", geo: "data/geo.json" };
  var ROWS = null, CUD = [], TG = [], GEO = null, STAMP = "", LOADING = null;
  var F = { day: "All", date: "All", dist: "All", teh: "All", uc: "All", map: "ipv_hh", rank: "missed", q: "", sk: "missed", sd: -1, bench: 0.9 };
  var GOOD = "#25A765", BAD = "#A3161B", NODATA = "#DDD9E6", OUTSIDE = "#E9EBF2";
  var EX = {};
  var MOTION_OFF = function () { return document.documentElement.classList.contains("motion-off"); };

  var CSS = [
    ".pf{position:relative;color:#14213D;font-family:var(--body);border-radius:32px;padding:clamp(14px,2vw,26px);overflow:hidden;border:1px solid #DCE3F0;" +
      "background:radial-gradient(900px 520px at 0% 0%,#D6E6FF 0%,transparent 60%),radial-gradient(760px 480px at 100% 0%,#FFE6B5 0%,transparent 55%),radial-gradient(820px 520px at 60% 100%,#C9F2DA 0%,transparent 60%),linear-gradient(180deg,#EEF2FA,#E6ECF6)}",
    ".pf h1,.pf h2,.pf h3{color:#14213D}",
    ".pf *{box-sizing:border-box}",
    ".pf-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin:4px 0 16px}",
    ".pf-eb{font-size:11.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#4E5FD6}",
    ".pf-top h2{margin:4px 0 0;font-family:var(--display);font-size:clamp(26px,3vw,38px);font-weight:800;letter-spacing:-.03em;line-height:1.05}",
    ".pf-sub{margin:6px 0 0;color:#4B5B76;font-size:13px}",
    ".pf-fil{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}",
    ".pf-fl{display:flex;flex-direction:column;gap:4px;min-width:130px}",
    ".pf-fl label{font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#4B5B76}",
    ".pf-sel,.pf-q{appearance:none;-webkit-appearance:none;border:0;border-radius:16px;padding:11px 36px 11px 14px;background:linear-gradient(180deg,#4FA36B,#2E7D4F) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 13px center;font:inherit;font-weight:700;font-size:14px;color:#fff;box-shadow:0 12px 22px -14px rgba(20,80,40,.85),inset 0 1px 0 rgba(255,255,255,.35);cursor:pointer}",
    ".pf .pf-sel{background-color:#2E7D4F !important;color:#fff !important;-webkit-text-fill-color:#fff}",
    ".pf .pf-sel option{color:#14213D !important;background:#fff !important;-webkit-text-fill-color:#14213D}",
    ".pf-sel:disabled{opacity:.55;cursor:not-allowed}",
    ".pf-q{background:#fff;color:#14213D;border:1px solid #D5DDEB;box-shadow:none;padding:10px 13px;min-width:200px;cursor:text}",
    ".pf-reset{border:0;background:none;color:#2F5BD3;font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:10px 4px}",
    ".pf-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}",
    ".gl{position:relative;min-width:0;overflow:hidden;border-radius:26px;padding:18px 18px 16px;border:1px solid rgba(255,255,255,.85);" +
      "background:linear-gradient(150deg,rgba(255,255,255,.80),rgba(255,255,255,.42));backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);" +
      "box-shadow:0 26px 44px -30px rgba(30,40,80,.42),inset 0 1px 0 rgba(255,255,255,.95)}",
    ".gl::before{content:\"\";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.38) 48%,transparent 62%)}",
    ".gl > *{position:relative}",
    ".t-blue{background:linear-gradient(150deg,rgba(206,226,255,.92),rgba(255,255,255,.45))}",
    ".t-lilac{background:linear-gradient(150deg,rgba(228,220,255,.92),rgba(255,255,255,.45))}",
    ".t-yellow{background:linear-gradient(150deg,rgba(255,238,178,.95),rgba(255,251,234,.5))}",
    ".t-mint{background:linear-gradient(150deg,rgba(192,242,216,.92),rgba(240,255,247,.5))}",
    ".s4,.s5,.s6,.s7,.s8,.s12{grid-column:span 12}",
    ".pf-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;font-family:var(--display);font-size:17px;font-weight:800;letter-spacing:-.01em}",
    ".pf-h small{font-size:12px;font-weight:600;color:#4B5B76;margin-left:auto;font-family:var(--body)}",
    ".pf-hbtn{margin-left:auto}",
    ".dlb{border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.75);border-radius:12px;padding:6px 11px;font:inherit;font-size:12px;font-weight:700;color:#1F3A5F;cursor:pointer;box-shadow:0 6px 14px -10px rgba(20,30,60,.5)}",
    ".dlb:hover{background:#fff}",
    ".sx-title{font-family:var(--display);font-size:clamp(20px,2.2vw,26px);font-weight:800;letter-spacing:-.02em}",
    ".sx-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}",
    ".sx-head span{font-size:12.5px;font-weight:700;color:#4B5B76}",
    ".sx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 14px;margin-top:12px}",
    ".sx-k span{display:block;font-size:12.5px;color:#4B5B76;font-weight:650}",
    ".sx-k b{display:block;font-size:clamp(22px,2.5vw,31px);font-weight:800;letter-spacing:-.025em;font-variant-numeric:tabular-nums;line-height:1.1;margin-top:2px}",
    ".sx-k em{display:inline-block;font-style:normal;font-size:12.5px;font-weight:700;margin-top:4px}",
    ".sx-line{height:3px;border-radius:9px;margin:16px 0 14px;opacity:.7}",
    ".c-red{color:#B42318}.c-amb{color:#C27A00}.c-blu{color:#2F5BD3}.c-grn{color:#15803D}.c-ink{color:#14213D}",
    ".bm-ok{display:inline-block;padding:2px 9px;border-radius:99px;background:" + GOOD + ";color:#fff;font-style:normal;font-weight:800;font-size:12px}",
    ".bm-no{display:inline-block;padding:2px 9px;border-radius:99px;background:" + BAD + ";color:#fff;font-style:normal;font-weight:800;font-size:12px}",
    ".bm-na{display:inline-block;padding:2px 9px;border-radius:99px;background:#E3E6EE;color:#4B5B76;font-style:normal;font-weight:700;font-size:12px}",
    ".pf-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
    ".pf-two h4{margin:0 0 8px;font-size:13.5px;font-weight:800;text-align:center;color:#34435E}",
    ".pf-mini{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
    ".pf-cell{background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);border-radius:16px;padding:10px 12px;box-shadow:0 8px 18px -16px rgba(20,30,60,.5)}",
    ".pf-cell span{display:block;font-size:11.5px;color:#4B5B76;font-weight:650}",
    ".pf-cell b{display:block;font-size:21px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
    ".pf-cell i{font-style:normal;font-size:12px;font-weight:700;margin-left:6px}",
    ".pf-ring{display:flex;flex-direction:column;align-items:center;gap:4px}",
    ".pf-ring svg{width:124px;height:124px;flex:none}",
    ".pf-ring circle.bg{stroke:rgba(20,30,60,.08)}",
    ".pf-ring circle.fg{transition:stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1);stroke-linecap:round}",
    ".pf-ring text{font-weight:800;font-size:18px;fill:#14213D;font-variant-numeric:tabular-nums}",
    ".pf-ring .rs{font-size:9px;font-weight:650;fill:#4B5B76}",
    ".pf-lab{font-size:12.5px;color:#4B5B76;font-weight:700}",
    ".pf-mapw{position:relative}",
    ".pf-map{width:100%;height:auto;display:block;max-height:560px}",
    ".pf-map path{transition:fill .8s ease}",
    ".pf-map .u{stroke:#FFFFFF;stroke-width:.55;vector-effect:non-scaling-stroke;cursor:pointer}",
    ".pf-map .u:hover{stroke:#14213D;stroke-width:1.6}",
    ".pf-map .u.sel{stroke:#14213D;stroke-width:2.6}",
    ".pf-map .u.o{cursor:default}",
    ".pf .legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#34435E;align-items:center;margin-top:10px;font-weight:650}",
    ".pf .lg{display:inline-flex;align-items:center;gap:6px}",
    ".pf .sw{width:13px;height:13px;border-radius:4px;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}",
    ".pf-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}",
    ".pf-seg{display:inline-flex;background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.9);border-radius:14px;padding:3px;gap:2px;flex-wrap:wrap}",
    ".pf-seg button{border:0;background:transparent;border-radius:11px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:700;color:#34435E;cursor:pointer}",
    ".pf-seg button[aria-pressed=true]{background:#2E7D4F;color:#fff;box-shadow:0 8px 16px -10px rgba(20,80,40,.8)}",
    ".pf-tw{overflow:auto;max-height:440px;border-radius:14px}",
    ".pf-t{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}",
    ".pf-t th{position:sticky;top:0;background:rgba(255,255,255,.92);text-align:left;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#4B5B76;padding:9px 8px;border-bottom:2px solid #C9D3E6;z-index:1;cursor:pointer;white-space:nowrap}",
    ".pf-t th.r,.pf-t td.r{text-align:right}",
    ".pf-t td{padding:8px;border-bottom:1px solid rgba(20,30,60,.08);white-space:nowrap}",
    ".pf-t td.n{color:#4B5B76;width:34px}",
    ".pf-t td.u{font-weight:700;max-width:200px;overflow:hidden;text-overflow:ellipsis}",
    ".pf-t tr:hover td{background:rgba(255,255,255,.6)}",
    ".pf-t td.red{font-weight:800;color:#B42318}",
    ".pf-tb{width:90px}.pf-tb .pf-track{height:7px}",
    ".pf-track{height:10px;border-radius:99px;background:rgba(20,30,60,.08);overflow:hidden}",
    ".pf-fill{height:100%;width:0;border-radius:99px;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}",
    ".pf-br{display:grid;grid-template-columns:118px 1fr 58px;align-items:center;gap:10px;font-size:12.5px;font-weight:650}",
    ".pf-br b{font-variant-numeric:tabular-nums;text-align:right}",
    ".pf-bars{display:grid;gap:9px;margin-top:8px}",
    ".pf-day{display:flex;flex-direction:column;gap:6px}",
    ".pf-empty{padding:26px;text-align:center;color:#4B5B76;font-weight:650}",
    ".pf-chart{width:100%;height:auto;display:block}",
    ".pf-chart .colb{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);transition:transform 1s cubic-bezier(.2,.8,.2,1)}",
    ".pf-chart .colb.in{transform:scaleY(1)}",
    ".pf-chart .ln{stroke-dasharray:var(--len,800);stroke-dashoffset:var(--len,800);transition:stroke-dashoffset 1.6s ease .3s}",
    ".pf-chart .ln.in{stroke-dashoffset:0}",
    ".pf-chart .pt{opacity:0;transition:opacity .4s ease 1.2s}",
    ".pf-chart .pt.in{opacity:1}",
    "@keyframes pfPop{from{transform:scale(.97);opacity:0}to{transform:scale(1);opacity:1}}",
    ".pf-c.pop{animation:pfPop .5s cubic-bezier(.2,.8,.2,1) both}",
    ".pf-load{padding:40px;text-align:center;color:#4B5B76;font-weight:650}",
    ".pf-foot{display:flex;align-items:center;gap:14px;margin-top:16px;color:#34435E;font-size:13px;flex-wrap:wrap}",
    ".pf-foot img{height:44px;width:auto;border-radius:6px}",
    ".pf-foot b{color:#B42318}",
    "@media (max-width:1100px){.pf-grid .s4,.pf-grid .s5,.pf-grid .s6,.pf-grid .s7,.pf-grid .s8{grid-column:span 12}}",
    "@media (max-width:640px){.sx-grid{grid-template-columns:1fr 1fr}.pf-two{grid-template-columns:1fr}.pf-fl{min-width:44%;flex:1}.pf-sel{width:100%}.pf-q{min-width:0;width:100%}.pf-ring svg{width:100px;height:100px}.pf-br{grid-template-columns:90px 1fr 50px}}"
  ].join("\n");

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function num(x) { var v = +x; return isFinite(v) ? v : 0; }
  function nf(n) { return Math.round(n || 0).toLocaleString("en-US"); }
  function pc(v, d) { return v == null || !isFinite(v) ? "–" : (v * 100).toFixed(d == null ? 1 : d) + "%"; }
  function div(a, b) { return b > 0 ? a / b : null; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  function splitLine(s) {
    var out = [], c = "", q = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (q) { if (ch === "\"") { if (s.charAt(i + 1) === "\"") { c += "\""; i++; } else q = false; } else c += ch; }
      else if (ch === "\"") q = true;
      else if (ch === ",") { out.push(c); c = ""; }
      else c += ch;
    }
    out.push(c); return out;
  }
  function parseCSV(t) {
    var L = t.replace(/^﻿/, "").split(/\r?\n/).filter(function (x) { return x.length; });
    if (!L.length) return [];
    var h = splitLine(L[0]);
    return L.slice(1).map(function (l) { var v = splitLine(l), o = {}; h.forEach(function (k, i) { o[k] = v[i] == null ? "" : v[i]; }); return o; });
  }
  function getText(u) { return fetch(u, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(u + " " + r.status); return r.text(); }); }

  function load() {
    if (LOADING) return LOADING;
    LOADING = Promise.all([
      getText(DATA.rows), getText(DATA.cud), getText(DATA.tg),
      getText(DATA.upd).catch(function () { return ""; }),
      fetch(DATA.geo).then(function (r) { return r.json(); }).catch(function () { return []; })
    ]).then(function (a) {
      ROWS = parseCSV(a[0]).filter(function (r) { return r.dist; });
      ROWS.forEach(function (r) { r.dayN = String(parseInt(r.day, 10) || 0); });
      CUD = parseCSV(a[1]).filter(function (r) { return r.dist; });
      CUD.forEach(function (r) { r.dayN = String(parseInt(r.day, 10) || 0); });
      TG = parseCSV(a[2]).filter(function (r) { return r.dist; });
      STAMP = (a[3] || "").trim();
      GEO = (a[4] || []).filter(function (f) { return f.l === "UC"; });
      return true;
    });
    LOADING.catch(function () { LOADING = null; });
    return LOADING;
  }

  /* ---- filters ---- */
  function okRow(r, f) {
    return (f.day === "All" || r.dayN === f.day) && (f.date === "All" || r.dayDate === f.date) && (f.dist === "All" || r.dist === f.dist) &&
           (f.teh === "All" || r.teh === f.teh) && (f.uc === "All" || r.uc === f.uc);
  }
  function uniq(a) { return a.filter(function (v, i, s) { return v && s.indexOf(v) === i; }).sort(); }
  function options() {
    var days = uniq(ROWS.map(function (r) { return r.dayN; })).filter(function (d) { return d !== "0"; })
      .sort(function (a, b) { return a - b; });
    var dists = uniq(ROWS.map(function (r) { return r.dist; }));
    var tehs = uniq(ROWS.filter(function (r) { return F.dist === "All" || r.dist === F.dist; }).map(function (r) { return r.teh; }));
    var ucs = uniq(ROWS.filter(function (r) { return (F.dist === "All" || r.dist === F.dist) && (F.teh === "All" || r.teh === F.teh); }).map(function (r) { return r.uc; }));
    var dates = uniq(ROWS.map(function (r) { return r.dayDate; })).filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x); });
    return { days: days, dates: dates, dists: dists, tehs: tehs, ucs: ucs };
  }
  function dateLabel(d) {
    var dt = new Date(d + "T00:00:00");
    return isNaN(dt) ? d : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function dayLabel(d) {
    var r = ROWS.filter(function (x) { return x.dayN === d && x.dayDate; })[0];
    var s = "Day " + d;
    if (r && /^\d{4}-\d{2}-\d{2}$/.test(r.dayDate)) {
      var dt = new Date(r.dayDate + "T00:00:00");
      s += " · " + dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }
    return s;
  }

  /* ---- metrics (same definitions as the workbook's Calc sheet) ---- */
  function metrics(rs, cs, withCud) {
    function S(a, k) { var t = 0; for (var i = 0; i < a.length; i++) t += num(a[i][k]); return t; }
    function C(k) { return withCud ? S(cs, k) : 0; }
    var m = {};
    ["ipv", "opv"].forEach(function (v) {
      var target = S(rs, v + "_reg") + S(rs, v + "_rec_na") + S(rs, v + "_rec_ref");
      var hh = S(rs, v + "_reg") + S(rs, v + "_cov_na") + S(rs, v + "_cov_ref") + C(v + "_na") + C(v + "_ref");
      var unreg = S(rs, v + "_unreg") + C(v + "_unrec");
      var school = S(rs, v + "_school") + C(v + "_school_na") + C(v + "_school_ref");
      var recNA = S(rs, v + "_rec_na"), covNA = S(rs, v + "_cov_na") + C(v + "_na");
      var recREF = S(rs, v + "_rec_ref"), covREF = S(rs, v + "_cov_ref") + C(v + "_ref");
      var stNA = recNA - covNA, stREF = recREF - covREF;
      m[v] = {
        target: target, hh: hh, unreg: unreg, school: school, admin: hh + unreg + school,
        recNA: recNA, covNA: covNA, stNA: stNA, recREF: recREF, covREF: covREF, stREF: stREF,
        missed: stNA + stREF,
        hhPct: div(hh, target), admPct: div(hh + unreg + school, target),
        stNAPct: div(stNA, target), stREFPct: div(stREF, target), missPct: div(stNA + stREF, target),
        recNAPct: div(recNA, target), recREFPct: div(recREF, target),
        covNAPct: div(covNA, recNA), covREFPct: div(covREF, recREF), schoolPct: div(school, target)
      };
    });
    return m;
  }
  function ucGroups(rs, cs, withCud) {
    var g = {};
    rs.forEach(function (r) { var k = r.dist + "|" + r.teh + "|" + r.uc; (g[k] = g[k] || { rs: [], cs: [], dist: r.dist, teh: r.teh, uc: r.uc }).rs.push(r); });
    if (withCud) cs.forEach(function (r) { var k = r.dist + "|" + r.teh + "|" + r.uc; if (g[k]) g[k].cs.push(r); });
    return Object.keys(g).map(function (k) { var x = g[k]; x.m = metrics(x.rs, x.cs, withCud); return x; })
      .filter(function (x) { return x.m.ipv.target > 0 || x.m.opv.target > 0; });
  }

  /* ---- benchmark ---- */
  // at or above the benchmark = light green, below = dark red
  function onBench(p) { return p != null && isFinite(p) && p >= F.bench; }
  function bmPill(p, txt) {
    if (p == null || !isFinite(p)) return "<em class=\"bm-na\">–</em>";
    return "<em class=\"" + (onBench(p) ? "bm-ok" : "bm-no") + "\">" + (txt || pc(p)) + "</em>";
  }
  function bmColor(p) { return onBench(p) ? GOOD : BAD; }

  /* ---- map ---- */
  var LAT0 = 34 * Math.PI / 180;
  function proj(p) { return [p[0] * Math.cos(LAT0) * 100, -p[1] * 100]; }
  function ringPath(rings) {
    var d = "";
    rings.forEach(function (ring) {
      ring.forEach(function (p, i) { var q = proj(p); d += (i ? "L" : "M") + q[0].toFixed(2) + " " + q[1].toFixed(2); });
      d += "Z";
    });
    return d;
  }
  var MAPM = {
    ipv_hh: { t: "IPV HH coverage", inv: false, f: function (m) { return m.ipv.hhPct; } },
    ipv_adm: { t: "IPV admin coverage", inv: false, f: function (m) { return m.ipv.admPct; } },
    ipv_miss: { t: "IPV still missed", inv: true, f: function (m) { return m.ipv.missPct; } },
    opv_hh: { t: "OPV HH coverage", inv: false, f: function (m) { return m.opv.hhPct; } },
    opv_adm: { t: "OPV admin coverage", inv: false, f: function (m) { return m.opv.admPct; } },
    opv_miss: { t: "OPV still missed", inv: true, f: function (m) { return m.opv.missPct; } }
  };
  function mapHTML(groups) {
    if (!GEO || !GEO.length) return "<div class=\"pf-empty\">Map shapes are not available.</div>";
    var byKey = {};
    groups.forEach(function (g) { byKey[g.uc + "|" + g.dist] = g; });
    var inScope = function (f) { return (F.dist === "All" || f.d === F.dist) && (F.teh === "All" || f.t === F.teh); };
    var shown = GEO.filter(inScope);
    var box = shown.length ? shown : GEO;
    var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    box.forEach(function (f) { f.r.forEach(function (ring) { ring.forEach(function (p) { var q = proj(p); minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); }); }); });
    var pad = Math.max(maxx - minx, maxy - miny) * 0.04;
    var vb = [minx - pad, miny - pad, maxx - minx + 2 * pad, maxy - miny + 2 * pad];
    var M = MAPM[F.map];
    var hasAny = groups.length > 0;
    // for "still missed" a UC is on track when missed is at or below (100% - benchmark)
    var thr = M.inv ? 1 - F.bench : F.bench;
    var good = function (v) { return M.inv ? v <= thr : v >= thr; };
    var paths = GEO.map(function (f) {
      var g = byKey[f.n + "|" + f.d];
      var v = g ? M.f(g.m) : null;
      var has = v != null && isFinite(v);
      var inView = inScope(f);
      var sel = F.uc !== "All" && f.n === F.uc && f.d === F.dist;
      var fill, cls = "u";
      if (!inView) { fill = OUTSIDE; cls += " o"; }
      else if (!has) { fill = NODATA; cls += " o"; }
      else { fill = good(v) ? GOOD : BAD; }
      if (sel) cls += " sel";
      var status = !has ? "" : (good(v) ? (M.inv ? "on track" : "at or above benchmark") : (M.inv ? "above the missed limit" : "below benchmark"));
      var tip = "<h4>" + esc(f.n) + "</h4><div class=\"w\">" + esc(f.t ? f.t + " · " : "") + esc(f.d) + "</div>" +
        (has ? "<div class=\"w\">" + esc(M.t) + ": <b>" + pc(v) + "</b> · " + esc(status) + "</div>" : "<div class=\"w\">No data for this selection</div>");
      return "<path class=\"" + cls + "\" fill=\"" + fill + "\" d=\"" + ringPath(f.r) + "\" data-d=\"" + esc(f.d) + "\" data-t=\"" + esc(f.t || "") + "\" data-n=\"" + esc(f.n) + "\" data-tip=\"" + esc(tip) + "\"" + (g ? "" : " data-none=\"1\"") + "></path>";
    }).join("");
    var lg = function (c, t) { return "<span class=\"lg\"><span class=\"sw\" style=\"background:" + c + "\"></span>" + t + "</span>"; };
    var leg = "<div class=\"legend\">" +
      lg(GOOD, M.inv ? "On track: missed ≤ " + pc(thr, 0) : "At or above " + pc(thr, 0) + " (benchmark)") +
      lg(BAD, M.inv ? "Above the missed limit (> " + pc(thr, 0) + ")" : "Below " + pc(thr, 0) + " (dark red)") +
      lg(NODATA, "No data") + (hasAny ? "" : "<span class=\"note\">no UC data for this selection yet</span>") + "</div>";
    return "<div class=\"pf-mapw\"><svg class=\"msvg pf-map\" viewBox=\"" + vb.map(function (x) { return x.toFixed(2); }).join(" ") + "\" role=\"img\" aria-label=\"UC coverage map\">" + paths + "</svg></div>" + leg;
  }
  // draws the current map as a PNG picture (title, map and legend)
  function exportMapPNG(root) {
    var svg = root.querySelector("svg.pf-map");
    if (!svg) return;
    var vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    var clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1600"); clone.setAttribute("height", String(Math.round(1600 * vb[3] / vb[2])));
    Array.prototype.forEach.call(clone.querySelectorAll("path"), function (p) {
      p.setAttribute("stroke", p.classList.contains("sel") ? "#14213D" : "#FFFFFF");
      p.setAttribute("stroke-width", p.classList.contains("sel") ? "3" : "1");
      p.setAttribute("stroke-linejoin", "round");
    });
    var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    var img = new Image();
    img.onload = function () {
      var W = 1600, mapH = Math.round(1600 * vb[3] / vb[2]), legH = 120, topH = 130;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = topH + mapH + legH;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height);
      var metric = MAPM[F.map].t;
      ctx.fillStyle = "#14213D"; ctx.font = "700 46px Arial, sans-serif"; ctx.fillText("Polio Booster Campaign · UC coverage map", 40, 62);
      ctx.fillStyle = "#4B5B76"; ctx.font = "500 28px Arial, sans-serif";
      ctx.fillText(metric + " · benchmark " + pc(F.bench, 0) + " · " + (F.dist === "All" ? "all districts" : F.dist) + (F.teh === "All" ? "" : " · " + F.teh) + (F.uc === "All" ? "" : " · " + F.uc), 40, 108);
      ctx.drawImage(img, 0, topH, W, mapH);
      var items = Array.prototype.map.call(root.querySelectorAll(".pf-mapw + .legend .lg"), function (lg) {
        return { c: getComputedStyle(lg.querySelector(".sw")).backgroundColor, t: lg.textContent };
      });
      var x = 40, y = topH + mapH + 36;
      ctx.font = "500 28px Arial, sans-serif";
      items.forEach(function (it) {
        ctx.fillStyle = it.c; ctx.fillRect(x, y - 24, 28, 28);
        ctx.fillStyle = "#34435E"; ctx.fillText(it.t, x + 40, y);
        x += ctx.measureText(it.t).width + 90;
      });
      cv.toBlob(function (blob) { saveBlob(blob, "fipv-uc-map.png"); }, "image/png");
    };
    img.src = url;
  }

  /* ---- downloads (CSV, opens in Excel) ---- */
  function saveBlob(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function saveCSV(name, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) { var s = c == null ? "" : String(c); return /[",\n\r]/.test(s) ? "\"" + s.replace(/"/g, "\"\"") + "\"" : s; }).join(",");
    }).join("\r\n");
    saveBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), name);
  }
  /* ---- ERM deck (PowerPoint), same format as the district ERM deck ---- */
  // Palette sampled from the fIPV Daily Sitrep PDF: green titles, red missed, orange NA, indigo refusals, blue headers, cream/mint panels.
  var DK = { green: "388E3C", gold: "FF8F00", head: "1565C0", tag: "E8F4E9", red: "F44336", blue: "1565C0", orange: "FF8F00", indigo: "3949AB", teal: "00838F", grid: "A5D6A7", zebra: "FEF7E0", ink: "1A1A1A", mute: "595959", tot: "E8F4E9", hdr: "FCFDF3" };
  var DFONT = "Calibri";
  var pptxLoading = null;
  function loadPptx() {
    if (window.PptxGenJS) return Promise.resolve();
    if (!pptxLoading) {
      pptxLoading = new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = "assets/pptxgen.bundle.js";
        s.onload = function () { window.PptxGenJS ? res() : rej(new Error("PowerPoint library did not load")); };
        s.onerror = function () { rej(new Error("PowerPoint library did not load")); };
        document.head.appendChild(s);
      });
      pptxLoading.catch(function () { pptxLoading = null; });
    }
    return pptxLoading;
  }
  function dataUrl(url) {
    return fetch(url).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); });
    }).catch(function () { return null; });
  }
  function n0(x) { return x == null || !isFinite(x) ? "–" : Math.round(x).toLocaleString("en-US"); }
  function pct0(x) { return x == null || !isFinite(x) ? "–" : Math.round(x * 100) + "%"; }
  function pct1(x) { return pc(x, 1); }
  function shortDate(iso) {
    var dt = new Date(iso + "T00:00:00");
    return isNaN(dt) ? "" : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  // The deck follows the page filters. A chosen day gives two columns: that day, and all days to date.
  // No day chosen gives every day, then all days to date.
  function deckScope() {
    var inArea = function (r) { return (F.dist === "All" || r.dist === F.dist) && (F.teh === "All" || r.teh === F.teh); };
    var target = F.day !== "All" ? +F.day : null;
    if (!target && F.date !== "All") { var hit = ROWS.filter(function (r) { return r.dayDate === F.date; })[0]; if (hit) target = +hit.dayN; }
    var all = ROWS.filter(inArea);
    var days = uniq(all.map(function (r) { return r.dayN; })).filter(function (d) { return d !== "0"; }).sort(function (a, b) { return a - b; });
    if (target) {
      days = days.filter(function (d) { return +d <= target; });
      // the chosen day always gets its column, even when this district has no rows for it yet
      if (days.indexOf(String(target)) < 0) days.push(String(target));
      days.sort(function (a, b) { return a - b; });
    }
    var rs = all.filter(function (r) { return days.indexOf(r.dayN) >= 0; });
    var cs = target ? [] : CUD.filter(inArea);
    var dayPanels = days.map(function (d) {
      var dr = rs.filter(function (r) { return r.dayN === d; });
      var sd = dr.length && /^\d{4}-\d{2}-\d{2}$/.test(dr[0].dayDate) ? " · " + shortDate(dr[0].dayDate) : "";
      return { d: d, h: "Day " + d + sd, m: metrics(dr, [], false), groups: ucGroups(dr, [], false), total: false };
    });
    var total = { h: "All days", m: metrics(rs, cs, !target), groups: ucGroups(rs, cs, !target), total: true };
    var panels = (target ? dayPanels.filter(function (p) { return +p.d === target; }) : dayPanels).concat([total]);
    return { target: target, days: days, rs: rs, cs: cs, trend: dayPanels, panels: panels, cols: panels, groups: total.groups };
  }
  function cw(n) { var r = (9.4 - 3.1) / Math.max(n, 1); var a = [3.1]; for (var i = 0; i < n; i++) a.push(r); return a; }
  function hc(t, fill, align) { return { text: t, options: { bold: true, color: DK.ink, fill: { color: DK.hdr }, align: align || "center", valign: "middle" } }; }
  // Red heat shading as on the website tables: largest value solid red, smaller values fade to cream.
  function heatFill(v, max) { var t = max > 0 ? Math.pow(Math.max(0, Math.min(1, v / max)), .9) : 0; var a = [252, 253, 243], b = [244, 67, 54]; return a.map(function (x, i) { var c = Math.round(x + (b[i] - x) * t).toString(16); return c.length < 2 ? "0" + c : c; }).join("").toUpperCase(); }
  function hv(t, v, max, align) { return { text: String(t), options: { align: align || "center", valign: "middle", fill: { color: heatFill(v, max) } } }; }
  function bc(t, o) { var x = { align: "right", valign: "middle" }; if (o) for (var k in o) x[k] = o[k]; return { text: String(t), options: x }; }
  function pTable(slide, rows, opt) {
    var o = { fontFace: DFONT, fontSize: 10, color: DK.ink, border: [{ type: "none" }, { type: "none" }, { type: "solid", pt: .75, color: DK.green }, { type: "none" }], autoPage: false, rowH: .27 };
    for (var k in opt) o[k] = opt[k];
    slide.addTable(rows, o);
  }
  function slideFrame(pp, title, tag, sn, asOf) {
    var s = pp.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText(title, { x: .3, y: .18, w: 7.9, h: .5, fontFace: DFONT, fontSize: 19, bold: true, color: DK.ink, valign: "middle" });
    s.addShape(pp.ShapeType.line, { x: .3, y: .72, w: 9.4, h: 0, line: { color: DK.gold, width: 1.2 } });
    if (tag) {
      s.addShape(pp.ShapeType.rect, { x: 8.3, y: 0, w: 1.7, h: .26, fill: { color: DK.tag }, line: { color: DK.tag } });
      s.addText(tag, { x: 8.3, y: 0, w: 1.7, h: .26, fontFace: DFONT, fontSize: 9, color: DK.ink, align: "center", valign: "middle" });
    }
    s.addText("Source: District Emergency Operation Center, Peshawar · as of " + asOf + " · ERU Peshawar Dashboard", { x: .3, y: 5.3, w: 8, h: .22, fontFace: DFONT, fontSize: 8, color: DK.mute });
    s.addText(String(sn), { x: 9.1, y: 5.3, w: .6, h: .22, fontFace: DFONT, fontSize: 9, color: DK.mute, align: "right" });
    return s;
  }
  function summaryRows(cols, v) {
    var rows = [
      ["HH target", function (m) { return n0(m[v].target); }],
      ["HH covered", function (m) { return n0(m[v].hh); }],
      ["HH coverage %", function (m) { return pct1(m[v].hhPct); }, 1],
      ["Admin covered (HH + unregistered + school)", function (m) { return n0(m[v].admin); }],
      ["Admin coverage %", function (m) { return pct1(m[v].admPct); }, 1],
      ["Recorded NA", function (m) { return n0(m[v].recNA); }],
      ["Covered NA", function (m) { return n0(m[v].covNA); }],
      ["Still NA", function (m) { return n0(m[v].stNA); }, 1],
      ["Recorded refusals", function (m) { return n0(m[v].recREF); }],
      ["Covered refusals", function (m) { return n0(m[v].covREF); }],
      ["Still refusals", function (m) { return n0(m[v].stREF); }, 1],
      ["Total still missed", function (m) { return n0(m[v].missed); }, 1],
      ["Still missed % of HH target", function (m) { return pct1(m[v].missPct); }]
    ];
    var head = [hc("Indicator", DK.head, "left")].concat(cols.map(function (c) { return hc(c.h, c.total ? DK.green : DK.head); }));
    var body = rows.map(function (r) {
      var bold = !!r[2];
      return [bc(r[0], { align: "left", bold: bold })].concat(cols.map(function (c) {
        var o = { bold: bold }; if (c.total) o.fill = { color: DK.tot };
        return bc(r[1](c.m), o);
      }));
    });
    return [head].concat(body);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  // One map panel in the Post Campaign Review style: title pill, coverage bubble, UC shapes with names, legend.
  function mapPanel(key, groups, label, distVal) {
    return new Promise(function (resolve) {
      if (!GEO || !GEO.length) return resolve(null);
      var M = MAPM[key];
      var thr = M.inv ? 1 - F.bench : F.bench;
      var good = function (v) { return M.inv ? v <= thr : v >= thr; };
      var byKey = {};
      groups.forEach(function (g) { byKey[g.uc + "|" + g.dist] = g; });
      var inScope = function (f) { return (F.dist === "All" || f.d === F.dist) && (F.teh === "All" || f.t === F.teh); };
      var shown = GEO.filter(inScope), box = shown.length ? shown : GEO;
      var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      box.forEach(function (f) { f.r.forEach(function (ring) { ring.forEach(function (p) { var q = proj(p); minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); }); }); });
      var pad = Math.max(maxx - minx, maxy - miny) * 0.03;
      var vx = minx - pad, vy = miny - pad, vw = maxx - minx + 2 * pad, vh = maxy - miny + 2 * pad;
      var W = 1000, TOP = 104, BOT = 96, AW = W - 30, AH = 900;
      var s = Math.min(AW / vw, AH / vh);
      var mh = Math.round(vh * s), ox = (W - vw * s) / 2, oy = TOP;
      var H = TOP + mh + BOT;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#9AA3B2"; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
      var TX = function (x) { return ox + (x - vx) * s; }, TY = function (y) { return oy + (y - vy) * s; };
      var labels = [];
      GEO.forEach(function (f) {
        if (!inScope(f)) return; // only the district or tehsil chosen on the page
        var g = byKey[f.n + "|" + f.d], v = g ? M.f(g.m) : null, has = v != null && isFinite(v);
        var fill = !has ? NODATA : (good(v) ? GOOD : BAD);
        ctx.beginPath();
        f.r.forEach(function (ring) {
          ring.forEach(function (p, i) { var q = proj(p); if (i) ctx.lineTo(TX(q[0]), TY(q[1])); else ctx.moveTo(TX(q[0]), TY(q[1])); });
          ctx.closePath();
        });
        ctx.fillStyle = fill; ctx.fill("nonzero");
        ctx.strokeStyle = "#3D4350"; ctx.lineWidth = 1.2; ctx.stroke();
        if (inScope(f) && f.r[0] && f.r[0].length) {
          var sx = 0, sy = 0; f.r[0].forEach(function (p) { var q = proj(p); sx += q[0]; sy += q[1]; });
          labels.push({ x: TX(sx / f.r[0].length), y: TY(sy / f.r[0].length), t: f.n, dark: has && !good(v) });
        }
      });
      ctx.font = "700 22px Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var placed = [];
      labels.forEach(function (l) {
        var tw = ctx.measureText(l.t).width + 8, th = 26;
        var box = { x0: l.x - tw / 2, x1: l.x + tw / 2, y0: l.y - th / 2, y1: l.y + th / 2 };
        var clash = placed.some(function (b) { return box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0; });
        if (clash) return; // keep the map readable: no overlapping names
        placed.push(box);
        ctx.fillStyle = l.dark ? "#FFFFFF" : "#14213D"; ctx.fillText(l.t, l.x, l.y);
      });
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      // title pill
      ctx.font = "700 30px Arial, sans-serif";
      var pw = ctx.measureText(label).width + 56;
      roundRect(ctx, 20, 22, pw, 66, 33); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.strokeStyle = "#7A8497"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#14213D"; ctx.fillText(label, 48, 66);
      // coverage bubble for the whole panel
      var bx = W - 120, by = 55;
      ctx.beginPath(); ctx.ellipse(bx, by, 100, 40, 0, 0, Math.PI * 2); ctx.fillStyle = (distVal != null && isFinite(distVal) && good(distVal)) ? GOOD : BAD; ctx.fill();
      ctx.fillStyle = "#FFFFFF"; ctx.font = "700 36px Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(pct0(distVal), bx, by + 2);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      // legend
      var items = [[GOOD, M.inv ? "Missed ≤ " + pc(thr, 0) + " (on track)" : "≥ " + pc(thr, 0) + " (benchmark)"], [BAD, M.inv ? "Missed > " + pc(thr, 0) : "< " + pc(thr, 0)], [NODATA, "No data"]];
      ctx.font = "500 26px Arial, sans-serif";
      var x = 60, y = H - 42;
      items.forEach(function (it) {
        ctx.fillStyle = it[0]; ctx.fillRect(x, y - 22, 26, 26);
        ctx.fillStyle = "#34435E"; ctx.fillText(it[1], x + 38, y);
        x += ctx.measureText(it[1]).width + 90;
      });
      resolve({ data: cv.toDataURL("image/png"), ratio: W / H });
    });
  }
  function buildErmDeck() {
    var sc = deckScope();
    var mdef = [["ipv_hh", "fIPV HH coverage by UC", "fIPV"], ["opv_hh", "OPV HH coverage by UC", "OPV"], ["ipv_miss", "fIPV still missed by UC", "fIPV"], ["opv_miss", "OPV still missed by UC", "OPV"]];
    var mapPanels = [sc.panels[sc.panels.length - 1]]; // all days only
    var mapJobs = mdef.map(function (d) {
      return Promise.all(mapPanels.map(function (p) { return mapPanel(d[0], p.groups, p.h, MAPM[d[0]].f(p.m)); }));
    });
    return Promise.all([loadPptx(), dataUrl("assets/logo-pei.jpg"), dataUrl("assets/logo-kp.png"), Promise.all(mapJobs)]).then(function (a) {
      var pei = a[1], kp = a[2], mapPics = a[3];
      var distName = F.dist === "All" ? "Peshawar Division" : F.dist.charAt(0) + F.dist.slice(1).toLowerCase();
      var period = sc.target ? "Day " + sc.target : "all days to date";
      var asOf = STAMP ? dateLabel(STAMP.slice(0, 10)) : dateLabel(new Date().toISOString().slice(0, 10));
      var tot = sc.panels[sc.panels.length - 1].m;
      var pp = new PptxGenJS();
      pp.layout = "LAYOUT_16x9"; pp.author = "ERU Peshawar Dashboard"; pp.title = "ERM fIPV " + distName + " " + period;
      var sn = 1;
      var frame = function (title, tag) { sn++; return slideFrame(pp, title, tag, sn, asOf); };

      // 1. title
      var t = pp.addSlide(); t.background = { color: "FFFFFF" };
      if (pei) t.addImage({ data: pei, x: .25, y: .25, w: 2, h: .64 });
      if (kp) t.addImage({ data: kp, x: 8.75, y: .1, w: 1.08, h: 1.12 });
      t.addShape(pp.ShapeType.rect, { x: 0, y: 1.9, w: 10, h: .13, fill: { color: DK.gold }, line: { color: DK.gold } });
      t.addShape(pp.ShapeType.rect, { x: 0, y: 2.02, w: 10, h: 3.61, fill: { color: DK.green }, line: { color: DK.green } });
      t.addText("Evening Review Meeting - District " + distName, { x: .5, y: 2.5, w: 9, h: .7, fontFace: DFONT, fontSize: 28, bold: true, color: "FFFFFF" });
      t.addText("Polio Booster Campaign (fIPV & OPV) · " + period, { x: .5, y: 3.25, w: 9, h: .4, fontFace: DFONT, fontSize: 16, bold: true, color: "FFFFFF" });
      t.addText(asOf.toUpperCase(), { x: .5, y: 4.9, w: 9, h: .3, fontFace: DFONT, fontSize: 12, bold: true, color: "FFFFFF" });

      // 2-3. coverage summaries: chosen day and all days (or every day and all days)
      var s2 = frame("Summary of fIPV coverage - " + (sc.target ? "Day " + sc.target + " and all days" : "day-wise and all days"), "fIPV");
      pTable(s2, summaryRows(sc.cols, "ipv"), { x: .3, y: .9, w: 9.4, colW: cw(sc.cols.length) });
      var s3 = frame("Summary of OPV coverage - " + (sc.target ? "Day " + sc.target + " and all days" : "day-wise and all days"), "OPV");
      pTable(s3, summaryRows(sc.cols, "opv"), { x: .3, y: .9, w: 9.4, colW: cw(sc.cols.length) });

      // 4. still missed children, all days to date
      var s4 = frame("Summary of missed children - fIPV and OPV, all days to date", "Missed children");
      var mrows = [["Recorded NA", "recNA"], ["Covered NA", "covNA"], ["Still NA", "stNA", 1], ["Recorded refusals", "recREF"], ["Covered refusals", "covREF"], ["Still refusals", "stREF", 1], ["Total still missed", "missed", 1], ["Still missed % of HH target", "missPct", 1, 1]];
      var m4 = [[hc("Indicator", DK.head, "left"), hc("fIPV", DK.head), hc("OPV", DK.head)]].concat(mrows.map(function (r) {
        var b = !!r[2];
        var f = function (v) { return r[3] ? pct1(tot[v][r[1]]) : n0(tot[v][r[1]]); };
        return [bc(r[0], { align: "left", bold: b }), bc(f("ipv"), { bold: b, align: "center" }), bc(f("opv"), { bold: b, align: "center" })];
      }));
      pTable(s4, m4, { x: .3, y: .9, w: 6.2, colW: [3.2, 1.5, 1.5] });
      s4.addText("Figures to date (all days up to the selected day, catch-up included when the day is All). Refusals and NA as recorded in the workbook.", { x: .3, y: 3.7, w: 9.4, h: .5, fontFace: DFONT, fontSize: 10, italic: true, color: DK.mute });

      // 5-8. UC maps: chosen day beside all days (three panels per slide at most)
      mdef.forEach(function (d, mi) {
        var pics = mapPics[mi];
        for (var k = 0; k < mapPanels.length; k += 3) {
          var chunk = mapPanels.slice(k, k + 3), cp = pics.slice(k, k + 3);
          var title = d[1];
          var s = frame(title, d[2]);
          var slot = 9.4 / chunk.length;
          chunk.forEach(function (p, i) {
            var pic = cp[i];
            if (!pic) { s.addText("No UC map data", { x: .3 + i * slot, y: 2.4, w: slot, h: .5, fontFace: DFONT, fontSize: 12, italic: true, color: DK.mute, align: "center" }); return; }
            var h = 4.45, w = h * pic.ratio;
            s.addImage({ data: pic.data, x: .3, y: .85, w: w, h: h });
            var mk = d[0], M = MAPM[mk], ind = mk.slice(0, 3), isMiss = mk.indexOf("miss") > -1;
            var ranked = chunk[0].groups.filter(function (g) { return M.f(g.m) != null && isFinite(M.f(g.m)); })
              .sort(function (a, b) { return isMiss ? M.f(b.m) - M.f(a.m) : M.f(a.m) - M.f(b.m); }).slice(0, 10);
            var tx = .3 + w + .3, tw = 9.7 - tx;
            var tcol = isMiss ? DK.red : DK.green;
            var hPct = isMiss ? "% of target" : "HH cov %", hCnt = isMiss ? "Still missed" : "HH covered";
            s.addText("Top 10 UCs - " + (isMiss ? "highest still missed" : "lowest HH coverage") + " (all days)", { x: tx, y: .85, w: tw, h: .32, fontFace: DFONT, fontSize: 12, bold: true, color: tcol });
            var trows = [[hc("#", tcol), hc("UC", tcol, "left"), hc("Tehsil", tcol, "left"), hc(hPct, tcol), hc(hCnt, tcol)]];
            var mxC = 0; ranked.forEach(function (g) { mxC = Math.max(mxC, g.m[ind].missed); });
            ranked.forEach(function (g, j) {
              var val = M.f(g.m), cnt = isMiss ? g.m[ind].missed : g.m[ind].hh;
              trows.push([bc(j + 1, { align: "center" }), bc(g.uc, { align: "left" }), bc(g.teh, { align: "left" }), bc(pct1(val), { bold: isMiss }), isMiss ? hv(n0(cnt), cnt, mxC) : bc(n0(cnt))]);
            });
            pTable(s, trows, { x: tx, y: 1.2, w: tw, rowH: .3, fontSize: 10, colW: [.35, 1.75, 1.05, 1.0, tw - 4.15] });
          });
        }
      });

      // 9. daily progress, days up to the chosen day
      var dayCols = sc.trend;
      if (dayCols.length) {
        var s9 = frame("Daily progress - admin coverage by day", "Daily");
        s9.addChart(pp.ChartType.bar, [
          { name: "fIPV admin coverage %", labels: dayCols.map(function (c) { return c.h; }), values: dayCols.map(function (c) { return c.m.ipv.admPct || 0; }) },
          { name: "OPV admin coverage %", labels: dayCols.map(function (c) { return c.h; }), values: dayCols.map(function (c) { return c.m.opv.admPct || 0; }) }
        ], { x: .3, y: .85, w: 9.4, h: 2.7, barDir: "col", barGrouping: "clustered", chartColors: ["2F5BD3", "7C3AED"], showValue: true, dataLabelFormatCode: "0%", valAxisLabelFormatCode: "0%", valAxisMinVal: 0, showLegend: true, legendPos: "b", catAxisLabelFontSize: 10, dataLabelFontSize: 10, valGridLine: { style: "none" } });
        var drow = [[hc("Indicator", DK.head, "left")].concat(dayCols.map(function (c) { return hc(c.h, DK.head); }))];
        [["fIPV admin covered", "ipv", "admin"], ["fIPV still missed", "ipv", "missed"], ["OPV admin covered", "opv", "admin"], ["OPV still missed", "opv", "missed"]].forEach(function (r) {
          drow.push([bc(r[0], { align: "left" })].concat(dayCols.map(function (c) { return bc(n0(c.m[r[1]][r[2]])); })));
        });
        pTable(s9, drow, { x: .3, y: 3.6, w: 9.4, colW: cw(dayCols.length) });
      }

      // 9b. still NA and still refusals, top 10 UCs, all days to date (PDF sitrep style), one slide per indicator
      [["ipv", "fIPV"], ["opv", "OPV"]].forEach(function (ind) {
        var sx = frame(ind[1] + " - highest still NA and still refusals UCs, all days to date", "NA and refusals");
        [["stNA", .3, "Still NA", DK.orange], ["stREF", 5.1, "Still refusals", DK.indigo]].forEach(function (c) {
          sx.addText(ind[1] + " - " + c[2] + " (top 10 UCs)", { x: c[1], y: .85, w: 4.6, h: .3, fontFace: DFONT, fontSize: 12, bold: true, color: c[3] });
          var top = sc.groups.filter(function (g) { return g.m[ind[0]][c[0]] > 0; }).sort(function (a, b) { return b.m[ind[0]][c[0]] - a.m[ind[0]][c[0]]; }).slice(0, 10);
          var rows = [[hc("#", c[3]), hc("UC", c[3], "left"), hc("Tehsil", c[3], "left"), hc(c[2], c[3]), hc("Still missed", c[3])]];
          var mx = top.length ? top[0].m[ind[0]][c[0]] : 0;
          top.forEach(function (g, i) {
            var val = g.m[ind[0]][c[0]];
            rows.push([bc(i + 1, { align: "center" }), bc(g.uc, { align: "left" }), bc(g.teh, { align: "left" }), hv(n0(val), val, mx), bc(n0(g.m[ind[0]].missed))]);
          });
          pTable(sx, rows, { x: c[1], y: 1.2, w: 4.6, rowH: .3, fontSize: 9, colW: [.35, 1.7, 1.0, .75, .8] });
        });
      });

      // 10. highest still missed UCs, all days to date
      var s10 = frame("Highest still missed UCs - fIPV and OPV", "Missed children");
      [["ipv", .3, "fIPV - top 10 UCs by still missed"], ["opv", 5.1, "OPV - top 10 UCs by still missed"]].forEach(function (d) {
        s10.addText(d[2], { x: d[1], y: .85, w: 4.6, h: .3, fontFace: DFONT, fontSize: 12, bold: true, color: DK.ink });
        var top = sc.groups.filter(function (g) { return g.m[d[0]].missed > 0; }).sort(function (a, b) { return b.m[d[0]].missed - a.m[d[0]].missed; }).slice(0, 10);
        var rows = [[hc("#", DK.red), hc("UC", DK.red, "left"), hc("Tehsil", DK.red, "left"), hc("NA", DK.red), hc("REF", DK.red), hc("Total", DK.red)]];
        var mxT = top.length ? top[0].m[d[0]].missed : 0;
        top.forEach(function (g, i) {
          rows.push([bc(i + 1, { align: "center" }), bc(g.uc, { align: "left" }), bc(g.teh, { align: "left" }), bc(n0(g.m[d[0]].stNA)), bc(n0(g.m[d[0]].stREF)), hv(n0(g.m[d[0]].missed), g.m[d[0]].missed, mxT)]);
        });
        pTable(s10, rows, { x: d[1], y: 1.2, w: 4.6, rowH: .25, fontSize: 9, colW: [.35, 1.55, .85, .65, .65, .55] });
      });

      // 11. tehsil summary, all days to date
      var tehs = uniq(sc.rs.map(function (r) { return r.teh; })).sort();
      var s11 = frame("Tehsil-wise coverage and still missed - fIPV and OPV, all days to date", "Tehsils");
      var trows = [[hc("Tehsil", DK.head, "left"), hc("fIPV target", DK.head), hc("fIPV HH cov %", DK.head), hc("fIPV still missed", DK.head), hc("OPV HH cov %", DK.head), hc("OPV still missed", DK.head)]];
      tehs.forEach(function (tn) {
        var m = metrics(sc.rs.filter(function (r) { return r.teh === tn; }), sc.cs.filter(function (r) { return r.teh === tn; }), !sc.target);
        trows.push([bc(tn, { align: "left" }), bc(n0(m.ipv.target)), bc(pct1(m.ipv.hhPct)), bc(n0(m.ipv.missed), { bold: true }), bc(pct1(m.opv.hhPct)), bc(n0(m.opv.missed), { bold: true })]);
      });
      trows.push([bc("Total", { align: "left", bold: true, fill: { color: DK.tot } }), bc(n0(tot.ipv.target), { bold: true, fill: { color: DK.tot } }), bc(pct1(tot.ipv.hhPct), { bold: true, fill: { color: DK.tot } }), bc(n0(tot.ipv.missed), { bold: true, fill: { color: DK.tot } }), bc(pct1(tot.opv.hhPct), { bold: true, fill: { color: DK.tot } }), bc(n0(tot.opv.missed), { bold: true, fill: { color: DK.tot } })]);
      pTable(s11, trows, { x: .3, y: .9, w: 9.4, colW: [2.4, 1.4, 1.4, 1.4, 1.4, 1.4] });

      // 12+. one slide per tehsil: top UCs, all days to date
      tehs.forEach(function (tn) {
        var gs = sc.groups.filter(function (g) { return g.teh === tn; }).sort(function (a, b) { return b.m.ipv.missed - a.m.ipv.missed; }).slice(0, 12);
        if (!gs.length) return;
        var st = frame(tn + " tehsil - UCs with still missed children", "Missed children");
        st.addShape(pp.ShapeType.rect, { x: .3, y: .85, w: 9.4, h: .38, fill: { color: DK.blue }, line: { color: DK.blue } });
        st.addText(tn + " TEHSIL - STILL MISSED (fIPV & OPV)", { x: .3, y: .85, w: 9.4, h: .38, fontFace: DFONT, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
        var urows = [[hc("#", DK.blue), hc("UC", DK.blue, "left"), hc("fIPV HH cov %", DK.blue), hc("fIPV still NA", DK.blue), hc("fIPV still REF", DK.blue), hc("fIPV still missed", DK.blue), hc("OPV HH cov %", DK.blue), hc("OPV still missed", DK.blue)]];
        var mxI = gs[0].m.ipv.missed, mxO = 0; gs.forEach(function (g) { mxO = Math.max(mxO, g.m.opv.missed); });
        gs.forEach(function (g, i) {
          urows.push([bc(i + 1, { align: "center" }), bc(g.uc, { align: "left" }), bc(pct1(g.m.ipv.hhPct)), bc(n0(g.m.ipv.stNA)), bc(n0(g.m.ipv.stREF)), hv(n0(g.m.ipv.missed), g.m.ipv.missed, mxI), bc(pct1(g.m.opv.hhPct)), hv(n0(g.m.opv.missed), g.m.opv.missed, mxO)]);
        });
        pTable(st, urows, { x: .3, y: 1.35, w: 9.4, rowH: .25, colW: [.5, 2.6, 1.0, 1.0, 1.0, 1.1, 1.0, 1.2] });
      });

      var fname = ("ERM fIPV " + distName + " " + period + " " + asOf + ".pptx").replace(/[\\/:*?"<>|]/g, "-");
      return pp.writeFile({ fileName: fname });
    });
  }
  function ermDeck(btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    var old = btn.textContent;
    btn.textContent = "Building PowerPoint…";
    buildErmDeck().then(function () { btn.textContent = old; btn.disabled = false; })
      .catch(function (e) { console.error(e); btn.textContent = "Could not build – try again"; btn.disabled = false; });
  }

  function pv(p) { return p == null ? "" : (p * 100).toFixed(1); }
  var UC_HEAD = ["District", "Tehsil", "UC", "fIPV HH target", "fIPV HH coverage %", "fIPV admin coverage %", "fIPV still NA", "fIPV still REF", "fIPV still missed", "fIPV still missed %", "fIPV school covered",
    "OPV HH target", "OPV HH coverage %", "OPV admin coverage %", "OPV still NA", "OPV still REF", "OPV still missed", "OPV still missed %", "OPV school covered"];
  function ucRows(groups) {
    return groups.map(function (g) {
      var i = g.m.ipv, o = g.m.opv;
      return [g.dist, g.teh, g.uc, Math.round(i.target), pv(i.hhPct), pv(i.admPct), Math.round(i.stNA), Math.round(i.stREF), Math.round(i.missed), pv(i.missPct), Math.round(i.school),
        Math.round(o.target), pv(o.hhPct), pv(o.admPct), Math.round(o.stNA), Math.round(o.stREF), Math.round(o.missed), pv(o.missPct), Math.round(o.school)];
    });
  }

  /* ---- small pieces ---- */
  function ring(p, color, label) {
    var v = p == null ? 0 : clamp(p) * 100;
    return "<div class=\"pf-ring\"><svg viewBox=\"0 0 120 120\" aria-hidden=\"true\"><circle class=\"bg\" cx=\"60\" cy=\"60\" r=\"48\" fill=\"none\" stroke-width=\"12\"/>" +
      "<circle class=\"fg\" data-v=\"" + v.toFixed(2) + "\" cx=\"60\" cy=\"60\" r=\"48\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"12\" pathLength=\"100\" stroke-dasharray=\"0 100\" transform=\"rotate(-90 60 60)\"/>" +
      "<text x=\"60\" y=\"62\" text-anchor=\"middle\" data-count=\"" + (p == null ? "" : (p * 100).toFixed(1)) + "\" data-fmt=\"p\">" + pc(p) + "</text></svg>" +
      "<div class=\"pf-lab\">" + esc(label) + "</div></div>";
  }
  function bar(label, p, color) {
    var w = p == null ? 0 : clamp(p) * 100;
    return "<div class=\"pf-br\"><span>" + esc(label) + "</span><div class=\"pf-track\"><div class=\"pf-fill\" data-w=\"" + w.toFixed(2) + "\" style=\"background:" + color + "\"></div></div><b>" + pc(p) + "</b></div>";
  }
  function sel2(id, label, opts, val, all, labelFn) {
    var h = "<div class=\"pf-fl\"><label for=\"" + id + "\">" + label + "</label><select class=\"pf-sel\" id=\"" + id + "\">";
    h += "<option value=\"All\"" + (val === "All" ? " selected" : "") + ">" + all + "</option>";
    opts.forEach(function (o) { h += "<option value=\"" + esc(o) + "\"" + (String(val) === String(o) ? " selected" : "") + ">" + esc(labelFn ? labelFn(o) : o) + "</option>"; });
    return h + "</select></div>";
  }
  function dlBtn(key, label) { return "<button type=\"button\" class=\"dlb\" data-ex=\"" + key + "\">⬇ " + label + "</button>"; }

  /* ---- sections ---- */
  // fIPV / OPV headline card: big numbers, benchmark pills, still NA / refusal in orange / red
  function sitCard(v, m, title, accent, tint) {
    var x = m[v];
    return "<section class=\"pf-c gl " + tint + " s6 pop\">" +
      "<div class=\"sx-head\"><span class=\"sx-title\" style=\"color:" + accent + "\">" + title + "</span><span>" + nf(x.target) + " children recorded</span></div>" +
      "<div class=\"sx-grid\">" +
        "<div class=\"sx-k\"><span>HH Target</span><b class=\"c-ink\" data-count=\"" + Math.round(x.target) + "\" data-fmt=\"n\">" + nf(x.target) + "</b></div>" +
        "<div class=\"sx-k\"><span>Still NA</span><b class=\"c-amb\" data-count=\"" + Math.round(x.stNA) + "\" data-fmt=\"n\">" + nf(x.stNA) + "</b><em class=\"c-amb\">" + pc(x.stNAPct) + "</em></div>" +
        "<div class=\"sx-k\"><span>Still refusal</span><b class=\"c-red\" data-count=\"" + Math.round(x.stREF) + "\" data-fmt=\"n\">" + nf(x.stREF) + "</b><em class=\"c-red\">" + pc(x.stREFPct) + "</em></div>" +
      "</div>" +
      "<div class=\"sx-line\" style=\"background:" + accent + "\"></div>" +
      "<div class=\"sx-grid\">" +
        "<div class=\"sx-k\"><span>Admin coverage</span><b class=\"c-blu\" data-count=\"" + Math.round(x.admin) + "\" data-fmt=\"n\">" + nf(x.admin) + "</b>" + bmPill(x.admPct) + "</div>" +
        "<div class=\"sx-k\"><span>HH coverage</span><b class=\"c-grn\" data-count=\"" + Math.round(x.hh) + "\" data-fmt=\"n\">" + nf(x.hh) + "</b>" + bmPill(x.hhPct) + "</div>" +
        "<div class=\"sx-k\"><span>Still missed</span><b class=\"c-red\" data-count=\"" + Math.round(x.missed) + "\" data-fmt=\"n\">" + nf(x.missed) + "</b><em class=\"c-red\">" + pc(x.missPct) + "</em></div>" +
      "</div></section>";
  }
  function cmpCard(m) {
    function col(v, title) {
      var x = m[v];
      return "<div><h4>" + title + "</h4><div class=\"pf-mini\">" +
        "<div class=\"pf-cell\"><span>Rec NA</span><b class=\"c-red\" data-count=\"" + Math.round(x.recNA) + "\" data-fmt=\"n\">" + nf(x.recNA) + "</b><i class=\"c-red\">" + pc(x.recNAPct, 0) + "</i></div>" +
        "<div class=\"pf-cell\"><span>Cov NA</span><b class=\"c-blu\" data-count=\"" + Math.round(x.covNA) + "\" data-fmt=\"n\">" + nf(x.covNA) + "</b><i class=\"c-blu\">" + pc(x.covNAPct, 0) + "</i></div>" +
        "<div class=\"pf-cell\"><span>Rec REF</span><b class=\"c-red\" data-count=\"" + Math.round(x.recREF) + "\" data-fmt=\"n\">" + nf(x.recREF) + "</b><i class=\"c-red\">" + pc(x.recREFPct, 0) + "</i></div>" +
        "<div class=\"pf-cell\"><span>Cov REF</span><b class=\"c-blu\" data-count=\"" + Math.round(x.covREF) + "\" data-fmt=\"n\">" + nf(x.covREF) + "</b><i class=\"c-blu\">" + pc(x.covREFPct, 0) + "</i></div>" +
        "</div></div>";
    }
    return "<section class=\"pf-c gl t-yellow s6 pop\"><div class=\"pf-h\">Missed children comparison</div><div class=\"pf-two\">" + col("ipv", "fIPV") + col("opv", "OPV") + "</div>" +
      "<div class=\"pf-lab\" style=\"margin-top:12px\">Rec = children recorded as not vaccinated (NA = not at home, REF = refused). Cov = those later covered. Rec % is of the HH target, Cov % is of Rec.</div></section>";
  }
  function otherCard(m) {
    var ip = m.ipv.schoolPct, op = m.opv.schoolPct;
    return "<section class=\"pf-c gl t-mint s6 pop\"><div class=\"pf-h\">Other coverages · school</div>" +
      "<div class=\"pf-two\" style=\"justify-items:center\">" +
      ring(ip, bmColor(ip), "fIPV school") + ring(op, bmColor(op), "OPV school") + "</div>" +
      "<div class=\"pf-mini\" style=\"margin-top:14px\">" +
      "<div class=\"pf-cell\"><span>fIPV school covered</span><b class=\"c-blu\" data-count=\"" + Math.round(m.ipv.school) + "\" data-fmt=\"n\">" + nf(m.ipv.school) + "</b></div>" +
      "<div class=\"pf-cell\"><span>OPV school covered</span><b class=\"c-blu\" data-count=\"" + Math.round(m.opv.school) + "\" data-fmt=\"n\">" + nf(m.opv.school) + "</b></div></div></section>";
  }
  function dailyRows() {
    var days = uniq(ROWS.map(function (r) { return r.dayN; })).filter(function (d) { return d !== "0"; }).sort(function (a, b) { return a - b; });
    var rows = ROWS.filter(function (r) { return (F.dist === "All" || r.dist === F.dist) && (F.teh === "All" || r.teh === F.teh) && (F.uc === "All" || r.uc === F.uc); });
    var cum = 0, cumT = 0;
    return days.map(function (d) {
      var m = metrics(rows.filter(function (r) { return r.dayN === d; }), [], false);
      cum += m.ipv.admin; cumT += m.ipv.target;
      return { d: d, adm: m.ipv.admin, tgt: m.ipv.target, cumPct: div(cum, cumT) };
    });
  }
  function dailyCard(cls) {
    var W = 640, H = 230, padL = 36, padB = 34, padT = 14;
    var per = dailyRows();
    if (!per.length) return "<section class=\"pf-c gl " + cls + " pop\"><div class=\"pf-h\">Daily progress</div><div class=\"pf-empty\">No campaign days yet.</div></section>";
    var maxA = Math.max.apply(null, per.map(function (p) { return p.adm; }).concat([1]));
    var n = per.length, slot = (W - padL - 10) / n, bw = Math.min(70, slot * 0.55);
    var bars = "", pts = "", dots = "";
    per.forEach(function (p, i) {
      var cx = padL + slot * i + slot / 2, h = (p.adm / maxA) * (H - padT - padB);
      var y = H - padB - h;
      bars += "<rect class=\"colb\" style=\"transition-delay:" + (i * 120) + "ms\" x=\"" + (cx - bw / 2) + "\" y=\"" + y + "\" width=\"" + bw + "\" height=\"" + h + "\" rx=\"10\" fill=\"#5B8DEF\" fill-opacity=\".78\"><title>Day " + p.d + ": " + nf(p.adm) + " admin covered</title></rect>";
      var py = padT + (1 - clamp(p.cumPct || 0)) * (H - padT - padB);
      pts += (i ? " " : "") + cx.toFixed(1) + "," + py.toFixed(1);
      dots += "<circle class=\"pt\" style=\"transition-delay:" + (1200 + i * 150) + "ms\" cx=\"" + cx.toFixed(1) + "\" cy=\"" + py.toFixed(1) + "\" r=\"6\" fill=\"#15803D\" stroke=\"#fff\" stroke-width=\"2\"/>";
      bars += "<text x=\"" + cx.toFixed(1) + "\" y=\"" + (H - 12) + "\" text-anchor=\"middle\" font-size=\"12\" fill=\"#4B5B76\" font-weight=\"700\">Day " + p.d + "</text>";
    });
    var grid = "";
    [0, 0.5, 1].forEach(function (g) { var y = padT + (1 - g) * (H - padT - padB); grid += "<line x1=\"" + padL + "\" x2=\"" + (W - 6) + "\" y1=\"" + y + "\" y2=\"" + y + "\" stroke=\"#C9D3E6\" stroke-dasharray=\"4 5\"/><text x=\"" + (padL - 6) + "\" y=\"" + (y + 4) + "\" text-anchor=\"end\" font-size=\"11\" fill=\"#6B7A93\">" + (g * 100) + "%</text>"; });
    EX.daily = function () {
      saveCSV("fipv-daily-progress.csv", [["Day", "Admin covered (fIPV)", "fIPV HH target", "Cumulative % of target"]].concat(per.map(function (p) { return [p.d, Math.round(p.adm), Math.round(p.tgt), pv(p.cumPct)]; })));
    };
    return "<section class=\"pf-c gl " + cls + " pop\"><div class=\"pf-h\">Daily progress" + dlBtn("daily", "CSV") + "</div>" +
      "<svg class=\"pf-chart\" viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"Daily progress chart\">" + grid + bars +
      "<polyline class=\"ln\" style=\"--len:900\" fill=\"none\" stroke=\"#15803D\" stroke-width=\"3.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\" points=\"" + pts + "\"/>" + dots + "</svg>" +
      "<div class=\"pf-lab\">Bars = admin covered per day · line = cumulative % of fIPV HH target. Campaign days so far: " + n + ". Catch-up rows count only on the All-days view.</div></section>";
  }
  function districtCard(cls) {
    var rows = ROWS.filter(function (r) { return F.day === "All" || r.dayN === F.day; });
    var ds = uniq(rows.map(function (r) { return r.dist; }));
    var html = "", out = [["District", "fIPV admin coverage %", "fIPV still missed %", "OPV admin coverage %", "OPV still missed %"]];
    ds.forEach(function (d) {
      var cs = CUD.filter(function (r) { return r.dist === d && (F.day === "All"); });
      var mm = metrics(rows.filter(function (r) { return r.dist === d; }), cs, F.day === "All");
      out.push([d, pv(mm.ipv.admPct), pv(mm.ipv.missPct), pv(mm.opv.admPct), pv(mm.opv.missPct)]);
      html += "<div class=\"pf-day\" style=\"margin-bottom:14px\"><div class=\"pf-lab\" style=\"margin:0 0 4px;color:#14213D;font-weight:800;font-size:14px\">" + esc(d.charAt(0) + d.slice(1).toLowerCase()) + "</div>" +
        "<div class=\"pf-bars\" style=\"margin-top:0\">" + bar("fIPV admin", mm.ipv.admPct, bmColor(mm.ipv.admPct)) + bar("OPV admin", mm.opv.admPct, bmColor(mm.opv.admPct)) + bar("fIPV still missed", mm.ipv.missPct, "#B42318") + bar("OPV still missed", mm.opv.missPct, "#F59E0B") + "</div></div>";
    });
    EX.district = function () { saveCSV("fipv-district-summary.csv", out); };
    return "<section class=\"pf-c gl " + cls + " pop\"><div class=\"pf-h\">District comparison" + dlBtn("district", "CSV") + "</div>" + (html || "<div class=\"pf-empty\">No data.</div>") + "</section>";
  }
  function mapCard(groups) {
    var opts = Object.keys(MAPM).map(function (k) { return "<option value=\"" + k + "\"" + (F.map === k ? " selected" : "") + ">" + MAPM[k].t + "</option>"; }).join("");
    EX.map = function () { exportMapPNG(document.getElementById("fipv-root") || document); };
    return "<section class=\"pf-c gl s7 pop\"><div class=\"pf-h\">UC coverage map<small>click a UC to focus it</small></div>" +
      "<div class=\"pf-tools\"><select class=\"pf-sel\" id=\"pf-map\" aria-label=\"Map metric\" style=\"padding-right:34px\">" + opts + "</select>" +
      (F.uc !== "All" ? "<button class=\"pf-reset\" id=\"pf-clearuc\">Clear UC</button>" : "") +
      "<span class=\"pf-hbtn\" style=\"margin-left:auto;display:flex;gap:8px\">" + dlBtn("map", "Map (PNG)") + dlBtn("all", "All data (CSV)") + "</span></div>" +
      mapHTML(groups) + "</section>";
  }
  var RANKS = {
    missed: { t: "Most children missed", f: function (x) { return x.missed; } },
    na: { t: "Most still NA", f: function (x) { return x.stNA; } },
    ref: { t: "Most refusals", f: function (x) { return x.stREF; } },
    lowhh: { t: "Lowest HH coverage", f: function (x) { return x.hhPct == null ? 9 : -x.hhPct; } }
  };
  function rankList(groups, v, rank, n) {
    var R = RANKS[rank];
    var list = groups.map(function (g) { var x = g.m[v]; return { uc: g.uc, teh: g.teh, dist: g.dist, target: x.target, hhPct: x.hhPct, missed: x.missed, stNA: x.stNA, stREF: x.stREF, val: R.f(x) }; })
      .filter(function (x) { return x.target > 0; });
    if (rank === "lowhh") list.sort(function (a, b) { return a.val - b.val; }); else list.sort(function (a, b) { return b.val - a.val; });
    return list.slice(0, n || 15);
  }
  function rankTable(groups, v, rank, n) {
    var list = rankList(groups, v, rank, n);
    if (!list.length) return "<div class=\"pf-empty\">No UCs reporting for this selection.</div>";
    var lowhh = rank === "lowhh";
    var max = Math.max.apply(null, list.map(function (x) { return Math.abs(x.val); })) || 1;
    var h = "<div class=\"pf-tw\"><table class=\"pf-t\"><thead><tr><th class=\"n\">#</th><th>UC</th><th class=\"r\">" + (lowhh ? "HH cov" : "Still") + "</th><th></th></tr></thead><tbody>";
    list.forEach(function (x, i) {
      var shown = lowhh ? pc(x.hhPct) : rank === "missed" ? nf(x.missed) : rank === "na" ? nf(x.stNA) : nf(x.stREF);
      var bw = lowhh ? clamp(x.hhPct || 0) * 100 : clamp(Math.abs(x.val) / max) * 100;
      var col = lowhh ? bmColor(x.hhPct) : BAD;
      h += "<tr data-uc=\"" + esc(x.uc) + "\" data-d=\"" + esc(x.dist) + "\" data-t=\"" + esc(x.teh) + "\"><td class=\"n\">" + (i + 1) + "</td><td class=\"u\" title=\"" + esc(x.teh) + "\">" + esc(x.uc) + "</td><td class=\"r " + (lowhh ? "" : "red") + "\">" + shown + "</td><td class=\"pf-tb\"><div class=\"pf-track\"><div class=\"pf-fill\" data-w=\"" + bw.toFixed(1) + "\" style=\"background:" + col + "\"></div></div></td></tr>";
    });
    return h + "</tbody></table></div>";
  }
  function missCard(groups, v, title, accent) {
    var key = "miss-" + v;
    EX[key] = function () {
      saveCSV("fipv-" + v + "-most-missed.csv", [["Rank", "District", "Tehsil", "UC", "Still missed", "Still NA", "Still REF", "HH target"]].concat(
        rankList(groups, v, "missed", 9999).map(function (x, i) { return [i + 1, x.dist, x.teh, x.uc, Math.round(x.missed), Math.round(x.stNA), Math.round(x.stREF), Math.round(x.target)]; })));
    };
    return "<section class=\"pf-c gl t-yellow pop\"><div class=\"pf-h\" style=\"color:" + accent + "\">Highest missed children · " + title + dlBtn(key, "CSV") + "</div>" + rankTable(groups, v, "missed", 10) + "</section>";
  }
  function rankCard(groups) {
    var seg = Object.keys(RANKS).map(function (k) { return "<button type=\"button\" data-rank=\"" + k + "\" aria-pressed=\"" + (F.rank === k) + "\">" + RANKS[k].t + "</button>"; }).join("");
    EX.rank = function () {
      saveCSV("fipv-uc-ranking-" + F.rank + ".csv", [["Rank", "District", "Tehsil", "UC", "Vaccine", "HH target", "HH coverage %", "Still missed", "Still NA", "Still REF"]].concat(
        ["ipv", "opv"].reduce(function (a, v) {
          return a.concat(rankList(groups, v, F.rank, 9999).map(function (x, i) { return [i + 1, x.dist, x.teh, x.uc, v.toUpperCase(), Math.round(x.target), pv(x.hhPct), Math.round(x.missed), Math.round(x.stNA), Math.round(x.stREF)]; }));
        }, [])));
    };
    return "<section class=\"pf-c gl s12 pop\"><div class=\"pf-h\">UC rankings<small>top 15 UCs in the current selection</small>" + dlBtn("rank", "CSV") + "</div>" +
      "<div class=\"pf-tools\"><div class=\"pf-seg\">" + seg + "</div></div>" +
      "<div class=\"pf-two\"><div><h4 style=\"text-align:left;color:#2F5BD3\">fIPV</h4>" + rankTable(groups, "ipv", F.rank, 15) + "</div>" +
      "<div><h4 style=\"text-align:left;color:#15803D\">OPV</h4>" + rankTable(groups, "opv", F.rank, 15) + "</div></div></section>";
  }
  function ucTable(groups) {
    var cols = [["uc", "UC", "t"], ["teh", "Tehsil", "t"], ["ipvT", "fIPV target", "r"], ["ipvH", "fIPV HH %", "r"], ["ipvA", "fIPV admin %", "r"], ["ipvM", "fIPV missed", "r"], ["opvT", "OPV target", "r"], ["opvH", "OPV HH %", "r"], ["opvA", "OPV admin %", "r"], ["opvM", "OPV missed", "r"]];
    var list = groups.map(function (g) {
      var i = g.m.ipv, o = g.m.opv;
      return { uc: g.uc, teh: g.teh, dist: g.dist, ipvT: i.target, ipvH: i.hhPct, ipvA: i.admPct, ipvM: i.missed, opvT: o.target, opvH: o.hhPct, opvA: o.admPct, opvM: o.missed };
    }).filter(function (x) { return !F.q || (x.uc + " " + x.teh + " " + x.dist).toLowerCase().indexOf(F.q.toLowerCase()) >= 0; });
    list.sort(function (a, b) { var va = a[F.sk], vb = b[F.sk]; if (typeof va === "string") return F.sd * va.localeCompare(vb); return F.sd * ((va == null ? -1 : va) - (vb == null ? -1 : vb)); });
    EX.uctable = function () { saveCSV("fipv-all-uc-table.csv", [UC_HEAD].concat(ucRows(groups))); };
    var h = "<div class=\"pf-tools\"><input class=\"pf-q\" id=\"pf-q\" placeholder=\"Search UC or tehsil\" value=\"" + esc(F.q) + "\" aria-label=\"Search UC\"><span class=\"pf-lab\" style=\"margin:0\">" + list.length + " UCs</span></div>";
    h += "<div class=\"pf-tw\" style=\"max-height:520px\"><table class=\"pf-t\"><thead><tr><th class=\"n\">#</th>";
    cols.forEach(function (c) { h += "<th class=\"" + c[2] + "\" data-sk=\"" + c[0] + "\">" + c[1] + (F.sk === c[0] ? (F.sd > 0 ? " ▲" : " ▼") : "") + "</th>"; });
    h += "</tr></thead><tbody>";
    list.forEach(function (x, i) {
      h += "<tr><td class=\"n\">" + (i + 1) + "</td><td class=\"u\">" + esc(x.uc) + "</td><td>" + esc(x.teh) + "</td>";
      h += "<td class=\"r\">" + nf(x.ipvT) + "</td><td class=\"r\">" + bmPill(x.ipvH) + "</td><td class=\"r\">" + bmPill(x.ipvA) + "</td><td class=\"r red\">" + nf(x.ipvM) + "</td>";
      h += "<td class=\"r\">" + nf(x.opvT) + "</td><td class=\"r\">" + bmPill(x.opvH) + "</td><td class=\"r\">" + bmPill(x.opvA) + "</td><td class=\"r red\">" + nf(x.opvM) + "</td></tr>";
    });
    if (!list.length) h += "<tr><td colspan=\"11\" class=\"pf-empty\">No UCs match.</td></tr>";
    return h + "</tbody></table></div>";
  }
  function tableCard(groups) {
    return "<section class=\"pf-c gl s12 pop\"><div class=\"pf-h\">All UCs in this selection<small>click a column to sort</small>" + dlBtn("uctable", "CSV") + "</div>" + ucTable(groups) + "</section>";
  }

  function header(rs, groups) {
    var d = options();
    var planned = TG.filter(function (t) { return (F.dist === "All" || t.dist === F.dist) && (F.teh === "All" || t.teh === F.teh); }).length;
    var upd = "";
    if (STAMP) { var s = STAMP.replace("T", " "); upd = s.slice(0, 16); }
    var sub = "Peshawar Division · " + (F.dist === "All" ? "all districts" : esc(F.dist)) + " · " + (F.day === "All" ? "all campaign days" : esc(dayLabel(F.day))) + (F.date === "All" ? "" : " · date " + esc(dateLabel(F.date))) +
      " · " + groups.length + " UCs reporting" + (planned ? " of " + planned + " planned" : "") + (upd ? " · updated " + esc(upd) : "");
    var bench = "<div class=\"pf-fl\"><label for=\"pf-bench\">Benchmark</label><select class=\"pf-sel\" id=\"pf-bench\">" +
      ["0.8", "0.85", "0.9", "0.95"].map(function (o) { return "<option value=\"" + o + "\"" + (+o === F.bench ? " selected" : "") + ">" + pc(+o, 0) + "</option>"; }).join("") + "</select></div>";
    var filters = sel2("pf-day", "Campaign day", d.days, F.day, "All days", function (x) { return "Day " + x; }) +
      sel2("pf-date", "Date", d.dates, F.date, "All dates", dateLabel) +
      sel2("pf-dist", "District", d.dists, F.dist, "All districts") +
      sel2("pf-teh", "Tehsil", d.tehs, F.teh, "All tehsils") +
      sel2("pf-uc", "UC", d.ucs, F.uc, "All UCs") +
      bench +
      "<button class=\"pf-reset\" id=\"pf-reset\" type=\"button\">Reset</button>" +
      "<button class=\"dlb\" id=\"pf-erm\" type=\"button\" title=\"Build the fIPV evening-review PowerPoint for the district, tehsil and day chosen above\">⬇ ERM PPT</button>";
    return "<div class=\"pf-top\"><div><div class=\"pf-eb\">Polio Booster Campaign · fIPV &amp; OPV</div><h2>Peshawar Block Daily Sitrep</h2><p class=\"pf-sub\">" + sub + "</p></div><div class=\"pf-fil\">" + filters + "</div></div>";
  }

  function draw(root) {
    var rs = ROWS.filter(function (r) { return okRow(r, F); });
    var withCud = F.day === "All" && F.date === "All";
    var cs = withCud ? CUD.filter(function (r) { return okRow(r, F); }) : [];
    var m = metrics(rs, cs, withCud);
    var groups = ucGroups(rs, cs, withCud);
    EX = {};
    EX.all = function () { saveCSV("fipv-" + (F.dist === "All" ? "all-districts" : F.dist.toLowerCase()) + "-uc-data.csv", [UC_HEAD].concat(ucRows(groups))); };
    var html = "<div class=\"pf\" id=\"fipv-root\">" + header(rs, groups) +
      "<div class=\"pf-grid\">" +
      sitCard("ipv", m, "fIPV", "#2F5BD3", "t-blue") + sitCard("opv", m, "OPV", "#7C3AED", "t-lilac") +
      cmpCard(m) + otherCard(m) +
      mapCard(groups) +
      "<div class=\"s5\" style=\"display:flex;flex-direction:column;gap:16px;min-width:0\">" + missCard(groups, "ipv", "fIPV", "#B42318") + missCard(groups, "opv", "OPV", "#B42318") + "</div>" +
      dailyCard("s8") + districtCard("s4") +
      rankCard(groups) +
      tableCard(groups) +
      "</div>" +
      "<div class=\"pf-foot\"><img src=\"assets/logo-pei.jpg\" alt=\"Pakistan Polio Eradication Programme\" width=\"120\" height=\"44\"><span>Source: <b>District Emergency Operation Center, Peshawar</b></span><span class=\"pf-lab\" style=\"margin:0\">Figures update automatically when the fIPV workbook is saved. Benchmark " + pc(F.bench, 0) + ": at or above = light green, below = dark red.</span></div>" +
      "</div>";
    root.innerHTML = html;
    wire(root);
    animate(root);
  }

  function wire(root) {
    function onSel(id, key, reset) {
      var el = $("#" + id, root); if (!el) return;
      el.addEventListener("change", function () {
        F[key] = el.value;
        if (reset) reset.forEach(function (k) { F[k] = "All"; });
        if (key === "dist") { F.teh = "All"; F.uc = "All"; }
        if (key === "teh") { F.uc = "All"; }
        draw(root);
      });
    }
    onSel("pf-day", "day", ["date"]); onSel("pf-date", "date", ["day"]); onSel("pf-dist", "dist"); onSel("pf-teh", "teh"); onSel("pf-uc", "uc");
    var bn = $("#pf-bench", root);
    if (bn) bn.addEventListener("change", function () { F.bench = parseFloat(bn.value) || 0.9; draw(root); });
    var rs = $("#pf-reset", root);
    if (rs) rs.addEventListener("click", function () { F.day = "All"; F.date = "All"; F.dist = "All"; F.teh = "All"; F.uc = "All"; F.q = ""; draw(root); });
    var em = $("#pf-erm", root); if (em) em.addEventListener("click", function () { ermDeck(em); });
    var mp = $("#pf-map", root); if (mp) mp.addEventListener("change", function () { F.map = mp.value; draw(root); });
    var cu = $("#pf-clearuc", root); if (cu) cu.addEventListener("click", function () { F.uc = "All"; draw(root); });
    Array.prototype.forEach.call(root.querySelectorAll(".dlb"), function (b) {
      b.addEventListener("click", function () { var f = EX[b.getAttribute("data-ex")]; if (f) f(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll(".pf-seg button"), function (b) {
      b.addEventListener("click", function () { F.rank = b.getAttribute("data-rank"); draw(root); });
    });
    Array.prototype.forEach.call(root.querySelectorAll(".pf-map path[data-tip]"), function (p) {
      p.addEventListener("mousemove", function (ev) { if (window.showTip) window.showTip(ev, p.getAttribute("data-tip")); });
      p.addEventListener("mouseleave", function () { if (window.hideTip) window.hideTip(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("path[data-n]"), function (p) {
      if (p.hasAttribute("data-none")) return;
      p.addEventListener("click", function () { F.dist = p.getAttribute("data-d"); F.teh = p.getAttribute("data-t") || "All"; F.uc = p.getAttribute("data-n"); draw(root); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("tr[data-uc]"), function (tr) {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", function () { F.dist = tr.getAttribute("data-d"); F.teh = tr.getAttribute("data-t"); F.uc = tr.getAttribute("data-uc"); draw(root); });
    });
    Array.prototype.forEach.call(root.querySelectorAll("th[data-sk]"), function (th) {
      th.addEventListener("click", function () { var k = th.getAttribute("data-sk"); F.sd = (F.sk === k) ? -F.sd : (k === "uc" || k === "teh" ? 1 : -1); F.sk = k; draw(root); });
    });
    var q = $("#pf-q", root);
    if (q) { q.addEventListener("input", function () { F.q = q.value; var pos = q.selectionStart; draw(root); var nq = $("#pf-q", root); if (nq) { nq.focus(); nq.setSelectionRange(pos, pos); } }); }
  }

  function animate(root) {
    var off = MOTION_OFF();
    var els = root.querySelectorAll("[data-count]");
    Array.prototype.forEach.call(els, function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var fmt = el.getAttribute("data-fmt");
      if (!isFinite(to) || off) { el.textContent = fmt === "p" ? pc(to / 100) : nf(to); return; }
      var t0 = null, dur = 1100;
      function step(ts) {
        if (t0 == null) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = to * e;
        el.textContent = fmt === "p" ? v.toFixed(1) + "%" : nf(v);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    if (off) return;
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(root.querySelectorAll(".pf-fill"), function (f) { f.style.width = f.getAttribute("data-w") + "%"; });
      Array.prototype.forEach.call(root.querySelectorAll("circle.fg"), function (c) { c.setAttribute("stroke-dasharray", (c.getAttribute("data-v") || 0) + " 100"); });
      Array.prototype.forEach.call(root.querySelectorAll(".colb,.ln,.pt"), function (c) { c.classList.add("in"); });
    });
  }

  function mount(root) {
    if (!root) return;
    var page = document.getElementById("page");
    root.innerHTML = "<div class=\"pf-load\">Loading fIPV &amp; OPV data…</div>";
    load().then(function () {
      if (page !== root || !document.body.contains(root)) return;
      if (!$("#pf-css-fipv")) { var st = document.createElement("style"); st.id = "pf-css-fipv"; st.textContent = CSS; document.head.appendChild(st); }
      if (!ROWS.length) { root.innerHTML = "<div class=\"pf-empty\">No fIPV data has been exported yet. Save the fIPV workbook to publish it.</div>"; return; }
      draw(root);
    }).catch(function (e) {
      if (page !== root) return;
      root.innerHTML = "<div class=\"pf-empty\"><b>The Polio Booster data could not be loaded.</b><br>" + esc(e.message) + "</div>";
    });
  }

  window.FIPV = { mount: mount };
})();
