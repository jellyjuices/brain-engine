import { contrastPairs } from '../tokens/index.ts'
import { ratio } from '../tokens/contrast.ts'
import { hexOf } from '../tokens/resolve.ts'
import { checkMix, combos } from '../tokens/mix-check.ts'

let failed = 0
for (const mode of ['dark', 'light'] as const) {
  console.log(`\n${mode}`)
  for (const p of contrastPairs) {
    const bg = hexOf(p.bg, mode)
    const r = ratio(hexOf([...p.bg, p.fg], mode), bg)
    const ok = r >= p.min
    if (!ok) failed++
    if (!ok || process.argv.includes('--all'))
      console.log(`${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${p.min})  ${p.label}`)
  }
}
let mixChecks = 0
let mixWorst = Infinity
for (const mode of ['dark', 'light'] as const) {
  for (const areas of [...combos(1), ...combos(2), ...combos(3)]) {
    for (const r of checkMix(areas, mode)) {
      mixChecks++
      mixWorst = Math.min(mixWorst, r.worst)
      if (r.worst < 4.5) {
        failed++
        console.log(`FAIL  ${r.worst.toFixed(2)}:1  ${mode} ${r.areas.join(' + ')} ${r.part} ${r.text} at ${r.at}`)
      }
    }
  }
}
console.log(`\nMixes: ${mixChecks} checks (mixes of 1 to 3 areas, worst point of each oklch gradient, with text-zone noise), lowest ${mixWorst.toFixed(2)}:1`)
console.log(failed ? `\n${failed} failed` : `\nAll ${contrastPairs.length * 2} pairs and ${mixChecks} mix checks pass WCAG 2.1 AA`)
process.exit(failed ? 1 : 0)
