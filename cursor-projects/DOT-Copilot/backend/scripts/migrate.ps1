# Database migration script for production (PowerShell)

Write-Host "Running database migrations..." -ForegroundColor Green

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

Write-Host "Migrations completed successfully!" -ForegroundColor Green

