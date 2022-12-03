import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Rect, Vec2, Mat3x2 } from 'blah'
import { Time, App, batch, Batch, Target } from 'blah'

import Content from './content'
import Input, { Hooks, EventPosition, DragEvent } from './input'
import { howtos } from './howtos'
import { Transition, transition } from './transition'



export const bg1 = Color.hex(0x202431)
export const link_color = Color.hex(0x4ab2cd)



export abstract class Play {

  visible: boolean = true
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

  unbindable_input(hooks: Hooks) {
    this._disposes.push(Input.register(hooks))
  }

  _disposes!: Array<() => void>
  objects!: Array<Play>
  parent?: Play

  _add_object(child: Play) {
    this.objects.push(child)
    child.parent = this
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

    this._disposes = []
    this.objects = []

    this._init()
    return this 
  }

  update() {
    this.objects.forEach(_ => _.update())
    this._update()
  }

  draw(batch: Batch) {
    if (this.visible) {
      this._draw(batch)
    }
  }

  _draw_children(batch: Batch) {
    this.objects.forEach(_ => _.draw(batch))
  }

  dispose() {

    this.objects.slice(0).forEach(_ => _.dispose())
    this._dispose()

    this._disposes.forEach(_ => _())
    if (this.parent) {
      this.parent.objects.splice(this.parent.objects.indexOf(this), 1)
    }
  }

  _init() {}
  _update() {}
  _draw(batch: Batch) {
    batch.push_matrix(Mat3x2.create_translation(this.position))
    this.g_position = Vec2.transform(Vec2.zero, batch.m_matrix)
    this._draw_children(batch)
    batch.pop_matrix()
  }
  _dispose() {}
}


export type PlayType<T extends Play> = { new(...args: any[]): T}
