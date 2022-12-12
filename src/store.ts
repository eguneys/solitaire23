import { storedJsonProp, StoredJsonProp } from './storage'
import { SolitairePov, Solitaire, Cards } from 'lsolitaire'


export type SolitaireGamesData = {
  games: Array<SolitaireGameData>
}


export class SolitaireGames {

  static get new() {
    return new SolitaireGames([])
  }

  static from_data = (data: SolitaireGamesData) => {
    return new SolitaireGames(data.games)
  }

  get data() {
    return {
      games: this.games
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

  constructor(readonly games: Array<SolitaireGameData>) {}

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

  static get new() {

    let id = gen_game_id()
    let solitaire = Solitaire.make(Cards.deck)
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

    this.current_game = SolitaireGame.new

    return this.current_game
  }





  constructor() {

    this._current_game = this._prop<SolitaireGameData>('current_game', SolitaireGame.new.data)

    this._games = this._prop<SolitaireGamesData>('games', SolitaireGames.new)
  }

}

export default new SolitaireStore()
