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

import { TransText, Text, RectView, Clickable, Background, MainMenu2 } from './game'
import { Settings2, HowtoPlay2 } from './game'
import { scene_transition }from './game'

import { HowtoPlay, Settings, About } from './game'

import { n_seven, card_sort_key, Cards, Card as OCard, SolitairePov, Solitaire } from 'lsolitaire'

import { ticks } from './shared'
import { RNG, random, int_random, v_random, v_random_h, v_screen, arr_random } from './util'
import { Tween } from './tween'

import { SolitaireGame } from './solitaire_game'

import { Button } from './ui'

type CardData = {
  card?: OCard,
  back?: true
}
class Card extends Play {

  get data() {
    return this._data as CardData
  }

  flip_back() {
    this.anim.play('flip', () => {
      this.anim.play('back')
    })
  }

  flip_front() {
    this.anim.play('flip', () => {
      this.anim.play('idle')
    }, true)
  }

  get easing() {
    return (!this._tx || this._tweens.find(_ => _[0] === this._tx))
  }

  ease_rotation(r: number, duration: number = ticks.half) {
    this._tr = this.tween_single(this._tr, [this.rotation, r], (v) => this.rotation = v, duration)
  }

  anim!: Anim

  _tr?: Tween
  _tx?: Tween
  _ty?: Tween

  ease_position(v: Vec2, duration: number = ticks.half) {
    this._tx = this.tween_single(this._tx, [this.position.x, v.x], (v) => {
      this.position.x = v
    }, duration)

    this._ty = this.tween_single(this._ty, [this.position.y, v.y], (v) => {
      this.position.y = v
    }, duration)
  }

  _init() {
     this.anim = this.make(Anim, Vec2.zero, { name: 'card' })
     this.anim.origin = Vec2.make(102, 122.5)
     if (this.data.back) {
       this.anim.play('back')
     } else {
       this.anim.play('idle')
     }

     let self = this
     this.make(Clickable, Vec2.make(8, 8), {
       rect: Rect.make(0, 0, 180, 220),
       on_hover() {
       },
       on_hover_end() {
       },
       on_click() {
       }
     })
  }
}

type StackData = {
  h?: number
}
class Stack extends Play {

  get data() {
    return this._data as StackData
  }

  get settled() {
    return this._cards.every(_ => !_.easing)
  }

  set_position(v: Vec2) {
    this.position.x = v.x
    this.position.y = v.y
    this._position_cards()
  }

  add_cards(cards: Array<Card>) {
    this._cards.push(...cards)
    this._position_cards()
  }

  pop_card() {
    return this._cards.pop()
  }

  _cards!: Array<Card>

  _init() {
    this._cards = []
  }

  get h() {
    return this.data.h || 66
  }

  get top_next_position() {
    return Vec2.make(this.position.x, this.position.y + this.h * this._cards.length)
  }

  _position_cards() {

    let { h } = this

    this._cards.forEach((_, i) => 
                        _.ease_position(
                          Vec2.make(this.position.x, this.position.y + h * i)))
  }

  _update() {
    this._cards.forEach(_ => _.update())
  }

  _draw(batch: Batch) {
    this._cards.forEach(_ => _.draw(batch))
  }
}

type StockData = {
  stock_position: Vec2
}
class Stock extends Play {
  get data() {
    return this._data as StockData
  }


  stock!: Stack

  _init() {
    this.stock = this.make(Stack, Vec2.make(0, 0), { h: 1 })
    this.stock.set_position(this.data.stock_position)

    this.make(Clickable, Vec2.make(0, 0), {
      debug: true,
      rect: Rect.make(0, 0, 320, 180),
      on_click() {
        console.log('here')
      }
    })
  }

  add_to_stock(cards: Array<Card>) {
    this.stock.add_cards(cards)
  }
}

type TableuData = {
  back_position: Vec2
}
class Tableu extends Play {
  get data() {
    return this._data as TableuData
  }

  backs!: Stack
  fronts!: Stack

  _init() {

    this.backs = this.make(Stack, Vec2.make(0, 0), { h: 33 })
    this.fronts = this.make(Stack, Vec2.make(0, 0), {})

    this.backs.set_position(this.data.back_position)
    this._position_stacks()

  }

  _act_on_settled?: () => void

  flip_front_top() {
    this._act_on_settled = () => {
      this._flip_front_top()
    }
  }

