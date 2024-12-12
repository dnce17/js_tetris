import { blockTypes, clockwiseKickData} from "./blocks_n_kicks.js"
import { createEleWithCls, deepCopy } from "./helpers.js"

const player = {
    lost: false,
    pause: false,
}

const gridInfo = {
    rows: 21,  // 21 b/c the 1st row is invisible to account for rotation at top of grid
    cols: 10,
    fillerRows: 1,
    grid: [],

    // Block State Properties
    dropInterval: 1000,  
    lastAutoDropTime: Date.now(),  // Track the time of the last drop
    pausedDropTimer: null,  // Saves how much time passed since last drop to ensure accurate auto drop after unpausing

    counter: 0, // Allows > 1 second to finalize block placement if obstacle is below and user moves left/right; max: 30
    maxCounter: 30,

    // Movement delay to avoid too quick block movement w/ arrow keys
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
    "ArrowDown": false,
    "ArrowLeft": false,
    "ArrowRight": false,
    " ": false
};

function adjustMsgVisibility(text, toggle=true, cls="hidden") {
    let msg = document.querySelector(".msg");

    if (toggle == true) {
        msg.classList.toggle(cls);
    }
    else {
        // Prevents flashing msg if this func used in game loops
        if (msg.classList.contains(cls) == true) {
            msg.classList.remove(cls);
        }
    }

    msg.innerText = text;
}

