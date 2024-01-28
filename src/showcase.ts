import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { Hooks, EventPosition, DragEvent } from './input'
import { howtos } from './howtos'
import { Transition, transition } from './transition'

import { rmap, ease_quad, ease, lerp, appr } from './lerp'
import { InfiniteScrollableList } from './scrollable'

import { bg1, link_color, Play, PlayType} from './play'

import { ticks } from './shared'
import { Anim } from './anim'
import { Tween } from './tween'

import { Text, RectView, Clickable, Background } from './game'
import { Button } from './ui'
import { Rank, Suit, Cards as OCards, Card as OCard, CardPov, hidden_card } from 'lsolitaire'

import { v_random, arr_random } from './util'

type DragHook = (e: Vec2) => void
type DropHook = () => void

const suit_long: Record<Suit, string> = { 's': 'spades', 'd': 'diamonds', 'h': 'hearts', 'c': 'clubs' }
const rank_long: Record<Rank, string> = { 'A': 'a', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', 'T': 't', 'J': 'j', 'Q': 'q', 'K': 'k' }

export class SuitRankDecoration extends Play {

  _card!: CardPov

  get waiting() {
    return this._card === hidden_card
  }

  get card() {
    return this._card
  }

  set card(card: CardPov) {
    this._card = card
    this.rank.play_now(rank_long[card[1] as Rank])
    this.suit.play_now(suit_long[card[0] as Suit])
    this.rsuit.play_now(suit_long[card[0] as Suit])
    this.decsuit.forEach(_ => _.play_now(suit_long[card[0] as Suit]))

  }

  rank!: Anim
  rsuit!: Anim
  suit!: Anim
  decsuit!: Array<Anim>

  _init() {

    let v_next = Vec2.make(40, 50);
    this.decsuit = [...Array(3).keys()].map(() => 
                             (v_next = v_next
                              .add(v_random()
                                   .mul(Vec2.make(4, 30))
                                   .add(Vec2.make(0, 30)))))
    .map(v => {
      let _ = this.make(Anim, v, { name: 'suit'})

      _.origin = Vec2.make(32, 32)
      _.play_now('spades')
      _.scale = Vec2.one.scale(v_random().x * 0.2).add(Vec2.make(0.2, 0.2))
      return _
    })
    let more_suits = [...Array(2).keys()]
    .map(() =>
         (v_next = v_next
          .sub(v_random()
               .mul(Vec2.make(24, 20))
               .add(Vec2.make(0, 30)))))
    .map(v => {
      v.x += 120
      let _ = this.make(Anim, v, { name: 'suit'})

      _.origin = Vec2.make(32, 32)
      _.play_now('spades')
      _.scale = Vec2.one.scale(v_random().x * 0.2).add(Vec2.make(0.2, 0.2))
      return _
    })
    this.decsuit.push(...more_suits)

    this.rank = this.make(Anim, Vec2.make(140, 32), { name: 'rank_2' })
    this.rank.origin = Vec2.make(32, 32)
    this.rank.play_now('a')
    this.rank.scale = Vec2.make(0.6, 0.6)




    this.suit = this.make(Anim, Vec2.make(30, 32), { name: 'suit' })
    this.suit.origin = Vec2.make(32, 32)
    this.suit.play_now('spades')
    this.suit.scale = Vec2.make(0.6, 0.6)


    this.rsuit = this.make(Anim, Vec2.make(150, 210), { name: 'suit' })
    this.rsuit.origin = Vec2.make(32, 32)
    this.rsuit.rotation = Math.PI
    this.rsuit.play_now('spades')
    this.rsuit.scale = Vec2.make(0.6, 0.6)


  }
}

export class Card extends Play {

  decoration!: SuitRankDecoration

  release() {
    this.lerp_position()
    this.unset_dragging()

    this.set_highlight(false)
    this.bind_click(undefined)
    this.bind_drag(undefined)
    this.bind_drop(undefined)
    this.bind_hover(undefined)
    this._after_ease = undefined
  }

  lerp_release() {
    this.lerp_position()
    this.unset_dragging()
  }



  get waiting() {
    return this.decoration.waiting
  }

  get card() {
    return this.decoration.card
  }

  set card(card: CardPov) {
    this.decoration.card = card
    if (this.waiting) {
      if (this.anim._animation === 'idle') {
        this.anim.play_now('wait')
        this.decoration.visible = false
      }
    } else {
      if (this.anim._animation === 'wait') {
        this.anim.play_now('idle')
        this.decoration.visible = true
      }
    }
  }

  get flipping() {
    return this.anim._animation === 'flip' || this.anim._animation === 'back_flip'
  }

  get easing() {
    return !!this._tx || !!this._ty || !!this._tr
  }

  _will_lerp_t?: number
  _will_lerp_position?: Vec2
  lerp_position(v?: Vec2, t?: number) {
    if (this._tx) {
      this.cancel(this._tx)
      this._tx = undefined
    }
    if (this._ty) {
      this.cancel(this._ty)
      this._ty = undefined
    }

    this._will_lerp_position = v
    this._will_lerp_t = t
    if (v) {
      this._target_speed = (1-(t || 0.5)) * 0.2
    } else {
      this._target_speed = 0
    }
  }

  _drop_rect?: DragStack
  bind_drop_rect(_?: DragStack) {
    this._drop_rect = _
  }

  _clickable!: Clickable

  _dragging!: boolean

  get drag_decay() {
    return this._drag_decay
  }
  _drag_decay: Vec2 = Vec2.zero
  _on_drag?: DragHook
  bind_drag(e?: DragHook) {
    this._on_drag = e
  }

  _on_drop?: DropHook
  bind_drop(e?: DropHook) {
    this._on_drop = e
  }

  _on_hover?: [DropHook, DropHook]
  bind_hover(e?: [DropHook, DropHook]) {
    this._on_hover = e
  }

  _on_click?: DropHook
  bind_click(e?: DropHook) {
    this._on_click = e
  }

  facing!: number

  anim!: Anim
  shadow!: Anim
  highlight!: Anim

  _will_hover!: boolean
  _will_hover_end!: boolean
  _will_flip_back!: boolean
  _will_flip_front!: boolean
  
  lerp_hover_y!: number

  _lerp_drag_shadow?: number

  _tr?: Tween
  _tx?: Tween
  _ty?: Tween

  _target_speed!: number
  _speed!: number

  _hover_time?: number
  get hover_time() {
    return this._hover_time ?? 0
  }

  ease_rotation(r: number, duration: number = ticks.half) {
    this._tr = this.tween_single(this._tr, [this.rotation, r], (v) => {
      this.rotation = v
    }, duration, 0, () => { 
      this._tr = undefined
    })
  }

  ease_position(v: Vec2, duration: number = ticks.half) {
    if (v.equals(this.position)) {
      return
    }
    this._target_speed = (duration / ticks.half) * 0.2
    this._tx = this.tween_single(this._tx, [this.position.x, v.x], (v) => {
      this.position.x = v
    }, duration, 0, () => { 
      this._tx = undefined 
      this._target_speed = 0
    })

    this._ty = this.tween_single(this._ty, [this.position.y, v.y], (v) => {
      this.position.y = v
    }, duration, 0, () => { this._ty = undefined })
  }

  set_highlight(highlight: boolean) {
    this.highlight.visible = highlight
  }

  set_dragging() {
    this._lerp_drag_shadow = 0
    this._dragging = true
  }

  unset_dragging() {
    this._dragging = false
  }


  _after_ease?: () => void
  after_ease(fn: () => void) {
    this._after_ease = fn
  }

  _init() {
    
    this.shadow = this._make(Anim, Vec2.make(0, 0), { name: 'card' })
    this.shadow.origin = Vec2.make(88, 120)
    this.shadow.play_now('shadow')

    this.anim = this.make(Anim, Vec2.make(0, 0), { name: 'card' })
    this.anim.origin = Vec2.make(88, 120)
    this.facing = -1
    this.anim.play_now('back_idle')

    this.highlight = this.make(Anim, Vec2.make(0, 0), { name: 'card' })
    this.highlight.origin = Vec2.make(88, 120)
    this.highlight.play_now('highlight')
    this.highlight.visible = false



    this.decoration = this.make(SuitRankDecoration, Vec2.make(-80, -120), {})
    this.decoration.visible = false
    this.decoration.card = hidden_card

    this._will_hover = false
    this._will_hover_end = false

    this._will_flip_back = false
    this._will_flip_front = false

    this.lerp_hover_y = 0

    this._dragging = false

    this._speed = 0
    this._target_speed = 0

    this.hit_area = Rect.make(16 - this.anim.origin.x, 16 - this.anim.origin.y, 170, 210)

    /*
    let self = this
    this._clickable = this.make(Clickable, Vec2.make(16, 16).sub(this.anim.origin), {
      rect: Rect.make(0, 0, 170, 210),
      on_click() {
        if (self._on_click) {
          return self._on_click()
        }
      },
      on_hover() {
        if (self._on_hover) {
          self._on_hover[0]()
        }
        if (self._on_drag) {
          self._will_hover = true
          return true
        }
        return false
      },
      on_hover_end() {
        if (self._on_hover) {
          self._on_hover[1]()
        }
        self._will_hover_end = true
      },
      on_drag_begin(e: Vec2) {
        if (self._on_drag) {
          self._lerp_drag_shadow = 0
          self._dragging = true
          self._drag_decay = e.sub(self.position)
          return true
        }
        return false
      },
      on_drag_end() {
        self._dragging = false
      },
      on_drag(e: Vec2) {
        if (self._on_drag) {
          self._on_drag(e)
          return true
        }
        return false
      },
      on_drop() {
        if (self._on_drop) {
          self._on_drop()
        }
      },
      get_drop_rect(e: Vec2) {
        return self.drop_rect
      }
    })
    */

  }

  _update() {

    this._speed = lerp(this._speed, this._target_speed, 0.2)
    let n = ease_quad(Math.abs(Math.sin(Time.seconds * 3))) * this._speed
    this.scale = Vec2.make(1-n, 1+n)


    if (this._will_lerp_position) {
      this.position = Vec2.lerp(this.position, this._will_lerp_position, this._will_lerp_t ?? 0.5)
    }

    if (this._lerp_drag_shadow !== undefined) {
      if (this._dragging) {
        this._lerp_drag_shadow = lerp(this._lerp_drag_shadow, 1, 0.2)
      } else {
        this._lerp_drag_shadow = lerp(this._lerp_drag_shadow, 0, 0.2)
        if (this._lerp_drag_shadow < 0.001) {
          this._lerp_drag_shadow = undefined
        }
      }
    }

    if (this._lerp_drag_shadow !== undefined) {
      let t = this._lerp_drag_shadow * 0.05
      this.shadow.scale = Vec2.one.add(Vec2.one.scale(t))
      this.shadow.alpha = (1.0 - this._lerp_drag_shadow) * 100 + 155
    }

    if (this._after_ease && !this.easing) {
      this._after_ease()
      this._after_ease = undefined
    }


    if (!this.easing) {
      this.anim.position.y = lerp(this.anim.position.y, this.lerp_hover_y, 0.2)
      this.decoration.position.y = lerp(this.decoration.position.y, this.lerp_hover_y - 120, 0.16)
      this.highlight.position.y = lerp(this.highlight.position.y, this.lerp_hover_y, 0.16)
    }

    if (this._will_hover) {
      this._will_hover = false
      if (!this.easing && !this.flipping && this._will_flip_back && this._will_flip_front) {
        this.anim.play(this.facing === 1 ? 'hover' : 'back_hover')
      }
      this.lerp_hover_y = -6
      this._hover_time = 0
    }
    if (this._will_hover_end) {
      this._will_hover_end = false
      let idle_wait = this.waiting ? 'wait': 'idle'
      if (!this.easing && !this.flipping && this._will_flip_back && this._will_flip_front) {
        this.anim.play(this.facing === 1 ? idle_wait: 'back_idle')
      }
      this.lerp_hover_y = 0
      this._hover_time = undefined
    }

    if (this._hover_time !== undefined && this._hover_time >= 0) {
      if (this.easing) {
        this._hover_time = 0
      }
      this._hover_time += Time.delta
    }

    if (this._will_flip_back) {
      if (!this.easing) {
        this._will_flip_back = false
        this.shadow.visible = false
        this.decoration.visible = false
        this.anim.play_now('flip', () => {
          this.facing = -1
          this.anim.play('back_idle')
          this.shadow.visible = true
        })
      }
    }

    if (this._will_flip_front) {
      if (!this.easing) {

        this._will_flip_front = false
        this.shadow.visible = false
        this.decoration.visible = false
        this.anim.play_now('back_flip', () => {
          this.facing = 1
          this.anim.play(this.waiting ? 'wait' : 'idle')
          this.shadow.visible = true

          if (!this.waiting) {
            this.decoration.visible = true
          }
        })
      }
    }
  }

  flip_back() {
    this._will_flip_front = false
    this._will_flip_back = this.facing !== -1 || this.anim._animation === 'back_flip'
  }

  flip_front() {
    this._will_flip_back = false
    this._will_flip_front = this.facing !== 1 || this.anim._animation === 'flip'
  }

  _draw_shadow(batch: Batch) {
    batch.push_matrix(Mat3x2.create_transform(this.position, this.origin, this.scale, this.rotation))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)


    this.shadow.draw(batch)

    batch.pop_matrix()
  }

}


