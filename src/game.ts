import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { Hooks, EventPosition, DragEvent } from './input'
import { Transition, transition } from './transition'
import { pallette } from './pallette'

import { rmap, ease, lerp, appr } from './lerp'
import { InfiniteScrollableList } from './scrollable'

import { bg1, link_color, Play, PlayType} from './play'

import { Nine } from './nine'
import { Anim } from './anim'
import { Tween } from './tween'

import { SolitairePlay } from './solitaire'

import { CardShowcase } from './showcase'
import { ticks } from './shared'

import Sound from './sound'

import Trans, { languages } from './trans'

import { limit_settings, cards_settings, SolitaireStore, GeneralStore } from './store'
import { SolitaireResultsStore } from './store'
import { GameResults, OverallResults } from './statistics'
import { Poems } from './poems'
import { Button } from './ui'


type RectData = {
  w: number,
  h: number,
  color?: Color
}

export class RectView extends Play {

  get data() {
    return this._data as RectData
  }

  _color!: Color
  set color(c: Color) {
    this._color = c
  }
  get color() {
    return this._color
  }

  set height(h: number) {
    this.data.h = h
  }

  _init() {
    this.color = this.data.color ?? Color.white
  }

  _draw(batch: Batch) {
    batch.rect(Rect.make(this.position.x, this.position.y, this.data.w, this.data.h), this.color)
  }
}


class ArrowUpFire extends Play {

  v!: number


  _init() {
  
    let _ = this.make(Anim, Vec2.make(0, 0), {
      name: 'arrow_up_fire'
    })
    _.play_o('idle', { loop: true })

    this.v = 200 + Math.random() * 100

  }


  _update() {
    this.position.x += this.v * 0.8 * Time.delta
    this.position.y -= this.v * Time.delta
  }
}

export class Background extends Play {

  poem_text!: TransText


  change_poem() {
    this._will_change_poem = true
  }

  _will_change_poem: boolean = false

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: Game.width,
      h: Game.height,
      color: Color.hex(0x222222)
    })

    this.make(Anim, Vec2.make(0, 0), {
      name: 'soli_bg'
    })


    let poem = Poems.one()

    this.poem_text = this.make(TransText, Vec2.make(1920 / 2, 1080), {
      no_trans: true,
      width: 1000,
      height: 700,
      key: poem,
      center: true,
      color: Color.hex(0xb4beb4)
    })



  }

  life: number = 0

  _update() {

    this.life += Time.delta
    this.poem_text.position.y = 900 + Math.cos(this.life * 0.2) * 400

    if (this._will_change_poem) {
      if (this.poem_text.position.y > 1100) {
        this._will_change_poem = false
        this.poem_text.text = Poems.one()
      }
    }

    if (Time.on_interval(ticks.seconds * 3)) {
      for (let i = 0; i < Math.random() * 5; i++) {
        let x = 400 + Math.random() * 1000
        //this.make(ArrowUpFire, Vec2.make(-x, x * 3), {})
      }
    }
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
      size: 128
    })

    this.make(Text, Vec2.make(30 + _.width, 16), {
      text: '.com',
      size: 160,
      color: Color.hex(0xacacac)
    })
  }
}



type ClickableData = {
  abs?: true,
  debug?: true,
  rect: Rect,
  get_drop_rect?: (e: Vec2) => Rect,
  on_hover?: () => boolean,
  on_hover_end?: () => void,
  on_click_begin?: () => boolean,
  on_click?: () => boolean,
  on_drag_begin?: (e: Vec2) => boolean,
  on_drag_end?: (e: Vec2) => void,
  on_drag?: (e: Vec2) => boolean,
  on_drop?: (e: Vec2) => void,
  on_up?: (e: Vec2, right: boolean) => void,
  on_wheel?: (d: number) => void
}

export class Clickable extends Play {

  get data() {
    return this._data as ClickableData
  }

  get width() {
    return this._scaled_rect.w
  }

  get height() {
    return this._scaled_rect.h
  }

  _scaled_rect!: Rect

  get _rect() {
    return this.data.abs ? 
      Rect.make(this.position.x, this.position.y, this.width, this.height)
      : this._scaled_rect
  }

  get rect() {
    let { p_scissor } = this
    if (p_scissor) {
      return this._rect.overlaps_rect(p_scissor)
    } else {
      return this._rect
    }
  }

  _init() {

    this._scaled_rect = this.data.rect
    let _dragging = false
    let _hovering = false
    let self = this
    this.unbindable_input({
      on_click_begin(_e: EventPosition, right: boolean) {
        if (right) {
          return false
        }
        if (!self.p_visible) {
          return false
        }
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = self.rect
        if (rect.overlaps(point)) {
          return self.data.on_click_begin?.() ?? false
        }
        return false
      },
      on_drag(d: DragEvent, d0?: DragEvent) {
        if (d._right) {
          return false
        }
        if (!self.p_visible) {
          return false
        }
        if (_dragging) {
          let m = d.m!.mul(Game.v_screen)
          return self.data.on_drag?.(m) ?? false
        }

        if (d.m && (!d0 || !d0.m)) {
          let e = d.e.mul(Game.v_screen)
          let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
          let rect = self.rect
          if (rect.overlaps(point)) {
            _dragging = true
            return self.data.on_drag_begin?.(e) ?? false
          } else {
            return false
          }
        }
        return false
      },
      on_up(e: Vec2, right: boolean, m?: Vec2) {
        if (right) {
          return false
        }
        if (!self.p_visible) {
          return false
        }
        let _e = e.mul(Game.v_screen)

        if (_dragging) {
          _dragging = false
          self.data.on_drag_end?.(_e)
        } 

        self.data.on_up?.(e, right)

        if (m) {

          let _m = m.mul(Game.v_screen)
          let point = Rect.make(_m.x - 4, _m.y - 4, 8, 8)
          point = self.data.get_drop_rect?.(_m) ?? point
          let rect = self.rect
          if (self.data.get_drop_rect?.(_m)) {
            console.log(rect, point, rect.overlaps(point))
          }
          if (rect.overlaps(point)) {
            self.data.on_drop?.(m)
          }
        }


        return false
      },
      on_hover(_e: EventPosition) {
        if (!self.data.on_hover) {
          return false
        }
        if (!self.p_visible) {
          return false
        }
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = self.rect
        if (rect.overlaps(point)) {
          if (!_hovering) {
            _hovering = true
            return self.data.on_hover?.() ?? false
          }
        } else {
          if (_hovering) {
            _hovering = false
            self.data.on_hover_end?.()
          }
        }
        return _hovering
      },
      on_hover_clear() {
        if (!self.data.on_hover_end) {
          return false
        }
        if (_hovering) {
          _hovering = false
          return self.data.on_hover_end?.()
        }
        if (!self.p_visible) {
          return false
        }
        return false
      },
      on_click(_e: EventPosition, right: boolean) {
        if (!self.p_visible) {
          return false
        }
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = self.rect
        if (rect.overlaps(point)) {
          return self.data.on_click?.() ?? false
        }
        return false
      },
      on_wheel(d: number, _e: EventPosition) {
        if (!self.p_visible) {
          return false
        }
        let e = _e.mul(Game.v_screen)
        let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
        let rect = self.rect
        if (rect.overlaps(point)) {
          return self.data.on_wheel?.(d) ?? false
        }
        return false
      }
    })
  }

