const STATUS = {
  EMPTY_CELL: "empty",
  MATCHED: "matched",
  UNMATCHED: "unmatched"
};
const EMPTY_VALUE = "O";
const MAX_TURNS = 2;
const GAME_SIZE = [8, 6];
const DICTIONARY = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
];
const ROAD_BG_COLOR = "#effbff";
var COLOR_SET = [];
for (var i = 0; i < DICTIONARY.length; i++) {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var c = 0; c < 6; c++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  COLOR_SET.push(color);
}
/**
 * a collection of helpers
 */
const helpers = {
  shuffle: function(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  },
  calculateTurns: function(path) {
    var turns = 0;
    if (path.length <= 2) {
      return turns;
    }
    for (var i = 2; i < path.length; i++) {
      // compare current one with previous 2

      if (
        (path[i - 2].x === path[i - 1].x && path[i].x !== path[i - 1].x) ||
        (path[i - 2].y === path[i - 1].y && path[i].y !== path[i - 1].y)
      )
        turns++;
    }
    return turns;
  },
  animation: {
    road(cell) {
      if (!cell) return;
      cell.node.innerHTML = EMPTY_VALUE;
      cell.node.className = "road";
      cell.node.style.backgroundColor = ROAD_BG_COLOR;
    },
    cell(cell) {
      if (!cell) return;
      cell.node.innerHTML = cell.value;
      cell.node.className = "cell";
    },
    path(cell) {
      if (!cell) return;
      cell.node.className = "road path";
    },
    selected(cell) {
      if (!cell) return;
      cell.node.className = "cell selected";
    },
    generateCell(cell) {
      if (!cell) return;
      if (cell.isWalkable()) {
        cell.node.innerHTML = EMPTY_VALUE;
        cell.node.className = "road";
      } else {
        cell.node.innerHTML = cell.value;
        cell.node.className = "cell";
        cell.node.style.backgroundColor =
          COLOR_SET[DICTIONARY.indexOf(cell.value)];
      }
    }
  }
};

function Coordinate(x, y) {
  this.x = x;
  this.y = y;
  this.isEqual = function(pair) {
    return this.x === pair.x && this.y === pair.y;
  };
}
/**
 * A cell object
 * @param {*} coordinate
 * @param {*} value
 * @param {*} status
 * @param {*} node
 */
function Cell(coordinate, value, status, node) {
  this.coordinate = coordinate;
  this.value = value;
  this.status = status;
  this.node = node;
  this.shouldShow = function() {
    return this.status === STATUS.UNMATCHED;
  };
  this.isMatched = function(pair) {
    if ((this.value !== EMPTY_VALUE, this.value === pair.value)) {
      return true;
    } else {
      return false;
    }
  };
  this.isWalkable = function() {
    return this.status === STATUS.EMPTY_CELL || this.status === STATUS.MATCHED;
  };
  this.matched = function() {
    this.status = STATUS.MATCHED;
  };

  this.isEqual = function(cell1, cell2) {
    return cell1.coordinate.isEqual(cell2.coordinate);
  };
}

/**
 * A robot player which can play the game and determine if the game has solution
 * @param {*} game
 */
