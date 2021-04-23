const { mergeRawVaults } = require("../../../../dist/io/formatB/merge");
const { newRawValue } = require("../../../../dist/io/formatB/history");
const { generateUUID } = require("../../../../dist/tools/uuid");
const { getDateString, getTimestamp } = require("../../../../dist/tools/date");

function createDualVault() {
    const gid = generateUUID();
    const vault = {
        id: generateUUID(),
        a: {},
        g: [
            {
                id: gid,
                a: {
                    ABC: newRawValue("abc")
                },
                t: "General",
                g: "0"
            }
        ],
        e: [
            {
                id: generateUUID(),
                g: gid,
                a: {
                    DEF: newRawValue("def")
                },
                p: {
                    title: newRawValue("Test"),
                    username: newRawValue("user"),
                    password: newRawValue("pass")
                }
            }
        ],
        c: getDateString()
    };
    return [vault, JSON.parse(JSON.stringify(vault))];
}

describe("io/formatB/merge", function() {
    describe("mergeRawVaults", function() {
        it("merges identical vaults", function() {
            const [v1, v2] = createDualVault();
            const merged = mergeRawVaults(v1, v2);
            expect(merged.id).to.equal(v1.id, "Vault IDs should match");
            expect(merged).to.have.nested.property("g.0.t", "General");
            expect(merged).to.have.nested.property("e.0.p.title.value", "Test");
            expect(merged.g).to.have.a.lengthOf(1, "Should contain only 1 group");
            expect(merged.e).to.have.a.lengthOf(1, "Should contain only 1 entry");
        });

        it("deletes groups when merged group is deleted", function() {
            const [v1, v2] = createDualVault();
            v2.g[0].d = getTimestamp();
            const merged = mergeRawVaults(v1, v2);
            expect(merged.g).to.have.a.lengthOf(1);
            expect(merged.g[0].d).to.be.a("number");
        });

        it("deletes entries when merged entry is deleted", function() {
            const [v1, v2] = createDualVault();
            v2.e[0].d = getTimestamp();
            const merged = mergeRawVaults(v1, v2);
            expect(merged.e).to.have.a.lengthOf(1);
            expect(merged.e[0].d).to.be.a("number");
        });

        it("deletes group attributes when merged attribute is deleted", function() {
            const [v1, v2] = createDualVault();
            v2.g[0].a.ABC.deleted = v2.g[0].a.ABC.updated = getTimestamp() + 1;
            const merged = mergeRawVaults(v1, v2);
            expect(merged).to.have.nested.property("g.0.a.ABC.deleted", v2.g[0].a.ABC.deleted);
        });

        it("deletes entry attributes when merged attribute is deleted", function() {
            const [v1, v2] = createDualVault();
            v2.e[0].a.DEF.deleted = v2.e[0].a.DEF.updated = getTimestamp() + 1;
            const merged = mergeRawVaults(v1, v2);
            expect(merged).to.have.nested.property("e.0.a.DEF.deleted", v2.e[0].a.DEF.deleted);
        });

        it("deletes entry properties when merged property is deleted", function() {
            const [v1, v2] = createDualVault();
            v2.e[0].p.username.deleted = v2.e[0].p.username.updated = getTimestamp() + 1;
            const merged = mergeRawVaults(v1, v2);
            expect(merged).to.have.nested.property("e.0.p.username.deleted", v2.e[0].p.username.deleted);
        });
    });
});
