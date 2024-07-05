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
    "ArrowRight": null
};
let collision = {
    "bottom": 480,
    "left": 0,
    "right": 216 - (PX_WIDTH * 2)
};

let testCell = document.querySelector(".test-cell");

function addArrowCtrls() {
    window.addEventListener("keydown", function (e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp") {
            keyState[e.key] = true;
            console.log(`keydown: ${keyState[e.key]}`);
        }
    }); 

    window.addEventListener("keyup", function(e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp") {
            keyState[e.key] = false;
            console.log(`keyup: ${keyState[e.key]}`);
        }
    })
}

function gameLoop(e) {
    if (keyState["ArrowDown"] == true && testCell.offsetTop < collision["bottom"]) {
        testCell.style.top = `${testCell.offsetTop + PX_HEIGHT}px`;
    }    
    if (keyState["ArrowLeft"] == true && testCell.offsetLeft > collision["left"]) {
        testCell.style.left = `${testCell.offsetLeft - PX_WIDTH}px`;
    }
    if (keyState["ArrowRight"] == true && testCell.offsetLeft < collision["right"]) {
        testCell.style.left = `${testCell.offsetLeft + PX_WIDTH}px`;
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        testCell.style.top = `${testCell.offsetTop - PX_HEIGHT}px`;
    }

    // Controls speed that block moves
    setTimeout(gameLoop, 30);
} 

// NOTE: Next 3 funcs below relate to block collision detection
function collisionInfo(direction, axisVal) {
    // Collision values based on block's rotation (aka which col + row is occupied in 3x3 grid of block)
    switch (direction) {
        case "right":
            return axisVal == 3 ? 216 - PX_WIDTH * 2 : 216 - PX_WIDTH;
        case "left":
            return axisVal == 1 ? 0 : 0 - PX_WIDTH;
        case "bottom":
            return axisVal == 3 ? 480 : 480 + PX_HEIGHT;
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

function detectCollision() {
    // Check which cols + rows is occupied in block's 3x3 grid
    let cols = {1: false, 2: false, 3: false}
    let rows = {1: false, 2: false, 3: false}

    processCollision(testCell, cols, COL_IDENTIFIERS, [3, 2], "right");
    processCollision(testCell, cols, COL_IDENTIFIERS, [1, 2], "left");
    processCollision(testCell, rows, ROW_IDENTIFIERS, [3, 2], "bottom");
}


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

function main() {
    createBoard();
    addArrowCtrls();
    gameLoop();
    detectCollision();
}

main();