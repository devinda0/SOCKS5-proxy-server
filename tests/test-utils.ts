import { EventEmitter } from 'events';
import { SOCKS_VERSION, COMMANDS, ADDRESS_TYPE } from '../src/constants';

export class MockSocket extends EventEmitter {
  public written: Buffer[] = [];
  public ended: boolean = false;
  public destroyed: boolean = false;

  write(data: Buffer | string, cb?: () => void): boolean {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.written.push(buffer);
    if (cb) {
      process.nextTick(cb);
    }
    return true;
  }

  end(): void {
    this.ended = true;
    this.emit('end');
  }

  destroy(): void {
    this.destroyed = true;
    this.emit('close');
  }

  pipe(destination: any): any {
    return destination;
  }

  address() {
    return {
      address: '127.0.0.1',
      port: 1080,
      family: 'IPv4'
    };
  }

  // Test utility methods
  simulateData(data: Buffer): void {
    this.emit('data', data);
  }

  simulateError(error: Error): void {
    this.emit('error', error);
  }

  simulateClose(): void {
    this.emit('close');
  }

  clearWritten(): void {
    this.written = [];
  }

  getWrittenData(): Buffer {
    return Buffer.concat(this.written);
  }
}

export class MockTargetSocket extends EventEmitter {
  public connected: boolean = false;
  public ended: boolean = false;
  public destroyed: boolean = false;

  connect(port: number, host?: string, cb?: () => void): this {
    process.nextTick(() => {
      this.connected = true;
      this.emit('connect');
      if (cb) cb();
    });
    return this;
  }

  write(data: Buffer | string): boolean {
    return true;
  }

  end(): void {
    this.ended = true;
    this.emit('end');
  }

  destroy(): void {
    this.destroyed = true;
    this.emit('close');
  }

  pipe(destination: any): any {
    return destination;
  }

  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  removeAllListeners(event?: string): this {
    return super.removeAllListeners(event);
  }
}

export function createGreetingMessage(methods: number[]): Buffer {
  const methodsBuffer = Buffer.from(methods);
  return Buffer.concat([
    Buffer.from([SOCKS_VERSION, methods.length]),
    methodsBuffer
  ]);
}

export function createAuthMessage(username: string, password: string): Buffer {
  const usernameBuffer = Buffer.from(username, 'utf8');
  const passwordBuffer = Buffer.from(password, 'utf8');
  
  return Buffer.concat([
    Buffer.from([0x01]), // Auth version
    Buffer.from([usernameBuffer.length]),
    usernameBuffer,
    Buffer.from([passwordBuffer.length]),
    passwordBuffer
  ]);
}

export function createConnectRequestIPv4(ip: string, port: number): Buffer {
  const ipParts = ip.split('.').map(part => parseInt(part, 10));
  const portBytes = [(port >> 8) & 0xFF, port & 0xFF];
  
  return Buffer.from([
    SOCKS_VERSION,
    COMMANDS.CONNECT,
    0x00, // Reserved
    ADDRESS_TYPE.IPv4,
    ...ipParts,
    ...portBytes
  ]);
}

export function createConnectRequestDomain(domain: string, port: number): Buffer {
  const domainBuffer = Buffer.from(domain, 'utf8');
  const portBytes = [(port >> 8) & 0xFF, port & 0xFF];
  
  return Buffer.concat([
    Buffer.from([
      SOCKS_VERSION,
      COMMANDS.CONNECT,
      0x00, // Reserved
      ADDRESS_TYPE.DOMAINNAME,
      domainBuffer.length
    ]),
    domainBuffer,
    Buffer.from(portBytes)
  ]);
}

export function waitFor(condition: () => boolean, timeout: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    
    check();
  });
}