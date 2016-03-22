(function(module) {

    "use strict";

    var Inigo = require("./InigoGenerator.js");

    var Commands = Inigo.Command;

    /**
     * Describe an archive dataset - to history commands
     * @param {Object} dataset The archive dataset
     * @param {String} parentGroupID
     * @returns {Array}
     * @module Descriptor
     * @type {Function}
     */
    module.exports = function describe(dataset, parentGroupID) { //eslint-disable-line complexity
        var currentGroupID = dataset.id || "0",
            entries = (currentGroupID === "0") ?
                [] :
                (dataset.entries || []);
        var commands = [];
        if (currentGroupID === "0" && dataset.format) {
            commands.push(
                Inigo
                    .create(Commands.Format)
                    .addArgument(dataset.format)
                    .generateCommand()
            );
        }
        if (currentGroupID !== "0") {
            if (!parentGroupID) {
                throw new Error("No parent group ID specified");
            }
            commands.push(
                Inigo
                    .create(Commands.CreateGroup)
                    .addArgument(parentGroupID)
                    .addArgument(currentGroupID)
                    .generateCommand()
            );
            if (dataset.title) {
                commands.push(
                    Inigo
                        .create(Commands.SetGroupTitle)
                        .addArgument(currentGroupID)
                        .addArgument(dataset.title)
                        .generateCommand()
                );
            }
            if (dataset.attributes) {
                for (var attributeName in dataset.attributes) {
                    if (dataset.attributes.hasOwnProperty(attributeName)) {
                        commands.push(
                            Inigo
                                .create(Commands.SetGroupAttribute)
                                .addArgument(currentGroupID)
                                .addArgument(attributeName)
                                .addArgument(dataset.attributes[attributeName])
                                .generateCommand()
                        );
                    }
                }
            }
            commands.push(Inigo.generatePaddingCommand());
        }
        entries.forEach(function(entry) {
            commands.push(
                Inigo
                    .create(Commands.CreateEntry)
                    .addArgument(currentGroupID)
                    .addArgument(entry.id)
                    .generateCommand()
            );
            ["title", "username", "password"].forEach(function(property) {
                if (entry[property]) {
                    commands.push(
                        Inigo
                            .create(Commands.SetEntryProperty)
                            .addArgument(entry.id)
                            .addArgument(property)
                            .addArgument(entry[property])
                            .generateCommand()
                    );
                }
            });
            if (entry.meta) {
                for (var metaName in entry.meta) {
                    if (entry.meta.hasOwnProperty(metaName)) {
                        commands.push(
                            Inigo
                                .create(Commands.SetEntryMeta)
                                .addArgument(entry.id)
                                .addArgument(metaName)
                                .addArgument(entry.meta[metaName])
                                .generateCommand()
                        );
                    }
                }
            }
            if (entry.attributes) {
                for (var attributeName in entry.attributes) {
                    if (entry.attributes.hasOwnProperty(attributeName)) {
                        commands.push(
                            Inigo
                                .create(Commands.SetEntryAttribute)
                                .addArgument(entry.id)
                                .addArgument(attributeName)
                                .addArgument(entry.attributes[attributeName])
                                .generateCommand()
                        );
                    }
                }
            }
            commands.push(Inigo.generatePaddingCommand());
        });
        (dataset.groups || []).forEach(function(group) {
            commands = commands.concat(describe(group, currentGroupID));
        });
        return commands;
    };

})(module);
