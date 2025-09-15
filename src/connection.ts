import { Socket, AddressInfo } from 'net';
import { ADDRESS_TYPE, AUTH_METHODS, COMMANDS, CONNECTION_STAGES, SOCKS_VERSION, REPLIES } from './constants';
import { authenticate } from './auth';

class Connection {
    private stage = CONNECTION_STAGES.GREETING;
    private targetSocket: Socket | null = null;

    constructor(private socket: Socket) {
        this.socket.on('data', (data) => this.handleData(data));
        this.socket.on('error', (err) => this.handleError(err));
        this.socket.on('close', () => this.handleClose());
        this.socket.on('end', () => this.handleEnd());
    }

    private sendReply(reply: REPLIES) {
        const {
            address,
            port
        } = (this.socket.address() as AddressInfo) || { address: '0.0.0.0', port: 0 };
        const ipBytes = address.split('.').map(octet => parseInt(octet, 10));

        const response = Buffer.from([
            SOCKS_VERSION,
            reply,
            0x00, // Reserved
            ADDRESS_TYPE.IPv4,
            ...ipBytes,
            (port >> 8) & 0xFF,
            port & 0xFF,
        ])

        this.socket.write(response, () => {
            if (reply !== REPLIES.SUCCEEDED) {
                this.socket.end();
            }
        });
    }

    private handleData(data: Buffer) {
        console.log('Data received:', data);
        
        // Different stages expect different version bytes
        if (this.stage === CONNECTION_STAGES.AUTHENTICATION) {
            // Authentication uses version 0x01
            const authVersion = data[0];
            if (authVersion !== 0x01) {
                console.error(`Unsupported auth version: ${authVersion}`);
                this.socket.destroy();
                return;
            }
        } else {
            // Other stages use SOCKS version 0x05
            const version = data[0];
            if (version !== SOCKS_VERSION) {
                console.error(`Unsupported SOCKS version: ${version}`);
                this.socket.destroy();
                return;
            }
        }
            
        switch (this.stage) {
            case CONNECTION_STAGES.GREETING:
                this.handleGreeting(data);
                break;
            case CONNECTION_STAGES.AUTHENTICATION:
                this.handleAuthentication(data);
                break;
            case CONNECTION_STAGES.REQUEST:
                this.handleRequest(data);
                break;
            case CONNECTION_STAGES.RELAY:
                // Data is being relayed; no action needed here
                break;
            default:
                console.error('Invalid connection stage');
                this.socket.destroy();
        }
        
    }

    private handleGreeting(data: Buffer) {
        const nMethods = data[1];
        if (!nMethods) {
            console.error('No authentication methods supported');
            this.socket.end();
            return;
        }
        const methods = data.slice(2, 2 + nMethods);

        if (methods.includes(AUTH_METHODS.USERNAME_PASSWORD)) {
            this.socket.write(Buffer.from([SOCKS_VERSION, AUTH_METHODS.USERNAME_PASSWORD]));
            this.stage = CONNECTION_STAGES.AUTHENTICATION;
            return;
        }
        if (methods.includes(AUTH_METHODS.NO_AUTHENTICATION_REQUIRED)) {
            this.socket.write(Buffer.from([SOCKS_VERSION, AUTH_METHODS.NO_AUTHENTICATION_REQUIRED]));
            this.stage = CONNECTION_STAGES.REQUEST;
            return;
        }

        this.socket.write(Buffer.from([SOCKS_VERSION, AUTH_METHODS.NO_ACCEPTABLE_METHODS]));
        return this.socket.end();
    }

    private handleAuthentication(data: Buffer) {
        const username_length = data[1];
        const username = data.slice(2, 2 + username_length!).toString('utf8');
        const password_length = data[2 + username_length!];
        const password = data.slice(3 + username_length!, 3 + username_length! + password_length!).toString('utf8');

        if (authenticate(username, password)) {
            this.socket.write(Buffer.from([0x01, 0x00])); // Version 1, status success
            this.stage = CONNECTION_STAGES.REQUEST;
        } else {
            this.socket.write(Buffer.from([0x01, 0x01])); // Version 1, status failure
            this.socket.end();
        }
    }

    private handleRequest(data: Buffer) {
        const command = data[1];
        if (command !== COMMANDS.CONNECT) { // 0x01 = CONNECT
            console.error(`Unsupported command: ${command}`);
            this.socket.end();
            return;
        }
        const addressType = data[3];

        let host: string;
        let port: number;

        if (addressType === ADDRESS_TYPE.IPv4) {
            host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
            port = data.readUInt16BE(8);
        } else if (addressType === ADDRESS_TYPE.DOMAINNAME) {
            const domainLength = data[4];
            if (!domainLength) {
                console.error('Invalid domain name length');
                this.socket.end();
                return;
            }
            host = data.slice(5, 5 + domainLength).toString('utf8');
            port = data.readUInt16BE(5 + domainLength);
        } else {
            console.error(`Unsupported address type: ${addressType}`);
            this.socket.end();
            return;
        }

        this.targetSocket = new Socket();
        this.targetSocket.connect(port, host, () => {
            console.log(`Connected to target ${host}:${port}`);
            this.sendReply(REPLIES.SUCCEEDED);
            this.stage = CONNECTION_STAGES.RELAY;
            this.socket.pipe(this.targetSocket!);
            this.targetSocket!.pipe(this.socket);
        });

        this.targetSocket.on('error', (err) => {
            console.error(`Target connection error: ${err.message}`);
            this.sendReply(REPLIES.HOST_UNREACHABLE);
            this.socket.end();
        });

        this.targetSocket.on('close', () => {
            console.log('Target connection closed');
            this.sendReply(REPLIES.GENERAL_FAILURE);
            this.socket.end();
        }); 
    }

    private handleError(err: Error) {
        console.error(`Connection error: ${err.message}`);
        this.handleClose();
    }

    private handleClose() {
        console.log('Connection closed');
        if (this.targetSocket) {
            this.targetSocket.destroy();
        }
    }

    private handleEnd() {
        console.log('Connection ended by client');
        this.handleClose();
    }
}

export default Connection;