  _draw() {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)
    this._scaled_rect = Rect.transform(this.data.rect, batch.m_matrix)
    if (this.data.debug) {
      batch.rect(Rect.make(0, 0, this.width, this.height), Color.hex(0x00ff00))
    }
    batch.pop_matrix()
  }

}

type MainSideBarItemData = {
  icon: string,
  next: PlayType<Play>
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
        scene_transition.next(self.data.next)
      },
      rect: Rect.make(0, 0, this.width - 16, this.height - 16)
    })
  }
}


class Statistics extends Play {
  _init() {

    this.make(Background, Vec2.zero, undefined)

    let self = this
    this.make(Navigation, Vec2.zero, {
      route: 'statistics',
      on_back() {
        //scene_transition.next(MainMenu)
      }
    })


    let w = 600
    let tabs = [
      this._make(Tab, Vec2.make(2, 2), {
        text: 'last activity',
        w
      }),
      this._make(Tab, Vec2.make(2 + (w + 4), 2), {
        text: 'games played',
        w
      })
    ]


    this.make(Tabs, Vec2.make(700, 8), {
      tabs
    })

    let panels = [this._make(StatsGamesPlayed, Vec2.make(0, 0), {
    })]

    this.make(TabPanel, Vec2.make(500, 140), {
      w: 1400,
      h: 920,
      panels
    })
  }
}


class StatsGamesPlayed extends Play {
  _init() {

    let size = 64
    let x = 2
    let w = 240
    let _
    let tabs = []
    _ = this._make(Tab, Vec2.make(x, 2), {
      size,
      text: '30\nall',
      w
    })
    tabs.push(_)
    x += w
    w = 380

    _ = this._make(Tab, Vec2.make(x, 2), {
      size,
      text: '30\ngame over',
      w
    })
    tabs.push(_)
    x += w

    _ = this._make(Tab, Vec2.make(x, 2), {
      size,
      text: '3000\ngame completed',
      w
    })
    tabs.push(_)
    x+= w

    _ = this._make(Tab, Vec2.make(x, 2), {
      size,
      text: '1000\ngame incomplete',
      w
    })
    tabs.push(_)


    this.make(Tabs, Vec2.make(0, 8), {
      tabs
    })

    let panels: Array<Play> = [
      this._make(StatsGameList, Vec2.zero, {})
    ]

    this.make(TabPanel, Vec2.make(0, 180), {
      w: 0,
      h: 0,
      panels
    })
  }
}

class StatsGameList extends Play {
  _init() {

    let items = []

    for (let i =0 ; i < 10; i++) {
      items.push({
        game: 'spider' + i,
        date: '20 July 2020',
        points: '20 points',
        status: 'over'
      })
    }


    this.make(InfiniteScrollableList, Vec2.make(20, 8), {
      w: 1340,
      h: 660,
      items,
      ItemContent: MiniGameListItem,
      no_content: 'No games to show.'
    })
  }
}


type GameListItemData = {
  game: string,
  date: string,
  points: string,
  status: string
}

class MiniGameListItem extends Play {

  get data() {
    return this._data as GameListItemData
  }

  get height() {
    return 300
  }

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 1260,
      h: this.height,
      color: Color.black
    })


    this.make(RectView, Vec2.make(8, 8), {
      w: 1260 - 16,
      h: 300 - 16,
      color: bg1
    })


    this.make(RectView, Vec2.make(16, 16), {
      w: 400,
      h: 300 - 16 - 16,
      color: Color.white
    })


    let _

    _ = this.make(Text, Vec2.make(480, 16), {
      size: 96,
      text: this.data.game
    })

    _ = this.make(Text, Vec2.make(480, 16 + _.height), {
      size: 96,
      text: this.data.date
    })

    _ = this.make(Text, Vec2.make(480, 16 + _.height * 2), {
      size: 96,
      text: this.data.points
    })

    _ = this.make(Text, Vec2.make(480, 16 + _.height * 3), {
      size: 96,
      text: this.data.status
    })




  }

}

type ScrollableListData<T> = {
  w: number,
  h: number,
  items: Array<T>,
  item_content: PlayType<Play>
}
class ScrollableList<T> extends Play {

  get data() {
    return this._data as ScrollableListData<T>
  }
  
  scrollable!: ScrollableContent
  long_content!: ScrollableListLongContent<T>

  _init() {

    let content = this._make(ScrollableListLongContent<T>, Vec2.make(0, 0), this.data)
    this.long_content = content

    this.scrollable = this.make(ScrollableContent, Vec2.make(20, 120), {
      w: this.data.w,
      h: this.data.h,
      content
    })
  }

  _update() {
    this.long_content.scroll_y = this.scrollable.scroll_y
  }
}

class ScrollableListLongContent<T> extends Play {

  get data() {
    return this._data as ScrollableListData<T>
  }

  _scroll_y: number = 0
  set scroll_y(y: number) {
    if (this._scroll_y !== y) {
      this._scroll_y = y
    }
  }

  height!: number

  _init() {




    let h = 0
    for (let i = 0; i < this.data.items.length; i++) {
      let _ = this.data.items[i]
      let v = this.make(this.data.item_content, Vec2.make(0, h), _)
      h += (v as any).height + 2
      if (h > this.data.h) {
        break
      }
    }

    this.height = h + 100
  }


}

type About2Data = {
  on_back?: PlayType<Play>
}

export class About2 extends Play {


  get data() {
    return this._data as About2Data
  }

