if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,t)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let o={};const d=e=>i(e,r),c={module:{uri:r},exports:o,require:d};s[r]=Promise.all(n.map((e=>c[e]||d(e)))).then((e=>(t(...e),o)))}}define(["./workbox-cd63daf5"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-75d068ec.js",revision:null},{url:"index.html",revision:"5e018118780b3758ac725a06da136742"},{url:"images/touch/homescreen192.png",revision:"48f136f03e7dc851daa21d13136f7521"},{url:"manifest.webmanifest",revision:"0d8a266cfe5f72753fad66c529a635ab"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
