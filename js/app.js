// ── Helpers ──────────────────────────────────────────────────────────────────
const YOU_ID = 4776760;
const $ = (sel, ctx) => (ctx||document).querySelector(sel);
const $$ = (sel, ctx) => [...(ctx||document).querySelectorAll(sel)];
const ppr = v => v ? parseFloat(v).toFixed(2) : '—';
const pct = v => v ? parseFloat(v).toFixed(1)+'%' : '—';
const rankBadge = r => {
  const cls = r<=3 ? `rank-${r}` : 'rank-n';
  return `<span class="rank-badge ${cls}">${r}</span>`;
};
const formDots = form => form.map(r => `<div class="form-dot form-${r.toLowerCase()}">${r}</div>`).join('');
const pprColor = v => v >= 45 ? 'ppr-hi' : v >= 40 ? 'ppr-mid' : 'ppr-lo';
const playerName = p => p.id === YOU_ID ? `<span style="color:var(--accent2)">★ ${p.name}</span>` : p.name;
const shortName = name => { const p = name.split(', '); return p.length>1 ? p[1][0]+'. '+p[0] : name.substring(0,12); };

function playerById(id) { return DATA.players.find(p => p.id === id); }

// ── Tab switching ─────────────────────────────────────────────────────────────
function activateTab(name) {
  const tab = $(`[data-tab="${name}"]`);
  if (!tab) return;
  $$('.tab').forEach(t => t.classList.remove('active'));
  $$('.panel').forEach(p => p.classList.remove('active'));
  tab.classList.add('active');
  $(`#panel-${name}`).classList.add('active');
}

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.tab);
    history.replaceState(null, '', `#${tab.dataset.tab}`);
  });
});

// Activate from hash, default to standings
(function() {
  const hash = location.hash.slice(1);
  const valid = $$('.tab').map(t => t.dataset.tab);
  activateTab(hash && valid.includes(hash) ? hash : 'standings');
})();

// ── STANDINGS ─────────────────────────────────────────────────────────────────
function renderStandings() {
  const tbody = $('#standings-tbody');
  DATA.players.forEach(p => {
    const isYou = p.id === YOU_ID;
    const streakTxt = p.current_streak > 0 
      ? `<span class="pill pill-win">+${p.current_streak}W</span>`
      : p.current_losing_streak > 0
      ? `<span class="pill pill-loss">-${p.current_losing_streak}L</span>`
      : '<span class="pill pill-neutral">—</span>';
    const row = `<tr class="${isYou?'you':''}">
      <td>${rankBadge(p.rank)}</td>
      <td class="player-name" onclick="selectPlayer(${p.id})">${isYou ? '★ ' : ''}${p.name}</td>
      <td class="num"><span style="color:var(--win);font-weight:600">${p.win}</span></td>
      <td class="num"><span style="color:var(--loss)">${p.loss}</span></td>
      <td class="num"><strong>${p.points}</strong></td>
      <td class="num"><span class="${pprColor(parseFloat(p.ppr))}">${p.ppr}</span></td>
      <td class="num">${pct(p.leg_win_perc)}</td>
      <td class="num">${p.leg_wins}/${p.leg_count}</td>
      <td><div class="form">${formDots(p.form)}</div></td>
      <td class="num">${streakTxt}</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function renderStandingsCharts() {
  // PPR vs Rank scatter
  const labels = DATA.players.map(p => shortName(p.name));
  const pprs = DATA.players.map(p => parseFloat(p.ppr));
  const ranks = DATA.players.map(p => p.rank);
  const colors = DATA.players.map(p => p.id === YOU_ID ? '#4a8fe8' : '#e8c84a');

  new Chart($('#ppr-rank-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Season PPR',
        data: pprs,
        backgroundColor: colors,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#7a7f99', font: { size: 10 } }, grid: { color: '#2a2d3a' } },
        y: { ticks: { color: '#7a7f99', font: { size: 10 } }, grid: { color: '#2a2d3a' }, min: 30 }
      }
    }
  });

  // Win rate vs leg win%
  new Chart($('#win-leg-chart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Players',
        data: DATA.players.map(p => ({
          x: parseFloat(p.win)/(p.win+p.loss)*100,
          y: parseFloat(p.leg_win_perc),
          label: shortName(p.name),
          isYou: p.id === YOU_ID
        })),
        backgroundColor: DATA.players.map(p => p.id===YOU_ID ? '#4a8fe8' : '#e8c84a'),
        pointRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = ctx.raw;
              return `${d.label}: WR ${d.x.toFixed(0)}%, Leg ${d.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Win Rate %', color: '#7a7f99', font: { size: 10 } }, ticks: { color: '#7a7f99', font: { size: 10 } }, grid: { color: '#2a2d3a' } },
        y: { title: { display: true, text: 'Leg Win %', color: '#7a7f99', font: { size: 10 } }, ticks: { color: '#7a7f99', font: { size: 10 } }, grid: { color: '#2a2d3a' } }
      }
    }
  });
}

