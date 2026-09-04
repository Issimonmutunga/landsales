/**
 * Portfolio Worker — serves the property-sales app behind a Vercel
 * /demos/properties/* rewrite.
 *
 * Vercel strips the /demos/properties prefix before forwarding the request,
 * so this Worker serves the app from the root.
 */

const INDEX = '/demos/properties/index.html'
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    let res = await env.ASSETS.fetch(request)

    // SPA fallback for routes such as /plot/P04.
    if (res.status === 404) {
      const indexUrl = new URL(INDEX, request.url)
      res = await env.ASSETS.fetch(new Request(indexUrl, request))
    }

    return res
  },
}