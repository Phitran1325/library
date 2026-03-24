import { Server as HttpServer } from 'http';
declare class WebSocketService {
    private io;
    private connectedUsers;
    private librarianSockets;
    initialize(server: HttpServer): void;
    private handleConnection;
    private handleSendMessage;
    private handleTyping;
    getConnectedLibrariansCount(): number;
    getConnectedUsersCount(): number;
}
declare const _default: WebSocketService;
export default _default;
//# sourceMappingURL=websocketService.d.ts.map