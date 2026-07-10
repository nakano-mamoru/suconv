type ListenerMap = Record<string, Array<() => void>>;

export function installIndexedDbMock(): void {
    const mockDb = {
        objectStoreNames: {
            contains: () => true,
        },
        createObjectStore: () => undefined,
        transaction: () => ({
            objectStore: () => ({
                get: () => {
                    const listeners: ListenerMap = {};
                    const request = {
                        result: undefined,
                        error: null,
                        addEventListener(type: string, callback: () => void) {
                            listeners[type] ??= [];
                            listeners[type].push(callback);
                            if (type === 'success') {
                                queueMicrotask(() => callback());
                            }
                        },
                    };
                    return request;
                },
                put: () => undefined,
            }),
            addEventListener: (type: string, callback: () => void) => {
                if (type === 'complete') {
                    queueMicrotask(() => callback());
                }
            },
        }),
    };

    const indexedDb = {
        open: () => {
            const listeners: ListenerMap = {};
            const request = {
                result: mockDb,
                error: null,
                addEventListener(type: string, callback: () => void) {
                    listeners[type] ??= [];
                    listeners[type].push(callback);
                    if (type === 'success') {
                        queueMicrotask(() => callback());
                    }
                },
            };
            return request;
        },
    };

    Object.defineProperty(globalThis, 'indexedDB', {
        value: indexedDb,
        configurable: true,
        writable: true,
    });
}
