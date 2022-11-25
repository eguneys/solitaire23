import { World, Component } from '../world'
import { Color, Rect, Vec2, Mat3x2 } from 'blah'

import { Background } from './background'
import { Animator } from './animator'
import { Text } from './text'
import Game from '../game'
import { Hoverable } from './hoverable'
import { Collider } from './collider'

class Title extends Component {
  static make = (world: World, position: Vec2) => {

    let offset = Vec2.make(1, 1)
    let en = world.add_entity(position.add(offset))

    let anim = en.add(Animator.make('title_bg'))
    anim.play('idle')

    let s = 38
    let y = 12
    let title = en.add(Text.make('lisotaire', s))
    title.offset = Vec2.make(8, y)
    let com = en.add(Text.make('.com', s, Color.hex(0xcccccc)))
    com.offset = Vec2.make(title.end_x, y)

    en.add(new Background())

    return en

  }
}

class Card extends Component {

  static make = (world: World, position: Vec2, text: string) => {
    let en = world.add_entity(position)

    let anim = en.add(Animator.make('card_bg'))
    anim.play('idle')


    let underline = world.add_entity(position.add(Vec2.make(0, 40)))
    let under_anim = underline.add(Animator.make('card_underline'))
    under_anim.play('idle')


    let shadow = en.add(Text.make(text, 50, Color.black, Math.PI / 2))
    shadow.offset = Vec2.make(40, -56).add(Vec2.make(2, 2))
    let title = en.add(Text.make(text, 50, Color.white, Math.PI / 2))
    title.offset = Vec2.make(40, -56)

    let hitbox = en.add(Collider.make_rect(Rect.make(0, 0, Game.card_width, Game.card_height)))

    let hover = en.add(new Hoverable())
    hover.collider = hitbox
    hover.on_hover_begin = () => {
      under_anim.play('open')
      title.color = Color.hex(0xcc3344)
    }
    hover.on_hover_end = () => {
      under_anim.play('open', { reverse: true })
      title.color = Color.white
    }




    return en
  }
}

class Cards extends Component {
  static make = (world: World, position: Vec2) => {
    let en = world.add_entity(position)


    let solitaire = Card.make(world, position, 'solitaire'),
      freecell = Card.make(world, position.add(Vec2.make(Game.card_width, 0)), 'freecell'),
      spider = Card.make(world, position.add(Vec2.make(Game.card_width * 2, 0)), 'spider')


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
