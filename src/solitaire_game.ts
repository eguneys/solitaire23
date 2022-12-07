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

import { Text, RectView, Clickable, Background, MainMenu } from './game'
  
import { SolitaireHooks } from './hooks'
import { make_solitaire_back } from './solitaire_back'
import { CommandType } from './solitaire_back'
import { HitStock, Recycle, DragTableu, DropTableu } from './solitaire_back'
import { DragSource, DragSources } from 'lsolitaire'

type DragHook = (e: Vec2) => void
type DropHook = () => void

type CardData = {
  card: CardPov,
  back?: true
}

let card_origin = Vec2.make(102, 122.5)
class Card extends Play {

  get data() {
    return this._data as CardData
  }

  get easing() {
    return !!this._tx || !!this._ty || !!this._tr
  }

  _will_lerp_t?: number
  _will_lerp_position?: Vec2
  lerp_position(v?: Vec2, t?: number) {
    this._will_lerp_position = v
    this._will_lerp_t = t
  }

  get drag_decay() {
    return this._drag_decay
  }
  _drag_decay: Vec2 = Vec2.zero
  _on_drag?: DragHook
  bind_drag(e: DragHook) {
    this._on_drag = e
  }

  _on_drop?: DropHook
  bind_drop(e?: DropHook) {
    this._on_drop = e
  }

  _will_back!: boolean
  _back!: boolean

  ease_flip(value: boolean) {
    this._will_back = !value
  }

  ease_position(v: Vec2, duration: number = ticks.half) {
    this._tx = this.tween_single(this._tx, [this.position.x, v.x], (v) => {
      this.position.x = v
    }, duration, 0, () => { this._tx = undefined })

    this._ty = this.tween_single(this._ty, [this.position.y, v.y], (v) => {
      this.position.y = v
    }, duration, 0, () => { this._ty = undefined })
  }

  ease_rotation(v: Vec2) {
  }

  anim!: Anim

  _tr?: Tween
  _tx?: Tween
  _ty?: Tween



  _init() {

    this.anim = this.make(Anim, Vec2.zero, { name: 'card' })
    this.anim.origin = card_origin
    this.anim.play('back')

    this._back = true
    this._will_back = this.data.back || false

    let self = this
    this.make(Clickable, Vec2.make(16, 16).sub(this.anim.origin), {
      rect: Rect.make(0, 0, 170, 200),
      on_hover() {
        if (self._on_drag) {
          self.anim.play('hover')
        }
      },
      on_hover_end() {
        self.anim.play(self._back ? 'back' : 'idle')
      },
      on_click() {
      },
      on_drag_begin(e: Vec2) {
        if (self._on_drag) {
          self._drag_decay = e.sub(self.position)
        }
      },
      on_drag_end() {
      },
      on_drag(e: Vec2) {
        if (self._on_drag) {
          self._on_drag(e)
        }
      },
      on_drop() {
        if (self._on_drop) {
          self._on_drop()
        }
      }
    })
  }

  _update() {

    if (this._will_lerp_position) {
      this.position = Vec2.lerp(this.position, this._will_lerp_position, this._will_lerp_t ?? 0.5)
    }

    if (this._will_back !== this._back) {
      if (!this.easing) {
        this._back = this._will_back

        let next = this._back ? 'back' : 'idle'
          this.anim.play('flip', () => {
            this.anim.play(next)
          })

      }
    }
  }

}

class Cards extends Play {

  frees!: Array<Card>
  used!: Array<Card>


  borrow(data: CardData) {
    let _ = 
      this.frees.filter(_ => _.data.card === data.card)
    if (_.length === 0) {
      _ = this.frees.filter(_ => _.data.card === hidden_card)
    }

    let card = _[0]

    this.frees.splice(this.frees.indexOf(card), 1)
    this.used.push(card)

    return card
  }

  release(card: Card) {
    this.used.splice(this.used.indexOf(card), 1)
    this.frees.push(card)
  }


  _init() {
    this.frees = OCards.deck.map(card =>
                                this.make(Card, Vec2.zero, { card: hidden_card, back: true }))
    this.used = []
  }
}

