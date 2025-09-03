@echo off
echo ================================================
echo EIMS Project - Git Setup and GitHub Upload
echo ================================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    echo.
    echo Please install Git first:
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Run the installer with default settings
    echo 3. Restart this script after installation
    echo.
    pause
    exit /b 1
)

echo Git is installed. Proceeding with repository setup...
echo.

REM Navigate to project directory
cd /d "c:\Users\gaura\Pictures\EIMSDemo"

REM Initialize Git repository
echo Step 1: Initializing Git repository...
git init

REM Configure Git (you may want to update these)
echo Step 2: Configuring Git user...
echo Please enter your Git configuration details:
set /p USERNAME="Enter your GitHub username: "
set /p EMAIL="Enter your GitHub email: "

git config user.name "%USERNAME%"
git config user.email "%EMAIL%"

REM Add all files to staging
echo Step 3: Adding files to Git...
git add .

REM Create initial commit
echo Step 4: Creating initial commit...
git commit -m "Initial commit: EIMS (Electronic Information Management System)

- Full-stack TypeScript application for device monitoring
- React frontend with Vite build system
- Express.js backend with PostgreSQL database
- Role-based authentication and access control
- Real-time WebSocket communication
- 88 pre-seeded devices with demo data
- Comprehensive filtering and analytics
- Weather impact monitoring
- Alert management system"

REM Instructions for GitHub
echo.
echo ================================================
echo Next Steps - Create GitHub Repository:
echo ================================================
echo.
echo 1. Go to GitHub.com and sign in
echo 2. Click the '+' icon and select 'New repository'
echo 3. Repository name: eims-demo (or your preferred name)
echo 4. Description: Electronic Information Management System - Full-stack device monitoring application
echo 5. Keep it Public or Private (your choice)
echo 6. DO NOT initialize with README, .gitignore, or license (we already have these)
echo 7. Click 'Create repository'
echo.
echo 8. Copy the repository URL (it will look like: https://github.com/yourusername/eims-demo.git)
echo 9. Run these commands in this directory:
echo.
echo    git remote add origin YOUR_REPOSITORY_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo Example:
echo    git remote add origin https://github.com/yourusername/eims-demo.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ================================================
echo Repository is ready for GitHub upload!
echo ================================================
pause
