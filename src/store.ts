import { Language } from './trans'
import { TurningLimit, TurningCards, Settings, Solitaire, Cards } from 'lsolitaire'

import { StoredJsonProp, storedJsonProp } from './storage'

export let limit_settings: Array<TurningLimit> = ['nolimit', 'threepass', 'onepass']
export let cards_settings: Array<TurningCards> = ['threecards', 'onecard']


class SolitaireStore {

  get cards() {
    return this._cards()
  }

  set cards(_: TurningCards) {
    this._cards(_)
  }


  _cards!: StoredJsonProp<TurningCards>


  get limit() {
    return this._limit()
  }

  set limit(_: TurningLimit) {
    this._limit(_)
  }

  _limit!: StoredJsonProp<TurningLimit>


  get general_settings(): Settings {
    let { limit, cards } = this
    return { limit, cards }
  }

  constructor() {
    let def_cards: TurningCards = 'threecards'
    this._cards = storedJsonProp('cards', () => def_cards)

    let def_limit: TurningLimit = 'nolimit'
    this._limit = storedJsonProp('limit', () => def_limit)
  }
}



class GeneralStore {


  get music() {
    return this._music()
  }

  set music(_: boolean) {
    this._music(_)
  }

  _music: StoredJsonProp<boolean>




  get sound() {
    return this._sound()
  }

  set sound(_: boolean) {
    this._sound(_)
  }

  _sound: StoredJsonProp<boolean>




  get language() {
    return this._language()
  }

  set language(_: Language) {
    this._language(_)
  }

  _language: StoredJsonProp<Language>

  constructor() {

    let def_language: Language = 'en'

    this._language = storedJsonProp('language', () => def_language)

    this._sound = storedJsonProp('sound', () => true)
    this._music = storedJsonProp('music', () => true)
  }
}

let solitaire = new SolitaireStore()
let general = new GeneralStore()

export { solitaire as SolitaireStore }
export { general as GeneralStore }