  _init() {


    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})



    let self = this
    this.make(Navigation2, Vec2.zero, {
      key: 'about',
      on_back() {
        scene_transition.next(self.data.on_back ?? MainMenu2)
      }
    })

    let w = 1880
    let h = 940
    this.make(Nine, Vec2.make(20, 120), {
      name: 'panel_bg_nine_slice',
      w: w,
      h: h
    })

    let content = this._make(LongHyperText, Vec2.make(0, 0), {
      width: 1880 - 100,
      content: Trans.key2('about')
    })

    this.make(ScrollableContent, Vec2.make(60, 160), {
      w: w - 100,
      h: h - 80,
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
        _.slice(_i, i).split(' ').filter(_ => !!_).forEach(_ =>
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
      _.slice(_i).split(' ').filter(_ => !!_).forEach(_ =>
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
    let font_size = 60

    let space = this._make(Text, Vec2.zero, {
      size: font_size,
      text: ' '
    })
    let space_width = space.width
    let space_height = space.height

    let w = 0
    let h = 0
    this.data.content.trim().split('\n')
    .forEach(line => {
      LongHyperText.parse(line).forEach(obj => {
        let _
        if (obj.link) {
          _ = this.make(HyperText, Vec2.zero, {
            size: font_size,
            text: obj.text,
            color: link_color,
            on_click() {
              window.open(obj.link, '_blank')
            }
          })
        } else {

          _ = this.make(Text, Vec2.zero, {
            size: font_size,
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
      h += space_height
    })

    this.height = h + space_height
  }

}

type TabsData = {
  tabs: Array<Tab>,
  selected_index: number,
  on_selected_index: (_: number) => void
}

class Tabs extends Play {

  get data() {
    return this._data as TabsData
  }

  on_click(tab: Tab) {
    this.selected_index = this.data.tabs.indexOf(tab)
  }

  _selected_index!: number

  get selected_index() {
    return this._selected_index
  }

  set selected_index(i: number) {
    this._selected_index = i
    this.data.tabs.forEach((_, _i) => _.set_active(i === _i))
    this.data.on_selected_index(i)
  }

  _init() {

    this._selected_index = this.data.selected_index
    this.data.tabs.forEach((_, _i) => _.set_active(this._selected_index === _i))


    let scale = this.data.tabs.length === 4 ? 0.63 : 1
    let width = this.data.tabs.reduce((a, b) => a + (b as Tab).width * scale, 0)
    this.make(RectView, Vec2.make(10, 130), {
      w: width,
      h: 10,
      color: Color.hex(0x101041)
    })

    this.data.tabs.forEach(_ => _.parent = this)

    this.data.tabs.forEach(_ => {
      if (this.data.tabs.length === 4) {
        _.scale = Vec2.one.scale(0.6)
        _.position.y += 50
      }
    })
  }

  _update() {
    this.data.tabs.forEach(_ => _.update())
  }

  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    this.data.tabs.forEach(_ => _.draw(batch))
    batch.pop_matrix()
  }

  _dispose() {
    this.data.tabs.forEach(_ => _.dispose())
  }
}

type NavigationData = {
  route: string,
  on_back: () => void
}

export class Navigation extends Play {

  get data() {
    return this._data as NavigationData
  }

  get route() {
    return this.data.route
  }

  _init() {

    let w = 600,
      h = 32 + 64
    this.make(RectView, Vec2.make(4, 4), {
      w,
      h,
      color: Color.hex(0x202431)
    })

    this.make(RectView, Vec2.make(100, 4 + 8), {
      w: 8,
      h: 32 + 64 - 16
    })

    this.make(Text, Vec2.make(130, 16), {
      text: this.route
    })


    let self = this

    this.make(Clickable, Vec2.make(0, 0), {
      rect: Rect.make(0, 0, w, h),
      on_hover() {
      },
      on_hover_end() {
      },
      on_click() {
        self.data.on_back()
      }
    })



  }



}

type TransTextData = {
  width: number,
  height: number,
  no_trans?: true,
  key: string,
  center?: true,
  color?: Color
}
export class TransText extends Play {

  get data() {
    return this._data as TransTextData
  }

  set color(c: Color) {
    this._text_view.color = c
  }

  get height() {
    return this._text_view.height
  }

  _text!: string

  set text(_: string) {
    this._text = _
    this._text_view.text = this.text
    this._text_view.size = this.size
  }

  get text() {
    return this.data.no_trans ? this._text : Trans.key(this._text)
  }

  get size() {
    let current_width = Content.sp_font.width_of(this.text)

    let default_size = 128

    let current_size_for_width = default_size * this.data.width / current_width

    let current_height = Content.sp_font.height_of(this.text)
    let current_size_for_height = default_size * this.data.height / current_height

    return Math.min(current_size_for_width, current_size_for_height)
  }

  _text_view!: Text

  _init() {


    let center = this.data.center
    let color = this.data.color
    this._text = this.data.key

    this._text_view = this.make(Text, Vec2.make(0, 0), {
      size: this.size,
      text: this.text,
      center,
      color,
    })

    if (!this.data.no_trans) {
      this.dispose_trans = Trans.register(() => {
        this._text_view.text = Trans.key(this._text)
        this._text_view.size = this.size
      })
    }
  }

  dispose_trans?: () => void

  _dispose() {

    this.dispose_trans?.()
  }
}


type TextData = {
  size?: number,
  text: string,
  center?: true,
  color?: Color
  rotation?: number
}

export class Text extends Play {

  get data() {
    return this._data as TextData
  }

  get justify() {
    return this.data.center ? Vec2.make(0, 0) : Vec2.zero
  }

  get color() {
    return this._color
  }

  _color!: Color
  set color(color: Color) {
    this._color = color
  }

  get text() {
    return this.data.text
  }

  set text(text: string) {
    this.data.text = text
  }

  _size!: number
  get size() {
    return this._size
  }

  set size(size: number) {
    this._size = size
  }

  get width() {
    return this.font.width_of(this.text) / this.font.size * this.size
  }

  get height() {
    return this.font.height_of(this.text) / this.font.size * this.size
  } 

  _init() {
    this.color = this.data.color ?? Color.white
    this._size = this.data.size ?? 128
    this.rotation = this.data.rotation ?? 0
    this.origin = this.data.center ? Vec2.make(this.width / 2, 0) : Vec2.zero
  }

  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_transform(this.position, this.origin, Vec2.one, this.rotation))

    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)
    batch.str_j(this.font, this.text, Vec2.zero, this.justify, this.size, this.color)
    batch.pop_matrix()
  }
}



type HyperTextData = TextData & { 
  on_click: () => void
}

class HyperText extends Play {

  get data() {
    return this._data as HyperTextData
  }

  text_view!: Text

  set color(c: Color) {
    this.text_view.color = c
  }

  get width() {
    return this.text_view.width
  }

  get height() {
    return this.text_view.height
  }

  _init() {

    this.text_view = this.make(Text, Vec2.zero, this.data)

    let self = this
    this.make(Clickable, Vec2.make(0, -this.text_view.height / 3), {
      rect: Rect.make(0, 0, this.text_view.width, this.text_view.height),
      on_hover() {
        self.color = Color.red
      },
      on_hover_end() {
        self.color = self.data.color ?? Color.white
      },
      on_click() {
        self.data.on_click()
      }
    })
  }
}


type TabData = {
  size?: number,
  text: string,
  no_trans?: true,
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

  _active?: boolean
  set_active(v: boolean) {
    this._active = v
    if (v) {
      this.anim.play('active')
    } else {
      this.anim.play('idle')
    }
  }
  anim!: Anim

  _init() {
    let anim = this.make(Anim, Vec2.zero, {
      name: 'tab3_bg'
    })
    this.anim = anim

    this.make(TransText, Vec2.make(this.width/2, this.height/2), {
      no_trans: this.data.no_trans,
      width: this.width - 80,
      height: this.height,
      key: this.data.text,
      center: true
    })

    let self = this
    this.make(Clickable, Vec2.make(32, 32), {
      rect: Rect.make(0, 0, 360, 90),
      on_hover() {
        if (!self._active) {
          anim.play('hover')
        }
      },
      on_hover_end() {
        anim.play(self._active ? 'active' : 'idle')
      },
      on_click() {
        ;(self.parent as Tabs).on_click(self)
      }
    })
  }

}

type TabPanelData = {
  selected_index: number,
  panels: Array<Play>,
  w: number,
  h: number
}


class TabPanel extends Play {

  get data() {
    return this._data as TabPanelData
  }

  get selected_index() {
    return this._selected_index
  }

  _selected_index!: number
  set selected_index(i: number) {
    this._selected_index = i


    this.data.panels.forEach((_, _i) => _.visible = i === _i)
  }

  get active_panel() {
    return this.data.panels[this.selected_index]
  }

  _init() {
    this.selected_index = this.data.selected_index
  }

  _update() {
    this.active_panel.update()
  }

  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    this.active_panel.draw(batch)
    batch.pop_matrix()
  }

  _dispose() {
    this.data.panels.forEach(_ => _.dispose())
  }

}


type ScrollableContentData = {
  w: number,
  h: number,
  content: Play,
  on_scroll?: () => void
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
  scroll_edge_off!: number

  target_scroll_y!: number

  thumb!: Play

  content_base_position!: Vec2

  _init() {

    this.data.content.parent = this
    this.content_base_position = Vec2.copy(this.data.content.position)

    this.scroll_y = 0
    this.scroll_off = 0
    this.scroll_edge_off = 0

    this.target_scroll_y = 0

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

    let e: Vec2 | undefined
    let self = this
    this.make(Clickable, Vec2.zero, {
      rect: Rect.make(0, 0, this.width, this.height),
      on_drag_begin(_e: Vec2) {
        self.data.on_scroll?.()
        e = _e
        return true
      },
      on_drag(m: Vec2) {
        self.scroll_off = (m.y - e!.y)
        return true
      },
      on_up(e: Vec2, right: boolean) {
        self.scroll_y += self.scroll_off
        self.scroll_off = 0
        self.target_scroll_y = self.scroll_y

        if (self.scroll_y > 0) {
          self.scroll_edge_off = self.scroll_y
          self.scroll_y = 0
        } else {

            let edge = -(self.content as any).height + self.data.h
          if ((self.content as any).height < self.data.h) {

            self.scroll_edge_off = self.scroll_y
            self.scroll_y = 0
          } else {

            if (self.scroll_y < edge) {
              self.scroll_edge_off = self.scroll_y - edge
              self.scroll_y = edge
            }
          }
        }

        return true
      },
      on_wheel(d: number) {

        self.target_scroll_y = self.scroll_y -d * 100

        return true
      }
    })
  }

  _update() {

    this.scroll_y = lerp(this.scroll_y, this.target_scroll_y, 0.4)

    let edge = -(this.content as any).height + this.data.h
    this.scroll_y = Math.max(Math.min(0, this.scroll_y), edge)

    this.scroll_edge_off = lerp(this.scroll_edge_off, 0, 0.2)

    this.thumb.position.y = -(this.scroll_y + this.scroll_off + this.scroll_edge_off) / (this.content as any).height * this.height

    this.data.content.position.set_in(
      this.content_base_position.add(Vec2.make(
        40, 40 + this.scroll_y + this.scroll_off + this.scroll_edge_off)))

    this.content.update()

  }

  _draw(batch: Batch) {

    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    let position = Vec2.transform(Vec2.zero, batch.m_matrix)
    batch.push_scissor(Rect.make(position.x, position.y + 12, this.width, this.height - 24))
    this.thumb.draw(batch)
    batch.pop_scissor()

    batch.push_scissor(Rect.make(position.x, position.y, this.width, this.height))
    this.g_scissor = Rect.make(position.x, position.y, this.width, this.height)
    this.data.content.draw(batch)
    batch.pop_scissor()

    batch.pop_matrix()
  }

  _dispose() {
    this.data.content.dispose()
  }

}

class TransitionMask extends Play {

  t!: number

  _t?: Tween

  _init() {
    this.t = Game.width * 0.5
    this._t = this.tween([Game.width * 2.5, Game.width * 0.5], (v) => {
      this.t = v
    }, ticks.half, 0, () => {
      this._t = undefined
    })
  }

  get done() {
    return !this._t
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


type MainSideButtonData = {
  text: string,
  on_click: () => void
}

class MainSideButton extends Play {

  get data() {
    return this._data as MainSideButtonData
  }

  _init() {


    let bg = this.make(Anim, Vec2.zero, { name: 'main_settings_bg' })

    let s = this.make(TransText, Vec2.make(320, 86), { 
      key: this.data.text, 
      center: true,
      width: 400,
      height: 100,
      color: Color.black
    })
    let t = this.make(TransText, Vec2.make(320, 86), { 
      key: this.data.text, 
      center: true,
      width: 400,
      height: 100,
    })

    let tpositiony = t.position.y
    let self = this
    this.make(Clickable, Vec2.make(100, 50), {
      rect: Rect.make(0, 0, 440, 120),
      on_hover() {

        bg.play('hover')
        self.tween([t.position.y, tpositiony - 2], (v) => {
          t.position.y = v
        }, ticks.lengths)
      },
      on_hover_end() {
        bg.play('idle')
        self.tween([t.position.y, tpositiony + 2], (v) => {
          t.position.y = v
        }, ticks.lengths)
      },
      on_click() {
        self.data.on_click()
      }
    })

  }
}

type HoverAnimData = {
  name: string,
  rect: Rect,
  debug?:boolean,
  on_click: () => void
}
class HoverAnim extends Play {
  get data() {
    return this._data as HoverAnimData
  }
  _init() {

    let anim = this.make(Anim, Vec2.zero, { name: this.data.name })

    let self = this
    this.make(Clickable, Vec2.make(this.data.rect.x, this.data.rect.y), {
      debug: this.data.debug,
      rect: Rect.make(0, 0, this.data.rect.w, this.data.rect.h),
      on_hover() {
        anim.play('hover')
      },
      on_hover_end() {
        anim.play('idle')
      },
      on_click() {
        self.data.on_click()
      }
    })
  }
}

type Navigation2Data = {
  key: string,
  on_back: () => void
}

class Navigation2 extends Play {

  get data() {
    return this._data as Navigation2Data
  }

  _init() {
    let self = this
    this.make(HoverAnim, Vec2.zero, {
      name: 'navigation_bg',
      rect: Rect.make(30, 30, 540, 100),
      on_click() {
        self.data.on_back()
      }})
    this.make(TransText, Vec2.make(112, 54), {
      key: this.data.key,
      width: 400,
      height: 96,
    })
  }
}


type HowtoPlay2Data = {
  selected_index?: number,
  on_back?: PlayType<Play>
}

export class HowtoPlay2 extends Play {

  get data() {
    return this._data as HowtoPlay2Data
  }

  _init() {

    let selected_index = this.data.selected_index ?? 0

    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    let self = this
    this.make(Navigation2, Vec2.zero, {
      key: 'how_to_play',
      on_back() {
        scene_transition.next(self.data.on_back ?? MainMenu2)
      }
    })

    this.make(Nine, Vec2.make(20, 180), {
      name: 'panel_bg_nine_slice',
      w: 1860,
      h: 860
    })

    let w = 410
    let tabs = [
      this._make(Tab, Vec2.make(2, 2), {
        no_trans: true,
        text: 'solitaire',
        w
      }),
      this._make(Tab, Vec2.make(2 + w + 4, 2), {
        no_trans: true,
        text: 'fourtimes',
        w
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) *2, 2), {
        no_trans: true,
        text: 'octopus',
        w
      })
    ]



    let c_y = 40,
    c_h = 780

    let content = this._make(LongHyperText, Vec2.make(0, 0), {
      width: 1800 - 80,
      content: Trans.key2('solitaire')
    })

    let solitaire = this._make(ScrollableContent, Vec2.make(20, c_y), {
      w: 1800,
      h: c_h,
      content
    })


    content = this._make(LongHyperText, Vec2.make(0, 0), {
      width: 1800 - 80,
      content: Trans.key2('fourtimes')
    })

    let fourtimes = this._make(ScrollableContent, Vec2.make(20, c_y), {
      w: 1800,
      h: c_h,
      content
    })

    content = this._make(LongHyperText, Vec2.make(0, 0), {
      width: 1800 - 80,
      content: Trans.key2('octopus')
    })

    let octopus = this._make(ScrollableContent, Vec2.make(20, c_y), {
      w: 1800,
      h: c_h,
      content
    })

    let panels = [
      solitaire,
      fourtimes,
      octopus
    ]

    let panel = this.make(TabPanel, Vec2.make(20, 180), {
      w: 1860,
      h: 860,
      panels,
      selected_index
    })





    this.make(Tabs, Vec2.make(600, 8), {
      tabs,
      selected_index,
      on_selected_index(i: number) {
        panel.selected_index = i
      }
    })


  }
}

type DropdownData = {
  no_trans?: true,
  items: Array<string>
  selected_index: number,
  on_selected: (i: number) => void
}

class Dropdown extends Play {

  get data() {
    return this._data as DropdownData
  }

  box!: DropdownBox

  set selected_index(v: number) {
    this.box.selected_index = v
    this.selected_text.text = this.data.items[v]
  }

  selected_text!: TransText

  _init() {


    let bg = this.make(Anim, Vec2.zero, {
      name: 'dropdown_bg'
    })
    this.selected_text = this.make(TransText, Vec2.make(32, 60), {
      no_trans: this.data.no_trans,
      key: this.data.items[this.data.selected_index],
      width: 250,
      height: 100,
    })

    let self = this

    this.make(Clickable, Vec2.make(0, 0), {
      abs: true,
      rect: Rect.make(0, 0, 1920, 1080),
      on_click() {
        let res = self.box.visible
        self.box.visible = false
        return res
      },
      on_drag_begin() {
        self.box.visible = false
        return false
      }
    })

    this.make(Clickable, Vec2.make(16, 32), {
      rect: Rect.make(0, 0, 480, 112),
      on_hover() {
        bg.play('hover')
      },
      on_hover_end() {
        bg.play('idle')
      },
      on_click() {
        if (!self.box.visible) {
          self.box.visible = true
          return true
        }
        return false
      }
    })

  }
}

type DropdownBoxData = {
  no_trans?: true,
  items: Array<string>,
  selected_index: number,
  on_selected: (i: number) => void
}
class DropdownBox extends Play {
  get data () {
    return this._data as DropdownBoxData
  }

  set selected_index(v: number) {
    this.dropdown_list.selected_index = v
  }

  dropdown_list!: DropdownLongList


  _init() {

    let bg = this.make(RectView, Vec2.make(0, 0), {
      w: 500,
      h: 500,
      color: Color.hex(0x315594)
    })

    let self = this
    let content = this._make(DropdownLongList, Vec2.make(0, 0), {
      no_trans: this.data.no_trans,
      items: this.data.items,
      selected_index: this.data.selected_index,
      on_selected(i: number) {
        self.data.on_selected(i)
      }
    })

    bg.height = Math.min(500, content.height)

    this.dropdown_list = content

    this.make(ScrollableContent, Vec2.make(0, 0), {
      w: 500,
      h: Math.min(500, content.height),
      content
    })
  }
}

class DropdownLongList extends Play {
  get data() {
    return this._data as DropdownBoxData
  }

  height!: number

  _selected_index!: number
  set selected_index(i: number) {
    this._selected_index = i
    this._color_items()
    this.data.on_selected(i)
  }

  get selected_index() {
    return this._selected_index
  }

  items!: Array<DropdownListItem>

  _init() {


    let h = 140 
    let y = 0
    let self = this
    this.items = this.data.items.map((item, i) => {
      let _ = this.make(DropdownListItem, Vec2.make(0, y), {
        no_trans: this.data.no_trans,
        item,
        on_selected() {
          self.selected_index = i
        }
      })
      y += h 
      return _
    })

    this.height = y + 30

    this._selected_index = this.data.selected_index
  }

  _color_items() {
    this.items.forEach((item, i) => {
      item.selected = this.selected_index === i
    })
  }
}


type DropdownListItemData = {
  no_trans?: true,
  item: string,
  on_selected: () => void
}
class DropdownListItem extends Play {
  get data() {
    return this._data as DropdownListItemData
  }

  set selected(v: boolean) {
    if (v) {
      this.bg.color = Color.white
      this.text.color = Color.hex(0x315594)
    } else {
      this.text.color = Color.white
      this.bg.color = Color.hex(0x315594)
    }
  }

  bg!: RectView
  text!: TransText

  _init() {

    this.bg = this.make(RectView, Vec2.make(-40, -30), {
      w: 470,
      h: 140,
      color: Color.hex(0x315594)
    })

    this.text = this.make(TransText, Vec2.make(0, 0), {
      no_trans: this.data.no_trans,
      width: 340,
      height: 140,
      key: this.data.item,
    })

    let self = this
    let n = this.make(Clickable, Vec2.make(-40, -30), {
      rect: Rect.make(0, 0, 470, 140),
      on_click() {
        self.data.on_selected()
        return true
      }
    })
  }
}

class SolitaireSettings extends Play {

  height!: number

  _init() {


    this.make(TransText, Vec2.make(280, 20), {
      key: 'solitaire_settings',
      width: 820,
      height: 200
    })



    let h = 220
    let turning_cards_setting = this.make(DropdownSetting, Vec2.make(40, h), {
      name: 'turning_cards',
      items: ['three_cards', 'one_card'],
      selected_index: cards_settings.indexOf(SolitaireStore.cards),
      on_selected(i: number) {
        SolitaireStore.cards = cards_settings[i]
      }
    })

    let turning_limit_setting = this.make(DropdownSetting, Vec2.make(40, h * 2), {
      name: 'turning_limit',
      items: ['no_limit', 'three_passes', 'one_pass'],
      selected_index: limit_settings.indexOf(SolitaireStore.limit),
      on_selected(i: number) {
        SolitaireStore.limit = limit_settings[i]
      }
    })



    this.make_box(turning_cards_setting)
    this.make_box(turning_limit_setting)


    this.height = h * 3 + 500
  }


  make_box(setting: DropdownSetting, no_trans?: true) {
    let box = this.make(DropdownBox, Vec2.make(
      setting.position.x + setting.dropdown.position.x,
      setting.position.y + setting.dropdown.position.y + 160), {
        no_trans,
      items: setting.data.items,
      selected_index: setting.data.selected_index,
      on_selected(i: number) {
        box.visible = false
        setting.dropdown.data.on_selected(i)
        setting.dropdown.selected_text.text = setting.data.items[i]
      }
    })
    setting.dropdown.box = box
    box.visible = false
  }


}

class GeneralSettings extends Play {

  height!: number

  _init() {



    this.make(TransText, Vec2.make(280, 20), {
      key: 'general_settings',
      width: 820,
      height: 200
    })

    let h = 220
    let language_setting = this.make(DropdownSetting, Vec2.make(40, h * 1), {
      no_trans: true,
      name: 'language',
      items: languages.map(_ => Trans.lang_key(_)),
      selected_index: languages.indexOf(GeneralStore.language),
      on_selected(i: number) {
        Trans.language = languages[i]
        GeneralStore.language = languages[i]
      }
    })

    /*
    let theme_setting = this.make(DropdownSetting, Vec2.make(0, h), {
      name: 'color_theme',
      items: ['pink', 'blue', 'orange'],
      selected_index: 0,
      on_selected(i: number) {
        console.log(i)
      }
    })
   */


    let sound_settings = ['on', 'off']
    let sound_setting = this.make(DropdownSetting, Vec2.make(40, h * 2), {
      name: 'sounds',
      items: ['on', 'off'],
      selected_index: GeneralStore.sound ? 0: 1,
      on_selected(i: number) {
        GeneralStore.sound = sound_settings[i] === 'on'
      }
    })


    let music_settings = ['on', 'off']
    let music_setting = this.make(DropdownSetting, Vec2.make(40, h * 3), {
      name: 'music',
      items: ['on', 'off'],
      selected_index: GeneralStore.music ? 0: 1,
      on_selected(i: number) {
        GeneralStore.music = music_settings[i] === 'on'
        if (!GeneralStore.music) {
          Sound.stop_music()
        }
      }
    })





    this.make_box(language_setting, true)
    //this.make_box(theme_setting)
    this.make_box(sound_setting)
    this.make_box(music_setting)

    this.height = h * 3 + 500

  }

  make_box(setting: DropdownSetting, no_trans?: true) {
    let box = this.make(DropdownBox, Vec2.make(
      setting.position.x + setting.dropdown.position.x,
      setting.position.y + setting.dropdown.position.y + 160), {
        no_trans,
      items: setting.data.items,
      selected_index: setting.data.selected_index,
      on_selected(i: number) {
        box.visible = false
        setting.dropdown.data.on_selected(i)
        setting.dropdown.selected_text.text = setting.data.items[i]
      }
    })
    setting.dropdown.box = box
    box.visible = false
  }


}

type DropdownSettingData = {
  no_trans?: true,
  name: string,
  items: Array<string>,

  selected_index: number,
  on_selected: (_: number) => void
}
class DropdownSetting extends Play {

  get data() {
    return this._data as DropdownSettingData
  }

  dropdown!: Dropdown

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 1300,
      h: 200,
      color: Color.hex(0x202441)
    })
    
    this.make(TransText, Vec2.make(50, 60), {
      key: this.data.name,
      width: 420,
      height: 200
    })
    let self = this
    this.dropdown = this.make(Dropdown, Vec2.make(720, 8), {
      no_trans: this.data.no_trans,
      items: this.data.items,
      selected_index: this.data.selected_index,
      on_selected(i: number) {
        self.data.on_selected(i)
      }
    })
  }
}

