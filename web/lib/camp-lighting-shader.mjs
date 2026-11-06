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
uniform float uNight;
uniform vec3 uAmbient;
uniform vec3 uAmbientLift;
uniform float uPointGain;
uniform vec3 uCamera;
uniform vec4 uReceiver;
uniform vec4 uWorldLight0;
uniform vec4 uWorldLight1;
uniform vec4 uWorldLight2;
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
  if(meta.x>1.5){vec2 d=p-r.zw*0.5;vec2 ground=vec2(d.x*0.5+d.y,-d.x*0.5+d.y);vec2 q=abs(ground)-(vec2(r.w*0.5)-meta.y);float distance=length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0)-meta.y;hit=1.0-smoothstep(-0.35,0.35,distance);}
  else if(meta.x>0.5){vec2 q=(p-r.zw*0.5)/max(r.zw*0.5,vec2(0.001));hit=1.0-smoothstep(0.96,1.02,dot(q,q));}
  else {float radius=min(meta.y,min(r.z,r.w)*0.5);vec2 q=abs(p-r.zw*0.5)-(r.zw*0.5-radius);float distance=length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0)-radius;hit=1.0-smoothstep(-0.35,0.35,distance);}
  return meta.z>0.5?1.0-hit:hit;
}
vec3 lightTerm(vec4 light,vec4 color,vec3 normal){
  if(color.a<0.001)return vec3(0.0);
  vec2 delta=light.xy-vScreen;float attenuation=max(0.0,1.0-length(delta)/max(1.0,light.w));
  vec3 direction=normalize(vec3(delta.x,-delta.y,max(10.0,light.z)));
  return color.rgb*color.a*attenuation*attenuation*(0.16+0.84*max(0.0,dot(normal,direction)));
}
vec3 nightTerm(vec4 light,vec4 color,vec3 point,vec3 normal){
  if(color.a<0.001)return vec3(0.0);
  vec3 delta=light.xyz-point;
  float attenuation=max(0.0,1.0-length(vec3(delta.xy,delta.z*0.7))/max(0.01,light.w));
  vec3 direction=vec3((delta.x-delta.y)*40.0,-(delta.x+delta.y)*20.0+delta.z*40.0,(delta.x+delta.y)*20.0+delta.z*24.0);
  direction/=max(0.001,length(direction));
  return color.rgb*color.a*attenuation*attenuation*(0.18+0.82*max(0.0,dot(normal,direction)));
}
void main(){
  vec4 base=texture(uColorTexture,vUV);if(base.a<0.001)discard;
  float coverage=insideClip(uClip0,uClipMeta0)*insideClip(uClip1,uClipMeta1)*insideClip(uClip2,uClipMeta2)*insideClip(uClip3,uClipMeta3);
  if(coverage<0.001)discard;
  if(uNight>0.5){
    vec2 projected=(vScreen-uCamera.xy)/max(0.001,uCamera.z);
    vec3 point=vec3(projected.x/80.0+projected.y/40.0,projected.y/40.0-projected.x/80.0,0.0);
    vec3 flatNormal=normalize(vec3(0.0,0.6,0.8));
    if(uReceiver.w>0.5){float across=(projected.x-(uReceiver.x-uReceiver.y)*40.0)/80.0;point=vec3(uReceiver.x+across,uReceiver.y-across,max(uReceiver.z,((uReceiver.x+uReceiver.y)*20.0-projected.y)/40.0));flatNormal=vec3(0.0,0.0,1.0);}
    vec4 surface=texture(uNormalTexture,vUV);vec3 detail=surface.rgb*2.0-1.0;detail.xy*=uMirror;
    vec3 normal=normalize(mix(flatNormal,detail,min(1.0,uStrength*2.0)*surface.a));
    vec3 illumination=uAmbient+uAmbientLift+uPointGain*(nightTerm(uWorldLight0,uLightColor0,point,normal)*uVisibility.x+nightTerm(uWorldLight1,uLightColor1,point,normal)*uVisibility.y+nightTerm(uWorldLight2,uLightColor2,point,normal)*uVisibility.z);
    finalColor=vec4(base.rgb*min(illumination,vec3(1.1)),base.a)*uAlpha*coverage;return;
  }
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
