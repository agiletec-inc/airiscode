# @airiscode/runners-docker

Docker operations runner for AIRIS Code.

## Features

- **Docker Compose**: Start, stop, and get logs from Compose services
- **Container Management**: List, inspect, and monitor containers
- **Health Checks**: Monitor container health status
- **Stats Monitoring**: Get real-time container resource usage
- **Container Logs**: Retrieve and follow container logs
- **Image Operations**: List and pull images
- **Network Management**: List Docker networks
- **Volume Management**: List Docker volumes
- **Type-Safe Results**: All operations return `Result<T, DockerRunnerError>`

## Installation

```bash
pnpm add @airiscode/runners-docker
```

## Usage

### Docker Compose Operations

```typescript
import { DockerRunner } from '@airiscode/runners-docker';

const runner = new DockerRunner('/path/to/project');

// Start services
await runner.composeUp({
  file: 'docker-compose.yml',
  projectName: 'myapp',
  build: true,
  detach: true,
});

// Get logs
const logsResult = await runner.composeLogs({
  file: 'docker-compose.yml',
  follow: false,
});

if (logsResult.ok) {
  console.log(logsResult.value);
}

// Stop services
await runner.composeDown({
  file: 'docker-compose.yml',
  volumes: true,
});
```

### Container Operations

```typescript
// List containers
const containersResult = await runner.listContainers();
if (containersResult.ok) {
  containersResult.value.forEach((container) => {
    console.log(`${container.name}: ${container.state}`);
    console.log(`  Image: ${container.image}`);
    console.log(`  Ports: ${JSON.stringify(container.ports)}`);
  });
}

// Get container health
const healthResult = await runner.getContainerHealth('container-id');
if (healthResult.ok) {
  console.log('Health status:', healthResult.value.status);
  console.log('Failing streak:', healthResult.value.failingStreak);
}

// Get container stats
const statsResult = await runner.getContainerStats('container-id');
if (statsResult.ok) {
  const stats = statsResult.value;
  console.log(`CPU: ${stats.cpuPercent}%`);
  console.log(`Memory: ${stats.memoryUsage.percent}%`);
  console.log(`Network RX: ${stats.network.rx} bytes`);
  console.log(`Network TX: ${stats.network.tx} bytes`);
}

// Get container logs
const logsResult = await runner.getContainerLogs('container-id', {
  tail: 100,
  timestamps: true,
});

if (logsResult.ok) {
  console.log(logsResult.value);
}
```

### Image Operations

```typescript
// List images
const imagesResult = await runner.listImages();
if (imagesResult.ok) {
  imagesResult.value.forEach((image) => {
    console.log(`${image.tags.join(', ')}: ${image.size} bytes`);
  });
}

// Pull image
const pullResult = await runner.pullImage('nginx:latest');
if (pullResult.ok) {
  console.log('Image pulled successfully');
}
```

### Network and Volume Operations

```typescript
// List networks
const networksResult = await runner.listNetworks();
if (networksResult.ok) {
  networksResult.value.forEach((network) => {
    console.log(`${network.name} (${network.driver})`);
  });
}

// List volumes
const volumesResult = await runner.listVolumes();
if (volumesResult.ok) {
  volumesResult.value.forEach((volume) => {
    console.log(`${volume.name}: ${volume.mountpoint}`);
  });
}
```

### Error Handling

```typescript
const result = await runner.listContainers();

if (!result.ok) {
  console.error('Operation:', result.error.operation);
  console.error('Message:', result.error.message);
  if (result.error.cause) {
    console.error('Cause:', result.error.cause);
  }
}
```

## API Reference

### DockerRunner

#### Constructor

```typescript
new DockerRunner(workingDir: string, dockerOptions?: Docker.DockerOptions)
```

#### Docker Compose Methods

- `composeUp(options?: ComposeUpOptions): Promise<ComposeUpResult>` - Start Compose services
- `composeDown(options?: ComposeDownOptions): Promise<ComposeDownResult>` - Stop Compose services
- `composeLogs(options?): Promise<ComposeLogsResult>` - Get Compose logs

#### Container Methods

- `listContainers(all?: boolean): Promise<ContainerListResult>` - List containers
- `getContainerHealth(containerId: string): Promise<ContainerHealthResult>` - Get health status
- `getContainerStats(containerId: string): Promise<ContainerStatsResult>` - Get resource stats
- `getContainerLogs(containerId: string, options?: ContainerLogsOptions): Promise<ContainerLogsResult>` - Get logs

#### Image Methods

- `listImages(): Promise<ImageListResult>` - List images
- `pullImage(imageName: string): Promise<ImagePullResult>` - Pull image

#### Network & Volume Methods

- `listNetworks(): Promise<NetworkListResult>` - List networks
- `listVolumes(): Promise<VolumeListResult>` - List volumes

## Types

### ComposeUpOptions

```typescript
interface ComposeUpOptions {
  file?: string;          // Compose file path
  projectName?: string;   // Project name
  build?: boolean;        // Build images before starting
  detach?: boolean;       // Detached mode
  removeOrphans?: boolean; // Remove orphan containers
  forceRecreate?: boolean; // Force recreate containers
}
```

### ContainerInfo

```typescript
interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';
  status: string;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: 'tcp' | 'udp';
  }>;
  created: Date;
}
```

### ContainerHealth

```typescript
interface ContainerHealth {
  containerId: string;
  status: 'starting' | 'healthy' | 'unhealthy' | 'none';
  failingStreak: number;
  lastCheck?: {
    exitCode: number;
    output: string;
    start: Date;
    end: Date;
  };
}
```

### ContainerStats

```typescript
interface ContainerStats {
  containerId: string;
  cpuPercent: number;
  memoryUsage: {
    usage: number;
    limit: number;
    percent: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  blockIO: {
    read: number;
    write: number;
  };
  pids: number;
}
```

See [types.ts](./src/types.ts) for complete type definitions.

## License

MIT