  _flip_front_top() {
    let card = this.backs.pop_card()!
    card.flip_front()
    this.fronts.add_cards([card])
    this._position_stacks()
  }

  add_to_back(card: Card) {
    this.backs.add_cards([card])
    this._position_stacks()
  }

  _position_stacks() {
    this.fronts.set_position(this.backs.top_next_position)
  }

  _update() {
    if (this._act_on_settled) {
      if (this.backs.settled && this.fronts.settled) {
        this._act_on_settled()
        this._act_on_settled = undefined
      }
    }
  }
}

let rnd_screen_poss = [...Array(50).keys()].map(() => v_random().mul(v_screen.scale(0.8)))

type ShufflerData = {
  on_end: () => void
}
class Shuffler extends Play {

  get data() {
    return this._data as ShufflerData
  }

  _timer?: number
  _cards: Array<Card> = []
  set cards(cards: Array<Card>) {
    this._cards = cards
    if (cards.length > 0) {
      this._timer = ticks.seconds * 1.5
    }
  }

  end_on_final_ease?: true

  _update() {

    if (this.end_on_final_ease) {
      if (this._cards.every(_ => !_.easing)) {
        this.end_on_final_ease = undefined
        this.data.on_end()
      }
    }

    if (Time.on_interval(ticks.three)) {
      if (this._timer) {

        this._timer -= Time.delta
        if (this._timer < 0) {
          this._timer = undefined
          this.end_on_final_ease = true
          this._cards
          .forEach((card, i) => {
            card.ease_position(Vec2.make(v_screen.x / 2, v_screen.y * 0.8),
                               ticks.half + ticks.half * (i / this._cards.length))
          })

        } else {

          let from = arr_random(rnd_screen_poss)
          let dir = v_random_h()
          let to = Vec2.max(Vec2.min(from.add(dir.scale(100)), v_screen), Vec2.zero)

          for (let i = 0; i < 3; i++) {
            this._cards
            .filter(_ => !_.easing)
            .sort((a, b) => a.position.distance(from) - b.position.distance(from))
            .slice(0, 2 + int_random(2))
            .forEach((card, i) => {
              card.ease_position(to.add(v_random_h().scale(i * 5)), 
                                 ticks.half 
                                 + random() * 3 * ticks.sixth)
            })
          }
        }
      }
    }

    this._cards.forEach(_ => _.update())
  }

  _draw(batch: Batch) {

    this._cards.forEach(_ => _.draw(batch))
  }
}


/* https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
export function arr_shuffle<A>(a: Array<A>, rng: RNG = random) {
  let b:number,
  c:number, 
  d: A

  c=a.length;while(c)b=rng()*c--|0,d=a[c],a[c]=a[b],a[b]=d;
  return a
}

/* https://www.toptal.com/developers/sorting-algorithms/shell-sort */
function *shell_sort<A>(a: Array<A>) {
  let n = a.length
  let h = 1
  while (h < n) { h = 3*h + 1 }

  while (h > 0) {
    h = Math.floor(h / 3)
    for (let k = 1; k <= h; k++) {
      for (let res of insertion_sort(a,k,h)) {
        yield res
      }
    }
  }
}
function *insertion_sort<A>(a: Array<A>,s: number,c: number) {
  let n = a.length
  for (let i = s + c; i < n;i+=c) {
    for (let k = i; k >= c && a[k] < a[k-1]; k-=c) {
      // swap a[k,k-1]
      a[k] = [a[k-1], a[k-1]=a[k]][0]
      yield [k, k-1] as [number, number]
    }
  }
}


const layout_line_pos = (i: number, n: number) => {
  let angle = (i / (n - 1)) * Math.PI
  angle = rmap(angle / Math.PI, -Math.PI * 0.2, Math.PI * 0.2) - Math.PI * 0.5
  let o = v_screen.scale(1/2).sub(Vec2.up.scale(1200))
    let p = o.add(Vec2.from_angle(angle, 1400))
  let r = p.sub(o).normal.angle + Math.PI / 2
  return [p, r] as [Vec2, number]
}


type LaydeckData = {
  on_layout: () => void
}
class Laydeck extends Play {

  get data() {
    return this._data as LaydeckData
  }

  _cards: Array<Card> = []
  layer?: [number, Array<number>]

  _sort_shot?: Array<Array<Card>>

