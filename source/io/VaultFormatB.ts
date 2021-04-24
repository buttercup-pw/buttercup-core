import VaultFormat from "./VaultFormat";
import Vault from "../core/Vault";
import Share from "../core/Share";
import { generateUUID } from "../tools/uuid";
import { getSharedAppEnv } from "../env/appEnv";
import { getCredentials } from "../credentials/channel";
import Credentials from "../credentials/Credentials";
import { historyArrayToString, historyStringToArray } from "./common";
import { hasValidSignature, sign, stripSignature, vaultContentsEncrypted } from "./formatB/signing";
import { historiesDiffer } from "./formatB/compare";
import { mergeRawVaults } from "./formatB/merge";
import { valuesObjectToKeyValueObject } from "./formatB/conversion";
import { newRawValue, valueToHistoryItem } from "./formatB/history";
import { getDateString, getTimestamp } from "../tools/date";
import {
    EntryChange,
    EntryChangeType,
    EntryID,
    FormatBEntry,
    FormatBGroup,
    FormatBShare,
    FormatBValueHistoryItem,
    FormatBVault,
    GroupID,
    History,
    PropertyKeyValueObject,
    ShareID,
    VaultFormatID,
    VaultID
} from "../types";

function emptyVault(): FormatBVault {
    return {
        id: null,
        a: {},
        g: [],
        e: [],
        c: getDateString(),
        s: []
    };
}

export default class VaultFormatB extends VaultFormat {
    static encodeRaw(rawContent: History, credentials: Credentials): Promise<string> {
        const compress = getSharedAppEnv().getProperty("compression/v2/compressText");
        const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
        const { masterPassword } = getCredentials(credentials.id);
        return Promise.resolve()
            .then(() => historyArrayToString(rawContent))
            .then(history => compress(history))
            .then(compressed => encrypt(compressed, masterPassword))
            .then(sign);
    }

    static extractSharesFromHistory(history: History): Object {
        return {};
    }

    static getFormatID(): VaultFormatID {
        return VaultFormatID.B;
    }

    static historiesDiffer(historyA: History, historyB: History): boolean {
        return historiesDiffer(historyA, historyB);
    }

    static isEncrypted(contents: string): boolean {
        return vaultContentsEncrypted(contents);
    }

    static parseEncrypted(encryptedContent: string, credentials: Credentials): Promise<History> {
        const decompress = getSharedAppEnv().getProperty("compression/v2/decompressText");
        const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
        const { masterPassword } = getCredentials(credentials.id);
        return Promise.resolve()
            .then(() => {
                if (!hasValidSignature(encryptedContent)) {
                    throw new Error("No valid signature in vault");
                }
                return stripSignature(encryptedContent);
            })
            .then(encryptedData => decrypt(encryptedData, masterPassword))
            .then(async decrypted => {
                const decompressed = await decompress(decrypted);
                return historyStringToArray(decompressed, VaultFormatID.B);
            });
    }

    static prepareHistoryForMerge(history: History): History {
        return history;
    }

    static vaultFromMergedHistories(local: History, incoming: History): Vault {
        const localRaw = JSON.parse(local[0]) as FormatBVault;
        const incomingRaw = JSON.parse(incoming[0]) as FormatBVault;
        const merged = mergeRawVaults(localRaw, incomingRaw);
        const vault = new Vault();
        vault._format = new VaultFormatB(merged);
        return vault;
    }

    source: FormatBVault;

    constructor(source: FormatBVault = emptyVault()) {
        super(source);
    }

    cloneEntry(entry: FormatBEntry, targetGroupID: GroupID) {}

    cloneGroup(group: FormatBGroup, targetGroupID: GroupID) {
        const newGroup = JSON.parse(JSON.stringify(group)) as FormatBGroup;
        newGroup.id = generateUUID();
        newGroup.g = targetGroupID;
        this.source.g.push(newGroup);
        // clone entries
        const childEntries = this.source.e
            .filter(entry => entry.g === group.id)
            .map(entry => {
                const newEntry = JSON.parse(JSON.stringify(entry));
                newEntry.g = newGroup.id;
                return newEntry;
            });
        this.source.e.push(...childEntries);
        // clone groups
        this.source.g.forEach(childGroup => {
            if (childGroup.g === group.id) {
                this.cloneGroup(childGroup, newGroup.id);
            }
        });
    }

