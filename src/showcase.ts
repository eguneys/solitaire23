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

import { ticks } from './shared'
import { Anim } from './anim'

import { Text, RectView, Clickable, Background, MainMenu } from './game'

export class Card extends Play {


  anim!: Anim
  fx!: Array<Anim>

  _init() {
    
    this.anim = this.make(Anim, Vec2.make(0, 0), { name: 'card' })
    this.anim.origin = Vec2.make(88, 120)
  }

  hover() {
    this.anim.play('hover')
  }

  hover_end() {
    this.anim.play('idle')
  }


  click() {
    this.routine(this._click())
  }

  *_click() {
    this.anim.play('click')
    yield * this.wait_for(ticks.half)
    this.anim.play('idle')
  }

}


export class CardShowcase extends Play {

  hovering!: Card
  clicking!: Card

  i_clicking = 0

  _init() {

    this.make(Background, Vec2.zero, undefined)

    let _

    let c_off = Vec2.make(100, 200)
    let w = 300
    this.make(Text, Vec2.make(200, 200), {
      text: 'idle'
    })
    _ = this.make(Card, Vec2.make(200, 200).add(c_off), {})

    this.make(Text, Vec2.make(200 + w, 200), {
      text: 'hover'
    })
    this.hovering = this.make(Card, Vec2.make(200 + w, 200).add(c_off), {})
    this.routine(this._hover())

    this.make(Text, Vec2.make(200 + w * 2, 200), {
      text: 'click'
    })
    this.clicking = this.make(Card, Vec2.make(200 + w * 2, 200).add(c_off), {})
    this.routine(this._click())

  }

  *_hover(): Generator<void> {
    this.hovering.hover()
    yield * this.wait_for(ticks.half)
    this.hovering.hover_end()
    yield * this.wait_for(ticks.seconds)
    yield * this._hover()
  }

  *_click(): Generator<void> {
    this.clicking.hover()
    yield * this.wait_for(ticks.sixth)
    this.clicking.click()
    yield * this.wait_for(ticks.seconds)
    yield *  this._click()
  }

  _update() {


  }


}
