"use strict"
import { PlayingBoard } from "./Board.js"
import { Color, Direction, Rotation } from "./components.js"

function randomColor() {
    const rand = Math.floor(Math.random() * 3)
    if (rand == 0) return Color.FIRST
    if (rand == 1) return Color.SECOND
    if (rand == 2) return Color.THIRD
}

class Shape {
    constructor(board) {
        this.board = board
        this.placed = false
    }

    setCenterField(x, y) {
        if (this.board.fields[x][y] === undefined) return
        this.centerField = this.board.fields[x][y]
    }
}

export class Virus extends Shape {
    constructor(board, x, y, color) {
        super(board)
        this.color = color
        this.setCenterField(x, y)
        this.pieces = [
            new ShapePiece(this, this.centerField, this.color),
        ]
        this.pieces[0].place()
    }
}

export class Pill extends Shape {
    constructor(board, color1, color2) {
        super(board)
        if (color1 && color2)
            this.setCenterField(3, 15)
        else
            this.setCenterField(10, 4)
        this.rotation = Rotation.HORIZONTAL
        this.createPieces(color1, color2)
    }

    createPieces(color1, color2) {
        this.pieces = [
            new ShapePiece(this, this.centerField, color1),
            new ShapePiece(this, this.fieldTo(Direction.RIGHT), color2),
        ]
        this.pieces[0].field.setColor(this.pieces[0].color)
        this.pieces[1].field.setColor(this.pieces[1].color)
    }

    fieldTo(direction) {
        const x = this.centerField.x + direction.x
        const y = this.centerField.y + direction.y
        if (x >= this.board.width || y >= this.board.height || x < 0 || y < 0) return false
        return this.board.fields[x][y]
    }

    place() {
        this.placed = true
        for (let piece of this.pieces)
            piece.place()
    }

    canRotate(direction) {
        let futureRotation = this.rotation
        if (direction == Direction.RIGHT)
            if (futureRotation++ == 3) futureRotation = 0
        if (direction == Direction.LEFT)
            if (futureRotation-- == 0) futureRotation = 3

        if (futureRotation == Rotation.HORIZONTAL || futureRotation == Rotation.HORIZONTAL_REVERSED) {
            if (this.centerField.x == this.board.width - 1) {
                if (this.centerField.x == this.board.width - 1) {
                    if (!this.fieldTo(Direction.LEFT).locked)
                        return true
                }
            }
        }
        if (futureRotation == Rotation.HORIZONTAL || futureRotation == Rotation.HORIZONTAL_REVERSED) {
            if (!this.fieldTo(Direction.RIGHT)) return false
            if (this.fieldTo(Direction.RIGHT).locked) return false
        }
        if (futureRotation == Rotation.VERTICAL || futureRotation == Rotation.VERTICAL_REVERSED) {
            if (!this.fieldTo(Direction.UP)) return false
            if (this.fieldTo(Direction.UP).locked) return false
        }
        return true
    }

    rotate(direction) {
        this.moveFromWallIfNeeded()
        if (!this.canRotate(direction)) return false
        this.rotatePieces(direction)
        return true
    }

    rotatePieces(direction) {
        if (direction == Direction.RIGHT)
            if (this.rotation++ == 3) this.rotation = 0
        if (direction == Direction.LEFT)
            if (this.rotation-- == 0) this.rotation = 3

        if (this.rotation == Rotation.HORIZONTAL && this.centerField.x == this.board.width - 1) {
            this.pieces[1].setField(this.fieldTo(Direction.LEFT))
            this.pieces[0].setField(this.centerField)
        } else if (this.rotation == Rotation.HORIZONTAL_REVERSED && this.centerField.x == this.board.width - 1) {
            this.pieces[0].setField(this.centerField)
            this.pieces[1].setField(this.fieldTo(Direction.LEFT))
        } else {
            if (this.rotation == Rotation.VERTICAL) {
                this.pieces[1].setField(this.fieldTo(Direction.UP))
                this.pieces[0].setField(this.centerField)
            } else if (this.rotation == Rotation.HORIZONTAL) {
                this.pieces[1].setField(this.fieldTo(Direction.RIGHT))
                this.pieces[0].setField(this.centerField)
            } else if (this.rotation == Rotation.VERTICAL_REVERSED) {
                this.pieces[0].setField(this.fieldTo(Direction.UP))
                this.pieces[1].setField(this.centerField)
            } else if (this.rotation == Rotation.HORIZONTAL_REVERSED) {
                this.pieces[0].setField(this.fieldTo(Direction.RIGHT))
                this.pieces[1].setField(this.centerField)
            }
        }

    }