  flip_i?: number

  final?: true
  end_on_final_ease?: true

  set cards(cards: Array<Card>) {
    this._cards = cards
    if (cards.length > 0) {
      this._begin_lay()
    }
  }

  _begin_lay() {
    arr_shuffle(this._cards)
    this.layer = [0, arr_shuffle(this._cards.map((_, i) => i))]
  }

  _begin_sort() {
    let _ = this._cards.map(_ => !_.data.card ? -1 : card_sort_key(_.data.card))
    this._sort_shot = []
    let sorter = shell_sort(_)
    let n = Math.floor(_.length / 3)
    let i = 0
    let _cards = this._cards.slice(0)
    for (let swap of sorter) {
      let [a, b] = swap
      let tmp = _cards[a]
      _cards[a] = _cards[b]
      _cards[b] = tmp

      if (i++ > 3 && i%n === 0) {
        this._sort_shot.push(_cards.slice(0))
      }
    }
    this._sort_shot.push(_cards)
  }

  _begin_flip() {
    this.flip_i = 0
  }

  _update() {

    if (this.layer) {

      let [i, a] = this.layer
      for (let j = 0; j < 1; j++) {
        if (i >= a.length) {
          if (this._cards.every(_ => !_.easing)) {
            this.layer = undefined
            this._begin_sort()
          }
          break
        }
        if (Time.on_interval(ticks.three)) {
          let [p, r] = layout_line_pos(i, this._cards.length)
          this._cards[i].ease_position(p)
          this._cards[i].ease_rotation(r)
          i++
        }
      }

      if (this.layer) {
        this.layer[0] = i
      }
    }

    if (this._sort_shot) {
      if (this._sort_shot.length === 0) {
        this._sort_shot = undefined
        this._begin_flip()
      } else {
        if (Time.on_interval(ticks.sixth)) {
          let shot = this._sort_shot.pop()!

          this._cards.forEach((card, i) => {
            let j = shot.findIndex(_ => _ === card)

            if (i !== j) {
              let [p, r] = layout_line_pos(j, this._cards.length)
              this._cards[i].ease_position(p)
              this._cards[i].ease_rotation(r)
            }
          })

          this._cards = shot

        }
      }
    }

    if (this.flip_i !== undefined) {
      if (Time.on_interval(ticks.three)) {
        this._cards[this.flip_i].flip_back()

        this.flip_i++;
        if (this.flip_i >= this._cards.length) {
          this.flip_i = undefined
          this.final = true
        }
      }
    }

    if (this.final) {
      this.final = undefined
      this.end_on_final_ease = true

      this._cards.forEach(_ => {
        let [p, r] = layout_line_pos(2, 5)
        _.ease_position(p)
        _.ease_rotation(r)
      })
    }

    if (this.end_on_final_ease) {
      if (this._cards.every(_ => !_.easing)) {
        this.end_on_final_ease = undefined

        this.data.on_layout()

      }
    }

    this._cards.forEach(_ => _.update())
  }

  _draw(batch: Batch) {
    this._cards.forEach(_ => _.draw(batch))
  }

}

class MakeSolitaireGame extends Play {

  _cards: Array<Card> = []

  set cards(cards: Array<Card>) {
    this._cards = cards.slice(0)
    this._begin_make()
  }

  _update() {

    this._cards.forEach(_ => _.update())
  }

  _draw(batch: Batch) {

    this._cards.forEach(_ => _.draw(batch))

    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    batch.pop_matrix()

  }


  _begin_make() {

    let n_seven = [...Array(7).keys()]

    let tableu_x = 360,
    tableu_y = 180
    let w = 200
    let tableus = n_seven.map(i => this.make(Tableu, Vec2.make(0, 0), {
      back_position: Vec2.make(tableu_x + w * i, tableu_y)
    }))

    let stock_x = 132,
      stock_y = 340

    let stock = this.make(Stock, Vec2.make(0, 0), {
      stock_position: Vec2.make(stock_x, stock_y)
    })

    let f_cards = n_seven.map(i => this._cards.splice(0, i + 1))

    f_cards.forEach(n0 => {
      n0.forEach((card, i) => {
        tableus[6-i].add_to_back(card)
      })
    })

    stock.add_to_stock(this._cards.splice(0))


    tableus.forEach(t => t.flip_front_top())
  }


}

