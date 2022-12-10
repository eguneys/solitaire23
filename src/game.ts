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
import { Tween } from './tween'

import { SolitairePlay } from './solitaire'

import { CardShowcase } from './showcase'
import { ticks } from './shared'

import Sound from './sound'

import Trans, { languages } from './trans'

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

export class Background extends Play {
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
    return this.data.rect.w
  }

  get height() {
    return this.data.rect.h
  }

  get _rect() {
    return this.data.abs ? 
      Rect.make(this.position.x, this.position.y, this.width, this.height)
      : Rect.make(this.g_position.x, this.g_position.y, this.width, this.height)
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
          return self.data.on_click_begin?.() || false
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
          return self.data.on_drag?.(m) || false
        }

        if (d.m && (!d0 || !d0.m)) {
          let e = d.e.mul(Game.v_screen)
          let point = Rect.make(e.x - 4, e.y - 4, 8, 8)
          let rect = self.rect
          if (rect.overlaps(point)) {
            _dragging = true
            return self.data.on_drag_begin?.(e) || false
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
          let rect = self.rect
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
             return self.data.on_hover?.() || false
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
          return self.data.on_click?.() || false
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
          return self.data.on_wheel?.(d) || false
        }
        return false
      }
    })
  }

  _draw() {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)
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

class MainSideBar extends Play {

  _init() {

    this.make(RectView, Vec2.make(0, 0), {
      w: 580,
      h: 900,
      color: Color.black
    })

    let _
    let tabs = [ ]

    _ = this._make(MainSideBarItem, Vec2.make(0, 0), { icon: 'how to play', next: HowtoPlay })
    tabs.push(_)
    _ = this._make(MainSideBarItem, Vec2.make(0, _.height), { icon: 'settings', next: Settings })
    tabs.push(_)
    _ = this._make(MainSideBarItem, Vec2.make(0, _.height * 2), { icon: 'statistics', next: Statistics })
    tabs.push(_)
    _ = this._make(MainSideBarItem, Vec2.make(0, _.height * 3), { icon: 'about', next: About })
    tabs.push(_)

    this.make(Tabs, Vec2.make(4, 4), {
      tabs
    })


  }
}

export class MainMenu extends Play {
  _init() {

    this.make(Background, Vec2.zero, undefined)

    this.make(MainTitle, Vec2.make(6, 6), {})

    this.make(MainSideBar, Vec2.make(1320, 100), {})

    this.make(MainCards, Vec2.make(80, 260), {})

  }
}


class MainCards extends Play {


  _init() {
    let w = 380
    this.make(MainCard, Vec2.make(0, 0), {
      text: 'solitaire'
    })
    this.make(MainCard, Vec2.make(w, 0), {
      text: 'freecell'
    })
    this.make(MainCard, Vec2.make(w * 2, 0), {
      text: 'spider'
    })
  }

}

type MainCardData = {
  text: string
}

class MainCard extends Play {

  get data() {
    return this._data as MainCardData
  }

