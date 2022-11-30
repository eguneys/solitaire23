import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { EventPosition, DragEvent } from './input'
import { howtos } from './howtos'
import { Transition, transition } from './transition'

function rmap(t: number, min: number, max: number) {
  return min + (max - min) * t
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function appr(value: number, target: number, dt: number)  {
  if (value < target) {
    return Math.min(value + dt, target)
  }else {
    return Math.max(value - dt, target)
  }
}

function ease(t: number) {
  return t<.5 ? 2*t*t : -1+(4-2*t)*t
}

const bg1 = Color.hex(0x202431)
const link_color = Color.hex(0x4ab2cd)


abstract class Play {

  g_position!: Vec2
  position!: Vec2

  get font() {
    return Content.sp_font
  }

  _data: any

  _set_data(position: Vec2, data: any): this { 
    this.g_position = Vec2.zero
    this.position = position
    this._data = data 
    return this
  }


  objects!: Array<Play>

  _add_object(child: Play) {
    this.objects.push(child)
  }

  _make<T extends Play>(ctor: { new(...args: any[]): T}, position: Vec2, data: any) {
    let res = new ctor()._set_data(position, data).init()
    return res
  }

  make<T extends Play>(ctor: { new(...args: any[]): T}, position: Vec2, data: any) {
    let res = this._make(ctor, position, data)
    this._add_object(res)
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
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this.g_position = Vec2.transform(this.position, batch.m_matrix)
    this._draw_children(batch)
    batch.pop_matrix()
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
      w: Game.width,
      h: Game.height,
      color: Color.hex(0x222222)
    })
  }
}

class MainTitle extends Play {
  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 620,
      h: 120,
      color: Color.black
    })

    this.make(RectView, Vec2.make(2, 2), {
      w: 620 - 4,
      h: 120 - 4,
      color: Color.hex(0x202431)
    })

    let _ = this.make(Text, Vec2.make(30, 16), {
      text: 'lisotaire',
      size: 160
    })

    this.make(Text, Vec2.make(30 + _.width, 16), {
      text: '.com',
      size: 160,
      color: Color.hex(0xacacac)
    })
  }
}

type MainSideBarItemData = {
  icon: string
}

type ClickableData = {
  rect: Rect,
  on_hover?: () => void,
  on_hover_end?: () => void,
  on_click?: () => void
}

class Clickable extends Play {

  get data() {
    return this._data as ClickableData
  }

  get width() {
    return this.data.rect.w
  }

  get height() {
    return this.data.rect.h
  }

  _init() {
    let _hovering = false
    let self = this
    Input.register({
      on_hover(_e: EventPosition) {
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = Rect.make(self.g_position.x, self.g_position.y, self.width, self.height)
        if (rect.overlaps(point)) {
          if (!_hovering) {
            _hovering = true
            self.data.on_hover?.()
          }
        } else {
          if (_hovering) {
            _hovering = false
            self.data.on_hover_end?.()
          }
        }
        return false
      },
      on_click(_e: EventPosition, right: boolean) {
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = Rect.make(self.g_position.x, self.g_position.y, self.width, self.height)
        if (rect.overlaps(point)) {
          self.data.on_click?.()
          return true
        }
        return false
      }
    })
  }

}

class MainSideBarItem extends Play {

  get data() {
    return this._data as MainSideBarItemData
  }

  get width() {
    return 580
  }

  get height() {
    return (900 - 8) / 4
  }

  _init() {
    this.make(RectView, Vec2.make(0, 2), {
      w: this.width - 8,
      h: this.height - 4,
      color: bg1
    })


    let text = this.make(Text, Vec2.make(290 - 4, 16), {
      text: this.data.icon,
      size: 160,
      center: true,
      color: Color.white
    })


    let self = this
    this.make(Clickable, Vec2.make(0, 2), {
      on_hover() {
        text.color = Color.red
      },
      on_hover_end() {
        text.color = Color.white
      },
      on_click() {
        console.log(self.data.icon)
      },
      rect: Rect.make(0, 0, this.width - 16, this.height - 16)
    })
  }
}

