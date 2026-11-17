(() => {
  const cookieDomain = '.utilitools.com.ar';
  const secure = '; Path=/; Secure; SameSite=Lax; Domain='+cookieDomain;
  const read = key => document.cookie.split('; ').find(item=>item.startsWith(key+'='))?.slice(key.length+1);
  const consentKey = 'utilitools_measure';
  const sessionKey = 'utilitools_measure_session';
  const input = document.getElementById('analytics-consent');
  let pageRecorded = false;
  if (!input) return;
  input.checked = read(consentKey)==='yes';
  function pageType() {
    if(location.pathname.startsWith('/categorias/')) return 'category';
    if(location.pathname.startsWith('/guias/') && location.pathname!=='/guias/') return 'guide';
    const subdomain=location.hostname.split('.')[0];
    if(['calculadora','guias','perfiles'].includes(subdomain)) return subdomain;
    if(location.pathname==='/') return 'home';
    return 'other';
  }
  function originChannel() {
    try {
      const host=new URL(document.referrer).hostname.toLowerCase();
      if(host==='utilitools.com.ar'||host.endsWith('.utilitools.com.ar')) return 'internal';
      if(/^(?:www\.)?(?:google\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(host)) return 'search';
      if(/(?:^|\.)(?:facebook\.com|instagram\.com|tiktok\.com|youtube\.com|reddit\.com|whatsapp\.com)$/.test(host)) return 'social';
      return 'referral';
    } catch {return 'direct';}
  }
  function track(event, detail={}) {
    if(read(consentKey)!=='yes') return;
    const id=read(sessionKey) || crypto.randomUUID();
    document.cookie=sessionKey+'='+id+'; Max-Age=1800'+secure;
    fetch('/api/medicion',{method:'POST',keepalive:true,credentials:'omit',referrerPolicy:'no-referrer',
      headers:{'content-type':'application/json'},body:JSON.stringify({event,id,page:pageType(),...detail})}).catch(()=>{});
  }
  window.utilitoolsTrack=track;
  function pageView() {
    if(pageRecorded || read(consentKey)!=='yes') return;
    pageRecorded=true;
    track('page_view',{channel:originChannel(),category:location.pathname.match(/^\/categorias\/([a-z-]+)\/$/)?.[1]});
  }
  input.addEventListener('change',()=>{
    document.cookie=consentKey+'='+(input.checked?'yes':'no')+'; Max-Age=15552000'+secure;
    if(input.checked) pageView();
    else {
      document.cookie=sessionKey+'=; Max-Age=0'+secure;
      pageRecorded=false;
    }
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a');
    if(!link) return;
    if(link.matches('a.open-model')) track('model_opened');
    if(link.matches('.model-actions a')) track('calculator_opened');
  });
  pageView();
})();
