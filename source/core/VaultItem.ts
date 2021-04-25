import { Layerr } from "layerr";
import Vault from "./Vault";
import Share from "./Share";
import { ErrorCode, SharePermission } from "../types";

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
     * The share ID of the entry or group, if available
     * @readonly
     * @memberof VaultItem
     */
    get shareID(): string | null {
        return this._vault.format.getItemShareID(this._source);
    }

    /**
     * The vault this item belongs to
     * @readonly
     * @memberof VaultItem
     */
    get vault(): Vault {
        return this._vault;
    }

    permitsManagement(): boolean {
        const share = this._getShare();
        return share ? share.hasPermission(SharePermission.Manage) : true;
    }

    permitsModification(): boolean {
        const share = this._getShare();
        return share ? share.hasPermission(SharePermission.Write) : true;
    }

    permitsViewing(): boolean {
        const share = this._getShare();
        return share ? share.hasPermission(SharePermission.Read) : true;
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

    _getShare(): Share | null {
        const shareID = this.shareID;
        return shareID ? this._vault._shares.find(share => share.id === shareID) : null;
    }

    _requireMgmtPermission() {
        if (!this.permitsManagement()) {
            throw new Layerr(
                {
                    info: {
                        code: ErrorCode.NoManagementPermission
                    }
                },
                "Management permission not granted for operation"
            );
        }
    }

    _requireWritePermission() {
        if (!this.permitsModification()) {
            throw new Layerr(
                {
                    info: {
                        code: ErrorCode.NoWritePermission
                    }
                },
                "Write permission not granted for operation"
            );
        }
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
