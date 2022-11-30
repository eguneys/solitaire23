#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform sampler2D u_mask_texture;
in vec2 v_tex;
in vec4 v_col;
in vec4 v_type;
out vec4 o_color;

vec4 red = vec4(1, 0, 0, 1);
vec4 green = vec4(0, 1, 0, 1);
void main(void) {
  vec4 color = texture(u_mask_texture, v_tex);

  vec4 t0 = texture(u_texture, v_tex);
  vec4 t1 = texture(u_texture2, v_tex);

  o_color = color == red ? t0 : color == green ? t1 : color;
}
