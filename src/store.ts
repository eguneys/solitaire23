import { storedJsonProp, StoredJsonProp } from './storage'
import { SolitairePov, Solitaire, Cards, Settings as SolitaireSettings } from 'lsolitaire'
import { TurningCards, TurningLimit } from 'lsolitaire'
import Trans, { Language } from './trans'

export type GeneralData = {
  language: Language,
  sound: boolean
}

const default_general = {
  language: Trans.default_language,
  sound: true
}

export class General {
  static new = () => {
    return new General(default_general)
  }


  static from_data = (data: GeneralData) => {
    return new General(data)
  }

  get language() {
    return this.data.language
  }

  get sound() {
    return this.data.sound
  }

  set language(_: Language) {
    this.data.language = _
  }

  set sound(_: boolean) {
    this.data.sound = _
  }

  constructor(readonly data: GeneralData) {
  }
}



const default_settings = {
  cards: TurningCards.ThreeCards,
  limit: TurningLimit.NoLimit
}

export type SolitaireGamesData = {
  settings: SolitaireSettings
  games: Array<SolitaireGameData>
}


export class SolitaireGames {

  static new = (settings: SolitaireSettings) => {
    return new SolitaireGames(settings, [])
  }

  static from_data = (data: SolitaireGamesData) => {
    return new SolitaireGames(data.settings, data.games)
  }

  get data() {
    return {
      games: this.games,
      settings: this.settings
    }
  }

  add(game: SolitaireGameData) {
    let i = this.games.findIndex(_ => _.id === game.id)
    if (i !== -1) {
      this.games.splice(i, 1, game)
    } else {
      this.games.push(game)
    }
  }
  
  settings!: SolitaireSettings

  constructor(settings: SolitaireSettings,
              readonly games: Array<SolitaireGameData>) {
              
                this.settings = settings
              }

}



const s4 = () => {
  return Math.random().toString(36).substring(2, 10)
}

const gen_game_id = (): GameId => {
  return `game.${s4()}`
}
export type GameId = `game.${string}`

export enum GameStatus {
  Created,
  Started,
  Incomplete,
  Completed,
  Won,
}

export type SolitaireGameData = {
  fen: string,
  id: GameId,
  score: number,
  status: GameStatus
}


export class SolitaireGame {

  static new = (settings: SolitaireSettings) => {

    let id = gen_game_id()
    let solitaire = Solitaire.make(settings, Cards.deck)
    let res = new SolitaireGame(id, solitaire)

    res.score = 0
    res.status = GameStatus.Created

    return res
  }

  static from_data = (data: SolitaireGameData) => {
    let res = new SolitaireGame(data.id,
                                Solitaire.from_fen(data.fen))
    res.score = data.score
    res.status = data.status
    return res
  }

  get data() {
    return {
      fen: this.solitaire.fen,
      id: this.id,
      score: this.score,
      status: this.status
    }
  }

  status!: GameStatus
  score!: number

  constructor(readonly id: GameId,
              readonly solitaire: Solitaire) {
  }
}


class GeneralStore {

  _key(key: string) {
    return [`lisotaire`, `general`, key].join('.')
  }

  _prop<T>(key: string, value: T) {
    return storedJsonProp(this._key(key), () => value)
  }

  _general!: StoredJsonProp<GeneralData>

  set settings(general: General) {
    this._general(general.data)
  }

  get settings() {
    return General.from_data(this._general())
  }


  constructor() {
    this._general = this._prop<GeneralData>('general', General.new().data)
  }


}

class SolitaireStore {

  _key(key: string) {
    return [`lisotaire`, `solitaire`, key].join('.')
  }

  _prop<T>(key: string, value: T) {
    return storedJsonProp(this._key(key), () => value)
  }

  _current_game!: StoredJsonProp<SolitaireGameData>
  _games!: StoredJsonProp<SolitaireGamesData>

  set games(games: SolitaireGames) {
    this._games(games.data)
  }

  get games() {
    return SolitaireGames.from_data(this._games())
  }

  get settings() {
    return this.games.settings
  }

  set settings(settings: SolitaireSettings) {
    let games = this.games
    games.settings = settings

    this.games = games

  }

  get current_game() {
    return SolitaireGame.from_data(this._current_game())
  }

  set current_game(game: SolitaireGame) {
    this._current_game(game.data)
  }

  save_current(game?: SolitaireGame) {
    if (game) {
      this.current_game = game
    }
    let current = this.current_game
    let games = this.games
    games.add(current.data)

    this.games = games
  }


  new_game() {
    let games = this.games
    games.add(this.current_game.data)
    this.games = games

    this.current_game = SolitaireGame.new(games.settings)

    return this.current_game
  }





  constructor() {
    this._games = this._prop<SolitaireGamesData>('games', SolitaireGames.new(default_settings).data)

    this._current_game = this._prop<SolitaireGameData>('current_game', 
                                                       SolitaireGame.new(this.settings).data)
  }

}

const solitaire_store = new SolitaireStore()
const general_store = new GeneralStore()

export { solitaire_store as SolitaireStore }
export { general_store as GeneralStore }
