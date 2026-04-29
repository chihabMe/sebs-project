#!/bin/bash

# This script runs the backend, frontend, and admin apps using the existing Turborepo configuration.
# Note: You can also just run `pnpm run dev` directly in your terminal.

echo "Starting SEBS backend, frontend, and admin concurrently..."
pnpm run dev
