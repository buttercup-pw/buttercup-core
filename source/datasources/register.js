const { getCredentials } = require("../credentials/channel.js");

const __datasources = {};
const __postHandlers = [];

/**
 * Convert a Credentials instance to a Datasource
 * @param {Credentials} credentials A Credentials instance that
 *  contains a datasource configuration
 * @returns {TextDatasource}
 * @throws {Error} Throws if no datasource configuration in
 *  credentials
 * @throws {Error} Throws if no type specified in datasource
 *  configuration
 * @throws {Error} Throws if no datasource found for type
 */
function credentialsToDatasource(credentials) {
    const { datasource } = getCredentials(credentials.id).data;
    if (!datasource) {
        throw new Error("No datasource configuration in credentials");
    }
    const { type } = datasource;
    if (!type) {
        throw new Error("No datasource type specified in datasource configuration");
    }
    const DSClass = __datasources[type];
    if (!DSClass) {
        throw new Error(`No datasource found for type: ${type}`);
    }
    return new DSClass(credentials);
}

/**
 * Execute all datasource postprocessors
 * @param {TextDatasource} datasource The datasource instance
 */
function fireInstantiationHandlers(type, datasource) {
    __postHandlers.forEach(handler => {
        try {
            handler(type, datasource);
        } catch (err) {
            console.error("Failed executing a datasource instantiation handler for a datasource");
            console.error(err);
        }
    });
}

/**
 * Register a new datasource
 * This is called internally by the built-in datasources, but should be called if a
 * custom datasource is used.
 * @param {String} datasourceType The name (slug) of the datasource
 * @param {Object} DSClass The class for the new datasource
 * @public
 */
function registerDatasource(datasourceType, DSClass) {
    __datasources[datasourceType] = DSClass;
}

/**
 * @typedef {Object} RegisterDatasourcePostProcessorResult
 * @property {Function} remove - Function to call to remove the handler
 */

/**
 * Register a post-processor for a datasource being instantiated
 * @param {Function} callback The callback to execute with the instantiated datasource
 * @returns {RegisterDatasourcePostProcessorResult} The result of the registration
 */
function registerDatasourcePostProcessor(callback) {
    __postHandlers.push(callback);
    return {
        remove: () => {
            const ind = __postHandlers.indexOf(callback);
            if (ind >= 0) {
                __postHandlers.splice(ind, 1);
            }
        }
    };
}

module.exports = {
    credentialsToDatasource,
    fireInstantiationHandlers,
    registerDatasource,
    registerDatasourcePostProcessor
};