import React from 'react'
import {
  lineDrawings,
  lineDrawingsBack,
  lineDrawingsFront,
} from '@freesewing/react/components/LineDrawing'
import { capitalize } from '@freesewing/utils'

/*
 * Use this to auto-generate content in this file
export const Generate = () => {
  const output = []
  // Imports (for readme.mdx)
  output.push(
    `import {`,
    ...Object.keys(lineDrawings).map(d => `  ${capitalize(d)}Example,`),
    ...Object.keys(lineDrawingsFront).map(d => `  ${capitalize(d)}FrontExample,`),
    ...Object.keys(lineDrawingsBack).map(d => `  ${capitalize(d)}BackExample,`),
    `} from './_examples.js'`,
  )

  // List (for readme.mdx)
  output.push(
    `\n\n`,
    ...[
      ...Object.keys(lineDrawings).map(d => `  - [${capitalize(d)}](#${d})`),
      ...Object.keys(lineDrawingsFront).map(d => `  - [${capitalize(d)}Front](#${d}front)`),
      ...Object.keys(lineDrawingsBack).map(d => `  - [${capitalize(d)}Back](#${d}back)`),
    ].sort()
  )

  // Docs (for readme.mdx)
  output.push(
    `\n\n`,
    ...[
      ...Object.keys(lineDrawings).map(d => `## ${capitalize(d)}\n<ComponentDocs docs={jsdoc.jsdoc${capitalize(d)}} example={${capitalize(d)}Example} />\n`),
      ...Object.keys(lineDrawingsFront).map(d => `## ${capitalize(d)}Front\n<ComponentDocs docs={jsdoc.jsdoc${capitalize(d)}Front} example={${capitalize(d)}FrontExample} />\n`),
      ...Object.keys(lineDrawingsBack).map(d => `## ${capitalize(d)}Back\n<ComponentDocs docs={jsdoc.jsdoc${capitalize(d)}Back} example={${capitalize(d)}BackExample} />\n`),
    ].sort()
  )

  // Exports (for _examples.js)
  output.push(
    [
      ...Object.keys(lineDrawings).map(d => `export const ${capitalize(d)}Example = () => <LineDrawingExample design="${d}" />`),
      ...Object.keys(lineDrawingsFront).map(d => `export const ${capitalize(d)}FrontExample = () => <LineDrawingExample design="${d}" side="front" />`),
      ...Object.keys(lineDrawingsBack).map(d => `export const ${capitalize(d)}BackExample = () => <LineDrawingExample design="${d}" side="back" />`),
    ].sort().join("\n")
  )

  return <pre>{output.join("\n")}</pre>
}
 */

const NotFound = () => <p>No such linedrawing</p>

const LineDrawingExample = ({ design, side=false }) => {
  let Component = NotFound
  if (side === 'back' && lineDrawingsBack[design]) Component = lineDrawingsBack[design]
  else if (side === 'front' && lineDrawingsFront[design]) Component = lineDrawingsFront[design]
  else if (lineDrawings[design]) Component = lineDrawings[design]

  return <Component {...{ side, design }} />
}

