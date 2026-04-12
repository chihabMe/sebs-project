#!/bin/bash

# This script runs both the frontend and backend using the existing Turborepo configuration.
# Note: You can also just run `pnpm run dev` directly in your terminal.

echo "Starting SEBS backend and frontend concurrently..."
pnpm run dev
