/// <reference lib="webworker" />

const connections: MessagePort[] = [];

(self as any).onconnect = (connectEvent: MessageEvent) => {
  const port = connectEvent.ports[0];
  connections.push(port);

  port.onmessage = (messageEvent) => {
    switch (messageEvent.data.action) {
      case 'closetab':
        broadcastToAll(messageEvent.data);
        break;
      case 'terminate':
        terminateAll();
        break;
      default:
        break;
    }
  };
};

function broadcastToAll(message: any) {
  connections.forEach((connection) => connection.postMessage(message));
}

function terminateAll() {
  self.close(); // Terminate the worker
}
