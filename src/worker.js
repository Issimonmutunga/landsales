export default {
  async fetch(request, env) {
    const asset = await env.ASSETS.fetch(request)

    if (!asset.ok) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
    }

    return asset
  }
}
