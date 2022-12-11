import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { Hooks, EventPosition, DragEvent } from './input'
import { howtos } from './howtos'
import { Transition, transition } from './transition'

import { rmap, ease, lerp, appr } from './lerp'
import { InfiniteScrollableList } from './scrollable'

import { bg1, link_color, Play, PlayType} from './play'

import { Anim } from './anim'

import { n_seven, hidden_card, card_sort_key, Cards as OCards, Card as OCard, CardPov, SolitairePov, Solitaire } from 'lsolitaire'
import { TableuPov } from 'lsolitaire'

import { ticks } from './shared'
import { RNG, random, int_random, v_random, v_random_h, v_screen, arr_random } from './util'
import { Tween } from './tween'

import { Text, RectView, Clickable, Background } from './game'
  
import { SolitaireHooks } from './hooks'
import { BackRes, make_solitaire_back } from './solitaire_back'
import { CommandType } from './solitaire_back'
import { HitStock, Recycle, DragTableu, DropTableu } from './solitaire_back'
import { DragSource, DragSources } from 'lsolitaire'


import { Card, Stack, DragStack, Tableu, Cards } from './showcase'

import Sound from './sound'

import { Dealer } from './solitaire'


const reverse_forEach = <A>(a: Array<A>, f: (_: A) => void) => {
  for (let i = a.length - 1; i >= 0; i--) {
    f(a[i])
  }
}

type RecycleData = {
  on_recycle: () => void
}

class RecycleView extends Play {

  get data() {
    return this._data as RecycleData
  }

  _init() {



    let self = this
    this.make(Clickable, Vec2.make(20, 20), {
      rect: Rect.make(0, 0, 140, 160),
      on_click() {
        self.data.on_recycle()
      }
    })
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
  }



  add_stocks(cards: Array<Card>) {
    this.stock.add_cards(cards)
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

type SolitaireGameData = {
}

export class SolitaireGame extends Play {

  get data() {
    return this._data as SolitaireGameData
  }

  stock!: Stock
  tableus!: Array<Tableu>

  dealer!: Dealer

  cards!: Cards

  dragging?: DragStack
  drag_source?: DragSource


  recycle_view!: RecycleView

  _back_res!: BackRes

  get on_dispose_back() {
    return this._back_res.dispose
  }

  get cmd() {
    return this._back_res.cmd
  }

  get pov() {
    return this._back_res.pov
  }

  _dispose() {
    this.on_dispose_back()
  }

  _init() {


    let self = this
    let c = this.make(Clickable, Vec2.zero, {
      rect: Rect.make(0, 0, 0, 0),
      on_up() {
        if (self.dragging && !self.dragging.waiting) {

          self.pov.cancel_drag()

          let cards = self.dragging.lerp_release()
          let [source, n, i] = self.drag_source!

          switch (source) {
            case 'tableu':
              self.tableus[n].add_fronts(cards)
            break
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

    let stock = this.make(Stock, Vec2.make(stock_x, stock_y), { 
      on_hit() {
        self.cmd(HitStock)
      }
    })
    this.stock = stock


    let tableu_x = 350,
      tableu_y = 180,
      tableu_w = 200


    let tableus = n_seven.map(i => 
                this.make(Tableu, Vec2.make(tableu_x + tableu_w * i, tableu_y), {
                  on_front_drag(e: number, v: Vec2) {
                    if (self.dragging) {
                      self.dragging.drag(v)
                    } else {
                      self.cmd(DragTableu, { tableu: i, i: e })
                    }
                  },
                  on_front_drop() {
                    self.cmd(DropTableu, { tableu: i })
                  }
                }))
    this.tableus = tableus



    let dealer = this.make(Dealer, Vec2.zero, {
      on_shuffle() {

        dealer.cards.forEach(_ => self.cards.release(_))
        self._init_pov()
      }
    })

    this.dealer = dealer

    make_solitaire_back(this).then((back_res) => {
      
      this._back_res = back_res
      this._collect_pov()
    })
  }

  _shuffle_up_cards() {

  }

  _collect_pov() {

    let { dealer, stock, tableus } = this

    let cards = [
      ...stock.free(),
      ...tableus.flatMap(_ => _.free())
    ]

    cards.forEach(_ => this.cards.release(_))

    dealer.cards = OCards.deck.map(card => {
      let res = this.cards.borrow()
      res.card = card
      res.flip_front()
      return res
    })
    dealer.begin_laydeck()


  }

  _init_pov() {

    let { stock, tableus, cmd, pov } = this

    stock.add_stocks(pov.stock.stock.cards.map(card =>
                                               this.cards.borrow()))

    stock.add_waste_hidden(pov.stock.waste_hidden.cards.map(card =>
                                                            this.cards.borrow()))
    
    stock.add_waste(pov.stock.waste.cards.map(card =>
                                              this.cards.borrow()))
    n_seven.map(i => {
      let tableu = tableus[i]
      let t_pov = pov.tableus[i]

      tableu.add_backs(t_pov.backs.cards.map(card =>
        this.cards.borrow()))

      tableu.add_fronts(t_pov.fronts.cards.map(card => {
        let _ = this.cards.borrow()
        _.card = card
        return _
      }))
    })

  }

  wait_hit_stock() {
  }

  cant_hit_stock() {
  }

  hit_stock(cards: Array<OCard>) {
    this.stock.hit(cards)
  }


  wait_recycle() {
  }

  cant_recycle() {
  }

  recycle() {
    this.stock.recycle()
  }

  cant_drag_tableu(tableu: number, i: number) {
  }

  drag_tableu(tableu: number, i: number) {
    let cards = this.tableus[tableu].remove_fronts(i)

    Sound.play('drag')
    this.dragging = this.make(DragStack, Vec2.zero, {})
    this.drag_source =  DragSources.tableu(tableu, i)
    this.dragging.cards = cards

    this.cards.shadow_group = cards
  }

  flip_front(tableu: number, front: OCard) {
    this.tableus[tableu].flip_front(front)
  }

  drop_tableu(tableu: number) {
    let cards = this.dragging!.lerp_release()
    this.dragging = undefined
    this.tableus[tableu].add_fronts(cards)
    cards[0].after_ease(() => {
      this.cards.shadow_group = undefined
    })
  }

  wait_drop_tableu(tableu: number) {
    this.dragging!.wait_drop()
  }

  cant_drop_tableu(tableu: number) {
  }

  new_game() {
    this._collect_pov()
  }

  request_new_game() {
    this._back_res.new_game().then(() => {
      this.new_game()
    })
  }

  wait_new_game() {
  }
}
