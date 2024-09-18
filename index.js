// Block Info
let defaultBlockPos = {"x": 0, "y": 0}
let blockPos = [];
let block = [
    [0, 1, 0],
    [1, 1, 1],
]

let ghostPos;

// Grid Info
// NOTE: CSS column is 6, row is 5 --> This could impact collision funcs you make, so keep that in mind
let grid = [
    [0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 0],
]
let TOTAL_COLUMN = 6;
let TOTAL_ROW = 5;

// Ctrls Info
let keyState = {
    "ArrowDown": null,
    "ArrowLeft": null,
    "ArrowRight": null,
    " ": null
};

// SECTION: Board
function updateBoard(grid) {
    // Delete and update board w/ updated grid
    let board = document.querySelector(".board");
    removeOldBoard(board);
    createBoard(board, grid);
}

function removeOldBoard(board) {
    if (board.children.length > 0) {
        let child = board.lastElementChild;
        while (child) {
            board.removeChild(child);
            child = board.lastElementChild;
        }
    }
}

function createBoard(board, grid) {
    // Create board cell + px 
    let cell;
    for (let row of grid) {
        let rowDiv = createEleWithCls("div", ["row"]);
        for (let col of row) {
            if (col == 0) {
                cell = createEleWithCls("div", ["cell"]);
            }
            else {
                cell = createEleWithCls("div", ["cell", "px"]);
            }

            rowDiv.appendChild(cell);
            // board.appendChild(cell);
        }
        board.appendChild(rowDiv);
    }

    // TEST USE
    addGridLabels();
}

// TEST USE
function addGridLabels() {
    let board = document.querySelector(".board")
    for (let row = 0; row < board.children.length; row++) {
        let currentRow = board.children[row];
        for (let col = 0; col < currentRow.children.length; col++) {
            let currentCol = currentRow.children[col];
            currentCol.innerHTML = `${col}, ${row}`;
        }
    }
}

// SECTION: Place block
function placeBlockDefaultPos() {
    for (let row = 0; row < block.length; row++) {
        let blockY = defaultBlockPos["y"] + row;
        for (let col = 0; col < block[row].length; col++) {
            let blockX = defaultBlockPos["x"] + col;
            // Only place non-zero values
            if (block[row][col] !== 0) { 
                grid[blockY][blockX] = block[row][col];
                saveBlockCoor(blockPos, blockX, blockY);
                updateBoard(grid);
            }
        }
    }
}

function saveBlockCoor(blockPos, x, y) {
    blockPos.push({"x": x, "y": y});
}

function updateBlockPos(blockPos, direction) {
    removeOldBlock(blockPos);
    addUpdatedBlock(blockPos, direction);
    updateBoard(grid);
}

function removeOldBlock(blockPos) {
    for (let coor of blockPos) {
        if (grid[coor.y][coor.x] == 1) {
            grid[coor.y][coor.x] = 0;
        }
    }
}

function addUpdatedBlock(blockPos, direction) {
    for (let coor of blockPos) {
        if (direction == "down") {
            coor.y += 1;
        }

        if (direction == "left") {
            coor.x -= 1;
        }

        if (direction == "right") {
            coor.x += 1;
        }

        // TEST USE ONLY
        if (direction == "up") {
            coor.y -= 1;
        }

        grid[coor.y][coor.x] = 1;
    }
}

// TESTING refactor
function addUpdatedBlockTest(pos, direction, ghost=false) {
    for (let coor of pos) {
        if (direction == "down") {
            coor.y += 1;
        }

        if (direction == "left") {
            coor.x -= 1;
        }

        if (direction == "right") {
            coor.x += 1;
        }

        // TEST USE ONLY
        if (direction == "up") {
            coor.y -= 1;
        }
        
        if (ghost == false) {
            grid[coor.y][coor.x] = 1;
        }
    }
}

function deepCopy(item) {
    return JSON.parse(JSON.stringify(item));
}

// SECTION: Ghost

// MOST RECENT CHECKPOINT
// HOWEVER, before working on this, change the board to match grid as per instructed in 
// github projects
function placeGhost(blockPos) {
    // NOTE: the ghost is just a visual aid. The grid should not show 1s for a ghost or else
        // the block can collide with it

    ghostPos = deepCopy(blockPos);
    let direction = "down";

    // Loop until ghost hits a wall or block
    while(true) {
        if (checkCollision(ghostPos, direction, TOTAL_COLUMN, TOTAL_ROW) == false) {
            console.log("no obstacle");
    
            // This add +1 to all the y coor
            // Safe to move into if no obstacle
            // Then we check (new y coor + 1) to see if obstacle
            addUpdatedBlockTest(ghostPos, direction, true);
    
            // Updated coor after no obstacle
            console.log("updated coor to prepare for next check");
            for (let coor of ghostPos) {
                console.log(coor);
            }
        }
        else {
            console.log("Positions before collision, no update to coor, SAME AS PREVIOUS");
            for (let coor of ghostPos) {
                console.log(coor);
            }
            break;
        }
    }

    // Match the ghostPos with DOM cells
    // let boardDOM = document.querySelector(".board");
    // for (let coor of ghostPos) {
    //     let cell = boardDOM.children[coor.y].children[coor.x];
    //     // console.log(cell);
    //     cell.classList.add("ghost");
    // }
}

