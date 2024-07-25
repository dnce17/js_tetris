// TEST USE: Create obstacles for block collision test
function closeCell(cellNumArr) {
    for (let i = 0; i < cellNumArr.length; i++) {
        let cell = document.querySelector(`.cell-${cellNumArr[i]}`);
        cell.classList.add("closed");
        cell.style.backgroundColor = "green";
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

function createBoard() {
    let board = document.querySelector(".board");
    let totalColumn = 10;
    let totalRow = 15;
    let totalCells = totalColumn * totalRow;

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
            [1, 1, 1,
             0, 1, 0,
             1, 0, 1],
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
        if (keys.includes(e.key)) {
            keyState[e.key] = true;
            // console.log(`keydown: ${e.key}, ${keyState[e.key]}`);

            // ADD LATER: addDropCtrl() added to game loop b/c cause multiple new blocks to form instead of 1
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
        block.style.top = `${block.offsetTop + PX_HEIGHT}px`;
    }    
    if (keyState["ArrowLeft"] == true) {
        block.style.left = `${block.offsetLeft - PX_WIDTH}px`;
    }
    if (keyState["ArrowRight"] == true) {
        block.style.left = `${block.offsetLeft + PX_WIDTH}px`;
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
    setTimeout(gameLoop, 20);
} 

// SECTION: Block collision detection
let nextBlockCoors = {
    "left": [],
    "right":[],
    "bottom":[]
}

function getNextBlockCoors(storage, block, board, direction) {
    // For each px in block
    for (const px of block.children) {
        // If px has "filled" class
        if (px.classList.contains("filled")) {
            // Save the coor of px client rect left/right/bottom (depending on direction) + 24 in storage to get nextStorageCoor
            let pxPos = px.getBoundingClientRect()
            switch (direction) {
                case "left":
                    storage.left.push(pxPos.left - PX_WIDTH);
                    break;
                case "right":
                    storage.right.push(pxPos.left + PX_WIDTH);
                    break;
                case "bottom":
                    storage.bottom.push(pxPos.bottom + PX_HEIGHT);
                    break;
            }
        }
    }
    console.log(nextBlockCoors.left);
}

function collision() {
    let block = document.querySelector(".block");
    let board = document.querySelector(".board");
    getNextBlockCoors();
    checkObstacle();
}


function main() {
    createBoard();
    closeCell([1, 18, 21, 46]);

    // These need to reused inside other functions, but is here as test
    createBlock();

    // Other Test
    let block = document.querySelector(".block");
    let board = document.querySelector(".board");
    let direction = "left";
    labelCoor(board, direction);
    labelCoor(block, direction);

    getNextBlockCoors(nextBlockCoors, block, board, direction);
    // ---

    addCtrls();
    gameLoop();

    // let cellNum = 3;
    // let cell = document.querySelector(`.cell-${cellNum}`);
    // console.log(`Cell ${cellNum} Left Coor: ${cell.getBoundingClientRect().left}`);

    // for (let i = 0; i < PX_COUNT; i++) {
    //     let px = document.querySelectorAll(".px");
    //     let pos = px[i].getBoundingClientRect();
    //     if (i == 1) {
    //         console.log(`Block px 4 Left Coor: ${pos.left}`);
    //     }
    // }
}

main();