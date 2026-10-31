import { DatabaseSync } from 'node:sqlite';

export class Database {
    constructor(path) {
        this.db = new DatabaseSync(path);
    }

    exec(sql) {
        return this.db.exec(sql);
    }

    prepare(sql) {
        return this.db.prepare(sql);
    }

    pragma(source) {
        return this.db.prepare(`PRAGMA ${source}`).all();
    }

    close() {
        this.db.close();
    }
}