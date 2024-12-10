const baseServices = {
    redisService: Symbol('redisService'),
    loggerService: Symbol('loggerService'),
    errorService: Symbol('errorService'),
};

const dataServices = {
    hostSseClientConnection: Symbol('hostSseClientConnection'),
    hostWsClientConnection: Symbol('hostWsClientConnection'),
    msgClientClientConnection: Symbol('msgClientClientConnection'),
    msgServerServerConnection: Symbol('msgServerServerConnection'),
};

export const TYPES = {
    ...baseServices,
    ...dataServices,
};

export default TYPES;