class OverallStatistics extends Play {

  height!: number

  _init() {

    this.make(TransText, Vec2.make(700, 0), {
      key: 'overall_statistics',
      width: 820,
      height: 200,
      center: true
    })

    let self = this
    this.make(Button, Vec2.make(700, 1600), {
      text: 'clear_statistics',
      on_click() {
        SolitaireResultsStore.clear_results()
        self._load_results()
      }
    })

    this.height = 2000

    this._load_results()
  }

  table_view?: ResultsTableView

  _load_results() {

    this.table_view?.dispose()

    let overall_results = new OverallResults(
      SolitaireResultsStore.results, 
      new GameResults([]), 
      new GameResults([]))


    this.table_view = this.make(ResultsTableView, Vec2.make(0, 0), {
      total_played: overall_results.total_played,
      total_wins: overall_results.total_wins,
      top_5_highscores: overall_results.top_5_highscores.map(_ => _.multiplied_score)
    })


  }

}

type ResultsTableViewData  = {
  total_played: number,
  total_wins: number,
  top_5_highscores: number[]
}

class ResultsTableView extends Play {

  get data() {
    return this._data as ResultsTableViewData
  }

  _init() {

    let { total_played, total_wins, top_5_highscores } = this.data

    let h = 100

    this.make(TransText, Vec2.make(700, 200), {
      key: `total_games_played%${total_played}%`,
      width: 820,
      height: 200,
      center: true
    })

    this.make(TransText, Vec2.make(700, 200 + h * 1.2), {
      key: `games_won%${total_wins}%`,
      width: 820,
      height: 200,
      center: true
    })

    this.make(TransText, Vec2.make(700, 200 + h * 3), {
      key: 'top5_highscores',
      width: 820,
      height: 200,
      center: true
    })

    let top_highscores = top_5_highscores

    top_highscores.forEach((top, i) => {
      this.make(TransText, Vec2.make(200, 200 + h * 4 + h * i * 1.5 + 80), {
        key: `${i + 1}.`,
        width: 80,
        height: 100,
        no_trans: true
      })
      this.make(TransText, Vec2.make(700, 200 + h * 4 + h * i * 1.5 + 80), {
        key: `${top}`,
        width: 80,
        height: 100,
        no_trans: true,
        center: true
      })

      this.make(RectView, Vec2.make(200, 100 + 200 + h * 4 + h * i * 1.5 + 80), {
        w: 1000,
        h: 20,
        color: Color.white
      })
    
    })

  }
}


