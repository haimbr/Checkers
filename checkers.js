
class CheckersUi {
    constructor(element) {
        this.id = CheckersGameLauncher.gamesCounter;
        this.checkersLogic = new CheckersLogic();
        this.createUiBoard(element);
        this.addEventListeners();
        this.updateUi();
        this.checkedCell = -1;
    }

    createUiBoard(element) {
        let board = "";
        for (let i = 0; i < 64; i++) {
            if (this.isBlackCell(i))
                board += `<div class='black__cell' id="${i + this.id}"></div>`;
            else
                board += `<div class='white__cell' id="${i + this.id}"></div>`;
        }
        element.innerHTML = board;
    }


    updateUi() {
        const BLACK_UI_PIECE = "<div class ='black__piece'></div>";
        const WHITE_UI_PIECE = "<div class ='white__piece'></div>";
        const WHITE_UI_KING = "<div class ='white__piece'>K</div>";
        const BLACK_UI_KING = "<div class ='black__piece'>K</div>";
        let cells = document.querySelectorAll(`.main > #a${this.id} > div`);
        for (let i = 0; i < 64; i++) {
            if (this.checkersLogic.board[i] == null) cells[i].innerHTML = "";
            else if (this.checkersLogic.board[i].whitePiece && this.checkersLogic.board[i].king) cells[i].innerHTML = WHITE_UI_KING;
            else if (this.checkersLogic.board[i].blackPiece && this.checkersLogic.board[i].king) cells[i].innerHTML = BLACK_UI_KING;
            else if (this.checkersLogic.board[i].blackPiece) cells[i].innerHTML = BLACK_UI_PIECE;
            else if (this.checkersLogic.board[i].whitePiece) cells[i].innerHTML = WHITE_UI_PIECE;
        }
        let color = this.checkersLogic.turn ? "white" : "black";
        if (this.checkersLogic.gameStatus == false)
            setTimeout(function () { alert(`the ${color} player won the game`); }, 100);
    }

    addEventListeners() {
        const board = document.querySelector(`.main > #a${this.id}`)
        board.addEventListener('click', (event) => {
            if (event.target.getAttribute('id') * 1 != 0)
                this.handleClickEvent(event.target.getAttribute('id') * 1 - this.id)
            else
                this.handleClickEvent(event.target.parentNode.getAttribute('id') * 1 - this.id)
        })
    }


    handleClickEvent(cell) {
        let cellsToPaint = [];
        if (this.checkedCell < 0 && this.checkersLogic.getPieceColor(cell) == this.checkersLogic.turn) {
            this.checkedCell = cell;
            this.availablePosition(cell, cellsToPaint);
        } else if (this.checkedCell > 0 && this.checkersLogic.isLegalMove(this.checkedCell, cell)) {
            this.checkersLogic.move(this.checkedCell, cell);
            this.checkedCell = -1;
        } else {
            this.checkedCell = -1;
        }
        if (this.checkersLogic.doubleMovesLocation > 0) {
            this.checkedCell = this.checkersLogic.doubleMovesLocation;
            this.availablePosition(cell, cellsToPaint)
        }
        this.updateUi();
        this.paintCells(cellsToPaint);
    }

    availablePosition(cell, cellsToPaint) {
        for (let i = 0; i < 64; i++) {
            if ((this.checkersLogic.board[i] == null && this.checkersLogic.isLegalMove(cell, i)) || i == this.checkedCell)
                cellsToPaint[i] = true;
        }
    }

    paintCells(cellsToPaint) {
        for (let i = 0; i < 64; i++) {
            if (this.isBlackCell(i)) {
                if (cellsToPaint[i] || i == this.checkedCell)
                    document.getElementById(i + this.id).style.backgroundColor = "green";
                else document.getElementById(i + this.id).style.backgroundColor = "SaddleBrown";
            }
        }
    }


    isBlackCell(position) {
        return (Math.floor(position / 8) % 2 == 0 && position % 2 != 0) || (Math.floor(position / 8) % 2 != 0 && position % 2 == 0);
    }
}


class CheckersLogic {
    constructor() {
        this.board = [];
        this.captureMove = false;
        this.gameStatus = true;
        this.turn = true;
        this.doubleMovesLocation = -1;
        this.arrangeJsBoard();
    }

    arrangeJsBoard() {
        for (let i = 0; i < 64; i++) {
            if (this.isBlackCell(i) && i < 24)
                this.board[i] = new DraughtsTool(false, false);
            else if (this.isBlackCell(i) && i > 39)
                this.board[i] = new DraughtsTool(true, false);
            else this.board[i] = null;
        }
    }


