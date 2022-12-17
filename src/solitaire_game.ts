import Sound from './sound'
import { Rect, Vec2 } from 'blah'
import { Play } from './play'
import { Anim } from './anim'
import { Clickable } from './game'
import { Stack, Card, Cards, Tableu, DragStack } from './showcase'
import { Dealer } from './solitaire'
import { BackRes, make_solitaire_back } from './solitaire_back'
import { n_seven, GamePov, Card as OCard, Solitaire, SolitairePov, IMove, IMoveType } from 'lsolitaire'
import { HitStock, Recycle, TableuToTableu } from 'lsolitaire'

export type TableuDrag = {
  tableu: number,
  i: number
}

export type WasteDrag = 'waste'
export type FoundationDrag = 'foundation'

export type DragSource = TableuDrag | WasteDrag | FoundationDrag


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
  on_recycle: () => void
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
    this.waste.add_cards(cards)
    cards.forEach((card, i) => card.flip_front())
  }



  add_stocks(cards: Array<Card>) {
    this.stock.add_cards(cards)
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
  }

  hit(ocards: Array<OCard>) {
    let cards = this.stock.remove_cards(ocards.length)

    cards.forEach((card, i) => card.card = ocards[i])
    cards.forEach((card, i) => card.flip_front())

    let waste = this.waste.remove_cards(this.waste.cards.length)

    this.waste_hidden.add_cards(waste)
    this.waste.add_cards(cards)

    reverse_forEach(this.waste_hidden.cards, _ => _.send_back())
  }

  recycle() {

    let waste = this.waste.remove_cards(this.waste.length)
    this.waste_hidden.add_cards(waste)

    let cards = this.waste_hidden.remove_cards(this.waste_hidden.length)

    cards.forEach(card => card.flip_back())
    cards.forEach(card => card.send_front())

    this.stock.add_cards(cards)
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



export class SolitaireGame extends Play {


  recycle_view!: RecycleView
  cards!: Cards
  dealer!: Dealer
  stock!: Stock
  tableus!: Array<Tableu>

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
          let cards = self.dragging.lerp_release()

          if (self.drag_source === 'waste') {
          } else if (self.drag_source === 'foundation') {
          } else {

            let { tableu, i } = self.drag_source!

            self.tableus[tableu].add_fronts(cards)
          }

          self.dragging.dispose()
          self.dragging = undefined
          Sound.play('ding')
          cards[0].after_ease(() => {
            self.cards.shadow_group = undefined
          })
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

                      } else {
                      }
                    }
                  },
                  on_front_drop() {
                    if (self.drag_source === 'waste') {
                    } else if (self.drag_source === 'foundation') {
                    } else {

                      let { tableu, i: _i } = self.drag_source!


                      self.cmd(TableuToTableu, {
                        from: tableu,
                        to: i,
                        i: _i
                      })
                    }
                    self.dragging!.wait_drop()
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
    }
  }

  apply(res: IMove<SolitairePov, Solitaire>) {
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

      this.dragging!.dispose()
      this.dragging = undefined
      cards[0].after_ease(() => {
        this.cards.shadow_group = undefined
      })
    }
  }

  apply_pov(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
    //console.log(cmd)
  }


  cant(cmd: IMoveType<SolitairePov, Solitaire>, data: any) {
    console.log('cant', cmd)
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
