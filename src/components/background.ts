import { World, Component } from '../world'
import { Color, Rect, Vec2, Batch } from 'blah'
import { Animator } from './animator'
import { Text } from './text'
import Game from '../game'
import { Hoverable } from './hoverable'
import { Collider } from './collider'


export class NavigateBack extends Component {

  static make = (world: World, text: string) => {

    let en = world.add_entity(Vec2.make(2, 2))


    let anim = en.add(Animator.make('palette'))
    anim.play('2')
    anim.scale = Vec2.make(240/8, 30/8)

    let bar = en.add(Animator.make('palette'))
    bar.play('5')
    bar.scale = Vec2.make(8/8, 30/8)
    bar.offset = Vec2.make(32, 0)

    let shadow = en.add(Text.make(text, 32, Color.white))
    shadow.offset = Vec2.make(32 + 12, 4)


    let back = en.add(Text.make("@", 32, Color.white))
    back.offset = Vec2.make(4, 4)

    let hitbox = en.add(Collider.make_rect(Rect.make(0, 0, 32, 30)))

    let hover = en.add(new Hoverable())
    hover.collider = hitbox
    hover.on_hover_begin = () => {
      back.color = Color.red
    }
    hover.on_hover_end = () => {
      back.color = Color.white
    }
  }
}



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
