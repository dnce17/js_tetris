export function deepCopy(item) {
    return JSON.parse(JSON.stringify(item));
}

export function createEleWithCls(ele, clsArr) {
    let element = document.createElement(ele);

    for (let item of clsArr) {
        element.classList.add(item);
    }

    return element;
}