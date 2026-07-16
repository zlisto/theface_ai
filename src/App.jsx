import { useEffect, useRef, useState } from 'react'
import Labubu, { MOODS } from './Labubu.jsx'
import './App.css'

const LABUBU_COLORS = [
  '#5c3d2e',
  '#c45c26',
  '#3d5c4a',
  '#7a4a2e',
  '#4a6fa5',
  '#8b3a62',
  '#2f6b5a',
  '#b8860b',
  '#6b4c7a',
  '#a0522d',
]

const LABUBU_MOODS = Object.keys(MOODS)
const MAX_LABUBUS = 20

const POSE_PROMPTS = [
  'Be serious',
  'Be sexy',
  'Strike a casual look',
  'Look powerful',
  'Soft smile, editorial vibe',
  'Mysterious side glance',
  'Confident runway stare',
  'Playful and charming',
  'Cool and unbothered',
  'Sharp fashion intensity',
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pickThreePrompts() {
  const shuffled = [...POSE_PROMPTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function randomLabubu() {
  return {
    id: crypto.randomUUID(),
    color: LABUBU_COLORS[Math.floor(Math.random() * LABUBU_COLORS.length)],
    mood: LABUBU_MOODS[Math.floor(Math.random() * LABUBU_MOODS.length)],
    size: 56 + Math.floor(Math.random() * 28),
    left: 4 + Math.random() * 84,
    bottom: 2 + Math.random() * 28,
    delay: -Math.random() * 2.5,
  }
}

const STARTER_LABUBUS = [
  {
    id: 'starter-a',
    color: '#5c3d2e',
    mood: 'happy',
    size: 74,
    left: 12,
    bottom: 10,
    delay: 0,
  },
  {
    id: 'starter-b',
    color: '#c45c26',
    mood: 'mischievous',
    size: 82,
    left: 44,
    bottom: 2,
    delay: -0.9,
  },
  {
    id: 'starter-c',
    color: '#3d5c4a',
    mood: 'sleepy',
    size: 68,
    left: 78,
    bottom: 12,
    delay: -1.6,
  },
]

function Crab({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 40" aria-hidden="true">
      <ellipse cx="32" cy="22" rx="14" ry="10" fill="#e85d4c" />
      <circle cx="26" cy="18" r="2.5" fill="#1a3a4a" />
      <circle cx="38" cy="18" r="2.5" fill="#1a3a4a" />
      <path
        d="M18 16c-6-8-12-4-10 2M46 16c6-8 12-4 10 2"
        fill="none"
        stroke="#e85d4c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 30l-6 6M26 32l-2 7M38 32l2 7M44 30l6 6"
        stroke="#c44738"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="14" width="36" height="24" rx="5" fill="#2dd4bf" />
      <circle cx="24" cy="26" r="8" fill="#0a0a0a" />
      <circle cx="24" cy="26" r="4" fill="#2dd4bf" />
      <rect x="16" y="10" width="16" height="6" rx="2" fill="#2dd4bf" />
      <circle cx="36" cy="20" r="2" fill="#fff" />
    </svg>
  )
}

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const busyRef = useRef(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | shooting | evaluating | results
  const [prompt, setPrompt] = useState('')
  const [poseIndex, setPoseIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [shots, setShots] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [labubus, setLabubus] = useState(STARTER_LABUBUS)

  function addLabubu() {
    setLabubus((current) => {
      if (current.length >= MAX_LABUBUS) return []
      return [...current, randomLabubu()]
    })
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function grabFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  async function openCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
    setCameraOn(true)
  }

  async function evaluateShots(captured) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey || apiKey === 'paste_your_key_here') {
      throw new Error('Add your OpenAI API key to the .env file, then restart the dev server.')
    }

    const content = [
      {
        type: 'text',
        text: `You are a sharp but supportive modeling mentor on a Thai fashion reality show vibe (like The Face Men).
The model completed 3 directed poses. For each pose, judge how well the photo matches the instruction.

Return ONLY valid JSON object shaped like:
{
  "evaluations": [
    { "prompt": "...", "score": 1-10, "feedback": "2 short punchy sentences of mentor feedback" },
    { "prompt": "...", "score": 1-10, "feedback": "..." },
    { "prompt": "...", "score": 1-10, "feedback": "..." }
  ]
}

Poses:
1) "${captured[0].prompt}"
2) "${captured[1].prompt}"
3) "${captured[2].prompt}"`,
      },
      ...captured.flatMap((shot, i) => [
        { type: 'text', text: `Pose ${i + 1} instruction: ${shot.prompt}` },
        { type: 'image_url', image_url: { url: shot.photo } },
      ]),
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content }],
        max_tokens: 700,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error?.message || 'OpenAI request failed')
    }

    const raw = data.choices?.[0]?.message?.content?.trim() || '{}'
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Could not parse AI evaluation.')
    }

    const list = Array.isArray(parsed)
      ? parsed
      : parsed.evaluations || parsed.poses || parsed.results || Object.values(parsed).find(Array.isArray)

    if (!Array.isArray(list) || list.length < 3) {
      throw new Error('AI returned an unexpected evaluation format.')
    }

    return list.slice(0, 3).map((item, i) => ({
      prompt: item.prompt || captured[i].prompt,
      score: item.score ?? '—',
      feedback: item.feedback || item.comment || item.evaluation || 'No feedback.',
    }))
  }

  async function startShoot() {
    if (busyRef.current) return
    busyRef.current = true
    setError('')
    setEvaluations([])
    setShots([])
    setCountdown(null)
    setPrompt('')

    try {
      await openCamera()
      const prompts = pickThreePrompts()
      setPhase('shooting')
      const captured = []

      for (let i = 0; i < prompts.length; i++) {
        setPoseIndex(i)
        setPrompt(prompts[i])
        setCountdown(null)
        await sleep(2200)

        for (let n = 5; n >= 1; n--) {
          setCountdown(n)
          await sleep(1000)
        }

        setCountdown(0)
        const photo = grabFrame()
        if (!photo) throw new Error('Could not capture the frame.')
        captured.push({ prompt: prompts[i], photo })
        setShots([...captured])
        await sleep(500)
      }

      setPrompt('')
      setCountdown(null)
      setPhase('evaluating')
      setLoading(true)
      const verdicts = await evaluateShots(captured)
      setEvaluations(verdicts)
      setPhase('results')
    } catch (err) {
      setError(err.message || 'Shoot failed.')
      setPhase('idle')
    } finally {
      setLoading(false)
      busyRef.current = false
    }
  }

  const shooting = phase === 'shooting'
  const showResults = phase === 'results'
  const busy = shooting || phase === 'evaluating'

  return (
    <div className={`beach ${showResults ? 'results-mode' : ''}`}>
      <div className="sky">
        <div className="sun" aria-hidden="true" />
        <div className="seagull seagull-1" aria-hidden="true" />
        <div className="seagull seagull-2" aria-hidden="true" />
        <div className="seagull seagull-3" aria-hidden="true" />
      </div>

      <main className="stage">
        <header className="brand">
          <p className="brand-name">
            THE <span>FACE</span>
          </p>
          <h1>Casting Room · Mentor Panel</h1>
        </header>

        {!showResults && (
          <div className="viewfinder">
            <video
              ref={videoRef}
              className={`live ${cameraOn ? 'on' : ''}`}
              playsInline
              muted
            />
            {!cameraOn && phase === 'idle' && (
              <div className="placeholder">
                <p>Press Camera — your casting starts now</p>
              </div>
            )}

            {shooting && prompt && (
              <div className="directive">
                <span className="pose-chip">Challenge {poseIndex + 1} / 3</span>
                <p className="directive-text">{prompt}</p>
              </div>
            )}

            {shooting && countdown !== null && countdown > 0 && (
              <div className="countdown" key={countdown}>
                {countdown}
              </div>
            )}

            {shooting && countdown === 0 && <div className="flash" />}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden-canvas" />

        <div className="controls">
          <button
            type="button"
            className="action camera"
            onClick={startShoot}
            disabled={busy}
          >
            <CameraIcon />
            <span>
              {phase === 'evaluating'
                ? 'Judging…'
                : shooting
                  ? 'Shooting…'
                  : showResults
                    ? 'Reshoot'
                    : 'Camera'}
            </span>
          </button>
          <button type="button" className="action labubu-btn" onClick={addLabubu} disabled={busy}>
            <Labubu color="#5c3d2e" mood="happy" size={36} />
            <span>
              {labubus.length >= MAX_LABUBUS
                ? 'Clear all'
                : `+ Labubu (${labubus.length})`}
            </span>
          </button>
        </div>

        {phase === 'evaluating' && (
          <section className="result" aria-live="polite">
            <p>Mentors are judging your book…</p>
          </section>
        )}

        {error && (
          <section className="result" aria-live="polite">
            <p className="error">{error}</p>
          </section>
        )}

        {showResults && (
          <section className="critique-board" aria-live="polite">
            {shots.map((shot, i) => (
              <article className="critique-card" key={`${shot.prompt}-${i}`}>
                <img src={shot.photo} alt={`Pose: ${shot.prompt}`} className="critique-shot" />
                <div className="critique-copy">
                  <p className="critique-prompt">{shot.prompt}</p>
                  <p className="critique-score">
                    Score{' '}
                    <strong>{evaluations[i]?.score ?? '—'}</strong>
                    /10
                  </p>
                  <p className="critique-feedback">
                    {evaluations[i]?.feedback || (loading ? '…' : 'No feedback.')}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <div className="ocean" aria-hidden="true">
        <div className="wave wave-1" />
        <div className="wave wave-2" />
      </div>

      <div className="sand">
        {labubus.map((buddy) => (
          <Labubu
            key={buddy.id}
            className="labubu-spot"
            color={buddy.color}
            mood={buddy.mood}
            size={buddy.size}
            style={{
              left: `${buddy.left}%`,
              bottom: `${buddy.bottom}%`,
              animationDelay: `${buddy.delay}s`,
            }}
          />
        ))}
        <Crab className="crab crab-1" />
        <Crab className="crab crab-2" />
        <Crab className="crab crab-3" />
      </div>
    </div>
  )
}
