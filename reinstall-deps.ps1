# Stop any running processes
Write-Host "Please stop the running dev server (Ctrl+C) before running this script" -ForegroundColor Yellow
Read-Host "Press Enter when ready to continue"

# Navigate to remix-app
Set-Location remix-app

# Remove node_modules and reinstall
Write-Host "Removing node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}

Write-Host "Reinstalling dependencies..." -ForegroundColor Cyan
bun install

Write-Host "Dependencies reinstalled successfully!" -ForegroundColor Green
Write-Host "You can now run: bun run dev" -ForegroundColor Yellow

Set-Location ..
