// TEST USE: Create obstacles for block collision test
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

// REUSABLE
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
// const BLOCK_BAG = ["Z", "S", "L"];
const BLOCK_BAG = ["L"];
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
    // let totalColumn = 10;
    // let totalRow = 15;
    // let totalCells = totalColumn * totalRow;

    let totalCells = TOTAL_COLUMN * TOTAL_ROW;

    for (let i = 0; i < totalCells; i++) {
        cell = createEleWithCls("div", ["cell", "cell-" + i]);
        board.appendChild(cell);
    }
}

// SECTION: Create randomized block
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

function randomizeBag(bag, totalBlockCount) {
    val = Math.floor(Math.random() * totalBlockCount);
    block = bag[val];

    return block
}

function getBlockType(bag) {
    block = randomizeBag(bag, bag.length);
    blockPxInfo = blockTypes()[block];

    return blockPxInfo[0]
}

function createBlock(ghost=false) {
    let tetrisGame = document.querySelector(".tetris-game");
    let blockCtnr;

    if (ghost == false) {
        blockCtnr = createEleWithCls("div", ["block"]);
    }
    else {
        blockCtnr = createEleWithCls("div", ["block", "ghost"]);
    }

    tetrisGame.prepend(blockCtnr);
    defaultBlock = getBlockType(BLOCK_BAG);

    for (let i = 0; i < defaultBlock.length; i++) {
        let px = defaultBlock[i] == 0 ? createEleWithCls("div", ["px"]) : createEleWithCls("div", ["px", "filled"]);
        blockCtnr.appendChild(px);
    }
}

// SECTION: game controls
function addCtrls() {
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];

    window.addEventListener("keydown", function (e) {
        if (e.key == " ") {
            placeBlock();
            createBlock(true);
            createBlock();

            setGhostPos();
            
        }

        if (keys.includes(e.key)) {
            keyState[e.key] = true;
            // console.log(`keydown: ${e.key}, ${keyState[e.key]}`);

            // ADD LATER: addDropCtrl() not added to game loop b/c cause multiple new blocks to form instead of 1
        }
    }); 

    window.addEventListener("keyup", function(e) {
        if (keys.includes(e.key)) {
            keyState[e.key] = false;
            // console.log(`keyup: ${e.key}, ${keyState[e.key]}`);
        }
    })
}

