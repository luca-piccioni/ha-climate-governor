var Tt=Object.defineProperty;var zt=Object.getOwnPropertyDescriptor;var v=(n,e,t,s)=>{for(var i=s>1?void 0:s?zt(e,t):e,r=n.length-1,o;r>=0;r--)(o=n[r])&&(i=(s?o(e,t,i):o(i))||i);return s&&i&&Tt(e,t,i),i};var L=globalThis,B=L.ShadowRoot&&(L.ShadyCSS===void 0||L.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,J=Symbol(),lt=new WeakMap,C=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==J)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(B&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=lt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&lt.set(t,e))}return e}toString(){return this.cssText}},ht=n=>new C(typeof n=="string"?n:n+"",void 0,J),X=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((s,i,r)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[r+1],n[0]);return new C(t,n,J)},pt=(n,e)=>{if(B)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=L.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,n.appendChild(s)}},Y=B?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return ht(t)})(n):n;var{is:Ut,defineProperty:It,getOwnPropertyDescriptor:jt,getOwnPropertyNames:Lt,getOwnPropertySymbols:Bt,getPrototypeOf:qt}=Object,q=globalThis,ut=q.trustedTypes,Zt=ut?ut.emptyScript:"",Ft=q.reactiveElementPolyfillSupport,M=(n,e)=>n,H={toAttribute(n,e){switch(e){case Boolean:n=n?Zt:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},Z=(n,e)=>!Ut(n,e),gt={attribute:!0,type:String,converter:H,reflect:!1,useDefault:!1,hasChanged:Z};Symbol.metadata??=Symbol("metadata"),q.litPropertyMetadata??=new WeakMap;var y=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=gt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&It(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){let{get:i,set:r}=jt(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:i,set(o){let c=i?.call(this);r?.call(this,o),this.requestUpdate(e,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??gt}static _$Ei(){if(this.hasOwnProperty(M("elementProperties")))return;let e=qt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(M("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(M("properties"))){let t=this.properties,s=[...Lt(t),...Bt(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(Y(i))}else e!==void 0&&t.push(Y(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return pt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:H).toAttribute(t,s.type);this._$Em=e,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(e,t){let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let r=s.getPropertyOptions(i),o=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:H;this._$Em=i;let c=o.fromAttribute(t,r.type);this[i]=c??this._$Ej?.get(i)??c,this._$Em=null}}requestUpdate(e,t,s,i=!1,r){if(e!==void 0){let o=this.constructor;if(i===!1&&(r=this[e]),s??=o.getPropertyOptions(e),!((s.hasChanged??Z)(r,t)||s.useDefault&&s.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:r},o){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),r!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,r]of s){let{wrapped:o}=r,c=this[i];o!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,r,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[M("elementProperties")]=new Map,y[M("finalized")]=new Map,Ft?.({ReactiveElement:y}),(q.reactiveElementVersions??=[]).push("2.1.2");var rt=globalThis,mt=n=>n,F=rt.trustedTypes,vt=F?F.createPolicy("lit-html",{createHTML:n=>n}):void 0,xt="$lit$",$=`lit$${Math.random().toFixed(9).slice(2)}$`,wt="?"+$,Wt=`<${wt}>`,A=document,R=()=>A.createComment(""),D=n=>n===null||typeof n!="object"&&typeof n!="function",ot=Array.isArray,Kt=n=>ot(n)||typeof n?.[Symbol.iterator]=="function",Q=`[ 	
\f\r]`,N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ft=/-->/g,_t=/>/g,x=RegExp(`>|${Q}(?:([^\\s"'>=/]+)(${Q}*=${Q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),yt=/'/g,$t=/"/g,At=/^(?:script|style|textarea|title)$/i,nt=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),d=nt(1),oe=nt(2),ne=nt(3),S=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),bt=new WeakMap,w=A.createTreeWalker(A,129);function St(n,e){if(!ot(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return vt!==void 0?vt.createHTML(e):e}var Vt=(n,e)=>{let t=n.length-1,s=[],i,r=e===2?"<svg>":e===3?"<math>":"",o=N;for(let c=0;c<t;c++){let a=n[c],l,g,p=-1,u=0;for(;u<a.length&&(o.lastIndex=u,g=o.exec(a),g!==null);)u=o.lastIndex,o===N?g[1]==="!--"?o=ft:g[1]!==void 0?o=_t:g[2]!==void 0?(At.test(g[2])&&(i=RegExp("</"+g[2],"g")),o=x):g[3]!==void 0&&(o=x):o===x?g[0]===">"?(o=i??N,p=-1):g[1]===void 0?p=-2:(p=o.lastIndex-g[2].length,l=g[1],o=g[3]===void 0?x:g[3]==='"'?$t:yt):o===$t||o===yt?o=x:o===ft||o===_t?o=N:(o=x,i=void 0);let f=o===x&&n[c+1].startsWith("/>")?" ":"";r+=o===N?a+Wt:p>=0?(s.push(l),a.slice(0,p)+xt+a.slice(p)+$+f):a+$+(p===-2?c:f)}return[St(n,r+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},T=class n{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let r=0,o=0,c=e.length-1,a=this.parts,[l,g]=Vt(e,t);if(this.el=n.createElement(l,s),w.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=w.nextNode())!==null&&a.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(xt)){let u=g[o++],f=i.getAttribute(p).split($),j=/([.?@])?(.*)/.exec(u);a.push({type:1,index:r,name:j[2],strings:f,ctor:j[1]==="."?tt:j[1]==="?"?et:j[1]==="@"?st:P}),i.removeAttribute(p)}else p.startsWith($)&&(a.push({type:6,index:r}),i.removeAttribute(p));if(At.test(i.tagName)){let p=i.textContent.split($),u=p.length-1;if(u>0){i.textContent=F?F.emptyScript:"";for(let f=0;f<u;f++)i.append(p[f],R()),w.nextNode(),a.push({type:2,index:++r});i.append(p[u],R())}}}else if(i.nodeType===8)if(i.data===wt)a.push({type:2,index:r});else{let p=-1;for(;(p=i.data.indexOf($,p+1))!==-1;)a.push({type:7,index:r}),p+=$.length-1}r++}}static createElement(e,t){let s=A.createElement("template");return s.innerHTML=e,s}};function E(n,e,t=n,s){if(e===S)return e;let i=s!==void 0?t._$Co?.[s]:t._$Cl,r=D(e)?void 0:e._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(n),i._$AT(n,t,s)),s!==void 0?(t._$Co??=[])[s]=i:t._$Cl=i),i!==void 0&&(e=E(n,i._$AS(n,e.values),i,s)),e}var G=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??A).importNode(t,!0);w.currentNode=i;let r=w.nextNode(),o=0,c=0,a=s[0];for(;a!==void 0;){if(o===a.index){let l;a.type===2?l=new z(r,r.nextSibling,this,e):a.type===1?l=new a.ctor(r,a.name,a.strings,this,e):a.type===6&&(l=new it(r,this,e)),this._$AV.push(l),a=s[++c]}o!==a?.index&&(r=w.nextNode(),o++)}return w.currentNode=A,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},z=class n{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=E(this,e,t),D(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==S&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Kt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&D(this._$AH)?this._$AA.nextSibling.data=e:this.T(A.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=T.createElement(St(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{let r=new G(i,this),o=r.u(this.options);r.p(t),this.T(o),this._$AH=r}}_$AC(e){let t=bt.get(e.strings);return t===void 0&&bt.set(e.strings,t=new T(e)),t}k(e){ot(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let r of e)i===t.length?t.push(s=new n(this.O(R()),this.O(R()),this,this.options)):s=t[i],s._$AI(r),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let s=mt(e).nextSibling;mt(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},P=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,r){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(e,t=this,s,i){let r=this.strings,o=!1;if(r===void 0)e=E(this,e,t,0),o=!D(e)||e!==this._$AH&&e!==S,o&&(this._$AH=e);else{let c=e,a,l;for(e=r[0],a=0;a<r.length-1;a++)l=E(this,c[s+a],t,a),l===S&&(l=this._$AH[a]),o||=!D(l)||l!==this._$AH[a],l===h?e=h:e!==h&&(e+=(l??"")+r[a+1]),this._$AH[a]=l}o&&!i&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},tt=class extends P{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},et=class extends P{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},st=class extends P{constructor(e,t,s,i,r){super(e,t,s,i,r),this.type=5}_$AI(e,t=this){if((e=E(this,e,t,0)??h)===S)return;let s=this._$AH,i=e===h&&s!==h||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,r=e!==h&&(s===h||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},it=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){E(this,e)}};var Jt=rt.litHtmlPolyfillSupport;Jt?.(T,z),(rt.litHtmlVersions??=[]).push("3.3.3");var kt=(n,e,t)=>{let s=t?.renderBefore??e,i=s._$litPart$;if(i===void 0){let r=t?.renderBefore??null;s._$litPart$=i=new z(e.insertBefore(R(),r),r,void 0,t??{})}return i._$AI(n),i};var at=globalThis,b=class extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=kt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return S}};b._$litElement$=!0,b.finalized=!0,at.litElementHydrateSupport?.({LitElement:b});var Xt=at.litElementPolyfillSupport;Xt?.({LitElement:b});(at.litElementVersions??=[]).push("4.2.2");var Et=n=>(e,t)=>{t!==void 0?t.addInitializer(()=>{customElements.define(n,e)}):customElements.define(n,e)};var Yt={attribute:!0,type:String,converter:H,reflect:!1,hasChanged:Z},Qt=(n=Yt,e,t)=>{let{kind:s,metadata:i}=t,r=globalThis.litPropertyMetadata.get(i);if(r===void 0&&globalThis.litPropertyMetadata.set(i,r=new Map),s==="setter"&&((n=Object.create(n)).wrapped=!0),r.set(t.name,n),s==="accessor"){let{name:o}=t;return{set(c){let a=e.get.call(this);e.set.call(this,c),this.requestUpdate(o,a,n,!0,c)},init(c){return c!==void 0&&this.C(o,void 0,n,c),c}}}if(s==="setter"){let{name:o}=t;return function(c){let a=this[o];e.call(this,c),this.requestUpdate(o,a,n,!0,c)}}throw Error("Unsupported decorator location: "+s)};function k(n){return(e,t)=>typeof t=="object"?Qt(n,e,t):((s,i,r)=>{let o=i.hasOwnProperty(r);return i.constructor.createProperty(r,s),o?Object.getOwnPropertyDescriptor(i,r):void 0})(n,e,t)}function _(n){return k({...n,state:!0,attribute:!1})}var Pt=X`
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

  /* Presets matrix + diagnostics ---------------------------------------- */
  table.matrix {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  table.matrix th,
  table.matrix td {
    border-bottom: 1px solid var(--divider-color);
    padding: 8px;
    text-align: left;
    vertical-align: middle;
  }

  table.matrix th {
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--secondary-text-color);
  }

  table.matrix input[type="number"] {
    font: inherit;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    width: 110px;
  }

  details {
    background: var(--card-background-color);
    border-radius: 12px;
    padding: 12px 16px;
  }

  details summary {
    cursor: pointer;
    font-size: 0.85rem;
  }

  pre.json {
    margin: 12px 0 0;
    font-size: 0.75rem;
    font-family: var(--code-monospace-font, monospace);
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--primary-text-color);
  }
`;var Gt="climate_governor";async function Ot(n){return await n.connection.sendMessagePromise({type:"climate_governor/overview"})}async function ct(n,e,t){await n.connection.sendMessagePromise({type:"climate_governor/update_options",entry_id:e,...t})}async function Ct(n){return await n.connection.sendMessagePromise({type:"climate_governor/diagnostics"})}async function Mt(n,e,t){await n.connection.sendMessagePromise({type:"config_entries/subentries/delete",entry_id:e,subentry_id:t})}async function K(n,e,t,s){await n.connection.sendMessagePromise({type:"call_service",domain:e,service:t,service_data:s})}var U=(n,e,t)=>K(n,"number","set_value",{entity_id:e,value:t}),V=(n,e,t)=>K(n,"select","select_option",{entity_id:e,option:t}),I=(n,e,t)=>K(n,"switch",t?"turn_on":"turn_off",{entity_id:e}),Ht=(n,e)=>K(n,"button","press",{entity_id:e});async function Nt(n,e,t=24){let s=new Date(Date.now()-t*36e5).toISOString();try{let r=(await n.connection.sendMessagePromise({type:"history/history_during_period",start_time:s,entity_ids:[e],significant_changes_only:!1,minimal_response:!0,no_attributes:!0}))?.[e]??[],o=[];for(let c of r){let a=Number(c.state);Number.isFinite(a)&&o.push({t:Date.parse(c.last_changed),v:a})}return o}catch{return[]}}function Rt(n,e){let t=`/climate-governor${e}`;window.location.pathname!==t&&(history.pushState(null,"",t),window.dispatchEvent(new CustomEvent("location-changed")))}function O(n){history.pushState(null,"",`/config/integrations/integration/${Gt}#config_entry=${n}`),window.dispatchEvent(new CustomEvent("location-changed"))}var dt=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Dt={heating:"mdi:fire",cooling:"mdi:snowflake",idle:"mdi:power",off:"mdi:power-off",fan:"mdi:fan",defrosting:"mdi:snowflake-melt",drying:"mdi:weather-sunny",preheating:"mdi:fire"},m=class extends b{constructor(){super(...arguments);this.narrow=!1;this._data=null;this._loading=!0;this._error=null;this._history={};this._diagnostics=null;this._diagLoading=!1;this._presetEdits=null;this._defaultPresetEdit=null;this._tuningEdits=null;this._saving=!1;this._saved=!1}async firstUpdated(){await this._load(),this._timer=window.setInterval(()=>void this._load(),3e4)}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer)}async _load(){try{this._error=null,this._data=await Ot(this.hass)}catch(t){this._error=t instanceof Error?t.message:String(t)}finally{this._loading=!1}}_sub(t){this._presetEdits=null,this._defaultPresetEdit=null,this._tuningEdits=null,this._saved=!1,Rt(this.hass,t)}_currentPath(){return this.route?.path??""}render(){if(this._loading&&!this._data)return d`${this._header("Loading")}<main><p class="muted">Loading…</p></main>`;if(this._error)return d`${this._header("Error")}<main>
        <p class="empty">Could not load Climate Governor: ${this._error}</p>
        <div class="actions"><button @click=${()=>this._load()}>Retry</button></div>
      </main>`;let t=this._data;if(!t.entry)return d`${this._header("Climate Governor")}<main>
        <div class="empty">
          <p>No Climate Governor entry is set up yet.</p>
          <p class="muted">
            Add the integration under
            <strong>Settings → Devices &amp; services</strong> first.
          </p>
        </div>
      </main>`;let s=this._currentPath(),i;if(s.startsWith("/zones/")){let r=decodeURIComponent(s.slice(7)),o=t.zones.find(c=>c.subentry_id===r);o?(this._maybeFetchHistory(o),i=this._renderZoneDetail(o,t)):i=this._renderZones(t)}else s.startsWith("/zones")?i=this._renderZones(t):s.startsWith("/periods")?i=this._renderPeriods(t):s.startsWith("/presets")?i=this._renderPresets(t):s.startsWith("/tuning")?i=this._renderTuning(t):s.startsWith("/diagnostics")?(this._maybeFetchDiagnostics(),i=this._renderDiagnostics()):i=this._renderOverview(t);return d`${this._header(t.entry.title)}${this._tabs(s)}<main>${i}</main>`}_maybeFetchHistory(t){let s=[t.entities.climate,t.entities.duty_cycle].filter(i=>!!i&&!(i in this._history));for(let i of s)this._history[i]=[],Nt(this.hass,i).then(r=>{this._history={...this._history,[i]:r}})}_header(t){return d`<header class="app-header">
      ${this.narrow?d`<ha-icon icon="mdi:menu"></ha-icon>`:h}
      <ha-icon icon="mdi:thermostat"></ha-icon>
      <span class="title">${t}</span>
      <ha-icon
        class="menu"
        icon="mdi:refresh"
        style="cursor:pointer"
        @click=${()=>this._load()}
      ></ha-icon>
    </header>`}_tabs(t){let s=(i,r)=>{let o=i==="/"&&(t==="/"||t==="")||i!=="/"&&t.startsWith(i);return d`<a
        class=${o?"active":""}
        href=${`/climate-governor${i}`}
        @click=${c=>{c.preventDefault(),this._sub(i)}}
        >${r}</a
      >`};return d`<nav class="tabs">
      ${s("/","Overview")}${s("/zones","Zones")}${s("/periods","Schedule")}
      ${s("/presets","Presets")}${s("/tuning","Tuning")}
      ${s("/diagnostics","Diagnostics")}
    </nav>`}_renderOverview(t){let s=t.zones,i=s.filter(l=>l.state?.active).length,r=s.filter(l=>l.state?.action==="heating").length,o=s.filter(l=>l.state?.action==="cooling").length,c=s.filter(l=>l.state?.blocked).length,a=t.gateway_entities?.outdoor_temperature!=null?this.hass.states[t.gateway_entities.outdoor_temperature]?.state:void 0;return d`
      <h2>Overview</h2>
      <div class="grid">
        ${this._statCard("Zones",String(s.length),"mdi:grid")}
        ${this._statCard("Active",String(i),"mdi:power-plug")}
        ${this._statCard("Heating",String(r),"mdi:fire")}
        ${this._statCard("Cooling",String(o),"mdi:snowflake")}
        ${this._statCard("Blocked",String(c),"mdi:alert")}
        ${this._statCard("Outdoor",a!=null?`${a}\xB0`:"\u2014","mdi:thermometer")}
      </div>

      <div class="actions section">
        <button @click=${()=>O(t.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone / period
        </button>
        <button
          class="secondary"
          @click=${()=>O(t.entry.entry_id)}
        >
          <ha-icon icon="mdi:cog"></ha-icon> Configure in core
        </button>
      </div>

      <div class="section">
        <h2>Zones</h2>
        ${s.length===0?d`<p class="empty">No zones yet.</p>`:d`<div class="grid">
              ${s.map(l=>this._zoneCard(l,t))}
            </div>`}
      </div>
    `}_statCard(t,s,i){return d`<div class="card" style="cursor:default">
      <div class="card-title"><ha-icon icon=${i}></ha-icon>${t}</div>
      <div class="stat"><span class="value">${s}</span></div>
    </div>`}_zoneCard(t,s){let i=t.state,r=s.areas?.find(o=>o.area_id===t.area_id)?.name;return d`<a
      class="card"
      href=${`/climate-governor/zones/${t.subentry_id}`}
      @click=${o=>{o.preventDefault(),this._sub(`/zones/${t.subentry_id}`)}}
    >
      <div class="card-title">
        <ha-icon
          icon=${i?Dt[i.action]??"mdi:thermostat":"mdi:thermostat"}
        ></ha-icon>
        ${t.name}
      </div>
      <div class="subtitle">${r??"no area"}</div>
      <div class="stat-row">
        ${this._stat("Now",i?.current_temp!=null?`${i.current_temp}\xB0`:"\u2014")}
        ${this._stat("Target",i?.target_temp!=null?`${i.target_temp}\xB0`:"\u2014")}
        ${this._stat("Duty",i?`${Math.round(i.duty_cycle)}%`:"\u2014")}
      </div>
      <div class="chips">
        ${i?d`<span class="chip ${i.active?"on":""}">${i.action}</span>
              ${i.in_comfort?d`<span class="chip on">in band</span>`:h}
              ${i.blocked?d`<span class="chip off">blocked</span>`:h}
              <span class="chip">${i.effective_preset}</span>`:d`<span class="chip warn">not loaded</span>`}
      </div>
    </a>`}_stat(t,s){return d`<div class="stat">
      <span class="value">${s}</span><span class="label">${t}</span>
    </div>`}_renderZones(t){return d`
      <h2>Zones</h2>
      <div class="actions">
        <button @click=${()=>O(t.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone
        </button>
      </div>
      ${t.zones.length===0?d`<p class="empty">No zones yet. Add one to get started.</p>`:d`<div class="grid">${t.zones.map(s=>this._zoneCard(s,t))}</div>`}
    `}_renderZoneDetail(t,s){let i=t.state,r=s.areas?.find(a=>a.area_id===t.area_id)?.name,o=s.floors?.find(a=>a.floor_id===t.floor_id)?.name,c=i?Math.round(i.duty_cycle):0;return d`
      <button class="back" @click=${()=>this._sub("/zones")}>
        <ha-icon icon="mdi:arrow-left"></ha-icon> Zones
      </button>
      <h2>${t.name}</h2>
      <div class="chips" style="margin-bottom:12px">
        ${r?d`<span class="chip"><ha-icon icon="mdi:map-marker"></ha-icon>${r}</span>`:h}
        ${o?d`<span class="chip"><ha-icon icon="mdi:office-building"></ha-icon>${o}</span>`:h}
      </div>

      <div class="actions">
        <button @click=${()=>O(s.entry.entry_id)}>
          <ha-icon icon="mdi:pencil"></ha-icon> Edit zone (core)
        </button>
        <button
          class="secondary"
          @click=${()=>this._confirmDelete(t)}
        >
          <ha-icon icon="mdi:trash-can-outline"></ha-icon> Delete zone
        </button>
      </div>

      ${i?d`<div class="grid">
            ${this._statCard("Current",i.current_temp!=null?`${i.current_temp}\xB0`:"\u2014","mdi:thermometer")}
            ${this._statCard("Target",i.target_temp!=null?`${i.target_temp}\xB0`:"\u2014","mdi:thermostat")}
            ${this._statCard("Action",i.action,Dt[i.action]??"mdi:power")}
            ${this._statCard("Preset",i.effective_preset,"mdi:bookmark")}
          </div>
          <div class="card section" style="cursor:default">
            <div class="card-title">Duty cycle</div>
            <div class="stat"><span class="value">${c}%</span></div>
            <div class="bar"><span style="width:${Math.min(100,c)}%"></span></div>
            <div class="stat-row" style="margin-top:12px">
              ${this._stat("Output",`${Math.round(Math.max(i.output_heat,i.output_cool))}%`)}
              ${this._stat("Integral",i.integral.toFixed(2))}
              ${this._stat("Next change",i.next_change?this._fmtTime(i.next_change):"\u2014")}
            </div>
            ${this._sparkline(t)}
          </div>

          ${this._renderControls(t)}`:d`<p class="empty">This zone is not loaded (no live state).</p>`}

      <div class="card section" style="cursor:default">
        <div class="card-title">Configuration</div>
        <dl class="kv">
          <dt>Temp sensors</dt>
          <dd>${t.temperature_sensors.join(", ")||"\u2014"}</dd>
          <dt>Humidity</dt>
          <dd>${t.humidity_sensor??"\u2014"}</dd>
          <dt>Actuators</dt>
          <dd>
            ${t.actuators.map(a=>`${a.entity_id} (${a.role}/${a.kind})`).join(", ")||"\u2014"}
          </dd>
          <dt>Aggregation</dt>
          <dd>${t.aggregation??"\u2014"}</dd>
          <dt>Overrides</dt>
          <dd>
            ${Object.keys(t.control_overrides).length?Object.entries(t.control_overrides).map(([a,l])=>`${a}=${l}`).join(", "):"\u2014"}
          </dd>
        </dl>
      </div>
    `}async _confirmDelete(t){if(window.confirm(`Delete zone "${t.name}"? This removes its entities.`))try{await Mt(this.hass,this._data.entry.entry_id,t.subentry_id),await this._load()}catch(i){window.alert(`Delete failed: ${i instanceof Error?i.message:i}`)}}_renderControls(t){let s=t.entities,i=s.zone_enable?this.hass.states[s.zone_enable]:void 0,r=s.boost?this.hass.states[s.boost]:void 0,o=s.preset_hold?this.hass.states[s.preset_hold]:void 0;return d`<div class="card section" style="cursor:default">
      <div class="card-title">Controls</div>
      <div class="controls">
        ${s.zone_enable?this._toggle("Enabled",i?.state==="on",c=>void I(this.hass,s.zone_enable,c)):h}
        ${s.boost?this._toggle("Boost",r?.state==="on",c=>void I(this.hass,s.boost,c)):h}
        ${s.preset_hold?this._select("Preset hold",o?.state??"schedule",o?.attributes?.options??Object.keys(this._data?.presets??{}),c=>void V(this.hass,s.preset_hold,c)):h}
        ${s.tolerance?this._number("Tolerance",s.tolerance,c=>void U(this.hass,s.tolerance,c)):h}
        ${s.kp?this._number("Kp",s.kp,c=>void U(this.hass,s.kp,c)):h}
        ${s.ki?this._number("Ki",s.ki,c=>void U(this.hass,s.ki,c)):h}
        ${s.setpoint_offset?this._number("Offset",s.setpoint_offset,c=>void U(this.hass,s.setpoint_offset,c)):h}
      </div>
      <div class="actions" style="margin-top:14px">
        ${s.reset_integral?d`<button
              class="secondary"
              @click=${()=>void Ht(this.hass,s.reset_integral)}
            >
              <ha-icon icon="mdi:restore"></ha-icon> Reset integral
            </button>`:h}
        ${s.preset_hold&&o?.state&&o.state!=="schedule"?d`<button
              class="secondary"
              @click=${()=>void V(this.hass,s.preset_hold,"schedule")}
            >
              <ha-icon icon="mdi:calendar-clock"></ha-icon> Release hold
            </button>`:h}
      </div>
    </div>`}_toggle(t,s,i){return d`<div class="control">
      <label>${t}</label>
      <span
        class=${`toggle ${s?"on":""}`}
        role="switch"
        aria-checked=${s?"true":"false"}
        tabindex="0"
        @click=${()=>i(!s)}
        @keydown=${r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),i(!s))}}
      >
        <span class="track"></span>
        <span>${s?"On":"Off"}</span>
      </span>
    </div>`}_number(t,s,i){let r=this.hass.states[s];if(!r)return h;let o=r.attributes,c=Number(r.state);return d`<div class="control">
      <label>${t}</label>
      <input
        type="number"
        .value=${String(Number.isFinite(c)?c:"")}
        min=${o.min??""}
        max=${o.max??""}
        step=${o.step??"any"}
        @change=${a=>{let l=Number(a.target.value);Number.isFinite(l)&&i(l)}}
      />
    </div>`}_select(t,s,i,r){return d`<div class="control">
      <label>${t}</label>
      <select
        @change=${o=>r(o.target.value)}
      >
        ${i.map(o=>d`<option value=${o} ?selected=${o===s}>${o}</option>`)}
      </select>
    </div>`}_sparkline(t){let s=this._history[t.entities.duty_cycle]??[];if(s.length<2)return h;let i=300,r=60,o=s[0].t,c=s[s.length-1].t||o+1,a=s.map(f=>f.v),l=Math.min(...a,0),p=Math.max(...a,1)-l||1,u=s.map(f=>`${((f.t-o)/(c-o)*i).toFixed(1)},${(r-(f.v-l)/p*r).toFixed(1)}`).join(" ");return d`<div class="control" style="margin-top:10px">
      <label>Duty cycle · 24h</label>
      <svg class="spark" viewBox="0 0 ${i} ${r}" preserveAspectRatio="none">
        <polyline points=${u} />
      </svg>
    </div>`}_renderPeriods(t){let s=i=>t.zones.find(r=>r.subentry_id===i)?.name??i;return d`
      <h2>Schedule</h2>
      <div class="actions">
        <button @click=${()=>O(t.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add period
        </button>
      </div>
      ${t.periods.length===0?d`<p class="empty">No schedule periods yet.</p>`:d`
            ${this._weekGrid(t.periods)}
            <div class="card section" style="cursor:default; overflow-x:auto">
              <table class="week">
                <thead>
                  <tr>
                    <th>Period</th><th>Time</th><th>Preset</th><th>Zones</th>
                    <th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  ${[...t.periods].sort((i,r)=>(i.from_time??"").localeCompare(r.from_time??"")).map(i=>d`<tr>
                        <td>${i.title}</td>
                        <td>${i.from_time??"?"}–${i.to_time??"?"}</td>
                        <td><span class="chip">${i.preset}</span></td>
                        <td>${i.zones.map(s).join(", ")}</td>
                        <td>${this._dayChips(i.days)}</td>
                      </tr>`)}
                </tbody>
              </table>
            </div>
          `}
    `}_weekGrid(t){return d`<div class="weekgrid">
      <div class="head"></div>
      ${dt.map(s=>d`<div class="head">${s}</div>`)}
      <div class="head">All</div>
      ${dt.map((s,i)=>{let r=t.filter(o=>o.days.includes(i));return d`<div class="cell">
          ${r.length===0?d`<span class="muted">—</span>`:r.map(o=>d`<span class="p"
                    >${o.from_time?.slice(0,5)}–${o.to_time?.slice(0,5)}
                    ${o.preset}</span
                  >`)}
        </div>`})}
    </div>`}_dayChips(t){return t.length===7?d`<span class="chip">every day</span>`:d`<div class="chips"
      >${dt.map((s,i)=>d`${t.includes(i)?d`<span class="chip on">${s}</span>`:h}`)}</div
    >`}_fmtTime(t){try{return new Date(t).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return t}}_numInput(t,s,i){let r=s?.[0],o=s?.[1],c=s?.[2];return d`<input
      type="number"
      .value=${t!=null?String(t):""}
      min=${r??""}
      max=${o??""}
      step=${c??"any"}
      @change=${a=>{let l=Number(a.target.value);Number.isFinite(l)&&i(l)}}
    />`}_saveNote(){return this._saving?d`<span class="muted">Saving…</span>`:this._saved?d`<span class="muted">Saved.</span>`:h}_presetKeys(t){return t.preset_keys??Object.keys(t.presets??{})}_currentPresetEdits(t,s){if(this._presetEdits)return this._presetEdits;let i={};for(let r of s){let o=t.presets?.[r]??{};i[r]={heat:o.heat??0,cool:o.cool??0}}return i}_renderPresets(t){let s=this._presetKeys(t),i=this._currentPresetEdits(t,s),r=t.limits,o=Object.keys(t.presets??{}),c=this._defaultPresetEdit??t.default_preset??"";return d`
      <h2>Presets</h2>
      <p class="muted">
        Setpoints per preset. Heat is used when heating, cool when cooling.
        Values are saved together.
      </p>
      <div class="card section" style="cursor:default; overflow-x:auto">
        <table class="matrix">
          <thead>
            <tr>
              <th>Preset</th>
              <th>Heat <span class="muted">(°C)</span></th>
              <th>Cool <span class="muted">(°C)</span></th>
            </tr>
          </thead>
          <tbody>
            ${s.map(a=>d`<tr>
                <td>
                  <span class="chip ${a===c?"on":""}">${a}</span>
                </td>
                <td>
                  ${this._numInput(i[a]?.heat,r?.preset_heat,l=>{this._presetEdits={...i,[a]:{...i[a],heat:l}},this._saved=!1})}
                </td>
                <td>
                  ${this._numInput(i[a]?.cool,r?.preset_cool,l=>{this._presetEdits={...i,[a]:{...i[a],cool:l}},this._saved=!1})}
                </td>
              </tr>`)}
          </tbody>
        </table>
      </div>

      <div class="card section" style="cursor:default">
        <div class="controls">
          ${this._select("Default preset",c,o.length?o:s,a=>{this._defaultPresetEdit=a,this._saved=!1})}
        </div>
      </div>

      <div class="actions">
        <button
          ?disabled=${this._saving}
          @click=${()=>void this._savePresets(t,s)}
        >
          <ha-icon icon="mdi:content-save"></ha-icon> Save presets
        </button>
        ${this._saveNote()}
      </div>
    `}async _savePresets(t,s){let i=this._currentPresetEdits(t,s),r={};for(let o of s)r[o]=i[o];this._saving=!0,this._saved=!1;try{await ct(this.hass,t.entry.entry_id,{presets:r,default_preset:this._defaultPresetEdit??t.default_preset}),this._presetEdits=null,this._defaultPresetEdit=null,this._saved=!0,await this._load()}catch(o){window.alert(`Save failed: ${o instanceof Error?o.message:o}`)}finally{this._saving=!1}}_renderTuning(t){let s=t.gateway_entities??{},i=s.season?this.hass.states[s.season]:void 0,r=i?.state??t.season??"",o=i?.attributes?.options??t.season_options??["heating","shoulder","cooling"],c=s.master_heat?this.hass.states[s.master_heat]:void 0,a=s.master_cool?this.hass.states[s.master_cool]:void 0,l=t.limits?.tuning??{},g=this._tuningEdits??t.tuning??{},p={tolerance:"Tolerance",kp:"Kp (proportional)",ki:"Ki (integral)",max_offset:"Max offset",cycle_window:"Cycle window (s)"};return d`
      <h2>Tuning</h2>

      <div class="card section" style="cursor:default">
        <div class="card-title">Season &amp; master switches</div>
        <div class="controls">
          ${s.season?this._select("Season",r,o,u=>void V(this.hass,s.season,u)):h}
          ${s.master_heat?this._toggle("Master heating",c?.state==="on",u=>void I(this.hass,s.master_heat,u)):h}
          ${s.master_cool?this._toggle("Master cooling",a?.state==="on",u=>void I(this.hass,s.master_cool,u)):h}
        </div>
        <p class="muted" style="margin-top:10px">
          The season scales gains, tolerance and outdoor reset. Master switches
          enable or disable the whole heating / cooling path.
        </p>
      </div>

      <div class="card section" style="cursor:default">
        <div class="card-title">Global control defaults</div>
        <p class="muted">
          Defaults for every zone. A zone can override these on its own page.
        </p>
        <div class="controls">
          ${Object.keys(p).map(u=>d`<div class="control">
              <label>${p[u]}</label>
              ${this._numInput(g[u],l[u],f=>{this._tuningEdits={...this._tuningEdits??g,[u]:f},this._saved=!1})}
            </div>`)}
        </div>
        <div class="actions" style="margin-top:14px">
          <button
            ?disabled=${this._saving}
            @click=${()=>void this._saveTuning(t)}
          >
            <ha-icon icon="mdi:content-save"></ha-icon> Save defaults
          </button>
          ${this._saveNote()}
        </div>
      </div>
    `}async _saveTuning(t){let s=this._tuningEdits??t.tuning??{};this._saving=!0,this._saved=!1;try{await ct(this.hass,t.entry.entry_id,{tuning:s}),this._tuningEdits=null,this._saved=!0,await this._load()}catch(i){window.alert(`Save failed: ${i instanceof Error?i.message:i}`)}finally{this._saving=!1}}_maybeFetchDiagnostics(){this._diagnostics||this._diagLoading||(this._diagLoading=!0,Ct(this.hass).then(t=>{this._diagnostics=t}).catch(()=>{this._diagnostics={diagnostics:null,issues:[]}}).finally(()=>{this._diagLoading=!1}))}_renderDiagnostics(){if(this._diagLoading&&!this._diagnostics)return d`<h2>Diagnostics</h2><p class="muted">Loading…</p>`;let t=this._diagnostics;if(!t)return d`<h2>Diagnostics</h2><p class="muted">No data.</p>`;let s=t.issues??[],i=t.diagnostics;return d`
      <h2>Diagnostics</h2>
      <div class="actions">
        <button
          class="secondary"
          @click=${()=>{this._diagnostics=null,this._maybeFetchDiagnostics()}}
        >
          <ha-icon icon="mdi:refresh"></ha-icon> Refresh
        </button>
      </div>

      <div class="section">
        <h2>Issues</h2>
        ${s.length===0?d`<p class="empty">No open issues. 🎉</p>`:d`<div class="grid">
              ${s.map(r=>d`<div class="card" style="cursor:default">
                  <div class="card-title">
                    <ha-icon
                      icon=${r.severity==="error"?"mdi:alert-octagon":"mdi:alert"}
                    ></ha-icon>
                    ${r.translation_key??r.issue_id}
                  </div>
                  <div class="chips">
                    <span class="chip ${r.severity==="error"?"off":"warn"}">
                      ${r.severity??"issue"}
                    </span>
                    ${Object.entries(r.translation_placeholders??{}).map(([o,c])=>d`<span class="chip">${o}: ${String(c)}</span>`)}
                  </div>
                </div>`)}
            </div>`}
      </div>

      ${i?d`
            <div class="card section" style="cursor:default">
              <div class="card-title">System</div>
              <dl class="kv">
                <dt>Name</dt>
                <dd>${String(i.config?.name??"\u2014")}</dd>
                <dt>Outdoor source</dt>
                <dd>${String(i.config?.outdoor_entity_id??"\u2014")}</dd>
                <dt>Outdoor temp</dt>
                <dd>${i.outdoor_temp??"\u2014"}</dd>
                <dt>Design temp</dt>
                <dd>${String(i.config?.outdoor_design_temp??"\u2014")}</dd>
                <dt>Season</dt>
                <dd>${String(i.options?.season??"\u2014")}</dd>
                <dt>Master heat / cool</dt>
                <dd>${i.master_heat?"on":"off"} / ${i.master_cool?"on":"off"}</dd>
              </dl>
            </div>

            <div class="section">
              <h2>Zones</h2>
              <div class="grid">
                ${Object.entries(i.zones??{}).map(([r,o])=>{let c=o.state??{},a=o.actuators??[];return d`<div class="card" style="cursor:default">
                    <div class="card-title">${String(o.name??r)}</div>
                    <div class="stat-row">
                      ${this._stat("Action",String(c.action??"\u2014"))}
                      ${this._stat("Duty",c.duty_cycle!=null?`${c.duty_cycle}%`:"\u2014")}
                      ${this._stat("Integral",String(c.integral??"\u2014"))}
                    </div>
                    <div class="chips">
                      ${a.map(l=>d`<span class="chip">${l.entity_id} (${l.role}/${l.kind})</span>`)}
                    </div>
                  </div>`})}
              </div>
            </div>

            <details class="section">
              <summary class="muted">Raw diagnostics JSON</summary>
              <pre class="json">${JSON.stringify(i,null,2)}</pre>
            </details>
          `:d`<p class="empty">Entry not loaded — no live diagnostics.</p>`}
    `}};m.styles=Pt,v([k({state:!0})],m.prototype,"hass",2),v([k({state:!0})],m.prototype,"narrow",2),v([k({state:!0})],m.prototype,"route",2),v([k({state:!0})],m.prototype,"panel",2),v([_()],m.prototype,"_data",2),v([_()],m.prototype,"_loading",2),v([_()],m.prototype,"_error",2),v([_()],m.prototype,"_history",2),v([_()],m.prototype,"_diagnostics",2),v([_()],m.prototype,"_diagLoading",2),v([_()],m.prototype,"_presetEdits",2),v([_()],m.prototype,"_defaultPresetEdit",2),v([_()],m.prototype,"_tuningEdits",2),v([_()],m.prototype,"_saving",2),v([_()],m.prototype,"_saved",2),m=v([Et("climate-governor-panel")],m);export{m as ClimateGovernorPanel};
