import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { Hooks, EventPosition, DragEvent } from './input'
import { howtos } from './howtos'
import { Transition, transition } from './transition'


import { rmap, ease, lerp, appr } from './lerp'
import { Play, PlayType } from './play'


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


export class InfiniteScrollableList extends Play {

  get data() {
    return this._data as InfiniteLongListData
  }


  _init() {

    let content = this._make(InfiniteLongList, Vec2.make(0, 0), this.data)


    this.make(InfiniteScrollableContent, Vec2.make(0, 0), {
      w: this.data.w,
      h: this.data.h,
      content
    })


  }
}

export type InfiniteLongListData = {
  w: number,
  h: number,
  items: Array<any>
  ItemContent: PlayType<Play>
}

export class InfiniteLongList extends Play {

  get data() {
    return this._data as InfiniteLongListData
  }

  get edge_top() {
    return 0
  }

  get edge_bottom() {
    return this.data.items.length * this.item_height
  }

  _viewport_y: number = 0
  set viewport_y(y: number) {
    if (this._viewport_y !== y) {
      this._viewport_y = y
      this._adjust_viewport()

      let delta = this.i - this._i0

      if (Math.abs(delta) > 0) {
        this._refresh_views(delta)
      }
    }
  }


  get i() {
    return Math.round(- this._viewport_y / this.item_height)
  }
  _i0!: number

  get item_height() {
    return (this.runway[0] as any)?.height ?? 1
  }

  runway!: Array<Play>

  _init() {
    this.runway = []
    this._i0 = this.i

    this._refresh_views(0)
  }

  _adjust_viewport() {
    this.position.y = this._viewport_y
  }

  _update() {
    //console.log(this.runway.length)
  }

  _refresh_views(delta: number) {
    console.log(this.i, delta, this.runway.length)
    if (this.i < 0) {
      return
    }
    if (delta === 0) {

      let h = 0
      this.data.items.slice(0, 10).forEach(item => {
        let _ = this.make(this.data.ItemContent, Vec2.make(0, h), item)
        h += (_ as any).height
        this.runway.push(_)
      })

    } else if (delta > 0) {
      if (this.runway.length < delta) {
      } else {
        let removed = this.runway.splice(0, delta)
        removed.forEach(_ => _.dispose())
      }

      let h = this.runway[this.runway.length - 1].position.y + this.item_height
      this.data.items.slice(this.i - delta + 10, this.i + 10).forEach(item => {
        let _ = this.make(this.data.ItemContent, Vec2.make(0, h), item)
        h += (_ as any).height
        this.runway.push(_)
      })

    } else {
      let removed = this.runway.splice(this.runway.length + delta)
      removed.forEach(_ => _.dispose())

      let h = this.runway[0].position.y - this.item_height * - delta
      this.data.items.slice(this.i, this.i - delta).forEach(item => {
        let _ = this.make(this.data.ItemContent, Vec2.make(0, h), item)
        h += (_ as any).height
        this.runway.unshift(_)
      })
    }

    this._i0 = this.i
  }

}


type ScrollableContentData = {
  w: number,
  h: number,
  content: InfiniteLongList
}

export class InfiniteScrollableContent extends Play {

  get data() {
    return this._data as ScrollableContentData
  }

  get width() {
    return this.data.w
  }

  get height() {
    return this.data.h
  }

  get content() {
    return this.data.content
  }

  scroll_y!: number
  scroll_off!: number
  scroll_edge_off!: number

  thumb!: Play

  _init() {

    this.scroll_y = 0
    this.scroll_off = 0
    this.scroll_edge_off = 0

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

    let thumb_height = this.height * (this.height / (this.data.content as any).height)
    this.thumb = this._make(RectView, Vec2.make(this.data.w - 20 - 8 + 4, 8 + 4), {
      w: 20 - 8,
      h: thumb_height,
      color: Color.white
    })

    let self = this
    this.unbindable_input({
      on_drag(d: DragEvent, d0?: DragEvent) {
        if (d.m) {
          self.scroll_off = (d.m.y - d.e.y) * 1080
        }
        return true
      },
      on_up(e: Vec2, right: boolean) {
        self.scroll_y += self.scroll_off
        self.scroll_off = 0

        // scroll_y < edge_top
        let edge_top = self.content.edge_top
        if (self.scroll_y > edge_top) {
          self.scroll_edge_off = self.scroll_y - edge_top
          self.scroll_y = edge_top
        } else {
          // scroll_y + this.height < edge_bottom
          let edge_bottom = self.content.edge_bottom
          if (self.height > edge_bottom) {
            self.scroll_edge_off = self.scroll_y - edge_top
            self.scroll_y = edge_top
          } else if (- self.scroll_y + self.height > edge_bottom) {
            self.scroll_edge_off = self.scroll_y + (edge_bottom - self.height)
            self.scroll_y = - (edge_bottom - self.height)
          }
        }

        return true
      }
    })
  }

  _update() {

    this.scroll_edge_off = lerp(this.scroll_edge_off, 0, 0.2)

    this.thumb.position.y = -(this.scroll_y + this.scroll_off + this.scroll_edge_off) / (this.data.content as any).height * this.height

    this.data.content.viewport_y = 
      40 + this.scroll_y + this.scroll_off + this.scroll_edge_off

    this.data.content.update()
  }

  _draw(batch: Batch) {

    batch.push_matrix(Mat3x2.create_translation(this.position))
    this._draw_children(batch)

    let position = Vec2.transform(Vec2.zero, batch.m_matrix)
    batch.push_scissor(Rect.make(position.x, position.y + 12, this.width, this.height - 24))
    this.thumb.draw(batch)
    batch.pop_scissor()

    //batch.push_matrix(Mat3x2.create_translation(Vec2.make(40, 40 + this.scroll_y + this.scroll_off)))

    batch.push_scissor(Rect.make(position.x, position.y, this.width, this.height))
    this.data.content.draw(batch)
    batch.pop_scissor()
    //batch.pop_matrix()

    batch.pop_matrix()
  }

  _dispose() {
    this.data.content.dispose()
  }

}
