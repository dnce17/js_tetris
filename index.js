import { blockTypes, clockwiseKickData} from "./blocks_n_kicks.js"
import { createEleWithCls, deepCopy } from "./helpers.js"

const gridInfo = {
    rows: 15,
    cols: 10,
    // rows: 9,
    // cols: 10,
    fillerRows: 1,
    // grid: [
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    // ],
    grid: [],
    // Test grid for T-spin
    // grid: [
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    //     [0, 0, 0, 1, 0, 1, 1, 0, 0, 0],
    //     [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    //     [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    //     [0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    //     [0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    // ],

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

    // TEST USE for implementing rotation collision
    // typeName: "I",
    // currentType: blockTypes()["I"],

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

// SECTION: Rotation Collision
function rotateBlock() {
    // Save in case all kicks fail; block will revert back
    let unrotatedBlockPos = deepCopy(blockInfo.currentPos);
    let oldRotationIndex = deepCopy(blockInfo.rotationIndex);

    updateRotationIndex(blockInfo);
    let rotatedBlock = blockInfo.currentType[blockInfo.rotationIndex];
    let rotatedBlockPos = [];

    // Remove current block from grid (board unaffected) for testing
    removeOldBlock(blockInfo.currentPos, gridInfo.grid);

    // NOT NEEDED, but helps with testing visually
    updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);

    // Checks 1 px of block at a time and if occupied by grid already
    let failed = false;

    // CONSIDER: THIS LOOP IS REUSED A LOT
    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = blockInfo.topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = blockInfo.topLeftCoor["x"] + col;
            // Save all rotated block's coors first before possible kick test
            if (rotatedBlock[row][col] != 0) {
                saveCoorToArr(rotatedBlockPos, blockX, blockY);
            }
        }
    }

    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = blockInfo.topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = blockInfo.topLeftCoor["x"] + col;

            // ISSUE: blockX + blockY can go out of bound b/c blocks use 4x4
            // SOLUTION below: Prevents checking blockX + blockY if they are beyond wall since can cause error
            if (blockY < gridInfo.rows &&  blockX < gridInfo.cols) {
                // console.log(`gridInfo ${blockX}, ${blockY}`);

                let beyondWall = checkBeyondWall(rotatedBlock, blockInfo.topLeftCoor);
                // Check collision w/ BLOCK
                let rotationCollision = checkRotationCollision(gridInfo.grid[blockY][blockX], rotatedBlock[row][col]);

                if (beyondWall == true || rotationCollision == true) {
                    console.log(`beyondWall: ${beyondWall}, rotationCollision: ${rotationCollision}`);
                    console.log(deepCopy(gridInfo.grid));
                    console.log("----Initial rotation failed----");
                    console.log(`ISSUE: ${blockX}, ${blockY}`);
                    failed = true;

                    // Start kick test
                    let checkKicks = testKicks(blockInfo.rotationIndex, blockInfo.topLeftCoor, rotatedBlockPos, gridInfo.grid);
                    if (checkKicks == true) {
                        finalizeRotation(rotatedBlock);
                        updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
                        placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);
                        return true;
                    }
                    else {
                        console.log("no kicks work; don't allow rotation");

                        // Reset to before rotation was done
                        blockInfo.rotationIndex = oldRotationIndex;
                        blockInfo.currentPos = unrotatedBlockPos;

                        // Place block pos on grid, then update board
                        finalizeRotation(blockInfo.currentType[blockInfo.rotationIndex]);
                        updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
                        placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);

                        return false;
                    }
                }
                // else {
                //     console.log("This particular px has no overlap with grid cell");
                // }
            }
            // else {
            //     console.log("BEYOND WALL: ${blockX}, ${blockY}");
            // }  
        }
    }

    // Initial rotation is successful
    if (failed == false) {
        console.log("no beyond wall or rotation collision");
        finalizeRotation(rotatedBlock);
        updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
        placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);
    }
}


function updateRotationIndex(blockInfo) {
    if (blockInfo.rotationIndex < blockInfo.currentType.length - 1) {
        blockInfo.rotationIndex += 1;
    }
    else {
        blockInfo.rotationIndex = 0;
    }
}

function checkRotationCollision(cell, rotatedBlockPx) {
    // Check collision w/ BLOCK
    if (rotatedBlockPx != 0 && cell != 0) {
        return true;
    } 
    return false;
}

