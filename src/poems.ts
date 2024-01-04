import en from '../content/poems/en.poem?raw'
import { arr_random } from './util'

class Poems {
    static load = () => {


        let verses = en.split('\r\n\r\n')

        return new Poems(verses)

    }


    constructor(readonly verses: string[]) {}


    one() {
        return arr_random(this.verses, Math.random)
    }
}

let poems = Poems.load()

export { poems as Poems }