import { Solitaire, Card, Cards, SolitairePov } from 'lsolitaire'
import { DragPov } from 'lsolitaire'
import { SolitaireHooks } from './hooks'
import { SolitaireGame } from './solitaire_game'
import { FlipFront } from 'lsolitaire'
import SolitaireStore, { GameStatus, SolitaireGameData, SolitaireGame as StoreSolitaireGame } from './store'

export type BackRes = {

  data: SolitaireGameData,
  pov: SolitairePov,
  cmd: (ctor: CommandType, data?: any) => void,
  dispose: () => void,

  new_game: ()=> Promise<void>
}

export async function make_solitaire_back(game: SolitaireGame) {
  let back = new SolitaireBack()
  let pov = await back.get_pov()
  let game_data = await back.get_data()

  return {
    get pov() { return pov },
    get data() { return game_data },
    cmd(ctor: CommandType, data?: any) {
      new ctor(back, pov, game_data, game)._set_data(data).send()
    },
    dispose() {
      console.log(back.game)
      SolitaireStore.save_current(back.game)

    },
    async new_game() {
      SolitaireStore.new_game()
      back = new SolitaireBack()
      pov = await back.get_pov()
      game_data = await back.get_data()
    }
  }
}

class SolitaireBack {

  game: StoreSolitaireGame

  get solitaire() {
    return this.game.solitaire
  }

  async get_data() {
    return this.game.data
  }

  constructor() {
    this.game = SolitaireStore.current_game
  }

  async get_pov() {
    return this.solitaire.pov
  }

  async start_game() {

    this.game.status = GameStatus.Started
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

  constructor(readonly back: SolitaireBack, readonly pov: SolitairePov, readonly game_data: SolitaireGameData, readonly game: SolitaireGame) {}

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
    this.game.recycle()
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

  resolve(cards: Array<Card>) {
    this.pov.hit_stock(cards)
    this.game.hit_stock(cards)
  }
}


export class StartGame extends Command {

  get can() {
    return this.game_data.status === GameStatus.Created
  }

  cant() { }

  wait() { }

  apply_back() {
    return this.back.start_game()
  }

  resolve() {
    this.game_data.status = GameStatus.Started
    this.game.game_started()
  }
}
