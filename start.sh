#!/bin/bash

echo "=== Starting Trading Journal ==="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8080"
echo "Database: localhost:5432"
echo ""

docker compose up --build
