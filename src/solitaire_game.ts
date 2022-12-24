import Sound from './sound'
import { Rect, Vec2 } from 'blah'
import { Play } from './play'
import { Anim } from './anim'
import { Clickable } from './game'
import { CardDropTarget, Stack, Card, Cards, Tableu, DragStack } from './showcase'
import { Dealer } from './solitaire'
import { BackRes, make_solitaire_back } from './solitaire_back'
import { n_four, n_seven, GamePov, Card as OCard, Solitaire, SolitairePov, IMove, IMoveType } from 'lsolitaire'
import { HitStock, Recycle, 
  TableuToTableu, 
  WasteToTableu,
  WasteToFoundation,
  TableuToFoundation, 
  FoundationToTableu,
} from 'lsolitaire'

export type TableuDrag = {
  tableu: number,
  i: number
}

export type WasteDrag = 'waste'
export type FoundationDrag = {
  foundation: number
}

export type DragSource = TableuDrag | WasteDrag | FoundationDrag

const isFoundationDragSource = (_: DragSource): _ is FoundationDrag => {
  return (typeof _ === 'object' && (_ as FoundationDrag).foundation !== undefined)
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

type StockData = {
  on_hit: () => void,
  on_recycle: () => void,
  on_front_drag: (e: Vec2) => void
}

class Stock extends Play {

  get data() {
    return this._data as StockData
  }

  get can_recycle() {
    return this.stock.length === 0
  }

  free() {

    return [
      ...this.stock.remove_cards(this.stock.length),
      ...this.waste.remove_cards(this.waste.length),
      ...this.waste_hidden.remove_cards(this.waste_hidden.length)
    ]
  }

  add_waste_hidden(cards: Array<Card>) {
    this.waste_hidden.add_cards(cards)
  }



  add_waste(cards: Array<Card>) {
    cards.forEach(_ => {
      _.bind_drop(undefined)
      _.bind_drag(undefined)
    })
    this.waste.add_cards(cards)
    cards.forEach((card, i) => card.flip_front())
    this.bind_new_front()
  }



  add_stocks(cards: Array<Card>) {
    this.stock.add_cards(cards)
  }

  remove_waste(n: number) {
    return this.waste.remove_cards(n)
  }


  bind_new_front() {
    this.waste.cards.forEach(_ => _.bind_drag(undefined))
    this.waste.top_card?.bind_drag((e: Vec2) => {
      this.data.on_front_drag(e)
    })
  }

  undo_hit(ocards: Array<OCard>, owaste: Array<OCard>) {

    let waste_to_stock = this.waste.remove_cards(ocards.length)
    let waste_hidden_to_waste = this.waste_hidden.remove_cards(owaste.length)
    this.waste.add_cards(waste_hidden_to_waste)

    waste_hidden_to_waste.forEach((_, i) => {
      _.card = owaste[i]
      _.flip_front()
    })
    waste_to_stock.forEach(card => card.flip_back())
    this.stock.add_cards(waste_to_stock)
    this.bind_new_front()
  }

  hit(ocards: Array<OCard>) {
    let cards = this.stock.remove_cards(ocards.length)

    cards.forEach((card, i) => card.card = ocards[i])
    cards.forEach((card, i) => card.flip_front())

    let waste = this.waste.remove_cards(this.waste.cards.length)

    waste.forEach(_ => {
      _.flip_back()
      _.bind_drag(undefined)
    })
    this.waste_hidden.add_cards(waste)
    this.waste.add_cards(cards)

    reverse_forEach(this.waste_hidden.cards, _ => _.send_back())

    this.bind_new_front()

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

    let self = this
    this.make(Clickable, Vec2.make(-64, -80), {
      rect: Rect.make(0, 0, 160, 210),
      on_click() {
        if (self.stock.length > 0) {
          self.data.on_hit()
        }
      },
    })
  }

}

type FoundationData = {
  on_front_drop: () => void,
  on_front_drag: (e: Vec2) => void
}
class Foundation extends Play {

  get data() {
    return this._data as FoundationData
  }

  foundation!: Stack
  drop_target!: CardDropTarget


  add_cards(cards: Array<Card>) {
    this.foundation.add_cards(cards)
    this.foundation.top_card?.bind_drag(e => this.data.on_front_drag(e))
  }

  remove_cards(n: number) {
    return this.foundation.remove_cards(n)
  }

  _init() {

    this.drop_target = this.make(CardDropTarget, Vec2.make(0, 0),  {})
    this.drop_target.bind_drop(() => {
      this.data.on_front_drop()
    })

    this.foundation = this.make(Stack, Vec2.make(0, 0), { h: 0 })

  }
}


export class SolitaireGame extends Play {


  recycle_view!: RecycleView
  cards!: Cards
  dealer!: Dealer
  stock!: Stock
  tableus!: Array<Tableu>
  foundations!: Array<Foundation>

  dragging?: DragStack
  drag_source?: DragSource


  back_res!: BackRes

  get game_pov() {
    return this.back_res.game_pov
  }

  get pov() {
    return this.game_pov.game
  }


  get cmd() {
    return this.back_res.cmd
  }

  _init() {



    let self = this
    let c = this.make(Clickable, Vec2.zero, {
      rect: Rect.make(0, 0, 0, 0),
      on_up() {
        if (self.dragging && !self.dragging.waiting) {
          self._release_cancel_drag()
        }
      }
    })


    this.recycle_view = this.make(RecycleView, Vec2.make(40, 200), {

      on_recycle() {
        if (self.stock.can_recycle) {
          self.cmd(Recycle)
        }
      }
    })

    this.cards = this.make(Cards, Vec2.zero, {})

    let stock_x = 120,
      stock_y = 320

    this.stock = this.make(Stock, Vec2.make(stock_x, stock_y), {
      on_hit() {
        self.cmd(HitStock)
      },
      on_front_drag(v: Vec2) {
        if (self.dragging) {
          self.dragging.drag(v)
        } else {
          if (self.pov.can_drag_waste) {
            let cards = self.stock.remove_waste(1)

            self.dragging = self.make(DragStack, Vec2.zero, {})
            self.dragging.cards = cards
            self.cards.shadow_group = cards

            self.drag_source = 'waste'

            Sound.play(`drag1`)

          } else {
          }
        }
      }
    })


    let tableu_x = 350,
      tableu_y = 180,
      tableu_w = 200


    this.tableus = n_seven.map(i => 
                this.make(Tableu, Vec2.make(tableu_x + tableu_w * i, tableu_y), {
                  on_front_drag(e: number, v: Vec2) {
                    if (self.dragging) {
                      self.dragging.drag(v)
                    } else {
                      if (self.pov.can_drag_tableu({ from: i, i: e })) {
                        let cards = self.tableus[i].remove_fronts(e)

                        self.dragging = self.make(DragStack, Vec2.zero, {})
                        self.dragging.cards = cards
                        self.cards.shadow_group = cards

                        self.drag_source = {
                          tableu: i,
                          i: e
                        }

                        let drag_123 = Math.min(3, Math.floor(e/3) + 1)
                        Sound.play(`drag${drag_123}`)

                      } else {
                      }
                    }
                  },
                  on_front_drop() {
                    if (self.drag_source === 'waste') {
                      self.dragging!.wait_drop()
                      self.cmd(WasteToTableu, {
                        to: i
                      })
                    } else if (isFoundationDragSource(self.drag_source!)) {
                      let { foundation } = self.drag_source!

                      self.dragging!.wait_drop()

                      self.cmd(FoundationToTableu, {
                        from: foundation,
                        to: i,
                      })
                    } else if (self.drag_source) {

                      let { tableu, i: _i } = self.drag_source!

                      self.dragging!.wait_drop()

                      self.cmd(TableuToTableu, {
                        from: tableu,
                        to: i,
                        i: _i
                      })
                    }
                  }
                }))

    let foundation_x = 1790,
      foundation_y = 166,
      foundation_h = 240

    this.foundations = n_four.map(i =>
            this.make(Foundation, Vec2.make(foundation_x, foundation_y + foundation_h * i), {
              on_front_drag(v: Vec2) {
                if (self.dragging) {
                  self.dragging.drag(v)
                } else {
                  if (self.pov.can_drag_foundation({ from: i })) {
                    let cards = self.foundations[i].remove_cards(1)

                    self.dragging = self.make(DragStack, Vec2.zero, {})
                    self.dragging.cards = cards
                    self.cards.shadow_group = cards

                    self.drag_source = { foundation: i }

                    Sound.play(`drag1`)

                  } else {
                  }
                }
              },
              on_front_drop() {
                if (self.drag_source === 'waste') {
                  self.dragging!.wait_drop()
                  self.cmd(WasteToFoundation, {
                    to: i
                  })
                } else if (isFoundationDragSource(self.drag_source!)) {
                } else if (self.drag_source) {
                  let { tableu, i: _i } = self.drag_source!

                  if (_i === 1) {
                    self.dragging!.wait_drop()
                    self.cmd(TableuToFoundation, {
                      from: tableu,
                      to: i,
                      i: 1
                    })
                  }
                }
              }
            }))


    this.dealer = this.make(Dealer, Vec2.zero, {
      on_shuffle() {
        self.dealer.cards.forEach(_ => self.cards.release(_))
      }
    })


    make_solitaire_back(this).then(back_res => {
      this.back_res = back_res
      this._collect_pov()
    })
  }

  _release_cancel_drag() {
    let cards = this.dragging!.lerp_release()

    if (this.drag_source === 'waste') {
      this.stock.add_waste(cards)
    } else if (isFoundationDragSource(this.drag_source!)) {
      let { foundation } = this.drag_source
      this.foundations[foundation].add_cards(cards)
    } else {

      let { tableu, i } = this.drag_source!

      this.tableus[tableu].add_fronts(cards)
    }

    this.dragging!.dispose()
    this.dragging = undefined
    this.drag_source = undefined
    Sound.play('cancel')
    cards[0].after_ease(() => {
      this.cards.shadow_group = undefined
    })
  }

  _collect_pov() {

    this._init_pov()
  }


  _init_pov() {

    let { pov, stock, tableus } = this

    this.recycle_view.visible = pov.can_recycle

    stock.add_stocks(pov.stock.stock.cards.map(card => this.cards.borrow()))



    n_seven.map(i => {
      let tableu = tableus[i]
      let t_pov = pov.tableus[i]

      tableu.add_backs(t_pov.back.cards.map(card =>
        this.cards.borrow()))

      tableu.add_fronts(t_pov.front.cards.map(card => {
        let _ = this.cards.borrow()
        _.card = card
        return _
      }))
    })

  }

  _refresh_recycle() {
    if (!this.pov.can_hit) {
      this.recycle_view.visible = true
    } else {
      this.recycle_view.visible = false
    }
    if (this.pov.can_recycle) {
      this.recycle_view.enable()
    } else {
      this.recycle_view.disable()
    }
  }

  undo(res: IMove<SolitairePov, Solitaire>) {
    Sound.play('undo2')
    if (res instanceof HitStock) {
      this.stock.undo_hit(res.data.cards, res.data.waste)
      this._refresh_recycle()
    } else if (res instanceof Recycle) {
      this.stock.undo_recycle(res.data.waste.length)
      this._refresh_recycle()
    } else if (res instanceof TableuToTableu) {
      let { flip } = res.res
      let { from, to, i } = res.data
      if (flip) {
        this.tableus[from].flip_back()
      }
      let cards = this.tableus[to].remove_fronts(i)
      this.tableus[from].add_fronts(cards)
    } else if (res instanceof WasteToTableu) {

      let { to } = res.data

      let cards = this.tableus[to].remove_fronts(1)

      this.stock.add_waste(cards)
    } else if (res instanceof TableuToFoundation) {
      let { flip } = res.res
      let { from, to } = res.data
      if (flip) {
        this.tableus[from].flip_back()
      }
      let cards = this.foundations[to].remove_cards(1)
      this.tableus[from].add_fronts(cards)
    } else if (res instanceof WasteToFoundation) {
      let { to } = res.data
      let cards = this.foundations[to].remove_cards(1)
      this.stock.add_waste(cards)
    } else if (res instanceof FoundationToTableu) {
      let { from, to } = res.data
      let cards = this.tableus[to].remove_fronts(1)
      this.foundations[from].add_cards(cards)
    }
  }

  apply(res: IMove<SolitairePov, Solitaire>) {
    let dispose_drag_cards
    if (res instanceof HitStock) {
      this.stock.hit(res.data.cards)
      this._refresh_recycle()
    } else if (res instanceof Recycle) {
      this.stock.recycle()
      this._refresh_recycle()
    } else if (res instanceof TableuToTableu) {

      let { flip } = res.res
      let { from, to, i } = res.data

      let cards = this.dragging!.lerp_release()
      this.tableus[to].add_fronts(cards)

      if (flip) {
        this.tableus[from].flip_front(flip)
      }

      dispose_drag_cards = cards
    } else if (res instanceof WasteToTableu) {
      let { to } = res.data
      let cards = this.dragging!.lerp_release()
      this.tableus[to].add_fronts(cards)

      this.stock.bind_new_front()

      dispose_drag_cards = cards
    } else if (res instanceof TableuToFoundation) {
      let { flip } = res.res
      let { from, to } = res.data

      let cards = this.dragging!.lerp_release()
      this.foundations[to].add_cards(cards)

      if (flip) {
        this.tableus[from].flip_front(flip)
      }

      dispose_drag_cards = cards

    } else if (res instanceof WasteToFoundation) {
      let { to } = res.data

      let cards = this.dragging!.lerp_release()
      this.foundations[to].add_cards(cards)

      this.stock.bind_new_front()

      dispose_drag_cards = cards

    } else if (res instanceof FoundationToTableu) {
      let { from, to } = res.data
      let cards = this.dragging!.lerp_release()
      this.tableus[to].add_fronts(cards)

      this.stock.bind_new_front()

      dispose_drag_cards = cards
    }

    if (dispose_drag_cards) {
      this.dragging!.dispose()
      this.dragging = undefined
      this.drag_source = undefined
      dispose_drag_cards[0].after_ease(() => {
        this.cards.shadow_group = undefined
      })
    }
  }

  apply_pov(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
    //console.log(cmd)
  }


  cant(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
    if (cmd === TableuToFoundation) {
      this._release_cancel_drag()
    } else if (cmd === WasteToFoundation) {
      this._release_cancel_drag()
    } else {
      console.log('cant', cmd)
    }
  }

  cant_undo() {
  }

  request_undo() {
    this.back_res.undo()
  }

  request_new_game() {
  }
}

export { card_sort_key } from 'lsolitaire'
