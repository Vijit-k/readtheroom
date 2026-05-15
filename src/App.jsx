import React, { useState, useEffect, useRef } from 'react'

// ── Example messages ──────────────────────────────────────────────────────────
const EXAMPLES = {
  'Angry customer': "This is absolutely unacceptable. I've been waiting for 3 weeks and nobody has had the decency to contact me. I want a full refund immediately or I'm posting this everywhere.",
  'Passive aggressive manager': "Thanks for the update. We'll revisit this next quarter. As mentioned previously, timelines are critical to this team and I'd hoped we'd be further along by now.",
  'Job rejection email': "Thank you for your interest in the role. After careful consideration, we've decided to move forward with other candidates who more closely match our requirements. We'll keep your profile on file.",
  'Client escalation': "I need to bring this to your attention urgently. This is the third time we've raised the same issue and nothing has changed. We're beginning to seriously question whether this partnership makes sense.",
  'Ghosting reply': "Hey! So sorry for the delayed response — things have been absolutely crazy on my end. We should definitely catch up soon! Would love to reconnect. 🙏",
}

const PLACEHOLDERS = [
  '"Thanks for the update. We\'ll revisit this next quarter."',
  '"Can we take this offline?"',
  '"As per my previous email…"',
  '"I\'m not upset, just disappointed."',
  '"We\'ll circle back on this."',
  '"Going forward, please ensure…"',
]

// ── Tone colour mapping ───────────────────────────────────────────────────────
const TONE_STYLES = {
  'Passive Aggressive':    'bg-amber-100    text-amber-800    dark:bg-amber-900/30    dark:text-amber-300',
  'Polite Avoidance':      'bg-sky-100      text-sky-800      dark:bg-sky-900/30      dark:text-sky-300',
  'Genuine Appreciation':  'bg-emerald-100  text-emerald-800  dark:bg-emerald-900/30  dark:text-emerald-300',
  'Angry Customer':        'bg-red-100      text-red-800      dark:bg-red-900/30      dark:text-red-300',
  'Defensive':             'bg-orange-100   text-orange-800   dark:bg-orange-900/30   dark:text-orange-300',
  'Manipulative':          'bg-purple-100   text-purple-800   dark:bg-purple-900/30   dark:text-purple-300',
  'Corporate Jargon':      'bg-slate-100    text-slate-700    dark:bg-slate-700/50    dark:text-slate-300',
  'Friendly':              'bg-emerald-100  text-emerald-800  dark:bg-emerald-900/30  dark:text-emerald-300',
  'Anxious':               'bg-yellow-100   text-yellow-800   dark:bg-yellow-900/30   dark:text-yellow-300',
  'Threatening':           'bg-red-100      text-red-800      dark:bg-red-900/30      dark:text-red-300',
  'Sarcastic':             'bg-pink-100     text-pink-800     dark:bg-pink-900/30     dark:text-pink-300',
  'Dismissive':            'bg-slate-100    text-slate-700    dark:bg-slate-700/50    dark:text-slate-300',
  'Urgent':                'bg-orange-100   text-orange-800   dark:bg-orange-900/30   dark:text-orange-300',
  'Professional':          'bg-indigo-100   text-indigo-800   dark:bg-indigo-900/30   dark:text-indigo-300',
  'Gaslighting':           'bg-violet-100   text-violet-800   dark:bg-violet-900/30   dark:text-violet-300',
}

