import { fireInstantiationHandlers, registerDatasource } from "./register";
import TextDatasource from "./TextDatasource";
import Credentials from "../credentials/Credentials";
import { getCredentials } from "../credentials/channel";

export default class ButtercupServerDatasource extends TextDatasource {
    _accessToken: string;
    _client: any;
    _clientID: string;
    _clientSecret: string;
    _refreshToken: string;
    _updateID: number;
    _url: string;
    _vaultID: number;

    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData;
        const { accessToken, clientID, clientSecret, refreshToken, vaultID } = datasourceConfig;
        this._accessToken = accessToken;
        this._refreshToken = refreshToken;
        this._clientID = clientID;
        this._clientSecret = clientSecret;
        this._client = null;
        this._vaultID = vaultID;
        this._updateID = null;
        // this._createNewClient();
        this.type = "bcupserver";
        fireInstantiationHandlers("bcupserver", this);
    }
}
