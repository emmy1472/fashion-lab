import { Aaron, AaronFront, AaronBack } from './aaron.mjs'
import { Albert, AlbertFront } from './albert.mjs'
import { Bee, BeeFront } from './bee.mjs'
import { Bella, BellaFront, BellaBack } from './bella.mjs'
import { Benjamin, BenjaminFront } from './benjamin.mjs'
import { Bent, BentFront, BentBack } from './bent.mjs'
import { Bibi, BibiFront, BibiBack } from './bibi.mjs'
import { Bob, BobFront, BobBack } from './bob.mjs'
import { Breanna, BreannaFront, BreannaBack } from './breanna.mjs'
import { Brian, BrianFront, BrianBack } from './brian.mjs'
import { Bruce, BruceFront, BruceBack } from './bruce.mjs'
import { Carlita, CarlitaFront, CarlitaBack } from './carlita.mjs'
import { Carlton, CarltonFront, CarltonBack } from './carlton.mjs'
import { Cathrin, CathrinFront, CathrinBack } from './cathrin.mjs'
import { Charlie, CharlieFront, CharlieBack } from './charlie.mjs'
import { Cornelius, CorneliusFront, CorneliusBack } from './cornelius.mjs'
import { Devon, DevonFront /*, DevonBack*/ } from './devon.mjs'
import { Diana, DianaFront, DianaBack } from './diana.mjs'
import { Florence, FlorenceFront } from './florence.mjs'
import { Florent, FlorentFront } from './florent.mjs'
import { Gozer, GozerFront, GozerBack } from './gozer.mjs'
import { Hi, HiFront } from './hi.mjs'
import { Holmes, HolmesFront } from './holmes.mjs'
import { Hortensia, HortensiaFront } from './hortensia.mjs'
import { Huey, HueyFront, HueyBack } from './huey.mjs'
import { Hugo, HugoFront, HugoBack } from './hugo.mjs'
import { Jane, JaneFront, JaneBack } from './jane.mjs'
import { Jett, JettFront, JettBack } from './jett.mjs'
import { Lucy, LucyFront } from './lucy.mjs'
import { Lumina, LuminaFront, LuminaBack } from './lumina.mjs'
import { Lumira, LumiraFront, LumiraBack } from './lumira.mjs'
import { Lunetius, LunetiusFront } from './lunetius.mjs'
import { Noble, NobleFront, NobleBack } from './noble.mjs'
import { Sabrina, SabrinaFront, SabrinaBack } from './sabrina.mjs'
import { Simon, SimonFront, SimonBack } from './simon.mjs'
import { Teagan, TeaganFront, TeaganBack } from './teagan.mjs'
import { Tristan, TristanFront, TristanBack } from './tristan.mjs'
import { Uma, UmaFront, UmaBack } from './uma.mjs'
import { Umbra, UmbraFront, UmbraBack } from './umbra.mjs'
import { Wahid, WahidFront, WahidBack } from './wahid.mjs'

/**
 * An object where the key is the design name and the value the front LineDrawing component
 *
 * @constant
 * @public
 */
export const lineDrawingsFront = {
  aaron: AaronFront,
  albert: AlbertFront,
  bee: BeeFront,
  bella: BellaFront,
  benjamin: BenjaminFront,
  bent: BentFront,
  bibi: BibiFront,
  bob: BobFront,
  breanna: BreannaFront,
  brian: BrianFront,
  bruce: BruceFront,
  carlita: CarlitaFront,
  carlton: CarltonFront,
  cathrin: CathrinFront,
  charlie: CharlieFront,
  cornelius: CorneliusFront,
  devon: DevonFront,
  diana: DianaFront,
  florence: FlorenceFront,
  florent: FlorentFront,
  gozer: GozerFront,
  hi: HiFront,
  holmes: HolmesFront,
  hortensia: HortensiaFront,
  huey: HueyFront,
  hugo: HugoFront,
  jane: JaneFront,
  jett: JettFront,

  lucy: LucyFront,
  lumina: LuminaFront,
  lumira: LumiraFront,
  lunetius: LunetiusFront,
  noble: NobleFront,

  sabrina: SabrinaFront,
  simon: SimonFront,

  teagan: TeaganFront,

  tristan: TristanFront,
  uma: UmaFront,
  umbra: UmbraFront,
  wahid: WahidFront,
}

/**
 * An object where the key is the design name and the value the back LineDrawing component
 *
 * @constant
 * @public
 */