type DealerData = {
  cards: Array<OCard>
}

class Dealer extends Play {

  get data() {
    return this._data as DealerData
  }

  cards!: Array<Card>
  shuffler!: Shuffler
  laydeck!: Laydeck
  maker!: MakeSolitaireGame

  _init() {

    let starting_position = Vec2.make(v_screen.x * 0.5, v_screen.y * 0.8)
    this.cards = this.data.cards
    .map(_ => this._make(Card, Vec2.make(starting_position.x, starting_position.y), {
      card: _
    }))

    let self = this
    this.laydeck = this.make(Laydeck, Vec2.make(0, 0), {
      on_layout() {
        self.laydeck.cards = []
        self.begin_shuffle()
      }
    })
    this.shuffler = this.make(Shuffler, Vec2.make(0, 0), {
      on_end() {
        self.shuffler.cards = []
        self.begin_real_deal()
      }
    })

    this.maker = this.make(MakeSolitaireGame, Vec2.make(0, 0), {
    })
  }

  begin_real_deal() {
    this.maker.cards = this.cards
  }

  begin_laydeck() {
    this.laydeck.cards = this.cards
  }

  begin_shuffle() {
    this.shuffler.cards = this.cards
  }

}

class ScoreBoard extends Play {

  _init() {
    let _ = this.make(TransText, Vec2.make(0, 0), {
      key: 'score',
      center: true,
      width: 200,
      height: 100
    })
    this.make(TransText, Vec2.make(0, _.height), {
      no_trans: true,
      key: '1000',
      center: true,
      width: 200,
      height: 100
    })



  }
}

export class SolitairePlay extends Play {

  _init() {

    let sidebar: SideBar

    this.make(Background, Vec2.zero, undefined)

    let game = this.make(SolitaireGame, Vec2.make(0, 0), {})

    this.make(Button, Vec2.make(160, 1000), {
      text: 'undo',
      on_click() {
        console.log('undo')
      }
    })

    this.make(ScoreBoard, Vec2.make(150, 760), {
    })


    let overlay = this.make(RectView, Vec2.zero, {
      w: 1920,
      h: 1080,
      color: Color.white
    })
    overlay.visible = false

    this.make(Hamburger, Vec2.make(2, 2), {
      on_click: () => {
        sidebar.open = !sidebar.open
        overlay.visible = sidebar.open
      }
    })

    sidebar = this.make(SideBar, Vec2.make(-400, 180), {
    })


  }
}


class SideBar extends Play {

  get x() {
    return this.open ? 8 : -400
  }

  open: boolean = false

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 400,
      h: 820,
      color: Color.black
    })

    let x = 20
    let y = 60 
    let h = 160
    this.make(SideBarItem, Vec2.make(x, y), {
      text: 'main_menu',
      on_click() {
        scene_transition.next(MainMenu2)
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h), {
      text: 'new_game',
      on_click() {
      }
    })

    this.make(SideBarItem, Vec2.make(x, y + h * 2), {
      text: 'settings',
      on_click() {
        scene_transition.next(Settings2)
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h * 3), {
      text: 'how_to_play',
      on_click() {
        scene_transition.next(HowtoPlay2)
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h * 4), {
      text: 'about',
      on_click() {
        scene_transition.next(About)
      }
    })
  }

  _update() {
    this.position.x = appr(this.position.x, this.x, Time.delta * 1000)
  }

}


type SideBarItemData = {
  text: string,
  on_click: () => void
}
class SideBarItem extends Play {
  get data() {
    return this._data as SideBarItemData
  }

  _init() {
    this.make(TransText, Vec2.make(0, 0), {
      key: this.data.text,
      width: 350,
      height: 100
    })


    let w = 360,
      h = 120

    let self = this

    this.make(Clickable, Vec2.make(0, 0), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
      },
      on_hover_end() {
      },
      on_click() {
        self.data.on_click()
      }
    })


  }


}

type HamburgerData = {
  on_click: () => void
}

class Hamburger extends Play {

  get data() {
    return this._data as HamburgerData
  }

  _init() {

    this.make(Anim, Vec2.make(0, 0), {
      name: 'menu_bar'
    })


    let w = 200,
      h = 100

    let self = this

    this.make(Clickable, Vec2.make(20, 20), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
      },
      on_hover_end() {
      },
      on_click() {
        self.data.on_click()
      }
    })


  }
}
