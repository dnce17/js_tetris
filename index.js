// REUSABLE
function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element;
}

// TETRIS BLOCK INFO
const PX_WIDTH = 24;
const PX_HEIGHT = 24;
const PX_COUNT = 9; // Block is 3x3
// const BLOCK_BAG = ["Z", "S", "L"];
const BLOCK_BAG = ["S"];
const COL_IDENTIFIERS = {
    1: [0, 3, 6],
    2: [1, 4, 7],
    3: [2, 5, 8],
};
const ROW_IDENTIFIERS = {
    1: [0, 1, 2],
    2: [3, 4, 5],
    3: [6, 7, 8],
};
let keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};
let collision = {
    "bottom": 408,
    "left": 0,
    "right": 216 - (PX_WIDTH * 2)
};

let testCell = document.querySelector(".test-cell");

function createBoard() {
    let board = document.querySelector(".board");
    totalColumn = 10;
    totalRow = 20;
    totalCells = totalColumn * totalRow;

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
            [0, 0, 1,
             1, 1, 0,
             0, 0, 1],
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
    let blockCtnr = document.querySelector(".block");

    if (!blockCtnr) {
        let tetrisGame = document.querySelector(".tetris-game");
        blockCtnr = createEleWithCls("div", ["block"]);
        tetrisGame.prepend(blockCtnr);
    }

    defaultBlock = getBlockType(BLOCK_BAG);

    for (let i = 0; i < defaultBlock.length; i++) {
        let px = defaultBlock[i] == 0 ? createEleWithCls("div", ["px"]) : createEleWithCls("div", ["px", "filled"]);
        blockCtnr.appendChild(px);
    }
}

// SECTION: game controls
function addDropCtrl(block) {
    if (keyState[" "] == true) {
        setBlock(block);
        createBlock();
    }
}

function addCtrls() {
    window.addEventListener("keydown", function (e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp" || e.key == " ") {
            keyState[e.key] = true;
            console.log(`keydown: ${e.key}, ${keyState[e.key]}`);

            // Not added to game loop b/c cause multiple new blocks to form instead of 1
            let block = document.querySelector(".block");
            addDropCtrl(block);
        }
    }); 

    window.addEventListener("keyup", function(e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp" || e.key == " ") {
            keyState[e.key] = false;
            console.log(`keyup: ${e.key}, ${keyState[e.key]}`);
        }
    })
}

function gameLoop() {
    let block = document.querySelector(".block");
    
    if (keyState["ArrowDown"] == true) {
        block.style.top = `${block.offsetTop + PX_HEIGHT}px`;
    }    
    if (keyState["ArrowLeft"] == true) {
        getBlockOuterSides();
        getSideCoor();
        if (hasObstacle() == false) {
            block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
        }
        // block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
    }
    if (keyState["ArrowRight"] == true) {
        block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        block.style.top = `${block.offsetTop - PX_HEIGHT}px`;
    }

    // Controls speed that block moves
    setTimeout(gameLoop, 16);
} 
// SECTION: Block collision detection
// let collisionTest = {
//     "leftOuterX": 9999,
//     "rightOuterX": 9999,
//     "bottomOuterY": 0
// };

let collisionTest = {
    "leftOuterX": [9999, 9999, 9999],
    "rightOuterX": 9999,
    "bottomOuterY": 0
};

let sideToMove = {
    "left": {
        "x": [],
        "y": []
    }
}
// Cycle through the block's px
// Get the outermost sides of the BLOCK
function getBlockOuterSides() {
    // We need the x, y of each row of the 3x3 block grid. This will keep track of which row we are on
    let rowNum = -1;
    for (let i = 0; i < PX_COUNT; i++) {
        let px = document.querySelectorAll(".px");
        let pos = px[i].getBoundingClientRect();

        // If "filled", get it's x,y coor
        if (px[i].classList.contains("filled")) {
            if (pos.bottom != collisionTest["bottomOuterY"]) {
                collisionTest["bottomOuterY"] = pos.bottom;
                rowNum += 1;
            }
            // if pos.bottom is not equal to cT[bottomOuterY]:
                // Make cT[bottomOuterY] equal to new bottom
                // row += 1
            
            // For left --> if x < leftOuterX, make that new leftOuterX
            if (pos.left < collisionTest["leftOuterX"][rowNum]) {
                console.log("changed");
                collisionTest["leftOuterX"][rowNum] = pos.left;

            }
        }
    }  
    console.log(collisionTest["leftOuterX"]);
}

