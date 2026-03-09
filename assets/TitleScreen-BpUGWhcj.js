var r=Object.defineProperty;var l=(n,t,e)=>t in n?r(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var a=(n,t,e)=>l(n,typeof t!="symbol"?t+"":t,e);import{S as h,R as _}from"./Renderer-CyVaV2dg.js";const u=`
 _____ _   _ _____
|_   _| | | | ____|
  | | | |_| |  _|
  | | |  _  | |___
  |_| |_| |_|_____|

  ___  ____  _____ ____   ___  _   _
 / _ \\|  _ \\| ____/ ___| / _ \\| \\ | |
| | | | |_) |  _|| |  _ | | | |  \\| |
| |_| |  _ <| |__| |_| || |_| | |\\  |
 \\___/|_| \\_\\_____\\____|  \\___/|_| \\_|

 _____  ____      _    ___ _
|_   _||  _ \\    / \\  |_ _| |
  | |  | |_) |  / _ \\  | || |
  | |  |  _ <  / ___ \\ | || |___
  |_|  |_| \\_\\/_/   \\_\\___|_____|`;class c extends h{constructor(){super(...arguments);a(this,"cleanup",null)}enter(){const e=this.createScreen();e.style.justifyContent="center",e.style.alignItems="center",e.style.textAlign="center",_.pre(e,u,"title");const i=document.createElement("p");i.className="dim",i.style.marginTop="12px",i.style.fontSize="9px",i.textContent="© 1971 Minnesota Educational Computing Consortium",e.appendChild(i),_.divider(e),_.spacer(e);const o=this.engine.hasSave()?["Travel the trail","Continue saved journey","About the trail"]:["Travel the trail","About the trail"];this.cleanup=_.menu(e,o,s=>{this.engine.hasSave()?s===0?(this.engine.newGame(),this.engine.transition("profession")):s===1?this.engine.transition(this.engine.state.phase==="title"?"traveling":this.engine.state.phase):this.showAbout(e):s===0?(this.engine.newGame(),this.engine.transition("profession")):this.showAbout(e)})}showAbout(e){e.innerHTML="",_.text(e,"ABOUT THE OREGON TRAIL","bright"),_.divider(e),_.text(e,"The year is 1848. You and your family are leaving your home in Independence, Missouri to travel the Oregon Trail to the Willamette Valley."),_.text(e,"The trail is nearly 2,000 miles long. You will face rivers, mountains, illness, and harsh weather on this 5-month journey."),_.text(e,"Your choices determine whether your family survives to reach Oregon."),_.spacer(e),_.text(e,"Use arrow keys or number keys to navigate menus.","dim"),_.text(e,"Press ENTER to confirm selections.","dim"),_.spacer(e);const i=_.anyKey(e,"Press any key to return",()=>{this.exit(),this.enter()});this.cleanup=i}update(e){}exit(){this.cleanup&&(this.cleanup(),this.cleanup=null)}}export{c as TitleScreen};
