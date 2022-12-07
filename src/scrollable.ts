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
import { Text } from './game'


class Runway<T, View> {


  get i_top0() {
    return Math.max(0, this._i0 - this._window)
  }

  get i_bottom0() {
    return Math.min(this._i0 + this._window, this.items.length - 1)
  }

  get i_top() {
    return Math.max(0, this._i - this._window)
  }

  get i_bottom() {
    return Math.min(this._i + this._window, this.items.length - 1)
  }

  _i: number
  _i0: number
  set i(i: number) {
    if (i < 0 || i >= this.items.length) {
      return
    }
    if (i !== this._i) {
      this._i = i
      this._refresh()
    }
  }

  runway: Array<View>

  constructor(readonly _window: number,
              readonly make: (item: T, index: number) => View,
              readonly dispose: (v: View) => void,
              readonly items: Array<T>) {
    this.runway = []
    this._i = 0
    this._i0 = 0

    for (let i = this.i_top0; i <= this.i_bottom0; i++) {
      this.runway.push(this.make(this.items[i], i))
    }
  }

  _refresh() {

    for (let i = this.i_top - 1; i >= this.i_top0; i--) {
      let _ = this.runway.splice(i - (this.i_top - 1), 1)
      this.dispose(_[0])
    }

    for (let i = this.i_bottom0 + 1; i <= this.i_bottom; i++) {
      this.runway.push(this.make(this.items[i], i))
    }

    for (let i = this.i_bottom0; i > this.i_bottom; i--) {
      let _ = this.runway.pop()!
      this.dispose(_)
    }

    for (let i = this.i_top0 - 1; i >= this.i_top; i--) {
      this.runway.unshift(this.make(this.items[i], i))
    }

    this._i0 = this._i
  }

}

let test = () => {


  const same = (a: Array<any>, b: Array<any>) => {
    if (a.length !== b.length) {
      console.log(a, b)
      return
    }
    if (a.find((a, i) => a !== b[i])) {
      console.log(a, b)
    }
  }

  let mades: Array<any> = [],
  disposes: Array<any> = []
  const expect = (a: Array<any>, b: Array<any>, _mades: Array<any>, _disposes: Array<any>) => {
    same(a, b)
    same(mades, _mades)
    same(disposes, _disposes)
    mades = []
    disposes = []
  }

  let r = new Runway(2, _ => { mades.push(_); return _ }, _ => { disposes.push(_); return _ }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  expect(r.runway, [1, 2, 3], [1, 2, 3], [])

  r.i = 1
  expect(r.runway, [1, 2, 3, 4], [4], [])

  r.i = 2
  expect(r.runway, [1, 2, 3, 4, 5], [5], [])

  r.i = 3
  expect(r.runway, [2, 3, 4, 5, 6], [6], [1])

  r.i = 4
  expect(r.runway, [3, 4, 5, 6, 7], [7], [2])

  r.i = 5
  expect(r.runway, [4, 5, 6, 7, 8], [8], [3])

  r.i = 6
  expect(r.runway, [5, 6, 7, 8, 9], [9], [4])

  r.i = 7
  expect(r.runway, [6, 7, 8, 9, 10], [10], [5])

  r.i = 8
  expect(r.runway, [7, 8, 9, 10], [], [6])

  r.i = 9
  expect(r.runway, [8, 9, 10], [], [7])


  r.i = 10
  expect(r.runway, [8, 9, 10], [], [])

  r.i = 11
  expect(r.runway, [8, 9, 10], [], [])

  r.i = 12
  expect(r.runway, [8, 9, 10], [], [])


  r.i = 11
  expect(r.runway, [8, 9, 10], [], [])

  r.i = 10
  expect(r.runway, [8, 9, 10], [], [])

  r.i = 9
  expect(r.runway, [8, 9, 10], [], [])

  r.i = 8
  expect(r.runway, [7, 8, 9, 10], [7], [])

  r.i = 7
  expect(r.runway, [6, 7, 8, 9, 10], [6], [])

  r.i = 6
  expect(r.runway, [5, 6, 7, 8, 9], [5], [10])

  r.i = 5
  expect(r.runway, [4, 5, 6, 7, 8], [4], [9])


  r.i = 4
  expect(r.runway, [3, 4, 5, 6, 7], [3], [8])


  r.i = 3
  expect(r.runway, [2, 3, 4, 5, 6], [2], [7])

  r.i = 2
  expect(r.runway, [1, 2, 3, 4, 5], [1], [6])

  r.i = 1
  expect(r.runway, [1, 2, 3, 4], [], [5])


  r.i = 0
  expect(r.runway, [1, 2, 3], [], [4])

  r.i = -1
  expect(r.runway, [1, 2, 3], [], [4])

  r.i = -2
  expect(r.runway, [1, 2, 3], [], [4])

  console.log('well done')
}

// test()



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

export type InfiniteLongListData = {
  w: number,
  h: number,
  items: Array<any>,
  ItemContent: PlayType<Play>,
  no_content: string
}


export class InfiniteScrollableList extends Play {

  get data() {
    return this._data as InfiniteLongListData
  }


  _init() {

    if (this.data.items.length === 0) {
      this.make(Text, Vec2.make(this.data.w/2, this.data.h*0.25), {
        text: this.data.no_content,
        center: true
      })

    } else {

      let content = this._make(InfiniteLongList, Vec2.make(0, 0), this.data)


      this.make(InfiniteScrollableContent, Vec2.make(0, 0), {
        w: this.data.w,
        h: this.data.h,
        content
      })
    }


  }
}

class InfiniteLongList extends Play {

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
      this.runway.i = this.i
    }
  }


  get i() {
    return Math.round(- this._viewport_y / this.item_height)
  }

  get height() {
    return this.runway.i_bottom * this.item_height
  }

  dummy_item!: Play

  get item_height() {
    return (this.dummy_item as any).height
  }
  runway!: Runway<any, any>

  _init() {

    this.dummy_item = (this._make(this.data.ItemContent, Vec2.make(0, 0), this.data.items[0]) as any)

    const on_make = (item: any, i: number) =>
      this.make(this.data.ItemContent, Vec2.make(0, i * this.item_height), item)

    const on_dispose = (v: any) => v.dispose()

    this.runway = new Runway(5, on_make, on_dispose, this.data.items)
  }

  _adjust_viewport() {
    this.position.y = this._viewport_y
  }

  _dispose() {
    this.dummy_item.dispose()
  }

}

type ScrollableContentData = {
  w: number,
  h: number,
  content: InfiniteLongList
}

class InfiniteScrollableContent extends Play {

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
      on_up(e: Vec2, right: boolean, m?: Vec2) {
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
      this.scroll_y + this.scroll_off + this.scroll_edge_off

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
