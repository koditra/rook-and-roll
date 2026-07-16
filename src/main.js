import { Chess } from "chess.js";
import { Chessboard, INPUT_EVENT_TYPE, COLOR } from "cm-chessboard/src/Chessboard.js";
import { Arrows } from "cm-chessboard/src/extensions/arrows/Arrows.js";
import { Markers } from "cm-chessboard/src/extensions/markers/Markers.js";

const chess = new Chess();
const statusEl = document.getElementById("status");

function updateStatus() {
  if (chess.isCheckmate()) {
    statusEl.innerText = `Game Over! ${chess.turn() === 'w' ? 'Black' : 'White'} wins by Checkmate!`;
  } else if (chess.isDraw()) {
    statusEl.innerText = "Game Over! Draw game.";
  } else {
    statusEl.innerText = `${chess.turn() === 'w' ? "White" : "Black"}'s Turn`;
  }
}

function inputHandler(event) {
  switch (event.type) {
    case INPUT_EVENT_TYPE.moveInputStarted:
      const piece = chess.get(event.squareFrom);
      return piece && piece.color === chess.turn();

    case INPUT_EVENT_TYPE.validateMoveInput:
      try {
        chess.move({
          from: event.squareFrom,
          to: event.squareTo,
          promotion: "q" 
        });
        return true; 
      } catch (error) {
        return false; 
      }

    case INPUT_EVENT_TYPE.moveInputFinished:
      board.setPosition(chess.fen(), true);
      updateStatus();
      
      setTimeout(() => {
        const nextTurnColor = chess.turn() === 'w' ? COLOR.white : COLOR.black;
        board.setOrientation(nextTurnColor, true);
      }, 400);
      
      break;
  }
}

const board = new Chessboard(document.getElementById("board"), {
  position: chess.fen(),
  assetsUrl: "https://cdn.jsdelivr.net/npm/cm-chessboard@8.12.12/assets/",
  extensions: [
    { class: Markers },
    { class: Arrows }
  ]
});

board.enableMoveInput(inputHandler);
