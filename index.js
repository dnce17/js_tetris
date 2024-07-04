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
let collision = {
    "bottom": 480,
    "left": 0,
    "right": 216 - blockWidth
}

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
        testCell.style.top = `${testCell.offsetTop + blockHeight}px`;
    }    
    if (keyState["ArrowLeft"] == true && testCell.offsetLeft > collision["left"]) {
        testCell.style.left = `${testCell.offsetLeft - blockWidth}px`;
    }
    if (keyState["ArrowRight"] == true && testCell.offsetLeft < collision["right"]) {
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

function detectBlockBoundaries() {
    // Check which columns has a block piece
    let cols = {1: false, 2: false, 3: false}
    let colIdentifers = {
        1: [0, 3, 6],
        2: [1, 4, 7],
        3: [2, 5, 8],
    }
    // Check which row has a block piece
    let rows = {1: false, 2: false, 3: false}
    let rowIdentifers = {
        1: [0, 1, 2],
        2: [3, 4, 5],
        3: [6, 7, 8],
    }


    for (let i = 0; i < testCell.children.length; i++) {
        // Check right boundary
        if (testCell.children[i].classList.contains("filled")) {
            if (colIdentifers["3"].includes(i)) {
                cols["3"] = true;
                collision["right"] = 216 - blockWidth * 2;
                console.log("column 3 has item")
            }
            else if (colIdentifers["2"].includes(i) && cols["3"] == false) {
                cols["2"] = true;
                collision["right"] = 216 - blockWidth;
                console.log("column 2 has item")
            }
        }

        // Check left boundary
        if (testCell.children[i].classList.contains("filled")) {
            // This may be redundant sinc default is left 0, but you will need to change
            // cols["1"] to true as default
            if (colIdentifers["1"].includes(i)) {
                cols["1"] = true;
                collision["left"] = 0;
                console.log("column 1 has item");
            }
            else if (colIdentifers["2"].includes(i) && cols["1"] == false) {
                cols["2"] = true;
                collision["left"] = 0 - blockWidth;
                console.log("column 2 has item");
            }
        }

        console.log(cols);

        if (testCell.children[i].classList.contains("filled")) {
            // Check bottom boundary
            if (rowIdentifers["3"].includes(i)) {
                rows["3"] == true;
                collision["bottom"] = 480;
            }
            else if (rowIdentifers["2"].includes(i) && rows["3"] == false) {
                rows["2"] == true;
                collision["bottom"] = 480 + blockHeight;
            }
        }
    }
}

detectBlockBoundaries();


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