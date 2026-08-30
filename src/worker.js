export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname === '/' || !url.pathname.split('/').pop().includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url), request))
    }
    return env.ASSETS.fetch(request)
  }
}