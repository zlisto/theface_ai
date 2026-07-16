function shade(hex, amount) {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = parseInt(full, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount))
  const b = Math.min(255, Math.max(0, (num & 255) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function Star({ cx, cy, size = 3.2 }) {
  const s = size
  return (
    <path
      d={`M${cx} ${cy - s}
        L${cx + s * 0.28} ${cy - s * 0.28}
        L${cx + s} ${cy}
        L${cx + s * 0.28} ${cy + s * 0.28}
        L${cx} ${cy + s}
        L${cx - s * 0.28} ${cy + s * 0.28}
        L${cx - s} ${cy}
        L${cx - s * 0.28} ${cy - s * 0.28} Z`}
      fill="#fff"
    />
  )
}

/** Sample a smile curve and hang upside-down triangle teeth from it. */
function SmileWithTeeth({
  startX,
  endX,
  y,
  curve,
  toothCount = 9,
  toothH = 7,
  toothW = 4.2,
  stroke = '#1a1a1a',
}) {
  const midX = (startX + endX) / 2
  const controlY = y + curve
  const points = []

  for (let i = 0; i < toothCount; i++) {
    const t = (i + 0.5) / toothCount
    // Quadratic Bezier: start -> (mid, controlY) -> end
    const x =
      (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX
    const py =
      (1 - t) * (1 - t) * y + 2 * (1 - t) * t * controlY + t * t * y
    points.push({ x, y: py })
  }

  const mouthPath = `M${startX} ${y} Q${midX} ${controlY} ${endX} ${y}`

  return (
    <g>
      {points.map((p, i) => (
        <polygon
          key={i}
          points={`${p.x - toothW / 2},${p.y} ${p.x + toothW / 2},${p.y} ${p.x},${p.y + toothH}`}
          fill="#fff"
          stroke={stroke}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      ))}
      <path
        d={mouthPath}
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  )
}

const MOODS = {
  happy: {
    eyeRy: 9.5,
    eyeOpen: true,
    curve: 14,
    toothCount: 9,
  },
  mischievous: {
    eyeRy: 8,
    eyeOpen: true,
    curve: 16,
    toothCount: 9,
    slant: true,
  },
  sleepy: {
    eyeRy: 2.2,
    eyeOpen: false,
    curve: 8,
    toothCount: 7,
  },
  surprised: {
    eyeRy: 11,
    eyeOpen: true,
    curve: 10,
    toothCount: 9,
  },
  grumpy: {
    eyeRy: 6.5,
    eyeOpen: true,
    curve: -6,
    toothCount: 7,
  },
  shy: {
    eyeRy: 7.5,
    eyeOpen: true,
    curve: 9,
    toothCount: 7,
  },
}

/**
 * Labubu — fur color + face mood.
 * Smile = single curve line with upside-down triangle teeth.
 */
export default function Labubu({
  color = '#5c3d2e',
  mood = 'happy',
  className = '',
  size = 88,
  style,
}) {
  const face = MOODS[mood] || MOODS.happy
  const fur = color
  const furDark = shade(fur, -30)
  const furLight = shade(fur, 40)
  const earInner = '#e8c4a8'
  const faceSkin = '#f3d3b8'
  const uid = `${color}-${mood}-${size}`.replace(/[^a-zA-Z0-9]/g, '')

  const leftEye = { cx: 38, cy: 48, rx: 6.2, ry: face.eyeRy }
  const rightEye = { cx: 62, cy: 48, rx: 6.2, ry: face.eyeRy }

  return (
    <svg
      className={`labubu ${className}`}
      width={size}
      height={size * 1.15}
      viewBox="0 0 100 118"
      role="img"
      aria-label={`Labubu, ${mood} mood`}
      style={style}
    >
      <defs>
        <radialGradient id={`fur-${uid}`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor={furLight} />
          <stop offset="50%" stopColor={fur} />
          <stop offset="100%" stopColor={furDark} />
        </radialGradient>
        {/* soft fur fringe around the face opening */}
        <filter id={`fuzz-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
        </filter>
      </defs>

      {/* legs */}
      <ellipse cx="36" cy="108" rx="11" ry="7" fill={`url(#fur-${uid})`} />
      <ellipse cx="64" cy="108" rx="11" ry="7" fill={`url(#fur-${uid})`} />

      {/* body */}
      <ellipse cx="50" cy="88" rx="28" ry="24" fill={`url(#fur-${uid})`} />

      {/* arms */}
      <ellipse cx="22" cy="86" rx="9" ry="12" fill={`url(#fur-${uid})`} transform="rotate(-18 22 86)" />
      <ellipse cx="78" cy="86" rx="9" ry="12" fill={`url(#fur-${uid})`} transform="rotate(18 78 86)" />
      <ellipse cx="18" cy="94" rx="5" ry="4" fill={furDark} />
      <ellipse cx="82" cy="94" rx="5" ry="4" fill={furDark} />

      {/* head fur hood */}
      <ellipse cx="50" cy="52" rx="34" ry="32" fill={`url(#fur-${uid})`} />

      {/* tall pointed ears */}
      <path
        d="M22 48 C14 28 18 6 28 4 C34 12 36 30 34 48 Z"
        fill={`url(#fur-${uid})`}
      />
      <path
        d="M78 48 C86 28 82 6 72 4 C66 12 64 30 66 48 Z"
        fill={`url(#fur-${uid})`}
      />
      <path d="M26 44 C22 28 24 12 28 10 C31 18 32 30 31 44 Z" fill={earInner} />
      <path d="M74 44 C78 28 76 12 72 10 C69 18 68 30 69 44 Z" fill={earInner} />

      {/* peach face plate */}
      <ellipse cx="50" cy="54" rx="24" ry="23" fill={faceSkin} />

      {/* blush */}
      <ellipse cx="32" cy="58" rx="5" ry="3" fill="#f0a090" opacity="0.55" />
      <ellipse cx="68" cy="58" rx="5" ry="3" fill="#f0a090" opacity="0.55" />

      {/* eyes */}
      {face.eyeOpen ? (
        <>
          <ellipse
            cx={leftEye.cx}
            cy={leftEye.cy}
            rx={leftEye.rx}
            ry={leftEye.ry}
            fill="#151515"
            transform={face.slant ? 'rotate(-8 38 48)' : undefined}
          />
          <ellipse
            cx={rightEye.cx}
            cy={rightEye.cy}
            rx={rightEye.rx}
            ry={rightEye.ry}
            fill="#151515"
            transform={face.slant ? 'rotate(8 62 48)' : undefined}
          />
          <Star cx={leftEye.cx - 1.2} cy={leftEye.cy - leftEye.ry * 0.35} size={2.8} />
          <Star cx={rightEye.cx - 1.2} cy={rightEye.cy - rightEye.ry * 0.35} size={2.8} />
          <circle cx={leftEye.cx + 2} cy={leftEye.cy + 2} r="1.1" fill="#fff" opacity="0.85" />
          <circle cx={rightEye.cx + 2} cy={rightEye.cy + 2} r="1.1" fill="#fff" opacity="0.85" />
        </>
      ) : (
        <>
          <path
            d="M31 48 Q38 45 45 48"
            fill="none"
            stroke="#151515"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M55 48 Q62 45 69 48"
            fill="none"
            stroke="#151515"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}

      {/* tiny black nose */}
      <ellipse cx="50" cy="58" rx="2.4" ry="1.7" fill="#151515" />

      {/* smile: curve line + upside-down triangle teeth */}
      <SmileWithTeeth
        startX={mood === 'shy' ? 36 : 30}
        endX={mood === 'shy' ? 64 : 70}
        y={66}
        curve={face.curve}
        toothCount={face.toothCount}
        toothH={face.curve < 0 ? 5 : 7.5}
        toothW={3.8}
      />

      {/* little chest tag like the plush */}
      <circle cx="50" cy="86" r="3.2" fill="#d8d8d8" stroke="#9a9a9a" strokeWidth="0.8" />
      <circle cx="50" cy="86" r="1.2" fill="#9a9a9a" />
    </svg>
  )
}

export { MOODS }
