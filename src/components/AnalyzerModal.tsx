import React, { useEffect, useMemo, useRef, useState } from 'react'
import { isAllowedSteamTag } from '../lib/steam'

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>
    }
  }
}

type GamePayload = {
  appId: number
  name: string
  score: number
  fuzzyStats: any
  raw?: {
    playtime_forever: number
    rtime_last_played: number
    playtime_2weeks: number
  }
  source?: {
    reviewPositivity?: number
    tagSimilarity?: number
    reviewVolume?: number
    publisherScore?: number
    matchedTags?: string[]
    publishers?: string[]
    price?: string
    originalPrice?: string
    discount?: string
  }
}

type FuzzyRule = {
  output: string
  label: string
  antecedents: Array<{
    variable: string
    term: string
    value: number
  }>
  alpha: number
  expression: string
}

type FuzzyProcess = {
  fuzzification: {
    inputs: {
      playtime_forever: number
      playtime_2weeks: number
      days_since_played: number
      max_playtime_forever: number
      max_playtime_2weeks: number
    }
    memberships: {
      playtime: Record<string, number>
      recency: Record<string, number>
      activity: Record<string, number>
    }
  }
  inference: {
    rules: FuzzyRule[]
    activation: Record<string, number>
  }
  defuzzification: {
    weights: Record<string, number>
    numerator: number
    denominator: number
    score: number
    usedFallback: boolean
    formula: string
  }
}

const formatHours = (minutes: number) => `${(minutes / 60).toFixed(1)} jam`

const formatLastPlayed = (seconds: number) => {
  if (!seconds) return 'Tidak diketahui'
  const days = Math.max(0, Math.floor((Date.now() / 1000 - seconds) / 86400))
  if (days === 0) return 'Hari ini'
  if (days === 1) return '1 hari yang lalu'
  if (days < 7) return `${days} hari yang lalu`
  if (days < 30) return `${Math.round(days / 7)} minggu yang lalu`
  return `${Math.round(days / 30)} bulan yang lalu`
}

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-400">{title}</p>
    {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
  </div>
)

const SubtleLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">{children}</p>
)

const LatexBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-x-auto py-3 text-base leading-relaxed text-zinc-200 sm:text-lg [&_.mjx-container]:my-0 [&_.mjx-container]:max-w-none [&_.mjx-container]:whitespace-normal [&_.mjx-container]:text-left">
    {children}
  </div>
)

const latexTerm = (value: string) => `\\mathrm{${value.replace(/_/g, '\\_')}}`
const latexNumber = (value: number, digits = 3) => Number.isFinite(value) ? value.toFixed(digits) : '0.000'
const hasOwnGameProcess = (process: any): process is FuzzyProcess => {
  return process?.fuzzification?.inputs?.playtime_forever !== undefined
}

