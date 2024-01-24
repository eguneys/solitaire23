import { Vec2 } from 'blah'

export const v_screen = Vec2.make(1920, 1080)

export type RNG = () => number
/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}
export const random = make_random()

export function int_random(max: number, rng: RNG = random) {
  return Math.floor(rng() * max)
}

export function rnd_h(rng: RNG = random) {
  return rng() * 2 - 1
}

export function arr_random<A>(arr: Array<A>, rng: RNG = random) {
  return arr[int_random(arr.length, rng)]
}

export const v_random = (rng: RNG = random) => Vec2.make(rng(), rng())
export const v_random_h = (rng: RNG = random) => Vec2.make(rnd_h(rng), rnd_h(rng))


/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray<T>(array: T[]): T[] {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}