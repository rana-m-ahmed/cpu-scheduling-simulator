# CPU Scheduling Simulator

A responsive React application for visualizing CPU scheduling algorithms, comparing performance metrics, and exploring adaptive feedback during simulation. The app is built with Vite, Tailwind CSS, Zustand, and Framer Motion.

## Overview

This repository contains the full project workspace. The application source lives in [`cpu-scheduler/`](cpu-scheduler), which is the folder Vercel should use as the project root when deploying the app.

The simulator includes:

- Algorithm selection for FCFS, SJF, SRTF, Priority, Priority Preemptive, Round Robin, and MLFQ.
- Interactive process management with sample data, add/edit/delete controls, and validation.
- Timeline playback with a Gantt-style visualization.
- Performance metrics, adaptive feedback, and starvation monitoring.

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Zustand
- Framer Motion
- Recharts
- Lucide React

## Repository Layout

- [`cpu-scheduler/`](cpu-scheduler) - application source, build tooling, and tests.
- [`cpu-scheduler/src/`](cpu-scheduler/src) - React app code.
- [`cpu-scheduler/src/components/`](cpu-scheduler/src/components) - UI components.
- [`cpu-scheduler/src/store/`](cpu-scheduler/src/store) - application state stores.
- [`cpu-scheduler/src/tests/`](cpu-scheduler/src/tests) - local automation scripts.

## Local Development

From the `cpu-scheduler` folder:

```bash
npm install
npm run dev
```

The app runs locally with Vite on the default development port.

## Production Build

From the `cpu-scheduler` folder:

```bash
npm run build
```

## Linting

From the `cpu-scheduler` folder:

```bash
npm run lint
```

## Deployment on Vercel

Recommended deployment settings:

- **Framework preset:** Vite
- **Root directory:** `cpu-scheduler`
- **Build command:** `npm run build`
- **Output directory:** `dist`

Before deploying, verify:

- The app builds successfully with `npm run build`.
- No lint errors are introduced by the deployment branch.
- The Vercel project is pointed at the `cpu-scheduler` subdirectory, not the repository root.

If you deploy from the Vercel UI, set the root directory to `cpu-scheduler`. If you use the repository root as the project root, Vercel will not find the app package automatically because the actual `package.json` lives in the subfolder.

## Testing Checklist

- `npm run build` passes.
- `npm run lint` passes for the application files.
- Browser smoke tests confirm process creation, algorithm switching, simulation playback, and metrics rendering.
- Responsive checks confirm the layout adapts across mobile, tablet, and desktop.

## Notes

- The repository root is intentionally kept as the documentation home.
- The application itself is located in `cpu-scheduler/` to match the current workspace layout.
