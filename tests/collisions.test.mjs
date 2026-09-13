import test from 'node:test';
import assert from 'node:assert/strict';
import { FarmGame } from '../dist/game-core.js';

const idle = {x:0,y:0};
const box = (id,x,y,r=43) => ({id,x,y,r,type:'crate',moved:0});
const position = item => ({x:item.x,y:item.y});
function scene() {
  const game=new FarmGame();game.begin();game.props=[];game.seeds=[];
  game.players[0].x=500;game.players[0].y=400;
  game.players[1].x=1100;game.players[1].y=700;
  return game;
}
function separated(game) {
  for(const p of game.players)for(const prop of game.props)
    assert.ok(Math.hypot(p.x-prop.x,p.y-prop.y)>=prop.r+21-1e-5,'a hen must remain outside each prop');
}

test('an overlapped chicken can retreat without dragging the crate',()=>{
  const g=scene(),p=g.players[0],prop=box(0,535,400);g.props=[prop];
  const before=position(prop);g.step(.3,[{x:-1,y:0},idle]);
  assert.deepEqual(position(prop),before);assert.ok(p.x<450);separated(g);
});

test('a stationary overlapping chicken is separated without moving the box',()=>{
  const g=scene(),prop=box(0,535,400);g.props=[prop];const before=position(prop);
  g.step(1/60,[idle,idle]);assert.deepEqual(position(prop),before);separated(g);
});

test('pushing forward, reversing and turning never attaches a box',()=>{
  const g=scene(),p=g.players[0],prop=box(0,565,400);g.props=[prop];
  g.step(.6,[{x:1,y:0},idle]);assert.ok(prop.x>650);separated(g);
  const before=position(prop);g.step(.3,[{x:-1,y:0},idle]);g.step(.3,[{x:0,y:-1},idle]);
  assert.deepEqual(position(prop),before);assert.ok(p.y<350);separated(g);
});

test('a box cannot be pushed into the other hen',()=>{
  const g=scene();g.props=[box(0,565,400)];g.players[1].x=750;g.players[1].y=400;
  g.step(1,[{x:1,y:0},idle]);separated(g);
  const before=position(g.props[0]);g.step(.25,[idle,{x:1,y:0}]);
  assert.deepEqual(position(g.props[0]),before);separated(g);
});

test('failed pushes leave the entire connected group unchanged',()=>{
  const g=scene();g.players[0].x=900;g.players[0].y=700;
  const a=box(0,1188,400,49),b=box(1,1270,342,32),c=box(2,1270,458);
  g.props=[a,b,c];const before=g.props.map(position);
  assert.equal(g.moveProp(a,20,0),false);assert.deepEqual(g.props.map(position),before);
});

test('adjacent crates can be pushed together when the way is clear',()=>{
  const g=scene();g.props=[box(0,565,400),box(1,655,400)];
  g.step(.7,[{x:1,y:0},idle]);assert.ok(g.props[0].x>680);assert.ok(g.props[1].x>770);separated(g);
  assert.ok(Math.hypot(g.props[0].x-g.props[1].x,g.props[0].y-g.props[1].y)>=90-1e-5);
});

test('a crate against the fence blocks pushing but allows retreat',()=>{
  const g=scene(),p=g.players[0],prop=box(0,1284,400);g.props=[prop];p.x=1219;
  g.step(.4,[{x:1,y:0},idle]);assert.equal(prop.x,1284);separated(g);
  g.step(.3,[{x:-1,y:0},idle]);assert.ok(p.x<1150);assert.equal(prop.x,1284);
});

test('both hens pushing the same crate stay outside it',()=>{
  const g=scene();g.props=[box(0,720,400)];g.players[0].x=655;g.players[1].x=785;g.players[1].y=400;
  g.step(1,[{x:1,y:0},{x:-1,y:0}]);separated(g);
  const before=position(g.props[0]);g.step(.4,[{x:-1,y:0},{x:1,y:0}]);
  assert.deepEqual(position(g.props[0]),before);separated(g);
});

test('pushing still uncovers collectable seeds',()=>{
  const g=scene();g.props=[box(0,565,400)];g.seeds=[{id:0,x:565,y:400,taken:false}];
  g.step(1/60,[idle,idle]);assert.equal(g.players[0].score,0);
  g.step(.8,[{x:1,y:0},idle]);assert.equal(g.players[0].score,1);assert.equal(g.seeds[0].x,565);
});

test('diagonal contact allows an immediate diagonal retreat',()=>{
  const g=scene(),prop=box(0,555,455);g.props=[prop];
  g.step(.5,[{x:1,y:1},idle]);assert.ok(prop.x>555&&prop.y>455);separated(g);
  const before=position(prop);g.step(.5,[{x:-1,y:-1},idle]);
  assert.deepEqual(position(prop),before);separated(g);
});
