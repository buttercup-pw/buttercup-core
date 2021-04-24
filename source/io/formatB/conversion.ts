import { newRawValue } from "./history";
import { getDateString } from "../../tools/date";
import { getAllEntries as getAllFormatAEntries, getAllGroups as getAllFormatAGroups } from "../formatA/tools";
import {
    FormatAEntry,
    FormatAGroup,
    FormatAVault,
    FormatBEntry,
    FormatBGroup,
    FormatBKeyValueObject,
    FormatBVault,
    PropertyKeyValueObject
} from "../../types";

export function convertFormatAEntry(entry: FormatAEntry): FormatBEntry {
    return {
        id: entry.id,
        a: flatKeyValueObjectToValuesObject(entry.attributes || {}),
        p: flatKeyValueObjectToValuesObject(entry.properties || {}),
        g: entry.parentID
    };
}

export function convertFormatAGroup(group: FormatAGroup): FormatBGroup {
    return {
        id: group.id,
        a: flatKeyValueObjectToValuesObject(group.attributes || {}),
        t: group.title,
        g: group.parentID
    };
}

export function convertFormatAVault(vault: FormatAVault): FormatBVault {
    return {
        id: vault.id,
        a: flatKeyValueObjectToValuesObject(vault.attributes || {}),
        g: getAllFormatAGroups(vault).map(group => convertFormatAGroup(group)),
        e: getAllFormatAEntries(vault).map(entry => convertFormatAEntry(entry)),
        c: getDateString(),
        s: []
    };
}

function flatKeyValueObjectToValuesObject(obj: PropertyKeyValueObject): FormatBKeyValueObject {
    return Object.keys(obj).reduce(
        (output, key) =>
            Object.assign(output, {
                [key]: newRawValue(obj[key])
            }),
        {}
    );
}

export function isFormatBEntry(entry: FormatAEntry | FormatBEntry): entry is FormatBEntry {
    return (<FormatBEntry>entry).g !== undefined;
}

export function isFormatBGroup(group: FormatAGroup | FormatBGroup): group is FormatBGroup {
    return (<FormatBGroup>group).g !== undefined;
}

/**
 * Get a key-value object from a Format-B values object.
 * This strips deleted properties.
 * @param valuesObj
 */
export function valuesObjectToKeyValueObject(valuesObj: FormatBKeyValueObject): PropertyKeyValueObject {
    return Object.keys(valuesObj).reduce((output, key) => {
        if (valuesObj[key].deleted) return output;
        return Object.assign(output, {
            [key]: valuesObj[key].value
        });
    }, {});
}