    createEntry(groupID: GroupID, entryID: EntryID) {
        const entry: FormatBEntry = {
            id: entryID,
            g: groupID,
            p: {},
            a: {}
        };
        this.source.e.push(entry);
    }

    createGroup(parentID: GroupID, groupID: GroupID) {
        const group: FormatBGroup = {
            id: groupID,
            g: parentID,
            t: "",
            a: {}
        };
        this.source.g.push(group);
    }

    createShareInstance(share: FormatBShare): Share {
        return new Share(share.id, share.upd, share.k, share.p);
    }

    deleteEntry(entryID: EntryID) {
        const ind = this.source.e.findIndex(entry => entry.id === entryID);
        if (ind >= 0) {
            this.source.e[ind].d = this.source.e[ind].d || getTimestamp();
        }
    }

    deleteEntryAttribute(entryID: EntryID, attribute: string) {
        const entry = this.findEntryByID(entryID);
        entry.a[attribute].deleted = entry.a[attribute].updated = getTimestamp();
    }

    deleteEntryProperty(entryID: EntryID, property: string) {
        const entry = this.findEntryByID(entryID);
        entry.p[property].deleted = entry.p[property].updated = getTimestamp();
    }

    deleteGroup(groupID: GroupID) {
        const ind = this.source.g.findIndex(group => group.id === groupID);
        if (ind >= 0) {
            this.source.g[ind].d = this.source.g[ind].d || getTimestamp();
        }
    }

    deleteGroupAttribute(groupID: GroupID, attribute: string) {
        const group = this.findGroupByID(groupID);
        group.a[attribute].deleted = group.a[attribute].updated = getTimestamp();
    }

    deleteVaultAttribute(attribute: string) {
        this.source.a[attribute].deleted = this.source.a[attribute].updated = getTimestamp();
    }

    erase() {
        super.erase();
        Object.assign(this.source, emptyVault());
        this.emit("erased");
    }

    execute(commandOrCommands: string | Array<string>) {
        let command: string;
        if (Array.isArray(commandOrCommands)) {
            if (commandOrCommands.length !== 1) {
                throw new Error(
                    `Format-B commands array must contain a single command, received: ${commandOrCommands.length}`
                );
            }
            command = commandOrCommands[0];
        } else {
            command = commandOrCommands;
        }
        this.source = JSON.parse(command);
        this.dirty = true;
        this.emit("commandsExecuted");
    }

    findEntryByID(id: EntryID): FormatBEntry {
        const item = this.source.e.find(entry => entry.id === id);
        return item && !item.d ? item : null;
    }

    findGroupByID(id: GroupID): FormatBGroup {
        const item = this.source.g.find(group => group.id === id);
        return item && !item.d ? item : null;
    }

    findGroupContainingEntryID(id: EntryID): FormatBGroup {
        const matchingEntry = this.getAllEntries().find(entry => entry.id === id);
        if (matchingEntry) {
            return this.getAllGroups().find(group => group.id === matchingEntry.g) || null;
        }
        return null;
    }

    findGroupContainingGroupID(id: GroupID): FormatBGroup {
        const groups = this.getAllGroups();
        const matchingGroup = groups.find(group => group.id === id);
        if (!matchingGroup) return null;
        return groups.find(group => group.id === matchingGroup.g) || null;
    }

    generateID() {
        this.source.id = generateUUID();
    }

    getAllEntries(parentID: GroupID = null): Array<FormatBEntry> {
        const source = this.source as FormatBVault;
        const entries = parentID === null ? source.e : source.e.filter(entry => entry.g === parentID);
        return entries.filter(e => !e.d);
    }

    getAllGroups(parentID: GroupID = null): Array<FormatBGroup> {
        const source = this.source as FormatBVault;
        const groups = parentID === null ? source.g : source.g.filter(group => group.g === parentID);
        return groups.filter(g => !g.d);
    }

    getAllShares(): Array<FormatBShare> {
        return [...(this.source.s || [])];
    }

    getEntryAttributes(entrySource: FormatBEntry): PropertyKeyValueObject {
        return valuesObjectToKeyValueObject(entrySource.a);
    }

