const $ = (sel) => document.querySelector(sel)

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

async function refreshStatus() {
  try {
    const s = await api('/api/status')
    $('#status').textContent = `Online · ${s.db} análises no histórico · porta ${s.port}`
    $('#status').className = 'status ok'
  } catch {
    $('#status').textContent = 'Servidor offline — rode npm start'
    $('#status').className = 'status err'
  }
}

async function loadHistory() {
  const { items } = await api('/api/analyses?limit=20')
  const ul = $('#history')
  if (!items.length) {
    ul.innerHTML = '<li class="empty">Nenhuma análise ainda</li>'
    return
  }
  ul.innerHTML = items
    .map(
      (a) =>
        `<li><button type="button" data-id="${a.id}" class="link">${a.slug}</button> · ${a.mode} · ${a.health_overall}/100 (${a.health_grade}) · ${fmt(a.created_at)}</li>`,
    )
    .join('')
  ul.querySelectorAll('[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => showAnalysis(Number(btn.dataset.id)))
  })
}

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR')
}

function renderResult(data) {
  $('#result').classList.remove('hidden')
  $('#score').textContent = `${data.health.overall}/100 (${data.health.grade}) — ${data.repo.slug}`
  $('#categories').innerHTML = data.health.categories
    .map((c) => `<li class="${c.status}">${c.id}: ${c.status === 'ok' ? 'ok' : 'gap'} (${c.weight}pts)</li>`)
    .join('')

  const recs = data.recommendations || []
  const box = $('#recommendations')
  if (!recs.length) {
    box.innerHTML = '<p class="ok-msg">Nenhuma recomendação pendente</p>'
    return
  }
  box.innerHTML =
    '<h3>Recomendações</h3>' +
    recs
      .map(
        (r) =>
          `<article class="rec"><strong>[P${r.priority}] ${r.title}</strong><p>${r.suggestedUpgrade}</p></article>`,
      )
      .join('')
}

async function run(mode) {
  const path = $('#repoPath').value.trim()
  if (!path) {
    alert('Informe o caminho do repositório')
    return
  }
  $('#busy').classList.remove('hidden')
  try {
    const res = await api('/api/analyze', { method: 'POST', body: JSON.stringify({ path, mode }) })
    renderResult(res.data)
    await loadHistory()
  } catch (err) {
    alert(err.message)
  } finally {
    $('#busy').classList.add('hidden')
  }
}

async function showAnalysis(id) {
  const row = await api(`/api/analyses/${id}`)
  renderResult(row.data)
  $('#repoPath').value = row.path
}

$('#btnQuick').addEventListener('click', () => run('quick'))
$('#btnDeep').addEventListener('click', () => run('deep'))

refreshStatus()
loadHistory().catch(() => {})
