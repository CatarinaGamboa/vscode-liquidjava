// Type definitions used for LSP notifications between the client and server

export type Notification = {
    method: string;
    data: any;
}