class SolitaireStatistics extends Play {

  height!: number

  _init() {

    this.make(TransText, Vec2.make(700, 0), {
      key: 'solitaire_statistics',
      width: 820,
      height: 200,
      center: true
    })


    let self = this
    this.make(Button, Vec2.make(700, 1600), {
      text: 'clear_statistics',
      on_click() {
        SolitaireResultsStore.clear_results()
        self._load_results()
      }
    })



    this.height = 2000

    this._load_results()
  }

  table_view?: ResultsTableView

  _load_results() {

    this.table_view?.dispose()

    let results = SolitaireResultsStore.results

    this.table_view = this.make(ResultsTableView, Vec2.make(0, 0), {
      total_played: results.total_played,
      total_wins: results.total_wins,
      top_5_highscores: results.top_5_highscores.map(_ => _.multiplied_score)
    })


  }
}



type Statistics2Data = {
  selected_index?: number,
  on_back?: PlayType<Play>
}

class Statistics2 extends Play {

  get data() {
    return this._data as Statistics2Data
  }

  _init() {

    let selected_index = this.data.selected_index ?? 0

    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    let self = this
    this.make(Navigation2, Vec2.zero, {
      key: 'statistics',
      on_back() {
        scene_transition.next(self.data.on_back ?? MainMenu2)
      }
    })

    this.make(Nine, Vec2.make(220, 150), {
      name: 'panel_bg_nine_slice',
      w: 1480,
      h: 910
    })

    let w = 1000 / 4
    let tw = w * 1.6
    let tabs = [
      this._make(Tab, Vec2.make(2, 2), {
        text: 'overall',
        w: tw
      }),
      this._make(Tab, Vec2.make(2 + w + 4, 2), {
        no_trans: true,
        text: 'solitaire',
        w: tw
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) * 2, 2), {
        no_trans: true,
        text: 'fourtimes',
        w: tw
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) * 3, 2), {
        no_trans: true,
        text: 'octopus',
        w: tw
      })
    ]

    let panel: TabPanel

    this.make(Tabs, Vec2.make(600, 8), {
      tabs,
      selected_index,
      on_selected_index(i: number) {
        panel.selected_index = i
      }
    })


    let content = this._make(OverallStatistics, Vec2.make(0, 0), {})


    let general = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })


    content = this._make(SolitaireStatistics, Vec2.make(0, 0), {})


    let solitaire = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })


    content = this._make(OverallStatistics, Vec2.make(0, 0), {})


    let fourtimes = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })


    content = this._make(OverallStatistics, Vec2.make(0, 0), {})


    let octopus = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })



    let panels = [
      general,
      solitaire,
      fourtimes,
      octopus
    ]

    panel = this.make(TabPanel, Vec2.make(220, 180), {
      w: 1050,
      h: 850,
      panels,
      selected_index
    })
  }
}