function checkBeyondWall(rotatedBlock, topLeftCoor) {
    // console.log(rotatedBlock);
    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = topLeftCoor["x"] + col;

            // TEST: Only check coor if px is 1
            // No pt in checking if a non-block px is out of bound
            if (rotatedBlock[row][col] != 0) {
                // console.log(`BEYOND WALL: ${blockX}, ${blockY}`);
                if (blockY > gridInfo.rows - 1 || blockX >= gridInfo.cols || blockX < 0) {
                    console.log(`----BEYOND WALL: X: ${blockX}, Col: ${gridInfo.cols}`);
                    return true;
                }
            }

            // console.log(`BEYOND WALL: ${blockX}, ${blockY}`);
            // if (blockY > gridInfo.rows - 1 || blockX >= gridInfo.cols || blockX < 0) {
            //     console.log(`----BEYOND WALL: X: ${blockX}, Col: ${gridInfo.cols}`);
            //     return true;
            // }
        }   
    }

    return false;
}

function finalizeRotation(rotatedBlock) {
    blockInfo.currentPos = [];

    for (let row = 0; row < rotatedBlock.length; row++) {
        let blockY = blockInfo.topLeftCoor["y"] + row;
        for (let col = 0; col < rotatedBlock[row].length; col++) {
            let blockX = blockInfo.topLeftCoor["x"] + col;
            // console.log(blockX, blockY);

            if (row == 0 && col == 0) {
                blockInfo.topLeftCoor = {"x": blockX, "y": blockY};
            }

            // Only place non-zero values
            if (rotatedBlock[row][col] !== 0) { 
                gridInfo.grid[blockY][blockX] = blockInfo.typeName;
                saveCoorToArr(blockInfo.currentPos, blockX, blockY);
            }   
        }   
    }
}

