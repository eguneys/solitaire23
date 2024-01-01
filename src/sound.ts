import { GeneralStore } from "./store"


function load_audio(path: string): HTMLMediaElement {
  let res = new Audio(path)
  return res
}

let names = [
  'Win',
  'auto_flip',
  'drag1', 'drag2', 'drag3',
  'cancel', 'drop', 'hit', 'recycle', 'undo2'
]


class Sound {

  audios!: Record<string, Array<HTMLMediaElement>>

  musics!: Record<string, HTMLMediaElement>

  load = async () => {


    this.audios = {}
    names.forEach(name => this.audios[name] = [...Array(4).keys()].map(() =>
      load_audio(`./audio/${name}.wav`))
    )

    this.musics = {}

    this.musics['main'] = load_audio('./music/SoundBox-music.wav')

  }

  play(name: string) {

    if (!GeneralStore.sound) {
      return;
    }

    let audios = this.audios[name]

    let audio = audios.pop()!
    audios.unshift(audio)

    audio.play()
  }

  stop_music() {

    this.musics['main'].pause()
  }

  music(name: string) {

    if (!GeneralStore.music) {
      return
    }

    let audio = this.musics[name]
    audio.loop = true
    audio.play()
  }

}


export default new Sound()
