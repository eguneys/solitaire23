import { App } from 'blah'
import Game from './game'

const app = (element: HTMLElement) => {

  let game = new Game()

  App.run({
    name: 'solitaire23',
    width: 1920,
    height: 1080,
    on_startup() {
      game.init()
    },
    on_update() {
      game.update()
    },
    on_render() {
      game.render()
    }
  })

  if (App.canvas) {
    element.appendChild(App.canvas)
  }
}


app(document.getElementById('app')!)


export default app