  _init() {

    this.make(Anim, Vec2.make(0, 0), {
      name: 'main_card_bg'
    })

    let text = this.make(Text, Vec2.make(-450, 200), {
      text: this.data.text,
      rotation: - Math.PI * 0.5,
      color: Color.black
    })


    this.make(Clickable, Vec2.make(60, 64), {
      rect: Rect.make(0, 0, 300, 420),
      on_click() {
        scene_transition.next(SolitairePlay)
      },
      on_hover() {
        text.color = Color.red
      },
      on_hover_end() {
        text.color = Color.black
      }
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
        scene_transition.next(MainMenu)
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


export class Settings extends Play {
  _init() {

    this.make(Background, Vec2.zero, undefined)

    let self = this
    this.make(Navigation, Vec2.zero, {
      route: 'settings',
      on_back() {
        scene_transition.next(MainMenu)
      }
    })


    let content = this._make(RectView, Vec2.make(0, 0), {
      w: 100,
      h: 100
    })

    this.make(ScrollableContent, Vec2.make(20, 120), {
      w: 1880,
      h: 940,
      content
    })


  }
}
export class About extends Play {
  _init() {

    this.make(Background, Vec2.zero, undefined)

    let self = this
    this.make(Navigation, Vec2.zero, {
      route: 'about',
      on_back() {
        scene_transition.next(MainMenu)
      }
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

export class HowtoPlay extends Play {

  _init() {

    this.make(Background, Vec2.zero, undefined)

    let self = this
    this.make(Navigation, Vec2.zero, {
      route: 'how_to_play',
      on_back() {
        scene_transition.next(MainMenu)
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
      content: howtos['solitaire']
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


  _text!: string

  set text(_: string) {
    this._text = _
    this._text_view.text = this.text
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
    return this.data.color ?? Color.white
  }

  set color(color: Color) {
    this.data.color = color
  }

  get text() {
    return this.data.text
  }

  set text(text: string) {
    this.data.text = text
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

  _init() {
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

class HyperText extends Text {

  get data() {
    return this._data as HyperTextData
  }

  _init() {

    let self = this
    this.unbindable_input({
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
  size?: number,
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
      size: this.data.size,
      text: this.data.text,
      center: true
    })
  }

}

type TabPanelData = {
  panels: Array<Play>,
  w: number,
  h: number
}


class TabPanel extends Play {

  get data() {
    return this._data as TabPanelData
  }

  _init() {

    this.make(RectView, Vec2.zero, {
      w: this.data.w,
      h: this.data.h,
      color: Color.hex(0x202431)
    })
  }

  _update() {
    this.data.panels.forEach(_ => _.update())
  }

  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    this.data.panels.forEach(_ => _.draw(batch))
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

  get done() {
    return this._t === 0
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

class HowtoPlay2 extends Play {

  _init() {

    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    this.make(Navigation2, Vec2.zero, {
      key: 'how_to_play',
      on_back() {
        scene_transition.next(MainMenu2)
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
      size: 72
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

class GeneralSettings extends Play {

  height!: number

  _init() {

    let h = 220
    let language_setting = this.make(DropdownSetting, Vec2.make(0, 0), {
      no_trans: true,
      name: 'language',
      items: languages.map(_ => Trans.lang_key(_)),
      selected_index: 0,
      on_selected(i: number) {
        Trans.language = languages[i]
      }
    })

    let theme_setting = this.make(DropdownSetting, Vec2.make(0, h), {
      name: 'color_theme',
      items: ['pink', 'blue', 'orange'],
      selected_index: 0,
      on_selected(i: number) {
        console.log(i)
      }
    })


    let sound_setting = this.make(DropdownSetting, Vec2.make(0, h * 2), {
      name: 'sounds',
      items: ['on', 'off'],
      selected_index: 0,
      on_selected(i: number) {
        console.log(i)
      }
    })



    this.make_box(language_setting, true)
    this.make_box(theme_setting)
    this.make_box(sound_setting)

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
      w: 1400,
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

class Settings2 extends Play {

  _init() {

    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    this.make(Navigation2, Vec2.zero, {
      key: 'settings',
      on_back() {
        scene_transition.next(MainMenu2)
      }
    })

    let content = this._make(GeneralSettings, Vec2.make(0, 0), {})


    this.make(ScrollableContent, Vec2.make(220, 150), {
      w: 1480,
      h: 910,
      content
    })



  }

}

class MainMenu2 extends Play {

  _init() {


    this.make(RectView, Vec2.zero, { w: 1920, h: 1080, color: Color.hex(0xb4beb4)})


    let _ = this.make(Anim, Vec2.zero, { name: 'main_title_bg' })
    _.scale = Vec2.make(2, 2)

    _ = this.make(Anim, Vec2.make(200, 150), { name: 'main_bg' })

    let lisotaire = this.make(Text, Vec2.make(16, 32), { text: 'lisotaire', color: Color.hex(0x202431)})
    this.make(Text, Vec2.make(16 + lisotaire.width, 32), { text: '.com', color: Color.hex(0xb4beb4)})


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
      }
    })

    this.make(MainSideButton, Vec2.make(1300, side_y + side_h * 2), {
      text: 'settings',
      on_click() {
      }
    })

    this.make(MainSideButton, Vec2.make(1300, side_y + side_h * 3), {
      text: 'about',
      on_click() {
      }
    })





  }

}

class SceneTransition extends Play {
  
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

    //this.current = this._make(CardShowcase, Vec2.zero, {})
    // this.current = this._make(SolitairePlay, Vec2.zero, {})
    // this.current = this._make(MainMenu, Vec2.zero, {})
    //this.current = this._make(Statistics, Vec2.zero, {})
    //this.current = this._make(MainMenu2, Vec2.zero, {})
    //this.current = this._make(HowtoPlay2, Vec2.zero, {})
    this.current = this._make(Settings2, Vec2.zero, {})

    transition.set_matrix(Mat3x2.create_scale_v(Game.v_screen))

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
      return
    }

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

    transition.render()
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
      console.log(Sound)
    })

    Content.load().then(() => {
      scene_transition = this.make(SceneTransition, Vec2.zero, {})
    })
  }

  _update() {
  }

  _draw() {

    Play.next_render_order = 0
    App.backbuffer.clear(Color.black)

    this._draw_children(batch)

    {
        batch.render(App.backbuffer)
        batch.clear()
    }

    Input._sort_hooks()
  }

}
