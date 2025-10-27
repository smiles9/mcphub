#!/bin/bash

# Azure App Service Deployment Script for xiaozhi-mcphub
# This script deploys the MCP Hub to Azure App Service

echo "🚀 Starting Azure deployment for xiaozhi-mcphub..."

# Configuration
RESOURCE_GROUP="xiaozhi-mcphub-rg"
APP_NAME="xiaozhi-mcphub"
LOCATION="eastus"
PLAN_NAME="xiaozhi-mcphub-plan"
DATABASE_SERVER_NAME="xiaozhi-mcphub-db"
DATABASE_NAME="xiaozhi_mcphub"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed.${NC}"
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure (if not already logged in)
echo -e "${YELLOW}📝 Checking Azure login status...${NC}"
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "Please login to Azure..."
    az login
fi

# Set subscription (replace with your subscription ID or name)
# az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create resource group
echo -e "${YELLOW}📦 Creating resource group: ${RESOURCE_GROUP}...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan (Linux, free tier)
echo -e "${YELLOW}📋 Creating App Service Plan...${NC}"
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku FREE \
    --is-linux

# Create PostgreSQL Flexible Server
echo -e "${YELLOW}🗄️  Creating Azure Database for PostgreSQL...${NC}"
az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $DATABASE_SERVER_NAME \
    --location $LOCATION \
    --admin-user xiaozhi \
    --admin-password "Xiaozhi2024!" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --version 16

# Create database
echo -e "${YELLOW}📊 Creating database...${NC}"
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DATABASE_SERVER_NAME \
    --database-name $DATABASE_NAME

# Configure firewall to allow Azure services
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DATABASE_SERVER_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Create Web App
echo -e "${YELLOW}🌐 Creating Web App...${NC}"
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --name $APP_NAME \
    --runtime "NODE:22-lts"

# Configure app settings
echo -e "${YELLOW}⚙️  Configuring app settings...${NC}"
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        NODE_ENV=production \
        DATABASE_URL="postgres://xiaozhi:Xiaozhi2024!@${DATABASE_SERVER_NAME}.postgres.database.azure.com:5432/${DATABASE_NAME}" \
        SMART_ROUTING_ENABLED=false \
        ENABLE_CORS=true

# Enable startup logging
az webapp log config \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --application-logging filesystem \
    --detailed-error-messages true \
    --failed-request-tracing true \
    --web-server-logging filesystem

# Get the deployment URL
DEPLOYMENT_URL="https://${APP_NAME}.azurewebsites.net"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is available at: ${DEPLOYMENT_URL}${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy your application code using:"
echo "   az webapp up --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "2. Or use Git deployment:"
echo "   az webapp deployment source config-local-git --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "3. View logs:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"

