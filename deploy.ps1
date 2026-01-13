# Quick Deploy Script
# Run this to commit and push your fixes to trigger a Vercel redeploy

Write-Host "🚀 Preparing to deploy fixes..." -ForegroundColor Cyan

# Check git status
Write-Host "`n📋 Current changes:" -ForegroundColor Yellow
git status --short

# Stage all changes
Write-Host "`n📦 Staging changes..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix Vercel deployment: Remove invalid runtime config, update CSP headers"

# Push
Write-Host "`n⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Done! Check Vercel dashboard for deployment progress." -ForegroundColor Green
Write-Host "⚠️  IMPORTANT: Don't forget to add environment variables in Vercel!" -ForegroundColor Red
Write-Host "   See DEPLOYMENT_FIX.md for details.`n" -ForegroundColor Yellow
