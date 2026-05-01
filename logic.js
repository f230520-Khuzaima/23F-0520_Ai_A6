// knowledge base - array of clauses
// each clause = array of literal strings e.g. ["P_1_2"] or ["!P_1_2"]
let kb = [];
let steps = 0;

// add clause to kb
function tell(clause) {
    kb.push(clause);
}

// negate a literal
function negate(lit) {
    if (lit[0] === "!") return lit.slice(1);
    return "!" + lit;
}

// resolve two clauses - returns new clause or null
function resolve(c1, c2) {
    let res = [];
    let found = false;

    for (let i = 0; i < c1.length; i++) {
        if (c2.includes(negate(c1[i]))) {
            found = true;
        } else {
            res.push(c1[i]);
        }
    }

    if (!found) return null;

    for (let i = 0; i < c2.length; i++) {
        if (!c1.includes(negate(c2[i])) && !res.includes(c2[i])) {
            res.push(c2[i]);
        }
    }

    return res;
}

// prove a goal using resolution refutation
function prove(goal) {
    // add negation of goal then try to find empty clause
    let clauses = [];

    for (let i = 0; i < kb.length; i++) {
        clauses.push(kb[i].slice());
    }

    clauses.push([negate(goal)]);
    steps++;

    for (let iter = 0; iter < 100; iter++) {
        let newClauses = [];
        let changed = false;

        for (let i = 0; i < clauses.length; i++) {
            for (let j = i + 1; j < clauses.length; j++) {
                let r = resolve(clauses[i], clauses[j]);

                if (r === null) continue;

                steps++;

                // empty clause = contradiction = goal proved
                if (r.length === 0) return true;

                // add if not already in clauses
                let dup = false;
                for (let k = 0; k < clauses.length; k++) {
                    if (clauses[k].join() === r.join()) { dup = true; break; }
                }
                for (let k = 0; k < newClauses.length; k++) {
                    if (newClauses[k].join() === r.join()) { dup = true; break; }
                }

                if (!dup) {
                    newClauses.push(r);
                    changed = true;
                }
            }
        }

        if (!changed) break;
        for (let i = 0; i < newClauses.length; i++) {
            clauses.push(newClauses[i]);
        }
    }

    return false;
}

// tell kb what agent perceives at (r,c)
function tellPercepts(r, c, breeze, stench) {
    let adj = neighbors(r, c);

    // agent cell is never a pit or wumpus
    tell(["!P_" + r + "_" + c]);
    tell(["!W_" + r + "_" + c]);

    if (breeze) {
        // breeze means at least one adjacent pit
        let clause = [];
        for (let i = 0; i < adj.length; i++) {
            clause.push("P_" + adj[i][0] + "_" + adj[i][1]);
        }
        tell(clause);
    } else {
        // no breeze means no adjacent pit
        for (let i = 0; i < adj.length; i++) {
            tell(["!P_" + adj[i][0] + "_" + adj[i][1]]);
        }
    }

    if (stench) {
        // stench means at least one adjacent wumpus
        let clause = [];
        for (let i = 0; i < adj.length; i++) {
            clause.push("W_" + adj[i][0] + "_" + adj[i][1]);
        }
        tell(clause);
    } else {
        // no stench means no adjacent wumpus
        for (let i = 0; i < adj.length; i++) {
            tell(["!W_" + adj[i][0] + "_" + adj[i][1]]);
        }
    }
}

// ask kb if cell is safe
function isSafe(r, c) {
    let noP = prove("!P_" + r + "_" + c);
    let noW = prove("!W_" + r + "_" + c);
    return noP && noW;
}

// ask kb if cell is dangerous
function isDanger(r, c) {
    return prove("P_" + r + "_" + c) || prove("W_" + r + "_" + c);
}