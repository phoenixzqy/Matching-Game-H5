const STATUS = {
    EMPTY_CELL: "empty",
    MATCHED: "matched",
    UNMATCHED: "unmatched",
};
const EMPTY_VALUE = '*';
const MAX_TURNS = 2;
/**
 * a collection of helpers
 */
const helpers = {
    shuffle: function (a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    },
    calculateTurns: function (path) {
        var turns = 0;
        if (path.length <= 2) {
            console.log("calculateTurns", 0);
            return turns;
        }
        for (var i = 2; i < path.length; i++) {
            // compare current one with previous 2

            if (
                (path[i - 2].x === path[i - 1].x && path[i].x !== path[i - 1].x) ||
                (path[i - 2].y === path[i - 1].y && path[i].y !== path[i - 1].y)
            ) turns++;
        }
        return turns;
    },

};

function Coordinate(x, y) {
    this.x = x;
    this.y = y;
    this.isEqual = function (pair) {
        return this.x === pair.x && this.y === pair.y;
    };
}
/**
 * A cell object
 * @param {*} coordinate
 * @param {*} value 
 * @param {*} status 
 * @param {*} element 
 */
function Cell(coordinate, value, status, element) {
    this.coordinate = coordinate;
    this.value = value;
    this.element = element;
    this.status = status;
// TODO: listen setter of status to change element.
    this.shouldShow = function () {
        return this.status === STATUS.UNMATCHED;
    };
    this.isMatched = function (pair) {
        if (this.value !== EMPTY_VALUE, this.value === pair.value) {
            return true;
        } else {
            return false;
        }
    };
    this.isWalkable = function () {
        return this.status === STATUS.EMPTY_CELL || this.status === STATUS.MATCHED;
    };
    this.matched = function () {
        this.status = STATUS.MATCHED;
    };

    this.isEqual = function (cell1, cell2) {
        return cell1.coordinate.isEqual(cell2.coordinate);
    }
}


/**
 * game object
 * @param {*} m 
 * @param {*} n 
 */
function Game(m, n) {
    this.m = m;
    this.n = n;
    this.map = [];
    this.selectedNode = null;
    this.start = function () {
        this.generateMap();
    };
    // TODO: need to guarantee the game is always has at least one solution.
    // Maybe create a BOT to solve it after the map generated?
    this.generateMap = function () {
        if (!this.m) this.m = 10;
        if (!this.n) this.n = 10;
        this.map = []; // clear old map
        var tableNode = document.querySelector("#map");
        tableNode.innerHTML = ""; // clear old map

        // create an array of m * n / 2 numbers
        var arr = [];
        for (var i = 0; i < m * n / 2; i++) {
            arr.push(i);
        }
        arr = arr.concat(arr); // double the size of values
        // shuffle the array into random order
        arr = helpers.shuffle(arr);
        // fill numbers into the 2d map with borders
        // *********   ===> m + 3 columns, and n + 3 rows
        // *vvv*vvv*         
        // *vvv*vvv*
        // *********
        // *vvv*vvv*
        // *vvv*vvv*
        // *********
        // number of v is m * n, star is map border consist of empty cell
        var index = 0;
        for (x = 0; x < (m + 3); x++) {
            this.map[x] = []; // create one row
            var rowNode = document.createElement("tr");
            for (y = 0; y < (n + 3); y++) {
                var value, status;
                if (
                    x === 0 ||
                    y === 0 ||
                    x === m + 2 ||
                    y === n + 2 ||
                    x === parseInt((m + 2) / 2) ||
                    y === parseInt((n + 2) / 2)
                ) {
                    value = EMPTY_VALUE;
                    status = STATUS.EMPTY_CELL;
                } else {
                    value = arr[index++];
                    status = STATUS.UNMATCHED;
                }
                var cellNode = this.createCellNode(x, y, value, status);
                this.map[x][y] = new Cell(new Coordinate(x, y), value, status, cellNode);
                rowNode.appendChild(cellNode);
            }
            tableNode.appendChild(rowNode);
        }
    };
    this.createCellNode = function (x, y, value, status) {
        var that = this;
        // TODO: add events, and etc...
        var node = document.createElement("td");
        node.setAttribute('x', x);
        node.setAttribute('y', y);
        node.setAttribute('value', value);
        node.setAttribute('status', status);
        node.innerText = value;
        node.addEventListener('click', function (event) {
            if (this.getAttribute('status') != STATUS.UNMATCHED) {
                return;
            }
            if (!that.selectedNode) {
                // select the first one
                that.selectedNode = this;
                // TODO: css
            } else if (that.selectedNode !== this) {
                // select the second one, and try to match both
                var x1 = parseInt(that.selectedNode.getAttribute('x'));
                var y1 = parseInt(that.selectedNode.getAttribute('y'));
                var x2 = parseInt(this.getAttribute('x'));
                var y2 = parseInt(this.getAttribute('y'));
                var cell1 = that.map[x1][y1];
                var cell2 = that.map[x2][y2];

                if (that.matchTwoCells(cell1, cell2)) {
                    // matched, then hide both cells from map
                    console.log("matched");
                } else {
                    console.log("unmatched");
                    // unmatched, cancel the selection
                    // TODO: css
                }
                that.selectedNode = null;
            }
        })
        return node;
    };

    // game logic/controller
    this.matchTwoCells = function (cell1, cell2) {
        if(cell1.isMatched(cell2)) {
            return this.findPathRecursively(cell1.coordinate, cell1.coordinate, cell2.coordinate, []);
        }
        return false;
    };
    // helper method to recursively find the path with at most 2 turns
    this.findPathRecursively = function (last, current, target, path) {
        var deepCopiedPath = [];
        path.forEach(item => {
            deepCopiedPath.push(new Coordinate(item.x, item.y))
        });
        deepCopiedPath.push(new Coordinate(current.x, current.y));
        var turns = helpers.calculateTurns(deepCopiedPath);
        // if reach the out of border or turns too many times
        if (
            turns > MAX_TURNS ||
            current.x >= this.m + 3 || current.x < 0 ||
            current.y >= this.n + 3 || current.y < 0
        ) return false;
        // if 2 are not matched
        var currentCell = this.map[current.x][current.y];
        var targetCell = this.map[target.x][target.y];
        if (targetCell.status === STATUS.UNMATCHED && current.isEqual(target)) {
            // reach the target coordinate, then try to match cells
            if (currentCell.isMatched(targetCell))
                console.log("Found the path: ", deepCopiedPath);
            return currentCell.isMatched(targetCell);
        } else if (!current.isEqual(last) && !currentCell.isWalkable()) {
            console.log("current", currentCell, currentCell.isWalkable())
            return false;
        } else {
            // continue
            var directions = [
                new Coordinate(current.x, current.y + 1), // top
                new Coordinate(current.x, current.y - 1), // bottom
                new Coordinate(current.x - 1, current.y), // left
                new Coordinate(current.x + 1, current.y), // right
            ];
            for (var d in directions) {
                if (last.isEqual(directions[d])) {
                    continue;
                }
                if (this.findPathRecursively(current, directions[d], target, deepCopiedPath)) {
                    return true;
                }
            }
            return false;
        }
    };
    // for testing
    this.printMap = function () {
        var mapStr = "";
        this.map.forEach(r => {
            r.forEach(cell => {
                // the print format is simply for m*n/2 < 100;
                mapStr += ' ' + cell.value + ' '.repeat(cell.value >= 10 ? 1 : 2);
            });
            mapStr += "\n";
        });
        console.log(mapStr);
    };
}

// Main
var game = new Game(8, 6);
game.start();
game.printMap(); // testing