    getEntryChanges(entrySource: FormatBEntry): Array<EntryChange> {
        return Object.keys(entrySource.p).reduce(
            (changes, property) => [
                ...changes,
                ...entrySource.p[property].history.map((histItem: FormatBValueHistoryItem) => {
                    const change: EntryChange = {
                        property,
                        type:
                            histItem.updated === entrySource.p[property].created
                                ? EntryChangeType.Created
                                : EntryChangeType.Modified,
                        ts: histItem.updated,
                        value: histItem.value
                    };
                    return change;
                }),
                ...(entrySource.p[property].deleted
                    ? [
                          {
                              property,
                              type: EntryChangeType.Deleted,
                              ts: entrySource.p[property].deleted,
                              value: null
                          }
                      ]
                    : [])
            ],
            []
        );
    }

    getEntryProperties(entrySource: FormatBEntry): PropertyKeyValueObject {
        return valuesObjectToKeyValueObject(entrySource.p);
    }

    getFormat() {
        return VaultFormatB;
    }

    getGroupAttributes(groupSource: FormatBGroup): PropertyKeyValueObject {
        return valuesObjectToKeyValueObject(groupSource.a);
    }

    getGroupTitle(groupSource: FormatBGroup): string {
        return groupSource.t;
    }

    getHistory(): History {
        const hist = <History>[JSON.stringify(this.source)];
        hist.format = VaultFormatID.B;
        return hist;
    }

    getItemID(itemSource: FormatBGroup | FormatBEntry): GroupID | EntryID {
        return itemSource.id;
    }

    getItemParentID(itemSource: FormatBGroup | FormatBEntry): GroupID | "0" {
        return itemSource.g;
    }

    getShareID(share: FormatBShare): ShareID {
        return share.id;
    }

    getVaultAttributes() {
        return valuesObjectToKeyValueObject((<FormatBVault>this.source).a);
    }

    getVaultID(): VaultID {
        return this.source.id;
    }

    initialise() {
        Object.assign(this.source, {
            a: this.source.a || {},
            g: this.source.g || [],
            e: this.source.e || []
        });
        this.generateID();
    }

    moveEntry(entryID: EntryID, groupID: GroupID) {
        const entry = this.source.e.find((e: FormatBEntry) => e.id === entryID);
        if (!entry || entry.d) {
            throw new Error(`Can't move deleted entry: ${entryID}`);
        }
        entry.g = groupID;
    }

    moveGroup(groupID: GroupID, newParentID: GroupID) {
        const group = this.source.g.find((g: FormatBGroup) => g.id === groupID);
        if (!group || group.d) {
            throw new Error(`Can't move deleted group: ${groupID}`);
        }
        group.g = newParentID;
    }

    optimise() {
        // @todo: Delete old deleted items
    }

    setEntryAttribute(entryID: EntryID, attribute: string, value: string) {
        const entry = this.findEntryByID(entryID);
        if (!entry.a[attribute]) {
            entry.a[attribute] = newRawValue(value);
        } else {
            const item = entry.a[attribute];
            item.history.unshift(valueToHistoryItem(item));
            item.value = value;
            item.updated = getTimestamp();
        }
    }

    setEntryProperty(entryID: EntryID, property: string, value: string) {
        const entry = this.findEntryByID(entryID);
        if (!entry.p[property]) {
            entry.p[property] = newRawValue(value);
        } else {
            const item = entry.p[property];
            item.history.unshift(valueToHistoryItem(item));
            item.value = value;
            item.updated = getTimestamp();
        }
    }

    setGroupAttribute(groupID: GroupID, attribute: string, value: string) {
        const group = this.findGroupByID(groupID);
        if (!group.a[attribute]) {
            group.a[attribute] = newRawValue(value);
        } else {
            const item = group.a[attribute];
            item.history.unshift(valueToHistoryItem(item));
            item.value = value;
            item.updated = getTimestamp();
        }
    }

    setGroupTitle(groupID: GroupID, title: string) {
        const group = this.findGroupByID(groupID);
        group.t = title;
    }

    setVaultAttribute(key: string, value: string) {
        if (!this.source.a[key]) {
            this.source.a[key] = newRawValue(value);
        } else {
            const item = this.source.a[key];
            item.history.unshift(valueToHistoryItem(item));
            item.value = value;
            item.updated = getTimestamp();
        }
    }

    supportsShares(): boolean {
        return true;
    }
}