type StackData = {
  h?: number
}
class Stack extends Play {

  get data() {
    return this._data as StackData
  }

  get length() {
    return this.cards.length
  }

  get top_card() {
    return this.cards[this.cards.length - 1]
  }

  get h() {
    return this.data.h ?? 66
  }

  get top_position() {
    return this.position.add(Vec2.make(0, this.cards.length * this.h))
  }

  add_cards(cards: Array<Card>) {
    this.cards.push(...cards)
    this._reposition()
  }

  remove_cards(n: number) {
    return this.cards.splice(-n)
  }

  _reposition() {
    this.cards.forEach((card, i) =>
                       card.ease_position(this.p_position.add(Vec2.make(0, i * this.h))))
  }

  ease_position(v: Vec2) {
    this.position = v
    this._reposition()
  }

  cards!: Array<Card>


  _init() {
    this.cards = []
  }


}

type TableuData = {
  on_front_drag: (i: number, v: Vec2) => void,
  on_front_drop: () => void
}

class Tableu extends Play {

  get data() {
    return this._data as TableuData
  }

  get top_front_position() {
    return this.fronts.top_position
  }

  get top_back_position() {
    return this.backs.top_position
  }

  add_backs(cards: Array<Card>) {
    this.backs.add_cards(cards)
    this.fronts.ease_position(this.top_back_position)
  }

  add_fronts(cards: Array<Card>) {

    this.fronts.add_cards(cards)
    cards.forEach(_ => _.ease_flip(true))

    let self = this
    let l = this.fronts.cards.length
    this.fronts.cards.forEach((_, i) => {
      _.bind_drop(undefined)
      _.bind_drag((e: Vec2) => {
        self.data.on_front_drag(l - i, e)
      })
    })
    this.fronts.top_card.bind_drop(() => {
      self.data.on_front_drop()
    })
  }

  remove_fronts(i: number) {
    let cards = this.fronts.remove_cards(i)
    cards.forEach(_ => {
      _.bind_drop(undefined)
    })
    let self = this
    this.fronts.top_card?.bind_drop(() => {
      self.data.on_front_drop()
    })
    return cards
  }

  backs!: Stack
  fronts!: Stack

  _init() {
    this.backs = this.make(Stack, Vec2.make(0, 0), { h: 33 })
    this.fronts = this.make(Stack, Vec2.make(0, 0), {})
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

  add_stocks(cards: Array<Card>) {
    this.stock.add_cards(cards)
  }

  hit(ocards: Array<OCard>) {
    let cards = this.stock.remove_cards(ocards.length)

    cards.forEach((card, i) => card.ease_flip(true))

    let waste = this.waste.remove_cards(this.waste.cards.length)

    this.waste_hidden.add_cards(waste)
    this.waste.add_cards(cards)

    reverse_forEach(this.waste_hidden.cards, _ => _.send_back())

    if (this.stock.length === 0) {
      this.recycle_anim.visible = true
    }
  }

  recycle() {
    let cards = [
      ...this.waste_hidden.remove_cards(this.waste_hidden.length),
      ...this.waste.remove_cards(this.waste.length)]

    cards.forEach(card => card.ease_flip(false))
    cards.forEach(card => card.send_front())

    this.stock.add_cards(cards)
    this.recycle_anim.visible = false

  }

  stock!: Stack
  waste!: Stack

  waste_hidden!: Stack

  recycle_anim!: Anim

  _init() {
    this.stock = this.make(Stack, Vec2.make(0, 0), { h: 1 })

    this.waste = this.make(Stack, Vec2.make(0, 300), {})
    this.waste_hidden = this.make(Stack, Vec2.make(0, 300), { h: 0 })

    this.recycle_anim = this.make(Anim, Vec2.make(-24, -16), { name: 'recycle' })
    this.recycle_anim.visible = false

    let self = this
    this.make(Clickable, Vec2.make(16, 16).sub(card_origin), {
      rect: Rect.make(0, 0, 170, 230),
      on_click() {
        if (self.stock.length > 0) {
          self.data.on_hit()
        } else {
          self.data.on_recycle()
        }
      },
      on_hover() {
        self.recycle_anim.play('hover')
      },
      on_hover_end() {
        self.recycle_anim.play('idle')
      }
    })
  }

}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

type DragStackData = {
  source: DragSource
}

class DragStack extends Play {