class MainSideBar extends Play {

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 580,
      h: 900,
      color: Color.black
    })

    let _
    let tabs = [ ]

    _ = this._make(MainSideBarItem, Vec2.make(0, 0), { icon: 'how to play' })
    tabs.push(_)
    _ = this._make(MainSideBarItem, Vec2.make(0, _.height), { icon: 'settings' })
    tabs.push(_)
    _ = this._make(MainSideBarItem, Vec2.make(0, _.height * 2), { icon: 'statistics' })
    tabs.push(_)
    _ = this._make(MainSideBarItem, Vec2.make(0, _.height * 3), { icon: 'about' })
    tabs.push(_)

    this.make(Tabs, Vec2.make(4, 4), {
      tabs
    })


  }
}

class MainMenu extends Play {
  _init() {

    this.make(Background, Vec2.zero, undefined)

    this.make(MainTitle, Vec2.make(6, 6), {})

    this.make(MainSideBar, Vec2.make(1320, 100), {})

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
        w
      }),
      this._make(Tab, Vec2.make(2 + w + 4, 2), {
        text: 'freecell',
        w
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) *2, 2), {
        text: 'spider',
        w
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

  height!: number

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
          _ = this.make(HyperText, Vec2.zero, {
            size: 96,
            text: obj.text,
            color: link_color,
            on_click() {
              window.open(obj.link, '_blank')
            }
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

    this.height = h + 96
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

  }


  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    this.data.tabs.forEach(_ => _.draw(batch))
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

  set color(color: Color) {
    this.data.color = color
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
    return this.font.height_of(this.text) / this.font.size * this.size
  } 


  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_transform(Vec2.zero, this.origin, Vec2.one, 0))

    this.g_position = Vec2.transform(this.position, batch.m_matrix)
    batch.str_j(this.font, this.text, this.position, Vec2.zero, this.size, this.color)
    batch.pop_matrix()
  }
}



type HyperTextData = TextData & { 
  on_click: () => void
}

class HyperText extends Text {

  get data() {
    return this._data as HyperTextData
  }

