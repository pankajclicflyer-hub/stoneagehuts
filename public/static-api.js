// Lightweight fetch override for static hosting
(function(){
  const _fetch = window.fetch.bind(window);
  window.fetch = async function(input, init){
    const url = (typeof input === 'string') ? input : (input && input.url) || '';
    try {
      if(!url) return _fetch(input, init);
      if(url.startsWith('/api/')){
        // Map API endpoints to local static files
        if(url.startsWith('/api/reviews')) return _fetch('/data/reviews.json', init);
        if(url.startsWith('/api/blog')){
          const lang = url.includes('hindi') ? 'hindi' : 'english';
          return _fetch(`/blog/${lang}/posts.json`, init);
        }
        if(url.startsWith('/api/newsletter')){
          if(init && init.method && init.method.toUpperCase()!=='GET') return Promise.resolve(new Response(JSON.stringify({ok:true}), {status:200, headers:{'content-type':'application/json'}}));
          return _fetch('/data/newsletter.json', init);
        }
        if(url.startsWith('/api/contact')){
          if(init && init.method && init.method.toUpperCase()!=='GET') return Promise.resolve(new Response(JSON.stringify({ok:true}), {status:200, headers:{'content-type':'application/json'}}));
          return _fetch('/data/contacts.json', init);
        }
        if(url.startsWith('/api/images')){
          return _fetch('/data/images-manifest.json', init);
        }
        if(url.startsWith('/api/reviews')) return _fetch('/data/reviews.json', init);
        // default: return empty JSON
        return Promise.resolve(new Response(JSON.stringify({}), {status:200, headers:{'content-type':'application/json'}}));
      }
      return _fetch(input, init);
    } catch(e){
      return Promise.reject(e);
    }
  };
})();