// SECTION: Grid (dynamically made)
function createGrid(grid, totalRows, totalCols) {
    grid.length = 0;

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
    let data = getClockWiseKickData(b.typeName);

    for (let offset of data[b.rotationIndex]) {
        // Shift coors of rotatedBlockPos to test kicks
        for (let [i, coor] of pos.entries()) {
            let kickX = coor.x + offset[0]; 
            let kickY = coor.y + offset[1];

            // REMEMBER: This loop ONLY checks 1 PX at a time
            if (checkKickValidity(kickX, kickY, g.rows, g.cols, g.grid) == true) {
                break;
            }

            // Goes here if at last loop --> no overlaps at all after looping all coor of pos
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

function getClockWiseKickData(typeName) {
    return typeName == "I" ? clockwiseKickData().clockwiseI : clockwiseKickData().clockwiseStd;
}

function checkKickValidity(kickX, kickY, totalRow, totalCols, grid) {
    // Test if kicked block go beyond walls; rows - 1 to exclude invisible top row from count
    if (kickY > totalRow - 1|| kickX >= totalCols || kickX < 0) {
        return true;
    }

    // Test if kicked block overlaps with set blocks' coor
    if (grid[kickY][kickX] != 0) {
        return true;  // A single fail = this entire offset fails; go to next offset
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

function createBoard(board, grid, totalRows, totalFillerRows) {
    // Create board cell + px 
    for (let row = 0; row < totalRows; row++) {
        let rowDiv = createRowsEle(row, totalFillerRows);

        for (let col of grid[row]) {
            let newCol = createColsEle(col);
            rowDiv.appendChild(newCol);
        }

        board.appendChild(rowDiv);
    }

    // TEST USE
    // addGridLabels();
}

function createRowsEle(currentRowIndex, totalFillerRows) {
    // Create filler row
    if (currentRowIndex < totalFillerRows) {
        return createEleWithCls("div", ["row", "hidden"]);
    } 
    else {
        return createEleWithCls("div", ["row"]);
    }
}

function createColsEle(colIndex) {
    if (colIndex == 0) {
        return createEleWithCls("div", ["cell"]);
    }
    else {
        return createEleWithCls("div", ["cell", "px", colIndex]);
    }
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

    for (let row = 0; row < b.block.length; row++) {
        let blockY = b.defaultPos["y"] + row;
        for (let col = 0; col < b.block[row].length; col++) {
            let blockX = b.defaultPos["x"] + col;

            // Save the top-left coor for rotation purposes
            if (row == 0 && col == 0) {
                b.topLeftCoor = {"x": blockX, "y": blockY};
            }

            // Only place non-zero values
            if (b.block[row][col] !== 0) { 
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

    // Saved to compare against defaultPos to check losing condition
    let placedCoors = [];

    // Place block based on ghostPos
    for (let coor of ghostPos) {
        grid[coor.y][coor.x] = typeName;
        placedCoors.push({"x": coor.x, "y": coor.y});
    }

    // New block appears
    clearLine(gridInfo);
    placeBlockDefaultPos(blockInfo, gridInfo);

    // Check if default block overlap with any set block. If so, player LOSE
    if (checkLose(placedCoors, blockInfo, player) == true) {
        player.lost = true;
    }
}

function checkLose(placedCoors, blockInfo) {
    let b = blockInfo;

    for (let row = 0; row < b.block.length; row++) {
        let blockY = b.defaultPos["y"] + row;
        for (let col = 0; col < b.block[row].length; col++) {
            let blockX = b.defaultPos["x"] + col;

            // Only check non-zero values
            if (b.block[row][col] != 0) { 
                for (let coor of placedCoors) {
                    if (coor.x == blockX && coor.y == blockY) {
                        // Player loses
                        // console.log(`Overlap ghost + px: ${coor.x}, ${coor.y}`)
                        return true;
                    }
                }
            }
        }
    }

    return false;
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

    b.ghostPos = [];    // Reset ghostPos
    deepCopy(b.currentPos).forEach(coor => b.ghostPos.push(coor));

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
        // E.g. a block that has at least 1 px in each row will have 3 outermost x
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
    let lookupTableForReduce = {
        "y-right": (coorAcc, coorObj) => coorObj.x > coorAcc.x ? coorObj : coorAcc,
        "y-left": (coorAcc, coorObj) => coorObj.x < coorAcc.x ? coorObj : coorAcc,
        "x-down": (coorAcc, coorObj) => coorObj.y > coorAcc.y ? coorObj : coorAcc
    }

    let key = `${axis}-${direction}`;
    if (key in lookupTableForReduce) {
        return Object.keys(groupedAxisDict).map(axisArg => {
            return groupedAxisDict[axisArg].reduce(lookupTableForReduce[key]);
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

// SECTION: Moving block
function enableCtrls(blockInfo, gridInfo, keyState, player) {
    let b = blockInfo, g = gridInfo, p = player;
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];
    let startBtn = document.querySelector(".start-btn");
    let restartBtn = document.querySelector(".restart-btn");

    window.addEventListener("keydown", function(e) {
        if (p.lost == false) {
            if (e.key == "p") {
    
                // Pause
                if (p.pause == false) {
                    // Save how much time has passed since the last drop
                    g.pausedDropTimer = Date.now() - g.lastAutoDropTime;
                    p.pause = true;

                    adjustMsgVisibility("Paused");
                }
                // Unpause
                else {
                    // Adjust lastAutoDropTime to remain the same prior to pausing
                    g.lastAutoDropTime = Date.now() - g.pausedDropTimer;
                    p.pause = false;
                    adjustMsgVisibility("");
                }
            }
    
            if (p.pause == false) {
                if (e.key == " ") {
                    placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
                    g.lastAutoDropTime = Date.now();
                    g.counter = 0;
                }
        
                if (e.key == "ArrowUp") {
                    rotateBlock(blockInfo, gridInfo);
        
                    // "true" = counter reached over limit and auto-place occurred
                    if (handleAutoPlaceCounter(b, g) == true) {
                        g.lastAutoDropTime = Date.now();
                    }
                }
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
    });

    startBtn.addEventListener("click", () => {
        executeGame(blockInfo, gridInfo, keyState, player);
        startBtn.blur();
        startBtn.disabled = true;
    });

    restartBtn.addEventListener("click", () => {
        restartGame(b, g, p);
        restartBtn.blur();
    });
}

function gameLoop(blockInfo, gridInfo, keyState, player) {
    let b = blockInfo, g = gridInfo, p = player;
    if (p.pause == false && p.lost == false) {
        let now = Date.now();
        
        // Get user input direction, can be "down", "left", "right", or null
        let direction = getDirection(keyState);
    
        // Handle auto drop movement if enough time has passed
        let autoDropResult = handleAutoDrop(b, g, direction, now);
        if (autoDropResult.result.toLowerCase() == "auto_placed") {
            return "exit gameLoop";
        }
    
        direction = autoDropResult.updatedDirection;
    
        // Handle manual or auto movement
        handleMovement(b, g, now, direction);
    }
    else {
        if (p.lost == true) {
            adjustMsgVisibility("Game Over", false);
        }
    }

    // console.log("LOOP GOING");
    setTimeout(gameLoop, 42, b, g, keyState, player);
}

function adjustCounter(gridInfo) {
    let g = gridInfo;

    if (g.counter < g.maxCounter) {
        g.counter += 1;
    }
    else {
        g.counter = 0;
    }

    // console.log(g.counter);
    return g.counter;
}

function handleAutoDrop(blockInfo, gridInfo, direction, now) {
    let b = blockInfo, g = gridInfo;

    // Handle auto drop movement if enough time has passed
    if (now - g.lastAutoDropTime >= g.dropInterval) {
        direction = "down"; // To force auto-drop down if enough time has passed
        
        // Check if the block collides after auto-drop
        let collision = checkCollision(deepCopy(b.currentPos), g.rows, g.cols, g.grid, direction);
        if (collision) {
            placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
            g.lastAutoDropTime = now;  // Reset drop timer after auto drop
            g.counter = 0;

            setTimeout(gameLoop, 42, b, g, keyState, player);
            return {result: "auto_placed", updatedDirection: direction};
        } 
        else {
            g.lastAutoDropTime = now;  // Reset timer after moving down automatically
        }
    }

    return {result: "not_auto_placed", updatedDirection: direction};
}

function handleMovement(blockInfo, gridInfo, now, direction = null) {
    let b = blockInfo, g = gridInfo;
    if (direction != null) {
        if (direction === "down") {
            // Handle down movement
            processMovement(b, g, direction, now);
        } 
        else {
            if (now - g.lastMoveTime > 42) {
                // Handle left/right movement
                processMovement(b, g, direction, now);

                // Reset timer if block is touching obstacle below it; Counter avoids timer
                // NOTE: This "down" direction if statement is added here instead of the direction == "down" if statement b/c 
                // the point is for the block to MOVE LEFT/RIGHT to allow more than 1 sec (aka when counter reaches 30) 
                // before auto placing, assuming there's an obstacle below it
                if (handleAutoPlaceCounter(b, g) == true) {
                    g.lastAutoDropTime = Date.now();
                }
            }

            g.lastMoveTime = now;
        }
    }
}

// AKA user uses arrow keys
function processMovement(blockInfo, gridInfo, direction, dateNow) {
    let b = blockInfo, g = gridInfo;
    let collision = checkCollision(b.currentPos, g.rows, g.cols, g.grid, direction);

    if (collision == false) {
        removeOldBlock(b.currentPos, g.grid);
        updatePieceCoors(b.currentPos, b.typeName, b.topLeftCoor, g.grid, direction);
        updateBoard(g.grid, g.rows, g.fillerRows);
        placeGhost(b, g, "down");

        // Reset auto-drop timer after manual/auto drop ONLY if going down
        if (direction == "down") {
            // Must reset only if collision == false
            // else block will not set indefinitely if user holds down arrow forever
            g.lastAutoDropTime = dateNow; 
        }
    } 
}

// Updates counter and places block if counter reaches max and resets to 0
function handleAutoPlaceCounter(blockInfo, gridInfo) {
    let b = blockInfo, g = gridInfo;
    if (checkCollision(b.currentPos, g.rows, g.cols, g.grid, "down") == true) {
        if (adjustCounter(g) == 0) {
            placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
        }
        
        // Placed here and not inside the above if statement b/c lastAutoDropTime
        // needs to reset regardless if counter becomes 0 or not
        return true;
    }

    return false;
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

function executeGame(blockInfo, gridInfo, keyState, player) {
    let b = blockInfo, g = gridInfo, p = player;

    placeBlockDefaultPos(b, g);
    gameLoop(b, g, keyState, p);
}

function restartGame(blockInfo, gridInfo, player) {
    let b = blockInfo, g = gridInfo, p = player;
    // Values that need resetting 
    resetVals(b, g, p);

    createGrid(g.grid, g.rows, g.cols);
    placeBlockDefaultPos(b, g);
    
}

function resetVals(blockInfo, gridInfo, player) {
    let b = blockInfo, g = gridInfo, p = player;
    p.lost = false;
    p.pause = false;  
    
    g.lastAutoDropTime = Date.now();
    g.counter = 0;

    b.bag = Object.keys(blockTypes());

    adjustMsgVisibility("");
}

function addToggleInstructionsEvt() {
    let ctrlsBtn = document.querySelector(".ctrls-btn");
    ctrlsBtn.addEventListener("click", () => {
        let ctrlsDetail = document.querySelector(".ctrls-detail-ctnr");

        ctrlsDetail.classList.toggle("hidden");
        if (ctrlsDetail.classList.contains("hidden")) {
            ctrlsBtn.innerText = "Show Controls";
        }
        else {
            ctrlsBtn.innerText = "Hide Controls";
        }
    });
}

addToggleInstructionsEvt();

// Show Board
createGrid(gridInfo.grid, gridInfo.rows, gridInfo.cols);
updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
enableCtrls(blockInfo, gridInfo, keyState, player);