import Script from "next/script";
import { getActivePixels } from "@/lib/settings";

// Cache بسيط — الإعدادات بتتغير نادرًا
let cachedPx: Awaited<ReturnType<typeof getActivePixels>> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // دقيقة

async function getPixelsCached() {
  const now = Date.now();
  if (cachedPx && now - cacheTime < CACHE_TTL) return cachedPx;
  cachedPx = await getActivePixels();
  cacheTime = now;
  return cachedPx;
}

export default async function TrackingPixels() {
  let px;
  try {
    px = await getPixelsCached();
  } catch {
    return null;
  }
  const none = !px.metaPixelId && !px.tiktokPixelId && !px.gaMeasurementId && !px.snapPixelId;
  if (none) return null;

  return (
    <>
      {px.metaPixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${px.metaPixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${px.metaPixelId}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}

      {px.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${px.tiktokPixelId}');
ttq.page();}(window, document, 'ttq');`}
        </Script>
      )}

      {px.gaMeasurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${px.gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${px.gaMeasurementId}');`}
          </Script>
        </>
      )}

      {px.snapPixelId && (
        <Script id="snap-pixel" strategy="afterInteractive">
          {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
snaptr('init', '${px.snapPixelId}');
snaptr('track', 'PAGE_VIEW');`}
        </Script>
      )}
    </>
  );
}
