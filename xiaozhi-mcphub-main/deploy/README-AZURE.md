# Azure Deployment Guide for xiaozhi-mcphub

This guide will help you deploy your MCP Hub to Microsoft Azure.

## Prerequisites

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Account** - Sign up for a free Azure account at [azure.microsoft.com](https://azure.microsoft.com/free/)
3. **Git** - For code deployment

## Quick Start (App Service)

### Method 1: Automated Deployment Script

```bash
# Make the script executable
chmod +x deploy/azure-app-service.sh

# Run the deployment script
./deploy/azure-app-service.sh
```

This script will:
- Create a resource group
- Set up Azure Database for PostgreSQL
- Create an App Service
- Configure all necessary settings

### Method 2: Manual Deployment

#### 1. Login to Azure

```bash
az login
```

#### 2. Create Resource Group

```bash
az group create --name xiaozhi-mcphub-rg --location eastus
```

#### 3. Create PostgreSQL Database

```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub-db \
    --location eastus \
    --admin-user xiaozhi \
    --admin-password "YourSecurePassword123!" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --version 16

# Create database
az postgres flexible-server db create \
    --resource-group xiaozhi-mcphub-rg \
    --server-name xiaozhi-mcphub-db \
    --database-name xiaozhi_mcphub

# Allow Azure services to access database
az postgres flexible-server firewall-rule create \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub-db \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0
```

#### 4. Create App Service Plan

```bash
az appservice plan create \
    --name xiaozhi-mcphub-plan \
    --resource-group xiaozhi-mcphub-rg \
    --location eastus \
    --sku FREE \
    --is-linux
```

#### 5. Create Web App

```bash
az webapp create \
    --resource-group xiaozhi-mcphub-rg \
    --plan xiaozhi-mcphub-plan \
    --name xiaozhi-mcphub \
    --runtime "NODE:22-lts"
```

#### 6. Configure App Settings

```bash
az webapp config appsettings set \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub \
    --settings \
        NODE_ENV=production \
        DATABASE_URL="postgres://xiaozhi:YourSecurePassword123!@xiaozhi-mcphub-db.postgres.database.azure.com:5432/xiaozhi_mcphub" \
        SMART_ROUTING_ENABLED=false \
        ENABLE_CORS=true
```

#### 7. Deploy Your Code

```bash
# Option A: Deploy from local directory
cd xiaozhi-mcphub-main
az webapp up --name xiaozhi-mcphub --resource-group xiaozhi-mcphub-rg

# Option B: Use ZIP deployment
zip -r deploy.zip .
az webapp deployment source config-zip \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub \
    --src deploy.zip

# Option C: Use Git deployment
az webapp deployment source config-local-git \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub

# Then push to the deployment URL shown
```

#### 8. View Your App

Your app will be available at: `https://xiaozhi-mcphub.azurewebsites.net`

## Container Deployment (Azure Container Instances)

For containerized deployment:

```bash
# Using Azure Container Instances
az container create \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub \
    --image huangjunsen/xiaozhi-mcphub:latest \
    --dns-name-label xiaozhi-mcphub \
    --ports 3000 \
    --environment-variables \
        NODE_ENV=production \
        SMART_ROUTING_ENABLED=false \
        DATABASE_URL="postgres://xiaozhi:password@server.postgres.database.azure.com:5432/dbname"
```

## Docker Deployment to Azure Container Registry

### 1. Create Container Registry

```bash
az acr create --resource-group xiaozhi-mcphub-rg \
    --name xiaozhimcphubacr --sku Basic
```

### 2. Login to ACR

```bash
az acr login --name xiaozhimcphubacr
```

### 3. Build and Push Image

```bash
cd xiaozhi-mcphub-main

# Build the image
docker build -t xiaozhimcphubacr.azurecr.io/xiaozhi-mcphub:latest .

# Push to Azure Container Registry
docker push xiaozhimcphubacr.azurecr.io/xiaozhi-mcphub:latest
```

### 4. Deploy to App Service with Custom Image

```bash
az webapp config container set \
    --name xiaozhi-mcphub \
    --resource-group xiaozhi-mcphub-rg \
    --docker-custom-image-name xiaozhimcphubacr.azurecr.io/xiaozhi-mcphub:latest \
    --docker-registry-server-url https://xiaozhimcphubacr.azurecr.io \
    --docker-registry-server-user xiaozhimcphubacr \
    --docker-registry-server-password YOUR_ACR_PASSWORD
```

## Monitoring and Logs

### View Application Logs

```bash
az webapp log tail --name xiaozhi-mcphub --resource-group xiaozhi-mcphub-rg
```

### Enable Log Streaming

```bash
az webapp log config \
    --name xiaozhi-mcphub \
    --resource-group xiaozhi-mcphub-rg \
    --application-logging filesystem \
    --detailed-error-messages true
```

### View Metrics

```bash
az monitor metrics list \
    --resource /subscriptions/YOUR_SUBSCRIPTION/resourceGroups/xiaozhi-mcphub-rg/providers/Microsoft.Web/sites/xiaozhi-mcphub \
    --metric "HttpServerErrors" "Requests"
```

## Environment Variables

Important environment variables to configure:

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to `production`
- `JWT_SECRET` - Random secret for JWT tokens (generate with: `openssl rand -base64 32`)
- `SMART_ROUTING_ENABLED` - Set to `false` or `true`
- `ENABLE_CORS` - Set to `true` for production

## Scaling

### Scale Up App Service Plan

```bash
az appservice plan update \
    --name xiaozhi-mcphub-plan \
    --resource-group xiaozhi-mcphub-rg \
    --sku B1
```

### Enable Auto-scaling

```bash
az monitor autoscale create \
    --resource-group xiaozhi-mcphub-rg \
    --resource /subscriptions/YOUR_SUB/resourceGroups/xiaozhi-mcphub-rg/providers/Microsoft.Web/serverfarms/xiaozhi-mcphub-plan \
    --name autoscale-settings \
    --min-count 1 \
    --max-count 3 \
    --count 1
```

## Troubleshooting

### Check App Status

```bash
az webapp show --name xiaozhi-mcphub --resource-group xiaozhi-mcphub-rg --query state
```

### Restart App

```bash
az webapp restart --name xiaozhi-mcphub --resource-group xiaozhi-mcphub-rg
```

### SSH into Container

```bash
az webapp ssh --name xiaozhi-mcphub --resource-group xiaozhi-mcphub-rg
```

### Test Database Connection

```bash
az postgres flexible-server show \
    --resource-group xiaozhi-mcphub-rg \
    --name xiaozhi-mcphub-db
```

## Cost Optimization

- Free Tier: App Service Free tier + PostgreSQL Burstable B1ms is free for 12 months
- Monitor costs with: `az consumption usage list --query "[].{Resource:instanceName, Cost:cost}"`
- Set budget alerts in Azure Portal

## Security Best Practices

1. **Use Managed Identity**: Enable managed identity for database access
2. **Enable HTTPS**: Configure SSL certificates
3. **Set JWT Secret**: Use a strong random secret
4. **Firewall Rules**: Restrict database access
5. **Application Insights**: Enable for monitoring and security

## Next Steps

1. Configure custom domain
2. Set up CI/CD with GitHub Actions
3. Enable Application Insights
4. Set up backup strategy
5. Configure SSL certificate

## Support

- Azure Documentation: https://docs.microsoft.com/azure/
- xiaozhi-mcphub Issues: https://github.com/huangjunsen/xiaozhi-mcphub/issues

