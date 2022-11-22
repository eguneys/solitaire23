import { Component } from '../world'
import { Time, Batch, Vec2, Mat3x2, Color } from 'blah'
import { Sprite } from '../assets/sprite'
import Content from '../content'


export class Animator extends Component {

  static make = (name: string) => new Animator(name)

  constructor(readonly name: string) {
    super()
    this._sprite = Content.find_sprite(name)
    this._animation_index = 0
    this._frame_index = 0
    this._frame_counter = 0
  }

  _sprite: Sprite
  _animation_index: number
  _frame_index: number
  _frame_counter: number

  _loop: boolean = true


  scale = Vec2.one
  offset = Vec2.zero

  get sprite() {
    return this._sprite
  }

  get animation() {

    if (this._sprite && this._animation_index >= 0 && this._animation_index < this._sprite.animations.length) {
      return this._sprite.animations[this._animation_index]
    }
    return undefined
  }


  play(animation: string, loop: boolean = false, restart: boolean = false) {
    this._loop = loop
    for (let i = 0; i < this._sprite.animations.length; i++) {
      if (this._sprite.animations[i].name === animation) {
        if (this._animation_index !== i || restart) {
          this._animation_index = i
          this._frame_index = 0
          this._frame_counter = 0
        }
        break
      }
    }
  }


  update() {
    if (this._in_valid_state) {
      let anim = this._sprite.animations[this._animation_index]
      let frame = anim.frames[this._frame_index]

      this._frame_counter += Time.delta

      while (this._frame_counter >= frame.duration) {
        this._frame_counter -= frame.duration

        this._frame_index++;

          if (this._frame_index >= anim.frames.length) {
            if (this._loop) {
              this._frame_index = 0
            } else {
              this._frame_index = anim.frames.length - 1
            }
          }
      }
    }
  }

  render(batch: Batch) {
    if (this._in_valid_state) {
      batch.push_matrix(
        Mat3x2.create_transform(this.entity.position.add(this.offset),
                                 this._sprite.origin, this.scale, 0))

      let anim = this._sprite.animations[this._animation_index]
      let frame = anim.frames[this._frame_index]
      batch.stex(frame.image, Vec2.zero, Color.white)
      batch.pop_matrix()
    }
  }


  get _in_valid_state() {
    return this._sprite && 
      this._animation_index >= 0 && 
      this._animation_index < this._sprite.animations.length &&
      this._frame_index >= 0 &&
      this._frame_index < this._sprite.animations[this._animation_index].frames.length
  }

}
