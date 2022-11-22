import { World, Component } from '../world'
import { Vec2, Mat3x2 } from 'blah'

import Input, { EventPosition } from '../input'

export class Hoverable extends Component {


  constructor() { 
    super() 
    Input.register({
      on_hover(e: EventPosition) {
        return false
      }
    })
  }


  update() {

  }

}