// ── PLAYERS ───────────────────────────────────────────────────────────────────
const playerCharts = {};

function renderPlayerButtons() {
  const wrap = $('#player-buttons');
  DATA.players.forEach(p => {
    const isYou = p.id === YOU_ID;
    const btn = document.createElement('button');
    btn.className = 'player-btn' + (isYou ? ' you-btn' : '');
    btn.textContent = (isYou ? '★ ' : '') + shortName(p.name);
    btn.dataset.id = p.id;
    btn.addEventListener('click', () => selectPlayer(p.id));
    wrap.appendChild(btn);
  });
}

let pprChart = null;
function selectPlayer(id) {
  // Switch to players tab
  activateTab('players');
  history.replaceState(null, '', '#players');

  $$('.player-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.id) === id));

  const p = playerById(id);
  if (!p) return;
  const isYou = p.id === YOU_ID;

  const wins = p.history.filter(m => m.won);
  const losses = p.history.filter(m => !m.won);
  const pprs = p.pprs;
  const avgPPR = pprs.length ? (pprs.reduce((a,b)=>a+b,0)/pprs.length).toFixed(2) : '—';
  const bestPPR = pprs.length ? Math.max(...pprs).toFixed(2) : '—';
  const worstPPR = pprs.length ? Math.min(...pprs).toFixed(2) : '—';

  // Best win
  const bestWin = wins.length ? wins.reduce((a,b)=> (a.score_for-a.score_against)>=(b.score_for-b.score_against)?a:b) : null;
  // Toughest opponent (most losses to)
  const oppLoss = {};
  losses.forEach(m => { oppLoss[m.opponent] = (oppLoss[m.opponent]||0)+1; });
  const nemesis = Object.entries(oppLoss).sort((a,b)=>b[1]-a[1])[0];
  // Best vs opponent (most wins against)
  const oppWin = {};
  wins.forEach(m => { oppWin[m.opponent] = (oppWin[m.opponent]||0)+1; });
  const bestOpp = Object.entries(oppWin).sort((a,b)=>b[1]-a[1])[0];

  const streakTxt = p.current_streak > 0
    ? `<span class="hl-win">${p.current_streak} wins</span>`
    : p.current_losing_streak > 0
    ? `<span class="hl-loss">${p.current_losing_streak} losses</span>`
    : '—';

  const profileEl = $('#player-profile');
  profileEl.innerHTML = `
    <div class="profile-grid">
      <div>
        <div style="padding:18px 18px 0">
          <div style="font-size:20px;font-weight:800;margin-bottom:4px;${isYou?'color:var(--accent2)':''}">
            ${rankBadge(p.rank)} ${p.name}${isYou?' <span style="font-size:12px;color:var(--accent2)">(you)</span>':''}
          </div>
          <div style="color:var(--muted);font-size:12px;margin-bottom:16px;">${p.win}W – ${p.loss}L · ${p.points} pts</div>
          <div class="form" style="margin-bottom:18px;">${formDots(p.form)} <span style="color:var(--muted);font-size:11px;margin-left:6px;">last ${p.form.length}</span></div>
        </div>
        <div class="profile-stats" style="padding:0 18px 18px">
          <div class="stat-row"><span class="stat-key">Season PPR</span><span class="stat-val ${pprColor(parseFloat(p.ppr))}">${p.ppr}</span></div>
          <div class="stat-row"><span class="stat-key">Avg Match PPR</span><span class="stat-val">${avgPPR}</span></div>
          <div class="stat-row"><span class="stat-key">Best Match PPR</span><span class="stat-val ppr-hi">${bestPPR}</span></div>
          <div class="stat-row"><span class="stat-key">Worst Match PPR</span><span class="stat-val ppr-lo">${worstPPR}</span></div>
          <div class="stat-row"><span class="stat-key">Leg Win %</span><span class="stat-val">${pct(p.leg_win_perc)}</span></div>
          <div class="stat-row"><span class="stat-key">Legs Won / Played</span><span class="stat-val">${p.leg_wins} / ${p.leg_count}</span></div>
          <div class="stat-row"><span class="stat-key">Best Streak</span><span class="stat-val ppr-hi">${p.best_streak}W</span></div>
          <div class="stat-row"><span class="stat-key">Current Streak</span><span class="stat-val">${streakTxt}</span></div>
          ${nemesis ? `<div class="stat-row"><span class="stat-key">Nemesis</span><span class="stat-val" style="color:var(--loss)">${nemesis[0]} (${nemesis[1]}L)</span></div>` : ''}
          ${bestOpp ? `<div class="stat-row"><span class="stat-key">Best vs</span><span class="stat-val ppr-hi">${bestOpp[0]} (${bestOpp[1]}W)</span></div>` : ''}
        </div>
      </div>
      <div>
        <div class="card-title">PPR Trend</div>
        <div style="height:180px;padding:12px;"><canvas id="player-ppr-chart"></canvas></div>
        <div class="card-title" style="margin-top:0;">Match History</div>
        <div style="max-height:340px;overflow-y:auto;">
          <table style="width:100%">
            <thead><tr>
              <th>Date</th><th>Opponent</th>
              <th class="num">Score</th><th class="num">PPR</th>
              <th class="num">Opp PPR</th><th></th>
            </tr></thead>
            <tbody>
              ${[...p.history].reverse().map(m => `
              <tr>
                <td style="color:var(--muted);font-size:11px">${m.pretty}</td>
                <td class="player-name" onclick="selectPlayer(${m.opponent_id})">${m.opponent}</td>
                <td class="num"><span style="color:${m.won?'var(--win)':'var(--loss)'};font-weight:700">${m.score_for}–${m.score_against}</span></td>
                <td class="num ${m.ppr?pprColor(m.ppr):''}">${m.ppr ? m.ppr.toFixed(2) : '—'}</td>
                <td class="num" style="color:var(--muted)">${m.opp_ppr ? m.opp_ppr.toFixed(2) : '—'}</td>
                <td><a href="https://recap.dartconnect.com/matches/${m.dc_id}" target="_blank" class="match-link" title="View recap">↗</a></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  // PPR trend chart
  if (pprChart) { pprChart.destroy(); pprChart = null; }
  const chartData = p.history.filter(m => m.ppr !== null);
  if (chartData.length) {
    pprChart = new Chart($('#player-ppr-chart'), {
      type: 'line',
      data: {
        labels: chartData.map(m => m.pretty),
        datasets: [{
          data: chartData.map(m => m.ppr),
          borderColor: isYou ? '#4a8fe8' : '#e8c84a',
          backgroundColor: isYou ? 'rgba(74,143,232,.1)' : 'rgba(232,200,74,.1)',
          pointBackgroundColor: chartData.map(m => m.won ? '#3ddc84' : '#ff5555'),
          pointRadius: 5,
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { title: ctx => ctx[0].label, label: ctx => `PPR: ${ctx.raw.toFixed(2)}` } }
        },
        scales: {
          x: { display: false },
          y: { ticks: { color: '#7a7f99', font: { size: 10 } }, grid: { color: '#2a2d3a' } }
        }
      }
    });
  }
}

// ── HEAD-TO-HEAD ──────────────────────────────────────────────────────────────
function renderH2H() {
  const players = DATA.players;
  const table = $('#h2h-table');
  const tooltip = $('#h2h-tooltip');

  // Header row
  let html = '<tr><th></th>';
  players.forEach(p => {
    html += `<th title="${p.name}"><span class="col-label">${shortName(p.name)}</span></th>`;
  });
  html += '</tr>';

  players.forEach(rowP => {
    const isYouRow = rowP.id === YOU_ID;
    html += `<tr><td class="player-label ${isYouRow?'':''}"><span class="player-name" onclick="selectPlayer(${rowP.id})">${shortName(rowP.name)}${isYouRow?' ★':''}</span></td>`;
    players.forEach(colP => {
      if (rowP.id === colP.id) {
        html += '<td class="h2h-cell-self">—</td>';
        return;
      }
      const key = `${Math.min(rowP.id,colP.id)}_${Math.max(rowP.id,colP.id)}`;
      const h = DATA.h2h[key];
      if (!h) { html += '<td class="h2h-cell-none">·</td>'; return; }
      const rowWins = h.a === rowP.id ? h.a_wins : h.b_wins;
      const colWins = h.a === colP.id ? h.a_wins : h.b_wins;
      let cls = rowWins > colWins ? 'h2h-cell-w' : rowWins < colWins ? 'h2h-cell-l' : 'h2h-cell-tied';
      const matchesJson = JSON.stringify(h.matches).replace(/"/g, '&quot;');
      html += `<td class="${cls}" 
        data-row="${rowP.id}" data-col="${colP.id}"
        data-rname="${rowP.name}" data-cname="${colP.name}"
        data-rwins="${rowWins}" data-cwins="${colWins}"
        data-matches="${matchesJson}"
        onmouseenter="showH2HTooltip(event,this)" onmouseleave="hideH2HTooltip()"
        onclick="showH2HDetail(this)"
      >${rowWins}–${colWins}</td>`;
    });
    html += '</tr>';
  });
  table.innerHTML = html;
}

function showH2HTooltip(e, cell) {
  const rname = cell.dataset.rname, cname = cell.dataset.cname;
  const rw = cell.dataset.rwins, cw = cell.dataset.cwins;
  const matches = JSON.parse(cell.dataset.matches.replace(/&quot;/g, '"'));
  const t = $('#h2h-tooltip');
  const lastMatch = matches[matches.length-1];
  let html = `<strong>${shortName(rname)}</strong> vs <strong>${shortName(cname)}</strong><br>
    <span style="color:var(--win)">${shortName(rname)} ${rw}</span> – <span style="color:var(--loss)">${cname.split(',')[0]} ${cw}</span><br>
    <span style="color:var(--muted);font-size:11px">${matches.length} match${matches.length>1?'es':''} played</span>`;
  t.innerHTML = html;
  t.style.display = 'block';
  t.style.left = (e.clientX + 14) + 'px';
  t.style.top = (e.clientY - 10) + 'px';
}
function hideH2HTooltip() { $('#h2h-tooltip').style.display = 'none'; }
function showH2HDetail(cell) {
  selectPlayer(parseInt(cell.dataset.row));
}

// ── MATCH LOG ���────────────────────────────────────────────────────────────────
function renderMatchLog() {
  const listEl = $('#match-list');
  const searchEl = $('#match-search');
  const sortEl = $('#match-sort');
  const countEl = $('#match-count');

  function render() {
    const q = searchEl.value.toLowerCase();
    const sort = sortEl.value;
    let matches = DATA.all_matches.filter(m => {
      if (!q) return true;
      return m.l_name.toLowerCase().includes(q) || m.r_name.toLowerCase().includes(q);
    });
    if (sort === 'date-desc') matches = matches.slice().sort((a,b) => b.date.localeCompare(a.date));
    else if (sort === 'date-asc') matches = matches.slice().sort((a,b) => a.date.localeCompare(b.date));
    else if (sort === 'ppr-desc') matches = matches.slice().sort((a,b) => b.combined_ppr - a.combined_ppr);
    else if (sort === 'margin-desc') matches = matches.slice().sort((a,b) => b.margin - a.margin);

    countEl.textContent = `${matches.length} matches`;
    const isUpset = m => {
      const lp = playerById(m.l_id), rp = playerById(m.r_id);
      if (!lp || !rp) return false;
      return (m.l_score > m.r_score && lp.rank > rp.rank) || (m.r_score > m.l_score && rp.rank > lp.rank);
    };

    listEl.innerHTML = matches.map(m => {
      const lIsYou = m.l_id === YOU_ID, rIsYou = m.r_id === YOU_ID;
      const upset = isUpset(m);
      return `<div class="match-row">
        <div class="match-date">${m.pretty}</div>
        <div class="match-player" style="${lIsYou?'color:var(--accent2)':''}${m.l_score>m.r_score?';font-weight:700':''}">
          <span class="player-name" onclick="selectPlayer(${m.l_id})">${m.l_name.split(', ')[1]||m.l_name.split(', ')[0]} ${m.l_name.split(', ')[0]}</span>
        </div>
        <div class="match-score">${m.l_score}–${m.r_score}</div>
        <div class="match-player" style="${rIsYou?'color:var(--accent2)':''}${m.r_score>m.l_score?';font-weight:700':''}">
          <span class="player-name" onclick="selectPlayer(${m.r_id})">${m.r_name.split(', ')[1]||m.r_name.split(', ')[0]} ${m.r_name.split(', ')[0]}</span>
        </div>
        ${upset ? '<span class="upset-badge">UPSET</span>' : ''}
        <div class="match-ppr" title="Combined PPR">${m.combined_ppr ? (m.l_ppr||0).toFixed(1)+' / '+(m.r_ppr||0).toFixed(1) : ''}</div>
        <a href="https://recap.dartconnect.com/matches/${m.dc_id}" target="_blank" class="match-link">↗</a>
      </div>`;
    }).join('');
  }

  searchEl.addEventListener('input', render);
  sortEl.addEventListener('change', render);
  render();
}

// ── LEADERBOARDS ─────────────────────────────────────────────────────────────
function renderLeaderboards() {
  function lb(el, rows, valFn, subFn) {
    el.innerHTML = rows.map((r, i) => {
      const isYou = r.id === YOU_ID;
      return `<div class="lb-row${isYou?' you':''}">
        <div class="lb-rank">${i+1}</div>
        <div class="lb-name" style="${isYou?'color:var(--accent2)':''}">
          <span class="player-name" onclick="selectPlayer(${r.id})">${r.name}</span>
        </div>
        <div class="lb-val">${valFn(r)}</div>
        <div class="lb-sub">${subFn(r)}</div>
      </div>`;
    }).join('');
  }

  // Season PPR
  const bySeasonPPR = [...DATA.players].sort((a,b) => parseFloat(b.ppr)-parseFloat(a.ppr));
  lb($('#lb-season-ppr'), bySeasonPPR.slice(0,8),
    r => r.ppr,
    r => `${r.win}W–${r.loss}L`);

  // Best match PPR
  const topPPR = DATA.top_ppr_performances.slice(0,8);
  $('#lb-match-ppr').innerHTML = topPPR.map((r, i) => {
    const p = playerById(r.player_id);
    const isYou = r.player_id === YOU_ID;
    return `<div class="lb-row${isYou?' you':''}">
      <div class="lb-rank">${i+1}</div>
      <div class="lb-name">
        <span class="player-name" onclick="selectPlayer(${r.player_id})" style="${isYou?'color:var(--accent2)':''}">
          ${r.player}
        </span>
        <span style="color:var(--muted);font-size:11px"> vs ${r.opp}</span>
      </div>
      <div class="lb-val">${r.ppr.toFixed(2)}</div>
      <div class="lb-sub" style="color:${r.won?'var(--win)':'var(--loss)'}">${r.score} · ${r.pretty}</div>
    </div>`;
  }).join('');

  // Leg win%
  const byLegWin = [...DATA.players].sort((a,b) => parseFloat(b.leg_win_perc)-parseFloat(a.leg_win_perc));
  lb($('#lb-leg-win'), byLegWin.slice(0,8),
    r => pct(r.leg_win_perc),
    r => `${r.leg_wins}/${r.leg_count} legs`);

  // Best win streak
  const byStreak = [...DATA.players].sort((a,b) => b.best_streak-a.best_streak);
  lb($('#lb-streak'), byStreak.slice(0,8),
    r => r.best_streak+'W',
    r => r.name);

  // Consistency (avg match PPR for those with 5+ matches with PPR data)
  const byConsistency = [...DATA.players]
    .filter(p => p.pprs && p.pprs.length >= 5)
    .sort((a,b) => (b.avg_match_ppr||0)-(a.avg_match_ppr||0));
  lb($('#lb-consistent'), byConsistency.slice(0,8),
    r => r.avg_match_ppr ? r.avg_match_ppr.toFixed(2) : '—',
    r => `${r.pprs.length} matches w/ data`);

  // Most active
  const byActive = [...DATA.players].sort((a,b) => b.matches-a.matches);
  lb($('#lb-active'), byActive.slice(0,8),
    r => r.matches,
    r => `${r.leg_count} legs`);
}

// ── INSIGHTS ─────────────────────────────────────────────────────────────────
function renderInsights() {
  // Title race
  const sorted = [...DATA.players].sort((a,b) => b.points-a.points);
  const leader = sorted[0];
  $('#insight-title-race').innerHTML = sorted.slice(0,6).map((p,i) => {
    const gap = leader.points - p.points;
    const isYou = p.id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${p.rank}</div>
      <div class="insight-text">
        <span class="${isYou?'hl-blue':'hl'}">${p.name}</span> — <strong>${p.points} pts</strong>${gap>0?` <span style="color:var(--muted)">(-${gap})</span>`:''}
        · <span style="color:var(--win)">${p.win}W</span>/<span style="color:var(--loss)">${p.loss}L</span>
        · PPR ${p.ppr}
      </div>
    </div>`;
  }).join('');

  // Best combined PPR matches
  $('#insight-best-matches').innerHTML = DATA.best_combined.slice(0,5).map((m,i) => {
    const lIsYou = m.l_id === YOU_ID, rIsYou = m.r_id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${lIsYou?'hl-blue':'hl'}">${m.l_name.split(', ')[0]}</span> 
        <span style="color:var(--accent)"> ${m.l_score}–${m.r_score} </span>
        <span class="${rIsYou?'hl-blue':'hl'}">${m.r_name.split(', ')[0]}</span>
        · <span style="color:var(--muted)">${m.pretty}</span>
        · <span style="color:var(--win)">Combined ${m.combined_ppr.toFixed(1)} PPR</span>
        · <a href="https://recap.dartconnect.com/matches/${m.dc_id}" target="_blank">recap↗</a>
      </div>
    </div>`;
  }).join('');

  // Upsets (lower ranked beat higher ranked)
  const upsets = DATA.all_matches.filter(m => {
    const lp = playerById(m.l_id), rp = playerById(m.r_id);
    if (!lp || !rp) return false;
    return (m.l_score > m.r_score && lp.rank > rp.rank + 2) ||
           (m.r_score > m.l_score && rp.rank > lp.rank + 2);
  }).slice(0, 5);
  
  const allUpsets = DATA.all_matches.filter(m => {
    const lp = playerById(m.l_id), rp = playerById(m.r_id);
    if (!lp || !rp) return false;
    return (m.l_score > m.r_score && lp.rank > rp.rank) ||
           (m.r_score > m.l_score && rp.rank > lp.rank);
  });
  
  $('#insight-upsets').innerHTML = allUpsets.slice(0,5).map((m,i) => {
    const lp = playerById(m.l_id), rp = playerById(m.r_id);
    const winner = m.l_score > m.r_score ? lp : rp;
    const loser = m.l_score > m.r_score ? rp : lp;
    const wScore = m.l_score > m.r_score ? m.l_score : m.r_score;
    const lScore = m.l_score > m.r_score ? m.r_score : m.l_score;
    const isYou = winner.id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${isYou?'hl-blue':'hl-win'}">#${winner.rank} ${winner.name.split(', ')[0]}</span>
        beat <span class="hl-loss">#${loser.rank} ${loser.name.split(', ')[0]}</span>
        <span style="color:var(--accent)"> ${wScore}–${lScore} </span>
        · <span style="color:var(--muted)">${m.pretty}</span>
      </div>
    </div>`;
  }).join('') || '<div style="padding:12px;color:var(--muted)">No major upsets found</div>';

  // Dominance - who has most lopsided H2H
  const dominance = [];
  Object.values(DATA.h2h).forEach(h => {
    const total = h.a_wins + h.b_wins;
    if (total >= 2) {
      const maxW = Math.max(h.a_wins, h.b_wins);
      const minW = Math.min(h.a_wins, h.b_wins);
      if (minW === 0 && total >= 2) {
        const winnerId = h.a_wins > h.b_wins ? h.a : h.b;
        const loserId = h.a_wins > h.b_wins ? h.b : h.a;
        const winner = playerById(winnerId);
        const loser = playerById(loserId);
        if (winner && loser) dominance.push({ winner, loser, wins: maxW });
      }
    }
  });
  dominance.sort((a,b) => b.wins-a.wins);
  
  $('#insight-dominance').innerHTML = dominance.slice(0,5).map((d,i) => {
    const isYou = d.winner.id === YOU_ID || d.loser.id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${d.winner.id===YOU_ID?'hl-blue':'hl-win'}">${d.winner.name.split(', ')[0]}</span>
        <span class="hl"> ${d.wins}–0 </span>
        vs <span class="${d.loser.id===YOU_ID?'hl-blue':'hl-loss'}">${d.loser.name.split(', ')[0]}</span>
        <span style="color:var(--muted);font-size:11px"> (undefeated)</span>
      </div>
    </div>`;
  }).join('') || '<div style="padding:12px;color:var(--muted)">No clean H2H sweeps</div>';

  // PPR overperformers - players whose avg match PPR is above season PPR
  const overperf = DATA.players
    .filter(p => p.avg_match_ppr && p.pprs.length >= 5)
    .map(p => ({ ...p, delta: (p.avg_match_ppr - parseFloat(p.ppr)).toFixed(2) }))
    .sort((a,b) => parseFloat(b.delta)-parseFloat(a.delta));
    
  $('#insight-overperf').innerHTML = [
    `<div style="color:var(--muted);font-size:11px;padding:10px 0 6px">Season PPR vs per-match avg PPR (match data may differ from season aggregation)</div>`,
    ...overperf.slice(0,6).map((p,i) => {
      const isYou = p.id === YOU_ID;
      const delta = parseFloat(p.delta);
      return `<div class="insight-item">
        <div class="insight-num">${i+1}</div>
        <div class="insight-text">
          <span class="${isYou?'hl-blue':'hl'}">${p.name.split(', ')[0]}</span>
          · Season ${p.ppr} → Match avg <span class="${delta>=0?'hl-win':'hl-loss'}">${p.avg_match_ppr}</span>
          <span style="color:${delta>=0?'var(--win)':'var(--loss)'}"> (${delta>=0?'+':''}${p.delta})</span>
        </div>
      </div>`;
    })
  ].join('');

  // Closest matches


  // Highest turns — best single-leg PPT (points per turn)
  $('#insight-top-ppt').innerHTML = (DATA.top_ppt || []).slice(0,8).map((l,i) => {
    const isYou = l.player_id === YOU_ID;
    const name = DATA.players.find(p=>p.id===l.player_id)?.name.split(', ')[0] || '?';
    const opp  = DATA.players.find(p=>p.id===l.opponent_id)?.name.split(', ')[0] || '?';
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="hl" style="font-size:14px;font-weight:800">${l.ppt.toFixed(1)}</span>
        <span style="color:var(--muted)"> PPT</span>
        — <span class="${isYou?'hl-blue':'hl'}">${name}</span>
        vs ${opp}
        · <span style="color:var(--muted)">${l.pretty}</span>
        · <a href="https://recap.dartconnect.com/matches/${l.dc_id}" target="_blank">recap↗</a>
      </div>
    </div>`;
  }).join('');

  // Checkout efficiency
  $('#insight-checkout-eff').innerHTML = (DATA.checkout_efficiency || []).slice(0,8).map((s,i) => {
    const isYou = s.player_id === YOU_ID;
    const barW = Math.round(s.efficiency);
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text" style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
          <span class="${isYou?'hl-blue':'hl'}">${s.name.split(', ')[0]}</span>
          <span style="font-weight:800;color:var(--accent)">${s.efficiency}%</span>
        </div>
        <div class="bar-wrap" style="margin-top:0"><div class="bar-fill" style="width:${barW}%"></div></div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px">${s.legs_won} legs won · ${s.opps_missed} in-range misses · ${s.close_missed} close misses (≤40)</div>
      </div>
    </div>`;
  }).join('');
  // Highest checkouts — top 8 individual checkout scores
  $('#insight-checkouts').innerHTML = DATA.top_checkouts.slice(0,8).map((c,i) => {
    const isYou = c.player_id === YOU_ID;
    const opp = DATA.players.find(p => p.id === c.opponent_id);
    const oppName = opp ? opp.name.split(', ')[0] : '?';
    const d = new Date(c.date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${isYou?'hl-blue':'hl'}" style="font-size:15px;font-weight:800">${c.checkout}</span>
        — <span class="${isYou?'hl-blue':'hl'}">${DATA.players.find(p=>p.id===c.player_id)?.name.split(', ')[0]}</span>
        vs ${oppName} · <span style="color:var(--muted)">${d}</span>
        · <a href="https://recap.dartconnect.com/matches/${c.dc_id}" target="_blank">recap↗</a>
      </div>
    </div>`;
  }).join('');

  // Comeback wins
  $('#insight-comebacks').innerHTML = DATA.comebacks.slice(0,6).map((c,i) => {
    const wIsYou = c.winner_id === YOU_ID, lIsYou = c.loser_id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${wIsYou?'hl-blue':'hl'}">${c.winner_name.split(', ')[0]}</span>
        came back to beat
        <span class="${lIsYou?'hl-blue':'hl'}">${c.loser_name.split(', ')[0]}</span>
        <span style="color:var(--accent)"> ${c.score}</span>
        · <span style="color:var(--muted)">${c.pretty}</span>
        · <a href="https://recap.dartconnect.com/matches/${c.dc_id}" target="_blank">recap↗</a>
      </div>
    </div>`;
  }).join('');
  if (!DATA.comebacks.length) $('#insight-comebacks').innerHTML = '<div class="insight-item"><div class="insight-text" style="color:var(--muted)">No comebacks recorded yet</div></div>';

  // Best checkout average (min 50 checkouts)
  const coStats = (DATA.checkout_stats || []).filter(s => s.count >= 50).sort((a,b) => b.avg - a.avg);
  $('#insight-checkout-avg').innerHTML = coStats.slice(0,6).map((s,i) => {
    const isYou = s.player_id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${isYou?'hl-blue':'hl'}">${s.name.split(', ')[0]}</span>
        · avg <span class="hl">${s.avg}</span>
        · high <span style="color:var(--win)">${s.highest}</span>
        · ${s.count} checkouts
      </div>
    </div>`;
  }).join('');
  $('#insight-closest').innerHTML = DATA.closest_matches.slice(0,5).map((m,i) => {
    const lIsYou = m.l_id === YOU_ID, rIsYou = m.r_id === YOU_ID;
    return `<div class="insight-item">
      <div class="insight-num">${i+1}</div>
      <div class="insight-text">
        <span class="${lIsYou?'hl-blue':'hl'}">${m.l_name.split(', ')[0]}</span>
        <span style="color:var(--accent)"> ${m.l_score}–${m.r_score} </span>
        <span class="${rIsYou?'hl-blue':'hl'}">${m.r_name.split(', ')[0]}</span>
        · ${m.total_legs} legs total · <span style="color:var(--muted)">${m.pretty}</span>
        · <a href="https://recap.dartconnect.com/matches/${m.dc_id}" target="_blank">recap↗</a>
      </div>
    </div>`;
  }).join('');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
renderStandings();
renderStandingsCharts();
renderPlayerButtons();
renderH2H();
renderMatchLog();
renderLeaderboards();
renderInsights();
