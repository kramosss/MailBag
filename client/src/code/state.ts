import * as Contacts from "./Contacts";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import { config } from "./config";

export function createState(inParentComponent: any) {
    return {
        pleaseWaitVisible: false,
        contacts: [],
        mailboxes: [],
        messages: [],
        currentView: "welcome",
        currentMailbox: null,
        messageID: null,
        messageDate: null,
        messageFrom: null,
        messageTo: "",
        messageSubject: "",
        messageBody: "",
        contactID: null,
        contactName: "",
        contactEmail: "",

        showHidePleaseWait: function(this: any, inVisible: boolean): void {
            this.setState({ pleaseWaitVisible: inVisible });
        }.bind(inParentComponent),

        addMailboxToList: function(this: any, inMailbox: IMAP.IMailbox): void {
            const cl: IMAP.IMailbox[] = this.state.mailboxes.slice(0);
            cl.push(inMailbox);
            this.setState({ mailboxes: cl });
        }.bind(inParentComponent),

        addContactToList: function(this: any, inContact: Contacts.IContact): void {
            const cl = this.state.contacts.slice(0);
            cl.push({ 
                _id: inContact._id,
                name: inContact.name, 
                email: inContact.email 
            });
            this.setState({ contacts: cl });
        }.bind(inParentComponent),

        showComposeMessage: function(this: any, inType: string): void {
            switch (inType) {
                case "new":
                    this.setState({ 
                        currentView: "compose",
                        messageTo: "", 
                        messageSubject: "", 
                        messageBody: "",
                        messageFrom: config.userEmail
                    });
                    break;
                case "reply":
                    this.setState({ 
                        currentView: "compose",
                        messageTo: this.state.messageFrom,
                        messageSubject: `Re: ${this.state.messageSubject}`,
                        messageBody: `\n\n---- Original Message ----\n\n${this.state.messageBody}`,
                        messageFrom: config.userEmail
                    });
                    break;
                case "contact":
                    this.setState({ 
                        currentView: "compose",
                        messageTo: this.state.contactEmail,
                        messageSubject: "", 
                        messageBody: "",
                        messageFrom: config.userEmail
                    });
                    break;
            }
        }.bind(inParentComponent),

        showAddContact: function(this: any): void {
            this.setState({ 
                currentView: "contactAdd",
                contactID: null, 
                contactName: "", 
                contactEmail: "" 
            });
        }.bind(inParentComponent),

        setCurrentMailbox: function(this: any, inPath: string): void {
            this.setState({ 
                currentView: "welcome",
                currentMailbox: inPath 
            });
            this.state.getMessages(inPath);
        }.bind(inParentComponent),

        getMessages: async function(this: any, inPath: string): Promise<void> {
            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            const messages: IMAP.IMessage[] = await imapWorker.listMessages(inPath);
            this.state.showHidePleaseWait(false);
            this.state.clearMessages();
            if (Array.isArray(messages)) {
                messages.forEach((inMessage: IMAP.IMessage) => {
                    this.state.addMessageToList(inMessage);
                });
            }
        }.bind(inParentComponent),

        clearMessages: function(this: any): void {
            this.setState({ messages: [] });
        }.bind(inParentComponent),

        addMessageToList: function(this: any, inMessage: IMAP.IMessage): void {
            const cl = this.state.messages.slice(0);
            cl.push({ 
                id: inMessage.id, 
                date: inMessage.date,
                from: inMessage.from, 
                subject: inMessage.subject 
            });
            this.setState({ messages: cl });
        }.bind(inParentComponent),

        showContact: function(this: any, inID: string, inName: string, inEmail: string): void {
            this.setState({ 
                currentView: "contact", 
                contactID: inID,
                contactName: inName, 
                contactEmail: inEmail 
            });
        }.bind(inParentComponent),

        fieldChangeHandler: function(this: any, inEvent: any): void {
            if (inEvent.target.id === "contactName" &&
                inEvent.target.value.length > 16) { return; }
            this.setState({ [inEvent.target.id]: inEvent.target.value });
        }.bind(inParentComponent),

        saveContact: async function(this: any): Promise<void> {
            const cl = this.state.contacts.slice(0);
            this.state.showHidePleaseWait(true);
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contact: Contacts.IContact = await contactsWorker.addContact({
                name: this.state.contactName,
                email: this.state.contactEmail 
            });
            this.state.showHidePleaseWait(false);
            cl.push(contact);
            this.setState({ 
                contacts: cl, 
                contactID: null,
                contactName: "", 
                contactEmail: "" 
            });
        }.bind(inParentComponent),

        deleteContact: async function(this: any): Promise<void> {
            this.state.showHidePleaseWait(true);
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.deleteContact(this.state.contactID);
            this.state.showHidePleaseWait(false);
            const cl = this.state.contacts.filter(
                (inElement) => inElement._id != this.state.contactID
            );
            this.setState({ 
                contacts: cl, 
                contactID: null,
                contactName: "", 
                contactEmail: "" 
            });
        }.bind(inParentComponent),      

        showMessage: async function(this: any, inMessage: IMAP.IMessage): Promise<void> {
            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            const mb: string = await imapWorker.getMessageBody(
                inMessage.id, this.state.currentMailbox
            );
            this.state.showHidePleaseWait(false);
            this.setState({ 
                currentView: "message",
                messageID: inMessage.id, 
                messageDate: inMessage.date,
                messageFrom: inMessage.from,
                messageTo: "", 
                messageSubject: inMessage.subject,
                messageBody: mb
            });
        }.bind(inParentComponent),

        sendMessage: async function(this: any): Promise<void> {
            this.state.showHidePleaseWait(true);
            const smtpWorker: SMTP.Worker = new SMTP.Worker();
            await smtpWorker.sendMessage(
                this.state.messageTo,
                this.state.messageFrom, 
                this.state.messageSubject,
                this.state.messageBody
            );
            this.setState({ currentView: "welcome" });
            // Give Gmail a moment to process and deliver the message
            if (this.state.currentMailbox) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.state.getMessages(this.state.currentMailbox);
            }
            this.state.showHidePleaseWait(false);
        }.bind(inParentComponent),

        deleteMessage: async function(this: any): Promise<void> {
            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            await imapWorker.deleteMessage(
                this.state.messageID, 
                this.state.currentMailbox
            );
            this.state.showHidePleaseWait(false);
            const cl = this.state.messages.filter(
                (inElement) => inElement.id != this.state.messageID
            );
            this.setState({ messages: cl, currentView: "welcome" });
        }.bind(inParentComponent)
    };
}