function Bot(game) {
  this.game = new Game().clone(game); // clone a standalone game to play.
  this.iterator = new Coordinate(1, 0);
  // a bot which can play the game and find out if the map has solution
  this.hasSolution = function() {
    if (this.game.map.length === 0) {
      console.log("BOT: Ahh, I can NOT play an Empty game. :(");
      return false;
    }
    do {
      this.matchOne();
    } while (
      this.iterator.x < this.game.m + 2 &&
      this.iterator.y < this.game.n + 2
    );
    console.log("Paris left: " + this.game.pairsLeft());
    return this.game.pairsLeft() === 0;
  };
  this.matchOne = function() {
    // find the first unmatched cell, and the cell with the same value
    var cell1, cell2;
    loop1: for (var x = this.iterator.x; x < this.game.map.length; x++) {
      loop2: for (var y = 1; y < this.game.map[x].length; y++) {
        if (x === this.iterator.x && y <= this.iterator.y) continue loop2;
        if (!cell1) this.setIterator(x, y);
        if (!cell1 && this.game.map[x][y].status === STATUS.UNMATCHED) {
          cell1 = this.game.map[x][y];
          continue loop2;
        }
        if (!cell2 && cell1 && cell1.value === this.game.map[x][y].value) {
          cell2 = this.game.map[x][y];
          break loop1;
        }
      }
    }
    // try to match them
    if (cell1 && cell2) {
      if (this.game.matchTwoCells(cell1, cell2)) {
        this.setIterator(1, 0);
        cell1.matched();
        cell2.matched();
      }
    }
  };
  this.setIterator = function(x, y) {
    this.iterator.x = x;
    this.iterator.y = y;
  };
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
  this.selectedCell = null;
  this.lastPath = [];
  this.start = function() {
    var tryCounter = 0;
    do {
      tryCounter++;
      console.log("Bot: try " + tryCounter + " time.");
      this.generateMap();
    } while (!new Bot(this).hasSolution() && tryCounter < 10);
    console.log("Try " + tryCounter + " time(s) to create this map.");
    this.drawMap();
    this.drawBoard();
  };
  this.generateMap = function() {
    if (!this.m) this.m = 10;
    if (!this.n) this.n = 10;
    this.map = []; // clear old map

    // create an array of m * n / 2 numbers
    var arr = [];
    for (var i = 0; i < (m * n) / 2; i++) {
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
    for (x = 0; x < m + 3; x++) {
      this.map[x] = []; // create one row
      for (y = 0; y < n + 3; y++) {
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
        var cellNode = this.createCellNode(x, y, DICTIONARY[value], status);
        var cell = new Cell(
          new Coordinate(x, y),
          DICTIONARY[value],
          status,
          cellNode
        );
        helpers.animation.generateCell(cell);
        this.map[x][y] = cell;
      }
    }
  };
  // TODO: need to guarantee the game is always has at least one solution.
  // Maybe create a BOT to solve it after the map generated?
  this.drawMap = function() {
    var tableNode = document.querySelector("#map");
    tableNode.innerHTML = ""; // clear old map
    for (x = 0; x < this.map.length; x++) {
      var rowNode = document.createElement("tr");
      for (y = 0; y < this.map[x].length; y++) {
        rowNode.appendChild(this.map[x][y].node);
      }
      tableNode.appendChild(rowNode);
    }
  };
  this.drawBoard = function() {
    document.querySelector("#pairs-left").innerHTML = this.pairsLeft();
  };
  this.createCellNode = function(x, y, value, status) {
    var that = this;
    // TODO: add events, and etc...
    var node = document.createElement("td");
    node.setAttribute("x", x);
    node.setAttribute("y", y);
    node.setAttribute("value", value);
    node.setAttribute("status", status);
    node.innerText = value;
    if (value !== EMPTY_VALUE) {
      node.addEventListener("click", function(event) {
        var currentCell =
          that.map[parseInt(this.getAttribute("x"))][
            parseInt(this.getAttribute("y"))
          ];
        if (currentCell.isWalkable()) return;
        if (!that.selectedCell) {
          // select the first one
          helpers.animation.selected(currentCell);
          that.selectedCell = currentCell;
        } else if (that.selectedCell !== currentCell) {
          // select the second one, and try to match both

          if (that.matchTwoCells(that.selectedCell, currentCell)) {
            // console.log("matched");
            // matched, then hide both cells from map
            that.selectedCell.matched();
            currentCell.matched();
            // animations
            helpers.animation.road(that.selectedCell);
            helpers.animation.road(currentCell);
            // show valid path, ignoring the first and last one
            for (var i = 1; i < that.lastPath.length - 1; i++) {
              var tempCell = that.map[that.lastPath[i].x][that.lastPath[i].y];
              helpers.animation.path(tempCell);
            }
            setTimeout(() => {
              for (var i = 1; i < that.lastPath.length - 1; i++) {
                var tempCell = that.map[that.lastPath[i].x][that.lastPath[i].y];
                helpers.animation.road(tempCell);
              }
            }, 300);
            // update pairs left board
            that.drawBoard();
          } else {
            helpers.animation.cell(that.selectedCell);
          }
          that.selectedCell = null;
        }
      });
    }
    return node;
  };

  // game logic/controller
  this.matchTwoCells = function(cell1, cell2) {
    if (cell1.isMatched(cell2)) {
      return this.findPathRecursively(
        cell1.coordinate,
        cell1.coordinate,
        cell2.coordinate,
        []
      );
    }
    return false;
  };
  // helper method to recursively find the path with at most 2 turns
  this.findPathRecursively = function(last, current, target, path) {
    var deepCopiedPath = [];
    path.forEach(item => {
      deepCopiedPath.push(new Coordinate(item.x, item.y));
    });
    deepCopiedPath.push(new Coordinate(current.x, current.y));
    var turns = helpers.calculateTurns(deepCopiedPath);
    // if reach the out of border or turns too many times
    if (
      turns > MAX_TURNS ||
      current.x >= this.m + 3 ||
      current.x < 0 ||
      current.y >= this.n + 3 ||
      current.y < 0
    )
      return false;
    // if 2 are not matched
    var currentCell = this.map[current.x][current.y];
    var targetCell = this.map[target.x][target.y];
    if (targetCell.status === STATUS.UNMATCHED && current.isEqual(target)) {
      // reach the target coordinate, then try to match cells
      if (currentCell.isMatched(targetCell)) {
        // console.log("Path: ", deepCopiedPath);
        this.lastPath = deepCopiedPath;
      } else {
        this.lastPath = [];
      }
      return currentCell.isMatched(targetCell);
    } else if (!current.isEqual(last) && !currentCell.isWalkable()) {
      return false;
    } else {
      // continue
      var directions = [
        new Coordinate(current.x, current.y + 1), // top
        new Coordinate(current.x, current.y - 1), // bottom
        new Coordinate(current.x - 1, current.y), // left
        new Coordinate(current.x + 1, current.y) // right
      ];
      for (var d in directions) {
        if (last.isEqual(directions[d])) {
          continue;
        }
        if (
          this.findPathRecursively(
            current,
            directions[d],
            target,
            deepCopiedPath
          )
        ) {
          return true;
        }
      }
      return false;
    }
  };

  this.pairsLeft = function() {
    var count = 0;
    for (var x in this.map) {
      for (var y in this.map[x]) {
        if (this.map[x][y].status === STATUS.UNMATCHED) {
          count++;
        }
      }
    }
    return count / 2;
  };
  // for testing
  this.printMapToConsole = function() {
    var mapStr = "";
    this.map.forEach(r => {
      r.forEach(cell => {
        // the print format is simply for m*n/2 < 100;
        mapStr += " " + cell.value + " ".repeat(cell.value >= 10 ? 1 : 2);
      });
      mapStr += "\n";
    });
    console.log(mapStr);
  };

  this.clone = function(game) {
    this.m = game.m;
    this.n = game.n;
    // deep copy the map
    for (var x in game.map) {
      this.map.push([]);
      for (var y in game.map[x]) {
        this.map[x].push(
          new Cell(
            new Coordinate(
              game.map[x][y].coordinate.x,
              game.map[x][y].coordinate.y
            ),
            game.map[x][y].value,
            game.map[x][y].status,
            game.map[x][y].node // note, Node here is shallow copy
          )
        );
      }
    }
    return this;
  };
}

// Main
var game = new Game(GAME_SIZE[0], GAME_SIZE[1]);
game.start();
// game.printMapToConsole(); // testing
