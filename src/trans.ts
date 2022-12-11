import en from '../content/trans/en.trans?raw'
import tr from '../content/trans/tr.trans?raw'
import fr from '../content/trans/fr.trans?raw'

import en2 from '../content/trans2/en.trans2?raw'
import tr2 from '../content/trans2/tr.trans2?raw'

let _trans2 = {
  en: en2,
  tr: tr2
}

let _trans = {
  en,
  tr,
  fr
}

export type Language = keyof typeof _trans
export type TransMap = { [_: string]: string }

export const languages: Array<Language> = Object.keys(_trans) as Array<Language>

export const trans2_languages: Array<Language> = Object.keys(_trans2) as Array<Language>

let trans_map: Record<Language, TransMap> = {} as Record<Language, TransMap>
let trans2_map = {} as any

languages.forEach((lang: Language) => trans_map[lang] = load_trans(_trans[lang]))
trans2_languages.forEach((lang: Language) => 
                         trans2_map[lang] = load_trans2((_trans2 as any)[lang]))


function load_trans(str: string) {

  let res: TransMap = {}
  str.trim().split('\n').map(_ => {
    let [key, value] = _.split('=')
    res[key] = value
  })
  return res
}


function load_trans2(str: string) {

  let res: { [_: string]: string } = {}
  let cur_title: string | undefined,
  cur_content = ''
  str.split('\n').forEach(_ => {
    let title = _.match(/^# (.*)/)
    if (title) {
      if (cur_title) {
        res[cur_title] = cur_content
        cur_content = ''
      }
      cur_title = title[1]
    } else {
      cur_content += _ + '\n'
    }
  })
  res[cur_title!] = cur_content
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


  get default_trans2_map() {
    return trans2_map[Trans.default_language]
  }

  get trans2_map() {
    return trans2_map[this.language]
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

  key2(key: string) {
    return this.trans2_map?.[key] || this.default_trans2_map[key]
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