function testKicks(index, topLeftCoor, pos, grid) {
    let data = null;
    if (blockInfo.typeName == "I") {
        console.log("I kick being used");
        data = clockwiseKickData().clockwiseI;
    }
    else {
        console.log("STANDARD Kick being used");
        data = clockwiseKickData().clockwiseStd;
    }

    for (let offset of data[index]) {
        console.log(`Offset being test: ${offset}`);
        // Shift coors of rotatedBlockPos to test kicks
        for (let [i, coor] of pos.entries()) {
            let kickX = coor.x + offset[0]; 
            let kickY = coor.y + offset[1];

            // REMEMBER: this loop ONLY checks 1 px at a time
            // Test if kicks go beyond walls; rows - 1 to exclude invisible row from count
            if (kickY > gridInfo.rows - 1|| kickX >= gridInfo.cols || kickX < 0) {
                console.log(`BEYOND WALL - ${kickX}, ${kickY}`);
                break;
            }

            // Test if new grid cell after kick overlaps with new coor
            if (grid[kickY][kickX] != 0) {
                console.log(`OVERLAP - ${kickX}, ${kickY}`);
                // A single fail = this entire offset fails; go to next offset
                break;
            }
            // else {
            //     console.log(`No overlap -> ${kickX}, ${kickY}`);
            // }

            // If no overlaps at all after looping all coor of pos
            if (i == pos.length - 1) {
                // TEST: Treat -1 as 3
                console.log(`Index ${index - 1} --> ${index}`)
                console.log(`${offset} works; kick success`);

                // Only update this topLeftCoor once a kick works
                // b/c that's when we actually need to put it on grid + board
                topLeftCoor.x += offset[0];
                topLeftCoor.y += offset[1];

                return true;
            }
        }

        console.log("-----");
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
function getBlock(bag) {
    let val = Math.floor(Math.random() * bag.length);
    let block = bag[val];

    blockInfo.typeName = block;
    blockInfo.currentType = blockTypes()[block];

    // console.log(blockInfo.typeName);

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
    // Reset blockPos, create block type, & rotationIndex to 0
    blockInfo.currentPos = [];
    blockInfo.block = getBlock(blockInfo.bag);
    blockInfo.rotationIndex = 0;

    // console.log(gridInfo.grid);
    // console.log(blockInfo.block);
    // console.log(blockInfo.typeName);
    // console.log(blockInfo.currentType);


    // TEST USE when implementing rotation collision
    // blockInfo.block = blockInfo.currentType[blockInfo.rotationIndex];

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
                gridInfo.grid[blockY][blockX] = blockInfo.typeName;
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
        grid[coor.y][coor.x] = blockInfo.typeName;
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

// // REUSED more than once
function updatePieceCoors(pos, topLeftCoor, grid, direction, ghost=false) {
    let updatedTopLeftCoors = false;    // Tracks top left coor for rotation use

    for (let coor of pos) {
        updateCoor(coor, direction);
        
        // FUTURE: Maybe this should be its own function in future
        // Ghost is only reflected on DOM, not grid
        if (ghost == false) {
            grid[coor.y][coor.x] = blockInfo.typeName;

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
        cell.classList.add("ghost", blockInfo.typeName);
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
        if (direction == "right" && grid[coor.y][coor.x + 1] != 0) {
            // console.log("right collision");
            return true;
        }

        if (direction == "left" && grid[coor.y][coor.x - 1] != 0) {
            // console.log("left collision");
            return true;
        }

        if (direction == "down" && grid[coor.y + 1][coor.x] != 0) {
            // console.log("down collision");
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
    // Keep the non-full lines
    let clearedGrid = gridInfo.grid.filter(row => !row.every(item => typeof item === 'string'));

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
            gridInfo.lastAutoDropTime = Date.now();
            gridInfo.counter = 0;
        }

        // TEST: rotateBlock will ultimately use Up key
        // if (e.key == "r") {
        //     rotateBlock();
        // }

        if (e.key == "ArrowUp") {
            rotateBlock();

            if (checkCollision(blockInfo.currentPos, gridInfo.rows, gridInfo.cols, gridInfo.grid, "down") == true) {
                console.log("timer reset b/c bottom obstacle");
                if (gridInfo.counter < gridInfo.maxCounter) {
                    console.log(`Counter: ${gridInfo.counter}`);

                    gridInfo.counter += 1;
                }
                else {
                    console.log("Counter reset");

                    placeBlock(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.grid);
                    gridInfo.lastAutoDropTime = Date.now();
                    gridInfo.counter = 0;
                }

                gridInfo.lastAutoDropTime = Date.now();
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

// UNDER TESTING
function gameLoop() {
    const now = Date.now();
    
    // Get user input direction, can be "down", "left", "right", or null
    let direction = getDirection();

    // Handle auto-drop if enough time has passed
    if (now - gridInfo.lastAutoDropTime >= gridInfo.dropInterval) {
        direction = "down"; // Force auto-drop down if enough time has passed
        
        // Check if the block collides after auto-drop
        let collision = checkCollision(deepCopy(blockInfo.currentPos), gridInfo.rows, gridInfo.cols, gridInfo.grid, direction);
        if (collision) {
            placeBlock(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.grid);
            gridInfo.lastAutoDropTime = now;  // Reset drop timer after auto drop
            gridInfo.counter = 0;

            setTimeout(gameLoop, 42);
            return;
        } 
        else {
            gridInfo.lastAutoDropTime = now;  // Reset timer after moving down automatically
        }
    }

    // Handle manual movement
    if (direction != null) {
        if (direction === "down") {
            // Manual down movement
            let collision = checkCollision(blockInfo.currentPos, gridInfo.rows, gridInfo.cols, gridInfo.grid, direction);
            if (collision == false) {
                // Move the block down
                removeOldBlock(blockInfo.currentPos, gridInfo.grid);
                updatePieceCoors(blockInfo.currentPos, blockInfo.topLeftCoor, gridInfo.grid, direction);
                updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
                placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);
                gridInfo.lastAutoDropTime = now;  // Reset the auto-drop timer after manual drop
            } 
        } 
        else {
            const now = Date.now();

            if (now - gridInfo.lastMoveTime > 42) {
                console.log("X ms has passed; allow move");
                // Handle left/right movement
                if (checkCollision(blockInfo.currentPos, gridInfo.rows, gridInfo.cols, gridInfo.grid, direction) == false) {
                    removeOldBlock(blockInfo.currentPos, gridInfo.grid);
                    updatePieceCoors(blockInfo.currentPos, blockInfo.topLeftCoor, gridInfo.grid, direction);
                    updateBoard(gridInfo.grid, gridInfo.rows, gridInfo.fillerRows);
                    placeGhost(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.rows, gridInfo.cols);
                }

                // Reset timer if block is touching obstacle below it; Counter avoids timer
                // NOTE: This "down" direction if statement is added here instead of the direction == "down" if statement b/c 
                // the point is for the block to MOVE LEFT/RIGHT to allow more than 1 sec (aka when counter reaches 30) 
                // before auto placing, assuming there's an obstacle below it
                if (checkCollision(blockInfo.currentPos, gridInfo.rows, gridInfo.cols, gridInfo.grid, "down") == true) {
                    console.log("timer reset b/c bottom obstacle");
                    if (gridInfo.counter < gridInfo.maxCounter) {
                        gridInfo.counter += 1;
                    }
                    else {
                        console.log("Counter reset");

                        placeBlock(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.grid);
                        gridInfo.counter = 0;
                    }

                    gridInfo.lastAutoDropTime = now;
                }
            }

            gridInfo.lastMoveTime = now;
        }
    }

    setTimeout(gameLoop, 42);
}


function getDirection() {
    if (keyState["ArrowDown"] == true) {
        return "down";
    }    
    if (keyState["ArrowLeft"] == true) {
        return "left";
    }
    if (keyState["ArrowRight"] == true) {
        return "right";
    }

    // TEST USE ONLY
    // if (keyState["ArrowUp"] == true) {
    //     return "up";
    // }

    return null;
}

function executeGame() {
    createGrid(gridInfo.grid, gridInfo.rows, gridInfo.cols);
    placeBlockDefaultPos(blockInfo, gridInfo);
    enableCtrls();
    gameLoop();
}

executeGame();