  get data() {
    return this._data as DragStackData
  }

  get waiting() {
    return this._waiting
  }
  _waiting: boolean = false
  wait_drop() {
    this._waiting = true
  }

  _cards!: Array<Card>
  set cards(cards: Array<Card>) {
    this._cards = cards
    this._cards.forEach(_ => _.send_front())
  }

  get drag_decay() {
    return this._cards[0].drag_decay
  }

  get h() {
    return 66
  }

  drag(v: Vec2) {
    this._cards.forEach((_, i) => {
      let _v = v.add(Vec2.make(0, this.h * i).sub(this.drag_decay))
      let t = 1-sigmoid(i/2)
      _.lerp_position(_v, t)
    })
  }

  release() {
    let cards = this._cards.splice(0)

    cards.forEach(_=> _.lerp_position())
    return cards
  }

  _init() {
    this._cards = []
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

  cards!: Cards

  dragging?: DragStack


  _init() {

    make_solitaire_back(this).then(({pov, cmd}) => {

      let self = this
      let c = this.make(Clickable, Vec2.zero, {
        rect: Rect.make(0, 0, 0, 0),
        on_up() {
          if (self.dragging && !self.dragging.waiting) {

            pov.cancel_drag()

            let cards = self.dragging.release()
            let [source, n, i] = self.dragging.data.source

            switch (source) {
              case 'tableu':
                self.tableus[n].add_fronts(cards)
              break
            }

            self.dragging.dispose()
            self.dragging = undefined
          }
        }
      })

      this.cards = this.make(Cards, Vec2.zero, {})

      this._init_pov(pov, cmd)
    })
  }

  _shuffle_up_cards() {

  }

  _init_pov(pov: SolitairePov, cmd: (ctor: CommandType, data?: any) => void) {
    let stock_x = 40,
      stock_y = 200

    let self = this
    let stock = this.make(Stock, Vec2.make(stock_x, stock_y).add(card_origin), { 
      on_hit() {
        cmd(HitStock)
      },
      on_recycle() {
        cmd(Recycle)
      }
    })
    this.stock = stock

    stock.add_stocks(pov.stock.stock.cards.map(card =>
                                               this.cards.borrow({ card, back: true })))

    let tableu_x = 260,
      tableu_y = 80,
      tableu_w = 200


    let tableus = pov.tableus.map((tableu, i) => 
                this.make(Tableu, Vec2.make(tableu_x + tableu_w * i, tableu_y).add(card_origin), {
                  tableu,
                  on_front_drag(e: number, v: Vec2) {
                    if (self.dragging) {
                      self.dragging.drag(v)
                    } else {
                      cmd(DragTableu, { tableu: i, i: e })
                    }
                  },
                  on_front_drop() {
                    cmd(DropTableu, { tableu: i })
                  }
                }))
    this.tableus = tableus

    n_seven.map(i => {
      let tableu = tableus[i]
      let t_pov = pov.tableus[i]

      tableu.add_backs(t_pov.backs.cards.map(card =>
        this.cards.borrow({ card, back: true })))

      tableu.add_fronts(t_pov.fronts.cards.map(card =>
        this.cards.borrow({ card })))
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

    this.dragging = this.make(DragStack, Vec2.zero, { source: DragSources.tableu(tableu, i) })
    this.dragging.cards = cards
  }

  drop_tableu(tableu: number) {
    let cards = this.dragging!.release()
    this.dragging = undefined
    this.tableus[tableu].add_fronts(cards)
  }

  wait_drop_tableu(tableu: number) {
    this.dragging!.wait_drop()
  }

  cant_drop_tableu(tableu: number) {
  }

}
