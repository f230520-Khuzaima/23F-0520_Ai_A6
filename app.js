// grid state
let rows = 4, cols = 4;
let grid = [];
let visited = [];
let safe = [];
let danger = [];
let agent = { r: 0, c: 0 };
let currentPercepts = [];

// get valid neighbors
function neighbors(r, c) {
    let n = [];
    if (r - 1 >= 0)    n.push([r - 1, c]);
    if (r + 1 < rows)  n.push([r + 1, c]);
    if (c - 1 >= 0)    n.push([r, c - 1]);
    if (c + 1 < cols)  n.push([r, c + 1]);
    return n;
}

// generate percepts at (r,c)
function getPercepts(r, c) {
    let breeze = false;
    let stench = false;
    let n = neighbors(r, c);

    for (let i = 0; i < n.length; i++) {
        let x = n[i][0], y = n[i][1];
        if (grid[x][y].pit)    breeze = true;
        if (grid[x][y].wumpus) stench = true;
    }

    return { breeze, stench };
}

// init world with random hazards
function initWorld(r, c, numPits) {
    grid    = [];
    visited = [];
    safe    = [];
    danger  = [];
    kb      = [];
    steps   = 0;

    for (let i = 0; i < r; i++) {
        grid[i]    = [];
        visited[i] = [];
        safe[i]    = [];
        danger[i]  = [];
        for (let j = 0; j < c; j++) {
            grid[i][j]    = { pit: false, wumpus: false };
            visited[i][j] = false;
            safe[i][j]    = false;
            danger[i][j]  = false;
        }
    }

    // collect cells except (0,0)
    let cells = [];
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            if (!(i === 0 && j === 0))
                cells.push([i, j]);

    // shuffle cells
    for (let i = cells.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = cells[i];
        cells[i] = cells[j];
        cells[j] = tmp;
    }

    // place wumpus
    grid[cells[0][0]][cells[0][1]].wumpus = true;

    // place pits
    for (let k = 1; k <= numPits && k < cells.length; k++) {
        grid[cells[k][0]][cells[k][1]].pit = true;
    }

    agent = { r: 0, c: 0 };
}

// draw grid
function drawGrid() {
    let g = document.getElementById("grid");
    g.style.gridTemplateColumns = `repeat(${cols}, 60px)`;
    g.innerHTML = "";

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let div = document.createElement("div");
            div.classList.add("cell");

            if (agent.r === i && agent.c === j) {
                div.classList.add("agent");
                div.textContent = "🤖";
            } else if (danger[i][j]) {
                div.classList.add("danger");
                div.textContent = grid[i][j].pit ? "🕳️" : "👹";
            } else if (visited[i][j]) {
                div.classList.add("visited");
            } else if (safe[i][j]) {
                div.classList.add("safe");
            } else {
                div.classList.add("unknown");
            }

            g.appendChild(div);
        }
    }
}

// visit a cell - perceive, tell kb, update safe/danger
function visit(r, c) {
    agent.r = r;
    agent.c = c;
    visited[r][c] = true;
    safe[r][c]    = true;

    let p = getPercepts(r, c);
    currentPercepts = [];
    if (p.breeze) currentPercepts.push("Breeze");
    if (p.stench) currentPercepts.push("Stench");

    tellPercepts(r, c, p.breeze, p.stench);

    // check all unvisited cells
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (visited[i][j]) continue;
            if (safe[i][j] || danger[i][j]) continue;

            if (isSafe(i, j)) {
                safe[i][j] = true;
            } else if (isDanger(i, j)) {
                danger[i][j] = true;
            }
        }
    }
}

// move agent to next safe cell
function stepAgent() {
    let r = agent.r;
    let c = agent.c;
    let n = neighbors(r, c);

    // try neighbors first
    for (let i = 0; i < n.length; i++) {
        let x = n[i][0], y = n[i][1];
        if (!visited[x][y] && safe[x][y] && !danger[x][y]) {
            visit(x, y);
            return;
        }
    }

    // try any safe unvisited cell
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (!visited[i][j] && safe[i][j] && !danger[i][j]) {
                visit(i, j);
                return;
            }
        }
    }
}

// init game
function init() {
    rows = parseInt(document.getElementById("rowInput").value) || 4;
    cols = parseInt(document.getElementById("colInput").value) || 4;
    let pits = parseInt(document.getElementById("pitInput").value) || 3;
    initWorld(rows, cols, pits);
    visit(0, 0);
    drawGrid();
    document.getElementById("info").innerText = "Percepts: " + (currentPercepts.join(", ") || "None");
    document.getElementById("stepInfo").innerText = "Inference Steps: " + steps;
}

// move agent
function moveAgent() {
    stepAgent();
    drawGrid();
    document.getElementById("info").innerText =
        "Percepts: " + (currentPercepts.join(", ") || "None");
    document.getElementById("stepInfo").innerText = "Inference Steps: " + steps;
}