export class CardDropTarget extends Play {

  _on_click?: DropHook
  bind_click(e?: DropHook) {
    this._on_click = e
  }


  _on_drop?: DropHook
  bind_drop(e?: DropHook) {
    this._on_drop = e
  }

  _will_hover!: boolean
  _will_hover_end!: boolean

  anim!: Anim

  _init() {

    this.anim = this._make(Anim, Vec2.make(0, 0), { name: 'card' })
    this.anim.origin = Vec2.make(88, 120)

    let self = this
    this.make(Clickable, Vec2.make(16, 16).sub(this.anim.origin), {
      rect: Rect.make(0, 0, 170, 210),
      on_hover() {
        if (self._on_drop) {
          self._will_hover = true
          return true
        }
        return false
      },
      on_hover_end() {
        self._will_hover_end = true
      },
      on_drop() {
        if (self._on_drop) {
          self._on_drop()
        }
      },
      on_click() {
        if (self._on_click) {
          self._on_click()
          return true
        }
        return false
      }
    })
  }

  _update() {

    if (this._will_hover) {
      this._will_hover = false
    }

    if (this._will_hover_end) {
      this._will_hover_end = false
    }

  }
}


let i = 0
export class Cards extends Play {
  

  frees!: Array<Card>
  used!: Array<Card>

