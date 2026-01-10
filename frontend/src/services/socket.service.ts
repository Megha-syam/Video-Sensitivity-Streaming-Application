import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Upload progress events
  onUploadProgress(callback: (data: { videoId: string; progress: number }) => void) {
    this.socket?.off('upload:progress'); // Remove old listener
    this.socket?.on('upload:progress', callback);
  }

  onUploadComplete(callback: (data: { videoId: string; status: string }) => void) {
    this.socket?.off('upload:complete'); // Remove old listener
    this.socket?.on('upload:complete', callback);
  }

  onUploadError(callback: (data: { error: string }) => void) {
    this.socket?.off('upload:error'); // Remove old listener
    this.socket?.on('upload:error', callback);
  }

  // Sensitivity check events
  onSensitivityChecking(callback: (data: { videoId: string; message: string }) => void) {
    this.socket?.off('sensitivity:checking'); // Remove old listener
    this.socket?.on('sensitivity:checking', callback);
  }

  onSensitivityResult(callback: (data: { videoId: string; status: string; confidence?: number; labels?: string[] }) => void) {
    this.socket?.off('sensitivity:result'); // Remove old listener
    this.socket?.on('sensitivity:result', callback);
  }

  // Emit events
  emitUploadProgress(data: { videoId: string; progress: number }) {
    this.socket?.emit('upload:progress', data);
  }

  // Remove specific listener
  off(event: string) {
    this.socket?.off(event);
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
