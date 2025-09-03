# EIMS Project - Git Setup and GitHub Upload
# PowerShell Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "EIMS Project - Git Setup and GitHub Upload" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version 2>$null
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "2. Run the installer with default settings" -ForegroundColor Yellow
    Write-Host "3. Restart this script after installation" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Navigate to project directory
Set-Location "c:\Users\gaura\Pictures\EIMSDemo"

# Initialize Git repository
Write-Host "Step 1: Initializing Git repository..." -ForegroundColor Yellow
git init

# Configure Git
Write-Host "Step 2: Configuring Git user..." -ForegroundColor Yellow
$username = Read-Host "Enter your GitHub username"
$email = Read-Host "Enter your GitHub email"

git config user.name $username
git config user.email $email

# Add all files to staging
Write-Host "Step 3: Adding files to Git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "Step 4: Creating initial commit..." -ForegroundColor Yellow
$commitMessage = @"
Initial commit: EIMS (Electronic Information Management System)

- Full-stack TypeScript application for device monitoring
- React frontend with Vite build system
- Express.js backend with PostgreSQL database
- Role-based authentication and access control
- Real-time WebSocket communication
- 88 pre-seeded devices with demo data
- Comprehensive filtering and analytics
- Weather impact monitoring
- Alert management system
"@

git commit -m $commitMessage

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Next Steps - Create GitHub Repository:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to GitHub.com and sign in" -ForegroundColor White
Write-Host "2. Click the '+' icon and select 'New repository'" -ForegroundColor White
Write-Host "3. Repository name: eims-demo (or your preferred name)" -ForegroundColor White
Write-Host "4. Description: Electronic Information Management System - Full-stack device monitoring application" -ForegroundColor White
Write-Host "5. Keep it Public or Private (your choice)" -ForegroundColor White
Write-Host "6. DO NOT initialize with README, .gitignore, or license (we already have these)" -ForegroundColor White
Write-Host "7. Click 'Create repository'" -ForegroundColor White
Write-Host ""
Write-Host "8. Copy the repository URL and run these commands:" -ForegroundColor Green
Write-Host ""
Write-Host "   git remote add origin YOUR_REPOSITORY_URL" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "Example:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/$username/eims-demo.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✓ Repository is ready for GitHub upload!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
