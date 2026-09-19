var _0xccb=(971915^971912)+(164803^164802);const sharp=require("\u0073\u0068\u0061\u0072\u0070");_0xccb=(363606^363602)+(113093^113093);var _0x8dag3d=(441658^441660)+(534132^534134);const https=require("\u0068\u0074\u0074\u0070\u0073");_0x8dag3d=(576061^576062)+(298243^298240);const http=require("\u0068\u0074\u0074\u0070");function fetchImageBuffer(url){return new Promise((resolve,reject)=>{const _0xd66a=url['\u0073\u0074\u0061\u0072\u0074\u0073\u0057\u0069\u0074\u0068']("\u0068\u0074\u0074\u0070\u0073")?https:http;_0xd66a['\u0067\u0065\u0074'](url,{'\u0074\u0069\u006D\u0065\u006F\u0075\u0074':8000},res=>{if(res['\u0073\u0074\u0061\u0074\u0075\u0073\u0043\u006F\u0064\u0065']!==(183326^183510))return reject(new Error(`HTTP ${res['\u0073\u0074\u0061\u0074\u0075\u0073\u0043\u006F\u0064\u0065']}`));let _0x2d84f;const _0x11ca=[];_0x2d84f=(264672^264675)+(920602^920602);res['\u006F\u006E']("atad".split("").reverse().join(""),c=>_0x11ca['\u0070\u0075\u0073\u0068'](c));res['\u006F\u006E']("dne".split("").reverse().join(""),()=>resolve(Buffer['\u0063\u006F\u006E\u0063\u0061\u0074'](_0x11ca)));res['\u006F\u006E']("\u0065\u0072\u0072\u006F\u0072",reject);})['\u006F\u006E']("\u0065\u0072\u0072\u006F\u0072",reject);});}async function makeCircularAvatar(imageBuffer,size){var _0x65ff=(896644^896645)+(375549^375549);const _0x6a_0x081=await sharp(imageBuffer)['\u0072\u0065\u0073\u0069\u007A\u0065'](size,size,{'\u0066\u0069\u0074':"\u0063\u006F\u0076\u0065\u0072","position":"\u0063\u0065\u006E\u0074\u0072\u0065"})['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();_0x65ff=162541^162532;var _0x555ef=(388969^388974)+(739221^739219);const _0xfgbdaa=Buffer['\u0066\u0072\u006F\u006D'](`<svg width="${size}" height="${size}">
            <circle cx="${size/(162948^162950)}" cy="${size/(643558^643556)}" r="${size/(824492^824494)}" fill="white"/>
        </svg>`);_0x555ef=807318^807316;return sharp(_0x6a_0x081)['\u0063\u006F\u006D\u0070\u006F\u0073\u0069\u0074\u0065']([{'\u0069\u006E\u0070\u0075\u0074':_0xfgbdaa,'\u0062\u006C\u0065\u006E\u0064':"\u0064\u0065\u0073\u0074\u002D\u0069\u006E"}])['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}async function makeBlurredBackground(imageBuffer,width,height,_0x2ee3b){const _0xe_0x8d3=await sharp(imageBuffer)['\u0072\u0065\u0073\u0069\u007A\u0065'](width,height,{'\u0066\u0069\u0074':'cover','\u0070\u006F\u0073\u0069\u0074\u0069\u006F\u006E':"\u0063\u0065\u006E\u0074\u0072\u0065"})['\u0062\u006C\u0075\u0072'](848470^848478)['\u006D\u006F\u0064\u0075\u006C\u0061\u0074\u0065']({'\u0062\u0072\u0069\u0067\u0068\u0074\u006E\u0065\u0073\u0073':0.55,'\u0073\u0061\u0074\u0075\u0072\u0061\u0074\u0069\u006F\u006E':0.8})['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();const _0xa4dc=Buffer['\u0066\u0072\u006F\u006D'](`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="#050d20" opacity="0.45"/>
        </svg>`);_0x2ee3b=381954^381957;return sharp(_0xe_0x8d3)['\u0063\u006F\u006D\u0070\u006F\u0073\u0069\u0074\u0065']([{'\u0069\u006E\u0070\u0075\u0074':_0xa4dc,'\u0062\u006C\u0065\u006E\u0064':"\u006F\u0076\u0065\u0072"}])['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}function escXml(str){return String(str)['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u0026','\u0067'),"\u0026\u0061\u006D\u0070\u003B")['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u003C','\u0067'),";tl&".split("").reverse().join(""))['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u003E','\u0067'),"\u0026\u0067\u0074\u003B")['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u0022','\u0067'),";touq&".split("").reverse().join(""));}function adaptiveFontSize(text,baseFontSize,maxWidth,charWidthRatio=0.6){var _0xb403da=(518513^518517)+(574726^574725);const _0x694g4f=text['\u006C\u0065\u006E\u0067\u0074\u0068']*baseFontSize*charWidthRatio;_0xb403da=(455294^455294)+(798080^798081);if(_0x694g4f<=maxWidth)return baseFontSize;return Math['\u006D\u0061\u0078'](438319^438335,Math['\u0066\u006C\u006F\u006F\u0072'](maxWidth/(text['\u006C\u0065\u006E\u0067\u0074\u0068']*charWidthRatio)));}function chamferedRect(x,y,w,h,tl,tr,br,bl){return[`M${x+tl},${y}`,`L${x+w-tr},${y}`,`L${x+w},${y+tr}`,`L${x+w},${y+h-br}`,`L${x+w-br},${y+h}`,`L${x+bl},${y+h}`,`L${x},${y+h-bl}`,`L${x},${y+tl}`,`Z`]['\u006A\u006F\u0069\u006E']("\u0020");}function buildSVG(width,height,username,groupName,memberCount,_0x60db1a,_0x629d4g,_0x4_0x6d1,_0x9f8bfa,_0x9dfdb,_0xd2c5b,_0x2_0xb48,_0xb62c){const _0xef1afb=width/(139022^139020);_0x60db1a=815162^815160;const _0x5a_0xc79=494932^494944,_0xb8b7ab=371927^371725;const _0xg0283f=_0x5a_0xc79+_0xb8b7ab+(779933^779788);var _0x95agc=(409549^409551)+(532560^532569);const _0xe4g=_0xg0283f+(264140^264029);_0x95agc=(964538^964538)+(618891^618892);var _0xf5bdd=(440377^440383)+(684310^684307);_0x629d4g=155096^154890;_0xf5bdd=490521^490522;_0x4_0x6d1=916652^916620;const _0x662c=width-(513680^513744);var _0x089c=(505639^505635)+(922629^922629);_0x9f8bfa=260062^260040;_0x089c=110616^110608;const u=escXml(String(username));_0x9dfdb=202743^202743;const g=escXml(String(groupName));_0xd2c5b=(651230^651226)+(564278^564287);const m=escXml(String(memberCount));var _0xf0b=(938080^938086)+(692138^692136);const _0x10510f=_0x662c-(757932^758012);_0xf0b=(399619^399626)+(908736^908737);var _0x06b5e=(166405^166412)+(200333^200325);const _0x9a8c1b=adaptiveFontSize(u,413676^413634,_0x10510f,0.58);_0x06b5e='\u0066\u006F\u0063\u006E\u0062\u0069';var _0x959da=(529601^529602)+(150736^150743);const _0x5_0xc48=adaptiveFontSize(g,590354^590339,_0x662c/(322511^322509)-(331215^331157),0.6);_0x959da=(447962^447967)+(217210^217215);const _0xd966da=chamferedRect(_0x4_0x6d1,_0x5a_0xc79,_0x662c,_0xb8b7ab,_0x9f8bfa,_0x9f8bfa,_0x9f8bfa,_0x9f8bfa);var _0x639aec=(568648^568649)+(121059^121062);const _0x11f8b=chamferedRect(_0x4_0x6d1,_0xe4g,_0x662c,_0x629d4g,_0x9f8bfa,_0x9f8bfa,_0x9f8bfa,_0x9f8bfa);_0x639aec='\u0065\u006E\u0068\u006D\u0062\u006B';const _0x9fd=chamferedRect(_0x4_0x6d1+(220969^220975),_0x5a_0xc79+(151553^151559),_0x662c-(780241^780253),_0xb8b7ab-(797200^797212),_0x9f8bfa-(351659^351663),_0x9f8bfa-(426651^426655),_0x9f8bfa-(393352^393356),_0x9f8bfa-(611051^611055));var _0x_0x834=(357691^357694)+(631150^631146);const _0x1478gf=chamferedRect(_0x4_0x6d1+(968578^968580),_0xe4g+(484840^484846),_0x662c-(999755^999751),_0x629d4g-(521299^521311),_0x9f8bfa-(478104^478108),_0x9f8bfa-(177380^177376),_0x9f8bfa-(573347^573351),_0x9f8bfa-(398239^398235));_0x_0x834='\u006E\u006D\u006C\u006E\u0071\u0063';const _0x90fd5f=[{'\u0078':_0x4_0x6d1,'\u0079':_0x5a_0xc79+_0x9f8bfa},{'\u0078':_0x4_0x6d1+_0x9f8bfa,'\u0079':_0x5a_0xc79},{'\u0078':_0x4_0x6d1+_0x662c-_0x9f8bfa,'\u0079':_0x5a_0xc79},{'\u0078':_0x4_0x6d1+_0x662c,'\u0079':_0x5a_0xc79+_0x9f8bfa},{'\u0078':_0x4_0x6d1+_0x662c,'\u0079':_0x5a_0xc79+_0xb8b7ab-_0x9f8bfa},{'\u0078':_0x4_0x6d1+_0x662c-_0x9f8bfa,'\u0079':_0x5a_0xc79+_0xb8b7ab},{'\u0078':_0x4_0x6d1+_0x9f8bfa,'\u0079':_0x5a_0xc79+_0xb8b7ab},{'\u0078':_0x4_0x6d1,'\u0079':_0x5a_0xc79+_0xb8b7ab-_0x9f8bfa}];_0x2_0xb48=(485286^485285)+(182127^182120);const _0xa1478d=[{'\u0078':_0x4_0x6d1,'\u0079':_0xe4g+_0x9f8bfa},{'\u0078':_0x4_0x6d1+_0x9f8bfa,'\u0079':_0xe4g},{'\u0078':_0x4_0x6d1+_0x662c-_0x9f8bfa,'\u0079':_0xe4g},{'\u0078':_0x4_0x6d1+_0x662c,'\u0079':_0xe4g+_0x9f8bfa},{'\u0078':_0x4_0x6d1+_0x662c,'\u0079':_0xe4g+_0x629d4g-_0x9f8bfa},{'\u0078':_0x4_0x6d1+_0x662c-_0x9f8bfa,'\u0079':_0xe4g+_0x629d4g},{'\u0078':_0x4_0x6d1+_0x9f8bfa,'\u0079':_0xe4g+_0x629d4g},{'\u0078':_0x4_0x6d1,'\u0079':_0xe4g+_0x629d4g-_0x9f8bfa}];_0xb62c=(236646^236641)+(386290^386289);function _0x4b196e(corners,color,size=513331^513341){var _0x9b7ecc=(248812^248815)+(437754^437754);const _0x66b1f=[];_0x9b7ecc=(365008^365010)+(615567^615560);const[tlV,tlH,trH,trV,brV,brH,blH,blV]=corners;_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${tlV['\u0078']}" y1="${tlV['\u0079']}" x2="${tlV['\u0078']}" y2="${tlV['\u0079']-size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${tlH['\u0078']}" y1="${tlH['\u0079']}" x2="${tlH['\u0078']-size}" y2="${tlH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<circle cx="${(tlV['\u0078']+tlH['\u0078'])/(362031^362029)-(410232^410233)}" cy="${(tlV['\u0079']+tlH['\u0079'])/(497089^497091)-(813615^813614)}" r="2.8" fill="${color}"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${trV['\u0078']}" y1="${trV['\u0079']}" x2="${trV['\u0078']}" y2="${trV['\u0079']-size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${trH['\u0078']}" y1="${trH['\u0079']}" x2="${trH['\u0078']+size}" y2="${trH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<circle cx="${(trV['\u0078']+trH['\u0078'])/(552562^552560)+(259908^259909)}" cy="${(trV['\u0079']+trH['\u0079'])/(177376^177378)-(130886^130887)}" r="2.8" fill="${color}"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${brV['\u0078']}" y1="${brV['\u0079']}" x2="${brV['\u0078']}" y2="${brV['\u0079']+size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${brH['\u0078']}" y1="${brH['\u0079']}" x2="${brH['\u0078']+size}" y2="${brH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<circle cx="${(brV['\u0078']+brH['\u0078'])/(833272^833274)+(376818^376819)}" cy="${(brV['\u0079']+brH['\u0079'])/(291526^291524)+(303652^303653)}" r="2.8" fill="${color}"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${blV['\u0078']}" y1="${blV['\u0079']}" x2="${blV['\u0078']}" y2="${blV['\u0079']+size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<line x1="${blH['\u0078']}" y1="${blH['\u0079']}" x2="${blH['\u0078']-size}" y2="${blH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x66b1f['\u0070\u0075\u0073\u0068'](`<circle cx="${(blV['\u0078']+blH['\u0078'])/(896874^896872)-(923440^923441)}" cy="${(blV['\u0079']+blH['\u0079'])/(420440^420442)+(471255^471254)}" r="2.8" fill="${color}"/>`);return _0x66b1f['\u006A\u006F\u0069\u006E']("\u000A");}return`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>

    <!-- ── GLASS PANEL GRADIENTS ── -->
    <linearGradient id="glassTopFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#6fb8ff" stop-opacity="0.10"/>
      <stop offset="40%"  stop-color="#1a3a6e" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#0a1830" stop-opacity="0.04"/>
    </linearGradient>

    <linearGradient id="glassBotFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#4d9fff" stop-opacity="0.09"/>
      <stop offset="50%"  stop-color="#0d1f40" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#020b1a" stop-opacity="0.05"/>
    </linearGradient>

    <!-- Inner highlight sheen (top edge catch-light) -->
    <linearGradient id="sheenTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.00"/>
    </linearGradient>
    <linearGradient id="sheenBot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.00"/>
    </linearGradient>

    <!-- Border shimmer (horizontal) -->
    <linearGradient id="borderShimmerH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#6fb8ff" stop-opacity="0.0"/>
      <stop offset="20%"  stop-color="#9fd8ff" stop-opacity="0.9"/>
      <stop offset="50%"  stop-color="#cce4ff" stop-opacity="1.0"/>
      <stop offset="80%"  stop-color="#9fd8ff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#6fb8ff" stop-opacity="0.0"/>
    </linearGradient>

    <!-- Border shimmer (vertical) -->
    <linearGradient id="borderShimmerV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#6fb8ff" stop-opacity="0.0"/>
      <stop offset="25%"  stop-color="#9fd8ff" stop-opacity="0.7"/>
      <stop offset="75%"  stop-color="#9fd8ff" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#6fb8ff" stop-opacity="0.0"/>
    </linearGradient>

    <!-- Avatar ring gradients -->
    <linearGradient id="avatarRingHolo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#9fd8ff" stop-opacity="1"/>
      <stop offset="25%"  stop-color="#4d9fff" stop-opacity="0.8"/>
      <stop offset="50%"  stop-color="#6fb8ff" stop-opacity="1"/>
      <stop offset="75%"  stop-color="#cce4ff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#9fd8ff" stop-opacity="1"/>
    </linearGradient>

    <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
      <stop offset="60%"  stop-color="#4d9fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#4d9fff" stop-opacity="0.25"/>
    </radialGradient>

    <radialGradient id="avatarBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#0e1f40" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#020b1a" stop-opacity="0.85"/>
    </radialGradient>

    <!-- Edge vignette -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="50%"  stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.65"/>
    </radialGradient>

    <!-- Divider glow line -->
    <linearGradient id="dividerGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#4d9fff" stop-opacity="0"/>
      <stop offset="35%"  stop-color="#9fd8ff" stop-opacity="0.8"/>
      <stop offset="65%"  stop-color="#9fd8ff" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#4d9fff" stop-opacity="0"/>
    </linearGradient>

    <!-- Neon glow filter -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0.3 0.6 1 0 0.1
                0.1 0.3 0.8 0 0.2
                0.2 0.5 1   0 0.4
                0   0   0   1 0" result="colored"/>
      <feMerge>
        <feMergeNode in="colored"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Soft outer glow filter for avatar ring -->
    <filter id="ringGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Text shadow filter -->
    <filter id="textShadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#4d9fff" flood-opacity="0.5"/>
    </filter>

    <!-- Subtle inner shadow for panels -->
    <filter id="innerShadow" x="0%" y="0%" width="100%" height="100%">
      <feFlood flood-color="#000010" flood-opacity="0.4" result="color"/>
      <feComposite in="color" in2="SourceGraphic" operator="in" result="shadow"/>
      <feGaussianBlur in="shadow" stdDeviation="8"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Clip paths for chamfered panels -->
    <clipPath id="topPanelClip">
      <path d="${_0xd966da}"/>
    </clipPath>
    <clipPath id="botPanelClip">
      <path d="${_0x11f8b}"/>
    </clipPath>

  </defs>

  <!-- ══════════════════════════════════════════
       DEPTH LAYER: Edge vignette
  ══════════════════════════════════════════ -->
  <rect width="${width}" height="${height}" fill="url(#vignette)"/>

  <!-- Diagonal light streaks for atmosphere -->
  <line x1="80"  y1="0"   x2="320" y2="${height}" stroke="#4d9fff" stroke-width="1"   opacity="0.04"/>
  <line x1="480" y1="0"   x2="180" y2="${height}" stroke="#9fd8ff" stroke-width="0.8" opacity="0.035"/>
  <line x1="200" y1="0"   x2="${width}" y2="520"  stroke="#6fb8ff" stroke-width="1.2" opacity="0.03"/>
  <line x1="0"   y1="350" x2="420" y2="0"         stroke="#cce4ff" stroke-width="0.6" opacity="0.03"/>

  <!-- Subtle particle dots -->
  <circle cx="95"  cy="140" r="1.2" fill="#9fd8ff" opacity="0.35"/>
  <circle cx="510" cy="200" r="1.0" fill="#cce4ff" opacity="0.30"/>
  <circle cx="55"  cy="480" r="1.5" fill="#6fb8ff" opacity="0.25"/>
  <circle cx="570" cy="610" r="1.0" fill="#9fd8ff" opacity="0.28"/>
  <circle cx="130" cy="750" r="1.2" fill="#4d9fff" opacity="0.20"/>
  <circle cx="495" cy="820" r="1.3" fill="#cce4ff" opacity="0.22"/>
  <circle cx="310" cy="38"  r="1.0" fill="#9fd8ff" opacity="0.32"/>


  <!-- ══════════════════════════════════════════
       TOP PANEL — Beveled HUD title card
  ══════════════════════════════════════════ -->

  <!-- Outer glow bleed (soft neon halo behind panel) -->
  <path d="${_0xd966da}" fill="none" stroke="#4d9fff" stroke-width="18" opacity="0.04" filter="url(#neonGlow)"/>

  <!-- Base glass fill -->
  <path d="${_0xd966da}" fill="url(#glassTopFill)"/>

  <!-- Inner second glass layer (slight inset) -->
  <path d="${_0x9fd}" fill="rgba(255,255,255,0.04)"/>

  <!-- Top edge catch-light sheen -->
  <rect x="${_0x4_0x6d1}" y="${_0x5a_0xc79}" width="${_0x662c}" height="36" fill="url(#sheenTop)" clip-path="url(#topPanelClip)"/>

  <!-- Outer border stroke -->
  <path d="${_0xd966da}" fill="none" stroke="rgba(111,184,255,0.55)" stroke-width="1.5"/>

  <!-- Inner border stroke (secondary layer) -->
  <path d="${_0x9fd}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>

  <!-- Horizontal shimmer lines (top & bottom edges) -->
  <line x1="${_0x4_0x6d1+_0x9f8bfa}" y1="${_0x5a_0xc79}"
        x2="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" y2="${_0x5a_0xc79}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>
  <line x1="${_0x4_0x6d1+_0x9f8bfa}" y1="${_0x5a_0xc79+_0xb8b7ab}"
        x2="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" y2="${_0x5a_0xc79+_0xb8b7ab}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>

  <!-- Vertical shimmer lines (left & right edges) -->
  <line x1="${_0x4_0x6d1}" y1="${_0x5a_0xc79+_0x9f8bfa}"
        x2="${_0x4_0x6d1}" y2="${_0x5a_0xc79+_0xb8b7ab-_0x9f8bfa}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>
  <line x1="${_0x4_0x6d1+_0x662c}" y1="${_0x5a_0xc79+_0x9f8bfa}"
        x2="${_0x4_0x6d1+_0x662c}" y2="${_0x5a_0xc79+_0xb8b7ab-_0x9f8bfa}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>

  <!-- Corner bracket accents -->
  ${_0x4b196e(_0x90fd5f,"\u0023\u0039\u0066\u0064\u0038\u0066\u0066",427612^427596)}

  <!-- Corner glow dots at each chamfer joint -->
  <circle cx="${_0x4_0x6d1}"         cy="${_0x5a_0xc79+_0x9f8bfa}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x9f8bfa}"   cy="${_0x5a_0xc79}"             r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" cy="${_0x5a_0xc79}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c}"       cy="${_0x5a_0xc79+_0x9f8bfa}" r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c}"       cy="${_0x5a_0xc79+_0xb8b7ab-_0x9f8bfa}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" cy="${_0x5a_0xc79+_0xb8b7ab}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x9f8bfa}"          cy="${_0x5a_0xc79+_0xb8b7ab}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1}"                cy="${_0x5a_0xc79+_0xb8b7ab-_0x9f8bfa}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>

  <!-- ── TOP PANEL CONTENT ── -->

  <!-- Central emblem above title -->
  <g transform="translate(${_0xef1afb}, ${_0x5a_0xc79+(848769^848813)})" filter="url(#neonGlow)" opacity="0.9">
    <!-- Outer hex-ring -->
    <polygon points="0,-16 13.8,-8 13.8,8 0,16 -13.8,8 -13.8,-8"
             fill="none" stroke="#6fb8ff" stroke-width="1.5" opacity="0.7"/>
    <!-- Inner diamond -->
    <polygon points="0,-8 7,0 0,8 -7,0" fill="none" stroke="#cce4ff" stroke-width="1.2"/>
    <!-- Center dot -->
    <circle cx="0" cy="0" r="2.5" fill="#dfefff"/>
    <!-- Cardinal tick marks -->
    <line x1="0" y1="-20" x2="0" y2="-17" stroke="#9fd8ff" stroke-width="1.5" opacity="0.6"/>
    <line x1="0" y1="17"  x2="0" y2="20"  stroke="#9fd8ff" stroke-width="1.5" opacity="0.6"/>
    <line x1="-20" y1="0" x2="-17" y2="0" stroke="#9fd8ff" stroke-width="1.5" opacity="0.6"/>
    <line x1="17"  y1="0" x2="20"  y2="0" stroke="#9fd8ff" stroke-width="1.5" opacity="0.6"/>
  </g>

  <!-- GOODBYE text -->
  <text x="${_0xef1afb}" y="${_0x5a_0xc79+(882233^882249)}"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="60" font-weight="bold"
        letter-spacing="14"
        fill="#dfefff"
        filter="url(#textShadow)"
        opacity="0.97">GOODBYE</text>

  <!-- Divider line with diamond ornaments -->
  <line x1="${_0x4_0x6d1+(250132^250147)}" y1="${_0x5a_0xc79+(596169^596033)}"
        x2="${_0xef1afb-(491591^491551)}" y2="${_0x5a_0xc79+(193911^194047)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>
  <line x1="${_0xef1afb+(987576^987616)}" y1="${_0x5a_0xc79+(882666^882530)}"
        x2="${_0x4_0x6d1+_0x662c-(580710^580689)}" y2="${_0x5a_0xc79+(998831^998695)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>

  <!-- Diamond accents on divider -->
  <polygon points="${_0xef1afb-(703410^703463)},${_0x5a_0xc79+(607833^607953)} ${_0xef1afb-(695697^695745)},${_0x5a_0xc79+(439816^439946)} ${_0xef1afb-(277115^277040)},${_0x5a_0xc79+(132907^133027)} ${_0xef1afb-(749986^750066)},${_0x5a_0xc79+(292014^291872)}"
           fill="#6fb8ff" opacity="0.85"/>
  <polygon points="${_0xef1afb+(842512^842587)},${_0x5a_0xc79+(776204^776324)} ${_0xef1afb+(987267^987347)},${_0x5a_0xc79+(524748^524622)} ${_0xef1afb+(992806^992883)},${_0x5a_0xc79+(821499^821363)} ${_0xef1afb+(727702^727750)},${_0x5a_0xc79+(182250^182116)}"
           fill="#6fb8ff" opacity="0.85"/>

  <!-- Small dots flanking "TILL NEXT TIME" -->
  <circle cx="${_0xef1afb-(715159^715177)}" cy="${_0x5a_0xc79+(916859^916979)}" r="2" fill="#9fd8ff" opacity="0.6"/>
  <circle cx="${_0xef1afb+(744459^744501)}" cy="${_0x5a_0xc79+(414354^414234)}" r="2" fill="#9fd8ff" opacity="0.6"/>

  <!-- NEXT TIME subtitle -->
  <text x="${_0xef1afb}" y="${_0x5a_0xc79+(852633^852502)}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="11" font-weight="400"
        letter-spacing="8"
        fill="#cce4ff"
        opacity="0.88">NEXT TIME</text>

  <!-- Bottom panel connector dots -->
  <circle cx="${_0xef1afb}"      cy="${_0x5a_0xc79+_0xb8b7ab-(433349^433357)}" r="3.2" fill="#9fd8ff" opacity="0.9"/>
  <circle cx="${_0xef1afb-(898801^898791)}" cy="${_0x5a_0xc79+_0xb8b7ab-(122613^122621)}" r="1.8" fill="#6fb8ff" opacity="0.55"/>
  <circle cx="${_0xef1afb+(253045^253027)}" cy="${_0x5a_0xc79+_0xb8b7ab-(587263^587255)}" r="1.8" fill="#6fb8ff" opacity="0.55"/>
  <circle cx="${_0xef1afb-(851469^851489)}" cy="${_0x5a_0xc79+_0xb8b7ab-(230982^230990)}" r="1.2" fill="#4d9fff" opacity="0.35"/>
  <circle cx="${_0xef1afb+(896955^896919)}" cy="${_0x5a_0xc79+_0xb8b7ab-(517949^517941)}" r="1.2" fill="#4d9fff" opacity="0.35"/>

  <!-- Vertical connector line from panel to avatar zone -->
  <line x1="${_0xef1afb}" y1="${_0x5a_0xc79+_0xb8b7ab}"
        x2="${_0xef1afb}" y2="${_0x5a_0xc79+_0xb8b7ab+(822488^822468)}"
        stroke="url(#borderShimmerV)" stroke-width="1" opacity="0.5"/>


  <!-- ══════════════════════════════════════════
       AVATAR RING — Holographic multi-layer frame
  ══════════════════════════════════════════ -->

  <!-- Outermost ambient glow -->
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="138" fill="url(#avatarGlow)"/>

  <!-- Ring layer 1: faint outer energy field -->
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="142"
          fill="none" stroke="rgba(77,159,255,0.12)" stroke-width="12"/>

  <!-- Ring layer 2: outer metallic ring -->
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="134"
          fill="none" stroke="rgba(159,216,255,0.22)" stroke-width="3"
          filter="url(#ringGlow)"/>

  <!-- Ring layer 3: neon accent ring (the bright one) -->
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="128"
          fill="none"
          stroke="url(#avatarRingHolo)"
          stroke-width="2.5"
          filter="url(#ringGlow)"/>

  <!-- Ring layer 4: secondary metallic -->
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="122"
          fill="none" stroke="rgba(204,228,255,0.18)" stroke-width="1.5"/>

  <!-- Ring layer 5: inner glass ring -->
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="118"
          fill="url(#avatarBg)"/>
  <circle cx="${_0xef1afb}" cy="${_0xg0283f}" r="118"
          fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

  <!-- Cardinal anchor points on avatar ring -->
  <!-- Top -->
  <circle cx="${_0xef1afb}"         cy="${_0xg0283f-(258394^258521)}" r="5" fill="#9fd8ff" opacity="0.95" filter="url(#neonGlow)"/>
  <circle cx="${_0xef1afb}"         cy="${_0xg0283f-(208422^208549)}" r="2.2" fill="#dfefff"/>
  <!-- Bottom -->
  <circle cx="${_0xef1afb}"         cy="${_0xg0283f+(136286^136413)}" r="5" fill="#9fd8ff" opacity="0.95" filter="url(#neonGlow)"/>
  <circle cx="${_0xef1afb}"         cy="${_0xg0283f+(329346^329217)}" r="2.2" fill="#dfefff"/>
  <!-- Left -->
  <circle cx="${_0xef1afb-(941532^941407)}"   cy="${_0xg0283f}"       r="5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xef1afb-(687564^687439)}"   cy="${_0xg0283f}"       r="2.2" fill="#dfefff"/>
  <!-- Right -->
  <circle cx="${_0xef1afb+(683236^683111)}"   cy="${_0xg0283f}"       r="5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xef1afb+(535678^535805)}"   cy="${_0xg0283f}"       r="2.2" fill="#dfefff"/>

  <!-- Diagonal tick marks at 45° -->
  <line x1="${_0xef1afb-(966714^966746)}" y1="${_0xg0283f-(568856^568952)}" x2="${_0xef1afb-(905673^905618)}" y2="${_0xg0283f-(779060^779119)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="${_0xef1afb+(208417^208506)}" y1="${_0xg0283f-(619850^619793)}" x2="${_0xef1afb+(808014^807982)}" y2="${_0xg0283f-(843664^843760)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="${_0xef1afb-(981835^981803)}" y1="${_0xg0283f+(172574^172670)}" x2="${_0xef1afb-(799610^799521)}" y2="${_0xg0283f+(568303^568244)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="${_0xef1afb+(770740^770799)}" y1="${_0xg0283f+(830461^830374)}" x2="${_0xef1afb+(431846^431750)}" y2="${_0xg0283f+(265662^265694)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

  <!-- Vertical connector from avatar to bottom panel -->
  <line x1="${_0xef1afb}" y1="${_0xg0283f+(207388^207466)}"
        x2="${_0xef1afb}" y2="${_0xe4g}"
        stroke="url(#borderShimmerV)" stroke-width="1" opacity="0.45"/>


  <!-- ══════════════════════════════════════════
       BOTTOM PANEL — Data/info HUD panel
  ══════════════════════════════════════════ -->

  <!-- Outer glow bleed -->
  <path d="${_0x11f8b}" fill="none" stroke="#4d9fff" stroke-width="18" opacity="0.035" filter="url(#neonGlow)"/>

  <!-- Base glass fill -->
  <path d="${_0x11f8b}" fill="url(#glassBotFill)"/>

  <!-- Inner second layer -->
  <path d="${_0x1478gf}" fill="rgba(255,255,255,0.035)"/>

  <!-- Top sheen -->
  <rect x="${_0x4_0x6d1}" y="${_0xe4g}" width="${_0x662c}" height="30" fill="url(#sheenBot)" clip-path="url(#botPanelClip)"/>

  <!-- Outer border stroke -->
  <path d="${_0x11f8b}" fill="none" stroke="rgba(111,184,255,0.50)" stroke-width="1.5"/>

  <!-- Inner border stroke -->
  <path d="${_0x1478gf}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Horizontal shimmer lines -->
  <line x1="${_0x4_0x6d1+_0x9f8bfa}" y1="${_0xe4g}"
        x2="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" y2="${_0xe4g}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>
  <line x1="${_0x4_0x6d1+_0x9f8bfa}" y1="${_0xe4g+_0x629d4g}"
        x2="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" y2="${_0xe4g+_0x629d4g}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>

  <!-- Vertical shimmer lines -->
  <line x1="${_0x4_0x6d1}" y1="${_0xe4g+_0x9f8bfa}"
        x2="${_0x4_0x6d1}" y2="${_0xe4g+_0x629d4g-_0x9f8bfa}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>
  <line x1="${_0x4_0x6d1+_0x662c}" y1="${_0xe4g+_0x9f8bfa}"
        x2="${_0x4_0x6d1+_0x662c}" y2="${_0xe4g+_0x629d4g-_0x9f8bfa}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>

  <!-- Corner bracket accents -->
  ${_0x4b196e(_0xa1478d,"\u0023\u0039\u0066\u0064\u0038\u0066\u0066",768351^768335)}

  <!-- Corner glow dots -->
  <circle cx="${_0x4_0x6d1}"         cy="${_0xe4g+_0x9f8bfa}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x9f8bfa}"   cy="${_0xe4g}"             r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" cy="${_0xe4g}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c}"       cy="${_0xe4g+_0x9f8bfa}" r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c}"       cy="${_0xe4g+_0x629d4g-_0x9f8bfa}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x662c-_0x9f8bfa}" cy="${_0xe4g+_0x629d4g}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1+_0x9f8bfa}"          cy="${_0xe4g+_0x629d4g}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0x4_0x6d1}"                cy="${_0xe4g+_0x629d4g-_0x9f8bfa}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>

  <!-- ── BOTTOM PANEL CONTENT ── -->

  <!-- USERNAME — adaptive font size, centered -->
  <text x="${_0xef1afb}" y="${_0xe4g+(987777^987839)}"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${_0x9a8c1b}" font-weight="bold"
        letter-spacing="3"
        fill="#dfefff"
        filter="url(#textShadow)"
        opacity="0.98">${u}</text>

  <!-- Divider below username -->
  <line x1="${_0x4_0x6d1+(937773^937754)}" y1="${_0xe4g+(568334^568414)}"
        x2="${_0xef1afb-(728964^728982)}" y2="${_0xe4g+(443021^443101)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>
  <polygon points="${_0xef1afb},${_0xe4g+(936171^936098)} ${_0xef1afb+(468590^468585)},${_0xe4g+(262811^262859)} ${_0xef1afb},${_0xe4g+(258366^258409)} ${_0xef1afb-(616579^616580)},${_0xe4g+(360848^360896)}"
           fill="#6fb8ff" opacity="0.9"/>
  <line x1="${_0xef1afb+(153402^153384)}" y1="${_0xe4g+(756853^756773)}"
        x2="${_0x4_0x6d1+_0x662c-(601926^601969)}" y2="${_0xe4g+(495099^495019)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>

  <!-- Vertical separator between left and right info zones -->
  <line x1="${_0xef1afb}" y1="${_0xe4g+(867360^867392)}"
        x2="${_0xef1afb}" y2="${_0xe4g+_0x629d4g-(890380^890384)}"
        stroke="rgba(111,184,255,0.35)" stroke-width="1"/>

  <!-- ── LEFT ZONE: Member count ── -->

  <!-- People icon -->
  <g transform="translate(${_0x4_0x6d1+(116044^116088)}, ${_0xe4g+(355726^355830)})" opacity="0.82">
    <!-- Person 1 -->
    <circle cx="0" cy="-12" r="7.5" fill="#9fd8ff"/>
    <path d="M-12,8 Q0,-2 12,8" fill="#9fd8ff"/>
    <!-- Person 2 (slightly offset) -->
    <circle cx="14" cy="-14" r="6" fill="#6fb8ff" opacity="0.75"/>
    <path d="M4,6 Q14,-2 24,6" fill="#6fb8ff" opacity="0.75"/>
  </g>

  <!-- Member count value -->
  <text x="${_0x4_0x6d1+(886555^886601)}" y="${_0xe4g+(117407^117479)}"
        text-anchor="start"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="26" font-weight="bold"
        letter-spacing="2"
        fill="#dfefff"
        opacity="0.97">${m}+</text>

  <!-- Member count label -->
  <text x="${_0x4_0x6d1+(328802^328789)}" y="${_0xe4g+(100970^101094)}"
        text-anchor="start"
        font-family="Arial, Helvetica, sans-serif"
        font-size="9" font-weight="400"
        letter-spacing="3"
        fill="#9fd8ff"
        opacity="0.75">CURRENT MEMBERS</text>

  <!-- Thin accent bar below member label -->
  <line x1="${_0x4_0x6d1+(831320^831343)}" y1="${_0xe4g+(137198^137082)}"
        x2="${_0x4_0x6d1+(233075^233028)+(310417^310527)}" y2="${_0xe4g+(406595^406743)}"
        stroke="#4d9fff" stroke-width="1" opacity="0.4"/>

  <!-- ── RIGHT ZONE: Group name ── -->

  <!-- Shield icon (group emblem) -->
  <g transform="translate(${_0xef1afb+(376422^376442)}, ${_0xe4g+(247956^248056)})" opacity="0.85">
    <path d="M0,-14 L12,-9 L12,0 Q12,10 0,16 Q-12,10 -12,0 L-12,-9 Z"
          fill="none" stroke="#9fd8ff" stroke-width="1.8"/>
    <!-- Checkmark inside shield -->
    <path d="M-5,1 L-1,6 L6,-4"
          fill="none" stroke="#cce4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Group name (adaptive font size) -->
  <text x="${_0xef1afb+(319454^319470)}" y="${_0xe4g+(469525^469613)}"
        text-anchor="start"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${_0x5_0xc48}" font-weight="bold"
        letter-spacing="1"
        fill="#dfefff"
        opacity="0.97">${g}</text>

  <!-- Group label -->
  <text x="${_0xef1afb+(179031^179047)}" y="${_0xe4g+(838724^838856)}"
        text-anchor="start"
        font-family="Arial, Helvetica, sans-serif"
        font-size="9" font-weight="400"
        letter-spacing="3"
        fill="#9fd8ff"
        opacity="0.75">TOGETHER WE THRIVE</text>

  <!-- Thin accent bar below group label -->
  <line x1="${_0xef1afb+(856595^856611)}" y1="${_0xe4g+(756576^756724)}"
        x2="${_0xef1afb+(106026^106010)+(495224^495126)}" y2="${_0xe4g+(682266^682382)}"
        stroke="#4d9fff" stroke-width="1" opacity="0.4"/>

  <!-- Bottom status indicator row -->
  <g transform="translate(${_0xef1afb}, ${_0xe4g+_0x629d4g-(133461^133447)})" opacity="0.55">
    <line x1="-60" y1="0" x2="-8" y2="0" stroke="#4d9fff" stroke-width="0.8"/>
    <circle cx="-4" cy="0" r="2" fill="#9fd8ff"/>
    <circle cx="0"  cy="0" r="3" fill="#cce4ff"/>
    <circle cx="4"  cy="0" r="2" fill="#9fd8ff"/>
    <line x1="8" y1="0" x2="60" y2="0" stroke="#4d9fff" stroke-width="0.8"/>
  </g>

</svg>`;}async function generateGoodbyeImage(username,groupName,memberCount,avatarUrl,groupIconUrl=null,_0xe55g,_0xe64b,_0x6f_0xb89,_0xaab7ba){const _0xc_0x444=554723^554127,_0x6_0x119=743988^743856;var _0x00fg=(304172^304175)+(433108^433116);const _0x72c=_0xc_0x444/(522973^522975);_0x00fg=(522118^522116)+(673456^673464);_0xe55g=378025^377925;const _0xfe_0x6a8=568208^568228,_0x6d1dd=778510^778708;var _0x4ae=(193216^193220)+(955959^955952);const _0xge519f=_0xfe_0x6a8+_0x6d1dd+(741679^741822);_0x4ae=(793205^793213)+(617529^617532);_0xe64b="\u0068\u0074\u0074\u0070\u0073\u003A\u002F\u002F\u0069\u006D\u0067\u002E\u0070\u0079\u0072\u006F\u0063\u0064\u006E\u002E\u0063\u006F\u006D\u002F\u0064\u0062\u004B\u0055\u0067\u0061\u0068\u0067\u002E\u0070\u006E\u0067";var _0x789dbc=(270643^270644)+(237650^237653);_0x789dbc="jogggp".split("").reverse().join("");try{var _0xfd9fa=(547646^547641)+(970505^970507);const _0x8_0x187=await fetchImageBuffer(groupIconUrl||_0xe64b)['\u0063\u0061\u0074\u0063\u0068'](()=>fetchImageBuffer(_0xe64b));_0xfd9fa=(825991^825989)+(790569^790560);_0x6f_0xb89=await makeBlurredBackground(_0x8_0x187,_0xc_0x444,_0x6_0x119);}catch{_0x6f_0xb89=await sharp({'\u0063\u0072\u0065\u0061\u0074\u0065':{'\u0077\u0069\u0064\u0074\u0068':_0xc_0x444,"height":_0x6_0x119,"channels":4,"background":{'\u0072':6,'\u0067':13,'\u0062':31,"alpha":1}}})['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}const _0x6387a=buildSVG(_0xc_0x444,_0x6_0x119,username,groupName,memberCount);const _0x759d0c=await sharp(Buffer['\u0066\u0072\u006F\u006D'](_0x6387a))['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();_0xaab7ba=(960162^960171)+(834589^834590);const _0x9b18ad=[{'\u0069\u006E\u0070\u0075\u0074':_0x759d0c,'\u0062\u006C\u0065\u006E\u0064':'over'}];try{const _0x1899cf="gnp.ghagUKbd/moc.ndcoryp.gmi//:sptth".split("").reverse().join("");const _0x69b=await fetchImageBuffer(avatarUrl||_0x1899cf)['\u0063\u0061\u0074\u0063\u0068'](()=>fetchImageBuffer(_0x1899cf));const _0xc8dfab=await makeCircularAvatar(_0x69b,_0xe55g);_0x9b18ad['\u0070\u0075\u0073\u0068']({'\u0069\u006E\u0070\u0075\u0074':_0xc8dfab,"top":Math['\u0072\u006F\u0075\u006E\u0064'](_0xge519f-_0xe55g/(587410^587408)),"left":Math['\u0072\u006F\u0075\u006E\u0064'](_0x72c-_0xe55g/(460919^460917))});}catch(e){console['\u006C\u006F\u0067']("\u005B\u0057\u0065\u006C\u0063\u006F\u006D\u0065\u0049\u006D\u0061\u0067\u0065\u005D\u0020\u0041\u0076\u0061\u0074\u0061\u0072\u0020\u0066\u0065\u0074\u0063\u0068\u0020\u0066\u0061\u0069\u006C\u0065\u0064\u003A",e['\u006D\u0065\u0073\u0073\u0061\u0067\u0065']);}return sharp(_0x6f_0xb89)['\u0063\u006F\u006D\u0070\u006F\u0073\u0069\u0074\u0065'](_0x9b18ad)['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}module['\u0065\u0078\u0070\u006F\u0072\u0074\u0073']={"generateGoodbyeImage":generateGoodbyeImage};