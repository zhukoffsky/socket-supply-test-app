import {addRxPlugin, createRxDatabase} from 'rxdb'
import {getRxStorageDexie} from 'rxdb/plugins/storage-dexie'
import {RxDBDevModePlugin} from "rxdb/plugins/dev-mode";

export class DB {
    database = null;

    constructor() {
    }

    getDatabase() {
        return this.database;
    }

    async initDatabase() {
        if (!this.database) {
            console.log('initDatabase');
            // addRxPlugin(RxDBDevModePlugin);
            const database = await createRxDatabase({
                name: 'test_ss_db',
                storage: getRxStorageDexie(),
            });
            try {
                await database.addCollections({
                    messages: {
                        schema: this.getMessageSchema(),
                    },
                    user: {
                        schema: this.getUserSchema(),
                    },
                });
            } catch (e) {
                console.log(e);
            }
            this.database = database;
            console.log('finish initDatabase');
        }
    }

    async insertMessage(data) {
        return this.database.messages.insert(data);
    }

    async getAllMessages() {
        return this.database.messages.find().exec();
    }

    async createUser(data) {
        try {
            return this.database.user.insert(data);
        } catch (e) {
            console.log(e);
        }
    }

    async getUser(id) {
        try {
            return this.database.user.findOne({
                selector: {
                    id,
                }
            }).exec();
        } catch (e) {
            console.log(e);
        }
    }

    getMessageSchema() {
        return {
            version: 0,
            primaryKey: 'id',
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    maxLength: 100 // <- the primary key must have set maxLength
                },
                peerId: {
                    type: 'string'
                },
                sender: {
                    type: 'string',
                },
                message: {
                    type: 'string'
                },
                timestamp: {
                    type: 'string',
                    format: 'date-time'
                }
            },
            required: ['peerId', 'message', 'timestamp']
        };
    }

    getUserSchema() {
        return {
            version: 0,
            type: 'object',
            primaryKey: 'id',
            properties: {
                id: {
                    type: 'string',
                    maxLength: 100 // <- the primary key must have set maxLength
                },
                name: {type: 'string'},
                peerId: {type: 'string'},
            },
        };
    }
}
