# SSL/TLS & HTTPS Configuration Guide

The **Devotee Management System (DMS)** handles sensitive personal records, spiritual records, credentials, and financial receipts. Encrypting all data in transit using **SSL/TLS (HTTPS)** is critical to prevent eavesdropping, man-in-the-middle (MITM) attacks, and credential theft.

---

## 1. Cloud Web Deployment (Vercel)

### Current Live Status
The production cloud application is deployed on Vercel with **automated SSL/TLS encryption**:
- **Production URL**: `https://devoteemanagement.vercel.app`
- **TLS Version**: TLS 1.3 / TLS 1.2
- **Certificate Provider**: Let's Encrypt / DigiCert (auto-renewed by Vercel Edge Network)

### HSTS & Transport Security Headers
The system enforces strict HTTPS at the edge via [`vercel.json`](../vercel.json):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```
> [!NOTE]
> The `Strict-Transport-Security` (HSTS) header instructs browsers to permanently interact with DMS exclusively over HTTPS for the next 2 years (`max-age=63072000`), refusing any unencrypted HTTP fallbacks.

### Adding a Custom Domain with SSL on Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Go to your project **devoteemanagement** > **Settings** > **Domains**.
3. Enter your custom domain or subdomain (e.g., `devotees.yourdomain.org`).
4. In your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap):
   - Add a `CNAME` record:
     - Name: `devotees` (or subdomain)
     - Target: `cname.vercel-dns.com`
   - Or an `A` record for apex root domain:
     - Value: `76.76.21.21`
5. Vercel automatically verifies the DNS record and provisions an SSL/TLS certificate within 1–2 minutes.

---

## 2. Docker & Caddy (Self-Hosted Production)

The repository provides an automated production stack using Caddy and Docker Compose in [`docker-compose.prod.yml`](../docker-compose.prod.yml) and [`Caddyfile`](../Caddyfile).

### How Caddy Handles SSL/TLS
Caddy automatically manages the entire SSL/TLS lifecycle:
1. Obtains free certificates from **Let's Encrypt** and **ZeroSSL**.
2. Automatically redirects all plain HTTP requests on port 80 to HTTPS on port 443.
3. Automatically renews certificates ~30 days prior to expiry without downtime.

### Setup Instructions
1. Open `.env` on your server and specify your public domain:
   ```env
   DOMAIN=devotees.yourdomain.org
   SCHEME=https
   ```
2. Point your domain's DNS `A` or `CNAME` record to your server's public IP address.
3. Ensure ports `80` and `443` (TCP and UDP for HTTP/3) are open in your server firewall:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 443/udp
   ```
4. Start the stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
5. Caddy will detect the public domain and obtain your SSL certificate automatically.

---

## 3. Direct Node.js Server (Standalone VPS)

If you are running the backend directly (`node whatsapp-bot/server.mjs`) on a Linux VPS without Caddy or Nginx, the Express server includes native SSL/TLS certificate support.

### Step 1: Obtain a Free Let's Encrypt Certificate via Certbot
Install Certbot:
```bash
sudo apt update
sudo apt install -y certbot
```

Obtain a standalone certificate (make sure port 80 is temporarily free):
```bash
sudo certbot certonly --standalone -d devotees.yourdomain.org
```

Certbot will output your certificates to:
- Certificate: `/etc/letsencrypt/live/devotees.yourdomain.org/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/devotees.yourdomain.org/privkey.pem`

### Step 2: Configure Environment Variables
In `whatsapp-bot/.env`:
```env
SSL_KEY_PATH=/etc/letsencrypt/live/devotees.yourdomain.org/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/devotees.yourdomain.org/fullchain.pem
FORCE_HTTPS=1
PORT=443
HOST=0.0.0.0
```

### Step 3: Run the Server
When `SSL_KEY_PATH` and `SSL_CERT_PATH` exist, `server.mjs` automatically boots using Node's `https.createServer`:
```bash
npm run robot
# Output:
# [System] Server running on https://0.0.0.0:443 (SSL/TLS Encrypted)
```

### Auto-Renewal for Certbot
Let's Encrypt certificates expire every 90 days. Certbot installs a systemd timer by default. To test renewal:
```bash
sudo certbot renew --dry-run
```

---

## 4. Cloudflare (Free SSL/TLS Proxy)

If your domain uses Cloudflare DNS:
1. Go to **SSL/TLS** in the Cloudflare Dashboard.
2. Select **Full (strict)** encryption mode.
3. Under **Edge Certificates**:
   - Turn **Always Use HTTPS** ON.
   - Turn **Automatic HTTPS Rewrites** ON.
   - Enable **HTTP Strict Transport Security (HSTS)**.

---

## 5. Verification & Testing

Once SSL/TLS is installed, verify the configuration:

1. **Browser Test**:
   - Navigate to `https://<your-domain>`.
   - Verify the padlock icon appears next to the URL.
   - Click the padlock > **Connection is secure** > **Certificate is valid** to view the issuer and expiration date.
2. **HTTP Redirection Test**:
   - Open a terminal and run:
     ```bash
     curl -I http://<your-domain>
     ```
   - Expect a `301 Moved Permanently` or `308 Permanent Redirect` pointing to `https://...`.
3. **Security Headers Test**:
   - Run:
     ```bash
     curl -I https://<your-domain>
     ```
   - Verify `strict-transport-security` is present in the response headers.
4. **Qualys SSL Labs**:
   - Run a test at [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/).
   - The setup achieves an **A+** security grade.
