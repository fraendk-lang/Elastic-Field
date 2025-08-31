// Year & Privacy date
    document.getElementById('y').textContent = new Date().getFullYear();
    document.getElementById('privacy-date').textContent = new Date().toISOString().split('T')[0];

    // Lazy-Images global
    document.querySelectorAll('img:not([loading])').forEach(img=>{
      img.loading='lazy'; img.decoding='async';
    });

    // Reduced-Motion – Video pausieren, wenn vom System gewünscht
    (function(){
      const m = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      const v = document.querySelector('.hero video');
      if (m && m.matches && v){ v.pause(); v.removeAttribute('autoplay'); }
    })();

    // Back-to-top
    (function(){
      const b=document.getElementById('toTop');
      const onScroll=()=>{ b.classList.toggle('show', window.scrollY>600); };
      window.addEventListener('scroll', onScroll, {passive:true});
      onScroll();
      b.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    })();

    // YouTube: 1-Klick → Autoplay
    (function(){
      document.querySelectorAll('.video-thumb.yt').forEach(el=>{
        const id = el.dataset.yt; if(!id) return;
        const play = () => {
          el.innerHTML =
            '<iframe width="100%" height="100%" style="aspect-ratio:16/9;border:0" ' +
            'src="https://www.youtube-nocookie.com/embed/'+id+'?rel=0&modestbranding=1&autoplay=1&playsinline=1" ' +
            'title="Elastic Field — Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
        };
        el.addEventListener('click', play);
        el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); play(); } });
      });
    })();

    // Spotify: 1-Klick laden
    (function(){
      document.querySelectorAll('.video-thumb.spotify').forEach(el=>{
        const src = el.dataset.src; if(!src) return;
        const load = () => {
          el.outerHTML = '<iframe style="width:100%;height:420px;max-height:560px;background:#121318;border:0" src="'+src+'" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
        };
        el.addEventListener('click', load);
        el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); load(); } });
      });
    })();
