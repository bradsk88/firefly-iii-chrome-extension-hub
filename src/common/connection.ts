export interface Connection {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    isRegistered: boolean;
    lastAutoRunDurationSeconds?: number;
}