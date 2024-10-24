import { blockTypes, clockwiseKickData} from "./blocks_n_kicks.js"
import { createEleWithCls, deepCopy } from "./helpers.js"

const gridInfo = {
    rows: 15,
    cols: 10,
    fillerRows: 1,
    grid: [],

    // Block State Properties
    dropInterval: 1000,  
    lastAutoDropTime: Date.now(),  // Track the time of the last drop
    counter: 0, // Allows > 1 second to finalize block placement if obstacle is below and user moves left/right; max: 30
    maxCounter: 30,

    // Movement Delay
    lastMoveTime: Date.now(),
    delay: 100
}

const blockInfo = {
    defaultPos: {"x": 3, "y": 1},
    currentPos: [],
    ghostPos: [],

    // Used so grid always knows where to overwrite current block with rotated block
    topLeftCoor: {},

    typeName: null,
    currentType: null,
    rotationIndex: 0,
    block: null,
    
    // Will use 7-bag randomizer type
    bag: Object.keys(blockTypes())
}; 

const keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};

// SECTION: Grid (dynamically made)
function createGrid(grid, totalRows, totalCols) {
    for (let row = 0; row < totalRows; row++) {
        let rowArr = [];
        for (let col = 0; col < totalCols; col++) {
            rowArr.push(0);
        }
        grid.push(rowArr);
    }
}

// SECTION: Rotation Collision
function rotateBlock(blockInfo, gridInfo) {
    let b = blockInfo, g = gridInfo;

    // Save in case all kicks fail; block will revert back
    let unrotatedBlockPos = deepCopy(b.currentPos);
    let oldRotationIndex = deepCopy(b.rotationIndex);

    updateRotationIndex(b);
    let rotatedBlock = b.currentType[b.rotationIndex];
    let rotatedBlockPos = [];

    // Remove current block from grid (board unaffected) for testing
    removeOldBlock(b.currentPos, g.grid);

    // NOT NEEDED, but helps with testing visually
    updateBoard(g.grid, g.rows, g.fillerRows);

    // Checks 1 px of block at a time and if occupied by grid already
    let failed = false;

    // CONSIDER: THIS LOOP IS REUSED A LOT
    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = b.topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = b.topLeftCoor["x"] + col;
            // Save all rotated block's coors first before possible kick test
            if (rotatedBlock[row][col] != 0) {
                saveCoorToArr(rotatedBlockPos, blockX, blockY);
            }
        }
    }

    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = b.topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = b.topLeftCoor["x"] + col;

            // ISSUE: blockX + blockY can go out of bound b/c blocks use 4x4
            // SOLUTION below: Prevents checking blockX + blockY if they are beyond wall since can cause error
            if (blockY < g.rows &&  blockX < g.cols) {
                let beyondWall = checkBeyondWall(rotatedBlock, b.topLeftCoor, g.rows, g.cols);
                // Check collision w/ BLOCK
                let rotationCollision = checkRotationCollision(g.grid[blockY][blockX], rotatedBlock[row][col]);

                if (beyondWall == true || rotationCollision == true) {
                    failed = true;

                    // Start kick test
                    let checkKicks = testKicks(rotatedBlockPos, b, g);
                    if (checkKicks == true) {
                        finalizeRotation(b, g, rotatedBlock);
                        updateBoard(g.grid, g.rows, g.fillerRows);
                        placeGhost(b, g, "down");
                        return true;
                    }
                    else {
                        // Reset to before rotation was done
                        b.rotationIndex = oldRotationIndex;
                        b.currentPos = unrotatedBlockPos;

                        // Place block pos on grid, then update board
                        finalizeRotation(b, g, b.currentType[b.rotationIndex]);
                        updateBoard(g.grid, g.rows, g.fillerRows);
                        placeGhost(b, g, "down");

                        return false;
                    }
                }
            }
        }
    }

    // Initial rotation is successful
    if (failed == false) {
        finalizeRotation(b, g, rotatedBlock);
        updateBoard(g.grid, g.rows, g.fillerRows);
        placeGhost(b, g, "down");
    }
}


