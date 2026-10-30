
import{t as M,a as N,b as q,c as S,d as D,p as F}from"./index.ts-BvtW_Xxd.js";import{t as c}from"./i18n-TjKCKu9J.js";

import"./onboardingKeys-BJre6MTj.js";import"./fetchLatestVideos-CffmCuuR.js";import"./quotaUsageMirrors-CenXWOpi.js";const g="yfp-comments",z=30,U='<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" focusable="false" aria-hidden="true"><path d="m7.748.854.779.13a3 3 0 012.44 3.588L10.5 6.75h3.046a2.748 2.748 0 012.204 4.387l.015.066A2.862 2.862 0 0115 13.874v.033c0 .227-.037.452-.109.668l-.08.21a2.815 2.815 0 01-2.59 1.715H9.516l-.294-.005a9.002 9.002 0 01-3.918-1.041l-.256-.142-.204-.116a1.502 1.502 0 00-.55-.186L4.102 15H2.625l-.116-.006a1.126 1.126 0 01-1.003-1.005l-.006-.114v-4.5c0-.62.504-1.124 1.125-1.124h1.342a.75.75 0 00.66-.395l.048-.107 2.24-6.403a.75.75 0 01.833-.491ZM6.09 8.243A2.25 2.25 0 013.967 9.75H3v3.749h1.1a3 3 0 011.49.395l.202.116a7.503 7.503 0 003.724.99h2.703c.566 0 1.07-.363 1.248-.9a.61.61 0 00.032-.193v-.655l.44-.439a1.36 1.36 0 00.363-1.272l-.014-.065-.157-.675.413-.556a1.248 1.248 0 00-.999-1.995H10.5a1.501 1.501 0 01-1.467-1.815L9.5 4.257a1.5 1.5 0 00-1.22-1.794l-.157-.026L6.09 8.243Z"/></svg>',P="yfp-comments-parent-pinned";let n=null,$=!1,H=!1,l=null;function s(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function T(){return N()}function O(){return document.querySelector("#yfpModalFilterResults .yfp-mfr-panel")}function V(t){const e=t.getBoundingClientRect();return{width:e.width,height:e.height,top:e.top,bottom:e.bottom,left:e.left,right:e.right}}function j(t){return t.closest(".yfp-data__label.yfp-tooltip-host")||t.closest(".yfp-tooltip-host")}function W(t){t?.classList.add(P)}function I(t){t?.classList.remove(P)}function C(){const t=n?.tip;if(t?.state.isVisible)try{t.popperInstance?.update()}catch{}}function _(){requestAnimationFrame(()=>{C(),requestAnimationFrame(()=>C())})}function B(){if(H)return;H=!0;const t=document.createElement("style");t.setAttribute("data-yfp-comments-tippy","1"),t.textContent=`
.tippy-box[data-theme~='${g}'] {
  background: #212121;
  color: #f1f1f1;
  border-radius: 10px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 12px 36px rgba(0, 0, 0, 0.55);
  font-family: "Roboto", "YouTube Sans", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.45;
  max-width: 380px;
}
.tippy-box[data-theme~='${g}'] > .tippy-content {
  padding: 0;
}
.tippy-box[data-theme~='${g}'] > .tippy-arrow::before {
  color: #212121;
}
.yfp-comments-tip {
  display: flex;
  flex-direction: column;
  width: 360px;
  max-width: min(360px, 92vw);
  max-height: 440px;
}
.yfp-comments-tip__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex: 0 0 auto;
}
.yfp-comments-tip__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.yfp-comments-tip__close {
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}
.yfp-comments-tip__close:hover {
  color: #fff;
}
/* AI sentiment panel (disabled for now)
.yfp-comments-tip__columns { display: flex; flex-direction: row; align-items: stretch; flex: 1 1 auto; min-height: 0; overflow: hidden; }
.yfp-comments-tip__left { flex: 1 1 52%; min-width: 0; display: flex; flex-direction: column; border-right: 1px solid rgba(255, 255, 255, 0.08); }
.yfp-comments-tip__ai { flex: 1 1 48%; min-width: 0; display: flex; flex-direction: column; padding: 8px 12px 10px; gap: 6px; }
.yfp-comments-tip__ai-title { margin: 0; font-size: 12px; font-weight: 600; color: #fff; flex: 0 0 auto; }
.yfp-comments-tip__ai-body { margin: 0; flex: 1 1 auto; min-height: 0; overflow: auto; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, "Cascadia Code", "Segoe UI Mono", Consolas, monospace; font-size: 12px; line-height: 1.45; color: #e0e0e0; background: rgba(0, 0, 0, 0.22); border-radius: 8px; padding: 10px; }
.yfp-comments-tip__ai-body--muted { color: #aaa; font-family: inherit; }
.yfp-comments-tip__ai-body--error { color: #f28b82; font-family: inherit; }
*/
.yfp-comments-tip__list {
  overflow: auto;
  flex: 1 1 auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 80px;
}
.yfp-comments-tip__item {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: flex-start;
}
.yfp-comments-tip__avatar {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
}
.yfp-comments-tip__avatar--placeholder {
  display: block;
}
.yfp-comments-tip__body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.yfp-comments-tip__meta {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: #aaa;
}
.yfp-comments-tip__meta-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 6px 10px;
  overflow: hidden;
}
.yfp-comments-tip__author {
  flex: 0 1 120px;
  width: 120px;
  max-width: 120px;
  color: #fff;
  font-weight: 550;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yfp-comments-tip__date {
  flex: 0 0 auto;
  color: #aaa;
  white-space: nowrap;
}
.yfp-comments-tip__date-exact {
  flex: 0 0 auto;
  color: #777;
  font-size: 11px;
  font-weight: 400;
  white-space: nowrap;
}
.yfp-comments-tip__likes {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #aaa;
  white-space: nowrap;
  line-height: 1.4;
}
.yfp-comments-tip__like-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  flex: 0 0 auto;
  color: inherit;
}
.yfp-comments-tip__like-icon svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: currentColor;
  pointer-events: none;
}
.yfp-comments-tip__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e8e8e8;
  font-size: 13px;
}
.yfp-comments-tip__status {
  margin: 16px 0;
  text-align: center;
  color: #aaa;
  font-size: 13px;
}
.yfp-comments-tip__status--error {
  color: #f28b82;
}
.yfp-comments-tip__footer {
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex: 0 0 auto;
}
.yfp-comments-tip__load-more {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border-radius: 18px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.yfp-comments-tip__load-more:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}
.yfp-comments-tip__load-more:disabled {
  opacity: 0.55;
  cursor: default;
}
.tippy-box[data-theme~='yfp-comments-pro'] {
  background: #212121;
  color: #f1f1f1;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.45);
}
.tippy-box[data-theme~='yfp-comments-pro'] > .tippy-content {
  padding: 8px 10px;
}
.tippy-box[data-theme~='yfp-comments-pro'] > .tippy-arrow::before {
  color: #212121;
}
`,document.documentElement.appendChild(t)}function J(){if($)return;

$=!0;const t=()=>y();document.addEventListener("yt-navigate-start",t),window.addEventListener("yt-navigate-start",t),document.addEventListener("keydown",e=>{e.key==="Escape"&&y()})}function Z(t){const e=Math.max(0,Math.floor(t)),o=e.toLocaleString("en-US");return e===1?`${o} comment`:`${o} comments`}function G(t){const e=t%100;if(e>=11&&e<=13)return`${t}th`;switch(t%10){case 1:return`${t}st`;case 2:return`${t}nd`;case 3:return`${t}rd`;default:return`${t}th`}}function Q(t){const e=F(t);if(e==null)return null;const o=new Date(Date.now()-e);return Number.isFinite(o.getTime())?`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][o.getMonth()]} ${G(o.getDate())}, ${o.getFullYear()}`:null}function Y(t){const e=Number.isFinite(t.likes)?Math.max(0,Math.floor(t.likes)):0,o=D(e),p=`<span class="yfp-comments-tip__likes"${e>=1e3?` title="${s(e.toLocaleString("en-US"))}"`:""}><span class="yfp-comments-tip__like-icon" aria-hidden="true">${U}</span><span>${s(o)}</span></span>`,r=t.avatarUrl?`<img class="yfp-comments-tip__avatar" src="${s(t.avatarUrl)}" alt="" width="32" height="32" loading="lazy" referrerpolicy="no-referrer" />`:'<span class="yfp-comments-tip__avatar yfp-comments-tip__avatar--placeholder" aria-hidden="true"></span>',f=t.date?Q(t.date):null,u=t.date?`<span class="yfp-comments-tip__date">${s(t.date)}</span>`+(f?`<small class="yfp-comments-tip__date-exact">${s(f)}</small>`:""):"";return'<article class="yfp-comments-tip__item">'+r+`<div class="yfp-comments-tip__body"><div class="yfp-comments-tip__meta"><div class="yfp-comments-tip__meta-main"><span class="yfp-comments-tip__author">${s(t.username||"—")}</span>`+u+"</div>"+p+`</div><p class="yfp-comments-tip__text">${s(t.text||"")}</p></div></article>`}function K(t){const e=s(c("close")||"Close");return`<div class="yfp-comments-tip"><header class="yfp-comments-tip__header"><h2 class="yfp-comments-tip__title">${s(t)}</h2><button type="button" class="yfp-comments-tip__close" aria-label="${e}">×</button></header><div class="yfp-comments-tip__list"></div><div class="yfp-comments-tip__footer" hidden></div></div>`}function b(t,e){const o=t.querySelector(".yfp-comments-tip__list");o&&(o.innerHTML=e)}function R(t,e){if(!e.length){b(t,`<p class="yfp-comments-tip__status">${s(c("yfpCommentsEmpty")||"No comments")}</p>`);return}b(t,e.map(Y).join(""))}function d(t,e,o){const i=t.querySelector(".yfp-comments-tip__footer");if(!i)return;if(!e){i.hidden=!0,i.innerHTML="";return}i.hidden=!1;const p=o?c("yfpCommentsLoading")||"Loading…":c("yfpCommentsLoadMore")||"Load more";i.innerHTML=`<button type="button" class="yfp-comments-tip__load-more"${o?" disabled":""}>`+s(p)+"</button>"}function w(){if(l){try{l.hide(),l.destroy()}catch{}l=null}}function X(t,e){w();const o=O()||document.body;l=M(t,{content:s(e),allowHTML:!0,trigger:"manual",placement:"top",theme:"yfp-comments-pro",appendTo:()=>o,interactive:!1,hideOnClick:!0,zIndex:2147483647,onHidden(i){l===i&&(l=null);try{i.destroy()}catch{}}}),l.show(),window.setTimeout(()=>w(),2800)}async function E(t){q(),X(t,c("commentsReadProOnly")||"View comments is Pro only.")}function A(t,e){const o=t.querySelector(".yfp-comments-tip__title");o&&(o.textContent=Z(e))}async function tt(t,e){if(!n||n.videoId!==t)return;n.loading=!0,b(e,`<p class="yfp-comments-tip__status">${s(c("yfpCommentsLoading")||"Loading…")}</p>`),d(e,null,!0);const o=await S(t,{sort:"top",max:z});if(!(!n||n.videoId!==t)){if(n.loading=!1,!o){b(e,`<p class="yfp-comments-tip__status yfp-comments-tip__status--error">${s(c("yfpCommentsError")||"Couldn’t load comments")}</p>`),d(e,null,!1),_();return}n.comments=o.comments,n.continuation=o.continuation,A(e,n.comments.length),R(e,n.comments),d(e,n.continuation,!1),_()}}async function et(t){if(!n||n.loading||!n.continuation)return;

const{videoId:e,continuation:o}=n;n.loading=!0,d(t,o,!0);const i=await S(e,{sort:"top",max:z,continuation:o});if(!(!n||n.videoId!==e)){if(n.loading=!1,!i){d(t,n.continuation,!1);return}n.comments=n.comments.concat(i.comments),n.comments.length>1&&n.comments.sort((p,r)=>r.likes-p.likes),n.continuation=i.continuation,A(t,n.comments.length),R(t,n.comments),d(t,n.continuation,!1),_()}}function y(){if(w(),!n)return;n.abort?.abort(),n.resizeObserver?.disconnect(),I(n.parentHost);const t=n.tip;n=null;try{t.hide(),t.destroy()}catch{}}function rt(t,e){const o=String(e||"").trim();if(!o||!t.isConnected)return;if(!T()){E(t);return}if(B(),J(),n?.videoId===o&&n.tip.state.isVisible){n.tip.show();return}y();const i=c("yfpCommentsTitle")||"Comments",p=document.createElement("div");p.innerHTML=K(i);const r=p.firstElementChild,f=V(t),u=O(),v=j(t);W(v),r.querySelector(".yfp-comments-tip__close")?.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation(),y()}),r.addEventListener("pointerdown",a=>{a.stopPropagation()}),r.addEventListener("click",a=>{a.stopPropagation();const h=a.target?.closest?.(".yfp-comments-tip__load-more");if(h instanceof HTMLElement){if(a.preventDefault(),!T()){E(h);return}et(r)}});let m=null;const L=M(t,{content:r,allowHTML:!0,interactive:!0,trigger:"manual",placement:"right-start",maxWidth:380,theme:g,offset:[0,10],appendTo:()=>u||document.body,hideOnClick:!1,interactiveBorder:12,zIndex:2147483646,getReferenceClientRect:()=>f,popperOptions:{strategy:"fixed",modifiers:[{name:"preventOverflow",options:{boundary:u||"clippingParents",padding:10,altAxis:!0}},{name:"flip",options:{boundary:u||"clippingParents",padding:10,fallbackPlacements:["left-start","bottom-start","top-start","right","left"]}}]},onShow(a){m||(m=h=>{if(!a.state.isVisible)return;const x=h.target;x instanceof Node&&(a.popper.contains(x)||t.contains(x)||v?.contains(x)||y())},document.addEventListener("pointerdown",m,!0))},onShown(){_()},onHidden(a){w(),m&&(document.removeEventListener("pointerdown",m,!0),m=null),n?.tip===a&&(n.abort?.abort(),n.resizeObserver?.disconnect(),I(n.parentHost),n=null);try{a.destroy()}catch{}}}),k=typeof ResizeObserver<"u"?new ResizeObserver(()=>C()):null;k?.observe(r),n={tip:L,videoId:o,continuation:null,comments:[],loading:!1,frozenRect:f,abort:null,parentHost:v,resizeObserver:k},L.show(),tt(o,r)}export{y as hideCommentsTippy,rt as openCommentsTippy};
