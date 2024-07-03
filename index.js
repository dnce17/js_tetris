// FOR LATER USE
// window.addEventListener("keydown", function (e) {
//     let box = document.querySelector(".box");
//     if (e.key == "ArrowDown") {
//         console.log("down arrow clicked")
//         box.style.top = `${box.offsetTop + box.offsetHeight}px`
//     }
// });

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

function createBlocks() {

}


function main() {
    createBoard();
}

main();