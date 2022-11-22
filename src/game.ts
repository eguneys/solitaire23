import { TextureFilter, TextureSampler } from 'blah'
import { Color } from 'blah'
import { Vec2, Mat3x2 } from 'blah'
import { App, batch } from 'blah'
import { Target } from 'blah'

import { World } from './world'

import { Batch } from 'blah'
import { Entity, Component } from './world'

import Content from './content'

export default class Game {


  static rand_int = (min: number, max: number) => {
    return min + Math.floor(Math.random() * (max - min))
  }

  static width = 640
  static height = 360

  buffer!: Target

  init() {

    this.buffer = Target.create(Game.width, Game.height)

    batch.default_sampler = TextureSampler.make(TextureFilter.Nearest)


    Content.load().then(() => {
    })
  }

  update() {
  }

  render() {

    {

      this.buffer.clear(Color.hex(0x150e22))

      //this.world.render(batch)


      batch.render(this.buffer)
      batch.clear()
    }


    {
      let scale = Math.min(
        App.backbuffer.width / this.buffer.width,
        App.backbuffer.height / this.buffer.height)

        let screen_center = Vec2.make(App.backbuffer.width, App.backbuffer.height).scale(1/2)
        let buffer_center = Vec2.make(this.buffer.width, this.buffer.height).scale(1/2)

        App.backbuffer.clear(Color.black)
                                                  
        batch.push_matrix(Mat3x2.create_transform(screen_center, // position
                                                  buffer_center, // origin
                                                  Vec2.one.scale(scale), // scale
                                                  0                      // rotation
                                                 ))

        batch.tex(this.buffer.texture(0), Vec2.zero, Color.white)
        batch.pop_matrix()
        batch.render(App.backbuffer)
        batch.clear()
    }
  }

}
