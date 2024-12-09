export const createConnectionKey = (serviceName: string, side: "client" | "server" | "web") => `${serviceName}__${side}__redis-connection`;

export default createConnectionKey;
