import Group from "../core/Group";
import Vault from "../core/Vault";

/**
 * Move a group between archives
 * @param movingGroup The group to move
 * @param targetGroup The group to move to
 * @throws {Error} Throws if the remote type is not recognised
 */
export function moveGroupBetweenVaults(movingGroup: Group, targetGroup: Group | Vault) {
    // Clone
    const targetVault = targetGroup instanceof Vault ? (targetGroup as Vault) : targetGroup.vault;
    targetVault.format.cloneGroup(movingGroup._source, targetGroup instanceof Vault ? "0" : targetGroup.id);
    // Delete original
    movingGroup.delete(/* skip trash */ true);
}