const RISK_CONFIG = {
  Low:    { color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', label: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  Medium: { color: 'text-amber-600 dark:text-amber-400',    bar: 'bg-amber-500',   label: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  High:   { color: 'text-red-600 dark:text-red-400',        bar: 'bg-red-500',     label: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
}

// Tones that should show EscalationAI cross-promo
const ESCALATION_TONES = ['passive aggressive', 'angry customer', 'threatening', 'manipulative', 'defensive', 'gaslighting', 'urgent']

// ── Small reusable components ────────────────────────────────────────────────

function CopyBtn({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent fail on old browsers */ }
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors ${className}`}>
      {copied ? <><span>✓</span> Copied</> : <><span>⎘</span> Copy</>}
    </button>
  )
}

function LoadingDots() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 bounce-1" />
        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 bounce-2" />
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 bounce-3" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">Decoding subtext and hidden signals…</p>
    </div>
  )
}

function CrossPromo({ tone }) {
  if (!tone) return null
  const showIt = ESCALATION_TONES.some(t => tone.toLowerCase().includes(t))
  if (!showIt) return null
  return (
    <a href="https://escalationai.vijit.in" target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-900/10 hover:border-orange-400 dark:hover:border-orange-700 transition-colors group">
      <span className="text-lg mt-0.5">⚡</span>
      <div>
        <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">Managing a support team?</p>
        <p className="text-xs text-orange-700/80 dark:text-orange-400/80 mt-0.5">
          EscalationAI detects messages like this automatically inside Zendesk — before they blow up.{' '}
          <span className="underline group-hover:text-orange-800 dark:group-hover:text-orange-300">Try free →</span>
        </p>
      </div>
    </a>
  )
}

function DisclaimerModal({ onAccept }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-7 animate-fade-in">
        <div className="text-3xl mb-4">👁️</div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          Before you paste anything…
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
          ReadTheRoom is a <strong className="text-slate-700 dark:text-slate-300">fun, free tool</strong> — please keep it that way.
        </p>
        <ul className="space-y-2.5 mb-6">
          {[
            'Don\'t paste passwords, API keys, or login credentials',
            'Don\'t paste confidential business data or legal documents',
            'Don\'t paste personal information like IDs, bank details, or medical records',
            'Your message is sent to an AI for analysis and is not stored by us',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 leading-relaxed">
          This tool is meant for everyday messages — emails, Slack threads, customer replies. Use good judgment. By continuing you confirm you understand this.
        </p>
        <button
          onClick={onAccept}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-sm
            bg-gradient-to-r from-indigo-600 to-violet-600
            hover:from-indigo-500 hover:to-violet-500
            shadow-md transition-all duration-200 active:scale-[0.985]">
          Got it — let's go ✦
        </button>
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [text, setText] = useState('')
  const [funMode, setFunMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeRewrite, setActiveRewrite] = useState('professional')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rtr_history') || '[]') } catch { return [] }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [pendingAnalyze, setPendingAnalyze] = useState(false)

  const resultsRef = useRef(null)
  const textareaRef = useRef(null)

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Rotate placeholders
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3500)
    return () => clearInterval(t)
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), funMode }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Analysis failed')
      }

      const data = await res.json()

      if (res.status === 429 || data.error === 'rate_limit') {
        throw new Error(data.message || "We've hit the free API limit. Please wait 30–60 seconds and try again.")
      }

      setResult(data)
      setActiveRewrite('professional')

      // Save to localStorage history
      const entry = {
        id: Date.now(),
        snippet: text.trim().substring(0, 80) + (text.length > 80 ? '…' : ''),
        tone: data.tone,
        tone_emoji: data.tone_emoji,
        risk_level: data.risk_level,
        ts: new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      }
      const updated = [entry, ...history].slice(0, 8)
      setHistory(updated)
      localStorage.setItem('rtr_history', JSON.stringify(updated))

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)

    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const analyze = () => {
    if (!text.trim() || loading) return
    const accepted = localStorage.getItem('rtr_disclaimer_accepted')
    if (!accepted) {
      setPendingAnalyze(true)
      setShowDisclaimer(true)
    } else {
      runAnalysis()
    }
  }

  const acceptDisclaimer = () => {
    localStorage.setItem('rtr_disclaimer_accepted', '1')
    setShowDisclaimer(false)
    if (pendingAnalyze) {
      setPendingAnalyze(false)
      runAnalysis()
    }
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze()
  }

  const shareResult = async () => {
    if (!result) return
    const shareText = `I just ran this through ReadTheRoom 👁\n\nTone: ${result.tone_emoji} ${result.tone}\nRisk: ${result.risk_level} (${result.risk_score}/100)\n\n"${text.substring(0, 100)}${text.length > 100 ? '…' : ''}"\n\nAnalyze your messages free at readtheroom.vijit.in`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ReadTheRoom Analysis', text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert('Result copied! Paste and share anywhere.')
      }
    } catch { /* user cancelled */ }
  }

  const toneStyle = result
    ? (TONE_STYLES[result.tone] || 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300')
    : ''
  const riskCfg = result ? (RISK_CONFIG[result.risk_level] || RISK_CONFIG.Medium) : null

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Disclaimer modal (first use only) ── */}
      {showDisclaimer && <DisclaimerModal onAccept={acceptDisclaimer} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-cream/90 dark:bg-navy-950/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://vijitlabs.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <img src="/logo-icon.png" alt="Vijit Labs" className="w-8 h-8 object-contain" />
            </a>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">ReadTheRoom</span>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 text-sm ml-3">Before you hit send.</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button onClick={() => setShowHistory(s => !s)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                {showHistory ? 'Close' : `History (${history.length})`}
              </button>
            )}
            <button onClick={() => setDarkMode(d => !d)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-base">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* ── Hero text (shown only before first result) ── */}
        {!result && !loading && (
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3 leading-tight">
              What does this message<br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">really mean?</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
              Paste any email, Slack message, customer complaint, or tricky text. Get the real story.
            </p>
          </div>
        )}

        {/* ── History panel ── */}
        {showHistory && history.length > 0 && (
          <div className="card p-4 mb-6 animate-fade-in">
            <p className="label mb-3">Recent analyses</p>
            <div className="space-y-1">
              {history.map(h => (
                <button key={h.id}
                  onClick={() => { setText(h.snippet.replace('…', '')); setShowHistory(false) }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {h.tone_emoji} {h.tone}
                    </span>
                    <span className={`text-xs font-semibold flex-shrink-0 ${RISK_CONFIG[h.risk_level]?.color}`}>
                      {h.risk_level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{h.snippet}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input card ── */}
        <div className="card p-5 mb-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            rows={6}
            className="w-full resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-base leading-relaxed focus:outline-none transition-all"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            {/* Fun mode toggle */}
            <button
              onClick={() => setFunMode(f => !f)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 whitespace-nowrap ${
                funMode
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${funMode ? 'bg-violet-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
              Fun Mode {funMode ? '😂' : ''}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 dark:text-slate-600">{text.length}/3000</span>
              <span className="text-xs text-slate-300 dark:text-slate-600 hidden sm:block">⌘↵ to analyze</span>
            </div>
          </div>
        </div>

        {/* ── Example chips ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.keys(EXAMPLES).map(label => (
            <button key={label}
              onClick={() => { setText(EXAMPLES[label]); textareaRef.current?.focus() }}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
              {label}
            </button>
          ))}
        </div>

        {/* ── Vijit Labs products strip ── */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-semibold uppercase tracking-wider">More AI tools by Vijit Labs</p>
          <div className="grid grid-cols-3 gap-2">
            <a href="https://escalationai.vijit.in" target="_blank" rel="noopener noreferrer"
              className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group">
              <span className="text-base">⚡</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-700 dark:group-hover:text-orange-400 leading-tight">EscalationAI</span>
              <span className="text-[10px] text-slate-400 leading-tight">Zendesk risk scoring</span>
            </a>
            <a href="https://calllens.vijit.in" target="_blank" rel="noopener noreferrer"
              className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
              <span className="text-base">🎙️</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 leading-tight">CallLensAI</span>
              <span className="text-[10px] text-slate-400 leading-tight">Call analysis & coaching</span>
            </a>
            <a href="https://sspro.vijit.in" target="_blank" rel="noopener noreferrer"
              className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
              <img src="/sspro-logo.png" alt="SalesScraper Pro" className="w-6 h-6 object-contain" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-tight">SalesScraper Pro</span>
              <span className="text-[10px] text-slate-400 leading-tight">LinkedIn lead extraction</span>
            </a>
          </div>
        </div>

        {/* ── Analyze button ── */}
        <button
          onClick={analyze}
          disabled={!text.trim() || loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base
            bg-gradient-to-r from-indigo-600 to-violet-600
            hover:from-indigo-500 hover:to-violet-500
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-md hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/40
            active:scale-[0.985] transition-all duration-200">
          {loading ? '✦ Analyzing…' : '✦ Read the Room'}
        </button>

        {/* ── Error ── */}
        {error && (
          <div className={`mt-4 flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm ${
            error.includes('wait') || error.includes('limit')
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            <span className="text-base mt-0.5 flex-shrink-0">
              {error.includes('wait') || error.includes('limit') ? '⏳' : '⚠️'}
            </span>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <LoadingDots />}

        {/* ── Results ── */}
        {result && (
          <div ref={resultsRef} className="mt-8 space-y-4 result-enter">

            {/* Tone */}
            <div className="card p-6">
              <p className="label mb-4">Tone Detected</p>
              <div className="flex items-start gap-4">
                <span className="text-5xl leading-none">{result.tone_emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${toneStyle}`}>
                    {result.tone}
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {result.tone_description}
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden meaning */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="label">What They Probably Mean</p>
                <CopyBtn text={result.hidden_meaning} />
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.hidden_meaning}</p>
            </div>

            {/* Risk level */}
            <div className={`rounded-3xl border p-6 ${riskCfg?.label}`}>
              <p className="label mb-4">Risk Level</p>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black ${riskCfg?.color}`}>{result.risk_level}</span>
                <div className="flex-1 h-2 bg-slate-200/70 dark:bg-slate-700/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full risk-bar ${riskCfg?.bar}`}
                    style={{ width: `${result.risk_score}%` }}
                  />
                </div>
                <span className={`text-sm font-bold tabular-nums ${riskCfg?.color}`}>{result.risk_score}/100</span>
              </div>
            </div>

            {/* Safer rewrite — 3 tone tabs */}
            <div className="card p-6">
              <p className="label mb-4">Safer Rewrite</p>
              <div className="flex gap-2 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {[
                  { key: 'professional', label: '💼 Professional' },
                  { key: 'warm',         label: '☀️ Warm' },
                  { key: 'direct',       label: '⚡ Direct' },
                ].map(({ key, label }) => (
                  <button key={key}
                    onClick={() => setActiveRewrite(key)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                      activeRewrite === key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end mb-2">
                <CopyBtn text={result[`rewrite_${activeRewrite}`]} />
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {result[`rewrite_${activeRewrite}`]}
              </p>
            </div>

            {/* Suggested reply */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="label">Suggested Reply</p>
                <CopyBtn text={result.suggested_reply} />
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {result.suggested_reply}
              </p>
            </div>

            {/* Fun mode interpretation */}
            {funMode && result.fun_interpretation && (
              <div className="rounded-3xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/60 dark:bg-violet-900/15 p-6">
                <p className="label text-violet-400 mb-3">😂 Fun Interpretation</p>
                <p className="text-violet-700 dark:text-violet-300 leading-relaxed italic">
                  {result.fun_interpretation}
                </p>
              </div>
            )}

            {/* Context-aware cross-promo */}
            <CrossPromo tone={result.tone} />

            {/* Share + disclaimer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <button onClick={shareResult}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                <span>↗</span> Share this result
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500 sm:text-right max-w-xs">
                AI interpretations may not always reflect actual intent.
              </p>
            </div>

            {/* Analyze again */}
            <button
              onClick={() => { setResult(null); setText(''); textareaRef.current?.focus() }}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Analyze another message
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-2">
          <a href="https://vijitlabs.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-icon.png" alt="Vijit Labs" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Vijit Labs</span>
          </a>
          <p className="text-xs text-slate-400 dark:text-slate-500">AI tools for support &amp; sales teams</p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <a href="https://escalationai.vijit.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">EscalationAI</a>
            <span>·</span>
            <a href="https://calllens.vijit.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">CallLensAI</a>
            <span>·</span>
            <a href="https://sspro.vijit.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">SalesScraper Pro</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
