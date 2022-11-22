import { Vec2 } from 'blah'
import { Batch } from 'blah'

export abstract class Component {

  visible: boolean = true
  active: boolean = true
  depth: number = 0

  entity!: Entity

  get<T extends Component>(ctor: { new(...args: any[]): T }): T | undefined {
    return this.entity.get(ctor)
  }

  render(batch: Batch) {}
}


export class Entity {

  visible: boolean = true
  active: boolean = true
 
  readonly components: Array<Component> = []

  constructor(readonly position: Vec2,
              readonly world: World) { }

  get<T extends Component>(ctor: { new(...args: any[]): T }): T | undefined {
    return this.components.find(_ => _.constructor.name === ctor.name) as T
  }


  add<T extends Component>(component: T) {
    return this.world.add(this, component)
  }
}

export class World {

  readonly entities: Array<Entity> = []
  readonly components: Map<string, Array<Component>> = new Map()

  first_entity(T: typeof Entity) {
    return this.entities.find(_ => _ instanceof T)
  }

  all_entities(T: typeof Entity) {
    return this.entities.filter(_ => _ instanceof T)
  }

  add_entity(position: Vec2) {
    let instance = new Entity(position, this)

    this.entities.push(instance)
    return instance
  }

  /* https://stackoverflow.com/questions/74303395/how-to-filter-an-array-based-on-type-parameters-typeof */
  all<T extends Component>(ctor: { new(...args: any[]): T }): Array<T>;
  all(ctor: typeof Component) {
    return this.components.get(ctor.name) ?? []
  }

  first<T extends Component>(ctor: { new(...args: any[]): T }): T | undefined {
    return this.all(ctor)[0]
  }
 

  add<T extends Component>(entity: Entity, component: T) {

    let _ = this.components.get(component.constructor.name)

    if (!_) {
      _ = []
      this.components.set(component.constructor.name, _)
    }

    _.push(component)

    component.entity = entity
    entity.components.push(component)

    return component
  }



  render(batch: Batch) {
    let visibles = [...this.components.values()]
    .flatMap(components => 
             components
             .filter(component =>
                     (component.visible && component.entity.visible)))

    visibles.sort((a, b) => b.depth - a.depth)

    visibles.forEach(_ => _.render(batch))
  }

}
