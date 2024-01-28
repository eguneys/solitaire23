import { Vec2 } from "blah";
import { Settings, Solitaire, IMove } from "./lsolitaire/solitaire";
import { Cards as DeckCards } from "./lsolitaire/types";
import { Play } from "./play";
import { Stack, Cards, Card } from "./showcase";
import { SolitaireStore } from "./store";
import { shuffleArray } from "./util";
import Game from "./game";

let back: Solitaire

function reset_back() {
  back = Solitaire.make(SolitaireStore.general_settings, shuffleArray(DeckCards.deck))
}
reset_back()

export class SolitaireGameDragful extends Play {
  init_and_set_callbacks(
    on_score: (_: number) => void, 
    on_new_game: (_: Settings) => void, 
    on_game_over: (_: Settings, score: number) => void, 
    on_init: (settings: Settings) => void) {
        this._on_score = on_score
        this._on_new_game = on_new_game
        this._on_game_over = on_game_over
        this._on_init = on_init

        this.collect_pov()
        this._on_init(this.settings)

  }


  cmd(cmd: IMove) {
    if (cmd.can(back)) {
      cmd.apply(back)
      this.apply(cmd)


      this._on_score(back.score)

      if (back.is_finished) {
        this._on_game_over(back.settings, back.score)
      }

    } else {
      this.cant(cmd)
    }
  }

  cmd_undo() {
    let res = back.undo()
    if (res) {
      this.undo(res)

      this._on_score(back.score)
    } else {
      this.cant_undo()
    }
  }

  cant_undo() {
    throw new Error("Method not implemented.");
  }
  undo(cmd: IMove) {
    throw new Error("Method not implemented.");
  }
  apply(cmd: IMove) {
    throw new Error("Method not implemented.");
  }
  cant(cmd: IMove) {
    throw new Error("Method not implemented.");
  }

  get settings() {
    return back.settings
  }

  _on_score!: (_: number) => void
  _on_new_game!: (_: Settings) => void
  _on_game_over!: (_: Settings, score: number) => void
  _on_init!: (_: Settings) => void

  collect_pov() {




  }
  request_new_game() {
    throw new Error('Method not implemented.');
  }
  request_undo() {
    throw new Error('Method not implemented.');
  }

  cards!: SolitaireCards

  _init() {
    this.cards = this.make(SolitaireCards, Vec2.zero, {})
  }

}



function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

let back_h = 20
class SolitaireCards extends Play {
  
  tableu_backs!: Card[][]
  tableu_fronts!: Card[][]

  drag_tableu?: [number, Vec2, Card[]]

  _init() {

    this.tableu_backs = []
    this.tableu_fronts = []

    this._collect_cards()


    let self = this
    this.unbindable_input({
      on_up(e, r) {

        if (self.drag_tableu) {

          let [i, decay, cards] = self.drag_tableu

          cards.forEach(_ =>  _.lerp_release())
          self.tableu_fronts[i].push(...cards)
          self.position_tableu_front_cards(i)

          self.drag_tableu = undefined
        }

        return false
      },
      on_drag(d, d0) {
        let e = d.e.mul(Game.v_screen)
        if (d.m && !d0?.m) {
          let found = false
          self.tableu_fronts.forEach((fronts, i) => {
            let splice_i = fronts.findIndex(c => c.hit_area?.add(c.g_position)!.contains_point(e))

            if (splice_i !== -1) {
              let drags = fronts.splice(splice_i)

              drags.forEach(_ => _.send_front())
              self.position_tableu_front_cards(i)
              
              let decay = e.sub(drags[0].position)
              self.drag_tableu = [i, decay, drags]
              found = true
            }
          })

          return found
        }
        if (d.m && d0?.m) {

          if (self.drag_tableu) {

            let e = d.m.mul(Game.v_screen)
            let [i, decay, cards] = self.drag_tableu
            self.position_drag_stack(cards, e, decay)
          }
        }
        return false
      },
    })
  }

  _collect_cards() {

    let frees = DeckCards.deck.map(card => this.make(Card))

    back.tableus.forEach((tableu, i) => {

      let backs = tableu.back.cards.map(card => {
        let c = frees.pop()!
        c.flip_back()
        return c
      })

      this.position_stack_cards(backs, Vec2.make(360 + i * 200, 180), back_h)
      this.tableu_backs[i] = backs


      let fronts = tableu.front.cards.map(card => {
        let c = frees.pop()!
        c.card = card
        c.flip_front()
        return c
      })

      this.tableu_fronts[i] = fronts
      this.position_tableu_front_cards(i)

    })
  }

  position_drag_stack(cards: Card[], v: Vec2, drag_decay: Vec2) {
    let h = 50
    cards.forEach((_, i) => {
      let _v = v.add(Vec2.make(0, h * i).sub(drag_decay))
      let t = 1 - sigmoid((i / cards.length) * 2)
      _.lerp_position(_v, t)
    })
  }

  position_tableu_front_cards(i: number, i_gap?: number) {
    let backs = this.tableu_backs[i]
    let fronts = this.tableu_fronts[i]
    this.position_stack_cards(fronts, Vec2.make(360 + i * 200, 180 + backs.length * back_h), 100)
  }

  position_stack_cards(cards: Card[], orig: Vec2, h: number, _i_gap?: number) {
    cards.forEach((card, i) => {
      card.send_front()
      let i_gap = (_i_gap !== undefined && i > _i_gap) ? i + 0.5 : i
      card.ease_position(orig.add(Vec2.make(0, i_gap * h)))
    })
  }
}