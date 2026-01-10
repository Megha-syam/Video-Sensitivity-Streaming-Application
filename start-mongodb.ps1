# Start MongoDB Service
# This script will start MongoDB on your Windows machine

Write-Host "🔍 Checking MongoDB installation..." -ForegroundColor Cyan

# Option 1: Try to start as Windows Service
try {
    $service = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "✓ Found MongoDB service" -ForegroundColor Green
        if ($service.Status -eq 'Running') {
            Write-Host "✓ MongoDB is already running!" -ForegroundColor Green
        } else {
            Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
            Start-Service MongoDB
            Write-Host "✓ MongoDB service started!" -ForegroundColor Green
        }
        exit 0
    }
} catch {
    Write-Host "MongoDB service not found. Trying manual start..." -ForegroundColor Yellow
}

# Option 2: Try common MongoDB installation paths
$mongodPaths = @(
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe",
    "C:\mongodb\bin\mongod.exe"
)

$mongodExe = $null
foreach ($path in $mongodPaths) {
    if (Test-Path $path) {
        $mongodExe = $path
        Write-Host "✓ Found MongoDB at: $path" -ForegroundColor Green
        break
    }
}

if ($mongodExe) {
    # Create data directory if it doesn't exist
    $dataPath = "C:\data\db"
    if (-not (Test-Path $dataPath)) {
        Write-Host "Creating data directory: $dataPath" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
    }
    
    Write-Host "Starting MongoDB manually..." -ForegroundColor Yellow
    Write-Host "Data directory: $dataPath" -ForegroundColor Cyan
    Write-Host "Port: 27017" -ForegroundColor Cyan
    
    # Start MongoDB in a new window
    Start-Process -FilePath $mongodExe -ArgumentList "--dbpath=`"$dataPath`"" -WindowStyle Normal
    
    Write-Host "✓ MongoDB started!" -ForegroundColor Green
    Write-Host "MongoDB is running on mongodb://localhost:27017" -ForegroundColor Green
} else {
    Write-Host "`n❌ MongoDB not found on this system!" -ForegroundColor Red
    Write-Host "`nPlease install MongoDB:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host "2. Install MongoDB Community Edition" -ForegroundColor Cyan
    Write-Host "3. Run this script again" -ForegroundColor Cyan
    exit 1
}
