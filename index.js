import { blockTypes, clockwiseKickData} from "./blocks_n_kicks.js"
import { createEleWithCls, deepCopy } from "./helpers.js"

const gridInfo = {
    rows: 9,
    cols: 10,
    fillerRows: 1,
    grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    ],
}

const blockInfo = {
    defaultPos: {"x": 4, "y": 1},
    currentPos: [],
    ghostPos: [],

    // Used so grid always knows where to overwrite current block with rotated block
    topLeftCoor: {},

    // TEST USE for implementing rotation collision
    currentType: blockTypes()["O"],

    rotationIndex: 0,
    block: null,

    kickData: clockwiseKickData(),
    
    // Will use 7-bag randomizer type
    bag: Object.keys(blockTypes())
}; 

const keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};

// SECTION: Board
function updateBoard(grid, rows, fillerRows) {
    // Delete and update board w/ updated grid
    let board = document.querySelector(".board");
    removeOldBoard(board);
    createBoard(board, grid, rows, fillerRows);
}

function removeOldBoard(board) {
    if (board.children.length > 0) {
        let child = board.lastElementChild;
        while (child) {
            board.removeChild(child);
            child = board.lastElementChild;
        }
    }
}

function createBoard(board, grid, rows, fillerRows) {
    // Create board cell + px 
    let cell;
    for (let row = 0; row < rows; row++) {
        let rowDiv;

        // Create filler row
        if (row < fillerRows) {
            rowDiv = createEleWithCls("div", ["row", "hidden"]);
        } 
        else {
            rowDiv = createEleWithCls("div", ["row"]);
        }

        for (let col of grid[row]) {
            if (col == 0) {
                cell = createEleWithCls("div", ["cell"]);
            }
            else {
                cell = createEleWithCls("div", ["cell", "px"]);
            }

            rowDiv.appendChild(cell);
        }

        board.appendChild(rowDiv);
    }

    // TEST USE
    addGridLabels();
}

// // TEST USE
function addGridLabels() {
    let board = document.querySelector(".board");
    for (let row = 0; row < board.children.length; row++) {
        let currentRow = board.children[row];
        for (let col = 0; col < currentRow.children.length; col++) {
            let currentCol = currentRow.children[col];
            currentCol.innerHTML = `${col}, ${row}`;
        }
    }
}

// SECTION: Random block generator - CHECKPOINT
function getBlock(bag) {
    let val = Math.floor(Math.random() * bag.length);
    let block = bag[val];
    removeBlockFromBag(bag, block);

    if (bag.length == 0) {
        refillBag(bag);
    }

    return blockTypes()[block][0];
}

function removeBlockFromBag(bag, block) {
    let index = bag.indexOf(block);
    if (index > -1) {
        bag.splice(index, 1);
    }
}

function refillBag(bag) {
    Object.keys(blockTypes()).forEach(block => bag.push(block));
}

// SECTION: Place block
function placeBlockDefaultPos(blockInfo, gridInfo) {
    // Reset blockPos & create block type
    blockInfo.currentPos = [];
    // blockInfo.block = getBlock(blockInfo.bag);

    // TEST USE when implementing rotation collision
    blockInfo.block = blockInfo.currentType[blockInfo.rotationIndex];

    let block = blockInfo.block;
    let defaultPos = blockInfo.defaultPos;

    for (let row = 0; row < block.length; row++) {
        let blockY = defaultPos["y"] + row;
        for (let col = 0; col < block[row].length; col++) {
            let blockX = defaultPos["x"] + col;

            // Save the top-left coor for rotation purposes
            if (row == 0 && col == 0) {
                blockInfo.topLeftCoor = {"x": blockX, "y": blockY};
            }

            // Only place non-zero values
            if (block[row][col] !== 0) { 
                gridInfo.grid[blockY][blockX] = block[row][col];
                saveCoorToArr(blockInfo.currentPos, blockX, blockY);
            }
        }
    }

    updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
    placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);
}

function saveCoorToArr(arr, x, y) {
    arr.push({"x": x, "y": y});
}