// getBlockOuterSides();

function getSideCoor() {
    let rowNum = 0;
    for (let i = 0; i < PX_COUNT; i++) {
        let px = document.querySelectorAll(".px");
        let pos = px[i].getBoundingClientRect();
        if (px[i].classList.contains("filled")) {
            if (pos.left == collisionTest["leftOuterX"][rowNum]) {
                sideToMove["left"]["x"].push(pos.left - 1 - PX_WIDTH);
                sideToMove["left"]["y"].push(pos.bottom - 1);
                rowNum += 1;
                // console.log(px[i]);
            }
        }
    }
    console.log(sideToMove["left"]);
}
// Get the coor of the col/row that block will move to
// NOTE: The -1 is there b/c clientrect methods are all 1 greater than the cell's
// getSideCoor();

// Create obstacles for block collision test
function closeCell(cellNumArr) {
    for (let i = 0; i < cellNumArr.length; i++) {
        let cell = document.querySelector(`.cell-${cellNumArr[i]}`);
        cell.classList.add("closed");
        cell.style.backgroundColor = "green";
    }
}


// Cycle through the BOARD
// Determine if block can move
function hasObstacle() {
    let board = document.querySelector(".board");
    let hasObstacle = false
    let leftWall = 0;
    for (let i = 0; i < board.children.length; i++) {
        let cell = board.children[i];
        let boardPos = cell.getBoundingClientRect();
        
        // First check if any of the sideToMove x's go beyond cell 1's pos.left. If so, hasObstacle is auto true b/c there is a wall
        // For future reference, adding this code kind of slows movement down, so you may need to either
        // TRY doing wall collision in a separate function or adjust game speed in game loop
        if (i == 0) {
            for (const val of sideToMove["left"]["x"]) {
                if (val < boardPos.left) {
                    resetCollisionInfo();
                    hasObstacle = true;
                    return hasObstacle;
                }
            }

        }

        // console.log(boardPos.left);
        // console.log(board.children[0].getBoundingClientRect().left)

        // for (let k = 0; k < sideToMove["left"]["x"].length; k++) {
        //     let x = sideToMove["left"]["x"][k];
        //     console.log(x);
        //     if (x < leftWall) {
        //         resetCollisionInfo();
        //         hasObstacle = true;
        //         return hasObstacle;
        //     }
        // }

        // break;

        for (let k = 0; k < sideToMove["left"]["x"].length; k++) {
            // console.log(sideToMove["left"]["x"][k], sideToMove["left"]["y"][k]);
            let x = sideToMove["left"]["x"][k];
            let y = sideToMove["left"]["y"][k];

            // If the board cell left is equal to sideToMove["left"]["x"][k] and bottom = sideToMove["left"]["y"][k] 
            if (boardPos.left == x && boardPos.bottom == y) {
                // check if that cell is occupied, if so, has obstacle is true and break immediately
                if (cell.classList.contains("closed")) {
                    console.log("can NOT move");
                    hasObstacle = true;
                    break;
                }
                else {
                    console.log("can move");
                }
            }
            // else continue to check if all left-side of filled block px has obstacle
        } 

        if (hasObstacle == true) {
            break;
        }

        // x - 24 is to the left of the filled px of block
        // HENCE, if ALL the x - 24 of the FILLED px's is 0 (unoccupied), then allow move
        // Else if even one if 1 (occupied), don't allow movement 
    }
    
    resetCollisionInfo();
    return hasObstacle;
}

// console.log(hasObstacle());

function resetCollisionInfo() {
    collisionTest = {
        "leftOuterX": [9999, 9999, 9999],
        "rightOuterX": 9999,
        "bottomOuterY": 0
    };
    
    sideToMove = {
        "left": {
            "x": [],
            "y": []
        }
    }
}

function main() {
    createBoard();
    closeCell([1, 21]);

    // These need to reused inside other functions, but is here as test
    createBlock();

    addCtrls();
    gameLoop();
}

main();


// getBlockOuterSides();
// getSideCoor();
// console.log(hasObstacle());

// If x - PX_WIDTH goes beyond the left of cell-1, then has obstacle is automatically acivated