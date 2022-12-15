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
import { About2, Settings2, HowtoPlay2 } from './game'
import { scene_transition }from './game'

import { n_seven, card_sort_key, Cards, Card as OCard, SolitairePov, Solitaire } from 'lsolitaire'

import { ticks } from './shared'
import { RNG, random, int_random, v_random, v_random_h, v_screen, arr_random } from './util'
import { Tween } from './tween'

import { SolitaireGame } from './solitaire_game'

import { Button } from './ui'

import { SolitaireStore } from './store'
import { Card } from './showcase'

let rnd_screen_poss = [...Array(50).keys()].map(() => v_random().mul(v_screen.scale(0.8)))

type ShufflerData = {
  on_end: () => void
}
export class Shuffler extends Play {

  get data() {
    return this._data as ShufflerData
  }

  _timer?: number
  _cards: Array<Card> = []
  set cards(cards: Array<Card>) {
    this._cards = cards
    if (cards.length > 0) {
      this._timer = ticks.seconds * 0.5
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
      yield * insertion_sort(a,k,h)
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
export class Laydeck extends Play {

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
    let _ = this._cards.map(_ => !_.card ? -1 : card_sort_key(_.card))
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
        this._sort_shot.unshift(_cards.slice(0))
      }
    }
    this._sort_shot.unshift(_cards)
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

type DealerData = {
  on_shuffle: () => void
}

export class Dealer extends Play {

  get data() {
    return this._data as DealerData
  }

  get cards() {
    return this._cards
  }

  set cards(cards: Array<Card>) {
    this._cards = cards
  }

  _cards!: Array<Card>
  shuffler!: Shuffler
  laydeck!: Laydeck

  _init() {

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
        self.data.on_shuffle()
      }
    })
  }

  begin_laydeck() {
    this.laydeck.cards = this._cards
  }

  begin_shuffle() {
    this.shuffler.cards = this._cards
  }

}

class ScoreBoard extends Play {

  _score!: number

  set score(score: number) {
    this._score = score
    this.score_text.text = `${score}`
    this.score_text_shadow.text = `${score}`
  }

  get score() {
    return this._score
  }

  score_text!: TransText
  score_text_shadow!: TransText

  _init() {
    this._score = 0
    let _ = this.make(TransText, Vec2.make(0, 25), {
      key: 'score',
      width: 80,
      height: 100
    })
    this.score_text_shadow = this.make(TransText, Vec2.make(100, 6), {
      no_trans: true,
      key: `${this.score}`,
      width: 180,
      height: 100,
      color: Color.black
    })
    this.score_text = this.make(TransText, Vec2.make(100, 0), {
      no_trans: true,
      key: `${this.score}`,
      width: 180,
      height: 100
    })
  }
}

type OverlayData = {
  on_close: () => void
}
class Overlay extends Play {

  get data() {
    return this._data as OverlayData
  }

  _init() {

    [
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
      v_random().mul(v_screen),
    ].forEach(v => {
      let _ = this.make(Anim, v, {
        name: 'swiggle'
      })
      _.origin = Vec2.make(600, 400)
      _.scale = Vec2.one.scale(0.5 + v_random().x)
      if (v_random().y < 0.5) {
        _.play('small')
      }
      _.rotation = v_random().y * Math.PI
    })



    let self = this
    this.make(Clickable, Vec2.zero, {
      rect: Rect.make(0, 0, 1920, 1080),
      on_hover() {
        return true
      },
      on_drag() {
        return true
      },
      on_click() {
        self.data.on_close()
        return true
      }
    })
  }
}

export class SolitairePlay extends Play {

  set sidebar_open(v: boolean) {
    this.sidebar.open = v
    this.overlay.visible = v
    this.hamburger.open = v
  }

  hamburger!: Hamburger
  sidebar!: SideBar
  overlay!: Overlay

  _init() {

    let sidebar: SideBar
    let scoreboard: ScoreBoard

    this.make(Background, Vec2.zero, undefined)

    let game = this.make(SolitaireGame, Vec2.make(0, 0), {
      on_score(score: number) {
        scoreboard.score = score
      }
    })

    this.make(Button, Vec2.make(160, 1000), {
      text: 'undo',
      on_click() {
        game.request_undo()
      }
    })

    scoreboard = this.make(ScoreBoard, Vec2.make(16, 860), {})

    let self = this
    let overlay = this.make(Overlay, Vec2.zero, {
      on_close() {
        self.sidebar_open = false
        self.hamburger.open = false
      }
    })

    let hamburger = this.make(Hamburger, Vec2.make(2, 2), {
      on_open: (v: boolean) => {
        self.sidebar_open = v
      }
    })

    sidebar = this.make(SideBar, Vec2.make(-600, 180), {
      on_new_game() {
        game.request_new_game()
        self.sidebar_open = false
      }
    })

    this.sidebar = sidebar
    this.overlay = overlay
    this.hamburger = hamburger

    this.sidebar_open = false

  }
}

