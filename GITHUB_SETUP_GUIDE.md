# GitHub Setup Guide - Upload mcphub to GitHub

## 🚀 **Quick Setup (5 Minutes)**

### Step 1: Install Git (if you don't have it)

Check if you have git:
```bash
git --version
```

If not installed, download from: https://git-scm.com/download/win

---

### Step 2: Initialize Git Repository

```bash
# Navigate to your project folder
cd "c:\Users\Binhu\OneDrive\Documents\WRO\mcphub"

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: UK Buses MCP Server"
```

---

### Step 3: Create GitHub Repository

1. Go to **https://github.com**
2. Click **"+"** button (top right)
3. Select **"New repository"**
4. **Repository name:** `mcphub` (or any name you like)
5. Choose **Public** or **Private**
6. **DO NOT** check "Add README" or "Add .gitignore"
7. Click **"Create repository"**

---

### Step 4: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote origin (use YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/mcphub.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username!**

---

### Step 5: Enter GitHub Credentials

When you run `git push`, you'll be asked for:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)

To create a token:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Give it a name like "mcphub"
4. Select scopes: `repo` (full control)
5. Click "Generate token"
6. Copy the token (you'll only see it once!)
7. Use this token as your password

---

## 📋 **Complete Commands (Copy & Paste)**

```bash
# 1. Navigate to project
cd "c:\Users\Binhu\OneDrive\Documents\WRO\mcphub"

# 2. Initialize git
git init

# 3. Add all files
git add .

# 4. Commit
git commit -m "Initial commit: UK Buses MCP Server"

# 5. Add remote (REPLACE YOUR_USERNAME!)
git remote add origin https://github.com/YOUR_USERNAME/mcphub.git

# 6. Set branch to main
git branch -M main

# 7. Push to GitHub
git push -u origin main
```

---

## ✅ **Verification**

After pushing, you should see:
- Your files uploaded to GitHub
- GitHub URL: `https://github.com/YOUR_USERNAME/mcphub`

---

## 🔄 **Future Updates**

After making changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

---

## 🆘 **Troubleshooting**

### "Remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/mcphub.git
```

### "Authentication failed"
- Make sure you're using Personal Access Token, not password
- Token must have `repo` scope

### "Failed to push"
- Make sure GitHub repo exists
- Check if you have write access

---

## 📚 **Resources**

- Git docs: https://git-scm.com/doc
- GitHub docs: https://docs.github.com
- Personal tokens: https://github.com/settings/tokens

---

Once your code is on GitHub, you can deploy to Railway or Render! 🎉
