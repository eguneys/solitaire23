import { SolitaireGame } from './solitaire_game'
import { Settings, Cards, Solitaire, SolitairePov, Game as OSolitaireGame, GamePov, IMoveType } from 'lsolitaire'
import { SolitaireStore } from './store'
import { arr_random } from './util'

export type BackRes = {
  game_pov: GamePov<SolitairePov, Solitaire>,
  cmd(cmd: IMoveType<SolitairePov, Solitaire>, data?: any): void,
  undo(): void,
  new_game(): void,
}


export const make_solitaire_back = async (game: SolitaireGame, on_score: (_: number) => void, on_settings: (_: Settings) => void): Promise<BackRes> => {

  let back = solitaire_back
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
    },
    async new_game() {
      solitaire_back = new SolitaireBack()
      back = solitaire_back
      game_pov = await solitaire_back.get_pov()
      
      game.new_game()
    }
  }

}


class SolitaireBack {

  static resume = () => {
    return new SolitaireBack()
  }

  game: OSolitaireGame<SolitairePov, Solitaire>

  constructor() {
    let solitaire = Solitaire.make(SolitaireStore.general_settings, shuffleArray(Cards.deck))
    this.game = OSolitaireGame.make<SolitairePov, Solitaire>(solitaire)
  }

  async get_pov() {
    return this.game.pov.clone
  }

  async apply(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
    let res = await this.game.apply(cmd, data)
    return res
  }


  async undo() {
    let res = await this.game.undo()
    return res
  }

}

let solitaire_back = new SolitaireBack()

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray<T>(array: T[]): T[] {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}