type SideBarData = {
  on_new_game: () => void
}

class SideBar extends Play {

  get data() {
    return this._data as SideBarData
  }

  _t_x?: Tween

  _open!: boolean
  set open(v: boolean) {
    this._open = v

    if (this._t_x) {
      this.cancel(this._t_x)
    }

    if (v) {
      this._t_x = this.tween([this.position.x, 0], (v) => {
        this.position.x = v
      }, ticks.sixth, 0, () => {
        this._t_x = undefined
      })
    } else {
      this._t_x = this.tween([this.position.x, -600], (v) => {
        this.position.x = v
      }, ticks.sixth, 0, () => {
        this._t_x = undefined
      })
    }
  }

  _init() {
    this._open = false

    let self = this
    let _ = this.make(Anim, Vec2.make(0, -100), {
      name: 'side_menu_bg'
    })
    _.scale = Vec2.make(1.4, 1.4)

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
        self.data.on_new_game()
      }
    })

    this.make(SideBarItem, Vec2.make(x, y + h * 2), {
      text: 'settings',
      on_click() {
        scene_transition.next(Settings2, Vec2.zero, {
          selected_index: 1,
          on_back: SolitairePlay
        })
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h * 3), {
      text: 'how_to_play',
      on_click() {
        scene_transition.next(HowtoPlay2, Vec2.zero, {
          selected_index: 0,
          on_back: SolitairePlay
        })
      }
    })
    this.make(SideBarItem, Vec2.make(x, y + h * 4), {
      text: 'about',
      on_click() {
        scene_transition.next(About2, Vec2.zero, {
          on_back: SolitairePlay
        })
      }
    })
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

  _t_color?: Tween
  _i_color!: number

  get i_color() {
    return this._i_color
  }

  set i_color(v: number) {
    this._i_color = v

    this.bg.color = Color.lerp(Color.white, Color.hex(0x202431), this._i_color)
    this.fg.color = Color.lerp(Color.white, Color.hex(0x202431), 1 - this._i_color)

  }


  set hover(v: boolean) {

    if (this._t_color) {
      this.cancel(this._t_color)
    }

    if (v) {
      this._t_color = this.tween([this.i_color, 0], (v) => {
        this.i_color = v
      }, ticks.sixth, 0, () => {
        this._t_color = undefined
      })
    } else {
      this._t_color = this.tween([this.i_color, 1], (v) => {
        this.i_color = v
      }, ticks.sixth, 0, () => {
        this._t_color = undefined
      })
    }
  }

  bg!: RectView
  fg!: TransText

  _init() {

    this._i_color = 0
    this.bg = this.make(RectView, Vec2.make(-20, -40), {
      w: 412,
      h: 120,
      color: Color.hex(0x202431)
    })

    this.fg = this.make(TransText, Vec2.make(0, 0), {
      key: this.data.text,
      width: 350,
      height: 100,
      color: Color.white
    })


    let w = 360,
      h = 120

    let self = this

    this.make(Clickable, Vec2.make(-20, -40), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
        self.hover = true
      },
      on_hover_end() {
        self.hover = false
      },
      on_click() {
        self.data.on_click()
        return true
      }
    })
  }


}

type HamburgerData = {
  on_open: (v: boolean) => void
}

class Hamburger extends Play {

  get data() {
    return this._data as HamburgerData
  }

  _open!: boolean

  set open(v: boolean) {
    this._open = v
    if (this._open) {
      this.anim.play('open')
    } else {
      this.anim.play('idle')
    }
  }

  anim!: Anim

  _init() {

    this._open = false

    let anim = this.make(Anim, Vec2.make(0, 0), {
      name: 'hmg_bg'
    })
    this.anim =anim


    let w = 200,
      h = 100

    let self = this

    this.make(Clickable, Vec2.make(20, 20), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
        anim.play(self._open ? 'open_hover':'hover')
      },
      on_hover_end() {
        anim.play(self._open ? 'open':'idle')
      },
      on_click() {
        self.open = !self._open
        self.data.on_open(self._open)
        return true
      }
    })


  }
}