type Settings2Data = {
  selected_index?: number,
  on_back?: PlayType<Play>
}

export class Settings2 extends Play {

  get data() {
    return this._data as Settings2Data
  }

  _init() {

    let selected_index = this.data.selected_index ?? 0

    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    let self = this
    this.make(Navigation2, Vec2.zero, {
      key: 'settings',
      on_back() {
        scene_transition.next(self.data.on_back ?? MainMenu2)
      }
    })

    this.make(Nine, Vec2.make(220, 150), {
      name: 'panel_bg_nine_slice',
      w: 1480,
      h: 910
    })

    let w = 1000 / 4
    let tw = w * 1.6
    let tabs = [
      this._make(Tab, Vec2.make(2, 2), {
        text: 'general',
        w: tw
      }),
      this._make(Tab, Vec2.make(2 + w + 4, 2), {
        no_trans: true,
        text: 'solitaire',
        w: tw
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) * 2, 2), {
        no_trans: true,
        text: 'fourtimes',
        w: tw
      }),
      this._make(Tab, Vec2.make(2 + (w + 4) * 3, 2), {
        no_trans: true,
        text: 'octopus',
        w: tw
      })
    ]

    let panel: TabPanel

    this.make(Tabs, Vec2.make(600, 8), {
      tabs,
      selected_index,
      on_selected_index(i: number) {
        panel.selected_index = i
      }
    })


