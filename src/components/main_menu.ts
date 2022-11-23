import { World, Component } from '../world'
import { Rect, Vec2, Mat3x2 } from 'blah'

import { Background } from './background'
import { Animator } from './animator'
import Game from '../game'
import { Hoverable } from './hoverable'
import { Collider } from './collider'

class Title extends Component {
  static make = (world: World, position: Vec2) => {

    let offset = Vec2.make(1, 1)
    let en = world.add_entity(position.add(offset))

    let anim = en.add(Animator.make('title_bg'))
    anim.play('idle')

    en.add(new Background())

    return en

  }
}

class Card extends Component {

  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)

    let anim = en.add(Animator.make('card_bg'))
    anim.play('idle')


    let underline = world.add_entity(position.add(Vec2.make(0, 40)))
    let under_anim = underline.add(Animator.make('card_underline'))
    under_anim.play('idle')

    let hitbox = en.add(Collider.make_rect(Rect.make(0, 0, Game.card_width, Game.card_height)))

    let hover = en.add(new Hoverable())
    hover.collider = hitbox
    hover.on_hover_begin = () => {
      under_anim.play('open')
    }
    hover.on_hover_end = () => {
      under_anim.play('open', { reverse: true })
    }


    return en
  }
}

class Cards extends Component {
  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)


    let solitaire = Card.make(world, position),
      freecell = Card.make(world, position.add(Vec2.make(Game.card_width, 0))),
      spider = Card.make(world, position.add(Vec2.make(Game.card_width * 2, 0)))


    en.add(new Cards())

    return en
  }

}

class TextButtons extends Component {
  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)

    en.add(new TextButtons())

    return en
  }

}

export class MainMenu extends Component {


  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)

    en.add(new MainMenu())

    Background.make(world, position)
    Title.make(world, position)

    Cards.make(world, position.add(Vec2.make(Game.width * 0.05, Game.height * 0.2)))
    TextButtons.make(world, position)


    return en

  }

}
