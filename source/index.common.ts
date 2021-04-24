export {
    default as VaultManager,
    InterruptedAutoUpdateFunction,
    VaultManagerAddSourceOptions,
    VaultManagerOptions
} from "./core/VaultManager";
export {
    default as VaultSource,
    VaultSourceConfig,
    VaultSourceMetadata,
    VaultSourceUnlockOptions
} from "./core/VaultSource";
export { default as Vault } from "./core/Vault";
export { default as Group } from "./core/Group";
export { default as Entry } from "./core/Entry";
export { default as AttachmentManager } from "./attachments/AttachmentManager";

export { detectFormat, getDefaultFormat, setDefaultFormat } from "./io/formatRouter";
export { default as VaultFormatA } from "./io/VaultFormatA";
export { default as VaultFormatB } from "./io/VaultFormatB";

export { default as TextDatasource } from "./datasources/TextDatasource";
export { default as MemoryDatasource } from "./datasources/MemoryDatasource";
export { default as FileDatasource } from "./datasources/FileDatasource";
export { default as WebDAVDatasource } from "./datasources/WebDAVDatasource";
export { default as DropboxDatasource } from "./datasources/DropboxDatasource";
export { default as GoogleDriveDatasource } from "./datasources/GoogleDriveDatasource";
export { default as MyButtercupDatasource } from "./datasources/MyButtercupDatasource";
export { default as MyButtercupClient } from "./myButtercup/MyButtercupClient";
export { default as ButtercupServerDatasource } from "./datasources/ButtercupServerDatasource";
export { default as DatasourceAuthManager } from "./datasources/DatasourceAuthManager";
export { registerDatasource } from "./datasources/register";

export {
    ConsumeVaultFacadeOptions,
    CreateVaultFacadeOptions,
    GetGroupEntriesFacadesOptions,
    GetGroupsFacadesOptions,
    consumeGroupFacade,
    consumeVaultFacade,
    createGroupFacade,
    createVaultFacade
} from "./facades/vault";
export { isOTPURI, isVaultFacade } from "./facades/detection";
export {
    CreateEntryFacadeOptions,
    consumeEntryFacade,
    createEntryFacade,
    fieldsToProperties,
    getEntryFacadePath
} from "./facades/entry";
export { CreateFieldDescriptorOptions, createFieldDescriptor } from "./facades/tools";
export {
    DEFAULT_ENTRY_TYPE,
    DEFAULT_FIELD_TYPE,
    ENTRY_TYPES,
    FIELD_VALUE_TYPES,
    EntryPropertyTypeIndex,
    EntryTypeIndex
} from "./facades/symbols";

export { default as Credentials } from "./credentials/Credentials";

export { default as StorageInterface } from "./storage/StorageInterface";
export { default as MemoryStorageInterface } from "./storage/MemoryStorageInterface";

export { SearchResult } from "./search/BaseSearch";
export { VaultEntrySearch as Search } from "./search/VaultEntrySearch"; // compat @todo remove
export { VaultEntrySearch } from "./search/VaultEntrySearch";
export { VaultFacadeEntrySearch } from "./search/VaultFacadeEntrySearch";
export { SearchKey, buildSearcher } from "./search/searcher";

export { AppEnv, AppEnvGetPropertyOptions } from "./env/core/appEnv";
export { getSharedAppEnv } from "./env/appEnv";

export { generateUUID } from "./tools/uuid";
export { EntryURLType, getEntryPath, getEntryURLs } from "./tools/entry";
export { base64ToBytes, bytesToBase64, decodeBase64String, encodeBase64String } from "./tools/encoding";

export * from "./types";

/**
 * @module Buttercup
 */
