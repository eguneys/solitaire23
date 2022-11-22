
import { Vec2, Subtexture } from 'blah'

export class Frame {
  constructor(readonly image: Subtexture,
              readonly duration: number) {}
}

export class Animation {

  constructor(readonly name: string,
              readonly frames: Array<Frame>) {}

}


export class Sprite {


  constructor(readonly name: string,
              readonly origin: Vec2,
              readonly animations: Array<Animation>) {}

  get(name: string) {
    return this.animations.find(_ => _.name === name)
  }

}
