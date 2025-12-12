export enum ApiEventStatus {
    DEFAULT,
    IN_PROGRESS,
    COMPLETED,
    ERROR,
}

export enum ApiEventType {
    DEFAULT,
    AUTHENTICATION,
    SUBMIT_QUERY,
    REFRESH_TOKEN
    // ... other event types
}

export interface ApiEvent {
    type: ApiEventType;
    status: ApiEventStatus;
    title?: string;
    message?: string;
    spinner?: boolean;
    popup?: boolean;
    toast?: boolean;
    targetId?: string | number;
}
