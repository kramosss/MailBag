import * as path from "path";
import Nedb from "nedb";
const Datastore = require("nedb");

export interface IContact {
    _id?: number, name: string, email: string
}

export class Worker {
    private db: Nedb;
    constructor() {
        this.db = new Datastore({
            filename : path.join(__dirname, "contacts.db"),
            autoload : true
        });
    }

    public listContacts(): Promise<IContact[]> {
        return new Promise((inResolve, inReject) => {
            this.db.find({ },
                (inError: Error | null, inDocs: IContact[]) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inDocs);
                    }
                }
            );
        });
    }

    public addContact(inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            this.db.insert(inContact,
                (inError: Error | null, inNewDoc: IContact) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve(inNewDoc);
                    }
                }
            );
        });
    }

    public deleteContact(inID: string): Promise<void> {
        return new Promise((inResolve, inReject) => {
            this.db.remove({ _id : inID}, {}, 
                (inError: Error | null, inNumRemoved: number) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve();
                    }
                }
            );
        });
    }

    public updateContact(inID: string, inContact: IContact): Promise<void> {
        return new Promise((inResolve, inReject) => {
            this.db.update({ _id : inID }, { $set: { name: inContact.name, email: inContact.email } }, {},
                (inError: Error | null, inNumReplaced: number) => {
                    if (inError) {
                        inReject(inError);
                    } else {
                        inResolve();
                    }
                }
            );
        });
    }
}