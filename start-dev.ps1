# Start Infrastructure
Write-Host "Starting Infrastructure (Docker)..."
docker-compose up -d

# Start Backend and Frontend
Write-Host "Starting Backend and Frontend..."
bun install
bun run dev