function gameLoop() {
    let block = document.querySelector(".block");
    let ghost = document.querySelector(".ghost");
    
    if (keyState["ArrowDown"] == true) {
        // block.style.top = `${block.offsetTop + PX_HEIGHT}px`;

        if (collision("bottom") == false) {
            block.style.top = `${block.offsetTop + PX_HEIGHT}px`;
            // ghost.style.top = `${ghost.offsetTop + PX_HEIGHT}px`;
        }
    }    
    if (keyState["ArrowLeft"] == true) {
        // block.style.left = `${block.offsetLeft - PX_WIDTH}px`;

        if (collision("left") == false) {
            block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
            setGhostPos(block.style.left);
            // ghost.style.left = `${ghost.offsetLeft - PX_WIDTH}px`;
        }
    }
    if (keyState["ArrowRight"] == true) {
        // block.style.left = `${block.offsetLeft + PX_WIDTH}px`;

        if (collision("right") == false) {
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

    // Add this if you want to update the board coor everytime you resize window, but it slows block movement a LOT
    // let board = document.querySelector(".board");
    // labelCoor(board, direction);

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

function getNextBlockCoors(coorStorage, block, board, direction) {
    // For each px in block
    for (const px of block.children) {
        // If px has "filled" class
        if (px.classList.contains("filled")) {
            // Save the coor of px client rect left/right/bottom (depending on direction) + 24 in storage to get nextStorageCoor
            let pxPos = px.getBoundingClientRect();
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
    }

    let allCoor = []
    for (let i = 0; i < coorStorage[direction]["x"].length; i++) {
        allCoor.push(`(${coorStorage[direction]["x"][i]}, ${coorStorage[direction]["y"][i]})`);
    }
    // console.log(allCoor);
    // console.log(nextBlockCoors);
}

function checkWall(coorStorage, board, direction) {
    switch (direction) {
        case "left":
            let cellOne = board.children[0];
            let leftWallCoor = cellOne.getBoundingClientRect()[direction];
            console.log(leftWallCoor);
            // Cycle through the coorstorage left's x
            for (const coor of coorStorage[direction]["x"]) {
                // If any of them are less than cell 1's clientrect.left
                if (coor < leftWallCoor) {
                    // return true b/c there's a wall
                    return true;
                }
            }
            break;
        case "right":
            let cellTen = board.children[9];
            let rightWallCoor = cellTen.getBoundingClientRect()[direction];
            console.log(rightWallCoor);
            for (const coor of coorStorage[direction]["x"]) {
                if (coor > rightWallCoor) {
                    return true;
                }
            }
            break;
        case "bottom":
            let lastCell = board.children[board.children.length - 1];
            let bottomWallCoor = lastCell.getBoundingClientRect()[direction];
            // console.log(bottomWallCoor);
            for (const coor of coorStorage[direction]["y"]) {
                // console.log(coor);
                if (coor > bottomWallCoor) {
                    return true;
                }
            }
            break;
    }

    return false;
}

function checkObstacle(coorStorage, board, direction) {
    // Cycle through board
    let hasObstacle = false;
    if (checkWall(coorStorage, board, direction) == true) {
        return hasObstacle = true;
    }

    for (const cell of board.children) {
        // get cell's bounding rect
        let cellPos = cell.getBoundingClientRect();
        let coorDict = coorStorage[direction];
        // Cycle through nextBlockCoors left/right/bottom
        for (let i = 0; i < coorDict["x"].length; i++) {
            // if coor matches the cellPos's left/right/bottom x AND Y
            let x = coorDict["x"][i];
            let y = coorDict["y"][i];
            // console.log(direction + ": (" + x + "," + y + ")");
            if (direction == "left" || direction == "right") {
                if (x == cellPos[direction] && y == cellPos.bottom) {
                    console.log("MATCHED BELOW");
                    console.log(direction + ": (" + x + "," + y + ")");
                    // if cell has "closed" class
                    if (cell.classList.contains("closed")) {
                        console.log(cell);
                        hasObstacle = true;
                        return hasObstacle = true;
                    }
                }
            }

            if (direction == "bottom") {
                // Diff is y == cellPos[direction], not x
                if (y == cellPos[direction] && x == cellPos.left) {
                    // console.log("MATCHED BELOW");
                    // console.log(direction + ": (" + x + "," + y + ")");
                    if (cell.classList.contains("closed")) {
                        // console.log(cell);
                        hasObstacle = true;
                        // console.log(`bottom: ${hasObstacle}`);
                        return hasObstacle = true;
                    }
                }
            }
        }
    }

    return hasObstacle;
}

function resetCoors(coorStorage) {
    for (let key in coorStorage) {
        coorStorage[key] = {
            "x": [],
            "y": []
        };
    }
}

function collision(direction, ghost=false) {
    let block;
    if (ghost == false) {
        block = document.querySelector(".block");
    }
    else {
        block = document.querySelector(".ghost");
    }
    let board = document.querySelector(".board");

    getNextBlockCoors(nextBlockCoors, block, board, direction);
    let hasObstacle = checkObstacle(nextBlockCoors, board, direction);
    resetCoors(nextBlockCoors);

    if (hasObstacle) {
        console.log(hasObstacle);
        console.log("OBSTACLE IN WAY");

        return true;
    }
    
    return false
}

// SECTION: Place block
function getBlockCoors(block) {
    let coors = {
        "x": [],
        "y": []
    }

    for (const px of block.children) {
        if (px.classList.contains("filled")) {
            let pxPos = px.getBoundingClientRect();

            // Uses left to unique identify block coor, but any side could be used
            coors.x.push(pxPos.left);
            coors.y.push(pxPos.bottom);
        }
    }

    console.log(coors);
    return coors;
}

function alignCoors(blockCoors, board) {
    // Cycle through the board
    for (const cell of board.children) {
        // If cell x and y = any block coor x and y
        let cellPos = cell.getBoundingClientRect();
        for (let i = 0; i < blockCoors.x.length; i++) {
            console.log(blockCoors.x[i]);

            if (cellPos.left == blockCoors.x[i] && cellPos.bottom == blockCoors.y[i]) {
                cell.classList.add("closed");
                console.log("cell closed");
            }
        }
            // Give that cell a "closed" class
    // Del block since it's now engraved into the board 
    }
}

function placeBlock() {
    let block = document.querySelector(".block");
    let ghost = document.querySelector(".ghost");
    let board = document.querySelector(".board");

    let blockCoors = getBlockCoors(block);
    alignCoors(blockCoors, board);

    // Engrave the block to board itself
    block.remove();    
    ghost.remove();
}

// SECTION: Clear line
function getRow(lastIndex) {
    let rowStartEnd = {
        "start": lastIndex - TOTAL_COLUMN + 1,
        "end": lastIndex + 1    // not inclusive b/c for loop use
    }

    return rowStartEnd;
}

function checkFullLine(board, row) {
    for (let i = row.start; i < row.end; i++) {
        // One cell in row not having "closed" class = not a full line
        if (!board.children[i].classList.contains("closed")) {
            // console.log(board.children[i]);
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

function processDescendBlocks(rowsToDescend, consecutiveClears) {
    // console.log(rowsToDescend);
    
    let board = document.querySelector(".board");

    for (const row of rowsToDescend) {
        for (let i = row.start; i < row.end; i++) {
            // console.log(board.children[i]);
            if (board.children[i].classList.contains("closed")) {
                board.children[i].classList.remove("closed");
                board.children[i + (10 * consecutiveClears)].classList.add("closed");
            }
        }
    }
}

// CHECKPOINT
function descendBlocks(row) {
    // PROCESS: is done piecewise; the blocks b/w two cleared sections will descend first, then the next

    // NOTE:
        // 2 cleared lines --> the first block section will go down x2.
        // BUT that means the next block section goes down (amt of lines cleared right below) + (amt of cleared lines below prior block section)
    //

    let consecutiveClears = 0;
    let notFullRows = [];

    for (let i = 0; i < row.isFull.length; i++) {
        // console.log(row.isFull[i]);
        let fullStatus = row.isFull[i];
        if (fullStatus == true) {

            if (notFullRows.length > 0) {
                // console.log(consecutiveClears);
                // console.log(notFullRows);
                processDescendBlocks(notFullRows, consecutiveClears);
            
                consecutiveClears += 1;

                // Reset b/c first block descension is now finished b/w the two cleared sections
                notFullRows = [];
            }
            else {
                consecutiveClears += 1;
            }

        }
        else {
            // console.log(row.range[i], i);
            notFullRows.push(row.range[i]);
        }
    }

    // Move the blocks down that have no cleared lines above it
    processDescendBlocks(notFullRows, consecutiveClears);

    // console.log(consecutiveClears);
    // console.log(notFullRows);

    // console.log(row);
}

function clearFullLines() {
    // Cycle starting from the last board cell (since lines are usually at the bottom)
    // Cycle by 10s since each row is 10 
    let board = document.querySelector(".board");
    let rowEndIndex = TOTAL_COLUMN * TOTAL_ROW - 1;
    let rowInfo = {
        "isFull": [],
        "range": []
    }
    for (let row = TOTAL_ROW; row > 0; row--) {
        let rowStartEnd = getRow(rowEndIndex);

        if (checkFullLine(board, rowStartEnd) == false) {
            // Go to next row to check
            // console.log(`Not full row: ${rowStartEnd.start}, ${rowStartEnd.end}`);
            rowInfo.isFull.push(false);
        }
        else {
            processLineClear(board, rowStartEnd);
            // console.log(clearedRows);
            // console.log(`FULL: ${rowStartEnd.start}, ${rowStartEnd.end}`)
            rowInfo.isFull.push(true);
            // rowInfo.range.push();
            // descendBlocks(board);
            // break;
        }

        rowInfo.range.push(
            {
                "start": rowStartEnd.start, 
                "end": rowStartEnd.end
            }
        );

        rowEndIndex -= TOTAL_COLUMN;
    }

    descendBlocks(rowInfo);
    // console.log(rowInfo);
}

function processGhostPos(ghost) {
    while (true) {
        if (collision("bottom", true) == false) {
            ghost.style.top = `${ghost.offsetTop + PX_HEIGHT}px`;
        }
        else {
            break;
        }
    }
}


function setGhostPos(blockXPos) {
    let ghost = document.querySelector(".ghost");
    let block = document.querySelector(".block");

    // Reset the ghost position to very top
    // BUG: if you squeeze in a block b/w 2 blocks, the ghost will be above the block
        // HENCE, make the ghost.top opacity 0 whenever the ghost.top coor is greater than the block, then remove it if not
        // However, if there is more down space even b/w 2 blocks, the ghost won't appear anymore
            // In this case, should the block be b/w two set block, have the ghost start at the block's top coor and then go down until collision

    // let ghostTop = ghost.getBoundingClientRect().top;
    // let blockTop = block.getBoundingClientRect().top;


    ghost.style.top = "0px";
    ghost.style.left = blockXPos;

    // Then have it fall down
    processGhostPos(ghost);
    // while (true) {
    //     if (collision("bottom", true) == false) {
    //         ghost.style.top = `${ghost.offsetTop + PX_HEIGHT}px`;
    //     }
    //     else {
    //         break;
    //     }
    // }
    

    let ghostTop = ghost.getBoundingClientRect().top;
    let blockTop = block.getBoundingClientRect().top;
    // console.log(`Ghost: ${ghostTop}`);
    // console.log(`Block: ${blockTop}`);

    if (ghostTop < blockTop) {
        console.log(`Ghost: ${ghostTop}`);
        console.log(`Block: ${blockTop}`);
        ghost.style.top = block.style.top;
        processGhostPos(ghost);
    }
    else {
        console.log(`Ghost: ${ghostTop}`);
        console.log(`Block: ${blockTop}`);
    }


    // if (ghostTop < blockTop) {
    //     ghost.classList.add("hidden");
    // }
    // else {
    //     ghost.classList.remove("hidden");
    // }
}



function main() {
    createBoard();
    // closeCell([26, 30, 18, 46]);

    // for (let i = 141; i < 151; i++) {
    //     closeCell([i]);
    // }

    // createObstacle(30, 39);
    // createObstacle(48, 60);

    createObstacle(62, 64);

    createObstacle(65, 79);
    createObstacle(80, 100);
    createObstacle(104, 119);
    createObstacle(122, 129);
    createObstacle(130, 150);


    // These need to reused inside other functions, but is here as test
    createBlock(true);
    createBlock();
    setGhostPos();

    // Other Test
    let block = document.querySelector(".block");
    let board = document.querySelector(".board");
    let direction = "left";
    labelCoor(board, direction);
    labelCoor(block, direction);

    // placeBlock(); 
    // clearFullLines();

    // getNextBlockCoors(nextBlockCoors, block, board, direction);
    // checkObstacle(nextBlockCoors, board, direction);
    // collision(direction);
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