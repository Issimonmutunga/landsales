/**
 * Portfolio Worker — serves the nested /demos/properties/ build from the
 * static-assets binding. This is a SEPARATE Worker from `landsales` (see
 * src/worker.js) and must not affect the standalone deployment.
 *
 * The assets binding serves files from dist-portfolio/ where the built app
 * lives under `demos/properties/`. Asset URLs arrive with the
 * /demos/properties prefix intact (Vercel proxies them without stripping),
 * so the binding resolves them directly. Any other path under the prefix
 * (e.g. /demos/properties/plot/P04) falls back to the nested index.html so
 * deep links and refresh work.
 */
const PREFIX = '/demos/properties'
const INDEX = '/demos/properties/index.html'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Only serve the portfolio app under its base path.
    if (!url.pathname.startsWith(PREFIX)) {
      return new Response('Not Found', { status: 404 })
    }

    let res = await env.ASSETS.fetch(request)
    if (res.status === 404) {
      const indexUrl = new URL(INDEX, request.url)
      res = await env.ASSETS.fetch(new Request(indexUrl, request))
    }
    return res
  },
}
