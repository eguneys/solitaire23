import { App, Target, Vec2, Mat4x4, Mat3x2, Rect } from 'blah'
import { Shader, Mesh, Material } from 'blah'
import { VertexFormat, VertexType, VertexAttribute } from 'blah'
import { TextureSampler, DrawCall, Texture } from 'blah'
import vertex_shader from './palette.vert'
import fragment_shader from './palette.frag'

let shader: Shader

const format = new VertexFormat([
  VertexAttribute.make(0, VertexType.Float2, false),
  VertexAttribute.make(1, VertexType.Float2, false)
])


const texture_uniform = 'u_texture'
const matrix_uniform = 'u_matrix'

let rect = Rect.make(0, 0, 1, 1)
const px0 = rect.x
const py0 = rect.y
const px1 = rect.x + rect.w
const py1 = rect.y
const px2 = rect.x + rect.w
const py2 = rect.x + rect.h
const px3 = rect.x
const py3 = rect.x + rect.h
const [tx0, ty0, tx1, ty1, tx2, ty2, tx3, ty3] = [0, 0, 1, 0, 1, 1, 0, 1]


export class Pallette {

  texture!: Texture

  mesh!: Mesh
  material!: Material
  indices = [0, 1, 2, 0, 2, 3]
  vertices: Array<Vertex> = []
  matrix!: Mat3x2
  sampler = TextureSampler.get_default

  set_matrix(matrix: Mat3x2) {

    this.matrix = matrix
    this.vertices = []

    this.PUSH_VERTEX(px0, py0, tx0, ty0)
    this.PUSH_VERTEX(px1, py1, tx1, ty1)
    this.PUSH_VERTEX(px2, py2, tx2, ty2)
    this.PUSH_VERTEX(px3, py3, tx3, ty3)
  }

  PUSH_VERTEX(px: number, py: number, tx: number, ty: number) {
    let mat = this.matrix
    this.vertices.push(
      new Vertex(
        Vec2.make(px * mat.m11 + py * mat.m21 + mat.m31,
                  px * mat.m12 + py * mat.m22 + mat.m32),
                  Vec2.make(tx, 1- ty))
    )
  }


  render(target: Target = App.backbuffer) {
    this.render_with_m(target, Mat4x4.create_ortho_offcenter(0, target.width, target.height, 0, 0.01, 1000))
  }


  render_with_m(target: Target, matrix: Mat4x4) {

    if (!shader) {
      shader = Shader.create([vertex_shader, 
                             fragment_shader])
    }

    if (!this.mesh) {
      this.mesh = Mesh.create()
    }

    if (!this.material) {
      this.material = Material.create(shader)
    }

    let vertex_size = format.stride
    let data = new ArrayBuffer(vertex_size * this.vertices.length)
    let view = new DataView(data)
    this.vertices.reduce((offset, _) => _.push_to(view, offset), 0)


    this.mesh.index_data(this.indices)
    this.mesh.vertex_data(format, data)

    let pass = new DrawCall()
    pass.target = target
    pass.mesh = this.mesh
    pass.has_viewport = false
    pass.viewport = Rect.make(0, 0, 0, 0)
    pass.instance_count = 0

    pass.material = this.material
    pass.material.set_texture(texture_uniform, this.texture)
    pass.material.set_sampler_at_location(0, this.sampler)

    pass.material.set_matrix(matrix_uniform, matrix)

    pass.index_start = 0
    pass.index_count = this.indices.length

    pass.perform()
  }

}


class Vertex {
  push_to(data: DataView, offset: number) {

    let { pos, tex } = this

    data.setFloat32(offset + 0, pos.x, true)
    data.setFloat32(offset + 4, pos.y, true)
    data.setFloat32(offset + 8, tex.x, true)
    data.setFloat32(offset + 12, tex.y, true)

    return offset + 16
  }

  constructor(
    readonly pos: Vec2,
    readonly tex: Vec2) {
  }
}

export const pallette = new Pallette()
