import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { App, batch, Batch, Target } from 'blah'

import Content from './content'
import { howtos } from './howtos'


abstract class Play {

  position!: Vec2

  get font() {
    return Content.sp_font
  }

  _data: any

  _set_data(position: Vec2, data: any): this { 
    this.position = position
    this._data = data 
    return this
  }


  objects!: Array<Play>

  _make<T extends Play>(ctor: { new(...args: any[]): T}, position: Vec2, data: any) {
    let res = new ctor()._set_data(position, data).init()
    return res
  }

  make<T extends Play>(ctor: { new(...args: any[]): T}, position: Vec2, data: any) {
    let res = this._make(ctor, position, data)
    this.objects.push(res)
    return res
  }

  init(): this { 

    this.objects = []

    this._init()
    return this 
  }

  update() {
    this.objects.forEach(_ => _.update())
    this._update()
  }

  draw(batch: Batch) {
    this._draw(batch)
  }

  _draw_children(batch: Batch) {
    this.objects.forEach(_ => _.draw(batch))
  }

  _init() {}
  _update() {}
  _draw(batch: Batch) {
    this._draw_children(batch)
  }
}

type RectData = {
  w: number,
  h: number,
  color?: Color
}

class RectView extends Play {

  get data() {
    return this._data as RectData
  }

  _draw(batch: Batch) {
    batch.rect(Rect.make(this.position.x, this.position.y, this.data.w, this.data.h), this.data.color || Color.white)
  }
}

class Background extends Play {
  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 1920,
      h: 1080,
      color: Color.hex(0x222222)
    })
  }
}

class HowtoPlay extends Play {

  _init() {

    this.make(Background, Vec2.zero, undefined)

    this.make(Navigation, Vec2.zero, {
      route: 'how to play',
      on_back() {

      }
    })

    let w = 320
    let tabs = [
      this._make(Tab, Vec2.make(2, 2), {
        text: 'solitaire',
        w: 320
      }),
      this._make(Tab, Vec2.make(2 + w + 4, 2), {
        text: 'freecell',
        w: 320
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) *2, 2), {
        text: 'spider',
        w: 320
      })
    ]

    this.make(Tabs, Vec2.make(800, 8), {
      tabs
    })



    let content = this._make(LongHyperText, Vec2.make(0, 0), {
      width: 1880 - 80,
      content: howtos['about']
    })

    this.make(ScrollableContent, Vec2.make(20, 120), {
      w: 1880,
      h: 940,
      content
    })

  }
}


type LongHyperTextData = {
  width: number,
  content: string
}

class LongHyperText extends Play {


  static parse = (_: string) => {

    let reg_links = /\[([^\]]*)\]\"([^\"]*)\"/g


    let _i = 0
    let res = []

    let match
    while((match = reg_links.exec(_)) !== null) {
      let [capture, text, link] = match
      let i = match.index
      let end = i + capture.length

      if (i > _i) {
        _.slice(_i, i).split(' ').forEach(_ =>
        res.push({
          text: _
        }))
      }
      res.push({
        text,
        link
      })
      _i = end
    }

    if (_i < _.length) {
      _.slice(_i).split(' ').forEach(_ =>
      res.push({
        text: _
      }))
    }
    return res
  }

  get data() {
    return this._data as LongHyperTextData
  }

  _init() {

    let space_width = this._make(Text, Vec2.zero, {
      size: 96,
      text: ' '
    }).width

    let w = 0
    let h = 0
    this.data.content.trim().split('\n')
    .forEach(line => {
      LongHyperText.parse(line).forEach(obj => {
        let _
        if (obj.link) {
          _ = this.make(Text, Vec2.zero, {
            size: 96,
            text: obj.text,
            color: Color.hex(0x4ab2cd)
          })
        } else {

          _ = this.make(Text, Vec2.zero, {
            size: 96,
            text: obj.text
          })
        }

        if (w + _.width > this.data.width) {
          w = 0
          h += _.height
        }

        _.position = Vec2.make(w, h)

        w += _.width + space_width
      })

      w = 0
      h += 96


    })
  }

}

