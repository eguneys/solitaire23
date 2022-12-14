import { Solitaire, Card, Cards, SolitairePov } from 'lsolitaire'
import { SolitaireScoresAndUndoPov } from 'lsolitaire'
import { DragPov } from 'lsolitaire'
import { SolitaireHooks } from './hooks'
import { SolitaireGame } from './solitaire_game'
import { UndoHitArgs, FlipFront, GameStatus } from 'lsolitaire'
import { SolitaireStore, SolitaireGameData, SolitaireGame as StoreSolitaireGame } from './store'

export type BackRes = {
  undo_pov: SolitaireScoresAndUndoPov,
  cmd: (ctor: CommandType, data?: any) => void,
  dispose: () => void,

  new_game: ()=> Promise<void>
}

export async function make_solitaire_back(game: SolitaireGame) {
  let back = new SolitaireBack()
  let undo_pov = await back.get_undo_pov()

  return {
    get undo_pov() { return undo_pov },
    cmd(ctor: CommandType, data?: any) {
      new ctor(back, undo_pov, game)._set_data(data).send()
    },
    dispose() {
      SolitaireStore.save_current(back.game)

    },
    async new_game() {
      SolitaireStore.new_game()
      back = new SolitaireBack()
      undo_pov = await back.get_undo_pov()
    }
  }
}

class SolitaireBack {

  game: StoreSolitaireGame

  get solitaire_and_undo() {
    return this.game.solitaire_game
  }

  get solitaire() {
    return this.solitaire_and_undo.solitaire
  }

  constructor() {
    this.game = SolitaireStore.current_game
  }

  async get_undo_pov() {
    return this.solitaire_and_undo.pov
  }

  async start_game() {

    this.solitaire_and_undo.status = GameStatus.Started
  }

  async hit_stock() {
    return this.solitaire.hit_stock()
  }

  async recycle() {
    return this.solitaire.recycle()
  }

  async drop_tableu(drag: DragPov, tableu: number) {
    return this.solitaire.drop_tableu(drag, tableu)
  }

  async new_game() {
    this.game = SolitaireStore.new_game()
    return this.solitaire.pov
  }

}

export type CommandType = { new(...args: Array<any>): Command }

abstract class Command {

  get pov() {
    return this.undo_pov.solitaire_pov
  }

  constructor(readonly back: SolitaireBack, readonly undo_pov: SolitaireScoresAndUndoPov, readonly game: SolitaireGame) {}

  _set_data(data: any) {
    this._data = data
    return this
  }

  send() {

    if (this.can) {
      this.wait()
      this.apply_back()
      .then(args =>
            this.resolve(args))
    } else {
      this.cant()
    }
  }

  _data: any
  abstract can: boolean
  abstract cant(): void
  abstract wait(): void
  abstract apply_back(): Promise<any>
  abstract resolve(args: any): void
}


export type DropTableuData = {
  tableu: number
}

export class DropTableu extends Command {

  get data() {
    return this._data as DropTableuData
  }

  get can() {
    return this.pov.can_drop_tableu(this.data.tableu)
  }

  cant() {
    this.game.cant_drop_tableu(this.data.tableu)
  }

  wait() {
    this.pov.wait_drop_tableu(this.data.tableu)
    this.game.wait_drop_tableu(this.data.tableu)
  }

  apply_back() {
    return this.back.drop_tableu(this.pov.dragging!, this.data.tableu)
  }

  resolve(flip_front?: FlipFront) {
    if (flip_front) {
      let { drag_tableu, front } = flip_front
      this.pov.flip_front(drag_tableu, front)
      this.game.flip_front(drag_tableu, front)
    }
    this.pov.drop_tableu(this.data.tableu)
    this.game.drop_tableu(this.data.tableu)
  }
}

export type DragTableuData = {
  tableu: number,
  i: number
} 

export class DragTableu extends Command {

  get data() {
    return this._data as DragTableuData
  }

  get can() {
    return this.pov.can_drag_tableu(this.data.tableu, this.data.i)
  }

  cant() {
    this.game.cant_drag_tableu(this.data.tableu, this.data.i)
  }

  wait() {}

  apply_back() {
    return Promise.resolve()
  }

  resolve() {
    this.pov.drag_tableu(this.data.tableu, this.data.i)
    this.game.drag_tableu(this.data.tableu, this.data.i)
  }
}


export class Recycle extends Command {

  get can() {
    return this.pov.can_recycle
  }

  cant() {
    this.game.cant_recycle()
  }

  wait() {
    this.pov.wait_recycle()
    this.game.wait_recycle()
  }

  apply_back() {
    return this.back.recycle()
  }

  resolve() {
    this.pov.recycle()
    this.game.recycle(this.pov.max_recycles - this.pov.nb_recycles)
  }
}


export class HitStock extends Command {

  get can() {
    return this.pov.can_hit_stock
  }

  cant() {
    this.game.cant_hit_stock()
  }

  wait() {
    this.pov.wait_hit_stock()
    this.game.wait_hit_stock()
  }

  apply_back() {
    return this.back.hit_stock()
  }

  resolve(args: UndoHitArgs) {
    this.pov.hit_stock(args)
    this.game.hit_stock(args)
  }
}


export class StartGame extends Command {

  get can() {
    return this.undo_pov.status === GameStatus.Created
  }

  cant() { }

  wait() { }

  apply_back() {
    return this.back.start_game()
  }

  resolve() {
    this.undo_pov.status = GameStatus.Started
    this.game.game_started()
  }
}
