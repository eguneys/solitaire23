import { SolitaireGame } from './solitaire_game'
import { Settings, Cards, Solitaire, SolitairePov, Game as OSolitaireGame, GamePov, IMoveType } from 'lsolitaire'

export type BackRes = {
  game_pov: GamePov<SolitairePov, Solitaire>,
  cmd(cmd: IMoveType<SolitairePov, Solitaire>, data?: any): void,
  undo(): void
}

export const make_solitaire_back = async (game: SolitaireGame): Promise<BackRes> => {

  let back = new SolitaireBack()
  let game_pov = await back.get_pov()

  return {
    get game_pov() { return game_pov },
    cmd(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
      if (cmd.can(game_pov.game, data)) {
        game_pov.apply(cmd, data)
        game.apply_pov(cmd, data)

        back.apply(cmd, data).then(res => {
          if (!res) {
            game.cant(cmd, data)
          } else {
            game.apply(res)
          }
        })
      } else {
        game.cant(cmd, data)
      }
    },
    undo() {
      if (game_pov.can_undo) {
        game_pov.undo_pov()
        back.undo().then(res => {
          if (!res) {
            game.cant_undo()
          } else {
            game_pov.undo(res)
            game.undo(res)
          }
        })
      } else {
        game.cant_undo()
      }
    }
  }

}


class SolitaireBack {

  game: OSolitaireGame<SolitairePov, Solitaire>

  constructor() {
    let settings: Settings = { cards: 'threecards', limit: 'nolimit' }
    let solitaire = Solitaire.make(settings, Cards.deck)
    this.game = OSolitaireGame.make<SolitairePov, Solitaire>(solitaire)
  }

  async get_pov() {
    return this.game.pov.clone
  }

  async apply(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
    return this.game.apply(cmd, data)
  }

  async undo() {
    return this.game.undo()
  }

}
