var Tt=Object.defineProperty;var Rt=Object.getOwnPropertyDescriptor;var v=(i,t,e,s)=>{for(var r=s>1?void 0:s?Rt(t,e):t,o=i.length-1,n;o>=0;o--)(n=i[o])&&(r=(s?n(t,e,r):n(r))||r);return s&&r&&Tt(t,e,r),r};var j=globalThis,L=j.ShadowRoot&&(j.ShadyCSS===void 0||j.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,V=Symbol(),dt=new WeakMap,P=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==V)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(L&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=dt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&dt.set(e,t))}return t}toString(){return this.cssText}},lt=i=>new P(typeof i=="string"?i:i+"",void 0,V),K=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((s,r,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[o+1],i[0]);return new P(e,i,V)},ht=(i,t)=>{if(L)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),r=j.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=e.cssText,i.appendChild(s)}},J=L?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return lt(e)})(i):i;var{is:Ut,defineProperty:zt,getOwnPropertyDescriptor:Dt,getOwnPropertyNames:It,getOwnPropertySymbols:jt,getPrototypeOf:Lt}=Object,q=globalThis,pt=q.trustedTypes,qt=pt?pt.emptyScript:"",Bt=q.reactiveElementPolyfillSupport,O=(i,t)=>i,H={toAttribute(i,t){switch(t){case Boolean:i=i?qt:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},B=(i,t)=>!Ut(i,t),ut={attribute:!0,type:String,converter:H,reflect:!1,useDefault:!1,hasChanged:B};Symbol.metadata??=Symbol("metadata"),q.litPropertyMetadata??=new WeakMap;var _=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=ut){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),r=this.getPropertyDescriptor(t,s,e);r!==void 0&&zt(this.prototype,t,r)}}static getPropertyDescriptor(t,e,s){let{get:r,set:o}=Dt(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:r,set(n){let a=r?.call(this);o?.call(this,n),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??ut}static _$Ei(){if(this.hasOwnProperty(O("elementProperties")))return;let t=Lt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(O("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(O("properties"))){let e=this.properties,s=[...It(e),...jt(e)];for(let r of s)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,r]of e)this.elementProperties.set(s,r)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let r=this._$Eu(e,s);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let r of s)e.unshift(J(r))}else t!==void 0&&e.push(J(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ht(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(r!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:H).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,e){let s=this.constructor,r=s._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let o=s.getPropertyOptions(r),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:H;this._$Em=r;let a=n.fromAttribute(e,o.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(t,e,s,r=!1,o){if(t!==void 0){let n=this.constructor;if(r===!1&&(o=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??B)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:r,wrapped:o},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),r===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,o]of this._$Ep)this[r]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[r,o]of s){let{wrapped:n}=o,a=this[r];n!==!0||this._$AL.has(r)||a===void 0||this.C(r,void 0,o,a)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[O("elementProperties")]=new Map,_[O("finalized")]=new Map,Bt?.({ReactiveElement:_}),(q.reactiveElementVersions??=[]).push("2.1.2");var st=globalThis,mt=i=>i,Z=st.trustedTypes,gt=Z?Z.createPolicy("lit-html",{createHTML:i=>i}):void 0,bt="$lit$",$=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+$,Zt=`<${xt}>`,w=document,N=()=>w.createComment(""),T=i=>i===null||typeof i!="object"&&typeof i!="function",rt=Array.isArray,Wt=i=>rt(i)||typeof i?.[Symbol.iterator]=="function",X=`[ 	
\f\r]`,M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ft=/-->/g,vt=/>/g,b=RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),_t=/'/g,$t=/"/g,wt=/^(?:script|style|textarea|title)$/i,it=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),d=it(1),re=it(2),ie=it(3),A=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),yt=new WeakMap,x=w.createTreeWalker(w,129);function At(i,t){if(!rt(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return gt!==void 0?gt.createHTML(t):t}var Ft=(i,t)=>{let e=i.length-1,s=[],r,o=t===2?"<svg>":t===3?"<math>":"",n=M;for(let a=0;a<e;a++){let c=i[a],l,u,p=-1,f=0;for(;f<c.length&&(n.lastIndex=f,u=n.exec(c),u!==null);)f=n.lastIndex,n===M?u[1]==="!--"?n=ft:u[1]!==void 0?n=vt:u[2]!==void 0?(wt.test(u[2])&&(r=RegExp("</"+u[2],"g")),n=b):u[3]!==void 0&&(n=b):n===b?u[0]===">"?(n=r??M,p=-1):u[1]===void 0?p=-2:(p=n.lastIndex-u[2].length,l=u[1],n=u[3]===void 0?b:u[3]==='"'?$t:_t):n===$t||n===_t?n=b:n===ft||n===vt?n=M:(n=b,r=void 0);let m=n===b&&i[a+1].startsWith("/>")?" ":"";o+=n===M?c+Zt:p>=0?(s.push(l),c.slice(0,p)+bt+c.slice(p)+$+m):c+$+(p===-2?a:m)}return[At(i,o+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},R=class i{constructor({strings:t,_$litType$:e},s){let r;this.parts=[];let o=0,n=0,a=t.length-1,c=this.parts,[l,u]=Ft(t,e);if(this.el=i.createElement(l,s),x.currentNode=this.el.content,e===2||e===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(r=x.nextNode())!==null&&c.length<a;){if(r.nodeType===1){if(r.hasAttributes())for(let p of r.getAttributeNames())if(p.endsWith(bt)){let f=u[n++],m=r.getAttribute(p).split($),I=/([.?@])?(.*)/.exec(f);c.push({type:1,index:o,name:I[2],strings:m,ctor:I[1]==="."?Q:I[1]==="?"?G:I[1]==="@"?tt:E}),r.removeAttribute(p)}else p.startsWith($)&&(c.push({type:6,index:o}),r.removeAttribute(p));if(wt.test(r.tagName)){let p=r.textContent.split($),f=p.length-1;if(f>0){r.textContent=Z?Z.emptyScript:"";for(let m=0;m<f;m++)r.append(p[m],N()),x.nextNode(),c.push({type:2,index:++o});r.append(p[f],N())}}}else if(r.nodeType===8)if(r.data===xt)c.push({type:2,index:o});else{let p=-1;for(;(p=r.data.indexOf($,p+1))!==-1;)c.push({type:7,index:o}),p+=$.length-1}o++}}static createElement(t,e){let s=w.createElement("template");return s.innerHTML=t,s}};function S(i,t,e=i,s){if(t===A)return t;let r=s!==void 0?e._$Co?.[s]:e._$Cl,o=T(t)?void 0:t._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),o===void 0?r=void 0:(r=new o(i),r._$AT(i,e,s)),s!==void 0?(e._$Co??=[])[s]=r:e._$Cl=r),r!==void 0&&(t=S(i,r._$AS(i,t.values),r,s)),t}var Y=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,r=(t?.creationScope??w).importNode(e,!0);x.currentNode=r;let o=x.nextNode(),n=0,a=0,c=s[0];for(;c!==void 0;){if(n===c.index){let l;c.type===2?l=new U(o,o.nextSibling,this,t):c.type===1?l=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(l=new et(o,this,t)),this._$AV.push(l),c=s[++a]}n!==c?.index&&(o=x.nextNode(),n++)}return x.currentNode=w,r}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},U=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,r){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=S(this,t,e),T(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==A&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Wt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(w.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,r=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=R.createElement(At(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(e);else{let o=new Y(r,this),n=o.u(this.options);o.p(e),this.T(n),this._$AH=o}}_$AC(t){let e=yt.get(t.strings);return e===void 0&&yt.set(t.strings,e=new R(t)),e}k(t){rt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,r=0;for(let o of t)r===e.length?e.push(s=new i(this.O(N()),this.O(N()),this,this.options)):s=e[r],s._$AI(o),r++;r<e.length&&(this._$AR(s&&s._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=mt(t).nextSibling;mt(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},E=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,r,o){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(t,e=this,s,r){let o=this.strings,n=!1;if(o===void 0)t=S(this,t,e,0),n=!T(t)||t!==this._$AH&&t!==A,n&&(this._$AH=t);else{let a=t,c,l;for(t=o[0],c=0;c<o.length-1;c++)l=S(this,a[s+c],e,c),l===A&&(l=this._$AH[c]),n||=!T(l)||l!==this._$AH[c],l===h?t=h:t!==h&&(t+=(l??"")+o[c+1]),this._$AH[c]=l}n&&!r&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Q=class extends E{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}},G=class extends E{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}},tt=class extends E{constructor(t,e,s,r,o){super(t,e,s,r,o),this.type=5}_$AI(t,e=this){if((t=S(this,t,e,0)??h)===A)return;let s=this._$AH,r=t===h&&s!==h||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==h&&(s===h||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},et=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t)}};var Vt=st.litHtmlPolyfillSupport;Vt?.(R,U),(st.litHtmlVersions??=[]).push("3.3.3");var kt=(i,t,e)=>{let s=e?.renderBefore??t,r=s._$litPart$;if(r===void 0){let o=e?.renderBefore??null;s._$litPart$=r=new U(t.insertBefore(N(),o),o,void 0,e??{})}return r._$AI(i),r};var ot=globalThis,y=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=kt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};y._$litElement$=!0,y.finalized=!0,ot.litElementHydrateSupport?.({LitElement:y});var Kt=ot.litElementPolyfillSupport;Kt?.({LitElement:y});(ot.litElementVersions??=[]).push("4.2.2");var St=i=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(i,t)}):customElements.define(i,t)};var Jt={attribute:!0,type:String,converter:H,reflect:!1,hasChanged:B},Xt=(i=Jt,t,e)=>{let{kind:s,metadata:r}=e,o=globalThis.litPropertyMetadata.get(r);if(o===void 0&&globalThis.litPropertyMetadata.set(r,o=new Map),s==="setter"&&((i=Object.create(i)).wrapped=!0),o.set(e.name,i),s==="accessor"){let{name:n}=e;return{set(a){let c=t.get.call(this);t.set.call(this,a),this.requestUpdate(n,c,i,!0,a)},init(a){return a!==void 0&&this.C(n,void 0,i,a),a}}}if(s==="setter"){let{name:n}=e;return function(a){let c=this[n];t.call(this,a),this.requestUpdate(n,c,i,!0,a)}}throw Error("Unsupported decorator location: "+s)};function k(i){return(t,e)=>typeof e=="object"?Xt(i,t,e):((s,r,o)=>{let n=r.hasOwnProperty(o);return r.constructor.createProperty(o,s),n?Object.getOwnPropertyDescriptor(r,o):void 0})(i,t,e)}function z(i){return k({...i,state:!0,attribute:!1})}var Et=K`
  :host {
    display: block;
    box-sizing: border-box;
    color: var(--primary-text-color);
  }

  * {
    box-sizing: border-box;
  }

  header.app-header {
    background-color: var(--app-header-background-color);
    color: var(--app-header-text-color, var(--primary-text-color));
    border-bottom: 1px solid var(--divider-color);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    position: sticky;
    top: 0;
    z-index: 5;
  }

  header.app-header ha-icon,
  header.app-header .menu {
    color: inherit;
  }

  header.app-header .title {
    font-size: 1.1rem;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  nav.tabs {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--divider-color);
    overflow-x: auto;
    background: var(--card-background-color);
  }

  nav.tabs a {
    color: var(--primary-text-color);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  nav.tabs a.active {
    background: rgba(var(--accent-color), 0.14);
    background: var(--secondary-background-color);
    color: var(--primary-color);
    font-weight: 600;
  }

  main {
    padding: 16px;
    max-width: 1100px;
    margin: 0 auto;
  }

  h2 {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 4px 0 12px;
  }

  .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .card {
    background: var(--card-background-color);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    padding: 16px;
    display: block;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    transition: box-shadow 0.15s ease;
  }

  .card:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  .card .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 1.05rem;
    margin-bottom: 4px;
  }

  .card .subtitle {
    color: var(--secondary-text-color);
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat .value {
    font-size: 1.3rem;
    font-weight: 600;
  }

  .stat .label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .chip {
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .chip.on {
    background: var(--success-color, #4caf50);
    color: #fff;
  }

  .chip.warn {
    background: var(--warning-color, #ff9800);
    color: #fff;
  }

  .chip.off {
    background: var(--error-color, #f44336);
    color: #fff;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0;
  }

  button,
  .btn {
    font: inherit;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
  }

  button.secondary,
  .btn.secondary {
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .empty {
    text-align: center;
    color: var(--secondary-text-color);
    padding: 40px 16px;
  }

  .muted {
    color: var(--secondary-text-color);
  }

  table.week {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  table.week th,
  table.week td {
    border: 1px solid var(--divider-color);
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }

  table.week th {
    background: var(--secondary-background-color);
    font-weight: 600;
  }

  .kv {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 16px;
    font-size: 0.9rem;
  }

  .kv dt {
    color: var(--secondary-text-color);
  }

  .kv dd {
    margin: 0;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary-color);
    text-decoration: none;
    cursor: pointer;
    margin-bottom: 12px;
    background: none;
    border: none;
    padding: 0;
    font-size: 0.9rem;
  }

  .section {
    margin-top: 20px;
  }

  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--secondary-background-color);
    overflow: hidden;
    margin-top: 4px;
  }

  .bar > span {
    display: block;
    height: 100%;
    background: var(--primary-color);
  }

  /* Inline controls ------------------------------------------------------- */
  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .control label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .control input[type="number"] {
    font: inherit;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    width: 100%;
  }

  .control select {
    font: inherit;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    width: 100%;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  .toggle .track {
    width: 42px;
    height: 24px;
    border-radius: 999px;
    background: var(--secondary-background-color);
    position: relative;
    transition: background 0.15s ease;
    flex: none;
  }

  .toggle .track::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.15s ease;
  }

  .toggle.on .track {
    background: var(--primary-color);
  }

  .toggle.on .track::after {
    transform: translateX(18px);
  }

  .spark {
    width: 100%;
    height: 80px;
    display: block;
    margin-top: 8px;
  }

  .spark polyline {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }

  .spark .band {
    fill: rgba(var(--accent-color-rgb, 255, 160, 0), 0.12);
  }

  .weekgrid {
    display: grid;
    grid-template-columns: 64px repeat(7, 1fr);
    gap: 1px;
    background: var(--divider-color);
    border-radius: 8px;
    overflow: hidden;
    font-size: 0.8rem;
  }

  .weekgrid > div {
    background: var(--card-background-color);
    padding: 6px;
    min-height: 34px;
  }

  .weekgrid .head {
    background: var(--secondary-background-color);
    font-weight: 600;
    text-align: center;
  }

  .weekgrid .cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .weekgrid .cell .p {
    background: var(--secondary-background-color);
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 0.72rem;
  }
`;var Yt="climate_governor";async function Ct(i){return await i.connection.sendMessagePromise({type:"climate_governor/overview"})}async function Pt(i,t,e){await i.connection.sendMessagePromise({type:"config_entries/subentries/delete",entry_id:t,subentry_id:e})}async function F(i,t,e,s){await i.connection.sendMessagePromise({type:"call_service",domain:t,service:e,service_data:s})}var D=(i,t,e)=>F(i,"number","set_value",{entity_id:t,value:e}),nt=(i,t,e)=>F(i,"select","select_option",{entity_id:t,option:e}),at=(i,t,e)=>F(i,"switch",e?"turn_on":"turn_off",{entity_id:t}),Ot=(i,t)=>F(i,"button","press",{entity_id:t});async function Ht(i,t,e=24){let s=new Date(Date.now()-e*36e5).toISOString();try{let o=(await i.connection.sendMessagePromise({type:"history/history_during_period",start_time:s,entity_ids:[t],significant_changes_only:!1,minimal_response:!0,no_attributes:!0}))?.[t]??[],n=[];for(let a of o){let c=Number(a.state);Number.isFinite(c)&&n.push({t:Date.parse(a.last_changed),v:c})}return n}catch{return[]}}function Mt(i,t){let e=`/climate-governor${t}`;window.location.pathname!==e&&(history.pushState(null,"",e),window.dispatchEvent(new CustomEvent("location-changed")))}function C(i){history.pushState(null,"",`/config/integrations/integration/${Yt}#config_entry=${i}`),window.dispatchEvent(new CustomEvent("location-changed"))}var ct=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Nt={heating:"mdi:fire",cooling:"mdi:snowflake",idle:"mdi:power",off:"mdi:power-off",fan:"mdi:fan",defrosting:"mdi:snowflake-melt",drying:"mdi:weather-sunny",preheating:"mdi:fire"},g=class extends y{constructor(){super(...arguments);this.narrow=!1;this._data=null;this._loading=!0;this._error=null;this._history={}}async firstUpdated(){await this._load(),this._timer=window.setInterval(()=>void this._load(),3e4)}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer)}async _load(){try{this._error=null,this._data=await Ct(this.hass)}catch(e){this._error=e instanceof Error?e.message:String(e)}finally{this._loading=!1}}_sub(e){Mt(this.hass,e)}_currentPath(){return this.route?.path??""}render(){if(this._loading&&!this._data)return d`${this._header("Loading")}<main><p class="muted">Loading…</p></main>`;if(this._error)return d`${this._header("Error")}<main>
        <p class="empty">Could not load Climate Governor: ${this._error}</p>
        <div class="actions"><button @click=${()=>this._load()}>Retry</button></div>
      </main>`;let e=this._data;if(!e.entry)return d`${this._header("Climate Governor")}<main>
        <div class="empty">
          <p>No Climate Governor entry is set up yet.</p>
          <p class="muted">
            Add the integration under
            <strong>Settings → Devices &amp; services</strong> first.
          </p>
        </div>
      </main>`;let s=this._currentPath(),r;if(s.startsWith("/zones/")){let o=decodeURIComponent(s.slice(7)),n=e.zones.find(a=>a.subentry_id===o);n?(this._maybeFetchHistory(n),r=this._renderZoneDetail(n,e)):r=this._renderZones(e)}else s.startsWith("/zones")?r=this._renderZones(e):s.startsWith("/periods")?r=this._renderPeriods(e):r=this._renderOverview(e);return d`${this._header(e.entry.title)}${this._tabs(s)}<main>${r}</main>`}_maybeFetchHistory(e){let s=[e.entities.climate,e.entities.duty_cycle].filter(r=>!!r&&!(r in this._history));for(let r of s)this._history[r]=[],Ht(this.hass,r).then(o=>{this._history={...this._history,[r]:o}})}_header(e){return d`<header class="app-header">
      ${this.narrow?d`<ha-icon icon="mdi:menu"></ha-icon>`:h}
      <ha-icon icon="mdi:thermostat"></ha-icon>
      <span class="title">${e}</span>
      <ha-icon
        class="menu"
        icon="mdi:refresh"
        style="cursor:pointer"
        @click=${()=>this._load()}
      ></ha-icon>
    </header>`}_tabs(e){let s=(r,o)=>{let n=r==="/"&&(e==="/"||e==="")||r!=="/"&&e.startsWith(r);return d`<a
        class=${n?"active":""}
        href=${`/climate-governor${r}`}
        @click=${a=>{a.preventDefault(),this._sub(r)}}
        >${o}</a
      >`};return d`<nav class="tabs">
      ${s("/","Overview")}${s("/zones","Zones")}${s("/periods","Schedule")}
    </nav>`}_renderOverview(e){let s=e.zones,r=s.filter(l=>l.state?.active).length,o=s.filter(l=>l.state?.action==="heating").length,n=s.filter(l=>l.state?.action==="cooling").length,a=s.filter(l=>l.state?.blocked).length,c=e.gateway_entities?.outdoor_temperature!=null?this.hass.states[e.gateway_entities.outdoor_temperature]?.state:void 0;return d`
      <h2>Overview</h2>
      <div class="grid">
        ${this._statCard("Zones",String(s.length),"mdi:grid")}
        ${this._statCard("Active",String(r),"mdi:power-plug")}
        ${this._statCard("Heating",String(o),"mdi:fire")}
        ${this._statCard("Cooling",String(n),"mdi:snowflake")}
        ${this._statCard("Blocked",String(a),"mdi:alert")}
        ${this._statCard("Outdoor",c!=null?`${c}\xB0`:"\u2014","mdi:thermometer")}
      </div>

      <div class="actions section">
        <button @click=${()=>C(e.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone / period
        </button>
        <button
          class="secondary"
          @click=${()=>C(e.entry.entry_id)}
        >
          <ha-icon icon="mdi:cog"></ha-icon> Configure in core
        </button>
      </div>

      <div class="section">
        <h2>Zones</h2>
        ${s.length===0?d`<p class="empty">No zones yet.</p>`:d`<div class="grid">
              ${s.map(l=>this._zoneCard(l,e))}
            </div>`}
      </div>
    `}_statCard(e,s,r){return d`<div class="card" style="cursor:default">
      <div class="card-title"><ha-icon icon=${r}></ha-icon>${e}</div>
      <div class="stat"><span class="value">${s}</span></div>
    </div>`}_zoneCard(e,s){let r=e.state,o=s.areas?.find(n=>n.area_id===e.area_id)?.name;return d`<a
      class="card"
      href=${`/climate-governor/zones/${e.subentry_id}`}
      @click=${n=>{n.preventDefault(),this._sub(`/zones/${e.subentry_id}`)}}
    >
      <div class="card-title">
        <ha-icon
          icon=${r?Nt[r.action]??"mdi:thermostat":"mdi:thermostat"}
        ></ha-icon>
        ${e.name}
      </div>
      <div class="subtitle">${o??"no area"}</div>
      <div class="stat-row">
        ${this._stat("Now",r?.current_temp!=null?`${r.current_temp}\xB0`:"\u2014")}
        ${this._stat("Target",r?.target_temp!=null?`${r.target_temp}\xB0`:"\u2014")}
        ${this._stat("Duty",r?`${Math.round(r.duty_cycle)}%`:"\u2014")}
      </div>
      <div class="chips">
        ${r?d`<span class="chip ${r.active?"on":""}">${r.action}</span>
              ${r.in_comfort?d`<span class="chip on">in band</span>`:h}
              ${r.blocked?d`<span class="chip off">blocked</span>`:h}
              <span class="chip">${r.effective_preset}</span>`:d`<span class="chip warn">not loaded</span>`}
      </div>
    </a>`}_stat(e,s){return d`<div class="stat">
      <span class="value">${s}</span><span class="label">${e}</span>
    </div>`}_renderZones(e){return d`
      <h2>Zones</h2>
      <div class="actions">
        <button @click=${()=>C(e.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone
        </button>
      </div>
      ${e.zones.length===0?d`<p class="empty">No zones yet. Add one to get started.</p>`:d`<div class="grid">${e.zones.map(s=>this._zoneCard(s,e))}</div>`}
    `}_renderZoneDetail(e,s){let r=e.state,o=s.areas?.find(c=>c.area_id===e.area_id)?.name,n=s.floors?.find(c=>c.floor_id===e.floor_id)?.name,a=r?Math.round(r.duty_cycle):0;return d`
      <button class="back" @click=${()=>this._sub("/zones")}>
        <ha-icon icon="mdi:arrow-left"></ha-icon> Zones
      </button>
      <h2>${e.name}</h2>
      <div class="chips" style="margin-bottom:12px">
        ${o?d`<span class="chip"><ha-icon icon="mdi:map-marker"></ha-icon>${o}</span>`:h}
        ${n?d`<span class="chip"><ha-icon icon="mdi:office-building"></ha-icon>${n}</span>`:h}
      </div>

      <div class="actions">
        <button @click=${()=>C(s.entry.entry_id)}>
          <ha-icon icon="mdi:pencil"></ha-icon> Edit zone (core)
        </button>
        <button
          class="secondary"
          @click=${()=>this._confirmDelete(e)}
        >
          <ha-icon icon="mdi:trash-can-outline"></ha-icon> Delete zone
        </button>
      </div>

      ${r?d`<div class="grid">
            ${this._statCard("Current",r.current_temp!=null?`${r.current_temp}\xB0`:"\u2014","mdi:thermometer")}
            ${this._statCard("Target",r.target_temp!=null?`${r.target_temp}\xB0`:"\u2014","mdi:thermostat")}
            ${this._statCard("Action",r.action,Nt[r.action]??"mdi:power")}
            ${this._statCard("Preset",r.effective_preset,"mdi:bookmark")}
          </div>
          <div class="card section" style="cursor:default">
            <div class="card-title">Duty cycle</div>
            <div class="stat"><span class="value">${a}%</span></div>
            <div class="bar"><span style="width:${Math.min(100,a)}%"></span></div>
            <div class="stat-row" style="margin-top:12px">
              ${this._stat("Output",`${Math.round(Math.max(r.output_heat,r.output_cool))}%`)}
              ${this._stat("Integral",r.integral.toFixed(2))}
              ${this._stat("Next change",r.next_change?this._fmtTime(r.next_change):"\u2014")}
            </div>
            ${this._sparkline(e)}
          </div>

          ${this._renderControls(e)}`:d`<p class="empty">This zone is not loaded (no live state).</p>`}

      <div class="card section" style="cursor:default">
        <div class="card-title">Configuration</div>
        <dl class="kv">
          <dt>Temp sensors</dt>
          <dd>${e.temperature_sensors.join(", ")||"\u2014"}</dd>
          <dt>Humidity</dt>
          <dd>${e.humidity_sensor??"\u2014"}</dd>
          <dt>Actuators</dt>
          <dd>
            ${e.actuators.map(c=>`${c.entity_id} (${c.role}/${c.kind})`).join(", ")||"\u2014"}
          </dd>
          <dt>Aggregation</dt>
          <dd>${e.aggregation??"\u2014"}</dd>
          <dt>Overrides</dt>
          <dd>
            ${Object.keys(e.control_overrides).length?Object.entries(e.control_overrides).map(([c,l])=>`${c}=${l}`).join(", "):"\u2014"}
          </dd>
        </dl>
      </div>
    `}async _confirmDelete(e){if(window.confirm(`Delete zone "${e.name}"? This removes its entities.`))try{await Pt(this.hass,this._data.entry.entry_id,e.subentry_id),await this._load()}catch(r){window.alert(`Delete failed: ${r instanceof Error?r.message:r}`)}}_renderControls(e){let s=e.entities,r=s.zone_enable?this.hass.states[s.zone_enable]:void 0,o=s.boost?this.hass.states[s.boost]:void 0,n=s.preset_hold?this.hass.states[s.preset_hold]:void 0;return d`<div class="card section" style="cursor:default">
      <div class="card-title">Controls</div>
      <div class="controls">
        ${s.zone_enable?this._toggle("Enabled",r?.state==="on",a=>void at(this.hass,s.zone_enable,a)):h}
        ${s.boost?this._toggle("Boost",o?.state==="on",a=>void at(this.hass,s.boost,a)):h}
        ${s.preset_hold?this._select("Preset hold",n?.state??"schedule",n?.attributes?.options??Object.keys(this._data?.presets??{}),a=>void nt(this.hass,s.preset_hold,a)):h}
        ${s.tolerance?this._number("Tolerance",s.tolerance,a=>void D(this.hass,s.tolerance,a)):h}
        ${s.kp?this._number("Kp",s.kp,a=>void D(this.hass,s.kp,a)):h}
        ${s.ki?this._number("Ki",s.ki,a=>void D(this.hass,s.ki,a)):h}
        ${s.setpoint_offset?this._number("Offset",s.setpoint_offset,a=>void D(this.hass,s.setpoint_offset,a)):h}
      </div>
      <div class="actions" style="margin-top:14px">
        ${s.reset_integral?d`<button
              class="secondary"
              @click=${()=>void Ot(this.hass,s.reset_integral)}
            >
              <ha-icon icon="mdi:restore"></ha-icon> Reset integral
            </button>`:h}
        ${s.preset_hold&&n?.state&&n.state!=="schedule"?d`<button
              class="secondary"
              @click=${()=>void nt(this.hass,s.preset_hold,"schedule")}
            >
              <ha-icon icon="mdi:calendar-clock"></ha-icon> Release hold
            </button>`:h}
      </div>
    </div>`}_toggle(e,s,r){return d`<div class="control">
      <label>${e}</label>
      <span
        class=${`toggle ${s?"on":""}`}
        role="switch"
        aria-checked=${s?"true":"false"}
        tabindex="0"
        @click=${()=>r(!s)}
        @keydown=${o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),r(!s))}}
      >
        <span class="track"></span>
        <span>${s?"On":"Off"}</span>
      </span>
    </div>`}_number(e,s,r){let o=this.hass.states[s];if(!o)return h;let n=o.attributes,a=Number(o.state);return d`<div class="control">
      <label>${e}</label>
      <input
        type="number"
        .value=${String(Number.isFinite(a)?a:"")}
        min=${n.min??""}
        max=${n.max??""}
        step=${n.step??"any"}
        @change=${c=>{let l=Number(c.target.value);Number.isFinite(l)&&r(l)}}
      />
    </div>`}_select(e,s,r,o){return d`<div class="control">
      <label>${e}</label>
      <select
        @change=${n=>o(n.target.value)}
      >
        ${r.map(n=>d`<option value=${n} ?selected=${n===s}>${n}</option>`)}
      </select>
    </div>`}_sparkline(e){let s=this._history[e.entities.duty_cycle]??[];if(s.length<2)return h;let r=300,o=60,n=s[0].t,a=s[s.length-1].t||n+1,c=s.map(m=>m.v),l=Math.min(...c,0),p=Math.max(...c,1)-l||1,f=s.map(m=>`${((m.t-n)/(a-n)*r).toFixed(1)},${(o-(m.v-l)/p*o).toFixed(1)}`).join(" ");return d`<div class="control" style="margin-top:10px">
      <label>Duty cycle · 24h</label>
      <svg class="spark" viewBox="0 0 ${r} ${o}" preserveAspectRatio="none">
        <polyline points=${f} />
      </svg>
    </div>`}_renderPeriods(e){let s=r=>e.zones.find(o=>o.subentry_id===r)?.name??r;return d`
      <h2>Schedule</h2>
      <div class="actions">
        <button @click=${()=>C(e.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add period
        </button>
      </div>
      ${e.periods.length===0?d`<p class="empty">No schedule periods yet.</p>`:d`
            ${this._weekGrid(e.periods)}
            <div class="card section" style="cursor:default; overflow-x:auto">
              <table class="week">
                <thead>
                  <tr>
                    <th>Period</th><th>Time</th><th>Preset</th><th>Zones</th>
                    <th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  ${[...e.periods].sort((r,o)=>(r.from_time??"").localeCompare(o.from_time??"")).map(r=>d`<tr>
                        <td>${r.title}</td>
                        <td>${r.from_time??"?"}–${r.to_time??"?"}</td>
                        <td><span class="chip">${r.preset}</span></td>
                        <td>${r.zones.map(s).join(", ")}</td>
                        <td>${this._dayChips(r.days)}</td>
                      </tr>`)}
                </tbody>
              </table>
            </div>
          `}
    `}_weekGrid(e){return d`<div class="weekgrid">
      <div class="head"></div>
      ${ct.map(s=>d`<div class="head">${s}</div>`)}
      <div class="head">All</div>
      ${ct.map((s,r)=>{let o=e.filter(n=>n.days.includes(r));return d`<div class="cell">
          ${o.length===0?d`<span class="muted">—</span>`:o.map(n=>d`<span class="p"
                    >${n.from_time?.slice(0,5)}–${n.to_time?.slice(0,5)}
                    ${n.preset}</span
                  >`)}
        </div>`})}
    </div>`}_dayChips(e){return e.length===7?d`<span class="chip">every day</span>`:d`<div class="chips"
      >${ct.map((s,r)=>d`${e.includes(r)?d`<span class="chip on">${s}</span>`:h}`)}</div
    >`}_fmtTime(e){try{return new Date(e).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}};g.styles=Et,v([k({state:!0})],g.prototype,"hass",2),v([k({state:!0})],g.prototype,"narrow",2),v([k({state:!0})],g.prototype,"route",2),v([k({state:!0})],g.prototype,"panel",2),v([z()],g.prototype,"_data",2),v([z()],g.prototype,"_loading",2),v([z()],g.prototype,"_error",2),v([z()],g.prototype,"_history",2),g=v([St("climate-governor-panel")],g);export{g as ClimateGovernorPanel};
