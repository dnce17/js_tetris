import { blockTypes } from "./block_types.js"
import { createEleWithCls, deepCopy } from "./helpers.js"

// Block Info
let defaultBlockPos = {"x": 3, "y": 1}
let blockPos = [];

// TEST USE: Will be changed later to be more dynamic
let currentBlockType = blockTypes()["L"];
let rotationIndex = 0;
let block = currentBlockType[rotationIndex];

let topLeftCoor;
let ghostPos;

// SECTION (IN PROGRESS): Block rotation
function rotatePiece() {
    let rotatedBlock;
    if (rotationIndex != currentBlockType.length - 1) {
        rotatedBlock = currentBlockType[rotationIndex + 1];
    }
    else {
        rotatedBlock = currentBlockType[0];
    }

    if (checkRotationCollision(topLeftCoor, rotatedBlock) == false) {
        if (rotationIndex != currentBlockType.length - 1) {
            rotationIndex += 1;
        }
        else {
            rotationIndex = 0;
        }
    
        block = currentBlockType[rotationIndex];
        removeOldBlock(blockPos);
        placeRotatedPiece();
    }
}

// IN PROGRESS
function checkRotationCollision(topLeftCoor, rotatedBlock) {
    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = topLeftCoor["x"] + col;

            if (rotatedBlock[row][col] !== 0) { 
                // Check col rotation overlap with WALL --> NO ERRORS YAY
                if (blockX == FILLER_COL_INDEX[0] || blockX == FILLER_COL_INDEX[1]) {
                    console.log(`column overlap at x: ${blockX}, y: ${blockY}`);
                    return true;
                }

                // Check row rotation overlap with WALL --> TESTING
                if (blockY == FILLER_ROW_INDEX[0] || blockY == FILLER_ROW_INDEX[1]) {
                    console.log(`row overlap at y: ${blockX}, y: ${blockY}`);
                    return true;
                }

                // Check rotation overlap with BLOCK
                // Have grid ignore the 1 that's taken up by current moving block
                let skip = false;
                for (let coor of blockPos) {
                    if (blockX == coor.x && blockY == coor.y) {
                        skip = true;
                        break;
                    }
                }

                if (skip == false) {
                    if (grid[blockY][blockX] == 1) {
                        console.log(`OVERLAP WITH: x: ${blockX}, y: ${blockY}`);
                        console.log(`topLeftCoor: ${topLeftCoor}`);
                        return true;
                    }
                }
                else {
                    continue;
                }
            }
        }
    }

    return false;

}

function placeRotatedPiece() {
    blockPos = [];

    for (let row = 0; row < block.length; row++) {
        let blockY = topLeftCoor["y"] + row;
        for (let col = 0; col < block[row].length; col++) {
            let blockX = topLeftCoor["x"] + col;

            if (block[row][col] !== 0) { 
                grid[blockY][blockX] = block[row][col];
                saveBlockCoor(blockPos, blockX, blockY);
            }
        }
    }

    updateBoard(grid);
    placeGhost(blockPos);
}

// Grid Info
// NOTE: Make to change the CSS grid-templete if you change the row and col count
let grid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],

    // TEST
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]
// let grid = [];
let TOTAL_COLUMN = 12;

// NOTE: Filler rows and cols are used to check for wall rotation collision
let TOTAL_ROW = 10;
let FILLER_ROW_INDEX = [0, TOTAL_ROW - 1];
let FILLER_COL_INDEX = [0, TOTAL_COLUMN - 1];

// Ctrls Info
let keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};

// SECTION: Grid (dynamically made)
function createGrid(grid) {
    for (let row = 0; row < TOTAL_ROW; row++) {
        let rowArr = [];
        for (let col = 0; col < TOTAL_COLUMN; col++) {
            rowArr.push(0);

            // TEST USE --> insert random obstacles
            // let coin = Math.random() < 0.80 ? 'Heads' : 'Tails';
            // if (coin == "Heads") {
            //     rowArr.push(0);
            // }
            // else {
            //     rowArr.push(1);
            // }
        }
        grid.push(rowArr);
    }
}