export const AnalyzerModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [game, setGame] = useState<GamePayload | null>(null)
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleOpen = async (event: any) => {
      setGame(event.detail)
      setIsOpen(true)
      setLoading(true)
      setDetails(null)

      try {
        const response = await fetch(`/api/game/${event.detail.appId}`)
        if (response.ok) {
          setDetails(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch game details', error)
      } finally {
        setLoading(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('open-analyzer-modal', handleOpen)
      window.addEventListener('keydown', closeOnEscape)
      return () => {
        window.removeEventListener('open-analyzer-modal', handleOpen)
        window.removeEventListener('keydown', closeOnEscape)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !game) return
    const mathJax = window.MathJax
    if (!mathJax?.typesetPromise || !modalRef.current) return

    void mathJax.typesetPromise([modalRef.current]).catch((error) => {
      console.error('Failed to typeset MathJax content', error)
    })
  }, [isOpen, game, details])

  const normalizedTags = useMemo(() => {
    const tags = [
      ...(details?.genres || []).map((g: any) => g.description),
      ...(details?.categories || []).map((c: any) => c.description)
    ]

    return Array.from(new Set(tags)).filter(isAllowedSteamTag)
  }, [details])

  const fuzzyProcess = useMemo<any | null>(() => {
    return game?.fuzzyStats?.process || null
  }, [game])

  const activeRules = useMemo(() => {
    return (fuzzyProcess?.inference.rules || [])
      .filter((rule) => rule.alpha > 0)
      .sort((left, right) => right.alpha - left.alpha)
  }, [fuzzyProcess])

  const fuzzyLatex = useMemo(() => {
    if (!fuzzyProcess) return null
    if (!hasOwnGameProcess(fuzzyProcess)) {
      const inputs = fuzzyProcess.fuzzification.inputs
      const memberships = fuzzyProcess.fuzzification.memberships
      const activation = fuzzyProcess.inference.activation
      const defuzzification = fuzzyProcess.defuzzification
      const activationRows = Object.entries(activation)
        .map(([label, value]) => `A_{${latexTerm(label)}} &= \\max(\\alpha_i\\mid y_i=${latexTerm(label)}) = ${latexNumber(value as number)}`)
        .join('\\\\')
      const membershipRows = [
        ['review', memberships.review],
        ['similarity', memberships.similarity],
        ['volume', memberships.volume],
        ['publisher', memberships.publisher]
      ].flatMap(([variable, values]) =>
        Object.entries(values as Record<string, number>)
          .map(([term, value]) => `\\mu_{${latexTerm(variable as string)},${latexTerm(term)}} &= ${latexNumber(value)}`)
      ).join('\\\\')
      const ruleRows = activeRules.length > 0
        ? activeRules.map((rule, index) => {
            const terms = rule.antecedents
              .map((antecedent) => `\\mu_{${latexTerm(antecedent.variable)},${latexTerm(antecedent.term)}}=${latexNumber(antecedent.value)}`)
              .join(', ')
            return `\\alpha_{${index + 1}} &= \\min(${terms}) = ${latexNumber(rule.alpha)}\\Rightarrow y_{${index + 1}}=${latexTerm(rule.output)}`
          }).join('\\\\')
        : '\\alpha_i &= 0\\quad\\text{Tidak ada rule aktif}'
      const weightedTerms = Object.entries(activation)
        .filter(([, value]) => (value as number) > 0)
        .map(([label, value]) => `${latexNumber(value as number)}\\cdot ${latexNumber(defuzzification.weights[label] || 0, 1)}`)
        .join(' + ') || '0'
      const denominatorTerms = Object.values(activation)
        .filter((value) => (value as number) > 0)
        .map((value) => latexNumber(value as number))
        .join(' + ') || '0'
      const weightRows = Object.entries(defuzzification.weights)
        .map(([label, value]) => `w_{${latexTerm(label)}} &= ${latexNumber(value as number, 1)}`)
        .join('\\\\')

      return {
        input: `\\[
\\begin{aligned}
\\text{Input kandidat rekomendasi:}\\quad
q &= ${latexNumber(inputs.review_positivity)}\\ \\text{review positivity}\\\\
s &= ${latexNumber(inputs.tag_similarity)}\\ \\text{weighted tag similarity}\\\\
v &= ${inputs.review_volume}\\ \\text{total review Steam}\\\\
\\ell_v &= \\log_{10}(v) = ${latexNumber(inputs.log_review_volume)}\\\\
p &= ${latexNumber(inputs.publisher_score)}\\ \\text{publisher affinity}
\\end{aligned}
\\]`,
        fuzzification: `\\[
\\mu_{trap}(x;a,b,c,d)=
\\begin{cases}
0, & x\\le a\\ \\text{atau}\\ x\\ge d\\\\
\\frac{x-a}{b-a}, & a<x<b\\\\
1, & b\\le x\\le c\\\\
\\frac{d-x}{d-c}, & c<x<d
\\end{cases}
\\]
\\[
\\begin{aligned}
${membershipRows}
\\end{aligned}
\\]`,
        inference: `\\[
\\begin{aligned}
\\text{Operator AND Mamdani:}\\quad
\\alpha_i &= \\min(\\mu_1,\\mu_2,\\ldots,\\mu_n)\\\\
\\text{Agregasi output:}\\quad
A_k &= \\max(\\alpha_i\\mid y_i=k)
\\end{aligned}
\\]
\\[
\\begin{aligned}
${ruleRows}
\\end{aligned}
\\]
\\[
\\begin{aligned}
${activationRows}
\\end{aligned}
\\]`,
        defuzzification: `\\[
\\begin{aligned}
${weightRows}
\\end{aligned}
\\]
\\[
\\begin{aligned}
N &= \\sum_k A_k\\cdot w_k = ${weightedTerms} = ${latexNumber(defuzzification.numerator)}\\\\
D &= \\sum_k A_k = ${denominatorTerms} = ${latexNumber(defuzzification.denominator)}\\\\
score &= 
\\begin{cases}
\\frac{N}{D}, & D>0\\\\
0, & D=0
\\end{cases}
= ${latexNumber(defuzzification.score)}\\\\
score_{persen} &= ${latexNumber(defuzzification.score)}\\times 100\\% = ${Math.round(defuzzification.score * 100)}\\%
\\end{aligned}
\\]`
      }
    }

    const inputs = fuzzyProcess.fuzzification.inputs
    const memberships = fuzzyProcess.fuzzification.memberships
    const activation = fuzzyProcess.inference.activation
    const defuzzification = fuzzyProcess.defuzzification
    const activationRows = Object.entries(activation)
      .map(([label, value]) => `A_{${latexTerm(label)}} &= \\max(\\alpha_i\\mid y_i=${latexTerm(label)}) = ${latexNumber(value as number)}`)
      .join('\\\\')
    const membershipRows = [
      ['playtime', memberships.playtime],
      ['recency', memberships.recency],
      ['activity', memberships.activity]
    ].flatMap(([variable, values]) =>
      Object.entries(values as Record<string, number>)
        .map(([term, value]) => `\\mu_{${latexTerm(variable as string)},${latexTerm(term)}} &= ${latexNumber(value)}`)
    ).join('\\\\')
    const ruleRows = activeRules.length > 0
      ? activeRules.map((rule, index) => {
          const terms = rule.antecedents
            .map((antecedent) => `\\mu_{${latexTerm(antecedent.variable)},${latexTerm(antecedent.term)}}=${latexNumber(antecedent.value)}`)
            .join(', ')
          return `\\alpha_{${index + 1}} &= \\min(${terms}) = ${latexNumber(rule.alpha)}\\Rightarrow y_{${index + 1}}=${latexTerm(rule.output)}`
        }).join('\\\\')
      : '\\alpha_i &= 0\\quad\\text{Tidak ada rule aktif}'
    const weightedTerms = Object.entries(activation)
      .filter(([, value]) => (value as number) > 0)
      .map(([label, value]) => `${latexNumber(value as number)}\\cdot ${latexNumber(defuzzification.weights[label] || 0, 1)}`)
      .join(' + ') || '0'
    const denominatorTerms = Object.values(activation)
      .filter((value) => (value as number) > 0)
      .map((value) => latexNumber(value as number))
      .join(' + ') || '0'
    const weightRows = Object.entries(defuzzification.weights)
      .map(([label, value]) => `w_{${latexTerm(label)}} &= ${latexNumber(value, 1)}`)
      .join('\\\\')

    return {
      input: `\\[
\\begin{aligned}
\\text{Input mentah:}\\quad
p &= ${inputs.playtime_forever}\\ \\text{menit total playtime}\\\\
a &= ${inputs.playtime_2weeks}\\ \\text{menit activity 2 minggu}\\\\
r &= ${latexNumber(inputs.days_since_played, 1)}\\ \\text{hari sejak terakhir dimainkan}
\\end{aligned}
\\]`,
      fuzzification: `\\[
\\begin{aligned}
x_p &= p = ${inputs.playtime_forever}\\\\
x_a &= a = ${inputs.playtime_2weeks}\\\\
x_r &= r = ${latexNumber(inputs.days_since_played, 1)}
\\end{aligned}
\\]
\\[
\\mu_{trap}(x;a,b,c,d)=
\\begin{cases}
0, & x\\le a\\ \\text{atau}\\ x\\ge d\\\\
\\frac{x-a}{b-a}, & a<x<b\\\\
1, & b\\le x\\le c\\\\
\\frac{d-x}{d-c}, & c<x<d
\\end{cases}
\\]
\\[
\\begin{aligned}
${membershipRows}
\\end{aligned}
\\]`,
      inference: `\\[
\\begin{aligned}
\\text{Operator AND Mamdani:}\\quad
\\alpha_i &= \\min(\\mu_1,\\mu_2,\\ldots,\\mu_n)\\\\
\\text{Agregasi output:}\\quad
A_k &= \\max(\\alpha_i\\mid y_i=k)
\\end{aligned}
\\]
\\[
\\begin{aligned}
${ruleRows}
\\end{aligned}
\\]
\\[
\\begin{aligned}
${activationRows}
\\end{aligned}
\\]`,
      defuzzification: `\\[
\\begin{aligned}
${weightRows}
\\end{aligned}
\\]
\\[
\\begin{aligned}
N &= \\sum_k A_k\\cdot w_k = ${weightedTerms} = ${latexNumber(defuzzification.numerator)}\\\\
D &= \\sum_k A_k = ${denominatorTerms} = ${latexNumber(defuzzification.denominator)}\\\\
score &= 
\\begin{cases}
\\frac{N}{D}, & D>0\\\\
0.5, & D=0
\\end{cases}
= ${latexNumber(defuzzification.score)}\\\\
score_{persen} &= ${latexNumber(defuzzification.score)}\\times 100\\% = ${Math.round(defuzzification.score * 100)}\\%
\\end{aligned}
\\]`
    }
  }, [activeRules, fuzzyProcess])

  if (!isOpen || !game) return null

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 overflow-y-auto bg-black/85 px-3 py-3 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.07),transparent_35%)]" />

      <div className="relative mx-auto my-2 flex w-full max-w-[1180px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-[0_30px_120px_rgba(0,0,0,0.65)] max-h-[calc(100vh-1rem)] lg:grid lg:h-[92vh] lg:max-h-[92vh] lg:grid-cols-[380px_1fr]">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Tutup"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        <div className="relative min-h-[320px] overflow-hidden border-b border-white/10 lg:min-h-full lg:border-b-0 lg:border-r lg:border-white/10">
          <img
            src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`}
            alt={game.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent lg:bg-gradient-to-r lg:from-zinc-950 lg:via-zinc-950/30 lg:to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.28)_45%,rgba(0,0,0,0.65)_100%)] lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.42)_100%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-orange-300 backdrop-blur-md">
                {Math.round((game.score || 0) * 100)}% Match
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-white/45">Fuzzy System Report</p>
                <h2 className="max-w-[12ch] whitespace-normal break-words text-4xl font-black uppercase tracking-tighter text-white drop-shadow-[0_12px_25px_rgba(0,0,0,0.6)] lg:text-6xl">
                  {game.name}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-zinc-950">
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6 lg:px-8 lg:py-8 custom-scrollbar min-h-0">
            <div className="space-y-7 lg:space-y-8">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
                    Source Input
                  </div>
                  <div className="text-xs text-zinc-500">Input aktual yang dipakai engine fuzzy untuk game ini.</div>
                </div>

                {game.raw ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Total Playtime</p>
                      <p className="mt-2 text-lg font-black text-white">{formatHours(game.raw.playtime_forever)}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{game.raw.playtime_forever} menit mentah</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Recent Activity</p>
                      <p className="mt-2 text-lg font-black text-white">{formatHours(game.raw.playtime_2weeks)}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">Aktivitas 2 minggu terakhir</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Last Played</p>
                      <p className="mt-2 text-lg font-black text-white">{formatLastPlayed(game.raw.rtime_last_played)}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">Recency dari waktu terakhir main</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Tag Similarity</p>
                      <p className="mt-2 text-lg font-black text-white">{Math.round((game.source?.tagSimilarity || 0) * 100)}%</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{game.source?.matchedTags?.slice(0, 4).join(', ') || 'Tidak ada tag cocok'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Steam Reviews</p>
                      <p className="mt-2 text-lg font-black text-white">{Math.round((game.source?.reviewPositivity || 0) * 100)}% positif</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{(game.source?.reviewVolume || 0).toLocaleString('id-ID')} total review</p>
                    </div>
                  </div>
                )}
              </div>

              <section className="space-y-4">
                <SectionTitle title="Game Metadata" subtitle="Publisher dan tag yang sudah difilter dari kategori teknis Steam." />

                <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Publisher</p>
                      {loading ? (
                        <div className="mt-2 h-5 w-40 animate-pulse rounded bg-white/10" />
                      ) : (
                        <p className="mt-2 text-lg font-bold text-white">{details?.publishers?.join(', ') || '-'}</p>
                      )}
                    </div>
                    <div className="max-w-[18rem] text-right text-[11px] leading-relaxed text-zinc-500">
                      Publisher di sini hanya berperan sebagai sinyal pendukung, bukan penentu utama skor.
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Genres / Tags</p>
                    {loading ? (
                      <div className="flex flex-wrap gap-2">
                        <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
                        <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
                        <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
                      </div>
                    ) : normalizedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {normalizedTags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">Tidak ada tag yang relevan.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <SectionTitle
                  title="Fuzzy Calculation"
                  subtitle="Alur lengkap dari input mentah, fuzzifikasi, inference engine, sampai skor output."
                />

                {fuzzyLatex ? (
                  <div className="space-y-8">
                    <div>
                      <SubtleLabel>1. Input</SubtleLabel>
                      <LatexBlock>{fuzzyLatex.input}</LatexBlock>
                    </div>

                    <div>
                      <SubtleLabel>2. Fuzzifikasi</SubtleLabel>
                      <LatexBlock>{fuzzyLatex.fuzzification}</LatexBlock>
                    </div>

                    <div>
                      <SubtleLabel>3. Inference Engine</SubtleLabel>
                      <LatexBlock>{fuzzyLatex.inference}</LatexBlock>
                    </div>

                    <div>
                      <SubtleLabel>4. Defuzzifikasi</SubtleLabel>
                      <LatexBlock>{fuzzyLatex.defuzzification}</LatexBlock>
                    </div>
                  </div>
                ) : (
                  <LatexBlock>{'\\[\\text{Data proses fuzzy belum tersedia.}\\]'}</LatexBlock>
                )}

                <a
                  href={`https://store.steampowered.com/app/${game.appId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black transition hover:bg-orange-400"
                >
                  Lihat Game
                </a>

                {fuzzyProcess?.defuzzification && (
                  <div className={`mt-4 rounded-xl border p-4 ${fuzzyProcess.defuzzification.usedFallback ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${fuzzyProcess.defuzzification.usedFallback ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${fuzzyProcess.defuzzification.usedFallback ? 'text-red-400' : 'text-emerald-400'}`}>
                        {fuzzyProcess.defuzzification.usedFallback ? 'Calculation Mode: Fallback Active' : 'Calculation Mode: Normal Inference'}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      {fuzzyProcess.defuzzification.usedFallback 
                        ? 'Sistem tidak menemukan rule yang cocok dengan kriteria game ini, menggunakan nilai default (0.5/0.0) sebagai pengaman.' 
                        : 'Engine berhasil mencocokkan input dengan rule-rule fuzzy yang ada untuk menghasilkan skor yang akurat.'}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
