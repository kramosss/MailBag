const path = require("path");
const fs = require("fs");

export interface IServerInfo {
    smtp : {
        host: string, port: number,
        auth: { user: string, pass: string}
    },
    imap : {
        host: string, port: number,
        auth: {user: string, pass: string }
    }
}

const rawInfo: string = 
    fs.readFileSync(path.join(__dirname, "../serverInfo.json"));
export const serverInfo: IServerInfo = JSON.parse(rawInfo);