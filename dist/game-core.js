export const WIDTH = 1440, HEIGHT = 900, ROUND_SECONDS = 60;
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const bounds = {left:78, right:1362, top:113, bottom:817};
const HEN_RADIUS = 21, CONTACT_GAP = .001;

export class FarmGame {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.status = 'ready'; this.remaining = ROUND_SECONDS; this.elapsed = 0;
    this.players = [{id:0,name:'pearl',x:165,y:458,score:0,facing:1,walk:0,moving:false,peck:0}, {id:1,name:'rusty',x:1275,y:458,score:0,facing:-1,walk:0,moving:false,peck:0}];
    this.props = []; this.seeds = []; this.particles = []; this.winner = null;
    const types = ['crate','bale','pot','crate','pot','bale'];
    for (let row=0; row<3; row++) for (let col=0; col<4; col++) {
      // Randomised matched pairs give both players the same opportunities.
      if(col>1)continue;
      const x=330+col*265+(this.random()-.5)*70, y=240+row*215+(this.random()-.5)*48;
      const type=types[row*2+col];
      for(const px of [x,WIDTH-x]) this.props.push({id:this.props.length,x:px,y,type,r:type==='bale'?49:type==='crate'?43:32,moved:0});
    }
    let id=0;
    for(const prop of this.props) for(let j=0;j<7;j++) {
      const a=this.random()*Math.PI*2,r=Math.sqrt(this.random())*prop.r*.5;
      this.seeds.push({id:id++,x:prop.x+Math.cos(a)*r,y:prop.y+Math.sin(a)*r,angle:this.random()*Math.PI,taken:false});
    }
    for(let i=0;i<28;i++) {
      let x,y,valid=false;
      for(let attempt=0;attempt<100;attempt++) {
        x=125+this.random()*570;y=160+this.random()*610;
        valid=this.props.every(p=>Math.hypot(x-p.x,y-p.y)>p.r+28)&&this.players.every(p=>Math.hypot(x-p.x,y-p.y)>65);
        if(valid)break;
      }
      if(valid)for(const px of [x,WIDTH-x])this.seeds.push({id:id++,x:px,y,angle:this.random()*Math.PI,taken:false});
    }
    return this;
  }
  begin() {if(this.status==='ready'){this.status='playing';return true;}return false;}
  pause() {if(this.status!=='playing')return false;this.status='paused';return true;}
  resume() {if(this.status!=='paused')return false;this.status='playing';return true;}
  covered(seed) {return this.props.some(p=>Math.hypot(seed.x-p.x,seed.y-p.y)<p.r+4);}
  moveProp(prop, dx, dy, pusher=null) {
    if(Math.hypot(dx,dy)<1e-9)return false;
    // Plan the entire push before moving anything: a blocked chain must stay put.
    const moving=new Set([prop]),pending=[prop];
    while(pending.length){
      const item=pending.pop(),nx=item.x+dx,ny=item.y+dy;
      // Leave a chicken-width corridor around the fence.
      if(nx<bounds.left+item.r+35||nx>bounds.right-item.r-35||ny<bounds.top+item.r+35||ny>bounds.bottom-item.r-35)return false;
      if(this.players.some(p=>p!==pusher&&Math.hypot(nx-p.x,ny-p.y)<item.r+HEN_RADIUS+CONTACT_GAP))return false;
      for(const other of this.props){
        if(moving.has(other))continue;
        if(Math.hypot(nx-other.x,ny-other.y)<item.r+other.r+4){moving.add(other);pending.push(other);}
      }
    }
    for(const item of moving){item.x+=dx;item.y+=dy;item.moved+=Math.hypot(dx,dy);}
    return true;
  }
  separatePlayer(p) {
    // Recover any existing overlap by moving the hen out, never carrying the prop.
    for(let pass=0;pass<12;pass++){
      let changed=false;
      for(const prop of this.props){
        const dx=p.x-prop.x,dy=p.y-prop.y,d=Math.hypot(dx,dy),r=prop.r+HEN_RADIUS+CONTACT_GAP;
        if(d>=r)continue;
        const nx=d>1e-9?dx/d:(p.id===0?-1:1),ny=d>1e-9?dy/d:0;
        p.x=clamp(prop.x+nx*r,bounds.left+HEN_RADIUS,bounds.right-HEN_RADIUS);
        p.y=clamp(prop.y+ny*r,bounds.top+HEN_RADIUS,bounds.bottom-HEN_RADIUS);changed=true;
      }
      if(!changed)break;
    }
  }
  movePlayer(p, dx, dy) {
    const tryAxis=(axis,amount)=>{
      if(Math.abs(amount)<1e-9)return;
      const cross=axis==='x'?'y':'x',direction=Math.sign(amount);
      const low=(axis==='x'?bounds.left:bounds.top)+HEN_RADIUS;
      const high=(axis==='x'?bounds.right:bounds.bottom)-HEN_RADIUS;
      const requested=Math.abs(clamp(p[axis]+amount,low,high)-p[axis]);
      // Distance to first contact along this axis. Objects behind the hen cannot
      // be pushed or pulled, and touching an edge still allows movement away.
      const clearance=prop=>{
        const r=prop.r+HEN_RADIUS+CONTACT_GAP,offset=p[cross]-prop[cross];
        const ahead=(prop[axis]-p[axis])*direction;
        if(ahead<=0||Math.abs(offset)>=r)return Infinity;
        return Math.max(0,ahead-Math.sqrt(r*r-offset*offset));
      };
      const contacts=this.props.map(prop=>({prop,gap:clearance(prop)})).filter(c=>c.gap<requested).sort((a,b)=>a.gap-b.gap);
      for(const {prop} of contacts){
        if(clearance(prop)>=requested)continue;
        const push=direction*requested*.72;
        this.moveProp(prop,axis==='x'?push:0,axis==='y'?push:0,p);
      }
      // Stop at the nearest surface after the push, including when it failed.
      const travel=this.props.reduce((limit,prop)=>Math.min(limit,clearance(prop)),requested);
      p[axis]+=direction*travel;
    };
    tryAxis('x',dx);tryAxis('y',dy);
  }
  step(dt, inputs=[{x:0,y:0},{x:0,y:0}]) {
    if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return [];
    dt=Math.min(dt,this.remaining);let pending=dt;const events=[];
    while(pending>1e-8){const slice=Math.min(pending,1/120);this.physics(slice,inputs,events);pending-=slice;}
    this.elapsed+=dt;this.remaining=Math.max(0,ROUND_SECONDS-this.elapsed);
    if(this.remaining<1e-7){this.remaining=0;this.status='ended';const [a,b]=this.players;this.winner=a.score===b.score?'draw':a.score>b.score?0:1;events.push({type:'end',winner:this.winner});}
    return events;
  }
  physics(dt,inputs,events) {
    for(const p of this.players)this.separatePlayer(p);
    for(const p of this.players){const input=inputs[p.id]||{x:0,y:0};const length=Math.hypot(input.x,input.y);p.moving=length>0;p.peck=Math.max(0,p.peck-dt);
      if(length>0){const dx=input.x/length*335*dt,dy=input.y/length*335*dt;if(Math.abs(dx)>.05)p.facing=dx>0?1:-1;this.movePlayer(p,dx,dy);p.walk+=dt*16;}
    }
    // Evaluate both chickens before awarding: the closer beak wins a contested seed.
    for(const seed of this.seeds){if(seed.taken||this.covered(seed))continue;
      const candidates=this.players.map(p=>({p,d:distance(p,seed)})).filter(c=>c.d<34);
      if(!candidates.length)continue;
      candidates.sort((a,b)=>Math.abs(a.d-b.d)<.001?((seed.id%2===a.p.id)?-1:1):a.d-b.d);
      const p=candidates[0].p;seed.taken=true;p.score++;p.peck=.24;
      this.particles.push({x:seed.x,y:seed.y,life:.65,player:p.id});events.push({type:'collect',player:p.id,x:seed.x,y:seed.y});
    }
    this.particles.forEach(p=>p.life-=dt);this.particles=this.particles.filter(p=>p.life>0);
  }
  snapshot(){return {status:this.status,secondsRemaining:Math.ceil(this.remaining),players:this.players.map(({id,name,score})=>({id:id+1,name,score})),seedsRemaining:this.seeds.filter(s=>!s.taken).length,winner:this.winner==='draw'?'draw':this.winner===null?null:this.players[this.winner].name};}
}
