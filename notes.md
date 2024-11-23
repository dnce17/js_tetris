# Notes for Future Reference

### Future Changes
* Break more functions down into smaller chunks 
* Fix the board to have the traditional 20 rows, 10 columns. Adjust CSS as needed
* Resetting counter when block rotates into an area that no longer has obstacle right below

### Board/Grid Mechanics
Updates dynamically as user moves the block. All movement, whether it's left, right, down, or rotation, updates the board/grid at the pixel (px) level. This ensures that the block's position is accurately reflected in real-time, maintaining a consistent and responsive gameplay experience. By updating the board/grid incrementally with each pixel change, collision detection and block placement are seamless and efficient.

An invisible top row (called `fillerRows` in `gridInfo` obj) allows blocks to rotate at the top of the grid without triggering collision. It's hidden from the player, but ensures smooth rotation mechanics. The traditional Tetris board is 20 cols, but is 21 to account for the invisible row.

### Rotation
Block rotation doesn't modify the block directly. Instead, it replaces the current block with its rotated version

### `topLeftCoor: {}` helps w/ Block Default Positioning and Rotation
The matrix for all blocks is always 4x4 as shown in [blocks_n_kicks.js](https://github.com/dnce17/js_tetris/blob/main/blocks_n_kicks.js).

Example:
```js
"T": [
        [
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
     ]
```
The `topLeftCoor: {}` property inside the `blockInfo` obj is used to correctly position a block after its rotated and when placing a new block in the default position. 

For example, in the case of placing a new block in default position:
```js
for (let row = 0; row < b.block.length; row++) {
    let blockY = b.defaultPos["y"] + row;
    for (let col = 0; col < b.block[row].length; col++) {
        let blockX = b.defaultPos["x"] + col;

        // Save the top-left coor for rotation purposes
        if (row == 0 && col == 0) {
            b.topLeftCoor = {"x": blockX, "y": blockY};
        }

        // Some code
        ...
    }
}
```
`topLeftCoor: {}` provides the reference point for where the 4x4 block matrix should be placed on the grid. In the for loop, the row and col indices iterate over the 4x4 matrix

For each cell in the matrix → calculate blockY and blockX:
* These variables represent the coordinates where each px in the matrix will be positioned. They're calculated by adding the matrix indices (row and col) to the y and x values of topLeftCoor, respectively. This ensures the block is aligned with its intended position on the grid.
```js
let blockY = b.topLeftCoor["y"] + row;
let blockX = b.topLeftCoor["x"] + col;
```
Without topLeftCoor, the matrix would default to being placed at the grid origin (0, 0), which would be incorrect.

### Ghost Placement
The block is always placed on the board first, then the ghost piece take the block's position and falls down from there until it collides with something, which is where the ghost will be placed

### Collision
`getOutermostCoors()` is used to get the outermost coordinates that will be the first to collide with an obstacles. Within that function, `groupByAxis()` categorizes the dictionary (dict) of coordinates by their axis. If the block moves...

* left/right: dicts are categorized by their y-values 
* down: dicts are categorized by x-value. 

`processOutermostCoors()` then identifies the outermost coordinates in the direction of movement from groupbyAxis()'s return value. These outermost coordinates represent the points that would first collide with an obstacle if the block were to continue moving in the specified direction.

### Line Clear
`clearLine()` removes rows from the grid where every item inside is a str (the str being the tetrimino letter names like I, S, O, etc.). The remaining rows move downward to fill the space and the `unshift()` method inserts empty rows at the beginning of the grid until the row count reaches the count specified in the `gridInfo` object's `row` property name. 

### Auto Drop Timer and How Pausing Affects It
```js
// Pause
if (p.pause == false) {
    // Save how much time has passed since the last drop
    g.pausedDropTimer = Date.now() - g.lastAutoDropTime;
    p.pause = true;
    ...
}
// Unpause
else {
    // Adjust lastAutoDropTime to remain the same prior to pausing
    g.lastAutoDropTime = Date.now() - g.pausedDropTimer;
    p.pause = false;
    ...
}
```
When pausing, gridInfo's `pausedDropTimer` gets the time passed since the last drop. After unpausing, `lastAutoDropTime` gets the remaining time that the block had prior to pausing. Without this, the block will always auto drop down immediately after unpausing because the game thinks more than 1 second (sec) has passed.

### Auto Place Counter
In the Tetris ruleset, when a block is touching an obstacle directly below it, the user has more than 1 second to place it while moving it left, right, or rotating it. However, if the user doesn't manually move the block within 1 second, it will still auto-place. To prevent giving the user unlimited time to place the block, a `maxCounter` in `gridInfo` is used. Once the counter is reached, the block is automatically placed.

### Frame Rate
The speed of block movement can be adjust by changing the time in `setTimeout()`. Currently, the time is set to 42. 

### `gameLoop()` and `handleAutoDrop()`
Explanation below is on why I placed the setTimeout() in the if, but not the else of `handleAutoDrop()`

`gameLoop()` contains:
```js
let autoDropResult = handleAutoDrop(b, g, direction, now);
if (autoDropResult.result.toLowerCase() == "auto_placed") {
    return "exit gameLoop";
}
...skip all the way to bottom...

setTimeout(gameLoop, 42, b, g, keyState, player);
```

`handleAutoDrop()` contains:
```js
if (collision) {
    placeBlock(b.ghostPos, b.currentPos, b.typeName, g.grid);
    g.lastAutoDropTime = now;  // Reset drop timer after auto drop
    g.counter = 0;

    setTimeout(gameLoop, 42, b, g, keyState, player);
    return {result: "auto_placed", updatedDirection: direction};
} 
else {
    g.lastAutoDropTime = now;  // Reset timer after moving down automatically
}
```
The `setTimeout()` is placed in the if block, but not the else block of `handleAutoDrop()`, because the if block has a return value that causes `autoDropResult.result.toLowerCase() == "auto_placed"` in `gameLoop()` to evaluate to true. This triggers a return in gameLoop(), exiting it before the setTimeout() at the bottom of gameLoop() can execute. Without the setTimeout() in handleAutoDrop()'s if block, the game loop would not continue, causing the game to freeze.

In contrast, setTimeout() is not needed in the else block because its return value causes autoDropResult.result.toLowerCase() == "auto_placed" in gameLoop() to be false. This allows gameLoop() to continue normally and execute the setTimeout() at the end of the function, ensuring the next loop runs.

### Starting and Restarting the Game
```js
function executeGame(blockInfo, gridInfo, keyState, player) {
    let b = blockInfo, g = gridInfo, p = player;

    createGrid(g.grid, g.rows, g.cols);
    placeBlockDefaultPos(b, g);
    enableCtrls(b, g, keyState, p);
    gameLoop(b, g, keyState, p);
}

function restartGame(blockInfo, gridInfo, player) {
    let b = blockInfo, g = gridInfo, p = player;

    createGrid(g.grid, g.rows, g.cols);
    placeBlockDefaultPos(b, g);

    p.lost = false;
    p.pause = false;  
    
    g.lastAutoDropTime = Date.now();
    g.counter = 0;

    b.bag = Object.keys(blockTypes());
}
```
In `restartGame()`, only `createGrid()` and `placeBlockDefaultPos()` are called because they are "one-and-done" functions that set up the grid and place the block in its default position. The effects of `enableCtrls()` and `gameLoop()` persist beyond their initial invocation, as enableCtrls() continuously listens for input and gameLoop() cycles indefinitely with setTimeout(). Recalling them during a restart would cause issues, such as input lag or multiple overlapping game loops, leading to slower block movement or erratic behavior. For example, during testing, I recalled gameLoop() in restartGame() and that caused major slowdown in block movement with the arrow keys.

### KEY Things to Keep in Mind
1. Passing arrays or dictionaries as parameters passes them by reference, meaning changing their contents inside affects the original object. However, reassigning the arr or dict to a new value within the function does not affect the original object; it only changes the local reference. 

**ANALOGY**: If the original object was a box, changes to the object is saved only if you change the contents inside. It will not save if you replace the box with a new box entirely. 

2. From what I experienced, it seems when debugging, console.log might give you the appearence of the wrong change in pos b/c even if the line showing you the coor is at 375, it will still show you the final change of the coor at line 408 even tho console.log is at 375

When debugging with console.log, it may appear to show incorrect changes in coordinates for position dicts. Even if console.log is placed at an earlier line (e.g., 375), it may display the final state of the coordinates after later code (e.g., line 408) has executed. In other works, both line 375 and 408 shows the final state although 408 was executed later. **This generally happens when altering dicts/objects**, likely because of how (FINISH LATER)

### My Thought Process on Passing Whole Obj as Parameters
I pass whole objects as parameters when a function requires many of their properties or when I need to completely reassign an object property (analogy: replacing the entire box rather than just changing the contents inside).

Inside the functions, I shorten object names (e.g. let b = blockInfo) only if the object is used frequently within that function.

NOTE: I may need to go back to index.js to ensure consistency with this thought process

### `checkBeyondWall()`
There’s no need to check if non-block pxs are out of bounds for `blockX` and `blockY` because they represent empty spaces. Recall that the block structure is always 4x4 and includes empty spaces.

### `testKicks()`
`kickX` and `kickY` in testKicks() don’t need to account for non-block pxs. This is because testKicks() receives `rotatedBlockPos` from `rotateBlock()`, which only contains coordinates for block pxs and excludes empty spaces. rotateBlock() is also the only function that uses testKicks()

### `checkWallCollision()`
Remember this is used to place ghost piece too

### `.blur()` 
```js
restartBtn.addEventListener("click", () => {
    restartGame(b, g, p);
    restartBtn.blur();
});
```
`.blur()` is used to remove focus from the restart button after a click. Without it, pressing the spacebar could inadvertently trigger the button again, restarting the game unintentionally.