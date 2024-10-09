// Block Types
export function blockTypes() {
    let blocks = {
        "T": [
            [
                [0, 1, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
        ],
        "Z": [
            [
                [1, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 1, 0],
                [0, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [1, 1, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 0],
            ],
        ],
        "S": [
            [
                [0, 1, 1, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [1, 0, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
        ],
        "L": [
            [
                [1, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0],
            ],
        ],
        "J": [
            [
                [0, 0, 1, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
            ],
        ],
        "O": [
            [
                [1, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ]
        ],
        
        // NOTE: will require adjust default position if "I"
        "I": [
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
            ],
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ],
        ]
    }

    return blocks;
}

// let kickData = {
//     // Might remove [0, 0] depending on how I work things out
//     // NOTE: - and + of y coors have been reversed b/c the grid's y-axis operates opposite of e.g. in wiki
//     "0->1": [
//         // [0, 0], 
//         [-1, 0], 
//         [-1, -1], 
//         [0, 2], 
//         [-1, 2]
//     ],
//     "1->2": [
//         // [0, 0], 
//         [1, 0], 
//         [1, 1], 
//         [0, -2], 
//         [1, -2]
//     ],
//     "2->3": [
//         // [0, 0], 
//         [1, 0], 
//         [1, -1], 
//         [0, 2], 
//         [1, 2]
//     ],
//     "3->0": [
//         // [0, 0], 
//         [-1, 0], 
//         [-1, 1], 
//         [0, -2], 
//         [-1, -2]
//     ]
// }

let kickData = {
    // Might remove [0, 0] depending on how I work things out
    // NOTE: - and + of y coors have been reversed b/c the grid's y-axis operates opposite of e.g. in wiki
    // 0->1
    1 : [
        // [0, 0], 
        [-1, 0], 
        [-1, -1], 
        [0, 2], 
        [-1, 2]
    ],
    // 1->2
    2 : [
        // [0, 0], 
        [1, 0], 
        [1, 1], 
        [0, -2], 
        [1, -2]
    ],
    // 2->3
    3 : [
        // [0, 0], 
        [1, 0], 
        [1, -1], 
        [0, 2], 
        [1, 2]
    ],
    // 3->0
    0 : [
        // [0, 0], 
        [-1, 0], 
        [-1, 1], 
        [0, -2], 
        [-1, -2]
    ]
}

export function clockwiseKickData() {
    return kickData;
}