    moveFromWallIfNeeded() {
        if (this.rotation == Rotation.VERTICAL || this.rotation == Rotation.VERTICAL_REVERSED) {
            if (this.centerField.x == this.board.width - 1)
                this.move(Direction.LEFT)
            else if (this.fieldTo(Direction.RIGHT).locked)
                this.move(Direction.LEFT)
        }
    }

    canMove(direction) {
        for (let piece of this.pieces)
            if (!piece.canMove(direction))
                return false
        return true
    }

    move(direction) {
        let x = this.centerField.x + direction.x
        let y = this.centerField.y + direction.y
        this.lastMoveDirection = direction
        if (!this.canMove(direction)) return false
        this.setCenterField(x, y)
        this.movePieces(direction)
        return true
    }

    movePieces(direction) {
        let sortedPieces = [...this.pieces]
        if (direction == Direction.LEFT)
            sortedPieces.sort((a, b) => a.field.x - b.field.x)
        if (direction == Direction.RIGHT)
            sortedPieces.sort((a, b) => b.field.x - a.field.x)
        if (direction == Direction.DOWN)
            sortedPieces.sort((a, b) => a.field.y - b.field.y)
        if (direction == Direction.UP)
            sortedPieces.sort((a, b) => b.field.y - a.field.y)
        for (let piece of sortedPieces)
            piece.move(direction)
    }

    moveUntilStopped(direction) {
        if (this.movingInterval !== undefined) return
        this.board.blockInput = true
        this.board.game.stopInterval()
        this.movingInterval = setInterval(() => {
            if (!this.board.currentPill.canMove(direction)) {
                this.board.currentPill.place()
                clearInterval(this.movingInterval)
                this.board.game.startInterval()
                return
            }
            this.board.nextFrame()
        }, 17)
    }
}

class ShapePiece {
    constructor(shape, field, color = randomColor()) {
        this.shape = shape
        this.field = field
        this.color = color
        this.destroyed = false
        this.board = this.shape.board
        this.field.shapePiece = this
        this.field.setColor(this.color)
    }

    move(direction) {
        if (this.destroyed) return false
        let x = this.field.x + direction.x
        let y = this.field.y + direction.y
        if (!this.canMoveTo(x, y)) return false
        this.field.shapePiece = null
        this.field.setColor(Color.NONE)
        this.field = this.board.fields[x][y]
        this.field.shapePiece = this
        this.field.setColor(this.color)
        return true
    }

    setField(field) {
        if (this.destroyed) return false
        this.field.shapePiece = null
        this.field.setColor(Color.NONE)
        this.field = field
        this.field.shapePiece = this
        this.field.setColor(this.color)
    }

    place() {
        if (this.destroyed) return false
        this.board.fields[this.field.x][this.field.y].locked = true
        this.field.shapePiece = this
    }

    canMoveTo(x, y) {
        if (this.destroyed) return false
        if (this.board.outOfBounds(x, y)) return false
        if (this.board.fields[x][y].locked) return false
        return true
    }

    canMove(direction) {
        if (this.destroyed) return false
        if (this.field.locked) return false
        let x = this.field.x + direction.x
        let y = this.field.y + direction.y
        return this.canMoveTo(x, y)
    }
}