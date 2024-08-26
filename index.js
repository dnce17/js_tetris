// TEST USE FUNCS 
// Create obstacles for block collision test
function closeCell(cellNumArr) {
    for (let i = 0; i < cellNumArr.length; i++) {
        let cell = document.querySelector(`.cell-${cellNumArr[i]}`);
        cell.classList.add("closed");
        // cell.style.backgroundColor = "green";
    }
}

function labelCoor(item, direction) {
    let testDirection = document.querySelector(".test-direction");
    testDirection.innerText = direction + " collision";

    for (const c of item.children) {
        let pos = c.getBoundingClientRect();
        if (c.classList.contains("filled") || c.classList.contains("cell")) {
            c.innerText = pos[direction];
            continue;
        }
    }
}

function createObstacle(start, end) {
    for (let i = start; i < end; i++) {
        closeCell([i]);
    }
}

// getBlockCoors + alignCoors used as test in place block section
function getBlockCoors(block) {
    let coors = {
        "x": [],
        "y": []
    }

    for (const px of block.children) {
        if (px.classList.contains("filled")) {
            let pxPos = px.getBoundingClientRect();

            // Unique identifies block coor (x, y)
            coors.x.push(pxPos.left);
            coors.y.push(pxPos.bottom);
        }
    }

    return coors;
}

function alignCoors(blockCoors, board) {
    for (const cell of board.children) {
        let cellPos = cell.getBoundingClientRect();
        for (let i = 0; i < blockCoors.x.length; i++) {
            // Check if CELL x, y == any BLOCK x,y
            if (cellPos.left == blockCoors.x[i] && cellPos.bottom == blockCoors.y[i]) {
                cell.classList.add("closed");
            }
        }
    }
}

// REUSABLES
function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element;
}

// TETRIS BLOCK INFO
const PX_WIDTH = 48;
const PX_HEIGHT = 48;
const PX_COUNT = 9; // Block is 3x3
// const BLOCK_BAG = ["Z", "S", "L", "O"];
const BLOCK_BAG = ["S"];
let keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};

// BOARD INFO
let TOTAL_COLUMN = 10;
let TOTAL_ROW = 15;

function createBoard() {
    let board = document.querySelector(".board");
    let totalCells = TOTAL_COLUMN * TOTAL_ROW;

    for (let i = 0; i < totalCells; i++) {
        let cell = createEleWithCls("div", ["cell", "cell-" + i]);
        board.appendChild(cell);
    }
}

// SECTION: Create randomized block + ghost
function blockTypes() {
    let blocks = {
        "Z": [
           [1, 1, 0,
            0, 1, 1,
            0, 0, 0],
           [0, 0, 1,
            0, 1, 1,
            0, 1, 0],
        ],
        "S": [
            [0, 1, 1,
             1, 1, 0,
             0, 0, 0],
            [1, 0, 0,
             1, 1, 0,
             0, 1, 0],
        ],
        "L": [
            [0, 1, 0,
             0, 1, 0,
             0, 1, 1],
            [0, 0, 0,
             1, 1, 1,
             1, 0, 0],
            [1, 1, 0,
             0, 1, 0,
             0, 1, 0],
            [0, 0, 1,
             1, 1, 1,
             0, 0, 0],
        ],
        "O": [
            [1, 1, 0,
             1, 1, 0,
             0, 0, 0],
        ]
    }

    return blocks
}

function getRandomBlock(bag) {
    let strucData = blockTypes();
    let val = Math.floor(Math.random() * bag.length);

    let block = bag[val];
    let defaultBlock = strucData[block][0]  // Default = non-rotated block

    return defaultBlock
}

function createPiece(ghostStatus=false) {
    let tetrisGame = document.querySelector(".tetris-game");
    let pieceCtnr = createEleWithCls("div", ghostStatus ? ["ghost"] : ["block"]);

    tetrisGame.prepend(pieceCtnr);
    let block = getRandomBlock(BLOCK_BAG);

    for (let i = 0; i < block.length; i++) {
        let px = block[i] == 0 ? createEleWithCls("div", ["px"]) : createEleWithCls("div", ["px", "filled"]);
        pieceCtnr.appendChild(px);
    }
}

