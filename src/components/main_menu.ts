import { World, Component } from '../world'
import { Vec2, Mat3x2 } from 'blah'

import { Background } from './background'

export class MainMenu extends Component {


  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)

    en.add(new MainMenu())

    Background.make(world, position)

    return en

  }

}