    move(location, destination) {
        this.board[destination] = this.board[location];
        this.board[location] = null;
        this.doubleMovesLocation = -1;
        if (Math.abs(location - destination) > 9) {
            this.board[location - ((location - destination) / 2)] = null;
            this.handleDoubleMoves(location, destination);
        }
        // handle cases of promotion to a king.
        if (destination < 8 || destination > 55)
            this.promotion(destination);
        this.updateGameStatus();
        this.turn = !this.turn;
    }


    isLegalMove(location, destination) {
        if (this.board[destination] != null || !this.isBlackCell(destination))
            return false;
        if (this.doubleMovesLocation == -1 && this.isLegalRegularMove(location, destination, this.turn) && !this.isCaptureMoveAvailable(this.turn))
            return true;
        if ((this.doubleMovesLocation == -1 || this.doubleMovesLocation == location) && this.isLegalCaptureMove(location, destination, this.turn))
            return true;
        if (this.board[location].king && this.doubleMovesLocation == -1 && this.isLegalRegularMove(location, destination, !this.turn) && !this.isCaptureMoveAvailable(this.turn))
            return true;
        if (this.board[location].king && (this.doubleMovesLocation == -1 || this.doubleMovesLocation == location) && this.isLegalCaptureMove(location, destination, !this.turn))
            return true;
    }



    isLegalRegularMove(location, destination, color) {
        let left = color ? -7 : 9;
        let right = color ? -9 : 7;
        if (location + left == destination || location + right == destination)
            return true;
    }


    isLegalCaptureMove(location, destination, color) {
        let enemyCell = location - ((location - destination) / 2);
        let left = color ? -7 : 9;
        let right = color ? -9 : 7;
        if ((location + 2 * left != destination && location + 2 * right != destination) || destination > 63 || destination < 0)
            return false;
        if (this.getPieceColor(enemyCell) == !this.getPieceColor(location) && this.board[destination] == null)
            return true;
    }


    isCaptureMoveAvailable(color) {
        for (let i = 0; i < 64; i++) {
            if (this.getPieceColor(i) == color) {
                for (let j = 0; j < 64; j++) {
                    if (this.isBlackCell(j) && Math.abs(i - j) > 9 && this.isLegalMove(i, j))
                        return true;
                }
            }
        }
        return false;
    }

    handleDoubleMoves(location, destination) {
        let colorFactor = (location - destination) > 0 ? -1 : 1;
        if ((this.isLegalMove(destination, destination + (colorFactor * 14)) || this.isLegalMove(destination, destination + (colorFactor * 18)))
            || (this.board[destination].king && this.isLegalMove(destination, destination + -1 * (colorFactor * 14))) || (this.board[destination].king && this.isLegalMove(destination, destination + -1 * (colorFactor * 18)))) {
            this.doubleMovesLocation = destination;
            this.turn = !this.turn;
        }
    }


    promotion(destination) {
        this.board[destination].king = true;
    }

    updateGameStatus() {
        if (this.doubleMovesLocation != -1)
            return;
        this.turn = !this.turn;
        for (let i = 0; i < 64; i++) {
            if (this.getPieceColor(i) == this.turn) {
                for (let j = 0; j < 64; j++) {
                    if (this.board[j] == null && this.isLegalMove(i, j)) {
                        this.turn = !this.turn;
                        return;
                    }
                }
            }
        }
        this.gameStatus = false;
    }

    isBlackCell(position) {
        return (Math.floor(position / 8) % 2 == 0 && position % 2 != 0) || (Math.floor(position / 8) % 2 != 0 && position % 2 == 0);
    }

    getPieceColor(index) {
        if (this.board[index] == null)
            return;
        return this.board[index].whitePiece;
    }
}


class DraughtsTool {
    constructor(color, isKing) {
        this.whitePiece = color ? true : false;
        this.blackPiece = color ? false : true;
        this.king = isKing;
    }
}


class CheckersGameLauncher {
    constructor(element) {
        CheckersGameLauncher.gamesCounter *= 10;
        this.e1 = document.createElement('div');
        this.e1.setAttribute("id", `a${CheckersGameLauncher.gamesCounter}`);
        element.appendChild(this.e1);
        this.c1 = new CheckersUi(this.e1);
    }
    static gamesCounter = 1;
}

const game = new CheckersGameLauncher(document.body);
