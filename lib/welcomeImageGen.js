let _0x7aa82f;const sharp=require("\u0073\u0068\u0061\u0072\u0070");_0x7aa82f=(708148^708157)+(631156^631154);var _0xda_0x454=(817447^817454)+(872285^872283);const https=require("\u0068\u0074\u0074\u0070\u0073");_0xda_0x454=(302542^302534)+(604005^604004);const http=require("\u0068\u0074\u0074\u0070");function fetchImageBuffer(url){return new Promise((resolve,reject)=>{const _0x9513bd=url['\u0073\u0074\u0061\u0072\u0074\u0073\u0057\u0069\u0074\u0068']("\u0068\u0074\u0074\u0070\u0073")?https:http;_0x9513bd['\u0067\u0065\u0074'](url,{'\u0074\u0069\u006D\u0065\u006F\u0075\u0074':8000},res=>{if(res['\u0073\u0074\u0061\u0074\u0075\u0073\u0043\u006F\u0064\u0065']!==(454629^454445))return reject(new Error(`HTTP ${res['\u0073\u0074\u0061\u0074\u0075\u0073\u0043\u006F\u0064\u0065']}`));var _0x1bddce=(874522^874514)+(107337^107339);const _0x70gdad=[];_0x1bddce=(372483^372484)+(377785^377784);res['\u006F\u006E']("atad".split("").reverse().join(""),c=>_0x70gdad['\u0070\u0075\u0073\u0068'](c));res['\u006F\u006E']("dne".split("").reverse().join(""),()=>resolve(Buffer['\u0063\u006F\u006E\u0063\u0061\u0074'](_0x70gdad)));res['\u006F\u006E']("rorre".split("").reverse().join(""),reject);})['\u006F\u006E']("rorre".split("").reverse().join(""),reject);});}async function makeCircularAvatar(imageBuffer,size){const _0x88g=await sharp(imageBuffer)['\u0072\u0065\u0073\u0069\u007A\u0065'](size,size,{"fit":"\u0063\u006F\u0076\u0065\u0072",'\u0070\u006F\u0073\u0069\u0074\u0069\u006F\u006E':'centre'})['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();const _0x96d7ab=Buffer['\u0066\u0072\u006F\u006D'](`<svg width="${size}" height="${size}">
            <circle cx="${size/(631815^631813)}" cy="${size/(845827^845825)}" r="${size/(563270^563268)}" fill="white"/>
        </svg>`);return sharp(_0x88g)['\u0063\u006F\u006D\u0070\u006F\u0073\u0069\u0074\u0065']([{"input":_0x96d7ab,'\u0062\u006C\u0065\u006E\u0064':'dest-in'}])['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}async function makeBlurredBackground(imageBuffer,width,height){const _0x9242b=await sharp(imageBuffer)['\u0072\u0065\u0073\u0069\u007A\u0065'](width,height,{'\u0066\u0069\u0074':'cover','\u0070\u006F\u0073\u0069\u0074\u0069\u006F\u006E':'centre'})['\u0062\u006C\u0075\u0072'](124253^124245)['\u006D\u006F\u0064\u0075\u006C\u0061\u0074\u0065']({'\u0062\u0072\u0069\u0067\u0068\u0074\u006E\u0065\u0073\u0073':0.55,'\u0073\u0061\u0074\u0075\u0072\u0061\u0074\u0069\u006F\u006E':0.8})['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();const _0x182ff=Buffer['\u0066\u0072\u006F\u006D'](`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="#050d20" opacity="0.45"/>
        </svg>`);return sharp(_0x9242b)['\u0063\u006F\u006D\u0070\u006F\u0073\u0069\u0074\u0065']([{"input":_0x182ff,'\u0062\u006C\u0065\u006E\u0064':"\u006F\u0076\u0065\u0072"}])['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}function escXml(str){return String(str)['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u0026','\u0067'),"\u0026\u0061\u006D\u0070\u003B")['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u003C','\u0067'),"\u0026\u006C\u0074\u003B")['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u003E','\u0067'),";tg&".split("").reverse().join(""))['\u0072\u0065\u0070\u006C\u0061\u0063\u0065'](new RegExp('\u0022','\u0067'),";touq&".split("").reverse().join(""));}function adaptiveFontSize(text,baseFontSize,maxWidth,charWidthRatio=0.6){const _0xfafac=text['\u006C\u0065\u006E\u0067\u0074\u0068']*baseFontSize*charWidthRatio;if(_0xfafac<=maxWidth)return baseFontSize;return Math['\u006D\u0061\u0078'](280893^280877,Math['\u0066\u006C\u006F\u006F\u0072'](maxWidth/(text['\u006C\u0065\u006E\u0067\u0074\u0068']*charWidthRatio)));}function chamferedRect(x,y,w,h,tl,tr,br,bl){return[`M${x+tl},${y}`,`L${x+w-tr},${y}`,`L${x+w},${y+tr}`,`L${x+w},${y+h-br}`,`L${x+w-br},${y+h}`,`L${x+bl},${y+h}`,`L${x},${y+h-bl}`,`L${x},${y+tl}`,`Z`]['\u006A\u006F\u0069\u006E']("\u0020");}function buildSVG(width,height,username,groupName,memberCount,_0xbeb67d,_0xdegefc,_0xa1542d,_0xb843ee,_0x5e4c,_0x946b){const _0x2_0xdfa=width/(881838^881836);_0xbeb67d=(649800^649806)+(631850^631842);const _0x9e9beb=829709^829753,_0x3a04eb=988255^988293;const _0xbf20c=_0x9e9beb+_0x3a04eb+(139536^139649);_0xdegefc=(124342^124341)+(980752^980759);const _0x852b=_0xbf20c+(781661^781772);_0xa1542d=141729^141683;var _0x57f=(158429^158426)+(446568^446575);_0xb843ee=919740^919708;_0x57f=(268745^268737)+(654395^654394);const _0x9174db=width-(586752^586816);_0x5e4c=(821522^821527)+(182913^182917);_0x946b=933510^933520;const u=escXml(String(username));const g=escXml(String(groupName));var _0x0fc=(812180^812178)+(576828^576828);const m=escXml(String(memberCount));_0x0fc=(469278^469273)+(561380^561389);var _0x3e8db=(107455^107455)+(601140^601141);const _0x8d_0x3fd=_0x9174db-(786976^787056);_0x3e8db=(104122^104120)+(388989^388984);var _0x25c2b=(431387^431390)+(894474^894476);const _0xf82c=adaptiveFontSize(u,474006^474040,_0x8d_0x3fd,0.58);_0x25c2b=(823347^823355)+(376047^376038);const _0xa1ab=adaptiveFontSize(g,598673^598656,_0x9174db/(461064^461066)-(577055^577093),0.6);const _0x9f_0x6f4=chamferedRect(_0xb843ee,_0x9e9beb,_0x9174db,_0x3a04eb,_0x946b,_0x946b,_0x946b,_0x946b);var _0xfbac=(668944^668944)+(594771^594768);const _0x8e0ga=chamferedRect(_0xb843ee,_0x852b,_0x9174db,_0xa1542d,_0x946b,_0x946b,_0x946b,_0x946b);_0xfbac=919720^919723;const _0x6c55cc=chamferedRect(_0xb843ee+(631252^631250),_0x9e9beb+(458789^458787),_0x9174db-(474248^474244),_0x3a04eb-(508365^508353),_0x946b-(523193^523197),_0x946b-(550024^550028),_0x946b-(971510^971506),_0x946b-(741086^741082));const _0xb3b=chamferedRect(_0xb843ee+(330688^330694),_0x852b+(672487^672481),_0x9174db-(615808^615820),_0xa1542d-(106512^106524),_0x946b-(297500^297496),_0x946b-(397520^397524),_0x946b-(657723^657727),_0x946b-(240589^240585));var _0x_0xb50=(931707^931711)+(973309^973305);const _0xfcf4e=[{'\u0078':_0xb843ee,'\u0079':_0x9e9beb+_0x946b},{'\u0078':_0xb843ee+_0x946b,'\u0079':_0x9e9beb},{'\u0078':_0xb843ee+_0x9174db-_0x946b,'\u0079':_0x9e9beb},{'\u0078':_0xb843ee+_0x9174db,'\u0079':_0x9e9beb+_0x946b},{'\u0078':_0xb843ee+_0x9174db,'\u0079':_0x9e9beb+_0x3a04eb-_0x946b},{'\u0078':_0xb843ee+_0x9174db-_0x946b,'\u0079':_0x9e9beb+_0x3a04eb},{'\u0078':_0xb843ee+_0x946b,'\u0079':_0x9e9beb+_0x3a04eb},{'\u0078':_0xb843ee,'\u0079':_0x9e9beb+_0x3a04eb-_0x946b}];_0x_0xb50=(260325^260323)+(500732^500731);var _0xge37e=(504887^504881)+(551706^551705);const _0xc9d7ac=[{'\u0078':_0xb843ee,'\u0079':_0x852b+_0x946b},{'\u0078':_0xb843ee+_0x946b,'\u0079':_0x852b},{'\u0078':_0xb843ee+_0x9174db-_0x946b,'\u0079':_0x852b},{'\u0078':_0xb843ee+_0x9174db,'\u0079':_0x852b+_0x946b},{'\u0078':_0xb843ee+_0x9174db,'\u0079':_0x852b+_0xa1542d-_0x946b},{'\u0078':_0xb843ee+_0x9174db-_0x946b,'\u0079':_0x852b+_0xa1542d},{'\u0078':_0xb843ee+_0x946b,'\u0079':_0x852b+_0xa1542d},{'\u0078':_0xb843ee,'\u0079':_0x852b+_0xa1542d-_0x946b}];_0xge37e=(899901^899896)+(551053^551050);function _0x864fee(corners,color,size=618152^618150){const _0x43ee8g=[];const[tlV,tlH,trH,trV,brV,brH,blH,blV]=corners;_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${tlV['\u0078']}" y1="${tlV['\u0079']}" x2="${tlV['\u0078']}" y2="${tlV['\u0079']-size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${tlH['\u0078']}" y1="${tlH['\u0079']}" x2="${tlH['\u0078']-size}" y2="${tlH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<circle cx="${(tlV['\u0078']+tlH['\u0078'])/(365959^365957)-(408897^408896)}" cy="${(tlV['\u0079']+tlH['\u0079'])/(983748^983750)-(429773^429772)}" r="2.8" fill="${color}"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${trV['\u0078']}" y1="${trV['\u0079']}" x2="${trV['\u0078']}" y2="${trV['\u0079']-size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${trH['\u0078']}" y1="${trH['\u0079']}" x2="${trH['\u0078']+size}" y2="${trH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<circle cx="${(trV['\u0078']+trH['\u0078'])/(195853^195855)+(553721^553720)}" cy="${(trV['\u0079']+trH['\u0079'])/(107025^107027)-(442685^442684)}" r="2.8" fill="${color}"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${brV['\u0078']}" y1="${brV['\u0079']}" x2="${brV['\u0078']}" y2="${brV['\u0079']+size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${brH['\u0078']}" y1="${brH['\u0079']}" x2="${brH['\u0078']+size}" y2="${brH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<circle cx="${(brV['\u0078']+brH['\u0078'])/(963621^963623)+(348741^348740)}" cy="${(brV['\u0079']+brH['\u0079'])/(743419^743417)+(129284^129285)}" r="2.8" fill="${color}"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${blV['\u0078']}" y1="${blV['\u0079']}" x2="${blV['\u0078']}" y2="${blV['\u0079']+size}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<line x1="${blH['\u0078']}" y1="${blH['\u0079']}" x2="${blH['\u0078']-size}" y2="${blH['\u0079']}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);_0x43ee8g['\u0070\u0075\u0073\u0068'](`<circle cx="${(blV['\u0078']+blH['\u0078'])/(577416^577418)-(334888^334889)}" cy="${(blV['\u0079']+blH['\u0079'])/(427823^427821)+(524242^524243)}" r="2.8" fill="${color}"/>`);return _0x43ee8g['\u006A\u006F\u0069\u006E']("\u000A");}return`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
      <path d="${_0x9f_0x6f4}"/>
    </clipPath>
    <clipPath id="botPanelClip">
      <path d="${_0x8e0ga}"/>
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
  <path d="${_0x9f_0x6f4}" fill="none" stroke="#4d9fff" stroke-width="18" opacity="0.04" filter="url(#neonGlow)"/>

  <!-- Base glass fill -->
  <path d="${_0x9f_0x6f4}" fill="url(#glassTopFill)"/>

  <!-- Inner second glass layer (slight inset) -->
  <path d="${_0x6c55cc}" fill="rgba(255,255,255,0.04)"/>

  <!-- Top edge catch-light sheen -->
  <rect x="${_0xb843ee}" y="${_0x9e9beb}" width="${_0x9174db}" height="36" fill="url(#sheenTop)" clip-path="url(#topPanelClip)"/>

  <!-- Outer border stroke -->
  <path d="${_0x9f_0x6f4}" fill="none" stroke="rgba(111,184,255,0.55)" stroke-width="1.5"/>

  <!-- Inner border stroke (secondary layer) -->
  <path d="${_0x6c55cc}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>

  <!-- Horizontal shimmer lines (top & bottom edges) -->
  <line x1="${_0xb843ee+_0x946b}" y1="${_0x9e9beb}"
        x2="${_0xb843ee+_0x9174db-_0x946b}" y2="${_0x9e9beb}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>
  <line x1="${_0xb843ee+_0x946b}" y1="${_0x9e9beb+_0x3a04eb}"
        x2="${_0xb843ee+_0x9174db-_0x946b}" y2="${_0x9e9beb+_0x3a04eb}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>

  <!-- Vertical shimmer lines (left & right edges) -->
  <line x1="${_0xb843ee}" y1="${_0x9e9beb+_0x946b}"
        x2="${_0xb843ee}" y2="${_0x9e9beb+_0x3a04eb-_0x946b}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>
  <line x1="${_0xb843ee+_0x9174db}" y1="${_0x9e9beb+_0x946b}"
        x2="${_0xb843ee+_0x9174db}" y2="${_0x9e9beb+_0x3a04eb-_0x946b}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>

  <!-- Corner bracket accents -->
  ${_0x864fee(_0xfcf4e,"ff8df9#".split("").reverse().join(""),659396^659412)}

  <!-- Corner glow dots at each chamfer joint -->
  <circle cx="${_0xb843ee}"         cy="${_0x9e9beb+_0x946b}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x946b}"   cy="${_0x9e9beb}"             r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db-_0x946b}" cy="${_0x9e9beb}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db}"       cy="${_0x9e9beb+_0x946b}" r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db}"       cy="${_0x9e9beb+_0x3a04eb-_0x946b}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db-_0x946b}" cy="${_0x9e9beb+_0x3a04eb}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x946b}"          cy="${_0x9e9beb+_0x3a04eb}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee}"                cy="${_0x9e9beb+_0x3a04eb-_0x946b}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>

  <!-- ── TOP PANEL CONTENT ── -->

  <!-- Central emblem above title -->
  <g transform="translate(${_0x2_0xdfa}, ${_0x9e9beb+(521908^521880)})" filter="url(#neonGlow)" opacity="0.9">
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

  <!-- WELCOME text -->
  <text x="${_0x2_0xdfa}" y="${_0x9e9beb+(822189^822237)}"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="60" font-weight="bold"
        letter-spacing="14"
        fill="#dfefff"
        filter="url(#textShadow)"
        opacity="0.97">WELCOME</text>

  <!-- Divider line with diamond ornaments -->
  <line x1="${_0xb843ee+(852907^852892)}" y1="${_0x9e9beb+(796903^796783)}"
        x2="${_0x2_0xdfa-(595841^595929)}" y2="${_0x9e9beb+(243328^243208)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>
  <line x1="${_0x2_0xdfa+(769450^769522)}" y1="${_0x9e9beb+(193343^193463)}"
        x2="${_0xb843ee+_0x9174db-(590144^590199)}" y2="${_0x9e9beb+(581714^581850)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>

  <!-- Diamond accents on divider -->
  <polygon points="${_0x2_0xdfa-(409504^409589)},${_0x9e9beb+(920489^920353)} ${_0x2_0xdfa-(594917^594869)},${_0x9e9beb+(496563^496433)} ${_0x2_0xdfa-(236196^236271)},${_0x9e9beb+(212194^212074)} ${_0x2_0xdfa-(550471^550423)},${_0x9e9beb+(577804^577922)}"
           fill="#6fb8ff" opacity="0.85"/>
  <polygon points="${_0x2_0xdfa+(422096^422043)},${_0x9e9beb+(772009^771873)} ${_0x2_0xdfa+(277588^277508)},${_0x9e9beb+(299509^299383)} ${_0x2_0xdfa+(621568^621653)},${_0x9e9beb+(134399^134263)} ${_0x2_0xdfa+(180368^180416)},${_0x9e9beb+(992316^992434)}"
           fill="#6fb8ff" opacity="0.85"/>

  <!-- Small dots flanking "TO GROUP" -->
  <circle cx="${_0x2_0xdfa-(563763^563725)}" cy="${_0x9e9beb+(194162^194298)}" r="2" fill="#9fd8ff" opacity="0.6"/>
  <circle cx="${_0x2_0xdfa+(748546^748604)}" cy="${_0x9e9beb+(495882^496002)}" r="2" fill="#9fd8ff" opacity="0.6"/>

  <!-- TO GROUP subtitle -->
  <text x="${_0x2_0xdfa}" y="${_0x9e9beb+(761879^762008)}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="11" font-weight="400"
        letter-spacing="8"
        fill="#cce4ff"
        opacity="0.88">TO GROUP</text>

  <!-- Bottom panel connector dots -->
  <circle cx="${_0x2_0xdfa}"      cy="${_0x9e9beb+_0x3a04eb-(550385^550393)}" r="3.2" fill="#9fd8ff" opacity="0.9"/>
  <circle cx="${_0x2_0xdfa-(311294^311272)}" cy="${_0x9e9beb+_0x3a04eb-(502220^502212)}" r="1.8" fill="#6fb8ff" opacity="0.55"/>
  <circle cx="${_0x2_0xdfa+(422975^422953)}" cy="${_0x9e9beb+_0x3a04eb-(318052^318060)}" r="1.8" fill="#6fb8ff" opacity="0.55"/>
  <circle cx="${_0x2_0xdfa-(853432^853396)}" cy="${_0x9e9beb+_0x3a04eb-(894592^894600)}" r="1.2" fill="#4d9fff" opacity="0.35"/>
  <circle cx="${_0x2_0xdfa+(861643^861671)}" cy="${_0x9e9beb+_0x3a04eb-(415565^415557)}" r="1.2" fill="#4d9fff" opacity="0.35"/>

  <!-- Vertical connector line from panel to avatar zone -->
  <line x1="${_0x2_0xdfa}" y1="${_0x9e9beb+_0x3a04eb}"
        x2="${_0x2_0xdfa}" y2="${_0x9e9beb+_0x3a04eb+(301510^301530)}"
        stroke="url(#borderShimmerV)" stroke-width="1" opacity="0.5"/>


  <!-- ══════════════════════════════════════════
       AVATAR RING — Holographic multi-layer frame
  ══════════════════════════════════════════ -->

  <!-- Outermost ambient glow -->
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="138" fill="url(#avatarGlow)"/>

  <!-- Ring layer 1: faint outer energy field -->
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="142"
          fill="none" stroke="rgba(77,159,255,0.12)" stroke-width="12"/>

  <!-- Ring layer 2: outer metallic ring -->
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="134"
          fill="none" stroke="rgba(159,216,255,0.22)" stroke-width="3"
          filter="url(#ringGlow)"/>

  <!-- Ring layer 3: neon accent ring (the bright one) -->
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="128"
          fill="none"
          stroke="url(#avatarRingHolo)"
          stroke-width="2.5"
          filter="url(#ringGlow)"/>

  <!-- Ring layer 4: secondary metallic -->
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="122"
          fill="none" stroke="rgba(204,228,255,0.18)" stroke-width="1.5"/>

  <!-- Ring layer 5: inner glass ring -->
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="118"
          fill="url(#avatarBg)"/>
  <circle cx="${_0x2_0xdfa}" cy="${_0xbf20c}" r="118"
          fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

  <!-- Cardinal anchor points on avatar ring -->
  <!-- Top -->
  <circle cx="${_0x2_0xdfa}"         cy="${_0xbf20c-(562897^562770)}" r="5" fill="#9fd8ff" opacity="0.95" filter="url(#neonGlow)"/>
  <circle cx="${_0x2_0xdfa}"         cy="${_0xbf20c-(673342^673469)}" r="2.2" fill="#dfefff"/>
  <!-- Bottom -->
  <circle cx="${_0x2_0xdfa}"         cy="${_0xbf20c+(291669^291798)}" r="5" fill="#9fd8ff" opacity="0.95" filter="url(#neonGlow)"/>
  <circle cx="${_0x2_0xdfa}"         cy="${_0xbf20c+(913894^913765)}" r="2.2" fill="#dfefff"/>
  <!-- Left -->
  <circle cx="${_0x2_0xdfa-(281399^281524)}"   cy="${_0xbf20c}"       r="5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x2_0xdfa-(545707^545576)}"   cy="${_0xbf20c}"       r="2.2" fill="#dfefff"/>
  <!-- Right -->
  <circle cx="${_0x2_0xdfa+(524899^525024)}"   cy="${_0xbf20c}"       r="5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0x2_0xdfa+(416364^416495)}"   cy="${_0xbf20c}"       r="2.2" fill="#dfefff"/>

  <!-- Diagonal tick marks at 45° -->
  <line x1="${_0x2_0xdfa-(422049^422081)}" y1="${_0xbf20c-(762691^762659)}" x2="${_0x2_0xdfa-(811533^811606)}" y2="${_0xbf20c-(750914^750873)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="${_0x2_0xdfa+(304745^304690)}" y1="${_0xbf20c-(643160^643075)}" x2="${_0x2_0xdfa+(119099^119131)}" y2="${_0xbf20c-(757055^757087)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="${_0x2_0xdfa-(696377^696409)}" y1="${_0xbf20c+(278417^278513)}" x2="${_0x2_0xdfa-(842206^842117)}" y2="${_0xbf20c+(313704^313651)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="${_0x2_0xdfa+(980738^980825)}" y1="${_0xbf20c+(980867^980952)}" x2="${_0x2_0xdfa+(401654^401558)}" y2="${_0xbf20c+(322703^322799)}"
        stroke="#9fd8ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

  <!-- Vertical connector from avatar to bottom panel -->
  <line x1="${_0x2_0xdfa}" y1="${_0xbf20c+(497391^497305)}"
        x2="${_0x2_0xdfa}" y2="${_0x852b}"
        stroke="url(#borderShimmerV)" stroke-width="1" opacity="0.45"/>


  <!-- ══════════════════════════════════════════
       BOTTOM PANEL — Data/info HUD panel
  ══════════════════════════════════════════ -->

  <!-- Outer glow bleed -->
  <path d="${_0x8e0ga}" fill="none" stroke="#4d9fff" stroke-width="18" opacity="0.035" filter="url(#neonGlow)"/>

  <!-- Base glass fill -->
  <path d="${_0x8e0ga}" fill="url(#glassBotFill)"/>

  <!-- Inner second layer -->
  <path d="${_0xb3b}" fill="rgba(255,255,255,0.035)"/>

  <!-- Top sheen -->
  <rect x="${_0xb843ee}" y="${_0x852b}" width="${_0x9174db}" height="30" fill="url(#sheenBot)" clip-path="url(#botPanelClip)"/>

  <!-- Outer border stroke -->
  <path d="${_0x8e0ga}" fill="none" stroke="rgba(111,184,255,0.50)" stroke-width="1.5"/>

  <!-- Inner border stroke -->
  <path d="${_0xb3b}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Horizontal shimmer lines -->
  <line x1="${_0xb843ee+_0x946b}" y1="${_0x852b}"
        x2="${_0xb843ee+_0x9174db-_0x946b}" y2="${_0x852b}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>
  <line x1="${_0xb843ee+_0x946b}" y1="${_0x852b+_0xa1542d}"
        x2="${_0xb843ee+_0x9174db-_0x946b}" y2="${_0x852b+_0xa1542d}"
        stroke="url(#borderShimmerH)" stroke-width="2.5"/>

  <!-- Vertical shimmer lines -->
  <line x1="${_0xb843ee}" y1="${_0x852b+_0x946b}"
        x2="${_0xb843ee}" y2="${_0x852b+_0xa1542d-_0x946b}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>
  <line x1="${_0xb843ee+_0x9174db}" y1="${_0x852b+_0x946b}"
        x2="${_0xb843ee+_0x9174db}" y2="${_0x852b+_0xa1542d-_0x946b}"
        stroke="url(#borderShimmerV)" stroke-width="1.5"/>

  <!-- Corner bracket accents -->
  ${_0x864fee(_0xc9d7ac,"\u0023\u0039\u0066\u0064\u0038\u0066\u0066",605423^605439)}

  <!-- Corner glow dots -->
  <circle cx="${_0xb843ee}"         cy="${_0x852b+_0x946b}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x946b}"   cy="${_0x852b}"             r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db-_0x946b}" cy="${_0x852b}"      r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db}"       cy="${_0x852b+_0x946b}" r="3.5" fill="#6fb8ff" opacity="0.9" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db}"       cy="${_0x852b+_0xa1542d-_0x946b}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x9174db-_0x946b}" cy="${_0x852b+_0xa1542d}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee+_0x946b}"          cy="${_0x852b+_0xa1542d}"       r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>
  <circle cx="${_0xb843ee}"                cy="${_0x852b+_0xa1542d-_0x946b}" r="3.5" fill="#4d9fff" opacity="0.85" filter="url(#neonGlow)"/>

  <!-- ── BOTTOM PANEL CONTENT ── -->

  <!-- USERNAME — adaptive font size, centered -->
  <text x="${_0x2_0xdfa}" y="${_0x852b+(903642^903652)}"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${_0xf82c}" font-weight="bold"
        letter-spacing="3"
        fill="#dfefff"
        filter="url(#textShadow)"
        opacity="0.98">${u}</text>

  <!-- Divider below username -->
  <line x1="${_0xb843ee+(947305^947294)}" y1="${_0x852b+(466297^466217)}"
        x2="${_0x2_0xdfa-(486686^486668)}" y2="${_0x852b+(863863^863783)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>
  <polygon points="${_0x2_0xdfa},${_0x852b+(991803^991858)} ${_0x2_0xdfa+(321833^321838)},${_0x852b+(282816^282768)} ${_0x2_0xdfa},${_0x852b+(171095^171008)} ${_0x2_0xdfa-(306914^306917)},${_0x852b+(290603^290683)}"
           fill="#6fb8ff" opacity="0.9"/>
  <line x1="${_0x2_0xdfa+(624713^624731)}" y1="${_0x852b+(295273^295225)}"
        x2="${_0xb843ee+_0x9174db-(255328^255319)}" y2="${_0x852b+(292782^292862)}"
        stroke="url(#dividerGlow)" stroke-width="1"/>

  <!-- Vertical separator between left and right info zones -->
  <line x1="${_0x2_0xdfa}" y1="${_0x852b+(975413^975445)}"
        x2="${_0x2_0xdfa}" y2="${_0x852b+_0xa1542d-(201926^201946)}"
        stroke="rgba(111,184,255,0.35)" stroke-width="1"/>

  <!-- ── LEFT ZONE: Member count ── -->

  <!-- People icon -->
  <g transform="translate(${_0xb843ee+(255214^255194)}, ${_0x852b+(832911^833015)})" opacity="0.82">
    <!-- Person 1 -->
    <circle cx="0" cy="-12" r="7.5" fill="#9fd8ff"/>
    <path d="M-12,8 Q0,-2 12,8" fill="#9fd8ff"/>
    <!-- Person 2 (slightly offset) -->
    <circle cx="14" cy="-14" r="6" fill="#6fb8ff" opacity="0.75"/>
    <path d="M4,6 Q14,-2 24,6" fill="#6fb8ff" opacity="0.75"/>
  </g>

  <!-- Member count value -->
  <text x="${_0xb843ee+(852614^852692)}" y="${_0x852b+(245170^245194)}"
        text-anchor="start"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="26" font-weight="bold"
        letter-spacing="2"
        fill="#dfefff"
        opacity="0.97">${m}+</text>

  <!-- Member count label -->
  <text x="${_0xb843ee+(438078^438025)}" y="${_0x852b+(932798^932658)}"
        text-anchor="start"
        font-family="Arial, Helvetica, sans-serif"
        font-size="9" font-weight="400"
        letter-spacing="3"
        fill="#9fd8ff"
        opacity="0.75">CURRENT MEMBERS</text>

  <!-- Thin accent bar below member label -->
  <line x1="${_0xb843ee+(673794^673845)}" y1="${_0x852b+(264257^264405)}"
        x2="${_0xb843ee+(448984^449007)+(512891^512789)}" y2="${_0x852b+(382301^382409)}"
        stroke="#4d9fff" stroke-width="1" opacity="0.4"/>

  <!-- ── RIGHT ZONE: Group name ── -->

  <!-- Shield icon (group emblem) -->
  <g transform="translate(${_0x2_0xdfa+(681153^681181)}, ${_0x852b+(320863^320819)})" opacity="0.85">
    <path d="M0,-14 L12,-9 L12,0 Q12,10 0,16 Q-12,10 -12,0 L-12,-9 Z"
          fill="none" stroke="#9fd8ff" stroke-width="1.8"/>
    <!-- Checkmark inside shield -->
    <path d="M-5,1 L-1,6 L6,-4"
          fill="none" stroke="#cce4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Group name (adaptive font size) -->
  <text x="${_0x2_0xdfa+(438363^438379)}" y="${_0x852b+(616381^616389)}"
        text-anchor="start"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${_0xa1ab}" font-weight="bold"
        letter-spacing="1"
        fill="#dfefff"
        opacity="0.97">${g}</text>

  <!-- Group label -->
  <text x="${_0x2_0xdfa+(968120^968072)}" y="${_0x852b+(943520^943404)}"
        text-anchor="start"
        font-family="Arial, Helvetica, sans-serif"
        font-size="9" font-weight="400"
        letter-spacing="3"
        fill="#9fd8ff"
        opacity="0.75">TOGETHER WE THRIVE</text>

  <!-- Thin accent bar below group label -->
  <line x1="${_0x2_0xdfa+(776408^776424)}" y1="${_0x852b+(939228^939080)}"
        x2="${_0x2_0xdfa+(726390^726342)+(507534^507616)}" y2="${_0x852b+(575739^575599)}"
        stroke="#4d9fff" stroke-width="1" opacity="0.4"/>

  <!-- Bottom status indicator row -->
  <g transform="translate(${_0x2_0xdfa}, ${_0x852b+_0xa1542d-(315824^315810)})" opacity="0.55">
    <line x1="-60" y1="0" x2="-8" y2="0" stroke="#4d9fff" stroke-width="0.8"/>
    <circle cx="-4" cy="0" r="2" fill="#9fd8ff"/>
    <circle cx="0"  cy="0" r="3" fill="#cce4ff"/>
    <circle cx="4"  cy="0" r="2" fill="#9fd8ff"/>
    <line x1="8" y1="0" x2="60" y2="0" stroke="#4d9fff" stroke-width="0.8"/>
  </g>

