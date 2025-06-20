# Executable Builds

This directory contains scripts and configuration for building standalone executables of the Lakeshore Transportation Billing Workflow.

## Quick Start

## Manual Build Commands

```bash
# Install nexe (build tool)
npm run install:nexe

# Build specific platforms
npm run build:windows         # Windows .exe
npm run build:linux           # Linux binary
npm run build:macos           # macOS binary

# Build interactive versions
npm run build:interactive:windows
npm run build:interactive:linux  
npm run build:interactive:macos

# Build everything at once
npm run build:all
```

## Generated Executables

After building, you'll find these files in the `build/` directory:

### Simple Command-Line Version
- `billingWorkflow-windows.exe` - Windows executable
- `billingWorkflow-linux` - Linux executable  
- `billingWorkflow-macos` - macOS executable

### Interactive Version (with prompts)
- `billingWorkflow-interactive-windows.exe`
- `billingWorkflow-interactive-linux`
- `billingWorkflow-interactive-macos`

## Usage

The executables work exactly like the Node.js version but don't require Node.js to be installed:

```bash
# Windows
billingWorkflow-windows.exe --help
billingWorkflow-windows.exe -s 06/01/2025 -e 06/19/2025

# Linux/macOS
./billingWorkflow-linux --help
./billingWorkflow-linux -s 06/01/2025 -e 06/19/2025

# Interactive mode
./billingWorkflow-interactive-linux --interactive
```

## Requirements

- The executables are self-contained and don't require Node.js
- They still need:
  - `.env` file with RouteGenie credentials
  - `mappings/QB_Service_codes.csv` file
  - Internet connection for RouteGenie API calls

## Distribution

You can distribute these executables to end users who don't have Node.js installed. Just include:

1. The appropriate executable for their platform
2. `.env.example` (they need to rename and fill in credentials)
3. `mappings/` directory with required CSV files
4. Basic usage instructions

## Troubleshooting

If builds fail:

1. Make sure TypeScript compiles: `npm run build`
2. Check nexe installation: `npm run install:nexe`
3. Try building one platform at a time
4. Check the verbose output for specific errors
5. Ensure you have enough disk space (builds can be large)

## Build Configuration

- **Node.js version**: 18.20.8 (matches your WSL environment)
- **Build tool**: nexe 4.0.0-rc.2
- **Targets**: Windows x64, Linux x64, macOS x64
- **Configuration**: See `nexe.config.js`
