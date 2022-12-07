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
  w: number,
  h: number,
  on_click: () => void
}

export class Button extends Play {

  get data() {
    return this._data as ButtonData
  }

  _init() {

    let r = this.make(RectView, Vec2.make(0, 0), {
      w: this.data.w,
      h: this.data.h,
      color: Color.black
    })

    let _ = this.make(Text, Vec2.make(this.data.w / 2, 0), {
      text: this.data.text,
      center: true
    })

    let self = this
    this.make(Clickable, Vec2.make(4, 4), {
      rect: Rect.make(0, 0, this.data.w - 8, this.data.h - 8),
      on_click() {
        self.data.on_click()
      }
    })
  }
}
