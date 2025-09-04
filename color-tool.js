(function(){
  const root = document.getElementById('color');
  const $ = sel => root.querySelector(sel);

  const swatch  = $('#ct2-swatch');
  const hexI    = $('#ct2-hex');
  const rgbI    = $('#ct2-rgb');
  const hslI    = $('#ct2-hsl');
  const randomB = $('#ct2-random');
  const addB    = $('#ct2-add');
  const clearB  = $('#ct2-clear');
  const palette = $('#ct2-palette');
  const empty   = $('#ct2-empty');
  const ratioEl = $('#ct2-ratio');
  const badgeEl = $('#ct2-badge');
  const swapB   = $('#ct2-swap');

  let mode = 'bg';
  root.querySelectorAll('input[name="ct2-mode"]').forEach(r=>{
    r.addEventListener('change',()=>{ mode=r.value; updateAll(); });
  });
  swapB.addEventListener('click',()=>{
    mode = (mode==='bg') ? 'text' : 'bg';
    root.querySelectorAll('input[name="ct2-mode"]').forEach(r=> r.checked = (r.value===mode));
    updateAll();
  });

  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const hexToRgb=h=>{
    const x=h.replace('#','').trim(); const v=x.length===3?x.split('').map(c=>c+c).join(''):x;
    const n=parseInt(v,16); if(isNaN(n)||v.length!==6) return null;
    return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  };
  const rgbToHex=(r,g,b)=>'#'+[r,g,b].map(v=>clamp(v,0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
  const rgbStrToRgb=str=>{ const m=str.match(/^\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*$/); return m?{r:+m[1],g:+m[2],b:+m[3]}:null; };
  const hslStrToRgb=str=>{
    const m=str.match(/^\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*$/); if(!m) return null;
    let h=+m[1]/360,s=+m[2]/100,l=+m[3]/100;
    if(s===0){ const v=Math.round(l*255); return {r:v,g:v,b:v}; }
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    const q=l<.5?l*(1+s):l+s-l*s, p=2*l-q;
    const r=Math.round(hue2rgb(p,q,h+1/3)*255), g=Math.round(hue2rgb(p,q,h)*255), b=Math.round(hue2rgb(p,q,h-1/3)*255);
    return {r,g,b};
  };
  const rgbToHsl=(r,g,b)=>{
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; }
    else{
      const d=max-min; s=l>0.5? d/(2-max-min) : d/(max+min);
      switch(max){ case r:h=(g-b)/d+(g<b?6:0); break; case g:h=(b-r)/d+2; break; case b:h=(r-g)/d+4; break; }
      h/=6;
    }
    return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
  };
  const luminance=(r,g,b)=>{
    const a=[r,g,b].map(v=>{ v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); });
    return .2126*a[0]+.7152*a[1]+.0722*a[2];
  };
  const contrast=(rgb1,rgb2)=>{
    const L1=luminance(rgb1.r,rgb1.g,rgb1.b), L2=luminance(rgb2.r,rgb2.g,rgb2.b);
    return Math.round(((Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05))*100)/100;
  };

  function updateAll(from){
    let rgb;
    if(from==='hex'){
      rgb = hexToRgb(hexI.value); if(!rgb) return;
      rgbI.value = `${rgb.r},${rgb.g},${rgb.b}`;
      const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b); hslI.value = `${hsl.h},${hsl.s}%,${hsl.l}%`;
    }else if(from==='rgb'){
      rgb = rgbStrToRgb(rgbI.value); if(!rgb) return;
      hexI.value = rgbToHex(rgb.r,rgb.g,rgb.b);
      const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b); hslI.value = `${hsl.h},${hsl.s}%,${hsl.l}%`;
    }else if(from==='hsl'){
      rgb = hslStrToRgb(hslI.value); if(!rgb) return;
      hexI.value = rgbToHex(rgb.r,rgb.g,rgb.b);
      rgbI.value = `${rgb.r},${rgb.g},${rgb.b}`;
    }else{
      rgb = hexToRgb(hexI.value) || rgbStrToRgb(rgbI.value) || hslStrToRgb(hslI.value);
      if(!rgb) return;
      hexI.value = rgbToHex(rgb.r,rgb.g,rgb.b);
      rgbI.value = `${rgb.r},${rgb.g},${rgb.b}`;
      const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b); hslI.value = `${hsl.h},${hsl.s}%,${hsl.l}%`;
    }

    swatch.style.background = hexI.value;

    const panel={r:0x12,g:0x13,b:0x18};
    const ink  ={r:0xe8,g:0xec,b:0xf1};
    const c = (mode==='bg') ? contrast(rgb, ink) : contrast(rgb, panel);
    ratioEl.textContent = c.toFixed(2)+':1';
    let label='Fail'; if(c>=7) label='AAA'; else if(c>=4.5) label='AA'; else if(c>=3) label='AA-large';
    badgeEl.textContent = label;
  }

  hexI.addEventListener('input',()=>updateAll('hex'));
  rgbI.addEventListener('input',()=>updateAll('rgb'));
  hslI.addEventListener('input',()=>updateAll('hsl'));

  randomB.addEventListener('click',()=>{
    const r=Math.floor(Math.random()*256), g=Math.floor(Math.random()*256), b=Math.floor(Math.random()*256);
    hexI.value = rgbToHex(r,g,b); updateAll('hex');
  });

  root.querySelectorAll('.ct2-copy').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=btn.dataset.copy, v=(t==='hex'?hexI.value: t==='rgb'?rgbI.value:hslI.value);
      navigator.clipboard?.writeText(v); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy',900);
    });
  });

  function addChip(hex){
    const chip=document.createElement('div');
    chip.className='ct2-chip'; chip.style.background=hex; chip.innerHTML=`<b>${hex.toUpperCase()}</b>`;
    chip.title='Click to copy'; chip.addEventListener('click',()=>navigator.clipboard?.writeText(hex));
    palette.appendChild(chip);
  }

  addB.addEventListener('click',()=>{ empty?.remove(); addChip(hexI.value); });
  clearB.addEventListener('click',()=>{ palette.innerHTML=''; if(empty){ palette.appendChild(empty); } });

  // Init
  updateAll();
})();