function updateRotationIndex(blockInfo) {
    let b = blockInfo;
    if (b.rotationIndex < b.currentType.length - 1) {
        b.rotationIndex += 1;
    }
    else {
        b.rotationIndex = 0;
    }
}

function checkRotationCollision(cell, rotatedBlockPx) {
    // Check collision w/ BLOCK
    if (rotatedBlockPx != 0 && cell != 0) {
        return true;
    } 
    return false;
}

function checkBeyondWall(rotatedBlock, topLeftCoor, totalRows, totalCols) {
    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = topLeftCoor["x"] + col;

            if (rotatedBlock[row][col] != 0) {
                // No pt in checking if a non-block px is out of bound
                if (blockY > totalRows - 1 || blockX >= totalCols || blockX < 0) {
                    return true;
                }
            }
        }   
    }

    return false;
}

function finalizeRotation(blockInfo, gridInfo, rotatedBlock) {
    let b = blockInfo, g = gridInfo;
    b.currentPos = [];

    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = b.topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = b.topLeftCoor["x"] + col;

            if (row == 0 && col == 0) {
                b.topLeftCoor = {"x": blockX, "y": blockY};
            }

            // Only place non-zero values
            if (rotatedBlock[row][col] !== 0) { 
                g.grid[blockY][blockX] = b.typeName;
                saveCoorToArr(b.currentPos, blockX, blockY);
            }   
        }   
    }
}

function testKicks(pos, blockInfo, gridInfo) {
    let b = blockInfo, g = gridInfo;
    let data = null;

    if (b.typeName == "I") {
        data = clockwiseKickData().clockwiseI;
    }
    else {
        data = clockwiseKickData().clockwiseStd;
    }

    for (let offset of data[b.rotationIndex]) {
        // Shift coors of rotatedBlockPos to test kicks
        for (let [i, coor] of pos.entries()) {
            let kickX = coor.x + offset[0]; 
            let kickY = coor.y + offset[1];

            // REMEMBER: This loop ONLY checks 1 px at a time
            // Test if kicks go beyond walls; rows - 1 to exclude invisible row from count
            if (kickY > g.rows - 1|| kickX >= g.cols || kickX < 0) {
                break;
            }

            // Test if new grid cell after kick overlaps with new coor
            if (g.grid[kickY][kickX] != 0) {
                break;  // A single fail = this entire offset fails; go to next offset
            }

            // Goes here if no overlaps at all after looping all coor of pos
            if (i == pos.length - 1) {
                // Only update topLeftCoor once one kick works
                // b/c that's when we actually need to put it on grid + board
                b.topLeftCoor.x += offset[0];
                b.topLeftCoor.y += offset[1];

                return true;
            }
        }
    }

    return false;
}

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
                cell = createEleWithCls("div", ["cell", "px", col]);
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

