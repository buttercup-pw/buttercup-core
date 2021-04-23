import Vault from "./Vault";

/**
 * Base vault member class (for Entry, Group etc.)
 */
export default class VaultItem {
    _boundUpdateRefs: () => void;

    _source: any;

    /**
     * Reference to the containing vault
     * @protected
     * @memberof VaultItem
     */
    _vault: Vault = null;

    /**
     * Constructor for the vault member base class
     * @param {Vault} vault Vault reference
     * @param {Object} source Remote source object reference
     */
    constructor(vault: Vault, source: any) {
        this._vault = vault;
        this._source = source;
    }

    /**
     * The ID of the entry or group
     * @readonly
     * @memberof VaultItem
     */
    get id(): string {
        return this._vault.format.getItemID(this._source);
    }

    /**
     * The vault this item belongs to
     * @readonly
     * @memberof VaultItem
     */
    get vault(): Vault {
        return this._vault;
    }

    /**
     * Clean up all of the data in the vault item
     * @protected
     * @memberof VaultItem
     */
    _cleanUp() {
        this._vault = null;
        this._source = null;
    }

    /**
     * Update source references
     * @protected
     * @memberof VaultItem
     */
    _updateRefs() {
        // No-op for vault item
    }
}
