
const D = window.LEAGUE_DATA;

document.getElementById('format-note').textContent = D.league.note;
document.getElementById('keeper-rule').textContent = D.league.keeperRule;
document.getElementById('toilet-rule').textContent = D.league.toiletBowl;

document.getElementById('history-grid').innerHTML = D.history.map(h => `
  <article class="history-card">
    <div class="history-year">${h.year}</div>
    <h3>${h.champion}</h3>
    <p><strong>Runner-up:</strong> ${h.runnerUp}</p>
    <p>${h.headline}</p>
    <div class="toilet">🚽 Toilet Bowl: ${h.toilet}<small>${h.toiletCopy}</small></div>
  </article>
`).join('');

document.getElementById('records-body').innerHTML = D.records.map(r => `
  <tr><td>${r.manager}</td><td>${r.seasons}</td><td>${r.record}</td><td>${r.winPct}</td><td>${r.pf}</td><td>${r.titles}</td><td>${r.best}</td></tr>
`).join('');

document.getElementById('archetypes').innerHTML = D.archetypes.map(a => `
  <article class="manager-card">
    <div class="manager">${a.manager}</div>
    <h3>${a.title}</h3>
    <p>${a.body}</p>
  </article>
`).join('');

document.getElementById('team-cards').innerHTML = D.teams.map(t => `
  <article class="team-card">
    <div class="rank-pill">${t.rank}</div>
    <h3 class="team-name">${t.team}</h3>
    <div class="manager-line">${t.manager}</div>
    <div class="grade-row"><span class="our-grade">${t.grade}</span><span class="yahoo-grade">Yahoo ${t.yahoo}</span></div>
    <div class="core">${t.core.map(p => `<span class="chip">${p}</span>`).join('')}</div>
    <dl>
      <div><dt>Best decision</dt><dd>${t.best}</dd></div>
      <div><dt>Concern</dt><dd>${t.concern}</dd></div>
      <div><dt>Outlook</dt><dd>${t.outlook}</dd></div>
    </dl>
    <div class="team-meta"><span>Projection <strong>${t.projection}</strong></span><span>Title <strong>${t.titleOdds}</strong></span><span>Press risk <strong>${t.pressRisk}</strong></span></div>
  </article>
`).join('');

document.getElementById('power-list').innerHTML = D.teams.map(t => `
  <div class="power-row">
    <div class="power-rank">${t.rank}</div>
    <div class="power-team"><strong>${t.team}</strong><small>${t.manager}</small></div>
    <div class="power-stat"><small>Record</small><b>${t.projection}</b></div>
    <div class="power-stat"><small>Title</small><b>${t.titleOdds}</b></div>
    <div class="power-stat"><small>Press risk</small><b>${t.pressRisk}</b></div>
  </div>
`).join('');

document.getElementById('week1').innerHTML = D.week1.map(m => `
  <div class="matchup"><span>${m[0]}</span><span>VS</span><span>${m[1]}</span></div>
  <p class="matchup-note">${m[2]}</p>
`).join('');

document.getElementById('awards-grid').innerHTML = D.awards.map(a => `
  <div class="award"><small>${a[0]}</small><strong>${a[1]}</strong><p>${a[2]}</p></div>
`).join('');

document.getElementById('stories').innerHTML = D.storylines.map(s => `
  <div class="story"><h3>${s[0]}</h3><p>${s[1]}</p></div>
`).join('');
