import { createClient, type RedisClientType } from "redis";

declare global {
    // eslint-disable-next-line no-var
    var _redis: RedisClientType | undefined;
}

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL is not set");

function create() {
    const client: RedisClientType = createClient({
        url,
        socket: {
            connectTimeout: 2_000,
            reconnectStrategy: (retries) =>
                retries < 3 ? Math.min(retries * 50, 1_000) : false,
        },
    });

    client.on("error", (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Redis error:", msg);
    });

    return client;
}

export const redis: RedisClientType =
    global._redis ??
    (() => {
        const c = create();
        c.connect().catch((e) => console.error("Redis connect failed:", e));
        global._redis = c;
        return c;
    })();