export const lineDrawingsBack = {
  aaron: AaronBack,
  bella: BellaBack,
  bent: BentBack,
  bibi: BibiBack,
  bob: BobBack,
  breanna: BreannaBack,
  brian: BrianBack,
  bruce: BruceBack,
  carlita: CarlitaBack,
  carlton: CarltonBack,
  cathrin: CathrinBack,
  charlie: CharlieBack,
  cornelius: CorneliusBack,
  /*devon: DevonBack,*/
  diana: DianaBack,
  gozer: GozerBack,
  huey: HueyBack,
  hugo: HugoBack,
  jane: JaneBack,
  jett: JettBack,
  lumina: LuminaBack,
  lumira: LumiraBack,
  noble: NobleBack,
  sabrina: SabrinaBack,
  simon: SimonBack,
  teagan: TeaganBack,
  tristan: TristanBack,
  uma: UmaBack,
  umbra: UmbraBack,
  wahid: WahidBack,
}

/**
 * An object where the key is the design name and the value the full LineDrawing component
 *
 * @constant
 * @public
 */
export const lineDrawings = {
  aaron: Aaron,
  albert: Albert,
  bee: Bee,
  bella: Bella,
  benjamin: Benjamin,
  bent: Bent,
  bibi: Bibi,
  bob: Bob,
  breanna: Breanna,
  brian: Brian,
  bruce: Bruce,
  carlita: Carlita,
  carlton: Carlton,
  cathrin: Cathrin,
  charlie: Charlie,
  cornelius: Cornelius,
  devon: Devon,
  diana: Diana,
  florence: Florence,
  florent: Florent,
  gozer: Gozer,
  hi: Hi,
  holmes: Holmes,
  hortensia: Hortensia,
  huey: Huey,
  hugo: Hugo,
  jane: Jane,
  jett: Jett,
  lucy: Lucy,
  lumina: Lumina,
  lumira: Lumira,
  lunetius: Lunetius,
  noble: Noble,
  sabrina: Sabrina,
  simon: Simon,
  teagan: Teagan,
  tristan: Tristan,
  uma: Uma,
  umbra: Umbra,
  wahid: Wahid,
}

/*
 * Named exports
 */
export {
  // Aaron
  Aaron,
  AaronFront,
  AaronBack,
  // Albert
  Albert,
  AlbertFront,
  // Bee
  Bee,
  BeeFront,
  // Bella
  Bella,
  BellaFront,
  BellaBack,
  // Benjamin
  Benjamin,
  BenjaminFront,
  // Bent
  Bent,
  BentFront,
  BentBack,
  // Bibi
  Bibi,
  BibiFront,
  BibiBack,
  // Bob
  Bob,
  BobFront,
  BobBack,
  // Breanna
  Breanna,
  BreannaFront,
  BreannaBack,
  // Brian
  Brian,
  BrianFront,
  BrianBack,
  // Bruce
  Bruce,
  BruceFront,
  BruceBack,
  // Carlita
  Carlita,
  CarlitaFront,
  CarlitaBack,
  // Carlton
  Carlton,
  CarltonFront,
  CarltonBack,
  // Cathrin
  Cathrin,
  CathrinFront,
  CathrinBack,
  // Charlie
  Charlie,
  CharlieFront,
  CharlieBack,
  // Cornelius
  Cornelius,
  CorneliusFront,
  CorneliusBack,
  // Devon
  Devon,
  DevonFront,
  /*DevonBack,*/
  // Diana
  Diana,
  DianaFront,
  DianaBack,
  // Florence
  Florence,
  FlorenceFront,
  // Florent
  Florent,
  FlorentFront,
  // Gozer
  Gozer,
  GozerFront,
  GozerBack,
  // Hi
  Hi,
  HiFront,
  // Holmes
  Holmes,
  HolmesFront,
  // Hortensia
  Hortensia,
  HortensiaFront,
  // Huey
  Huey,
  HueyFront,
  HueyBack,
  // Hugo
  Hugo,
  HugoFront,
  HugoBack,
  // Jane
  Jane,
  JaneFront,
  JaneBack,
  // Jett
  Jett,
  JettFront,
  JettBack,
  // Lucy
  Lucy,
  LucyFront,
  // Lumina
  Lumina,
  LuminaFront,
  LuminaBack,
  // Lumira
  Lumira,
  LumiraFront,
  LumiraBack,
  // Lunetius
  Lunetius,
  LunetiusFront,
  // Noble
  Noble,
  NobleFront,
  NobleBack,
  // Simon
  Simon,
  SimonFront,
  SimonBack,
  // Teagan
  Teagan,
  TeaganFront,
  TeaganBack,
  // Tristan
  Tristan,
  TristanFront,
  TristanBack,
  // Uma
  Uma,
  UmaFront,
  UmaBack,
  // Umbra
  Umbra,
  UmbraFront,
  UmbraBack,
  // Wahid
  Wahid,
  WahidFront,
  WahidBack,
}