// SECTION: Collision
function checkCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW) {

    let wallCollision = checkWallCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW);
    if (wallCollision == true) {
        return true;
    }

    let blockCollision = checkBlockCollision(blockPos, direction);
    if (blockCollision == true) {
        return true;
    }

    return false;
}

function checkWallCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW) {
    for (let coor of blockPos) {
        if (direction == "down" && coor.y + 1 >= TOTAL_ROW) {
            return true;
        }

        if (direction == "left" && coor.x - 1 < 0) {
            return true;
        }

        if (direction == "right" && coor.x + 1 >= TOTAL_COLUMN) {
            return true;
        }

        // TEST USE ONLY
        if (direction == "up" && coor.y - 1 < 0) {
            return true;
        }
    }

    return false;
}

function checkBlockCollision(blockPos, direction) { 
    let outermostCoors;
    if (direction == "down") {
        outermostCoors = getOutermostCoors(blockPos, "y", direction);
    }
    else {
        outermostCoors = getOutermostCoors(blockPos, "x", direction);
    }

    for (let coor of outermostCoors) {
        if (direction == "right" && grid[coor.y][coor.x + 1] == 1) {
            console.log("right collision");
            return true;
        }

        if (direction == "left" && grid[coor.y][coor.x - 1] == 1) {
            console.log("left collision");
            return true;
        }

        if (direction == "down" && grid[coor.y + 1][coor.x] == 1) {
            console.log("down collision");
            return true;
        }
    }

    return false;
}

function getOutermostCoors(blockPos, axis, direction) {
    // Gets the outermost x or y coors for block collision check, depending on directions
    // ****NOTE: there may be more than 1 outermost coors
        // E.g. a block that has at least px in each row will have 3 outermost x
        // Get highest x of each unique y if right, lowest x if left, highest y if down

    // Grouped by either x or y
    let groupedAxis;
    let outermostCoors = [];
    if (axis == "x" && (direction == "right" || direction == "left")) {
        // Group all y coors
        groupedAxis = groupByAxis("y", blockPos);
        outermostCoors = processOutermostCoors("y", groupedAxis, direction);
    }

    if (axis == "y" && direction == "down") {
        // Group all x coors
        groupedAxis = groupByAxis("x", blockPos);
        outermostCoors = processOutermostCoors("x", groupedAxis, direction);
    }

    return outermostCoors;
}

function groupByAxis(axis, blockPos) {
    return blockPos.reduce((acc, coorObj) => {
        let coorVal = coorObj[axis];
        if (!acc[coorVal]) {
          acc[coorVal] = [];
        }
        
        acc[coorVal].push(coorObj);
        return acc;
      }, {});
}

function processOutermostCoors(axis, groupedAxisDict, direction) {
    if (axis == "y" && direction == "right") {
        return Object.keys(groupedAxisDict).map(y => {
            return groupedAxisDict[y].reduce((coorAcc, coorObj) => coorObj.x > coorAcc.x ? coorObj : coorAcc);
        });
    }

    if (axis == "y" && direction == "left") {
        return Object.keys(groupedAxisDict).map(y => {
            return groupedAxisDict[y].reduce((coorAcc, coorObj) => coorObj.x < coorAcc.x ? coorObj : coorAcc);
        });
    }

    if (axis == "x" && direction == "down") {
        return Object.keys(groupedAxisDict).map(x => {
            return groupedAxisDict[x].reduce((coorAcc, coorObj) => coorObj.y > coorAcc.y ? coorObj : coorAcc);
        });
    }
}


// SECTION: line clear
function clear_line() {
    let test_grid = [
        [0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1],
        [0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1],
    ]

    test_grid = test_grid.filter(row => String(row) !== String([1, 1, 1, 1, 1, 1]));
    console.log(test_grid);
}

// SECTION: Moving block
function enableCtrls() {
    let keys = ["ArrowDown", "ArrowLeft", "ArrowRight", " ", "ArrowUp"];

    window.addEventListener("keydown", function(e) {
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

function gameLoop() {
    let direction;
    if (keyState["ArrowDown"] == true) {
        direction = "down";
    }    
    if (keyState["ArrowLeft"] == true) {
        direction = "left";
    }
    if (keyState["ArrowRight"] == true) {
        direction = "right";
    }

    // TEST USE ONLY
    if (keyState["ArrowUp"] == true) {
        direction = "up";
    }

    // NOTE: if you want diagonal movement, put this in each if statement
    if (checkCollision(blockPos, direction, TOTAL_COLUMN, TOTAL_ROW) == false) {
        updateBlockPos(blockPos, direction);
        // placeGhost(blockPos);
    }

    setTimeout(gameLoop, 30);
} 


// REUSABLES
function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element;
}

function executeGame() {
    updateBoard(grid);
    placeBlockDefaultPos();
    placeGhost(blockPos);
    // checkBlockCollision(blockPos, "right");
    // getOutermostCoors("y", "down")

    enableCtrls();
    // gameLoop();
}

executeGame();