    let content = this._make(GeneralSettings, Vec2.make(0, 0), {})


    let general = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })



    content = this._make(SolitaireSettings, Vec2.make(0, 0), {})


    let solitaire = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })


    content = this._make(GeneralSettings, Vec2.make(0, 0), {})


    let fourtimes = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })


    content = this._make(GeneralSettings, Vec2.make(0, 0), {})


    let octopus = this._make(ScrollableContent, Vec2.make(0, 0), {
      w: 1450,
      h: 850,
      content
    })



    let panels = [
      general,
      solitaire,
      fourtimes,
      octopus
    ]

    panel = this.make(TabPanel, Vec2.make(220, 180), {
      w: 1050,
      h: 850,
      panels,
      selected_index
    })


  }

}

export class MainMenu2 extends Play {

  _init() {


    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    let _ = this.make(Anim, Vec2.zero, { name: 'main_title_bg' })
    _.scale = Vec2.make(2, 2)

    _ = this.make(Anim, Vec2.make(200, 150), { name: 'main_bg' })

    let sofo = this.make(Text, Vec2.make(16, 32), { text: 'sofo', color: Color.hex(0x202431)})
    this.make(Text, Vec2.make(16 + sofo.width, 32), { text: '.demo', color: Color.hex(0xb4beb4)})


    let card_x = 200
    let card_w = 320
    let solitaire_bg = this.make(Anim, Vec2.make(card_x, 250), { name: 'main_card_bg' })
    solitaire_bg.play_now('solitaire')

    let self = this
    this.make(Clickable, Vec2.make(card_x + 120, 350), {
      rect: Rect.make(0, 0, 220, 500),
      on_hover() {
        solitaire_bg.play('solitaire_hover')
      },
      on_hover_end() {
        solitaire_bg.play('solitaire')
      },
      on_click() {
        scene_transition.next(SolitairePlay)
      }
    })
    let solitaire = this.make(Text, Vec2.make(card_x + 120 + 140, 350 + 250), {
      text: 'solitaire',
      center: true,
      size: 98
    })
    solitaire.rotation = Math.PI / 2



    let fourtimes_bg = this.make(Anim, Vec2.make(card_x + card_w, 250), { name: 'main_card_bg' })
    fourtimes_bg.play_now('fourtimes')
    this.make(Clickable, Vec2.make(card_x + card_w + 120, 350), {
      rect: Rect.make(0, 0, 220, 500),
      on_hover() {
        fourtimes_bg.play('fourtimes_hover')
      },
      on_hover_end() {
        fourtimes_bg.play('fourtimes')
      },
      on_click() {
      }
    })
    let fourtimes = this.make(Text, Vec2.make(card_x + card_w + 120 + 140, 350 + 250), {
      text: 'fourtimes',
      center: true,
      size: 82
    })
    fourtimes.rotation = Math.PI / 2




    let octopus_bg = this.make(Anim, Vec2.make(card_x + card_w * 2, 250), { name: 'main_card_bg' })
    octopus_bg.play_now('octopus')
    this.make(Clickable, Vec2.make(card_x + card_w * 2 + 120, 350), {
      rect: Rect.make(0, 0, 220, 500),
      on_hover() {
        octopus_bg.play('octopus_hover')
      },
      on_hover_end() {
        octopus_bg.play('octopus')
      },
      on_click() {
      }
    })
    let octopus = this.make(Text, Vec2.make(card_x + card_w * 2+ 120 + 140, 350 + 250), {
      text: 'octopus',
      center: true,
      size: 96
    })
    octopus.rotation = Math.PI / 2



    let side_h = 180
    let side_y = 200
    this.make(MainSideButton, Vec2.make(1300, side_y), {
      text: 'how_to_play',
      on_click() {
        scene_transition.next(HowtoPlay2)
      }
    })

    this.make(MainSideButton, Vec2.make(1300, side_y + side_h), {
      text: 'statistics',
      on_click() {
        scene_transition.next(Statistics2)
      }
    })

    this.make(MainSideButton, Vec2.make(1300, side_y + side_h * 2), {
      text: 'settings',
      on_click() {
        scene_transition.next(Settings2)
      }
    })

    this.make(MainSideButton, Vec2.make(1300, side_y + side_h * 3), {
      text: 'about',
      on_click() {
        scene_transition.next(About2)
      }
    })





  }

}