type TabsData = {
  tabs: Array<Play>
}

class Tabs extends Play {

  get data() {
    return this._data as TabsData
  }


  _init() {

 
    let w = 0
    this.data.tabs.forEach(_ => w += (_ as Tab).width + 4)

    this.make(RectView, Vec2.make(0, 0), {
      w,
      h: (this.data.tabs[0] as Tab).height + 4,
      color: Color.black
    })

    this.objects.push(...this.data.tabs)
  }


  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)
    batch.pop_matrix()
  }
}

type NavigationData = {
  route: string,
  on_back: () => void
}

class Navigation extends Play {

  get data() {
    return this._data as NavigationData
  }

  get route() {
    return this.data.route
  }

  _init() {

    this.make(RectView, Vec2.make(4, 4), {
      w: 600,
      h: 32 + 64,
      color: Color.hex(0x202431)
    })

    this.make(RectView, Vec2.make(100, 4 + 8), {
      w: 8,
      h: 32 + 64 - 16
    })

    this.make(Text, Vec2.make(130, 16), {
      text: this.route
    })
  }



}

type TextData = {
  size?: number,
  text: string,
  center?: true,
  color?: Color
}

class Text extends Play {

  get data() {
    return this._data as TextData
  }

  get origin() {
    return this.data.center ? Vec2.make(this.width / 2, 0) : Vec2.zero
  }

  get color() {
    return this.data.color ?? Color.white
  }

  get text() {
    return this.data.text
  }

  get size() {
    return this.data.size ?? 128
  }

  get width() {
    return this.font.width_of(this.text) / this.font.size * this.size
  }

  get height() {
    return this.font.height_of(this.text)
  }


  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_transform(Vec2.zero, this.origin, Vec2.one, 0))

    batch.str_j(this.font, this.text, this.position, Vec2.zero, this.size, this.color)
    batch.pop_matrix()
  }
}


type TabData = {
  text: string,
  w: number
}
class Tab extends Play {

  get data() {
    return this._data as TabData
  }

  get width() {
    return this.data.w
  }

  get height() {
    return 32 + 64
  }

  _init() {
    this.make(RectView, this.position, {
      w: this.width,
      h: this.height,
      color: Color.hex(0x202431)
    })

    this.make(Text, this.position.add(Vec2.make(this.data.w/2, 8)), {
      text: this.data.text,
      center: true
    })
  }

}

type ScrollableContentData = {
  w: number,
  h: number,
  content: Play
}

class ScrollableContent extends Play {

  get data() {
    return this._data as ScrollableContentData
  }

  _init() {

    this.make(RectView, Vec2.zero, {
      w: this.data.w,
      h: this.data.h,
      color: Color.hex(0x202431)
    })

    this.make(RectView, Vec2.make(this.data.w - 20 -8 , 8), {
      w: 20,
      h: this.data.h - 16,
      color: Color.black
    })

    this.make(RectView, Vec2.make(this.data.w - 20 - 8 + 4, 8 + 4), {
      w: 20 - 8,
      h: 200,
      color: Color.white
    })
  }


  _draw(batch: Batch) {

    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    batch.push_matrix(Mat3x2.create_translation(Vec2.make(40, 40)))
    this.data.content.draw(batch)
    batch.pop_matrix()

    batch.pop_matrix()
  }

}


export default class Game extends Play {

  static width = 640
  static height = 360

  _init() {

    batch.default_sampler = TextureSampler.make(TextureFilter.Linear)

    this.objects = []

    Content.load().then(() => {
      this.make(HowtoPlay, Vec2.zero, {})
    })
  }

  _update() {
  }

  _draw() {

    App.backbuffer.clear(Color.black)

    this._draw_children(batch)

    {
        batch.render(App.backbuffer)
        batch.clear()
    }
  }

}
