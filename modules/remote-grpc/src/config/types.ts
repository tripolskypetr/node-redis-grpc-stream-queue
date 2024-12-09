const baseServices = {
    protoService: Symbol('protoService'),
    loggerService: Symbol('loggerService'),
    errorService: Symbol('errorService'),
    streamService: Symbol('streamService'),
};

const clientServices = {
    fooClientService: Symbol('fooClientService'),
    barClientService: Symbol('barClientService'),
    bazClientService: Symbol('bazClientService'),
}

export const TYPES = {
    ...baseServices,
    ...clientServices,
};

export default TYPES;
