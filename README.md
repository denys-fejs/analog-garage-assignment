# Analog Garage - Real-time Data Visualization

## Features

- **Real-time data streaming** via WebSockets
- **Multi-series line charts** for visualizing multiple data producers
- **Time-based filtering** with customizable timeframes

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Rust (for the backend server)
- Cargo (Rust package manager)

## Installation

### Frontend

Clone the repository and install dependencies:

```bash
git clone https://github.com/denys-fejs/analog-garage-assignment.git
cd analog-garage-assignment
pnpm install
```

### Backend

The backend is a Rust WebSocket server that generates time-series data. Make sure you have Rust and Cargo installed.

If you don't have Rust installed, you can install it using [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Then navigate to the backend directory and build it:

```bash
cd backend
cargo build --release
```

## Running the Application

### Start the Backend Server

Start the WebSocket server on port 4000:

```bash
PORT=4000 cargo run --release
```

The backend will start generating random walk time series data at 1000 points per second per producer.

### Start the Frontend Development Server

In a separate terminal, start the React development server:

```bash
pnpm run dev
```

This will start the development server at [http://localhost:5173](http://localhost:5173).

## Development Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run linting
pnpm run lint

# Run tests
pnpm test

# Run tests with watch mode
pnpm run test:watch

# Generate test coverage report
pnpm run test:coverage
```

## Usage Guide

1. **Select Data Sources**: Use the sidebar to select which data producers you want to monitor
2. **Choose a Timeframe**: Select how much data you want to display (e.g., last 30 seconds, last 5 minutes)
3. **Interact with Charts**:
   - Use the brush component at the bottom of the main chart to select a custom time range
   - Hover over the chart to see exact values
   - Use the legend to toggle specific producers
4. **Control Data Flow**:
   - Pause/resume data collection using the control bar
   - Clear all collected data to start fresh
5. **Toggle Data Source**: Switch between real backend data and mock data for testing

## Configuration

Key application settings can be modified in `src/config/index.ts`:

- WebSocket connection settings
- Maximum data points to store
- Default timeframes
- UI update frequency

## Project Structure

```
src/
├── components/        # Reusable UI components
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── layout/            # Page layout components
├── modules/           # Feature modules
├── services/          # Service layer
├── types/             # TypeScript type definitions
├── utils/             # Helper functions
└── views/             # Page components
```

## Technical Documentation

For more detailed technical documentation, see the [docs].

## Testing

The project includes a comprehensive test suite using Vitest and React Testing Library:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Generate test coverage report
pnpm run test:coverage
```
