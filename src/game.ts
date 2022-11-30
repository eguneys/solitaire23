import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Vec2, Mat3x2 } from 'blah'
import { App, batch, Batch, Target } from 'blah'

import Content from './content'


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

  make<T extends Play>(ctor: { new(...args: any[]): T}, position: Vec2, data: any) {
    let res = new ctor()._set_data(position, data).init()
    this.objects.push(res)
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

class HowtoPlay extends Play {

  _init() {

    this.make(Navigation, Vec2.make(2, 2), {
      route: 'how to play',
      on_back() {
        console.log('back')
      }
    })


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

  _draw(batch: Batch) {
    batch.str_j(this.font, this.route, this.position, Vec2.zero, 128, Color.white)
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
