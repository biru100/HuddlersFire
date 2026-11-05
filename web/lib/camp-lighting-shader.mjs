export const LIGHT_VERTEX=`
precision highp float;
in vec2 aPosition;
in vec2 aUV;
uniform vec2 uViewport;
out vec2 vUV;
out vec2 vScreen;
void main(){vUV=aUV;vScreen=aPosition;gl_Position=vec4(aPosition/uViewport*vec2(2.0,-2.0)+vec2(-1.0,1.0),0.0,1.0);}
`;
export const LIGHT_FRAGMENT=`
precision highp float;
in vec2 vUV;
in vec2 vScreen;
uniform sampler2D uColorTexture;
uniform sampler2D uNormalTexture;
uniform float uAlpha;
uniform float uStrength;
uniform vec2 uMirror;
uniform vec3 uVisibility;
uniform vec4 uLight0;
uniform vec4 uLight1;
uniform vec4 uLight2;
uniform vec4 uLightColor0;
uniform vec4 uLightColor1;
uniform vec4 uLightColor2;
uniform vec4 uClip0;
uniform vec4 uClip1;
uniform vec4 uClip2;
uniform vec4 uClip3;
uniform vec4 uClipMeta0;
uniform vec4 uClipMeta1;
uniform vec4 uClipMeta2;
uniform vec4 uClipMeta3;
out vec4 finalColor;
float insideClip(vec4 r,vec4 meta){
  if(meta.w<0.5)return 1.0;
  vec2 p=vScreen-r.xy;float hit;
  if(meta.x>0.5){vec2 q=(p-r.zw*0.5)/max(r.zw*0.5,vec2(0.001));hit=1.0-smoothstep(0.96,1.02,dot(q,q));}
  else {float radius=min(meta.y,min(r.z,r.w)*0.5);vec2 q=abs(p-r.zw*0.5)-(r.zw*0.5-radius);float distance=length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0)-radius;hit=1.0-smoothstep(-0.35,0.35,distance);}
  return meta.z>0.5?1.0-hit:hit;
}
vec3 lightTerm(vec4 light,vec4 color,vec3 normal){
  if(color.a<0.001)return vec3(0.0);
  vec2 delta=light.xy-vScreen;float attenuation=max(0.0,1.0-length(delta)/max(1.0,light.w));
  vec3 direction=normalize(vec3(delta.x,-delta.y,max(10.0,light.z)));
  return color.rgb*color.a*attenuation*attenuation*(0.16+0.84*max(0.0,dot(normal,direction)));
}
void main(){
  vec4 base=texture(uColorTexture,vUV);if(base.a<0.001)discard;
  float coverage=insideClip(uClip0,uClipMeta0)*insideClip(uClip1,uClipMeta1)*insideClip(uClip2,uClipMeta2)*insideClip(uClip3,uClipMeta3);
  if(coverage<0.001)discard;
  if(uStrength<0.001){finalColor=base*uAlpha*coverage;return;}
  vec4 surface=texture(uNormalTexture,vUV);vec3 normal=surface.rgb*2.0-1.0;normal.xy*=uMirror;normal=normalize(normal);
  if(surface.a<0.001){finalColor=base*uAlpha*coverage;return;}
  float strength=uStrength*surface.a;
  float key=dot(normal,normalize(vec3(-0.4,0.55,0.8)));
  vec3 illumination=vec3(1.0+(key-0.75)*0.2*strength);
  illumination+=strength*0.85*(lightTerm(uLight0,uLightColor0,normal)*uVisibility.x+lightTerm(uLight1,uLightColor1,normal)*uVisibility.y+lightTerm(uLight2,uLightColor2,normal)*uVisibility.z);
  finalColor=vec4(base.rgb*illumination,base.a)*uAlpha*coverage;
}
`;
