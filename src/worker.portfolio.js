/**
 * Portfolio Worker — serves the property-sales app behind a Vercel
 * /demos/properties/* rewrite.
 *
 * The build uses base=/demos/properties/ and the assets live under
 * dist-portfolio/demos/properties/, so the /demos/properties prefix MUST be
 * preserved end-to-end. Configure the Vercel rewrite WITHOUT stripping it:
 *   /demos/properties/:path*  ->  https://<portfolio-worker>/demos/properties/:path*
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