  _init() {

    let self = this
    Input.register({
      on_hover(_e: EventPosition) {
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = Rect.make(self.g_position.x, self.g_position.y, self.width, self.height)
        if (rect.overlaps(point)) {
          self.color = Color.red
        } else {
          self.color = link_color
        }
        return false
      },
      on_click(_e: EventPosition, right: boolean) {
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = Rect.make(self.g_position.x, self.g_position.y, self.width, self.height)
        if (rect.overlaps(point)) {
          self.data.on_click()
          return true
        }
        return false
      }
    })
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
    this.make(RectView, Vec2.zero, {
      w: this.width,
      h: this.height,
      color: Color.hex(0x202431)
    })

    this.make(Text, Vec2.make(this.data.w/2, 8), {
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

  get content() {
    return this.data.content
  }

  get width() {
    return this.data.w
  }

  get height() {
    return this.data.h
  }

  scroll_y!: number
  scroll_off!: number

  thumb!: Play

  content_base_position!: Vec2

  _init() {

    this.content_base_position = Vec2.copy(this.data.content.position)

    this.scroll_y = 0
    this.scroll_off = 0

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

    let thumb_height = this.height * (this.height / (this.content as any).height)
    this.thumb = this._make(RectView, Vec2.make(this.data.w - 20 - 8 + 4, 8 + 4), {
      w: 20 - 8,
      h: thumb_height,
      color: Color.white
    })

    let self = this
    Input.register({
      on_drag(d: DragEvent, d0?: DragEvent) {

        if (d.m) {
          self.scroll_off = (d.m.y - d.e.y) * 1080
        }
        return true
      },
      on_up(e: Vec2, right: boolean) {
        self.scroll_y += self.scroll_off
        self.scroll_off = 0
        return true
      }
    })

  }

  _update() {
    if (this.scroll_y > 0) {
      this.scroll_y = lerp(this.scroll_y, 0, 0.2)
    }
    if (this.scroll_y < -(this.content as any).height + this.data.h) {
      this.scroll_y = lerp(this.scroll_y, -(this.content as any).height + this.data.h, 0.2)
    }

    this.thumb.position.y = -(this.scroll_y + this.scroll_off) / (this.content as any).height * this.height


    this.data.content.position.set_in(
      this.content_base_position.add(Vec2.make(
        40, 40 + this.scroll_y + this.scroll_off)))


  }

  _draw(batch: Batch) {

    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    batch.push_scissor(Rect.make(this.position.x, this.position.y + 8 + 4, this.width, this.height - 16 - 4 - 4))
    this.thumb.draw(batch)
    batch.pop_scissor()

    //batch.push_matrix(Mat3x2.create_translation(Vec2.make(40, 40 + this.scroll_y + this.scroll_off)))
    batch.push_scissor(Rect.make(this.position.x, this.position.y, this.width, this.height))
    this.data.content.draw(batch)
    batch.pop_scissor()
    //batch.pop_matrix()

    batch.pop_matrix()
  }

}

class TransitionMask extends Play {

  get t() {
    return rmap(ease(this._t), Game.width * 0.5, Game.width * 2.5)
  }

  _t!: number

  _init() {
    this._t = 1
  }

  _update() {
    this._t = appr(this._t, 0, Time.delta)
  }

  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_transform(Vec2.make(this.t, Game.height / 2), Vec2.make(160, 90), Vec2.make(13, 13), Math.PI * 0.25))
    batch.rect(Rect.make(0, 0, 320, 180), Color.hex(0x00ff00))
    batch.pop_matrix()

    batch.push_matrix(Mat3x2.create_transform(Vec2.make(this.t - 1820, Game.height / 2), Vec2.make(80, 10), Vec2.make(13, 13), Math.PI * 0.25))
    batch.rect(Rect.make(0, 0, 160, 10), Color.hex(0x000000))
    batch.pop_matrix()



  }
}

class SceneTransition extends Play {
  
  mask_target!: Target
  target!: Target
  target2!: Target

  mask!: Play
  current!: Play
  next?: Play

  _init() {

    this.target2 = Target.create(Game.width, Game.height)

    this.target = Target.create(Game.width, Game.height)
    this.mask_target = Target.create(Game.width, Game.height)

    this.mask = this._make(TransitionMask, Vec2.zero, {})
    this.current = this._make(MainMenu, Vec2.zero, {})

    this.next = this._make(HowtoPlay, Vec2.zero, {})

    transition.set_matrix(Mat3x2.create_scale_v(Game.v_screen))

  }

  _update() {
    this.mask.update()
  }

  _draw(batch: Batch) {

    if (!this.next) {
      this.current.draw(batch)
      return
    }

    this.current.draw(batch)
    batch.render(this.target)
    batch.clear()

    this.next.draw(batch)
    batch.render(this.target2)
    batch.clear()

    this.mask_target.clear(Color.hex(0xff0000))
    this.mask.draw(batch)
    batch.render(this.mask_target)
    batch.clear()

    transition.texture = this.target.texture(0)
    transition.texture2 = this.target2.texture(0)
    transition.mask_texture = this.mask_target.texture(0)

    transition.render()
  }
}


export default class Game extends Play {

  static width = 1920
  static height = 1080

  static v_screen = Vec2.make(Game.width, Game.height)

  _init() {

    batch.default_sampler = TextureSampler.make(TextureFilter.Linear)

    this.objects = []

    Content.load().then(() => {
      this.make(SceneTransition, Vec2.zero, {})
      //this.make(HowtoPlay, Vec2.zero, {})
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