// SECTION: Board
function updateBoard(grid) {
    // Delete and update board w/ updated grid
    let board = document.querySelector(".board");
    removeOldBoard(board);
    createBoard(board, grid);
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

function createBoard(board, grid) {
    // Create board cell + px 
    let cell;
    for (let row = 0; row < TOTAL_ROW; row++) {
        let rowDiv;

        // Create rows
        if (row == FILLER_ROW_INDEX[0] || row == FILLER_ROW_INDEX[1]) {
            // Create filler row
            rowDiv = createEleWithCls("div", ["row", "hidden"]);
        } 
        else {
            rowDiv = createEleWithCls("div", ["row"]);
        }

        // Create cols
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] == 0) {
                if (col == FILLER_COL_INDEX[0] || col == FILLER_COL_INDEX[1]) {
                    cell = createEleWithCls("div", ["cell", "hidden"]);
                }
                else {
                    cell = createEleWithCls("div", ["cell"]);
                }
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

// TEST USE
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

// SECTION: Place block
function placeBlockDefaultPos() {
    // Reset blockPos
    blockPos = [];

    for (let row = 0; row < block.length; row++) {
        let blockY = defaultBlockPos["y"] + row;
        for (let col = 0; col < block[row].length; col++) {
            let blockX = defaultBlockPos["x"] + col;

            // Save the top-left coor for rotation purposes
            if (row == 0 && col == 0) {
                topLeftCoor = {"x": blockX, "y": blockY};
            }

            // Only place non-zero values
            if (block[row][col] !== 0) { 
                grid[blockY][blockX] = block[row][col];
                saveBlockCoor(blockPos, blockX, blockY);
            }
        }
    }

    updateBoard(grid);
    placeGhost(blockPos);
}

function placeBlock(ghostPos, blockPos) {
    // Remove block being controlled
    removeOldBlock(blockPos);

    // Place block based on ghostPos
    for (let coor of ghostPos) {
        grid[coor.y][coor.x] = 1;
    }

    // New block appears
    placeBlockDefaultPos();
}

function saveBlockCoor(blockPos, x, y) {
    blockPos.push({"x": x, "y": y});
}

function updateBlockPos(blockPos, direction) {
    removeOldBlock(blockPos);
    updatePieceCoors(blockPos, direction);
    updateBoard(grid);
}

function removeOldBlock(blockPos) {
    for (let coor of blockPos) {
        if (grid[coor.y][coor.x] == 1) {
            grid[coor.y][coor.x] = 0;
        }
    }
}

// REUSED more than once
function updatePieceCoors(pos, direction, ghost=false) {
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
function placeGhost(blockPos) {
    ghostPos = deepCopy(blockPos);
    let direction = "down";

    calculateGhostPos(ghostPos, direction, TOTAL_COLUMN, TOTAL_ROW);
    displayGhost(ghostPos);
}

function calculateGhostPos(ghostPos, direction, TOTAL_COLUMN, TOTAL_ROW) {
    // Loop until ghost hits wall or block
    while(true) {
        if (checkCollision(ghostPos, direction, TOTAL_COLUMN, TOTAL_ROW) == false) {
            // Adds 1 to all y coors b/c safe (aka no obstacle), then checks (new y coor + 1) to see if obstacle
            updatePieceCoors(ghostPos, direction, true);
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

// SECTION: Collision
function checkCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW) {

    let wallCollision = checkWallCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW);
    if (wallCollision == true) {
        return true;
    }

    let blockCollision = checkBlockCollision(blockPos, direction);
    if (blockCollision == true) {
        return true;
    }

    return false;
}

function checkWallCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW) {
    for (let coor of blockPos) {
        if (direction == "down" && coor.y + 1 >= TOTAL_ROW - 1) {
            return true;
        }

        if (direction == "left" && coor.x - 1 < 1) {
            return true;
        }

        if (direction == "right" && coor.x + 1 >= TOTAL_COLUMN - 1) {
            return true;
        }

        // TEST USE ONLY
        if (direction == "up" && coor.y - 1 < 0) {
            return true;
        }
    }

    return false;
}

function checkBlockCollision(blockPos, direction) { 
    let outermostCoors;
    if (direction == "down") {
        outermostCoors = getOutermostCoors(blockPos, "y", direction);
    }
    else {
        outermostCoors = getOutermostCoors(blockPos, "x", direction);
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

function getOutermostCoors(blockPos, axis, direction) {
    // Gets the outermost x or y coors for block collision check, depending on directions
    // ****NOTE: there may be more than 1 outermost coors
        // E.g. a block that has at least px in each row will have 3 outermost x
        // Get highest x of each unique y if right, lowest x if left, highest y if down

    // Grouped by either x or y
    let groupedAxis;
    let outermostCoors = [];
    if (axis == "x" && (direction == "right" || direction == "left")) {
        // Group all y coors
        groupedAxis = groupByAxis("y", blockPos);
        outermostCoors = processOutermostCoors("y", groupedAxis, direction);
    }

    if (axis == "y" && direction == "down") {
        // Group all x coors
        groupedAxis = groupByAxis("x", blockPos);
        outermostCoors = processOutermostCoors("x", groupedAxis, direction);
    }

    return outermostCoors;
}

function groupByAxis(axis, blockPos) {
    return blockPos.reduce((acc, coorObj) => {
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

// SECTION: line clear
function clear_line() {
    let test_grid = [
        [0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1],
    ]

    test_grid = test_grid.filter(row => String(row) !== String([1, 1, 1, 1, 1, 1]));
    console.log(test_grid);
}

// SECTION: Moving block
function enableCtrls() {
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];

    window.addEventListener("keydown", function(e) {
        if (e.key == " ") {
            placeBlock(ghostPos, blockPos);
        }

        // TEST: rotatePiece will ultimately use Up key
        if (e.key == "r") {
            rotatePiece();
        }

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
    if (direction != null && checkCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW) == false) {
        updateBlockPos(blockPos, direction);
        placeGhost(blockPos);
    }

    setTimeout(gameLoop, 30);
} 

function executeGame() {
    // createGrid(grid);
    updateBoard(grid);
    placeBlockDefaultPos();
    enableCtrls();
    gameLoop();
}

executeGame();