  bind_drop_rect(r?: DragStack) {
    this.used.forEach(_ => _.bind_drop_rect(r))
  }


  borrow() {
    let card = this.frees.shift()!
    this.used.push(card)

    card.visible = true
    return card
  }

  release(card: Card) {
    card.visible = false
    this.used.splice(this.used.indexOf(card), 1)
    card.release()
    this.frees.push(card)
  }

  _shadow_group?: Array<Card>
  set shadow_group(cards: Array<Card> | undefined) {
    this._shadow_group = cards
  }

  _init() {
    this.frees = OCards.deck.map(card => {
      let _ = this.make(Card, Vec2.zero, {})
      _.visible = false
      return _
    })

    this.used = []
  }

  _draw(batch: Batch) {

    batch.push_matrix(Mat3x2.create_transform(this.position, this.origin, this.scale, this.rotation))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)

    this._draw_children(batch)

    this._shadow_group?.forEach(_ => {
      _._draw_shadow(batch)
    })
    this._shadow_group?.forEach(_ => {
      _.draw(batch)
    })

    batch.pop_matrix()
  }
}


type StackData = {
  h?: number
}
export class Stack extends Play {

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
    let n = 55 * (1 - this.cards.length / 50)
    return this.data.h ?? n
  }

  get top_position() {
    return this.position.add(Vec2.make(0, this.cards.length * this.h))
  }

  set_highlight(n: number, highlight: boolean) {
    let his = this.cards.slice(this.cards.length - n, this.cards.length)
    his.forEach(_ => _.set_highlight(highlight))
  }

  add_cards(cards: Array<Card>) {
    cards.forEach(_ => _.send_front())
    this.cards.push(...cards)
    this._reposition()
  }

  remove_cards(n: number) {
    let cards = this.cards.splice(this.cards.length - n, this.cards.length)
    this._reposition()
    return cards
  }

  _i_gap?: number
  set i_gap(_: number | undefined) {
    if (this._i_gap === _) {
      return
    }
    this._i_gap = _
    this._reposition()
  }

  _reposition() {
    this.cards.forEach((card, i) => {
      let i_gap = (this._i_gap !== undefined && i > this._i_gap) ? i + 0.5 : i
      card.ease_position(this.p_position.add(Vec2.make(0, i_gap * this.h)))
    })
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

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export class DragStack extends Play {
  
  _cards!: Array<Card>
  set cards(cards: Array<Card>) {
    this._cards = cards.slice(0)
    this._cards.forEach(_ => _.send_front())
    this._cards.forEach(_ => _.set_dragging())
  }

  get drag_decay() {
    return this._cards[0].drag_decay
  }

  get h() {
    return 50
  }

  drag(v: Vec2) {
    this._cards.forEach((_, i) => {
      let _v = v.add(Vec2.make(0, this.h * i).sub(this.drag_decay))
      let t = 1-sigmoid((i/this._cards.length) * 2)
      _.lerp_position(_v, t)
    })
  }

  lerp_release() {
    let cards = this._cards.splice(0)
    cards.forEach(_ => _.lerp_release())
    return cards
  }

  _init() {
    this._cards = []
  }
}



type TableuData = {
  on_front_drag: (i: number, v: Vec2) => void,
  on_front_drop: () => void
  on_front_click: (i: number) => void
}

export class Tableu extends Play {
 
  
  get data() {
    return this._data as TableuData
  }

  get top_front_position() {
    return this.fronts.top_position
  }

  get top_back_position() {
    return this.backs.top_position
  }

  _hover_index?: number
  hover_end() {
    if (this._hover_index !== undefined) {
      this.fronts.cards[this._hover_index]._will_hover_end = true
      this._hover_index = undefined
    }
  }

  hover_begin(hover_index: number) {
    this.fronts.cards[hover_index]._will_hover = true
    this._hover_index = hover_index
  }
  is_hovering_at(hover_index: number) {
    return this._hover_index === hover_index
  }


  find_hover_begin(e: Vec2) {
    let i = this.fronts.cards.findLastIndex(c => c.ghit_area?.contains_point(e))
    return i
  }

  find_drag_begin(e: Vec2): [Card[], number] | undefined {
    this.hover_end()
    let i = this.fronts.cards.findLastIndex(c => c.ghit_area?.contains_point(e))
    if (i !== -1) {
      return [this.fronts.cards.splice(i), i]
    }
    return undefined
  }

  release_all() {
    return this.free()
  }

  free() {
    return [
      ...this.backs.remove_cards(this.backs.length),
      ...this.fronts.remove_cards(this.fronts.length)]
  }

  add_backs(cards: Array<Card>) {
    cards.forEach(_ => _.flip_back())
    this.backs.add_cards(cards)
    this.fronts.ease_position(this.top_back_position)
  }

  add_fronts(cards: Array<Card>) {
    this.fronts.add_cards(cards)
    cards.forEach(_ => _.flip_front())
  }

  remove_fronts(i: number) {
    let cards = this.fronts.remove_cards(i)
    return cards
  }

  flip_front(front: OCard) {
    let [card] = this.backs.remove_cards(1)
    card.card = front
    card.flip_front()
    this.fronts.ease_position(this.top_back_position)
    this.fronts.add_cards([card])
  }

  get empty() {
    return this.fronts.length === 0 && this.backs.length === 0
  }

  flip_back() {
    let [card] = this.fronts.remove_cards(1)
    card.flip_back()
    this.backs.add_cards([card])
    this.fronts.ease_position(this.top_back_position)
  }

  backs!: Stack
  fronts!: Stack

  _init() {

    this.backs = this.make(Stack, Vec2.make(0, 0), { h: 33 })
    this.fronts = this.make(Stack, Vec2.make(0, 0), {})
  }


  _update() {
    let i = this.fronts.cards.findIndex(_ => _.hover_time > ticks.thirds)
    if (i !== -1) {
      this.fronts.i_gap = i
    } else {
      this.fronts.i_gap = undefined
    }
  }
}


export class CardShowcase extends Play {

  dragging?: DragStack
  card!: Card

  _init() {

    this.make(Background, Vec2.zero, undefined)

    let _

    let c_off = Vec2.make(100, 200)
    let w = 300
    let h = 100
    this.make(Text, Vec2.make(100, 200), {
      text: 'front'
    })
    

    this.make(Text, Vec2.make(100, 200 + h), {
      text: ' - wait'
    })

    this.make(Text, Vec2.make(100, 200 + h * 2), {
      text: ' - idle'
    })

    this.make(Text, Vec2.make(100, 200 + h * 3), {
      text: ' - hover'
    })

    this.make(Text, Vec2.make(100, 200 + h * 4), {
      text: ' - click'
    })

    this.make(Text, Vec2.make(100, 200 + h * 5), {
      text: ' - flip'
    })

    this.make(Text, Vec2.make(450, 200), {
      text: 'back'
    })

    this.make(Text, Vec2.make(450, 200 + h * 2), {
      text: ' - idle'
    })

    this.make(Text, Vec2.make(450, 200 + h * 3), {
      text: ' - hover'
    })

    this.make(Text, Vec2.make(450, 200 + h * 4), {
      text: ' - click'
    })

    this.make(Text, Vec2.make(450, 200 + h * 5), {
      text: ' - flip'
    })

    let self = this
    this.make(Button, Vec2.make(400, 200 + h * 7), {
      text: 'flip',
      w: 200,
      h: 100,
      on_click() {
        if (self.card.facing === 1) {
          self.card.flip_back()
        } else {
          self.card.flip_front()
        }
      }
    })

    this.make(Button, Vec2.make(80, 200 + h * 7), {
      text: 'set card',
      w: 300,
      h: 100,
      on_click() {
        if (self.card.decoration._card === hidden_card) {
          self.card.card = arr_random(OCards.deck)
        } else {
          self.card.card = hidden_card
        }
      }
    })

    let cards = this.make(Cards, Vec2.make(500, 0), {})


    this.card = cards.borrow()
    this.card.ease_position(Vec2.make(500, 500))
    this.card.bind_drag(() => {})

    this.make(Clickable, Vec2.make(0, 0), {
      rect: Rect.make(0, 0, 0, 0),
      on_up() {
        if (self.dragging) {
          let _cards = self.dragging.lerp_release()
          tableu3.add_fronts(_cards)
          self.dragging = undefined
          _cards[0].after_ease(() => {
            cards.shadow_group = undefined
          })
        }

      }
    })

    let tableu = this.make(Tableu, Vec2.make(1000, 500), {
    
      on_front_drag(i: number, v: Vec2) {
        if (self.dragging) {
          self.dragging.drag(v)
        } else {
          let _cards = tableu.remove_fronts(i)
          self.dragging = self.make(DragStack, Vec2.zero, {})
          self.dragging.cards = _cards
          cards.shadow_group = _cards
        }
      },
      on_front_drop() {
      }
    })
    tableu.add_backs([...Array(5).keys()].map(() => cards.borrow()))
    tableu.add_fronts([...Array(12).keys()].map(() => cards.borrow()))
    tableu.fronts.cards.forEach(_ => _.card = arr_random(OCards.deck))




    let tableu2 = this.make(Tableu, Vec2.make(1000 - 200, 500), {
    
      on_front_drag(i: number, v: Vec2) {
        if (self.dragging) {
          self.dragging.drag(v)
        } else {
          let _cards = tableu2.remove_fronts(i)
          self.dragging = self.make(DragStack, Vec2.zero, {})
          self.dragging.cards = _cards
          cards.shadow_group = _cards
        }
      },
      on_front_drop() {
      }
    })
    tableu2.add_backs([...Array(5).keys()].map(() => cards.borrow()))
    tableu2.add_fronts([...Array(5).keys()].map(() => cards.borrow()))
    tableu2.fronts.cards.forEach(_ => _.card = arr_random(OCards.deck))


    let tableu3 = this.make(Tableu, Vec2.make(1000 + 200, 500), {
    
      on_front_drag(i: number, v: Vec2) {
        if (self.dragging) {
          self.dragging.drag(v)
        } else {
          let _cards = tableu3.remove_fronts(i)
          self.dragging = self.make(DragStack, Vec2.zero, {})
          self.dragging.cards = _cards
          cards.shadow_group = _cards
        }
      },
      on_front_drop() {
      }
    })
    tableu3.add_backs([...Array(5).keys()].map(() => cards.borrow()))
    tableu3.add_fronts([...Array(2).keys()].map(() => cards.borrow()))
    tableu3.fronts.cards.forEach(_ => _.card = arr_random(OCards.deck))




  }

  _update() {


  }


}