// SECTION: Random block generator
function getBlock(blockInfo) {
    let b = blockInfo;

    let val = Math.floor(Math.random() * b.bag.length);
    let block = b.bag[val];

    b.typeName = block;
    b.currentType = blockTypes()[block];
    removeBlockFromBag(b.bag, block);

    if (b.bag.length == 0) {
        refillBag(b.bag);
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
    let b = blockInfo, g = gridInfo;
    
    // Reset blockPos, create block type, & rotationIndex to 0
    b.currentPos = [];
    b.block = getBlock(blockInfo);
    b.rotationIndex = 0;

    let block = b.block;
    let defaultPos = b.defaultPos;

    for (let row = 0; row < block.length; row++) {
        let blockY = defaultPos["y"] + row;
        for (let col = 0; col < block[row].length; col++) {
            let blockX = defaultPos["x"] + col;

            // Save the top-left coor for rotation purposes
            if (row == 0 && col == 0) {
                b.topLeftCoor = {"x": blockX, "y": blockY};
            }

            // Only place non-zero values
            if (block[row][col] !== 0) { 
                g.grid[blockY][blockX] = b.typeName;
                saveCoorToArr(b.currentPos, blockX, blockY);
            }
        }
    }

    updateBoard(g.grid, g.rows, g.fillerRows);
    placeGhost(b, g, "down");
}

function saveCoorToArr(arr, x, y) {
    arr.push({"x": x, "y": y});
}

function placeBlock(ghostPos, blockPos, typeName, grid) {
    // Remove block being controlled
    removeOldBlock(blockPos, grid);

    // Place block based on ghostPos
    for (let coor of ghostPos) {
        grid[coor.y][coor.x] = typeName;
    }

    // New block appears
    clearLine(gridInfo);
    placeBlockDefaultPos(blockInfo, gridInfo);
}

function removeOldBlock(blockPos, grid) {
    for (let coor of blockPos) {
        if (grid[coor.y][coor.x] != 0) {
            grid[coor.y][coor.x] = 0;
        }
    }
}

// REUSED more than once
function updatePieceCoors(pos, typeName, topLeftCoor, grid, direction, ghost=false) {
    let updatedTopLeftCoors = false;

    for (let coor of pos) {
        updateCoor(coor, direction);
        
        // FUTURE: Maybe this should be its own function in future
        // Ghost is only reflected on DOM, not grid
        if (ghost == false) {
            grid[coor.y][coor.x] = typeName;

            // topLeftCoor should only update once (or else EACH loop's coor will add to topLeftCoor = bad)
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
}

// SECTION: Ghost
// NOTE 1: Any changes to ghost position is solely changed in DOM and not grid b/c it's just visual aid
// NOTE 2: placeGhost is based on blockPos and uses board DOM, 
// so it should always be placed after funcs that alter blockPos and board DOM
function placeGhost(blockInfo, gridInfo, direction) {
    let b = blockInfo, g = gridInfo;

    // Reset ghostPos; NOTE: I did not do ghostPos = [] b/c original would not be affected
    b.ghostPos = [];
    console.log(b.currentPos);
    deepCopy(b.currentPos).forEach(coor => b.ghostPos.push(coor));
    // let direction = "down";

    calculateGhostPos(b, g, direction);
    displayGhost(b.ghostPos, b.typeName);
}

function calculateGhostPos(blockInfo, gridInfo, direction) {
    let b = blockInfo, g = gridInfo;

    // Loop until ghost hits wall or block
    while(true) {
        if (checkCollision(b.ghostPos, g.rows, g.cols, g.grid, direction) == false) {
            // Adds 1 to all y coors b/c safe (aka no obstacle), then checks (new y coor + 1) to see if obstacle
            updatePieceCoors(b.ghostPos, b.typeName, b.topLeftCoor, g.grid, direction, true);
        }
        else {
            break;
        }
    }
}

function displayGhost(ghostPos, typeName) {
    // Match the ghostPos with DOM cells
    let board = document.querySelector(".board");
    for (let coor of ghostPos) {
        let cell = board.children[coor.y].children[coor.x];
        cell.classList.add("ghost", typeName);
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
        if (direction == "right" && grid[coor.y][coor.x + 1] != 0) {
            return true;
        }

        if (direction == "left" && grid[coor.y][coor.x - 1] != 0) {
            return true;
        }

        if (direction == "down" && grid[coor.y + 1][coor.x] != 0) {
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
        groupedAxis = groupByAxis("y", pos);
        outermostCoors = processOutermostCoors("y", groupedAxis, direction);
    }

    if (axis == "y" && direction == "down") {
        groupedAxis = groupByAxis("x", pos);
        outermostCoors = processOutermostCoors("x", groupedAxis, direction);
    }

    return outermostCoors;
}

function groupByAxis(axis, pos) {
    // Groups all x or y coors from pos dicts
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
    // Keep the non-full lines
    let clearedGrid = gridInfo.grid.filter(row => !row.every(item => typeof item === 'string'));

    while (clearedGrid.length < gridInfo.rows) {
        clearedGrid.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    gridInfo.grid = clearedGrid;
    updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
}

// // SECTION: Moving block
function enableCtrls(blockInfo, gridInfo, keyState) {
    let b = blockInfo, g = gridInfo;
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];

    window.addEventListener("keydown", function(e) {
        if (e.key == " ") {
            placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
            g.lastAutoDropTime = Date.now();
            g.counter = 0;
        }

        if (e.key == "ArrowUp") {
            rotateBlock(blockInfo, gridInfo);

            if (checkCollision(b.currentPos, g.rows, g.cols, g.grid, "down") == true) {
                if (g.counter < g.maxCounter) {
                    g.counter += 1;
                }
                else {
                    placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
                    g.lastAutoDropTime = Date.now();
                    g.counter = 0;
                }

                g.lastAutoDropTime = Date.now();
            }
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

function gameLoop(blockInfo, gridInfo, keyState) {
    let b = blockInfo, g = gridInfo;
    let now = Date.now();
    
    // Get user input direction, can be "down", "left", "right", or null
    let direction = getDirection(keyState);

    // Handle auto-drop if enough time has passed
    if (now - g.lastAutoDropTime >= g.dropInterval) {
        direction = "down"; // Force auto-drop down if enough time has passed
        
        // Check if the block collides after auto-drop
        let collision = checkCollision(deepCopy(b.currentPos), g.rows, g.cols, g.grid, direction);
        if (collision) {
            placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
            g.lastAutoDropTime = now;  // Reset drop timer after auto drop
            g.counter = 0;

            setTimeout(gameLoop, 42, b, g, keyState);
            return;
        } 
        else {
            g.lastAutoDropTime = now;  // Reset timer after moving down automatically
        }
    }

    // Handle manual movement
    if (direction != null) {
        if (direction === "down") {
            // Manual down movement
            let collision = checkCollision(b.currentPos, g.rows, g.cols, g.grid, direction);
            if (collision == false) {
                // Move the block down
                removeOldBlock(b.currentPos, g.grid);
                updatePieceCoors(b.currentPos, b.typeName, b.topLeftCoor, g.grid, direction);
                updateBoard(g.grid, g.rows, g.fillerRows);
                placeGhost(b, g, "down");
                g.lastAutoDropTime = now;  // Reset the auto-drop timer after manual drop
            } 
        } 
        else {
            now = Date.now();

            if (now - g.lastMoveTime > 42) {
                // Handle left/right movement
                if (checkCollision(b.currentPos, g.rows, g.cols, g.grid, direction) == false) {
                    removeOldBlock(b.currentPos, g.grid);
                    updatePieceCoors(b.currentPos, b.typeName, b.topLeftCoor, g.grid, direction);
                    updateBoard(g.grid, g.rows, g.fillerRows);
                    placeGhost(b, g, "down");
                }

                // Reset timer if block is touching obstacle below it; Counter avoids timer
                // NOTE: This "down" direction if statement is added here instead of the direction == "down" if statement b/c 
                // the point is for the block to MOVE LEFT/RIGHT to allow more than 1 sec (aka when counter reaches 30) 
                // before auto placing, assuming there's an obstacle below it
                if (checkCollision(b.currentPos, g.rows, g.cols, g.grid, "down") == true) {
                    if (g.counter < g.maxCounter) {
                        g.counter += 1;
                        console.log(g.counter);
                    }
                    else {
                        placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
                        g.counter = 0;
                    }

                    g.lastAutoDropTime = now;
                }
            }

            g.lastMoveTime = now;
        }
    }

    setTimeout(gameLoop, 42, b, g, keyState);
}


function getDirection(keyState) {
    if (keyState["ArrowDown"] == true) {
        return "down";
    }    
    if (keyState["ArrowLeft"] == true) {
        return "left";
    }
    if (keyState["ArrowRight"] == true) {
        return "right";
    }

    return null;
}

function executeGame(blockInfo, gridInfo, keyState) {
    let b = blockInfo, g = gridInfo;

    createGrid(g.grid, g.rows, g.cols);
    placeBlockDefaultPos(b, g);
    enableCtrls(b, g, keyState);
    gameLoop(blockInfo, gridInfo, keyState);
}

executeGame(blockInfo, gridInfo, keyState);