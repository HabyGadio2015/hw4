type Mood = 'idle' | 'listening' | 'thinking'

// An original cartoon bulldog (not the university's mascot). Its mood changes how it moves (see App.css):
// idle = slow tail wag and blinking, listening = ears perk up, thinking = fast wag, eyes up, panting.
export default function Bulldog({ mood = 'idle', className = '' }: { mood?: Mood; className?: string }) {
  return (
    <svg className={`bulldog ${className}`} data-mood={mood} viewBox="0 0 100 100" aria-hidden="true">
      <g className="bd-tail">
        <path d="M72 88 q16 -2 14 -20" fill="none" stroke="#d9b182" strokeWidth="8" strokeLinecap="round" />
      </g>
      <path d="M22 100 Q22 72 50 70 Q78 72 78 100 Z" fill="#e6c496" />
      <path d="M32 80 L50 99 L68 80 Q50 87 32 80 Z" fill="#00356b" />
      <circle cx="46" cy="86" r="1.6" fill="#fff" />
      <circle cx="54" cy="86" r="1.6" fill="#fff" />
      <circle cx="50" cy="92" r="1.6" fill="#fff" />
      <path className="bd-ear bd-ear-l" d="M24 40 Q10 22 28 20 Q36 28 34 44 Z" fill="#c4935d" />
      <path className="bd-ear bd-ear-r" d="M76 40 Q90 22 72 20 Q64 28 66 44 Z" fill="#c4935d" />
      <ellipse cx="50" cy="48" rx="29" ry="26" fill="#e6c496" />
      <ellipse cx="50" cy="60" rx="19" ry="13" fill="#f7ead6" />
      <ellipse className="bd-tongue" cx="50" cy="68" rx="4" ry="5" fill="#e8738a" />
      <path d="M50 56 V62 M50 62 Q43 69 36 63 M50 62 Q57 69 64 63" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="50" cy="52" rx="6.5" ry="4.5" fill="#2b2b2b" />
      <g className="bd-eye">
        <circle cx="39" cy="42" r="4.2" fill="#fff" />
        <circle className="bd-pupil" cx="39" cy="42" r="2.6" fill="#1b1b1b" />
      </g>
      <g className="bd-eye">
        <circle cx="61" cy="42" r="4.2" fill="#fff" />
        <circle className="bd-pupil" cx="61" cy="42" r="2.6" fill="#1b1b1b" />
      </g>
      <path d="M33 35 Q39 32 45 35 M55 35 Q61 32 67 35" fill="none" stroke="#9a6b3e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