class SceneTransition extends Play {
  
  theme_target!: Target
  mask_target!: Target
  target!: Target
  target2!: Target

  mask?: TransitionMask
  current!: Play
  _next?: Play

  next<T extends Play>(ctor: { new(...args: any[]): T}, position: Vec2 = Vec2.zero, data: any = {}) {
    if (!this._next) {
      this._next = this._make(ctor, position, data)
      this.mask = this._make(TransitionMask, Vec2.zero, {})
    }
  }

  _init() {

    this.target2 = Target.create(Game.width, Game.height)

    this.target = Target.create(Game.width, Game.height)
    this.mask_target = Target.create(Game.width, Game.height)

    this.theme_target = Target.create(Game.width, Game.height)

    //this.current = this._make(CardShowcase, Vec2.zero, {})
    // this.current = this._make(MainMenu, Vec2.zero, {})
    //this.current = this._make(Statistics2, Vec2.zero, {})
    this.current = this._make(MainMenu2, Vec2.zero, {})
    //this.current = this._make(HowtoPlay2, Vec2.zero, {})
    //this.current = this._make(Settings2, Vec2.zero, {})
    //this.current = this._make(SolitairePlay, Vec2.zero, {})
    //this.current = this._make(About2, Vec2.zero, {})

    transition.set_matrix(Mat3x2.create_scale_v(Game.v_screen))
    pallette.set_matrix(Mat3x2.create_scale_v(Game.v_screen))

  }

  _update() {

    this._next?.update()
    this.current.update()

    this.mask?.update()

    if (this.mask?.done) {
      this.current.dispose()
      this.mask.dispose()
      this.mask = undefined
      this.current = this._next!
      this._next = undefined
    }
  }

  _draw(batch: Batch) {

    if (!this._next) {
      this.current.draw(batch)

      batch.render(this.theme_target)
      batch.clear()
    } else {

      this.current.draw(batch)
      batch.render(this.target)
      batch.clear()

      this._next.draw(batch)
      batch.render(this.target2)
      batch.clear()

      this.mask_target.clear(Color.hex(0xff0000))
      this.mask?.draw(batch)
      batch.render(this.mask_target)
      batch.clear()

      transition.texture = this.target.texture(0)
      transition.texture2 = this.target2.texture(0)
      transition.mask_texture = this.mask_target.texture(0)

      transition.render(this.theme_target)
    }


    pallette.texture = this.theme_target.texture(0)
    pallette.render()
  }
}

export let scene_transition: SceneTransition

export default class Game extends Play {

  static width = 1920
  static height = 1080

  static v_screen = Vec2.make(Game.width, Game.height)

  _init() {

    batch.default_sampler = TextureSampler.make(TextureFilter.Linear)

    this.objects = []

    Sound.load().then(() => {
      //console.log(Sound)
    })

    Content.load().then(() => {
      Trans.language = GeneralStore.language
      scene_transition = this.make(SceneTransition, Vec2.zero, {})
    })
  }

  _update() {
  }

  _draw() {

    Play.next_render_order = 0
    App.backbuffer.clear(Color.black)

    this._draw_children(batch)
    Input._sort_hooks()
  }

}
