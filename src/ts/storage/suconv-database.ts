const DATABASE_NAME = 'suconv';
const DATABASE_VERSION = 3;

export class SuconvDatabase {

    public static async openDatabase(): Promise<IDBDatabase> {
        return await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

            request.addEventListener('upgradeneeded', () => {
                const db = request.result;
                for (const storeName of ['Settings', 'Preferences', 'DefaultParams', 'Secrets']) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'key' });
                    }
                }
            });

            request.addEventListener('success', () => resolve(request.result));
            request.addEventListener('error', () => reject(request.error));
        });
    }
}