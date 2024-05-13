/**@type {HTMLCanvasElement} */
const canv = document.querySelector(".canv");
const ctx = canv.getContext("2d");

/** @type {HTMLImageElement} */
const images = [];

const TileState = {
    COVERED: 0,
    MARKED: 1,
    UNCOVERED: 2,
    EXPLODED: 3
}

let gamefield = [];
let width;
let height;
let bombCount;
let isFirstRound = true;
let gameOver = false;
let found = 0;
let wrong = 0;

let loaded = 0;
for (let i = 0; i < 14; i++) {
    const newImg = new Image();
    newImg.src = `UI/${i}.png`;
    images.push(newImg);

    newImg.onload = function() {
        loaded++;
        if (loaded === 14) {
            onImagesLoaded();
        }
    }
}

canv.onclick = function(e) {
    if (gameOver === true) {
        return;
    }

    const mouse = getMouseCoorrrds(e);
    let tile = gamefield[mouse.x][mouse.y];

    if (isFirstRound === true) {
        isFirstRound = false;

        while (
            tile.bomb === true ||
            tile.count > 0
        ) {
            setupField();
            tile = gamefield[mouse.x][mouse.y];
        }
    }

    if (tile.state !== TileState.COVERED) {
        return;
    }

    if (tile.bomb === true) {
        tile.state = TileState.EXPLODED;
        gameOver = true;
        draw(true);

    } else {
        sweep(mouse.x, mouse.y);
        draw();
    }
}

canv.oncontextmenu = function(e) {
    e.preventDefault();
    isFirstRound = false;

    if (gameOver === true) {
        return;
    }

    const mouse = getMouseCoorrrds(e);
    const tile = gamefield[mouse.x][mouse.y];

    if (tile.state === TileState.COVERED) {
        tile.state = TileState.MARKED;

        if (tile.bomb === true) {
            found++;
        } else {
            wrong++;
        }

    } else if (tile.state === TileState.MARKED) {
        tile.state = TileState.COVERED

        if (tile.bomb === true) {
            found--;
        }  else {
            wrong--;
        }
    }

    draw();

    if (found === bombCount && wrong === 0) {
        endGame();
    }
}

function endGame() {
    gameOver =true;

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
    ctx.fillRect(0, 0, canv.width, canv.height);

    ctx.font = "bold 45px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("YOU WIN", canv.width / 2, canv.height / 2);
}

function onImagesLoaded() {
    initGame(9, 9, 10)

    document.querySelector(".bgr").onclick = function() {
        initGame(9, 9, 10)
    }

    document.querySelector(".itr").onclick = function() {
        initGame(16, 16, 40)
    }

    document.querySelector(".exp").onclick = function() {
        initGame(30, 16, 99)
    }
}

function initGame(x, y, bombs) {
    canv.width = x * 30;
    canv.height = y * 30;

    width = x;
    height = y;
    bombCount = bombs
    isFirstRound = true;
    gameOver = false;

    setupField();
    draw();
}

function setupField() {
    gamefield = [];
    for (let i = 0; i < width; i++) {
        gamefield.push([]);         
        for (let j = 0; j < height; j++) {
            gamefield[i].push({
                bomb: false,
                count: 0,
                state: TileState.COVERED
            });
            
        }
        
    }

    let placed = 0;
    while (placed < bombCount) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        if (gamefield[x][y].bomb === false) {
            gamefield[x][y].bomb = true;
            incCount(x, y);
            placed++;
        }
    }

}

function incCount(x, y) {
    // horni rada
    tryInc(x - 1, y - 1);
    tryInc(x, y - 1);
    tryInc(x + 1, y - 1);

    // prostredni rada
    tryInc(x + 1, y);
    tryInc(x - 1, y);

    // spodni rada
    tryInc(x - 1, y + 1);
    tryInc(x, y + 1);
    tryInc(x + 1, y + 1);  
}

function tryInc(x, y) {
    if (x >= 0 && x < width && y >= 0 && y <height) {
        gamefield[x][y].count++
    }
}

function draw(showBombs = false) {
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const tile = gamefield[x][y];

            if (tile.state === TileState.COVERED) {
                if (showBombs === true && tile.bomb === true) {
                    ctx.drawImage(images[13], x * 30, y * 30, 30, 30);
                } else {
                    ctx.drawImage(images[9], x * 30, y * 30, 30, 30);
                }
            } else if (tile.state === TileState.UNCOVERED) {
                if (tile.bomb === true) {
                    ctx.drawImage(images[13], x * 30, y * 30, 30, 30);
                } else {
                    ctx.drawImage(images[tile.count], x * 30, y * 30, 30, 30)
                }
            }  else if (tile.state === TileState.MARKED) {
                if (showBombs === true && tile.bomb === false) {
                    ctx.drawImage(images[12], x * 30, y * 30, 30, 30)
                } else {
                    ctx.drawImage(images[11], x * 30, y * 30, 30, 30)
                }
            }  else if (tile.state === TileState.EXPLODED) {
                ctx.drawImage(images[10], x * 30, y * 30, 30, 30)
            }
        }
    }
}

function getMouseCoorrrds(e) {
    const rect = canv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return {
        x: Math.floor(x / 30),
        y: Math.floor(y / 30)
    };
}

function sweep(x, y) {
    if (
        x < 0 ||
        x > width - 1 ||
        y < 0 ||
        y > height - 1 ||
        gamefield[x][y].state === TileState.UNCOVERED
    ) {
        return;
    }

    gamefield[x][y].state = TileState.UNCOVERED;
    if (gamefield[x][y].count > 0) return; 

    // horni rada
    sweep(x - 1, y - 1);
    sweep(x, y - 1);
    sweep(x + 1, y - 1);

    // prostredni rada
    sweep(x - 1, y);
    sweep(x + 1, y);

    // spodni rada
    sweep(x - 1, y + 1);
    sweep(x, y + 1);
    sweep(x + 1, y + 1);
}