function placeBlock(ghostPos, blockPos, grid) {
    // Remove block being controlled
    removeOldBlock(blockPos, grid);

    // Place block based on ghostPos
    for (let coor of ghostPos) {
        grid[coor.y][coor.x] = 1;
    }

    // New block appears
    clearLine(gridInfo);
    placeBlockDefaultPos(blockInfo, gridInfo);
}

function removeOldBlock(blockPos, grid) {
    for (let coor of blockPos) {
        if (grid[coor.y][coor.x] == 1) {
            grid[coor.y][coor.x] = 0;
        }
    }
}

// // REUSED more than once
function updatePieceCoors(pos, topLeftCoor, grid, direction, ghost=false) {
    let updatedTopLeftCoors = false;    // Tracks top left coor for rotation use

    for (let coor of pos) {
        updateCoor(coor, direction);
        
        // FUTURE: Maybe this should be its own function in future
        // Ghost is only reflected on DOM, not grid
        if (ghost == false) {
            grid[coor.y][coor.x] = 1;

            // Should only activate once or else each loop's coor will add to topLeftCoor
            if (updatedTopLeftCoors == false) {
                updateCoor(topLeftCoor, direction);
                updatedTopLeftCoors = true;
            }
        }
    }
}

function updateCoor(coor, direction) {
    if (direction == "down") {
        coor.y += 1;
    }

    if (direction == "left") {
        coor.x -= 1;
    }

    if (direction == "right") {
        coor.x += 1;
    }

    // TEST USE ONLY
    if (direction == "up") {
        coor.y -= 1;
    }
}

// SECTION: Ghost
// NOTE 1: Any changes to ghost position is solely changed in DOM and not grid b/c it's just visual aid
// NOTE 2: placeGhost is based on blockPos and uses board DOM, 
// so it should always be placed after funcs that alter blockPos and board DOM
function placeGhost(ghostPos, blockPos, rows, cols) {
    // Reset ghostPos; NOTE: I did not do ghostPos = [] b/c original would not be affected
    ghostPos.length = 0;
    deepCopy(blockPos).forEach(coor => ghostPos.push(coor));
    let direction = "down";

    calculateGhostPos(ghostPos, rows, cols, direction);
    displayGhost(ghostPos);
}

function calculateGhostPos(ghostPos, rows, cols, direction) {
    // Loop until ghost hits wall or block
    while(true) {
        if (checkCollision(ghostPos, rows, cols, gridInfo.grid, direction) == false) {
            // Adds 1 to all y coors b/c safe (aka no obstacle), then checks (new y coor + 1) to see if obstacle
            updatePieceCoors(ghostPos, blockInfo.topLeftCoor, gridInfo.grid, direction, true);
        }
        else {
            break;
        }
    }
}

function displayGhost(ghostPos) {
    // Match the ghostPos with DOM cells
    let board = document.querySelector(".board");
    for (let coor of ghostPos) {
        // row = children[coor.y], col = children[coor.x]
        let cell = board.children[coor.y].children[coor.x];
        cell.classList.add("ghost");
    }
}

// // SECTION: Collision
function checkCollision(pos, rows, cols, grid, direction) {
    let wallCollision = checkWallCollision(pos, rows, cols, direction);
    if (wallCollision == true) {
        return true;
    }

    let blockCollision = checkBlockCollision(pos, grid, direction);
    if (blockCollision == true) {
        return true;
    }

    return false;
}

// CHECKPOINT!!!
function checkWallCollision(pos, rows, cols, direction) {
    for (let coor of pos) {
        if (direction == "down" && coor.y + 1 >= rows) {
            return true;
        }

        if (direction == "left" && coor.x - 1 < 0) {
            return true;
        }

        if (direction == "right" && coor.x + 1 >= cols) {
            return true;
        }

        // TEST USE ONLY
        if (direction == "up" && coor.y - 1 < 0) {
            return true;
        }
    }

    return false;
}

