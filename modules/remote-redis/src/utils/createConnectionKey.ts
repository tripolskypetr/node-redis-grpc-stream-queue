export const createConnectionKey = (serviceName: string, side: "client" | "server") => `${serviceName}__${side}__redis-connection`;

export default createConnectionKey;
