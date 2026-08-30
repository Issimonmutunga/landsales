export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const last = path.split('/').pop()
    const hasExt = last.includes('.')
    if (path !== '/' && !hasExt) {
      return env.ASSETS.fetch(request.url.replace(url.pathname, '/index.html'))
    }
    return env.ASSETS.fetch(request)
  }
}