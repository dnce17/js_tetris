# Credits
* https://jsfiddle.net/robertc/qVP8r/ 
* https://stackoverflow.com/questions/13691699/styling-every-3rd-item-of-a-list-using-css
* https://stackoverflow.com/questions/12273451/how-to-fix-delay-in-javascript-keydown

# Lesson
* While passing array or dict as parameter passes it as reference (affects original, not copy of it), it doesn't count if you reassign the arr/dict to another array or anything else. It affects original only if you alter the arr/dict directly.

# Notes
* checkBeyondWall() + testKicks()
    * No point in checking if the non-block px is out of bound for blockY and blockY (recall that a block structure is 4x4, which includes empty spaces)
    * kickX and kickY in testKicks() doesn't require a check for non-block px b/c the parameter passes in just the rotatedBlockPos themselves, so there is no empty space to account for
* checkWallCollision
    * Note that this is also used with placing the ghost piece too


CHECKPOINT
* cleaning up the code for resetting last drop time and counter
* TO POSSIBLY CONSIDER or could be important in future:
    * resetting the counter when the user rotates into an area that no longer has obstacle below
        * need to further account for timer abuse if do this

NOTES

-- These 3 items are basically one thing; placeBlock should always be accompanied by the other two
-- Might consider embedding the last 2 codes in placeBlock
placeBlock(blockInfo.ghostPos, blockInfo.currentPos, gridInfo.grid);
gridInfo.lastAutoDropTime = Date.now();
gridInfo.counter = 0;