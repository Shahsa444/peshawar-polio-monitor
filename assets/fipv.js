/* Polio Booster Campaign (fIPV & OPV) page. Loaded only when the page is opened.
   Data: data/fipv_rows.csv, data/fipv_cud.csv, data/fipv_targets.csv (exported from the fIPV workbook on save).
   The sums follow the workbook's Calc sheet: catch-up rows are added only when Day = All. */
(function () {
  "use strict";
  var DATA = { rows: "data/fipv_rows.csv", cud: "data/fipv_cud.csv", tg: "data/fipv_targets.csv", upd: "data/fipv.updated.txt", geo: "data/geo.json" };
  var ROWS = null, CUD = [], TG = [], GEO = null, STAMP = "", LOADING = null;
  var F = { day: "All", dist: "All", teh: "All", uc: "All", map: "ipv_hh", rank: "missed", vac: "ipv", q: "", sk: "missed", sd: -1 };
  var MOTION_OFF = function () { return document.documentElement.classList.contains("motion-off"); };

  var CSS = [
    ".pf{color:#14213D;font-family:var(--body);background:#F4F7FC;border-radius:28px;padding:clamp(14px,2vw,24px);border:1px solid #E2E8F3;}",
    ".pf h1,.pf h2,.pf h3{color:#14213D}",
    ".pf *{box-sizing:border-box}",
    ".pf-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin:6px 0 16px}",
    ".pf-top h2{margin:0;font-size:clamp(24px,2.6vw,32px);font-weight:760;letter-spacing:-.03em;line-height:1.1}",
    ".pf-top h2 em{font-style:normal;color:#1F6FD1}",
    ".pf-sub{margin:6px 0 0;color:#5A6A85;font-size:13.5px}",
    ".pf-fil{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}",
    ".pf-fl{display:flex;flex-direction:column;gap:4px;min-width:140px}",
    ".pf-fl label{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#5A6A85}",
    ".pf-sel,.pf-q{appearance:none;-webkit-appearance:none;border:1px solid #DCE2EE;border-radius:14px;padding:10px 34px 10px 13px;background:#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236B7280' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 12px center;font:inherit;font-weight:600;font-size:14px;color:#14213D;box-shadow:0 1px 2px rgba(20,30,60,.05);cursor:pointer}",
    ".pf-sel:disabled{opacity:.55;cursor:not-allowed}",
    ".pf-q{background:#fff;padding:10px 13px;min-width:200px;cursor:text}",
    ".pf-reset{border:0;background:none;color:#1F6FD1;font-weight:650;font:inherit;font-size:13px;cursor:pointer;padding:10px 4px}",
    ".pf-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}",
    ".pf-c{background:#fff;border:1px solid #E4E8F1;border-radius:22px;padding:18px 18px 16px;box-shadow:0 1px 2px rgba(20,30,60,.04),0 16px 34px -26px rgba(20,30,60,.38);min-width:0;position:relative;overflow:hidden}",
    ".s12{grid-column:span 12}.s8{grid-column:span 8}.s6{grid-column:span 6}.s4{grid-column:span 4}",
    ".pf-vac{background:linear-gradient(180deg,#F1F4FB,#EBEFF8)}",
    ".pf-cmp{background:linear-gradient(180deg,#FFFBEA,#FFF5D6);border-color:#F2E2A6}",
    ".pf-oth{background:linear-gradient(180deg,#F0FAF4,#E6F5EC);border-color:#C4E8D2}",
    ".pf-h{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:16px;font-weight:750;letter-spacing:-.01em}",
    ".pf-h small{font-size:12px;font-weight:600;color:#5A6A85;margin-left:auto}",
    ".pf-dot{width:11px;height:11px;border-radius:50%;display:inline-block;flex:none}",
    ".pf-hero{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}",
    ".pf-big{font-size:clamp(26px,3vw,36px);font-weight:780;letter-spacing:-.035em;font-variant-numeric:tabular-nums;line-height:1}",
    ".pf-lab{font-size:12px;color:#5A6A85;font-weight:600;margin-top:6px}",
    ".pf-kp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}",
    ".pf-k{background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);border-radius:16px;padding:10px 11px}",
    ".pf-k b{display:block;font-size:19px;font-weight:750;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
    ".pf-k span{display:block;font-size:11.5px;color:#5A6A85;font-weight:600}",
    ".pf-k em{font-style:normal;font-size:12px;font-weight:700}",
    ".red{color:#E5484D}.grn{color:#2E9E5B}.blu{color:#1F6FD1}.amb{color:#C98A0B}",
    ".pf-bars{display:grid;gap:10px;margin-top:14px}",
    ".pf-br{display:grid;grid-template-columns:118px 1fr 58px;align-items:center;gap:10px;font-size:12.5px;font-weight:600}",
    ".pf-br b{font-variant-numeric:tabular-nums;text-align:right}",
    ".pf-track{height:10px;border-radius:99px;background:rgba(20,30,60,.08);overflow:hidden}",
    ".pf-fill{height:100%;width:0;border-radius:99px;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}",
    ".pf-ring{display:flex;align-items:center;gap:16px}",
    ".pf-ring svg{width:112px;height:112px;flex:none}",
    ".pf-ring circle.bg{stroke:rgba(20,30,60,.08)}",
    ".pf-ring circle.fg{transition:stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1);stroke-linecap:round}",
    ".pf-ring text{font-weight:760;font-size:17px;fill:#14213D;font-variant-numeric:tabular-nums}",
    ".pf-ring .rs{font-size:9px;font-weight:600;fill:#5A6A85}",
    ".pf-mini{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
    ".pf-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
    ".pf-two h4{margin:0 0 8px;font-size:13px;font-weight:750;text-align:center;color:#34435E}",
    ".pf-cell{background:rgba(255,255,255,.75);border-radius:16px;padding:10px 12px;text-align:left}",
    ".pf-cell span{display:block;font-size:11.5px;color:#5A6A85;font-weight:600}",
    ".pf-cell b{display:block;font-size:21px;font-weight:760;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
    ".pf-cell i{font-style:normal;font-size:12px;font-weight:700;margin-left:6px}",
    ".pf-mapw{position:relative}",
    ".pf-map{width:100%;height:auto;display:block;max-height:520px}",
    ".pf-map path{transition:fill .8s ease}",
    ".pf-map .u{stroke:#FFFFFF}",
    ".pf .legend,.pf-mapw + .legend{color:#5A6A85}",
    ".pf-leg{display:flex;align-items:center;gap:10px;font-size:12px;color:#5A6A85;font-weight:600;margin-top:10px;flex-wrap:wrap}",
    ".pf-bar-leg{height:10px;width:200px;border-radius:99px;background:linear-gradient(90deg,#E5484D,#F5B52E,#2E9E5B)}",
    ".pf-seg{display:inline-flex;background:#EEF1F7;border-radius:14px;padding:3px;gap:2px;flex-wrap:wrap}",
    ".pf-seg button{border:0;background:transparent;border-radius:11px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:650;color:#34435E;cursor:pointer}",
    ".pf-seg button[aria-pressed=true]{background:#fff;color:#1F6FD1;box-shadow:0 2px 6px -3px rgba(20,30,60,.35)}",
    ".pf-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}",
    ".pf-tw{overflow:auto;max-height:430px;border-radius:14px}",
    ".pf-t{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}",
    ".pf-t th{position:sticky;top:0;background:#fff;text-align:left;font-size:10.5px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:#5A6A85;padding:9px 8px;border-bottom:2px solid #CDEBD7;z-index:1;cursor:pointer;white-space:nowrap}",
    ".pf-t th.r,.pf-t td.r{text-align:right}",
    ".pf-t td{padding:8px 8px;border-bottom:1px solid #E7F3EB;white-space:nowrap}",
    ".pf-t td.n{color:#5A6A85;width:34px}",
    ".pf-t td.u{font-weight:650;max-width:200px;overflow:hidden;text-overflow:ellipsis}",
    ".pf-t tr:hover td{background:#F5FBF7}",
    ".pf-t td.red{font-weight:700}",
    ".pf-tb{width:90px}.pf-tb .pf-track{height:7px}",
    ".pf-empty{padding:26px;text-align:center;color:#5A6A85;font-weight:600}",
    ".pf-foot{display:flex;align-items:center;gap:14px;margin-top:16px;color:#34435E;font-size:13px;flex-wrap:wrap}",
    ".pf-foot img{height:44px;width:auto;border-radius:6px}",
    ".pf-foot b{color:#E5484D}",
    ".pf-day{display:flex;flex-direction:column;gap:6px}",
    ".pf-chart{width:100%;height:auto;display:block}",
    ".pf-chart .colb{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);transition:transform 1s cubic-bezier(.2,.8,.2,1)}",
    ".pf-chart .colb.in{transform:scaleY(1)}",
    ".pf-chart .ln{stroke-dasharray:var(--len,800);stroke-dashoffset:var(--len,800);transition:stroke-dashoffset 1.6s ease .3s}",
    ".pf-chart .ln.in{stroke-dashoffset:0}",
    ".pf-chart .pt{opacity:0;transition:opacity .4s ease 1.2s}",
    ".pf-chart .pt.in{opacity:1}",
    ".pf-float{position:absolute;right:14px;top:10px;width:46px;height:46px;opacity:.9;animation:pfBob 3.6s ease-in-out infinite;pointer-events:none}",
    "@keyframes pfBob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-7px) rotate(4deg)}}",
    "@keyframes pfPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}",
    ".pf-c.pop{animation:pfPop .5s cubic-bezier(.2,.8,.2,1) both}",
    ".pf-load{padding:40px;text-align:center;color:#5A6A85;font-weight:600}",
    "@media (max-width:1100px){.s8,.s6,.s4{grid-column:span 12}.pf-two{grid-template-columns:1fr}}",
    "@media (max-width:640px){.pf-kp{grid-template-columns:1fr 1fr}.pf-fl{min-width:44%;flex:1}.pf-sel{width:100%}.pf-q{min-width:0;width:100%}.pf-ring svg{width:92px;height:92px}.pf-br{grid-template-columns:90px 1fr 50px}}"
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
    return (f.day === "All" || r.dayN === f.day) && (f.dist === "All" || r.dist === f.dist) &&
           (f.teh === "All" || r.teh === f.teh) && (f.uc === "All" || r.uc === f.uc);
  }
  function uniq(a) { return a.filter(function (v, i, s) { return v && s.indexOf(v) === i; }).sort(); }
  function options() {
    var days = uniq(ROWS.map(function (r) { return r.dayN; })).filter(function (d) { return d !== "0"; })
      .sort(function (a, b) { return a - b; });
    var dists = uniq(ROWS.map(function (r) { return r.dist; }));
    var tehs = uniq(ROWS.filter(function (r) { return F.dist === "All" || r.dist === F.dist; }).map(function (r) { return r.teh; }));
    var ucs = uniq(ROWS.filter(function (r) { return (F.dist === "All" || r.dist === F.dist) && (F.teh === "All" || r.teh === F.teh); }).map(function (r) { return r.uc; }));
    return { days: days, dists: dists, tehs: tehs, ucs: ucs };
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
        covNAPct: div(covNA, recNA), covREFPct: div(covREF, recREF)
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
  function rampColor(t, invert) {
    t = clamp(t); if (invert) t = 1 - t;
    var stops = [[0, [229, 72, 77]], [0.5, [245, 181, 46]], [1, [46, 158, 91]]];
    var a = stops[0], b = stops[1];
    for (var i = 1; i < stops.length; i++) { if (t <= stops[i][0]) { a = stops[i - 1]; b = stops[i]; break; } }
    var k = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
    var c = [0, 1, 2].map(function (j) { return Math.round(a[1][j] + (b[1][j] - a[1][j]) * k); });
    return "rgb(" + c.join(",") + ")";
  }
  var MAPM = {
    ipv_hh: { t: "IPV HH coverage", inv: false, scale: 1, f: function (m) { return m.ipv.hhPct; } },
    ipv_adm: { t: "IPV admin coverage", inv: false, scale: 1, f: function (m) { return m.ipv.admPct; } },
    ipv_miss: { t: "IPV still missed", inv: true, scale: 0.5, f: function (m) { return m.ipv.missPct; } },
    opv_hh: { t: "OPV HH coverage", inv: false, scale: 1, f: function (m) { return m.opv.hhPct; } },
    opv_adm: { t: "OPV admin coverage", inv: false, scale: 1, f: function (m) { return m.opv.admPct; } },
    opv_miss: { t: "OPV still missed", inv: true, scale: 0.5, f: function (m) { return m.opv.missPct; } }
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
    // colour bands are quartiles of the UCs in view, so the map always uses the full palette
    var vals = [];
    GEO.forEach(function (f) {
      var g = byKey[f.n + "|" + f.d];
      var v = g ? M.f(g.m) : null;
      if (inScope(f) && v != null && isFinite(v) && v > 0) vals.push(v);
    });
    vals.sort(function (a, b) { return a - b; });
    var qt = function (p) { return vals[Math.min(vals.length - 1, Math.floor(p * vals.length))]; };
    var breaks = vals.length ? [qt(0.25), qt(0.5), qt(0.75)] : [];
    var band = function (v) { var b = 0; while (b < breaks.length && v > breaks[b]) b++; return Math.min(4, b + 1); };
    var paths = GEO.map(function (f) {
      var g = byKey[f.n + "|" + f.d];
      var v = g ? M.f(g.m) : null;
      var has = v != null && isFinite(v);
      var inView = inScope(f);
      var sel = F.uc !== "All" && f.n === F.uc && f.d === F.dist;
      var fill, cls = "u";
      if (!inView) { fill = "#EBE9F1"; cls += " o"; }
      else if (!has) { fill = "#DDD9E6"; cls += " o"; }
      else { fill = v <= 0 ? "#EEE7FA" : ["#D2BFF1", "#AC8BE0", "#8157C6", "#4F2A92"][band(v) - 1]; }
      if (sel) cls += " sel";
      var tip = "<h4>" + esc(f.n) + "</h4><div class=\"w\">" + esc(f.t ? f.t + " · " : "") + esc(f.d) + "</div>" +
        (has ? "<div class=\"w\">" + esc(M.t) + ": <b>" + pc(v) + "</b></div>" : "<div class=\"w\">No data for this selection</div>");
      return "<path class=\"" + cls + "\" fill=\"" + fill + "\" d=\"" + ringPath(f.r) + "\" data-d=\"" + esc(f.d) + "\" data-t=\"" + esc(f.t || "") + "\" data-n=\"" + esc(f.n) + "\" data-tip=\"" + esc(tip) + "\"" + (g ? "" : " data-none=\"1\"") + "></path>";
    }).join("");
    var lg = function (c, t) { return "<span class=\"lg\"><span class=\"sw\" style=\"background:" + c + "\"></span>" + t + "</span>"; };
    var leg = "<div class=\"legend\">" + lg("#EEE7FA", "0%");
    if (breaks.length === 3) {
      leg += lg("#D2BFF1", "up to " + pc(breaks[0], 0)) +
        lg("#AC8BE0", pc(breaks[0], 0) + "–" + pc(breaks[1], 0)) +
        lg("#8157C6", pc(breaks[1], 0) + "–" + pc(breaks[2], 0)) +
        lg("#4F2A92", "above " + pc(breaks[2], 0));
    }
    leg += lg("#DDD9E6", "No data") + (hasAny ? "" : "<span class=\"note\">no UC data for this selection yet</span>") + "</div>";
    return "<div class=\"pf-mapw\"><svg class=\"msvg pf-map\" viewBox=\"" + vb.map(function (x) { return x.toFixed(2); }).join(" ") + "\" role=\"img\" aria-label=\"UC coverage map\">" + paths + "</svg></div>" + leg;
  }

  /* ---- small pieces ---- */
  function kpi(label, val, sub, cls) {
    return "<div class=\"pf-k\"><span>" + label + "</span><b class=\"" + (cls || "") + "\" data-count=\"" + (val == null ? "" : Math.round(val)) + "\" data-fmt=\"n\">" + (val == null ? "–" : nf(val)) + "</b>" + (sub ? "<em class=\"" + (sub.c || "") + "\">" + esc(sub.t) + "</em>" : "") + "</div>";
  }
  function pctKpi(label, p, cls) {
    return "<div class=\"pf-k\"><span>" + label + "</span><b class=\"" + (cls || "") + "\" data-count=\"" + (p == null ? "" : (p * 100).toFixed(1)) + "\" data-fmt=\"p\">" + pc(p) + "</b></div>";
  }
  function ring(p, color, label, sub) {
    var v = p == null ? 0 : clamp(p) * 100;
    return "<div class=\"pf-ring\"><svg viewBox=\"0 0 120 120\" aria-hidden=\"true\"><circle class=\"bg\" cx=\"60\" cy=\"60\" r=\"48\" fill=\"none\" stroke-width=\"12\"/>" +
      "<circle class=\"fg\" data-v=\"" + v.toFixed(2) + "\" cx=\"60\" cy=\"60\" r=\"48\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"12\" pathLength=\"100\" stroke-dasharray=\"0 100\" transform=\"rotate(-90 60 60)\"/>" +
      "<text x=\"60\" y=\"62\" text-anchor=\"middle\" data-count=\"" + (p == null ? "" : (p * 100).toFixed(1)) + "\" data-fmt=\"p\">" + pc(p) + "</text>" +
      "<text class=\"rs\" x=\"60\" y=\"78\" text-anchor=\"middle\">" + esc(sub || "") + "</text></svg><div><div class=\"pf-lab\" style=\"margin:0\">" + esc(label) + "</div></div></div>";
  }
  function bar(label, p, color, val) {
    var w = p == null ? 0 : clamp(p) * 100;
    return "<div class=\"pf-br\"><span>" + esc(label) + "</span><div class=\"pf-track\"><div class=\"pf-fill\" data-w=\"" + w.toFixed(2) + "\" style=\"background:" + color + "\"></div></div><b>" + pc(p) + "</b></div>";
  }
  function fl(id, label, opts, val, all, labelFn) {
    var h = "<div class=\"pf-fl\"><label for=\"" + id + "\">" + label + "</label><select class=\"pf-sel\" id=\"" + id + "\">";
    h += "<option value=\"All\"" + (val === "All" ? " selected" : "") + ">" + all + "</option>";
    opts.forEach(function (o) { h += "<option value=\"" + esc(o) + "\"" + (String(val) === String(o) ? " selected" : "") + ">" + esc(labelFn ? labelFn(o) : o) + "</option>"; });
    return h + "</select></div>";
  }

  /* ---- sections ---- */
  function vacCard(v, m, title, color, soft) {
    var x = m[v];
    var hh = x.hhPct, adm = x.admPct;
    return "<section class=\"pf-c pf-vac s6 pop\" style=\"--c:" + color + "\">" +
      "<div class=\"pf-h\"><span class=\"pf-dot\" style=\"background:" + color + "\"></span>" + title + "<small>" + nf(x.target) + " children recorded</small></div>" +
      "<div class=\"pf-hero\"><div><div class=\"pf-lab\" style=\"margin:0 0 4px\">HH target</div><div class=\"pf-big\" data-count=\"" + Math.round(x.target) + "\" data-fmt=\"n\">" + nf(x.target) + "</div></div>" +
      ring(adm, color, "Admin coverage", pc(adm, 1)) + "</div>" +
      "<div class=\"pf-kp\">" +
      kpi("Admin coverage", x.admin, { t: pc(adm), c: "blu" }, "blu") +
      kpi("HH coverage", x.hh, { t: pc(hh), c: "grn" }, "") +
      kpi("Still missed", x.missed, { t: pc(x.missPct), c: "red" }, "red") +
      "</div>" +
      "<div class=\"pf-bars\">" + bar("Still NA", x.stNAPct, "#F5A524") + bar("Still refusal", x.stREFPct, "#E5484D") + bar("Unregistered", div(x.unreg, x.target), "#1F6FD1") + "</div>" +
      "</section>";
  }
  function cmpCard(m) {
    function col(v, title) {
      var x = m[v];
      return "<div><h4>" + title + "</h4><div class=\"pf-mini\">" +
        "<div class=\"pf-cell\"><span>Rec NA</span><b class=\"red\" data-count=\"" + Math.round(x.recNA) + "\" data-fmt=\"n\">" + nf(x.recNA) + "</b><i class=\"red\">" + pc(x.recNAPct, 0) + "</i></div>" +
        "<div class=\"pf-cell\"><span>Cov NA</span><b class=\"blu\" data-count=\"" + Math.round(x.covNA) + "\" data-fmt=\"n\">" + nf(x.covNA) + "</b><i class=\"blu\">" + pc(x.covNAPct, 0) + "</i></div>" +
        "<div class=\"pf-cell\"><span>Rec REF</span><b class=\"red\" data-count=\"" + Math.round(x.recREF) + "\" data-fmt=\"n\">" + nf(x.recREF) + "</b><i class=\"red\">" + pc(x.recREFPct, 0) + "</i></div>" +
        "<div class=\"pf-cell\"><span>Cov REF</span><b class=\"blu\" data-count=\"" + Math.round(x.covREF) + "\" data-fmt=\"n\">" + nf(x.covREF) + "</b><i class=\"blu\">" + pc(x.covREFPct, 0) + "</i></div>" +
        "</div></div>";
    }
    return "<section class=\"pf-c pf-cmp s4 pop\"><div class=\"pf-h\">Missed children comparison</div><div class=\"pf-two\">" + col("ipv", "fIPV") + col("opv", "OPV") + "</div>" +
      "<div class=\"pf-lab\" style=\"margin-top:12px\">Rec = children recorded as not vaccinated (NA = not at home, REF = refused). Cov = those later covered. Rec % is of the HH target, Cov % is of Rec.</div></section>";
  }
  function otherCard(m) {
    var ip = div(m.ipv.school, m.ipv.target), op = div(m.opv.school, m.opv.target);
    return "<section class=\"pf-c pf-oth s4 pop\"><div class=\"pf-h\">Other coverages · school</div>" +
      "<div class=\"pf-two\">" +
      "<div style=\"text-align:center\">" + ring(ip, "#2E9E5B", "fIPV school", "") + "</div>" +
      "<div style=\"text-align:center\">" + ring(op, "#1F6FD1", "OPV school", "") + "</div></div>" +
      "<div class=\"pf-mini\" style=\"margin-top:12px\">" +
      "<div class=\"pf-cell\"><span>fIPV school covered</span><b class=\"blu\" data-count=\"" + Math.round(m.ipv.school) + "\" data-fmt=\"n\">" + nf(m.ipv.school) + "</b></div>" +
      "<div class=\"pf-cell\"><span>OPV school covered</span><b class=\"blu\" data-count=\"" + Math.round(m.opv.school) + "\" data-fmt=\"n\">" + nf(m.opv.school) + "</b></div></div></section>";
  }
  function dailyCard() {
    var days = uniq(ROWS.map(function (r) { return r.dayN; })).filter(function (d) { return d !== "0"; }).sort(function (a, b) { return a - b; });
    var W = 640, H = 230, padL = 36, padB = 34, padT = 14;
    if (!days.length) return "<section class=\"pf-c s12 pop\"><div class=\"pf-h\">Daily progress</div><div class=\"pf-empty\">No campaign days yet.</div></section>";
    var rows = ROWS.filter(function (r) { return (F.dist === "All" || r.dist === F.dist) && (F.teh === "All" || r.teh === F.teh) && (F.uc === "All" || r.uc === F.uc); });
    var per = days.map(function (d) {
      var rs = rows.filter(function (r) { return r.dayN === d; });
      var m = metrics(rs, [], false);
      return { d: d, adm: m.ipv.admin, tgt: m.ipv.target };
    });
    var cum = 0, cumT = 0;
    per.forEach(function (p) { cum += p.adm; cumT += p.tgt; p.cumPct = div(cum, cumT); });
    var maxA = Math.max.apply(null, per.map(function (p) { return p.adm; }).concat([1]));
    var n = per.length, slot = (W - padL - 10) / n, bw = Math.min(70, slot * 0.55);
    var bars = "", pts = "", dots = "";
    per.forEach(function (p, i) {
      var cx = padL + slot * i + slot / 2, h = (p.adm / maxA) * (H - padT - padB);
      var y = H - padB - h;
      bars += "<rect class=\"colb\" style=\"transition-delay:" + (i * 120) + "ms\" x=\"" + (cx - bw / 2) + "\" y=\"" + y + "\" width=\"" + bw + "\" height=\"" + h + "\" rx=\"10\" fill=\"#8EB8F0\"><title>Day " + p.d + ": " + nf(p.adm) + " admin covered</title></rect>";
      bars = bars.replace("\"colb\"", "\"colb\"");
      var py = padT + (1 - clamp(p.cumPct || 0)) * (H - padT - padB);
      pts += (i ? " " : "") + cx.toFixed(1) + "," + py.toFixed(1);
      dots += "<circle class=\"pt\" style=\"transition-delay:" + (1200 + i * 150) + "ms\" cx=\"" + cx.toFixed(1) + "\" cy=\"" + py.toFixed(1) + "\" r=\"6\" fill=\"#2E9E5B\" stroke=\"#fff\" stroke-width=\"2\"/>";
      bars += "<text x=\"" + cx.toFixed(1) + "\" y=\"" + (H - 12) + "\" text-anchor=\"middle\" font-size=\"12\" fill=\"#6B7280\" font-weight=\"600\">Day " + p.d + "</text>";
    });
    var grid = "";
    [0, 0.5, 1].forEach(function (g) { var y = padT + (1 - g) * (H - padT - padB); grid += "<line x1=\"" + padL + "\" x2=\"" + (W - 6) + "\" y1=\"" + y + "\" y2=\"" + y + "\" stroke=\"#E7EAF2\" stroke-dasharray=\"4 5\"/><text x=\"" + (padL - 6) + "\" y=\"" + (y + 4) + "\" text-anchor=\"end\" font-size=\"11\" fill=\"#9AA3B5\">" + (g * 100) + "%</text>"; });
    var len = 900;
    return "<section class=\"pf-c s12 pop\"><div class=\"pf-h\">Daily progress<small>bars = admin covered per day · line = cumulative % of HH target (fIPV)</small></div>" +
      "<svg class=\"pf-chart\" viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"Daily progress chart\">" + grid + bars +
      "<polyline class=\"ln\" style=\"--len:" + len + "\" fill=\"none\" stroke=\"#2E9E5B\" stroke-width=\"3.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\" points=\"" + pts + "\"/>" + dots + "</svg>" +
      "<div class=\"pf-lab\">Campaign days so far: " + n + ". Catch-up rows are added to the totals only on the All-days view, as in the workbook.</div></section>";
  }
  function districtCard() {
    var rows = ROWS.filter(function (r) { return F.day === "All" || r.dayN === F.day; });
    var ds = uniq(rows.map(function (r) { return r.dist; }));
    var html = "";
    ds.forEach(function (d) {
      var m = metrics(rows.filter(function (r) { return r.dist === d; }), [], false);
      var cs = CUD.filter(function (r) { return r.dist === d && (F.day === "All"); });
      var mm = metrics(rows.filter(function (r) { return r.dist === d; }), cs, F.day === "All");
      html += "<div class=\"pf-day\" style=\"margin-bottom:14px\"><div class=\"pf-lab\" style=\"margin:0 0 6px;color:#14213D;font-weight:750;font-size:13.5px\">" + esc(d.charAt(0) + d.slice(1).toLowerCase()) + "</div>" +
        "<div class=\"pf-bars\" style=\"margin-top:0\">" + bar("fIPV admin", mm.ipv.admPct, "#1F6FD1") + bar("OPV admin", mm.opv.admPct, "#2E9E5B") + bar("fIPV still missed", mm.ipv.missPct, "#E5484D") + bar("OPV still missed", mm.opv.missPct, "#F5A524") + "</div></div>";
    });
    return "<section class=\"pf-c s4 pop\"><div class=\"pf-h\">District comparison</div>" + (html || "<div class=\"pf-empty\">No data.</div>") + "</section>";
  }
  function mapCard(groups) {
    var opts = Object.keys(MAPM).map(function (k) { return "<option value=\"" + k + "\"" + (F.map === k ? " selected" : "") + ">" + MAPM[k].t + "</option>"; }).join("");
    return "<section class=\"pf-c s8 pop\"><div class=\"pf-h\">UC coverage map<small>click a UC to focus it</small></div>" +
      "<div class=\"pf-tools\"><select class=\"pf-sel\" id=\"pf-map\" aria-label=\"Map metric\">" + opts + "</select>" +
      (F.uc !== "All" ? "<button class=\"pf-reset\" id=\"pf-clearuc\">Clear UC</button>" : "") + "</div>" +
      mapHTML(groups) + "</section>";
  }
  var RANKS = {
    missed: { t: "Most children missed", f: function (x) { return x.missed; }, fmt: "n" },
    na: { t: "Most still NA", f: function (x) { return x.stNA; }, fmt: "n" },
    ref: { t: "Most refusals", f: function (x) { return x.stREF; }, fmt: "n" },
    lowhh: { t: "Lowest HH coverage", f: function (x) { return x.hhPct == null ? 9 : -x.hhPct; }, fmt: "p" }
  };
  function rankTable(groups, v, rank) {
    var R = RANKS[rank];
    var list = groups.map(function (g) { var x = g.m[v]; return { uc: g.uc, teh: g.teh, dist: g.dist, target: x.target, hhPct: x.hhPct, missed: x.missed, stNA: x.stNA, stREF: x.stREF, stNAPct: x.stNAPct, missPct: x.missPct, val: R.f(x) }; })
      .filter(function (x) { return x.target > 0; });
    if (rank === "lowhh") list.sort(function (a, b) { return a.val - b.val; }); else list.sort(function (a, b) { return b.val - a.val; });
    list = list.slice(0, 15);
    var max = list.length ? Math.max.apply(null, list.map(function (x) { return Math.abs(x.val); })) || 1 : 1;
    if (!list.length) return "<div class=\"pf-empty\">No UCs reporting for this selection.</div>";
    var h = "<div class=\"pf-tw\"><table class=\"pf-t\"><thead><tr><th>#</th><th>UC</th><th class=\"r\">" + (rank === "lowhh" ? "HH cov" : "Still") + "</th><th></th></tr></thead><tbody>";
    list.forEach(function (x, i) {
      var shown = rank === "lowhh" ? pc(x.hhPct) : (rank === "missed" ? nf(x.missed) : rank === "na" ? nf(x.stNA) : nf(x.stREF));
      var bw = rank === "lowhh" ? clamp(x.hhPct || 0) * 100 : clamp(Math.abs(x.val) / max) * 100;
      h += "<tr data-uc=\"" + esc(x.uc) + "\" data-d=\"" + esc(x.dist) + "\" data-t=\"" + esc(x.teh) + "\"><td class=\"n\">" + (i + 1) + "</td><td class=\"u\" title=\"" + esc(x.teh) + "\">" + esc(x.uc) + "</td><td class=\"r " + (rank === "lowhh" ? "" : "red") + "\">" + shown + "</td><td class=\"pf-tb\"><div class=\"pf-track\"><div class=\"pf-fill\" data-w=\"" + bw.toFixed(1) + "\" style=\"background:" + (rank === "lowhh" ? "#2E9E5B" : "#E5484D") + "\"></div></div></td></tr>";
    });
    return h + "</tbody></table></div>";
  }
  function rankCard(groups) {
    var seg = Object.keys(RANKS).map(function (k) { return "<button type=\"button\" data-rank=\"" + k + "\" aria-pressed=\"" + (F.rank === k) + "\">" + RANKS[k].t + "</button>"; }).join("");
    return "<section class=\"pf-c s12 pop\"><div class=\"pf-h\">UC rankings<small>top 15 UCs in the current selection</small></div>" +
      "<div class=\"pf-tools\"><div class=\"pf-seg\">" + seg + "</div></div>" +
      "<div class=\"pf-two\"><div><h4 style=\"text-align:left;color:#1F6FD1\">fIPV</h4>" + rankTable(groups, "ipv", F.rank) + "</div>" +
      "<div><h4 style=\"text-align:left;color:#2E9E5B\">OPV</h4>" + rankTable(groups, "opv", F.rank) + "</div></div></section>";
  }
  function ucTable(groups) {
    var cols = [["uc", "UC", "t"], ["teh", "Tehsil", "t"], ["ipvT", "fIPV target", "r"], ["ipvH", "fIPV HH %", "r"], ["ipvA", "fIPV admin %", "r"], ["ipvM", "fIPV missed", "r"], ["opvT", "OPV target", "r"], ["opvH", "OPV HH %", "r"], ["opvA", "OPV admin %", "r"], ["opvM", "OPV missed", "r"]];
    var list = groups.map(function (g) {
      var i = g.m.ipv, o = g.m.opv;
      return { uc: g.uc, teh: g.teh, dist: g.dist, ipvT: i.target, ipvH: i.hhPct, ipvA: i.admPct, ipvM: i.missed, opvT: o.target, opvH: o.hhPct, opvA: o.admPct, opvM: o.missed };
    }).filter(function (x) { return !F.q || (x.uc + " " + x.teh + " " + x.dist).toLowerCase().indexOf(F.q.toLowerCase()) >= 0; });
    list.sort(function (a, b) { var va = a[F.sk], vb = b[F.sk]; if (typeof va === "string") return F.sd * va.localeCompare(vb); return F.sd * ((va == null ? -1 : va) - (vb == null ? -1 : vb)); });
    var h = "<div class=\"pf-tools\"><input class=\"pf-q\" id=\"pf-q\" placeholder=\"Search UC or tehsil\" value=\"" + esc(F.q) + "\" aria-label=\"Search UC\"><span class=\"pf-lab\" style=\"margin:0\">" + list.length + " UCs</span></div>";
    h += "<div class=\"pf-tw\" style=\"max-height:520px\"><table class=\"pf-t\"><thead><tr><th class=\"n\">#</th>";
    cols.forEach(function (c) { h += "<th class=\"" + c[2] + "\" data-sk=\"" + c[0] + "\">" + c[1] + (F.sk === c[0] ? (F.sd > 0 ? " ▲" : " ▼") : "") + "</th>"; });
    h += "</tr></thead><tbody>";
    list.forEach(function (x, i) {
      h += "<tr><td class=\"n\">" + (i + 1) + "</td><td class=\"u\">" + esc(x.uc) + "</td><td>" + esc(x.teh) + "</td>";
      h += "<td class=\"r\">" + nf(x.ipvT) + "</td><td class=\"r grn\">" + pc(x.ipvH) + "</td><td class=\"r blu\">" + pc(x.ipvA) + "</td><td class=\"r red\">" + nf(x.ipvM) + "</td>";
      h += "<td class=\"r\">" + nf(x.opvT) + "</td><td class=\"r grn\">" + pc(x.opvH) + "</td><td class=\"r blu\">" + pc(x.opvA) + "</td><td class=\"r red\">" + nf(x.opvM) + "</td></tr>";
    });
    if (!list.length) h += "<tr><td colspan=\"11\" class=\"pf-empty\">No UCs match.</td></tr>";
    return h + "</tbody></table></div>";
  }
  function tableCard(groups) {
    return "<section class=\"pf-c s12 pop\"><div class=\"pf-h\">All UCs in this selection<small>click a column to sort</small></div>" + ucTable(groups) + "</section>";
  }

  function header(rs, groups) {
    var d = options();
    var planned = TG.filter(function (t) { return (F.dist === "All" || t.dist === F.dist) && (F.teh === "All" || t.teh === F.teh); }).length;
    var reporting = groups.length;
    var upd = "";
    if (STAMP) { var s = STAMP.replace("T", " "); upd = s.slice(0, 16); }
    var sub = "fIPV &amp; OPV · Peshawar Division · " + (F.dist === "All" ? "all districts" : esc(F.dist)) + " · " + (F.day === "All" ? "all campaign days" : esc(dayLabel(F.day))) +
      " · " + reporting + " UCs reporting" + (planned ? " of " + planned + " planned" : "") + (upd ? " · updated " + esc(upd) : "");
    var filters = fl("pf-day", "Day", d.days, F.day, "All days", dayLabel) +
      fl("pf-dist", "District", d.dists, F.dist, "All districts") +
      fl("pf-teh", "Tehsil", d.tehs, F.teh, "All tehsils") +
      fl("pf-uc", "UC", d.ucs, F.uc, "All UCs") +
      "<button class=\"pf-reset\" id=\"pf-reset\" type=\"button\">Reset</button>";
    return "<div class=\"pf-top\"><div><h2>Polio Booster Campaign <em>fIPV &amp; OPV</em></h2><p class=\"pf-sub\">" + sub + "</p></div><div class=\"pf-fil\">" + filters + "</div></div>";
  }

  function draw(root) {
    var rs = ROWS.filter(function (r) { return okRow(r, F); });
    var withCud = F.day === "All";
    var cs = withCud ? CUD.filter(function (r) { return okRow(r, F); }) : [];
    var m = metrics(rs, cs, withCud);
    var groups = ucGroups(rs, cs, withCud);
    var html = "<div class=\"pf\">" + header(rs, groups) +
      "<div class=\"pf-grid\">" +
      vacCard("ipv", m, "fIPV", "#1F6FD1") + vacCard("opv", m, "OPV", "#2E9E5B") +
      cmpCard(m) + otherCard(m) + mapCard(groups) + districtCard() +
      rankCard(groups) +
      tableCard(groups) +
      dailyCard() +
      "</div>" +
      "<div class=\"pf-foot\"><img src=\"assets/logo-pei.jpg\" alt=\"Pakistan Polio Eradication Programme\" width=\"120\" height=\"44\"><span>Source: <b>District Emergency Operation Center, Peshawar</b></span><span class=\"pf-lab\" style=\"margin:0\">Figures update automatically when the fIPV workbook is saved.</span></div>" +
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
    onSel("pf-day", "day"); onSel("pf-dist", "dist"); onSel("pf-teh", "teh"); onSel("pf-uc", "uc");
    var rs = $("#pf-reset", root);
    if (rs) rs.addEventListener("click", function () { F.day = "All"; F.dist = "All"; F.teh = "All"; F.uc = "All"; F.q = ""; draw(root); });
    var mp = $("#pf-map", root); if (mp) mp.addEventListener("change", function () { F.map = mp.value; draw(root); });
    var cu = $("#pf-clearuc", root); if (cu) cu.addEventListener("click", function () { F.uc = "All"; draw(root); });
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
        el.textContent = fmt === "p" ? (v).toFixed(1) + "%" : nf(v);
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
