import { Language } from './trans'
import { TurningLimit, TurningCards } from 'lsolitaire'

export let limit_settings: Array<TurningLimit> = ['nolimit', 'threepass', 'onepass']
export let cards_settings: Array<TurningCards> = ['threecards', 'onecard']

class SolitaireStore {

  get cards() {
    return 'threecards'
  }

  set cards(_: TurningCards) {
  }

  get limit() {
    return 'nolimit'
  }

  set limit(_: TurningLimit) {
  }
}


class GeneralStore {

  get language() {
    return 'en'
  }

  set language(_: Language) {
  }

}

let solitaire = new SolitaireStore()
let general = new GeneralStore()

export { solitaire as SolitaireStore }
export { general as GeneralStore }

