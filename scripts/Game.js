"use strict"
import { PlayingBoard } from "./Board.js"
import { Color, DELAY } from "./components.js"


export default class Game extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        this.createBoard()
        this.setBg()
        this.createDancingViruses()
        this.startInterval()
    }

    createBoard(level, score) {
        this.board = new PlayingBoard(this, level, score)
        this.append(this.board)
    }
    createDancingViruses() {
        if (this.dancingViruses)
            this.dancingViruses.destroy()
        this.dancingViruses = new DancingViruses(this)
    }

    startInterval() {
        this.interval = setInterval(() => {
            this.board.nextFrame()
        }, DELAY.frame)
    }

    stopInterval() {
        clearInterval(this.interval)
    }

    nextStage() {
        this.board.blockInput = true
        clearInterval(this.interval)
        this.stageCompletedImg = document.createElement("img")
        this.stageCompletedImg.src = this.getScSrc()
        this.stageCompletedImg.id = 'sc'
        this.appendChild(this.stageCompletedImg)
        let clickedOnce = false
        setTimeout(() => {
            this.nextStageListen = document.addEventListener("keydown", () => {
                if (clickedOnce) return
                clickedOnce = true
                this.stageCompletedImg.remove()
                const lastLevel = this.board.level
                const score = this.board.score
                this.board.destroy()
                this.setBg(lastLevel + 1)
                this.createBoard(lastLevel + 1, score)
                this.createDancingViruses()
                this.startInterval()
            }, { once: true })
        }, DELAY.nextStageListener)
    }

    endGame() {
        this.board.blockInput = true
        clearInterval(this.interval)
        this.gameOverMario = document.createElement("img")
        this.gameOverMario.src = './img/go_dr.png'
        this.gameOverMario.id = 'goMario'
        this.appendChild(this.gameOverMario)
        this.gameOverImg = document.createElement("img")
        this.gameOverImg.src = this.getGoSrc()
        this.gameOverImg.id = 'go'
        this.appendChild(this.gameOverImg)
        let clickedOnce = false
        if (this.board.score > this.board.topScore)
            this.board.newTopScore()
        this.dancingViruses.setMode(DancingMode.LAUGHING)
        setTimeout(() => {
            this.gameOverListener = document.addEventListener("keydown", () => {
                if (clickedOnce) return
                clickedOnce = true
                this.gameOverImg.remove()
                this.board.destroy()
                this.createBoard()
                this.setBg()
                this.startInterval()
                this.createDancingViruses()
                this.gameOverMario.remove()
            }, { once: true })
        }, DELAY.endGameListener)
    }

    setBg(level = this.board.level) {
        this.style.backgroundImage = "url('./img/bg" + level % 5 + ".png')"
    }
    getBgSrc(level) {
        return "./img/bg" + (level || this.board.level) % 5 + ".png"
    }
    getGoSrc() {
        return "./img/go" + this.board.level % 5 + ".png"
    }
    getScSrc() {
        return "./img/sc" + this.board.level % 5 + ".png"
    }
}
customElements.define("game-element", Game)


const DancingMode = {
    NORMAL: 0,
    LAYING: 1,
    LAUGHING: 2,
    DEAD: 3,
}

class DancingViruses {
    constructor(game) {
        this.game = game
        this.list = [
            new DancingVirus(this.game, Color.THIRD, 0),
            new DancingVirus(this.game, Color.SECOND, 6),
            new DancingVirus(this.game, Color.FIRST, 12),
        ]
        this.appendToGame()
        this.startAnimation()
    }

    startAnimation() {
        setInterval(() => {
            if (this.anyVirusLaying()) return
            this.nextMove()
        }, 1000);
        setTimeout(() => {
            setInterval(() => {
                this.nextAnimation()
            }, 250);
        }, 125)
    }

    lay(color) {
        this.list.filter(el => el.color == color)[0].setMode(DancingMode.LAYING)
    }

    anyVirusLaying() {
        for (let virus of this.list)
            if (virus.mode == DancingMode.LAYING)
                return true
        return false
    }

    appendToGame() {
        for (let virus of this.list)
            this.game.append(virus)
    }

    nextMove() {
        for (let virus of this.list)
            virus.nextMove()
    }

    nextAnimation() {
        for (let virus of this.list)
            virus.nextAnimation()
    }

    nextAnimationLaying() {
        for (let virus of this.list)
            virus.nextAnimationLaying()
    }

    destroy() {
        for (let virus of this.list)
            virus.remove()
    }

    setMode(mode) {
        for (let virus of this.list)
            virus.setMode(mode)
    }
}

class DancingVirus extends HTMLElement {
    constructor(game, color, currentStep) {
        super()
        this.game = game
        this.color = color
        this.currentStep = currentStep
        this.currentAnimation = 0
        this.currentModeCount = 0
        this.mode = DancingMode.NORMAL
        this.animations = {
            0: [2, 1, 2, 3],
            1: [5, 6],
            2: [2, 4],
            3: [],
        }
        this.steps = [
            { x: 5, y: 0 },
            { x: 4, y: 0 },
            { x: 3, y: 0 },
            { x: 2, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 2 },
            { x: 0, y: 2 },
            { x: 0, y: 3 },
            { x: 1, y: 4 },
            { x: 1, y: 5 },
            { x: 2, y: 5 },
            { x: 3, y: 5 },
            { x: 4, y: 5 },
            { x: 5, y: 5 },
            { x: 6, y: 4 },
            { x: 6, y: 3 },
            { x: 6, y: 2 },
            { x: 6, y: 1 },
        ]
    }

    connectedCallback() {
        this.display()
    }

    display() {
        this.style.left = 2 * 24 + this.getPosition().x * 24 + 'px'
        this.style.top = 14 * 24 + this.getPosition().y * 24 + 'px'
        this.style.backgroundImage = "url('" + this.getImage() + "')"
    }

    getPosition() {
        return this.steps[this.currentStep]
    }

    getImage() {
        if (this.mode == DancingMode.DEAD) return ''
        return "./img/lupa/" + this.color + "/" + this.animations[this.mode][this.currentAnimation] + ".png"
    }

    nextMove() {
        if (this.mode != DancingMode.NORMAL) return
        if (++this.currentStep == this.steps.length) this.currentStep = 0
        this.style.left = 2 * 24 + this.getPosition().x * 24 + 'px'
        this.style.top = 14 * 24 + this.getPosition().y * 24 + 'px'
    }

    nextAnimation() {
        this.currentModeCount++
        if (this.mode == DancingMode.LAYING && this.currentModeCount >= 10) {
            let anyVirusInColor = false
            for (let virus of this.game.board.virusList.filter(el => el.pieces.length != 0))
                if (virus.color == this.color)
                    anyVirusInColor = true
            if (anyVirusInColor)
                this.setMode(DancingMode.NORMAL)
            else
                this.setMode(DancingMode.DEAD)

            return
        }
        if (++this.currentAnimation == this.animations[this.mode].length) this.currentAnimation = 0
        this.style.backgroundImage = "url('" + this.getImage() + "')"
    }

    setMode(mode) {
        if (this.mode == DancingMode.DEAD && mode == DancingMode.LAUGHING) return
        this.mode = mode
        this.currentAnimation = 0
        this.currentModeCount = 0
        if (mode == DancingMode.LAYING)
            this.currentAnimationLaying = 0
    }
}

customElements.define("dancing-virus", DancingVirus)
