import Sound from './sound'
import { Rect, Vec2 } from "blah";
import { Settings, Solitaire, IMove, TableuToTableu, HitStock, HitRecycle, WasteToTableu } from "./lsolitaire/solitaire";
import { Card as OCard, Cards as DeckCards, n_seven } from "./lsolitaire/types";
import { Play } from "./play";
import { Stack, Cards, Card, Tableu, DragStack } from "./showcase";
import { SolitaireStore } from "./store";
import { shuffleArray } from "./util";
import Game, { Clickable } from "./game";
import { ticks } from "./shared";
import { Anim } from './anim';

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

    this.cards.apply(cmd)
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
    let self = this
    this.cards = this.make(SolitaireCards, Vec2.zero, {
      on_cmd(cmd: IMove) {
        self.cmd(cmd)
      }
    })
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

type SolitaireCardsData = {
  on_cmd: (_: IMove) => void
}


class SolitaireCards extends Play {

  get data() {
    return this._data as SolitaireCardsData
  }
  
  cards!: Cards
  tableus!: Tableu[]
  stock!: Stock
  recycle_view!: RecycleView

  drag_stack?: DragStack
  drag_source?: DragSource

  _init() {

    this.cards = this.make(Cards)

    this.recycle_view = this.make(RecycleView, Vec2.make(40, 200), {
      on_recycle() {
        if (back.can_hit_recycle()) {
          self.data.on_cmd(new HitRecycle())
        }
      }
    })

    let stock_x = 120,
      stock_y = 320

    let tableu_x = 340
    let tableu_gap = 200
    let tableu_y = 200

    this.tableus = n_seven.map(i => this.make(Tableu, Vec2.make(tableu_x + tableu_gap * (i - 1), tableu_y)))
    this.stock = this.make(Stock, Vec2.make(stock_x, stock_y))

    this._collect_cards()

    let hovering_tableu: Tableu | undefined = undefined
    let self = this
    this.unbindable_input({
      on_click(e, r) {
        e = e.mul(Game.v_screen)

        if (self.stock.find_stock_hit(e)) {
          self.data.on_cmd(new HitStock())
        }


        return false
      },
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

          let c0 = self.drag_stack._cards[0]
          let to_i = self.tableu_find_max_overlap(c0, tableu_i)

          if (to_i !== -1) {

            if (self.drag_source! === 'waste') {

              self.data.on_cmd(new WasteToTableu(to_i))
            } else if (isTableuDragSource(self.drag_source!)) {
              let { i, tableu } = self.drag_source
              self.data.on_cmd(new TableuToTableu(tableu_i, to_i, i))
            }

          } else {

            let cards = self.drag_stack.lerp_release()
            if (self.drag_source! === 'waste') {
              self.stock.add_waste(cards)
            } else if (isFoundationDragSource(self.drag_source!)) {

            } else {
              let { tableu, i } = self.drag_source!
              self.tableus[tableu].add_fronts(cards)
            }

            Sound.play('cancel')
            self.drag_stack.dispose()
            self.drag_stack = undefined
            self.drag_source = undefined
            cards[0].after_ease(() => {
              self.cards.shadow_group = undefined
            })
          }
        }

        return false
      },
      on_drag(d, d0) {
        let e = d.e.mul(Game.v_screen)
        if (d.m && !d0?.m) {

          let drag_stock = self.stock.find_drag_begin(e)

          if (drag_stock) {
              self.drag_stack = self.make(DragStack)
              self.drag_stack.cards = [drag_stock]
              self.cards.shadow_group = [drag_stock]

              let c0 = drag_stock
              c0._lerp_drag_shadow = 0
              c0._dragging = true
              c0._drag_decay = e.sub(c0.position)
       
              self.drag_source = 'waste'

              return true
          }

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

    this.stock.add_waste_hidden(back.stock.hidden.cards.map(card => this.cards.borrow()))
    this.stock.add_stocks(back.stock.stock.cards.map(card => this.cards.borrow()))
    this.stock.add_waste(back.stock.waste.cards.map(card => {
      let _ = this.cards.borrow()
      _.card = card
      return _
    }))

    this._refresh_recycle()

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

  _refresh_recycle() {
    if (!back.can_hit_stock()) {
      this.recycle_view.visible = true
    } else {
      this.recycle_view.visible = false
    }
    if (back.can_hit_recycle()) {
      this.recycle_view.enable()
    } else {
      this.recycle_view.disable()
    }
  }



  apply(cmd: IMove) {
    let dispose_drag_cards

    if (cmd instanceof HitRecycle) {
      this.stock.recycle()
      this._refresh_recycle()
    } else if (cmd instanceof HitStock) {
      this.stock.hit(cmd.hit_data[1])
      this._refresh_recycle()
    } else if (cmd instanceof WasteToTableu) {
      let to = cmd.to


      if (!this.drag_stack) {
        /*
        this._release_cancel_highlight()
        let cards = this.stock.remove_waste(1)
        this.tableus[to].add_fronts(cards)
        this.stock.bind_new_front()
        */
      } else {
        let cards = this.drag_stack.lerp_release()
        this.tableus[to].add_fronts(cards)
        dispose_drag_cards = cards
      }
    } else if (cmd instanceof TableuToTableu) {

      let { flip } = cmd
      let { from, to, i } = cmd

      let bring_to_front_cards: Card[] = []
      if (!this.drag_stack) {
        /*
        if (this.click_source && isTableuClickSource(this.click_source)) {
          let { tableu, i } = this.click_source

          this._release_cancel_highlight()

          let cards = this.tableus[tableu].remove_fronts(i)
          this.tableus[to].add_fronts(cards)

          bring_to_front_cards = cards
        }
        */
      } else {
        let cards = this.drag_stack!.lerp_release()
        this.tableus[to].add_fronts(cards)
        dispose_drag_cards = cards
      }

      if (flip) {
        this.tableus[from].flip_front(flip)

        if (bring_to_front_cards) {
          bring_to_front_cards.forEach(_ => _.send_front())
        }

      }

    }
    if (dispose_drag_cards) {
      this.drag_stack!.dispose()
      this.drag_stack = undefined
      this.drag_source = undefined
      dispose_drag_cards[0].after_ease(() => {
        this.cards.shadow_group = undefined
      })
    }
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


class Stock extends Play {
  release_all() {
    return this.free()
  }

  free() {

    return [
      ...this.stock.remove_cards(this.stock.length),
      ...this.waste.remove_cards(this.waste.length),
      ...this.waste_hidden.remove_cards(this.waste_hidden.length)
    ]
  }

  find_drag_begin(e: Vec2) {
    let c = this.waste.top_card
    if (c && !c.easing && c.ghit_area?.contains_point(e)) {
      this.waste.remove_cards(1)
      return c
    }
    return undefined
  }
  


  find_stock_hit(e: Vec2) {
    let t = this.stock.top_card
    if (t) {
      return t.ghit_area?.contains_point(e)
    }
    return false
  }

  add_waste_hidden(cards: Array<Card>) {
    cards.forEach(_ => _.flip_back())
    this.waste_hidden.add_cards(cards)
  }

  add_waste(cards: Array<Card>) {
    this.waste.add_cards(cards)
    cards.forEach((card, i) => card.flip_front())
  }



  add_stocks(cards: Array<Card>) {
    cards.forEach(_ => _.flip_back())
    this.stock.add_cards(cards)
  }

  remove_waste(n: number) {
    return this.waste.remove_cards(n)
  }


  undo_hit(ocards: Array<OCard>, owaste: Array<OCard>) {

    let waste_to_stock = this.waste.remove_cards(ocards.length)
    let waste_hidden_to_waste = this.waste_hidden.remove_cards(owaste.length)
    this.waste.add_cards(waste_hidden_to_waste)

    waste_hidden_to_waste.forEach((_, i) => {
      _.card = owaste[i]
      _.flip_front()
    })
    waste_to_stock.forEach(card => {
      card.flip_back()
    })
    this.stock.add_cards(waste_to_stock)
  }

  hit(ocards: Array<OCard>) {
    let cards = this.stock.remove_cards(ocards.length)

    cards.forEach((card, i) => card.card = ocards[i])
    cards.forEach((card, i) => card.flip_front())

    let waste = this.waste.remove_cards(this.waste.cards.length)

    waste.forEach(_ => {
      _.flip_back()
    })
    this.waste_hidden.add_cards(waste)
    this.waste.add_cards(cards)

    reverse_forEach(this.waste_hidden.cards, _ => _.send_back())

    Sound.play('hit')
  }

  recycle() {

    let waste = this.waste.remove_cards(this.waste.length)
    this.waste_hidden.add_cards(waste)

    let cards = this.waste_hidden.remove_cards(this.waste_hidden.length)

    cards.forEach(card => card.flip_back())
    cards.forEach(card => card.send_front())

    this.stock.add_cards(cards)
    Sound.play('recycle')
  }


  undo_recycle(waste: number) {

    let stock_to_hidden = this.stock.remove_cards(this.stock.length)

    this.waste_hidden.add_cards(stock_to_hidden)

    let hidden_to_waste = this.waste_hidden.remove_cards(waste)

    stock_to_hidden.forEach(_ => _.flip_front())
    hidden_to_waste.forEach(_ => _.flip_front())

    this.waste.add_cards(hidden_to_waste)
  }

  stock!: Stack
  waste!: Stack

  waste_hidden!: Stack

  _init() {
    this.stock = this.make(Stack, Vec2.make(0, 0), { h: 1 })

    this.waste = this.make(Stack, Vec2.make(0, 260), {})
    this.waste_hidden = this.make(Stack, Vec2.make(0, 300), { h: 0 })
  }

}


type RecycleData = {
  on_recycle: () => void
}

class RecycleView extends Play {

  get data() {
    return this._data as RecycleData
  }

  disable() {
    this.anim.play('disabled')
  }

  enable() {
    this.anim.play('idle')
  }

  anim!: Anim

  _init() {


    let anim = this.make(Anim, Vec2.make(0, 0), { name: 'recycle' })
    this.anim = anim

    let self = this
    this.make(Clickable, Vec2.make(20, 20), {
      rect: Rect.make(0, 0, 140, 160),
      on_hover() {

        if (anim._animation !== 'disabled') {
          anim.play('hover')
        }
      },
      on_hover_end() {
        if (anim._animation !== 'disabled') {
          anim.play('idle')
        }
      },
      on_click() {
        self.data.on_recycle()
      }
    })
  }

}



const reverse_forEach = <A>(a: Array<A>, f: (_: A) => void) => {
  for (let i = a.length - 1; i >= 0; i--) {
    f(a[i])
  }
}