export const AaronBackExample = () => <LineDrawingExample design="aaron" side="back" />
export const AaronExample = () => <LineDrawingExample design="aaron" />
export const AaronFrontExample = () => <LineDrawingExample design="aaron" side="front" />
export const AlbertExample = () => <LineDrawingExample design="albert" />
export const AlbertFrontExample = () => <LineDrawingExample design="albert" side="front" />
export const BeeExample = () => <LineDrawingExample design="bee" />
export const BeeFrontExample = () => <LineDrawingExample design="bee" side="front" />
export const BellaBackExample = () => <LineDrawingExample design="bella" side="back" />
export const BellaExample = () => <LineDrawingExample design="bella" />
export const BellaFrontExample = () => <LineDrawingExample design="bella" side="front" />
export const BenjaminExample = () => <LineDrawingExample design="benjamin" />
export const BenjaminFrontExample = () => <LineDrawingExample design="benjamin" side="front" />
export const BentBackExample = () => <LineDrawingExample design="bent" side="back" />
export const BentExample = () => <LineDrawingExample design="bent" />
export const BentFrontExample = () => <LineDrawingExample design="bent" side="front" />
export const BibiBackExample = () => <LineDrawingExample design="bibi" side="back" />
export const BibiExample = () => <LineDrawingExample design="bibi" />
export const BibiFrontExample = () => <LineDrawingExample design="bibi" side="front" />
export const BobBackExample = () => <LineDrawingExample design="bob" side="back" />
export const BobExample = () => <LineDrawingExample design="bob" />
export const BobFrontExample = () => <LineDrawingExample design="bob" side="front" />
export const BreannaBackExample = () => <LineDrawingExample design="breanna" side="back" />
export const BreannaExample = () => <LineDrawingExample design="breanna" />
export const BreannaFrontExample = () => <LineDrawingExample design="breanna" side="front" />
export const BrianBackExample = () => <LineDrawingExample design="brian" side="back" />
export const BrianExample = () => <LineDrawingExample design="brian" />
export const BrianFrontExample = () => <LineDrawingExample design="brian" side="front" />
export const BruceBackExample = () => <LineDrawingExample design="bruce" side="back" />
export const BruceExample = () => <LineDrawingExample design="bruce" />
export const BruceFrontExample = () => <LineDrawingExample design="bruce" side="front" />
export const CarlitaBackExample = () => <LineDrawingExample design="carlita" side="back" />
export const CarlitaExample = () => <LineDrawingExample design="carlita" />
export const CarlitaFrontExample = () => <LineDrawingExample design="carlita" side="front" />
export const CarltonBackExample = () => <LineDrawingExample design="carlton" side="back" />
export const CarltonExample = () => <LineDrawingExample design="carlton" />
export const CarltonFrontExample = () => <LineDrawingExample design="carlton" side="front" />
export const CathrinBackExample = () => <LineDrawingExample design="cathrin" side="back" />
export const CathrinExample = () => <LineDrawingExample design="cathrin" />
export const CathrinFrontExample = () => <LineDrawingExample design="cathrin" side="front" />
export const CharlieBackExample = () => <LineDrawingExample design="charlie" side="back" />
export const CharlieExample = () => <LineDrawingExample design="charlie" />
export const CharlieFrontExample = () => <LineDrawingExample design="charlie" side="front" />
export const CorneliusBackExample = () => <LineDrawingExample design="cornelius" side="back" />
export const CorneliusExample = () => <LineDrawingExample design="cornelius" />
export const CorneliusFrontExample = () => <LineDrawingExample design="cornelius" side="front" />
export const DianaBackExample = () => <LineDrawingExample design="diana" side="back" />
export const DianaExample = () => <LineDrawingExample design="diana" />
export const DianaFrontExample = () => <LineDrawingExample design="diana" side="front" />
export const FlorenceExample = () => <LineDrawingExample design="florence" />
export const FlorenceFrontExample = () => <LineDrawingExample design="florence" side="front" />
export const FlorentExample = () => <LineDrawingExample design="florent" />
export const FlorentFrontExample = () => <LineDrawingExample design="florent" side="front" />
export const GozerBackExample = () => <LineDrawingExample design="gozer" side="back" />
export const GozerExample = () => <LineDrawingExample design="gozer" />
export const GozerFrontExample = () => <LineDrawingExample design="gozer" side="front" />
export const HiExample = () => <LineDrawingExample design="hi" />
export const HiFrontExample = () => <LineDrawingExample design="hi" side="front" />
export const HolmesExample = () => <LineDrawingExample design="holmes" />
export const HolmesFrontExample = () => <LineDrawingExample design="holmes" side="front" />
export const HortensiaExample = () => <LineDrawingExample design="hortensia" />
export const HortensiaFrontExample = () => <LineDrawingExample design="hortensia" side="front" />
export const HueyBackExample = () => <LineDrawingExample design="huey" side="back" />
export const HueyExample = () => <LineDrawingExample design="huey" />
export const HueyFrontExample = () => <LineDrawingExample design="huey" side="front" />
export const HugoBackExample = () => <LineDrawingExample design="hugo" side="back" />
export const HugoExample = () => <LineDrawingExample design="hugo" />
export const HugoFrontExample = () => <LineDrawingExample design="hugo" side="front" />
export const JaneBackExample = () => <LineDrawingExample design="jane" side="back" />
export const JaneExample = () => <LineDrawingExample design="jane" />
export const JaneFrontExample = () => <LineDrawingExample design="jane" side="front" />
export const LucyExample = () => <LineDrawingExample design="lucy" />
export const LucyFrontExample = () => <LineDrawingExample design="lucy" side="front" />
export const LuminaBackExample = () => <LineDrawingExample design="lumina" side="back" />
export const LuminaExample = () => <LineDrawingExample design="lumina" />
export const LuminaFrontExample = () => <LineDrawingExample design="lumina" side="front" />
export const LumiraBackExample = () => <LineDrawingExample design="lumira" side="back" />
export const LumiraExample = () => <LineDrawingExample design="lumira" />
export const LumiraFrontExample = () => <LineDrawingExample design="lumira" side="front" />
export const LunetiusExample = () => <LineDrawingExample design="lunetius" />
export const LunetiusFrontExample = () => <LineDrawingExample design="lunetius" side="front" />
export const NobleBackExample = () => <LineDrawingExample design="noble" side="back" />
export const NobleExample = () => <LineDrawingExample design="noble" />
export const NobleFrontExample = () => <LineDrawingExample design="noble" side="front" />
export const SimonBackExample = () => <LineDrawingExample design="simon" side="back" />
export const SimonExample = () => <LineDrawingExample design="simon" />
export const SimonFrontExample = () => <LineDrawingExample design="simon" side="front" />
export const TeaganBackExample = () => <LineDrawingExample design="teagan" side="back" />
export const TeaganExample = () => <LineDrawingExample design="teagan" />
export const TeaganFrontExample = () => <LineDrawingExample design="teagan" side="front" />
export const TristanBackExample = () => <LineDrawingExample design="tristan" side="back" />
export const TristanExample = () => <LineDrawingExample design="tristan" />
export const TristanFrontExample = () => <LineDrawingExample design="tristan" side="front" />
export const UmaBackExample = () => <LineDrawingExample design="uma" side="back" />
export const UmaExample = () => <LineDrawingExample design="uma" />
export const UmaFrontExample = () => <LineDrawingExample design="uma" side="front" />
export const UmbraBackExample = () => <LineDrawingExample design="umbra" side="back" />
export const UmbraExample = () => <LineDrawingExample design="umbra" />
export const UmbraFrontExample = () => <LineDrawingExample design="umbra" side="front" />
export const WahidBackExample = () => <LineDrawingExample design="wahid" side="back" />
export const WahidExample = () => <LineDrawingExample design="wahid" />
export const WahidFrontExample = () => <LineDrawingExample design="wahid" side="front" />
