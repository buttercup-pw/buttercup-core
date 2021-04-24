import EventEmitter from "eventemitter3";
import { getDefaultFormat } from "../io/formatRouter";
import { findGroupsByTitle } from "../search/groups";
import { findEntriesByProperty } from "../search/entries";
import Group from "./Group";
import Entry from "./Entry";
import Share from "./Share";
import { EntryID, FormatBShare, GroupID, History } from "../types";

/**
 * Vault class - Contains Groups and Entrys
 * @augments EventEmitter
 * @memberof module:Buttercup
 */
export default class Vault extends EventEmitter {
    static Attribute = Object.freeze({
        AttachmentsKey: "BC_ATTACHMENTS_KEY"
    });

    /**
     * Create a new archive instance from a list of commands (history)
     * @param history The command list
     * @param format Optional vault format override
     * @returns The vault instance
     * @static
     * @memberof Vault
     */
    static createFromHistory(history: History, format: any = getDefaultFormat()): Vault {
        const vault = new Vault(format);
        vault.format.erase();
        vault.format.execute(history);
        vault.format.dirty = false;
        if (!vault.id) {
            vault.format.generateID();
        }
        return vault;
    }

    /**
     * Create a Vault with the default template
     * @returns The new vault
     * @memberof Vault
     * @static
     */
    static createWithDefaults(): Vault {
        const vault = new Vault();
        vault.createGroup("General");
        vault.createGroup("Trash").setAttribute(Group.Attribute.Role, "trash");
        return vault;
    }

    _entries: Array<Entry> = [];

    _format: any;

    _groups: Array<Group> = [];

    _onCommandExec: () => void;

    _shares: Array<Share> = [];

    /**
     * The vault format
     * @readonly
     * @memberof Vault
     */
    get format(): any {
        return this._format;
    }

    /**
     * The ID of the Vault
     * @readonly
     * @memberof Vault
     */
    get id(): string {
        return this.format.getVaultID();
    }

    /**
     * Whether the Vault is in read-only mode
     *  or not
     * @readonly
     * @memberof Vault
     */
    get readOnly(): boolean {
        return this.format.readOnly;
    }

    /**
     * Create a new Vault instance
     * @param Format Optional vault format specification.
     *  Will use the default system format (recommended) if not
     *  specified.
     */
    constructor(Format: any = getDefaultFormat()) {
        super();
        // Setup format
        this._updateFormat(new Format());
        this.format.initialise();
        // Create groups and entries
        this._rebuild();
    }

    /**
     * Create a new group
     * @param title The title for the group
     * @returns The newly created group
     * @memberof Vault
     */
    createGroup(title: string): Group {
        const group = Group.createNew(this);
        if (title) {
            group.setTitle(title);
        }
        return group;
    }

    /**
     * Delete an attribute
     * @param attribute The name of the attribute to delete
     * @returns Self
     * @memberof Vault
     */
    deleteAttribute(attribute: string): this {
        this.format.deleteVaultAttribute(attribute);
        return this;
    }

    /**
     * Remove all entries and groups from the trash (permanent)
     * - does nothing if no trash group
     * @returns Self
     * @memberof Vault
     */
    emptyTrash(): this {
        const trash = this.getTrashGroup();
        if (!trash) return;
        trash.getGroups().forEach(group => {
            group.delete(/* skip trash */ true);
        });
        trash.getEntries().forEach(entry => {
            entry.delete(/* skip trash */ true);
        });
        return this;
    }

    /**
     * Find an entry by its ID
     * @param id The ID to search for
     * @returns Null if not found, or the Entry instance
     * @memberof Vault
     */
    findEntryByID(id: EntryID): null | Entry {
        return this._entries.find(entry => entry.id === id) || null;
    }

    /**
     * Find all entries that match a certain property
     * @param property The property to search with
     * @param value The value to search for
     * @returns An array of found extries
     * @memberof Vault
     */
    findEntriesByProperty(property: string | RegExp, value: string | RegExp): Array<Entry> {
        return findEntriesByProperty(this._entries, property, value);
    }

    /**
     * Find a group by its ID
     * @param id The group ID to search for
     * @returns The group or null if not found
     * @memberof Vault
     */
    findGroupByID(id: GroupID): null | Group {
        return this._groups.find(group => group.id === id) || null;
    }

    /**
     * Find groups by their title
     * @param title The group title
     * @returns An array of groups
     * @memberof Vault
     */
    findGroupsByTitle(title: string | RegExp): Array<Group> {
        return findGroupsByTitle(this._groups, title);
    }

    /**
     * Get all entries in the vault
     * @returns An array of entry instances
     * @memberof Vault
     */
    getAllEntries(): Array<Entry> {
        return [...this._entries];
    }

    /**
     * Get al groups in the vault
     * @returns An array of group instances
     * @memberof Vault
     */
    getAllGroups(): Array<Group> {
        return [...this._groups];
    }

    /**
     * Get the value of an attribute
     * @param attributeName The attribute to get
     * @returns The value of the attribute or undefined if not
     *  set. Returns an object if no attribute name is given.
     * @memberof Vault
     */
    getAttribute(attributeName?: string): undefined | string | Object {
        const attributes = this.format.getVaultAttributes();
        if (!attributeName) {
            return Object.assign({}, attributes);
        }
        if (attributes.hasOwnProperty(attributeName)) {
            return attributes[attributeName];
        }
        return undefined;
    }

    /**
     * Get the top-level groups in the vault
     * @memberof Vault
     */
    getGroups(): Array<Group> {
        return this._groups.filter(group => group.getParentGroup() === null);
    }

    /**
     * Get the trash group
     * @returns The trash group or null if it doesn't
     *  exist
     * @memberof Vault
     */
    getTrashGroup(): Group | null {
        const trashGroup = this.getGroups().find(group => group.isTrash());
        return trashGroup || null;
    }

    /**
     * Set an attribute on the vault
     * @param attribute The attribute to set
     * @param value The value to set for the attribute
     * @returns Self
     * @memberof Vault
     */
    setAttribute(attribute: string, value: string): this {
        this.format.setVaultAttribute(attribute, value);
        return this;
    }

    _rebuild(clear: boolean = false) {
        if (clear) {
            this._groups = [];
            this._entries = [];
        }
        this.format.getAllGroups().forEach(rawGroup => {
            const id = this.format.getItemID(rawGroup);
            if (!this._groups.find(g => g.id === id)) {
                this._groups.push(new Group(this, rawGroup));
            }
        });
        this.format.getAllEntries().forEach(rawEntry => {
            const id = this.format.getItemID(rawEntry);
            if (!this._entries.find(e => e.id === id)) {
                this._entries.push(new Entry(this, rawEntry));
            }
        });
        if (this.format.supportsShares()) {
            this.format.getAllShares().forEach((rawShare: FormatBShare) => {
                const id = this.format.getShareID(rawShare);
                if (!this._shares.find(s => s.id === id)) {
                    this._shares.push(this.format.createShareInstance(rawShare));
                }
            });
        }
    }

    /**
     * Update the format reference
     * @param format The new format instance
     * @memberof Vault
     * @protected
     */
    _updateFormat(format: any) {
        if (this._format) {
            this._format.removeAllListeners();
        }
        this._format = format;
        this._groups.forEach(group => {
            group._updateRefs();
        });
        this._entries.forEach(entry => {
            entry._updateRefs();
        });
        this._rebuild();
        this.format.on("commandsExecuted", () => {
            this._rebuild();
            this.emit("vaultUpdated");
        });
        this.format.on("erased", () => {
            this._rebuild(/* clear all: */ true);
            this.emit("vaultUpdated");
        });
    }
}
