import { Vec2, Rect } from 'blah'
import { Component, World } from '../world'
import { Collider } from './collider'
import _Input, { EventPosition } from '../input'
import Mask from '../masks'
import Game from '../game'

export class Input extends Component {

  static make = (world: World) => {
    let en = world.add_entity(Vec2.zero)

    let hitbox = en.add(Collider.make_rect(Rect.make(-2, -2, 4, 4)))
    hitbox.mask = Mask.hover

    en.add(new Input())
    return en
  }


  constructor() { super()
    let self = this
    _Input.register({
      on_hover(e: EventPosition) {
        self.entity.position.set_in(e.mul(Vec2.make(Game.width, Game.height)))
        return true
      }
    })
  }

}
