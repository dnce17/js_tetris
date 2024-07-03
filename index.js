// FOR LATER USE
function addArrowCtrls() {
    window.addEventListener("keydown", function (e) {
        let testCell = document.querySelector(".test-cell");
        if (e.key == "ArrowDown") {
            console.log("down arrow clicked");
            // console.log(`${testCell.offsetLeft}, ${testCell.offsetTop}`);
            testCell.style.top = `${testCell.offsetTop + testCell.offsetHeight}px`;
            // console.log(`${testCell.offsetLeft}, ${testCell.offsetTop}`);
        }

        if (e.key == "ArrowUp") {
            console.log("up arrow clicked");
            testCell.style.top = `${testCell.offsetTop - testCell.offsetHeight}px`;
        }

        if (e.key == "ArrowLeft") {
            console.log("left arrow clicked");
            testCell.style.left = `${testCell.offsetLeft - testCell.offsetWidth}px`;
        }

        if (e.key == "ArrowRight") {
            console.log("right arrow clicked");
            testCell.style.left = `${testCell.offsetLeft + testCell.offsetWidth}px`;
        }
    }); 
}


function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element
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
    addArrowCtrls()
}

main();

// Test functions
function getCoor(cellNum) {
    let cell = document.querySelector(cellNum);
    console.log(cell.offsetLeft);
}

getCoor(".cell-2")