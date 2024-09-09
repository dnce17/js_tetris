// Block Info
let defaultBlockPos = {"x": 1, "y": 0}
let blockPos = [];
let block = [
    [0, 1, 1],
    [1, 1, 0],
]

// Grid Info
// NOTE: CSS column is 6, row is 5 --> This could impact collision funcs you make, so keep that in mind
let grid = [
    [0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
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
        for (let col of row) {
            if (col == 0) {
                cell = createEleWithCls("div", ["cell"]);
            }
            else {
                cell = createEleWithCls("div", ["cell", "px"]);
            }
        
            board.appendChild(cell);
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

// CHECKPOINT
function checkBlockCollision(blockPos, direction) { 
    let outermostCoors;
    if (direction == "down") {
        outermostCoors = getOutermostCoosr(blockPos, "y", direction);
    }
    else {
        outermostCoors = getOutermostCoors(blockPos, "x", direction);
    }


    // outermostCoors = getOutermostCoors(blockPos, "x", "right");
    console.log(outermostCoors);
    for (let coor of outermostCoors) {
        if (direction == "right" && grid[coor.y][coor.x + 1] == 1) {
            console.log("right collision");
            return true;
        }
        else {
            console.log("no collision");
        }
    }

    // // Check coor.x/y +/- 1; don't allow movement if grid[row][column] overlaps (has 1)
    // for (let coor of blockPos) {
    //     // You only want to check the last row of block for going down
    //     if (direction == "down" && grid[outermostCoor + 1][coor.x] == 1) {
    //         return true;
    //     }

    //     if (direction == "left" && grid[coor.y][outermostCoor - 1] == 1) {
    //         return true;
    //     }

    //     if (direction == "right" && grid[coor.y][outermostCoor + 1] == 1) {
    //         console.log("right collision")
    //         return true;
    //     }
    // }
    // console.log(outermostCoors);

    // for (let i of outermostCoors) {
    //     if (direction == "right" && ...) {
    //         return true;
    //     }
    // }



    return false
}

// const numbers = [4, 9, 16, 25];
// const newArr = numbers.map(Math.sqrt)


// CHECKPOINT
function getOutermostCoors(blockPos, axis, direction) {
    // Get the outermost x or y coors for block collision check, depending on directions
    // ****NOTE: there's going to be more than outermost coors
        // E.g. a block that has at least px in each row will have 3 outermost x

    // Cycle through each arr of block

    let axisVals = [];
    // Grouped by either x or y
    let groupedByY = [];
    let maxXPerY = []
    if (axis == "x" && direction == "right") {
        // Group blockPos by y
        groupedByY = blockPos.reduce((acc, obj) => {
            if (!acc[obj.y]) {
              acc[obj.y] = [];
            }
            
            acc[obj.y].push(obj);
            return acc;
          }, {});

        // Get the highest x of each unique y value
        maxXPerY = Object.keys(groupedByY).map(y => {
            return groupedByY[y].reduce((maxObj, obj) => obj.x > maxObj.x ? obj : maxObj);
        });
    }

    // console.log(maxXPerY);

    return maxXPerY;

    

    // DOESN'T WORK
    // let axisVals = []
    // for (let coor of blockPos) {
    //     axis == "y" ? axisVals.push(coor.y) : axisVals.push(coor.x);
    // }

    // // Left = lowest val is outermost, Right/Down = highest val
    // return (direction == "left") ? Math.min(...axisVals) : Math.max(...axisVals);
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
    // checkBlockCollision(blockPos, "right");
    // getOutermostCoors("y", "down")

    enableCtrls();
    gameLoop();
}

executeGame();