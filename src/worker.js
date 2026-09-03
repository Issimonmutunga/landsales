export default {
  async fetch(request, env) {
    const asset = await env.ASSETS.fetch(request)

    if (!asset.ok && (asset.status === 404 || asset.status === 405)) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
    }

    return asset
  }
}