function setGhostPos(blockXPos) {
    let ghost = document.querySelector(".ghost");
    let block = document.querySelector(".block");    

    ghost.style.top = block.style.top;
    ghost.style.left = blockXPos;
    processGhostPos(ghost);
}

function processGhostPos(ghost) {
    while (true) {
        if (checkCollision("bottom", true) == false) {
            ghost.style.top = `${ghost.offsetTop + PX_HEIGHT}px`;
        }
        else {
            break;
        }
    }
}

// CLEANUP CP
// SECTION: game controls
function activateDropCtrls() {
    placeBlock();
    clearFullLines();
    createPiece(true);
    createPiece();
    setGhostPos();
}

function addCtrls() {
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];

    window.addEventListener("keydown", function(e) {
        if (e.key == " ") {
            activateDropCtrls();
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

// CODE CLEAN UP for this will be done after all features are done
function gameLoop() {
    let block = document.querySelector(".block");
    let ghost = document.querySelector(".ghost");
    
    if (keyState["ArrowDown"] == true) {
        if (checkCollision("bottom") == false) {
            block.style.top = `${block.offsetTop + PX_HEIGHT}px`;
            // ghost.style.top = `${ghost.offsetTop + PX_HEIGHT}px`;
        }
    }    
    if (keyState["ArrowLeft"] == true) {
        if (checkCollision("left") == false) {
            block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
            setGhostPos(block.style.left);
            // ghost.style.left = `${ghost.offsetLeft - PX_WIDTH}px`;
        }
    }
    if (keyState["ArrowRight"] == true) {
        if (checkCollision("right") == false) {
            block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
            setGhostPos(block.style.left);
            // ghost.style.left = `${ghost.offsetLeft + PX_WIDTH}px`;
        }
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        block.style.top = `${block.offsetTop - PX_HEIGHT}px`;
        // ghost.style.top = `${ghost.offsetTop - PX_HEIGHT}px`;
    }

    let direction = "left"
    labelCoor(block, direction);

    // Add this IF you want to update the board coor everytime you resize window, but it slows block movement a LOT
    // let board = document.querySelector(".board");
    // labelCoor(board, direction);
    // ------TEST USE END--------


    // Controls speed that block moves
    setTimeout(gameLoop, 30);
} 

// SECTION: Block collision detection
let nextBlockCoors = {
    // NOTE: (x, y) uniquely define cell; x itself will define a col rather than 1 cell
    "left": {
        "x": [],
        "y": []
    },
    "right": {
        "x": [],
        "y": []
    },
    "bottom": {
        "x": [],
        "y": []
    },
}

// Retrieves coors of cells that block will move into, based on the direction.
function storeTargetCoors(coorStorage, block, board, direction) {
    for (const px of block.children) {
        if (px.classList.contains("filled")) {
            // Save coors of px client rect left/right/bottom (depending on direction) + 24 in storage to get nextStorageCoor
            let pxPos = px.getBoundingClientRect();
            processCoorStorage(coorStorage, pxPos, direction);
        }
    }
}

function processCoorStorage(coorStorage, pxPos, direction) {
    switch (direction) {
        case "left":
            coorStorage.left.x.push(pxPos.left - PX_WIDTH);
            coorStorage.left.y.push(pxPos.bottom);
            break;
        case "right":
            coorStorage.right.x.push(pxPos.right + PX_WIDTH);
            coorStorage.right.y.push(pxPos.bottom);
            break;

        // Different from left/right
        case "bottom":
            coorStorage.bottom.y.push(pxPos.bottom + PX_HEIGHT);
            coorStorage.bottom.x.push(pxPos.left);
            break;
    }
}



function checkObstacle(coorStorage, board, direction) {
    let wallObstacle = checkWall(coorStorage, board, direction);
    let blockObstacle = checkBlockObstacle(coorStorage, board, direction);

    // Check collision w/ wall & already placed blocks
    if (wallObstacle == true || blockObstacle == true) {
        return true;
    }

    return false;
}

function checkWall(coorStorage, board, direction) {
    let wallCoor = getWallCoor(board, direction);
    let axis = getAxis(direction);    

    for (const coor of coorStorage[direction][axis]) {
        switch (direction) {
            case "left":
                if (coor < wallCoor) {
                    return true;
                }
                break;
            case "right":
            case "bottom":
                if (coor > wallCoor) {
                    return true;
                }
                break;
        }
    }

    return false;
}

function getWallCoor(board, direction) {
    // Outermost cell that's nearest to wall
    let cell;

    switch (direction) {
        case "left":
            cell = board.children[0];
            break;
        case "right":
            cell = board.children[9];
            break;
        case "bottom":
            cell = board.children[board.children.length - 1];
            break;
    }

    return cell.getBoundingClientRect()[direction];
}

function getAxis(direction) {
    if (direction == "left" || direction == "right") {
        return "x";
    }
    else {
        return "y";
    }
}

function checkBlockObstacle(coorStorage, board, direction) {
    for (const cell of board.children) {
        let cellPos = cell.getBoundingClientRect();

        // Cycle through nextBlockCoors'left/right/bottom
        let coorDict = coorStorage[direction];
        // x, y both have same length; doesn't matter which used
        for (let i = 0; i < coorDict["x"].length; i++) {
            let x = coorDict["x"][i];
            let y = coorDict["y"][i];
            
            if (direction == "left" || direction == "right") {
                if (x == cellPos[direction] && y == cellPos.bottom) {
                    if (cell.classList.contains("closed")) {
                        return true;
                    }
                }
            }

            if (direction == "bottom") {
                // Diff is y == cellPos[direction], not x
                if (y == cellPos[direction] && x == cellPos.left) {
                    if (cell.classList.contains("closed")) {
                        return true;
                    }
                }
            }

        }
    }

    return false;
}

function resetCoors(coorStorage) {
    for (let key in coorStorage) {
        coorStorage[key] = {
            "x": [],
            "y": []
        };
    }
}

// Checks collision for both block & ghost piece
function checkCollision(direction, ghost=false) {
    let board = document.querySelector(".board");
    let block;

    if (ghost == false) {
        block = document.querySelector(".block");
    }
    else {
        block = document.querySelector(".ghost");
    }

    storeTargetCoors(nextBlockCoors, block, board, direction);
    let hasObstacle = checkObstacle(nextBlockCoors, board, direction);
    resetCoors(nextBlockCoors);

    if (hasObstacle) {
        return true;
    }
    
    return false;
}

// SECTION: Place block
function placeBlock() {
    let block = document.querySelector(".block");
    let ghost = document.querySelector(".ghost");
    let board = document.querySelector(".board");

    // TEST USE: lets you place block anywhere, not just where ghost is
    // let blockCoors = getBlockCoors(block);
    // alignCoors(blockCoors, board);

    // Engrave the block to board itself
    matchBlockToGhost(board, ghost);

    block.remove();    
    ghost.remove();
}

function matchBlockToGhost(board, ghost) {
    // Place block where ghost is
    for (let px of ghost.children) {
        if (px.classList.contains("filled")) {
            let pxPos = px.getBoundingClientRect();
            for (let cell of board.children) {
                let cellPos = cell.getBoundingClientRect();

                if (pxPos.left == cellPos.left && pxPos.bottom == cellPos.bottom) {
                    cell.classList.add("closed");
                }
            }      
        }
    }
}

// SECTION: Clear line
function clearFullLines() {
    let board = document.querySelector(".board");
    let rowEndIndex = TOTAL_COLUMN * TOTAL_ROW - 1;
    let rowInfo = {
        "isFull": [],
        "range": []
    }

    // Cycles from last row up (since lines will generally be at bottom)
    for (let row = TOTAL_ROW; row > 0; row--) {
        let rowStartEnd = getRow(rowEndIndex);

        // Tracks if each row is full line & clears row if full line
        if (checkFullLine(board, rowStartEnd) == false) {
            rowInfo.isFull.push(false);
        }
        else {
            processLineClear(board, rowStartEnd);
            rowInfo.isFull.push(true);
        }

        // Track each row's index range
        rowInfo.range.push(
            {
                "start": rowStartEnd.start, 
                "end": rowStartEnd.end
            }
        );
        
        // Goes to next row's end index
        rowEndIndex -= TOTAL_COLUMN;
    }

    // Move all blocks down after line clear
    descendBlocks(rowInfo);
}

function getRow(lastIndex) {
    let rowStartEnd = {
        "start": lastIndex - TOTAL_COLUMN + 1,
        "end": lastIndex + 1    // not inclusive b/c for loop use
    }

    return rowStartEnd;
}

function checkFullLine(board, row) {
    for (let i = row.start; i < row.end; i++) {
        // Any cell in a row with no "closed" class == row not full line
        if (!board.children[i].classList.contains("closed")) {
            return false;
        }
    }

    return true;
}

function processLineClear(board, row) {
    for (let i = row.start; i < row.end; i++) {
        board.children[i].classList.remove("closed");
        board.children[i].classList.add("cleared");
    }
}

function descendBlocks(row) {
    // PROCESS: is done piecewise; the rows b/w two cleared sections will descend first, then the next

    // NOTE:
        // 2 cleared lines means the 1st section of "not full" rows will go down x2.
        // BUT that means the next "not full" row section goes down (amt of lines cleared just below) + (amt of lines cleared below the prior block sections)
    //

    let consecutiveClears = 0;
    let notFullRows = [];

    // Only descends row sections that had full/cleared lines above and below it
    for (let i = 0; i < row.isFull.length; i++) {
        let fullStatus = row.isFull[i];
        if (fullStatus == true) {
            if (notFullRows.length > 0) {
                processDescendBlocks(notFullRows, consecutiveClears);
                consecutiveClears += 1;
                
                // Reset b/c initial row section descension is now complete b/w two cleared sections
                notFullRows = [];
            }
            else {
                consecutiveClears += 1;
            }

        }
        else {
            notFullRows.push(row.range[i]);
        }
    }

    // Descends topmost row section that had no full/cleared lines above it
    processDescendBlocks(notFullRows, consecutiveClears);
}

function processDescendBlocks(rowsToDescend, consecutiveClears) {
    let board = document.querySelector(".board");
    for (const row of rowsToDescend) {
        for (let i = row.start; i < row.end; i++) {
            if (board.children[i].classList.contains("closed")) {
                board.children[i].classList.remove("closed");
                // Calculate new block's position
                board.children[i + (10 * consecutiveClears)].classList.add("closed");
            }
        }
    }
}

function main() {
    createBoard();
    // closeCell([26, 30, 18, 46]);

    // for (let i = 141; i < 151; i++) {
    //     closeCell([i]);
    // }

    // createObstacle(30, 39);
    // createObstacle(48, 60);

    // createObstacle(62, 64);

    createObstacle(66, 79);
    createObstacle(80, 100);
    createObstacle(104, 119);
    createObstacle(122, 129);
    createObstacle(130, 150);


    // These need to reused inside other functions, but is here as test
    createPiece(true);
    createPiece();
    setGhostPos();

    // Other Test
    let block = document.querySelector(".block");
    let board = document.querySelector(".board");
    let direction = "left";
    labelCoor(board, direction);
    labelCoor(block, direction);

    // placeBlock(); 
    // clearFullLines();

    // storeTargetCoors(nextBlockCoors, block, board, direction);
    // checkObstacle(nextBlockCoors, board, direction);
    // checkCollision(direction);
    // ---

    addCtrls();
    gameLoop();

    let cellNum = 3;
    let cell = document.querySelector(`.cell-${cellNum}`);
    // console.log(`Cell ${cellNum} Left Coor: ${cell.getBoundingClientRect().right}`);

    for (let i = 0; i < PX_COUNT; i++) {
        let px = document.querySelectorAll(".px");
        let pos = px[i].getBoundingClientRect();
        // if (i == 1) {
        //     console.log(`Block px 4 Left Coor: ${pos.left}`);
        // }
    }
}

main();