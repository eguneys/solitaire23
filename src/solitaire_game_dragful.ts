import Sound from './sound'
import { Vec2 } from "blah";
import { Settings, Solitaire, IMove } from "./lsolitaire/solitaire";
import { Cards as DeckCards, n_seven } from "./lsolitaire/types";
import { Play } from "./play";
import { Stack, Cards, Card, Tableu, DragStack } from "./showcase";
import { SolitaireStore } from "./store";
import { shuffleArray } from "./util";
import Game from "./game";
import { ticks } from "./shared";

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

export type TableuDrag = {
  tableu: number,
  i: number
}

export type WasteDrag = 'waste'
export type FoundationDrag = {
  foundation: number
}

export type DragSource = TableuDrag | WasteDrag | FoundationDrag


const isTableuDragSource = (_: DragSource): _ is TableuDrag => {
  return (typeof _ === 'object' && (_ as TableuDrag).tableu !== undefined)
}

const isFoundationDragSource = (_: DragSource): _ is FoundationDrag => {
  return (typeof _ === 'object' && (_ as FoundationDrag).foundation !== undefined)
}

type WasteClick = 'waste'

export type ClickSource = WasteClick | TableuDrag
const isTableuClickSource = (_: ClickSource): _ is TableuDrag => {
  return typeof _ === 'object' && typeof _.tableu === 'number'
}



function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

let back_h = 33
class SolitaireCards extends Play {
  
  cards!: Cards
  tableus!: Tableu[]

  drag_stack?: DragStack
  drag_source?: DragSource

  _init() {

    this.cards = this.make(Cards)

    let tableu_x = 340
    let tableu_gap = 200
    let tableu_y = 200
    this.tableus = n_seven.map(i => this.make(Tableu, Vec2.make(tableu_x + tableu_gap * (i - 1), tableu_y)))

    this._collect_cards()

    let hovering_tableu: Tableu | undefined = undefined
    let self = this
    this.unbindable_input({
      on_hover(e) {
        e = e.mul(Game.v_screen)

        let will_hovering_tableu: Tableu | undefined = undefined
        let will_hover_index: number = -1
        for (let i = 0; i < self.tableus.length; i++) {
          let tableu = self.tableus[i]
          let hover_index = tableu.find_hover_begin(e)
          if (hover_index !== -1) {
            will_hovering_tableu = tableu
            will_hover_index = hover_index
            break
          }
        }
        if (hovering_tableu) {
         if (hovering_tableu !== will_hovering_tableu || !hovering_tableu?.is_hovering_at(will_hover_index)) {
          hovering_tableu.hover_end()
          will_hovering_tableu?.hover_begin(will_hover_index)
          hovering_tableu = will_hovering_tableu
         } else {
         }

        } else {
          if (will_hovering_tableu) {
            will_hovering_tableu.hover_begin(will_hover_index)
            hovering_tableu = will_hovering_tableu
          }
        }
        return false
      },
      on_up(e, r) {

        if (self.drag_stack) {


          let tableu_i = -1
          if (isTableuDragSource(self.drag_source!)) {
            tableu_i = self.drag_source.tableu
          }

          let cards = self.drag_stack.lerp_release()

          let c0 = cards[0]
          let to_i = self.tableu_find_max_overlap(c0, tableu_i)

          if (to_i !== -1) {
            self.tableus[to_i].add_fronts(cards)
          } else {
            if (self.drag_source! === 'waste') {

            } else if (isFoundationDragSource(self.drag_source!)) {

            } else {
              let { tableu, i } = self.drag_source!
              self.tableus[tableu].add_fronts(cards)
            }

            Sound.play('cancel')
          }

          self.drag_stack.dispose()
          self.drag_stack = undefined
          self.drag_source = undefined
          cards[0].after_ease(() => {
            self.cards.shadow_group = undefined
          })
        }

        return false
      },
      on_drag(d, d0) {
        let e = d.e.mul(Game.v_screen)
        if (d.m && !d0?.m) {
          for (let i = 0; i < self.tableus.length; i++) {
            let tableu = self.tableus[i]
            let drag_tableu = tableu.find_drag_begin(e)

            if (drag_tableu) {
              let [drag_tableu_cards, i_card] = drag_tableu
              self.drag_stack = self.make(DragStack)
              self.drag_stack.cards = drag_tableu_cards
              self.cards.shadow_group = drag_tableu_cards

              let c0 = drag_tableu_cards[0]
              c0._lerp_drag_shadow = 0
              c0._dragging = true
              c0._drag_decay = e.sub(c0.position)
       
              self.drag_source = { tableu: i, i: i_card }

              return true
            }
          }
          return false
        }
        if (d.m && d0?.m) {
          let e = d.m.mul(Game.v_screen)
          if (self.drag_stack) {
            self.drag_stack.drag(e)
          }
        }
        return false
      },
    })
  }

  _collect_cards() {


    back.tableus.forEach((tableu, i) => {

      let backs = tableu.back.cards.map(card => {
        let c = this.cards.borrow()
        c.flip_back()
        return c
      })

      let fronts = tableu.front.cards.map(card => {
        let c = this.cards.borrow()
        c.card = card
        c.flip_front()
        return c
      })

      this.tableus[i].add_backs(backs)
      this.tableus[i].add_fronts(fronts)

    })
  }

  tableu_find_max_overlap(c0: Card, except_i: number) {
    let max_to_i = -1
    let max_overlap = 1920

    this.tableus.forEach((tableu, to_i) => {
      if (to_i !== except_i) {
        let to_top = tableu.fronts.top_card
        if (to_top) {
          if (to_top.ghit_area!.overlaps(c0.ghit_area!)) {
            let d = to_top.g_position.distance(c0.g_position)
            if (d < max_overlap) {
              max_overlap = d
              max_to_i = to_i
            }
          }
        }
      }
    })

    return max_to_i
  }
}