# ClassAid Static Site (PWA + Vercel)

## Deploy
1) Drag this folder into a new Vercel project (Framework preset: "Other").
2) Build command: none. Output directory: `/` (static). 
3) Add your custom domain in Vercel, set it as the primary domain.

## Email capture
- Replace the placeholder Formspree endpoint in `app.js` with your own or create a Vercel function at `/api/subscribe`.

## Local dev
- Use any static server, e.g. `npx serve .`

## DNS (Porkbun)
- A @  -> **use the IP Vercel shows in your dashboard**.
- CNAME www -> `cname.vercel-dns.com.`
- Remove any other A/ALIAS/URL records for @ and www.
