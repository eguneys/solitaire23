import { World, Component } from '../world'
import { Vec2, Batch } from 'blah'
import { Animator } from './animator'
import Game from '../game'


export class Background extends Component {

  static make = (world: World, position: Vec2) => {

    let en = world.add_entity(position)

    let anim = en.add(Animator.make('palette'))
    anim.play('4')

    anim.scale = Vec2.make(Game.width / 8, Game.height / 8)

    en.add(new Background())

    return en
  }


  render(batch: Batch) {




  }

}
