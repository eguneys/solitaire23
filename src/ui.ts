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

type ButtonData = {
  text: string,
  on_click: () => void
}

export class Button extends Play {

  get data() {
    return this._data as ButtonData
  }

  _init() {

    let bg = this.make(Anim, Vec2.make(0, 0), {
      name: 'button_bg'
    })
    bg.origin = Vec2.make(366, 200).scale(1/2)
    bg.scale = Vec2.make(0.6, 0.6)

    let _ = this.make(Text, Vec2.make(0, -25), {
      text: this.data.text,
      center: true,
      size: 96
    })

    let self = this
    this.make(Clickable, Vec2.make(-366 + 80, -200 + 80).scale(1/2), {
      rect: Rect.make(0, 0, 366 - 80, 200 - 80),
      on_hover() {
        bg.play_o('hover', { loop: false })
      },
      on_hover_end() {
        bg.play('hover', () => {
          bg.play('idle')
        }, true)
      },
      on_click_begin() {
        bg.play_o('click', { loop: false })
      },
      on_click() {
        self.data.on_click()
      }
    })
  }
}
