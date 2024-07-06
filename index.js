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
const BLOCK_BAG = ["Z", "S", "L"];
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

    detectCollision(blockCtnr);
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
    
    if (keyState["ArrowDown"] == true && block.offsetTop < collision["bottom"]) {
        block.style.top = `${block.offsetTop + PX_HEIGHT}px`;
    }    
    if (keyState["ArrowLeft"] == true && block.offsetLeft > collision["left"]) {
        block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
    }
    if (keyState["ArrowRight"] == true && block.offsetLeft < collision["right"]) {
        block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        block.style.top = `${block.offsetTop - PX_HEIGHT}px`;
    }

    // Controls speed that block moves
    setTimeout(gameLoop, 30);
} 

// SECTION: Block collision detection
function collisionInfo(direction, axisVal) {
    // Collision values based on block's rotation (aka which col + row is occupied in 3x3 grid of block)
    switch (direction) {
        case "right":
            return axisVal == 3 ? 216 - PX_WIDTH * 2 : 216 - PX_WIDTH;
        case "left":
            return axisVal == 1 ? 0 : 0 - PX_WIDTH;
        case "bottom":
            return axisVal == 3 ? 408 : 408 + PX_HEIGHT;
    }
}

function processCollision(block, axis, axisIdentifer, axisValArr, direction) {
    let valA = axisValArr[0];
    let valB = axisValArr[1];

    for (let i = 0; i < block.children.length; i++) {
        if (block.children[i].classList.contains("filled")) {
            if (axisIdentifer[valA].includes(i)) {
                axis[valA] = true;
                collision[direction] = collisionInfo(direction, valA);
            }
            else if (axisIdentifer[valB].includes(i) && axis[valA] == false) {
                axis[valB] = true;
                collision[direction] = collisionInfo(direction, valB);
            }
        }
    }
}

function detectCollision(block) {
    // Check which cols + rows is occupied in block's 3x3 grid
    let cols = {1: false, 2: false, 3: false}
    let rows = {1: false, 2: false, 3: false}

    processCollision(block, cols, COL_IDENTIFIERS, [3, 2], "right");
    processCollision(block, cols, COL_IDENTIFIERS, [1, 2], "left");
    processCollision(block, rows, ROW_IDENTIFIERS, [3, 2], "bottom");
}

function setBlock(block) {
    block.classList.remove("block");
    block.classList.add("set-block");
}


function main() {
    createBoard();
    addCtrls();
    gameLoop();

    // These need to reused inside other functions, but is here as test
    createBlock();
}

main();