function checkBlockCollision(pos, grid, direction) { 
    let outermostCoors;
    if (direction == "down") {
        outermostCoors = getOutermostCoors(pos, "y", direction);
    }
    else {
        outermostCoors = getOutermostCoors(pos, "x", direction);
    }

    for (let coor of outermostCoors) {
        if (direction == "right" && grid[coor.y][coor.x + 1] == 1) {
            console.log("right collision");
            return true;
        }

        if (direction == "left" && grid[coor.y][coor.x - 1] == 1) {
            console.log("left collision");
            return true;
        }

        if (direction == "down" && grid[coor.y + 1][coor.x] == 1) {
            console.log("down collision");
            return true;
        }
    }

    return false;
}

function getOutermostCoors(pos, axis, direction) {
    // Gets the outermost x or y coors for block collision check, depending on directions
    // ****NOTE: there may be more than 1 outermost coors
        // E.g. a block that has at least px in each row will have 3 outermost x
        // Get highest x of each unique y if right, lowest x if left, highest y if down

    // Grouped by either x or y
    let groupedAxis;
    let outermostCoors = [];
    if (axis == "x" && (direction == "right" || direction == "left")) {
        // Group all y coors
        groupedAxis = groupByAxis("y", pos);
        outermostCoors = processOutermostCoors("y", groupedAxis, direction);
    }

    if (axis == "y" && direction == "down") {
        // Group all x coors
        groupedAxis = groupByAxis("x", pos);
        outermostCoors = processOutermostCoors("x", groupedAxis, direction);
    }

    return outermostCoors;
}

function groupByAxis(axis, pos) {
    return pos.reduce((acc, coorObj) => {
        let coorVal = coorObj[axis];
        if (!acc[coorVal]) {
          acc[coorVal] = [];
        }
        
        acc[coorVal].push(coorObj);
        return acc;
      }, {});
}

function processOutermostCoors(axis, groupedAxisDict, direction) {
    if (axis == "y" && direction == "right") {
        return Object.keys(groupedAxisDict).map(y => {
            return groupedAxisDict[y].reduce((coorAcc, coorObj) => coorObj.x > coorAcc.x ? coorObj : coorAcc);
        });
    }

    if (axis == "y" && direction == "left") {
        return Object.keys(groupedAxisDict).map(y => {
            return groupedAxisDict[y].reduce((coorAcc, coorObj) => coorObj.x < coorAcc.x ? coorObj : coorAcc);
        });
    }

    if (axis == "x" && direction == "down") {
        return Object.keys(groupedAxisDict).map(x => {
            return groupedAxisDict[x].reduce((coorAcc, coorObj) => coorObj.y > coorAcc.y ? coorObj : coorAcc);
        });
    }
}

// SECTION: Line Clear
function clearLine(gridInfo) {
    let clearedGrid = gridInfo.grid.filter(row => String(row) !== String([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));

    while (clearedGrid.length < gridInfo.rows) {
        clearedGrid.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    gridInfo.grid = clearedGrid;
    updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
}

// // SECTION: Moving block
function enableCtrls() {
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];

    window.addEventListener("keydown", function(e) {
        if (e.key == " ") {
            placeBlock(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.grid);
        }

        // TEST: rotatePiece will ultimately use Up key
        // if (e.key == "r") {
        //     rotatePiece();
        // }

        if (keys.includes(e.key)) {
            keyState[e.key] = true;
        }
    }); 

    window.addEventListener("keyup", function(e) {
        if (keys.includes(e.key)) {
            keyState[e.key] = false;
        }
    })
}

function gameLoop() {
    let direction = null;
    if (keyState["ArrowDown"] == true) {
        direction = "down";
    }    
    if (keyState["ArrowLeft"] == true) {
        direction = "left";
    }
    if (keyState["ArrowRight"] == true) {
        direction = "right";
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        direction = "up";
    }

    // NOTE: if you want diagonal movement, put this in each if statement
    if (direction != null && checkCollision(blockInfo.currentPos, gridInfo.rows, gridInfo.cols, gridInfo.grid, direction) == false) {
        removeOldBlock(blockInfo.currentPos, gridInfo.grid);
        updatePieceCoors(blockInfo.currentPos, blockInfo.topLeftCoor, gridInfo.grid, direction);
        updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);

        placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);
    }


    setTimeout(gameLoop, 30);
} 

function executeGame() {
    placeBlockDefaultPos(blockInfo, gridInfo);
    enableCtrls();
    gameLoop();
}

executeGame();