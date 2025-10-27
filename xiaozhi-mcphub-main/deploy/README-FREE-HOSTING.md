# Free Hosting Options for xiaozhi-mcphub

Here are the best **FREE** hosting platforms for your MCP Hub:

## 🌟 Top Recommendations

### 1. **Railway** ⭐ (Best Overall)
- **Free Tier**: $5 credit/month, ~500 hours
- **Pros**: Zero config, PostgreSQL included, automatic deploys from GitHub
- **Setup Time**: 5 minutes

**Deploy Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects and deploys!

**Database Setup:**
- Railway automatically creates a PostgreSQL instance
- No configuration needed!

---

### 2. **Render** 
- **Free Tier**: 750 hours/month
- **Pros**: Free PostgreSQL, automatic SSL, custom domains
- **Cons**: Spins down after 15 min of inactivity

**Deploy Steps:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render settings:
   - **Build Command**: `pnpm install && pnpm frontend:build && pnpm build`
   - **Start Command**: `pnpm start`
   - **Environment**: Node 22
6. Add PostgreSQL database (separate service)

---

### 3. **Fly.io**
- **Free Tier**: 3 shared-cpu VMs, 160 GB outbound data
- **Pros**: Global edge deployment, fast worldwide
- **Best for**: Production use with scaling

**Deploy Steps:**
1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
2. Login: `fly auth login`
3. Launch: `fly launch --copy-config`
4. Deploy: `fly deploy`

**Note**: You'll need to configure the Dockerfile for Fly.io

---

### 4. **Heroku** (Limited)
- **Free Tier**: Currently not accepting new signups, but existing accounts still work
- **Alternative**: Consider other options

---

### 5. **Google Cloud Run** (Free Tier)
- **Free Tier**: 2 million requests/month
- **Pros**: Serverless, auto-scaling, pay-as-you-go
- **Setup**: More complex, requires Docker

---

### 5. **DigitalOcean App Platform**
- **Free Tier**: $200 credit for 60 days (use it wisely!)
- **Pros**: Simple deployment, good performance
- **After Free Credits**: Pay as you go (~$5-12/month for hobby plan)

---

### 6. **Netlify/Vercel** (Frontend Only)
- **Free Tier**: Unlimited
- **Use Case**: Host only the frontend, connect to backend API
- **Good for**: Static sites with API backend elsewhere

---

## 📊 Comparison Table

| Platform | Free Tier | PostgreSQL | Auto Deploy | Setup Time | Best For |
|----------|-----------|-----------|-------------|------------|----------|
| **Railway** | $5/month | ✅ Free | ✅ Yes | 5 min | ⭐ All users |
| **Render** | 750 hrs/mo | ✅ Free | ✅ Yes | 10 min | Best value |
| **Fly.io** | 3 VMs | ❌ Paid | ✅ Yes | 15 min | Production |
| **Cloud Run** | 2M req/mo | ❌ Paid | ⚠️ Manual | 20 min | Serverless |
| **DigitalOcean** | $200 credit | ❌ Paid | ✅ Yes | 10 min | After credits |

---

## 🚀 Quick Deploy Guides

### Railway (Recommended)

**Method 1: Via Dashboard**
1. Visit https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Select your repo
4. Railway handles everything!

**Method 2: Via CLI**
```bash
npm install -g @railway/cli
railway login
railway link  # In your project directory
railway up
```

**Environment Variables:**
Railway auto-generates DATABASE_URL. Add any others:
- `NODE_ENV=production`
- `SMART_ROUTING_ENABLED=false`
- `ENABLE_CORS=true`

---

### Render

**1. Create New Web Service**
- Login to https://render.com
- Click "New +" → "Web Service"
- Connect GitHub repository

**2. Configure Build Settings**
- **Name**: xiaozhi-mcphub
- **Region**: Choose closest
- **Branch**: main
- **Root Directory**: (leave empty)
- **Build Command**: `pnpm install && pnpm frontend:build && pnpm build`
- **Start Command**: `pnpm start`
- **Plan**: Free

**3. Add PostgreSQL Database**
- Click "New +" → "PostgreSQL"
- **Name**: xiaozhi-mcphub-db
- **Database**: xiaozhi_mcphub
- **User**: (auto-generated)
- **Password**: (copy this!)
- **Plan**: Free

**4. Add Environment Variables**
```
DATABASE_URL=postgres://user:pass@host:5432/xiaozhi_mcphub
NODE_ENV=production
SMART_ROUTING_ENABLED=false
```

**5. Deploy!**
- Click "Save changes"
- Watch it deploy

---

### Fly.io

**1. Install Fly CLI**
```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Or via Homebrew
brew install flyctl
```

**2. Login**
```bash
fly auth login
```

**3. Launch App**
```bash
cd xiaozhi-mcphub-main
fly launch --copy-config --name xiaozhi-mcphub
```

**4. Configure**
- Will auto-detect Dockerfile
- Choose region
- Configure environment variables in `fly.toml`

**5. Deploy**
```bash
fly deploy
```

**6. Add PostgreSQL (Optional)**
```bash
fly postgres create --name xiaozhi-mcphub-db
fly postgres attach --app xiaozhi-mcphub
```

---

### Vercel/Netlify (Frontend Only)

**Frontend to Vercel/Netlify:**

```bash
# Build and deploy frontend
cd xiaozhi-mcphub-main
pnpm frontend:build

# Deploy to Vercel
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod --dir=frontend/dist
```

**Connect to backend:**
Set environment variable in Vercel/Netlify:
```
VITE_API_URL=https://your-backend-url.com
```

---

## 🔧 Platform-Specific Configurations

### For Railway

Add `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### For Render

Add `render.yaml`:
```yaml
services:
  - type: web
    name: xiaozhi-mcphub
    env: node
    buildCommand: pnpm install && pnpm frontend:build && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production

databases:
  - name: xiaozhi-mcphub-db
    databaseName: xiaozhi_mcphub
    user: xiaozhi
```

### For Fly.io

Add `fly.toml`:
```toml
app = "xiaozhi-mcphub"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services]]
  processes = ["app"]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## 💰 Cost Breakdown

### Railway
- **Free**: $5/month credit (usually enough for small apps)
- **After**: $5/month minimum

### Render
- **Free**: 750 hours/month
- **After**: Free tier maintains PostgreSQL free

### Fly.io
- **Free**: 3 shared VMs, 160GB data
- **Database**: Extra (paid)

---

## 🎯 Recommendations

1. **For Quick Testing**: Railway (fastest setup)
2. **For Best Free Tier**: Render (750 hours + free PostgreSQL)
3. **For Production**: Fly.io or DigitalOcean
4. **For Frontend Only**: Vercel or Netlify

---

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs
- Vercel Docs: https://vercel.com/docs

---

## ⚡ Quick Commands

**Railway:**
```bash
railway login
railway up
railway logs
```

**Render:**
```bash
# Deploy via dashboard
# Or use render.yaml
```

**Fly.io:**
```bash
fly launch
fly deploy
fly logs
fly status
```

---

## 🔒 Security Notes

All platforms provide:
- ✅ Automatic SSL/HTTPS
- ✅ Free custom domains
- ✅ Environment variable encryption
- ✅ DDoS protection

---

Choose the platform that best fits your needs! Railway is recommended for the easiest setup.

