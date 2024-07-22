// REUSABLE
function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element;
}

// TEST USE: Create obstacles for block collision test
function closeCell(cellNumArr) {
    for (let i = 0; i < cellNumArr.length; i++) {
        let cell = document.querySelector(`.cell-${cellNumArr[i]}`);
        cell.classList.add("closed");
        cell.style.backgroundColor = "green";
    }
}

// TETRIS BLOCK INFO
const PX_WIDTH = 24;
const PX_HEIGHT = 24;
const PX_COUNT = 9; // Block is 3x3
// const BLOCK_BAG = ["Z", "S", "L"];
const BLOCK_BAG = ["S"];
let keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};

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
            [0, 1, 1,
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
function addCtrls() {
    window.addEventListener("keydown", function (e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp" || e.key == " ") {
            keyState[e.key] = true;
            console.log(`keydown: ${e.key}, ${keyState[e.key]}`);

            // ADD LATER: addDropCtrl() added to game loop b/c cause multiple new blocks to form instead of 1
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
        direction = "left";
        getBlockOuterSides(direction);
        getSideCoor(direction);
        if (hasObstacle(direction) == false) {
            block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
        }
        // block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
    }
    if (keyState["ArrowRight"] == true) {
        direction = "right";
        getBlockOuterSides(direction);
        getSideCoor(direction);
        // console.log(hasObstacle());
        if (hasObstacle(direction) == false) {
            block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
        }
        // block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        block.style.top = `${block.offsetTop - PX_HEIGHT}px`;
    }

    // Controls speed that block moves
    setTimeout(gameLoop, 30);
} 

// SECTION: Block collision detection
let blockOuterVals = {
    "outerX": {
        "leftOuterX": [9999, 9999, 9999],
        "rightOuterX": [-1, -1, -1],

        // Used to determine if new row while getting outermost coor
        "bottomOuterY": -1
    },
    "outerY": {
        "bottomOuterY": [9999, 9999, 9999],
        "leftOuterX": -1
    }
};

// Has row/col coor that block will move into
let sideToMove = {
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
    }
}

function checkNewSection(clientRect, blockOuterVals, directionToMove) {
    switch (directionToMove) {
        case "left":
        case "right":
            if (clientRect.bottom != blockOuterVals.outerX["bottomOuterY"]) return true;
        
        // NOTE: for this to work, blockOuterVals gotta be adjusted
        // case "bottom":
        //     if (clientRect.left != blockOuterVals.outerX["leftOuterX"]) return true;
    }
    return false;
}

function processBlockOuterSides(section, clientRect, blockOuterVals, direction) {
    let currentVal = clientRect[direction];
    let outerVal = blockOuterVals.outerX[`${direction}OuterX`][section];
    
    switch (direction) {
        case "left":
            // Gets the leftmost side of block
            currentVal < outerVal && (blockOuterVals.outerX[`${direction}OuterX`][section] = currentVal);
            break;
        case "right":
            currentVal > outerVal && (blockOuterVals.outerX[`${direction}OuterX`][section] = currentVal);
            break;
    }
}

// Get the outermost sides of block
function getBlockOuterSides(direction) {
    /* Get (x, y) per row/col in 3x3 block grid */
    /* Whether row or col is based on movement */

    // Track which row/col we are on
    let section = -1;

    // Cycle through block's px
    for (let i = 0; i < PX_COUNT; i++) {
        let px = document.querySelectorAll(".px");
        let pos = px[i].getBoundingClientRect();

        // If "filled," get (x, y) coor
        if (px[i].classList.contains("filled")) {
            // Checks for new row/col; purpose: ultimately want to get outermost "filled" px val of each row/col of block
            if (checkNewSection(pos, blockOuterVals, direction) == true) {
                if (direction == "left" || direction == "right") {
                    blockOuterVals.outerX["bottomOuterY"] = pos.bottom;
                }
                // else if (direction == "bottom") {
                //     blockOuterVals.outerX["leftOuterX"] = pos.left;
                // }

                section += 1;
            }

            processBlockOuterSides(section, pos, blockOuterVals, direction);
        }
    }
}

// Get  coor of  col/row that block will move to
// NOTE: -1 is there b/c clientrect methods are all 1 greater than the cell due to borders (WILL BE REMOVED IN FUTURE)
function getSideCoor(direction) {
    let section = 0;
    for (let i = 0; i < PX_COUNT; i++) {
        let px = document.querySelectorAll(".px");
        let pos = px[i].getBoundingClientRect();
        if (px[i].classList.contains("filled")) {
            if (direction == "left" && pos.left == blockOuterVals.outerX["leftOuterX"][section]) {
                sideToMove["left"]["x"].push(pos.left - 1 - PX_WIDTH);
                sideToMove["left"]["y"].push(pos.bottom - 1);
                section += 1;
            }
            // console.log(`right: ${pos.right}`);
            if (direction == "right" && pos.right == blockOuterVals.outerX["rightOuterX"][section]) {
                sideToMove["right"]["x"].push(pos.right - 1 + PX_WIDTH);
                sideToMove["right"]["y"].push(pos.bottom - 1);
                section += 1;
            }
        }
    }
}

// Determine if block can move
function hasObstacle(direction) {
    let board = document.querySelector(".board");
    let hasObstacle = false
    for (let i = 0; i < board.children.length; i++) {
        let cell = board.children[i];
        let boardPos = cell.getBoundingClientRect();
        
        // First check if any of the sideToMove x's go beyond cell 1's pos.left. If so, hasObstacle is auto true b/c there is a wall
        // For future reference, adding this code kind of slows movement down, so you may need to either
        // TRY doing wall collision in a separate function or adjust game speed in game loop
        if (direction == "left" && i == 0) {
            // LEFT TEST
            for (const val of sideToMove["left"]["x"]) {
                if (val < boardPos.left) {
                    resetCollisionInfo();
                    hasObstacle = true;
                    return hasObstacle;
                }
            }
        }

        if (direction == "right" && i == board.children.length - 1) {
            // RIGHT TEST
            for (const val of sideToMove["right"]["x"]) {
                if (val > boardPos.right) {
                    resetCollisionInfo();
                    hasObstacle = true;
                    return hasObstacle;
                }
            }
        }
        
        // LEFT TEST
        if (direction == "left") {
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
        }

        // RIGHT TEST
        if (direction == "right") {
            for (let k = 0; k < sideToMove["right"]["x"].length; k++) {
                let x = sideToMove["right"]["x"][k];
                let y = sideToMove["right"]["y"][k];
    
                if (boardPos.right == x && boardPos.bottom == y) {
                    if (cell.classList.contains("closed")) {
                        
                        console.log("can NOT move");
                        console.log(boardPos.right);
                        console.log(x);
                        hasObstacle = true;
                        break;
                    }
                    else {
                        console.log("can move");
                    }
                }
            } 
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

function resetCollisionInfo() {
    blockOuterVals = {
        "outerX": {
            "leftOuterX": [9999, 9999, 9999],
            "rightOuterX": [-1, -1, -1],
    
            // Used to determine if new row while getting outermost coor
            "bottomOuterY": -1
        },
        "outerY": {
            "bottomOuterY": [9999, 9999, 9999],
            "leftOuterX": -1
        }
    };
    
    sideToMove = {
        "left": {
            "x": [],
            "y": []
        },
        "right": {
            "x": [],
            "y": []
        }
    }
}

function main() {
    createBoard();
    closeCell([1, 18, 21, 35]);

    // These need to reused inside other functions, but is here as test
    createBlock();

    addCtrls();
    gameLoop();

    // let cell = document.querySelector(".cell-4");
    // console.log(cell.getBoundingClientRect().left);

    // for (let i = 0; i < PX_COUNT; i++) {
    //     let px = document.querySelectorAll(".px");
    //     let pos = px[i].getBoundingClientRect();
    //     if (i == 1) {
    //         console.log(px);
    //         console.log(pos.left);
    //     }
    // }
}

main();