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
    // let totalColumn = 10;
    // let totalRow = 15;
    // let totalCells = totalColumn * totalRow;

    let totalCells = TOTAL_COLUMN * TOTAL_ROW;

    for (let i = 0; i < totalCells; i++) {
        cell = createEleWithCls("div", ["cell", "cell-" + (i + 1)]);
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

function createBlock() {
    let tetrisGame = document.querySelector(".tetris-game");
    let blockCtnr = createEleWithCls("div", ["block"]);

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
            createBlock();
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
    
    if (keyState["ArrowDown"] == true) {
        // block.style.top = `${block.offsetTop + PX_HEIGHT}px`;

        if (collision("bottom") == false) {
            block.style.top = `${block.offsetTop + PX_HEIGHT}px`;
        }
    }    
    if (keyState["ArrowLeft"] == true) {
        // block.style.left = `${block.offsetLeft - PX_WIDTH}px`;

        if (collision("left") == false) {
            block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
        }
    }
    if (keyState["ArrowRight"] == true) {
        // block.style.left = `${block.offsetLeft + PX_WIDTH}px`;

        if (collision("right") == false) {
            block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
        }
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        block.style.top = `${block.offsetTop - PX_HEIGHT}px`;
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
    console.log(allCoor);
    console.log(nextBlockCoors);
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
            console.log(bottomWallCoor);
            for (const coor of coorStorage[direction]["y"]) {
                console.log(coor);
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
                    console.log("MATCHED BELOW");
                    console.log(direction + ": (" + x + "," + y + ")");
                    if (cell.classList.contains("closed")) {
                        console.log(cell);
                        hasObstacle = true;
                        console.log(`bottom: ${hasObstacle}`);
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

function collision(direction) {
    let block = document.querySelector(".block");
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
    let board = document.querySelector(".board");

    let blockCoors = getBlockCoors(block);
    alignCoors(blockCoors, board);

    // Engrave the block to board itself
    block.remove();    
}

// SECTION: Clear line
function checkFullLine(board, rowEndIndex) {
    for (let i = rowEndIndex; i > rowEndIndex - TOTAL_COLUMN; i--) {
        // One cell in row not having "closed" class = not a full line
        if (!board.children[i].classList.contains("closed")) {
            // console.log(board.children[i]);
            return false;
        }
    }

    return true;
}

function processLineClear(board, rowEndIndex) {
    for (let i = rowEndIndex; i > rowEndIndex - TOTAL_COLUMN; i--) {
        console.log(i);
        // board.children[i].classList.remove("closed");
    }
}

// function moveBlocksDown(board) {
//     // NOTE: you only want to move down the blocks that were above the line that got cleared
    
// }

function clearLine(board) {
    // Cycle starting from the last board cell (since lines are usually at the bottom)
    // Cycle by 10s since each row is 10 
    let rowEndIndex = TOTAL_COLUMN * TOTAL_ROW - 1;
    for (let row = TOTAL_ROW; row > 0; row--) {
        if (checkFullLine(board, rowEndIndex) == false) {
            // Go to next row to check
            rowEndIndex -= TOTAL_COLUMN;
        }
        else {
            processLineClear(board, rowEndIndex);
            // moveBlocksDown(board);
        }
    }
}



function main() {
    createBoard();
    closeCell([26, 30, 18, 46]);

    // for (let i = 141; i < 151; i++) {
    //     closeCell([i]);
    // }

    for (let i = 65; i < 80; i++) {
        closeCell([i]);
    }


    for (let i = 106; i < 130; i++) {
        closeCell([i]);
    }


    // These need to reused inside other functions, but is here as test
    createBlock();

    // Other Test
    let block = document.querySelector(".block");
    let board = document.querySelector(".board");
    let direction = "left";
    labelCoor(board, direction);
    labelCoor(block, direction);

    // placeBlock(); 
    clearLine(board);

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