</svg>`;}async function generateWelcomeImage(username,groupName,memberCount,avatarUrl,groupIconUrl=null,_0x43f4ea,_0x3f9c7b,_0xf8dfbf,_0x8a67bd,_0x97c5b){const _0x4_0x3d3=104399^103843,_0x689e=555377^555765;const _0x4d21f=_0x4_0x3d3/(787609^787611);_0x3f9c7b=954328^954164;_0x43f4ea=(222683^222686)+(884362^884355);const _0xbe6bcb=535810^535862,_0x6371ca=849967^850165;const _0xg51bac=_0xbe6bcb+_0x6371ca+(337433^337544);var _0xc71c=(512293^512300)+(464693^464694);_0xf8dfbf="gnp.ghagUKbd/moc.ndcoryp.gmi//:sptth".split("").reverse().join("");_0xc71c=847568^847571;var _0xb735af=(607971^607970)+(500332^500331);_0xb735af=248475^248467;try{var _0x4691fd=(364015^364013)+(391455^391451);const _0xd0fdd=await fetchImageBuffer(groupIconUrl||_0xf8dfbf)['\u0063\u0061\u0074\u0063\u0068'](()=>fetchImageBuffer(_0xf8dfbf));_0x4691fd=187204^187200;_0x8a67bd=await makeBlurredBackground(_0xd0fdd,_0x4_0x3d3,_0x689e);}catch{_0x8a67bd=await sharp({'\u0063\u0072\u0065\u0061\u0074\u0065':{"width":_0x4_0x3d3,'\u0068\u0065\u0069\u0067\u0068\u0074':_0x689e,"channels":4,'\u0062\u0061\u0063\u006B\u0067\u0072\u006F\u0075\u006E\u0064':{'\u0072':6,'\u0067':13,'\u0062':31,"alpha":1}}})['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}const _0x2c043e=buildSVG(_0x4_0x3d3,_0x689e,username,groupName,memberCount);_0x97c5b=445327^445325;var _0x78fafd=(514234^514226)+(117192^117185);const _0xf3d7g=await sharp(Buffer['\u0066\u0072\u006F\u006D'](_0x2c043e))['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();_0x78fafd=(631594^631594)+(968773^968770);const _0x56gc=[{'\u0069\u006E\u0070\u0075\u0074':_0xf3d7g,"blend":'over'}];try{const _0x63ad="\u0068\u0074\u0074\u0070\u0073\u003A\u002F\u002F\u0069\u006D\u0067\u002E\u0070\u0079\u0072\u006F\u0063\u0064\u006E\u002E\u0063\u006F\u006D\u002F\u0064\u0062\u004B\u0055\u0067\u0061\u0068\u0067\u002E\u0070\u006E\u0067";var _0x97ed=(722579^722578)+(954784^954788);const _0xf864cc=await fetchImageBuffer(avatarUrl||_0x63ad)['\u0063\u0061\u0074\u0063\u0068'](()=>fetchImageBuffer(_0x63ad));_0x97ed="hchepd".split("").reverse().join("");const _0x1027fg=await makeCircularAvatar(_0xf864cc,_0x3f9c7b);_0x56gc['\u0070\u0075\u0073\u0068']({'\u0069\u006E\u0070\u0075\u0074':_0x1027fg,'\u0074\u006F\u0070':Math['\u0072\u006F\u0075\u006E\u0064'](_0xg51bac-_0x3f9c7b/(443339^443337)),'\u006C\u0065\u0066\u0074':Math['\u0072\u006F\u0075\u006E\u0064'](_0x4d21f-_0x3f9c7b/(752950^752948))});}catch(e){console['\u006C\u006F\u0067'](":deliaf hctef ratavA ]egamIemocleW[".split("").reverse().join(""),e['\u006D\u0065\u0073\u0073\u0061\u0067\u0065']);}return sharp(_0x8a67bd)['\u0063\u006F\u006D\u0070\u006F\u0073\u0069\u0074\u0065'](_0x56gc)['\u0070\u006E\u0067']()['\u0074\u006F\u0042\u0075\u0066\u0066\u0065\u0072']();}module['\u0065\u0078\u0070\u006F\u0072\u0074\u0073']={"generateWelcomeImage":generateWelcomeImage};