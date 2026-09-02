/**
 * Lightweight SEO / social-sharing metadata manager. Centralises document
 * title, meta description, canonical, and Open Graph / Twitter card tags so
 * the SPA updates them on navigation (SPAs render these at runtime, which
 * social crawlers and search engines can read for client-rendered content).
 */
import { CONFIG } from './config.js'

const SITE = CONFIG.site

/** Set the full set of SEO meta tags for a given page. */
export function setSeo({ title, description, url, image }) {
  document.title = title
  meta('name', 'description', description)
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:type', 'website')
  meta('property', 'og:url', url || SITE.domain)
  meta('property', 'og:site_name', SITE.name)
  if (image) meta('property', 'og:image', absolute(image))
  meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
  meta('name', 'twitter:title', title)
  meta('name', 'twitter:description', description)
  if (image) meta('name', 'twitter:image', absolute(image))
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url || SITE.domain)
}

/** Default metadata used for the home / map page. */
export function homeSeo() {
  return {
    title: `${SITE.name} — ${SITE.tagline} on an Interactive Map`,
    description: SITE.description,
    url: SITE.domain,
    image: '/images/P01/hero.webp',
  }
}

function meta(attr, key, content) {
  if (content == null || content === '') return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

function absolute(path) {
  if (/^https?:\/\//.test(path)) return path
  return SITE.domain.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
}
