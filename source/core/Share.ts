import { ShareID, SharePermission } from "../types";

export default class Share {
    _id: ShareID;
    _key: string;
    _permissions: Array<SharePermission>;
    _updateID: string;

    constructor(id: ShareID, updateID: string, key: string, permissions: Array<SharePermission>) {
        this._id = id;
        this._key = key;
        this._updateID = updateID;
        this._permissions = [...permissions];
    }

    get id(): ShareID {
        return this._id;
    }

    get updateID(): string {
        return this._updateID;
    }

    hasPermission(permission: SharePermission) {
        return this._permissions.includes(permission);
    }
}
