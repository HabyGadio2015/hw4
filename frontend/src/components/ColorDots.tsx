import { colorToCss } from '../colors'

// The item's real colors from the catalogue, as swatches with names. They show what exists; they are not a picker.
export default function ColorDots({ colors }: { colors: string[] }) {
  return (
    <ul className="color-dots">
      {colors.map((name) => {
        const css = colorToCss(name)
        return (
          <li key={name}>
            {css && <span className="color-dot" style={{ background: css }} aria-hidden="true" />}
            {name}
          </li>
        )
      })}
    </ul>
  )
}
