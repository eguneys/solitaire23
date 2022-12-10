import en from '../content/trans/en.trans?raw'
import tr from '../content/trans/tr.trans?raw'
import fr from '../content/trans/fr.trans?raw'

let _trans = {
  en,
  tr,
  fr
}

export type Language = keyof typeof _trans
export type TransMap = { [_: string]: string }

export const languages: Array<Language> = Object.keys(_trans) as Array<Language>

let trans_map: Record<Language, TransMap> = {} as Record<Language, TransMap>

languages.forEach((lang: Language) => trans_map[lang] = load_trans(_trans[lang]))

function load_trans(str: string) {

  let res: TransMap = {}
  str.trim().split('\n').map(_ => {
    let [key, value] = _.split('=')
    res[key] = value
  })
  return res
}


class Trans {
  static default_language: Language = 'en'

  get default_language() {
    return Trans.default_language
  }

  _language: Language = Trans.default_language

  get language() {
    return this._language
  }

  set language(_: Language) {
    this._language = _

    this.hooks.forEach(_ => _())
  }

  get default_trans_map() {
    return trans_map[Trans.default_language]
  }

  get trans_map() {
    return trans_map[this.language]
  }

  lang_key(key: Language) {
    return trans_map[key][key]
  }

  key(key: string, lang?: Language) {
    if (lang) {
      return trans_map[lang][key] || this.default_trans_map[key]
    }
    return this.trans_map[key] || this.default_trans_map[key]
  }

  hooks: Array<() => void> = []

  register(f: () => void) {
    this.hooks.push(f)
    return () => {
      this.hooks.splice(this.hooks.indexOf(f), 1)
    }
  }
}

export default new Trans()
