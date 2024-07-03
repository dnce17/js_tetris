// REUSABLE
function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element;
}
// ---

// IN PROGRESS: must implement collision
let testCell = document.querySelector(".test-cell");
let blockWidth = 24;
let blockHeight = 24;
let keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null
};
let boundaries = {
    "bottom": 480,
    "left": 0,
    "right": 216 - blockWidth
}

function addArrowCtrls() {
    window.addEventListener("keydown", function (e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp") {
            keyState[e.key] = true;
            // console.log(`keydown: ${keyState[e.key]}`);
        }
    }); 

    window.addEventListener("keyup", function(e) {
        if (e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp") {
            keyState[e.key] = false;
            // console.log(`keyup: ${keyState[e.key]}`);
        }
    })
}

function gameLoop(e) {
    if (keyState["ArrowDown"] == true && testCell.offsetTop < boundaries["bottom"]) {
        testCell.style.top = `${testCell.offsetTop + blockHeight}px`;
    }    
    if (keyState["ArrowLeft"] == true && testCell.offsetLeft > boundaries["left"]) {
        testCell.style.left = `${testCell.offsetLeft - blockWidth}px`;
    }
    if (keyState["ArrowRight"] == true && testCell.offsetLeft < boundaries["right"]) {
        testCell.style.left = `${testCell.offsetLeft + blockWidth}px`;
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        testCell.style.top = `${testCell.offsetTop - blockHeight}px`;
    }

    // console.log(`${testCell.offsetLeft}, ${testCell.offsetTop}`);

    // Controls speed that block moves
    setTimeout(gameLoop, 30);
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

// IN PROGRESS
function blockTypes() {
    let blocks = {
        "O": [
            [1, 1],
            [1, 1]
        ],
        "I": [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1]
        ]
    }

    return blocks
}


function main() {
    createBoard();
    addArrowCtrls();
    gameLoop();
}

main();

// Test functions
function getCoor(cellNum) {
    let cell = document.querySelector("." + cellNum);
    let cellCoor = {
        "offsetLeft": cell.offsetLeft,
        "offsetTop": cell.offsetTop
    }
    // console.log(cell.offsetLeft);
    // console.log(`Cell Coor: ${cell.offsetLeft}, ${cell.offsetTop}`)

    return cellCoor;
}

// getCoor("cell-1")