"use strict"

export const Color = {
    NONE: "",
    FIRST: "bl",
    SECOND: "br",
    THIRD: "yl",
}

export const Direction = {
    UP: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    DOWN: { x: 0, y: -1 },
    RIGHT: { x: 1, y: 0 },
}

export const Rotation = {
    VERTICAL: 0,
    HORIZONTAL: 1,
    VERTICAL_REVERSED: 2,
    HORIZONTAL_REVERSED: 3,
}

export const DELAY = {
    frame: 600,
    readInput: 166,
    nextStage: 100,
    gameOver: 100,
    nextStageListener: 2500,
    endGameListener: 1000,
    throwFrame: 25,
    gravitation: 90,
    oxDisappear: 175,
}