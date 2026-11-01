var Ct=Object.defineProperty;var kt=Object.getOwnPropertyDescriptor;var C=(i,t,e,s)=>{for(var r=s>1?void 0:s?kt(t,e):t,o=i.length-1,n;o>=0;o--)(n=i[o])&&(r=(s?n(t,e,r):n(r))||r);return s&&r&&Ct(t,e,r),r};var z=globalThis,D=z.ShadowRoot&&(z.ShadyCSS===void 0||z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,B=Symbol(),rt=new WeakMap,k=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==B)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(D&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=rt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&rt.set(e,t))}return t}toString(){return this.cssText}},it=i=>new k(typeof i=="string"?i:i+"",void 0,B),W=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((s,r,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[o+1],i[0]);return new k(e,i,B)},ot=(i,t)=>{if(D)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),r=z.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=e.cssText,i.appendChild(s)}},V=D?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return it(e)})(i):i;var{is:Pt,defineProperty:Ot,getOwnPropertyDescriptor:Mt,getOwnPropertyNames:Ut,getOwnPropertySymbols:Tt,getPrototypeOf:Nt}=Object,j=globalThis,nt=j.trustedTypes,Ht=nt?nt.emptyScript:"",Rt=j.reactiveElementPolyfillSupport,P=(i,t)=>i,O={toAttribute(i,t){switch(t){case Boolean:i=i?Ht:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},L=(i,t)=>!Pt(i,t),at={attribute:!0,type:String,converter:O,reflect:!1,useDefault:!1,hasChanged:L};Symbol.metadata??=Symbol("metadata"),j.litPropertyMetadata??=new WeakMap;var f=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=at){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),r=this.getPropertyDescriptor(t,s,e);r!==void 0&&Ot(this.prototype,t,r)}}static getPropertyDescriptor(t,e,s){let{get:r,set:o}=Mt(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:r,set(n){let c=r?.call(this);o?.call(this,n),this.requestUpdate(t,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??at}static _$Ei(){if(this.hasOwnProperty(P("elementProperties")))return;let t=Nt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(P("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(P("properties"))){let e=this.properties,s=[...Ut(e),...Tt(e)];for(let r of s)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,r]of e)this.elementProperties.set(s,r)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let r=this._$Eu(e,s);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let r of s)e.unshift(V(r))}else t!==void 0&&e.push(V(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ot(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){let s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(r!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:O).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,e){let s=this.constructor,r=s._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let o=s.getPropertyOptions(r),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:O;this._$Em=r;let c=n.fromAttribute(e,o.type);this[r]=c??this._$Ej?.get(r)??c,this._$Em=null}}requestUpdate(t,e,s,r=!1,o){if(t!==void 0){let n=this.constructor;if(r===!1&&(o=this[t]),s??=n.getPropertyOptions(t),!((s.hasChanged??L)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:r,wrapped:o},n){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),o!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),r===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,o]of this._$Ep)this[r]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[r,o]of s){let{wrapped:n}=o,c=this[r];n!==!0||this._$AL.has(r)||c===void 0||this.C(r,void 0,o,c)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};f.elementStyles=[],f.shadowRootOptions={mode:"open"},f[P("elementProperties")]=new Map,f[P("finalized")]=new Map,Rt?.({ReactiveElement:f}),(j.reactiveElementVersions??=[]).push("2.1.2");var G=globalThis,ct=i=>i,I=G.trustedTypes,dt=I?I.createPolicy("lit-html",{createHTML:i=>i}):void 0,ft="$lit$",v=`lit$${Math.random().toFixed(9).slice(2)}$`,gt="?"+v,zt=`<${gt}>`,x=document,U=()=>x.createComment(""),T=i=>i===null||typeof i!="object"&&typeof i!="function",tt=Array.isArray,Dt=i=>tt(i)||typeof i?.[Symbol.iterator]=="function",F=`[ 	
\f\r]`,M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,lt=/-->/g,ht=/>/g,y=RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),pt=/'/g,ut=/"/g,vt=/^(?:script|style|textarea|title)$/i,et=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),d=et(1),Qt=et(2),Xt=et(3),A=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),mt=new WeakMap,b=x.createTreeWalker(x,129);function _t(i,t){if(!tt(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return dt!==void 0?dt.createHTML(t):t}var jt=(i,t)=>{let e=i.length-1,s=[],r,o=t===2?"<svg>":t===3?"<math>":"",n=M;for(let c=0;c<e;c++){let a=i[c],l,u,p=-1,m=0;for(;m<a.length&&(n.lastIndex=m,u=n.exec(a),u!==null);)m=n.lastIndex,n===M?u[1]==="!--"?n=lt:u[1]!==void 0?n=ht:u[2]!==void 0?(vt.test(u[2])&&(r=RegExp("</"+u[2],"g")),n=y):u[3]!==void 0&&(n=y):n===y?u[0]===">"?(n=r??M,p=-1):u[1]===void 0?p=-2:(p=n.lastIndex-u[2].length,l=u[1],n=u[3]===void 0?y:u[3]==='"'?ut:pt):n===ut||n===pt?n=y:n===lt||n===ht?n=M:(n=y,r=void 0);let g=n===y&&i[c+1].startsWith("/>")?" ":"";o+=n===M?a+zt:p>=0?(s.push(l),a.slice(0,p)+ft+a.slice(p)+v+g):a+v+(p===-2?c:g)}return[_t(i,o+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},N=class i{constructor({strings:t,_$litType$:e},s){let r;this.parts=[];let o=0,n=0,c=t.length-1,a=this.parts,[l,u]=jt(t,e);if(this.el=i.createElement(l,s),b.currentNode=this.el.content,e===2||e===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(r=b.nextNode())!==null&&a.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(let p of r.getAttributeNames())if(p.endsWith(ft)){let m=u[n++],g=r.getAttribute(p).split(v),R=/([.?@])?(.*)/.exec(m);a.push({type:1,index:o,name:R[2],strings:g,ctor:R[1]==="."?J:R[1]==="?"?Y:R[1]==="@"?Q:S}),r.removeAttribute(p)}else p.startsWith(v)&&(a.push({type:6,index:o}),r.removeAttribute(p));if(vt.test(r.tagName)){let p=r.textContent.split(v),m=p.length-1;if(m>0){r.textContent=I?I.emptyScript:"";for(let g=0;g<m;g++)r.append(p[g],U()),b.nextNode(),a.push({type:2,index:++o});r.append(p[m],U())}}}else if(r.nodeType===8)if(r.data===gt)a.push({type:2,index:o});else{let p=-1;for(;(p=r.data.indexOf(v,p+1))!==-1;)a.push({type:7,index:o}),p+=v.length-1}o++}}static createElement(t,e){let s=x.createElement("template");return s.innerHTML=t,s}};function w(i,t,e=i,s){if(t===A)return t;let r=s!==void 0?e._$Co?.[s]:e._$Cl,o=T(t)?void 0:t._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),o===void 0?r=void 0:(r=new o(i),r._$AT(i,e,s)),s!==void 0?(e._$Co??=[])[s]=r:e._$Cl=r),r!==void 0&&(t=w(i,r._$AS(i,t.values),r,s)),t}var K=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,r=(t?.creationScope??x).importNode(e,!0);b.currentNode=r;let o=b.nextNode(),n=0,c=0,a=s[0];for(;a!==void 0;){if(n===a.index){let l;a.type===2?l=new H(o,o.nextSibling,this,t):a.type===1?l=new a.ctor(o,a.name,a.strings,this,t):a.type===6&&(l=new X(o,this,t)),this._$AV.push(l),a=s[++c]}n!==a?.index&&(o=b.nextNode(),n++)}return b.currentNode=x,r}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},H=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,r){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=w(this,t,e),T(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==A&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Dt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(x.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,r=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=N.createElement(_t(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(e);else{let o=new K(r,this),n=o.u(this.options);o.p(e),this.T(n),this._$AH=o}}_$AC(t){let e=mt.get(t.strings);return e===void 0&&mt.set(t.strings,e=new N(t)),e}k(t){tt(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,r=0;for(let o of t)r===e.length?e.push(s=new i(this.O(U()),this.O(U()),this,this.options)):s=e[r],s._$AI(o),r++;r<e.length&&(this._$AR(s&&s._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let s=ct(t).nextSibling;ct(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},S=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,r,o){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(t,e=this,s,r){let o=this.strings,n=!1;if(o===void 0)t=w(this,t,e,0),n=!T(t)||t!==this._$AH&&t!==A,n&&(this._$AH=t);else{let c=t,a,l;for(t=o[0],a=0;a<o.length-1;a++)l=w(this,c[s+a],e,a),l===A&&(l=this._$AH[a]),n||=!T(l)||l!==this._$AH[a],l===h?t=h:t!==h&&(t+=(l??"")+o[a+1]),this._$AH[a]=l}n&&!r&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},J=class extends S{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}},Y=class extends S{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}},Q=class extends S{constructor(t,e,s,r,o){super(t,e,s,r,o),this.type=5}_$AI(t,e=this){if((t=w(this,t,e,0)??h)===A)return;let s=this._$AH,r=t===h&&s!==h||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==h&&(s===h||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},X=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){w(this,t)}};var Lt=G.litHtmlPolyfillSupport;Lt?.(N,H),(G.litHtmlVersions??=[]).push("3.3.3");var $t=(i,t,e)=>{let s=e?.renderBefore??t,r=s._$litPart$;if(r===void 0){let o=e?.renderBefore??null;s._$litPart$=r=new H(t.insertBefore(U(),o),o,void 0,e??{})}return r._$AI(i),r};var st=globalThis,_=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=$t(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};_._$litElement$=!0,_.finalized=!0,st.litElementHydrateSupport?.({LitElement:_});var It=st.litElementPolyfillSupport;It?.({LitElement:_});(st.litElementVersions??=[]).push("4.2.2");var yt=i=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(i,t)}):customElements.define(i,t)};var qt={attribute:!0,type:String,converter:O,reflect:!1,hasChanged:L},Zt=(i=qt,t,e)=>{let{kind:s,metadata:r}=e,o=globalThis.litPropertyMetadata.get(r);if(o===void 0&&globalThis.litPropertyMetadata.set(r,o=new Map),s==="setter"&&((i=Object.create(i)).wrapped=!0),o.set(e.name,i),s==="accessor"){let{name:n}=e;return{set(c){let a=t.get.call(this);t.set.call(this,c),this.requestUpdate(n,a,i,!0,c)},init(c){return c!==void 0&&this.C(n,void 0,i,c),c}}}if(s==="setter"){let{name:n}=e;return function(c){let a=this[n];t.call(this,c),this.requestUpdate(n,a,i,!0,c)}}throw Error("Unsupported decorator location: "+s)};function bt(i){return(t,e)=>typeof e=="object"?Zt(i,t,e):((s,r,o)=>{let n=r.hasOwnProperty(o);return r.constructor.createProperty(o,s),n?Object.getOwnPropertyDescriptor(r,o):void 0})(i,t,e)}function q(i){return bt({...i,state:!0,attribute:!1})}var xt=W`
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
`;var Bt="climate_governor";async function At(i){return await i.connection.sendMessagePromise({type:"climate_governor/overview"})}async function wt(i,t,e){await i.connection.sendMessagePromise({type:"config_entries/subentries/delete",entry_id:t,subentry_id:e})}function St(i,t){let e=`/climate-governor${t}`;window.location.pathname!==e&&(history.pushState(null,"",e),window.dispatchEvent(new CustomEvent("location-changed")))}function E(i){history.pushState(null,"",`/config/integrations/integration/${Bt}#config_entry=${i}`),window.dispatchEvent(new CustomEvent("location-changed"))}var Wt=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Et={heating:"mdi:fire",cooling:"mdi:snowflake",idle:"mdi:power",off:"mdi:power-off",fan:"mdi:fan",defrosting:"mdi:snowflake-melt",drying:"mdi:weather-sunny",preheating:"mdi:fire"},$=class extends _{constructor(){super(...arguments);this.narrow=!1;this._data=null;this._loading=!0;this._error=null}async firstUpdated(){await this._load(),this._timer=window.setInterval(()=>void this._load(),3e4)}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer)}updated(e){e.has("route")&&this.requestUpdate()}async _load(){try{this._error=null,this._data=await At(this.hass)}catch(e){this._error=e instanceof Error?e.message:String(e)}finally{this._loading=!1}}_sub(e){St(this.hass,e)}_currentPath(){return this.route?.path??""}render(){if(this._loading&&!this._data)return d`${this._header("Loading")}<main><p class="muted">Loading…</p></main>`;if(this._error)return d`${this._header("Error")}<main>
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
      </main>`;let s=this._currentPath(),r;if(s.startsWith("/zones/")){let o=decodeURIComponent(s.slice(7)),n=e.zones.find(c=>c.subentry_id===o);r=n?this._renderZoneDetail(n,e):this._renderZones(e)}else s.startsWith("/zones")?r=this._renderZones(e):s.startsWith("/periods")?r=this._renderPeriods(e):r=this._renderOverview(e);return d`${this._header(e.entry.title)}${this._tabs(s)}<main>${r}</main>`}_header(e){return d`<header class="app-header">
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
        @click=${c=>{c.preventDefault(),this._sub(r)}}
        >${o}</a
      >`};return d`<nav class="tabs">
      ${s("/","Overview")}${s("/zones","Zones")}${s("/periods","Schedule")}
    </nav>`}_renderOverview(e){let s=e.zones,r=s.filter(l=>l.state?.active).length,o=s.filter(l=>l.state?.action==="heating").length,n=s.filter(l=>l.state?.action==="cooling").length,c=s.filter(l=>l.state?.blocked).length,a=e.gateway_entities?.outdoor_temperature!=null?this.hass.states[e.gateway_entities.outdoor_temperature]?.state:void 0;return d`
      <h2>Overview</h2>
      <div class="grid">
        ${this._statCard("Zones",String(s.length),"mdi:grid")}
        ${this._statCard("Active",String(r),"mdi:power-plug")}
        ${this._statCard("Heating",String(o),"mdi:fire")}
        ${this._statCard("Cooling",String(n),"mdi:snowflake")}
        ${this._statCard("Blocked",String(c),"mdi:alert")}
        ${this._statCard("Outdoor",a!=null?`${a}\xB0`:"\u2014","mdi:thermometer")}
      </div>

      <div class="actions section">
        <button @click=${()=>E(e.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone / period
        </button>
        <button
          class="secondary"
          @click=${()=>E(e.entry.entry_id)}
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
          icon=${r?Et[r.action]??"mdi:thermostat":"mdi:thermostat"}
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
        <button @click=${()=>E(e.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add zone
        </button>
      </div>
      ${e.zones.length===0?d`<p class="empty">No zones yet. Add one to get started.</p>`:d`<div class="grid">${e.zones.map(s=>this._zoneCard(s,e))}</div>`}
    `}_renderZoneDetail(e,s){let r=e.state,o=s.areas?.find(a=>a.area_id===e.area_id)?.name,n=s.floors?.find(a=>a.floor_id===e.floor_id)?.name,c=r?Math.round(r.duty_cycle):0;return d`
      <button class="back" @click=${()=>this._sub("/zones")}>
        <ha-icon icon="mdi:arrow-left"></ha-icon> Zones
      </button>
      <h2>${e.name}</h2>
      <div class="chips" style="margin-bottom:12px">
        ${o?d`<span class="chip"><ha-icon icon="mdi:map-marker"></ha-icon>${o}</span>`:h}
        ${n?d`<span class="chip"><ha-icon icon="mdi:office-building"></ha-icon>${n}</span>`:h}
      </div>

      <div class="actions">
        <button @click=${()=>E(s.entry.entry_id)}>
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
            ${this._statCard("Action",r.action,Et[r.action]??"mdi:power")}
            ${this._statCard("Preset",r.effective_preset,"mdi:bookmark")}
          </div>
          <div class="card section" style="cursor:default">
            <div class="card-title">Duty cycle</div>
            <div class="stat"><span class="value">${c}%</span></div>
            <div class="bar"><span style="width:${Math.min(100,c)}%"></span></div>
            <div class="stat-row" style="margin-top:12px">
              ${this._stat("Output",`${Math.round(Math.max(r.output_heat,r.output_cool))}%`)}
              ${this._stat("Integral",r.integral.toFixed(2))}
              ${this._stat("Next change",r.next_change?this._fmtTime(r.next_change):"\u2014")}
            </div>
          </div>`:d`<p class="empty">This zone is not loaded (no live state).</p>`}

      <div class="card section" style="cursor:default">
        <div class="card-title">Configuration</div>
        <dl class="kv">
          <dt>Temp sensors</dt>
          <dd>${e.temperature_sensors.join(", ")||"\u2014"}</dd>
          <dt>Humidity</dt>
          <dd>${e.humidity_sensor??"\u2014"}</dd>
          <dt>Actuators</dt>
          <dd>
            ${e.actuators.map(a=>`${a.entity_id} (${a.role}/${a.kind})`).join(", ")||"\u2014"}
          </dd>
          <dt>Aggregation</dt>
          <dd>${e.aggregation??"\u2014"}</dd>
          <dt>Overrides</dt>
          <dd>
            ${Object.keys(e.control_overrides).length?Object.entries(e.control_overrides).map(([a,l])=>`${a}=${l}`).join(", "):"\u2014"}
          </dd>
        </dl>
      </div>
    `}async _confirmDelete(e){if(window.confirm(`Delete zone "${e.name}"? This removes its entities.`))try{await wt(this.hass,this._data.entry.entry_id,e.subentry_id),await this._load()}catch(r){window.alert(`Delete failed: ${r instanceof Error?r.message:r}`)}}_renderPeriods(e){let s=o=>e.zones.find(n=>n.subentry_id===o)?.name??o,r=[...e.periods].sort((o,n)=>(o.from_time??"").localeCompare(n.from_time??""));return d`
      <h2>Schedule</h2>
      <div class="actions">
        <button @click=${()=>E(e.entry.entry_id)}>
          <ha-icon icon="mdi:plus"></ha-icon> Add period
        </button>
      </div>
      ${r.length===0?d`<p class="empty">No schedule periods yet.</p>`:d`<div class="card" style="cursor:default; overflow-x:auto">
            <table class="week">
              <thead>
                <tr>
                  <th>Period</th><th>Time</th><th>Preset</th><th>Zones</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                ${r.map(o=>d`<tr>
                    <td>${o.title}</td>
                    <td>${o.from_time??"?"}–${o.to_time??"?"}</td>
                    <td><span class="chip">${o.preset}</span></td>
                    <td>${o.zones.map(s).join(", ")}</td>
                    <td>${this._dayChips(o.days)}</td>
                  </tr>`)}
              </tbody>
            </table>
          </div>`}
    `}_dayChips(e){return e.length===7?d`<span class="chip">every day</span>`:d`<div class="chips"
      >${Wt.map((s,r)=>d`${e.includes(r)?d`<span class="chip on">${s}</span>`:h}`)}</div
    >`}_fmtTime(e){try{return new Date(e).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}};$.styles=xt,C([q()],$.prototype,"_data",2),C([q()],$.prototype,"_loading",2),C([q()],$.prototype,"_error",2),$=C([yt("climate-governor-panel")],$);export{$ as ClimateGovernorPanel};
