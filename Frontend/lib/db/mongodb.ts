let isConnected = false;

export default async function connectToDatabase(): Promise<void> {
  // Stub connection used for local/dev builds where Mongo is not wired yet.
  if (!isConnected) {
    isConnected = true;
  }
}

