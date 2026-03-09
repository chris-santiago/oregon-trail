var d=Object.defineProperty;var u=(o,s,e)=>s in o?d(o,s,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[s]=e;var c=(o,s,e)=>u(o,typeof s!="symbol"?s+"":s,e);import{S as _,R as t}from"./Renderer-CyVaV2dg.js";import{S as h}from"./index-BNHcBluP.js";const p=`
      _________
     |         |
     |  R.I.P. |
     |         |
     |         |
     |         |
   __|_________|__
  /               \\`;class g extends _{constructor(){super(...arguments);c(this,"cleanup",null)}enter(){const e=this.createScreen(),i=this.state.party[0],r=(i==null?void 0:i.name)??"The Traveler",a=this.engine.context.deathCause??"Your party has perished on the trail.";t.pre(e,p,"dim"),t.spacer(e),t.text(e,a,"bright"),t.spacer(e);const n=this.state.party.filter(l=>!l.alive);n.length>0&&(t.text(e,"The following did not survive:","dim"),n.forEach(l=>t.text(e,`  ${l.name}`,"dim"))),t.spacer(e),t.text(e,`You made it ${this.state.currentMile} miles on the Oregon Trail.`),t.spacer(e),t.text(e,"Enter an epitaph for the tombstone:"),t.text(e,"(Leave blank for a default message)","dim"),t.spacer(e),this.cleanup=t.input(e,'e.g. "Gone too soon"',l=>{const m=l||`Died ${this.state.currentMile} miles from home.`;this.saveTombstone(r,m),h.deleteSave(),this.showFinal(e,r,m)},40)}saveTombstone(e,i){const r={mile:this.state.currentMile,leaderName:e,epitaph:i,date:this.state.date},a=h.loadTombstones();a.push(r);const n=a.slice(-20);h.saveTombstones(n),this.state.tombstones=n}showFinal(e,i,r){var n;(n=this.cleanup)==null||n.call(this),e.innerHTML="",t.pre(e,p,"dim"),t.spacer(e);const a=document.createElement("pre");a.className="tombstone",a.textContent=`Here lies ${i}.

"${r}"`,e.appendChild(a),t.spacer(e),t.text(e,"Your tombstone will mark the trail for future travelers.","dim"),t.spacer(e),this.cleanup=t.anyKey(e,"Press any key to start over",()=>{this.engine.newGame(),this.engine.transition("title")})}update(e){}exit(){this.cleanup&&(this.cleanup(),this.cleanup=null),this.engine.context={}}}export{g as DeathScreen};
