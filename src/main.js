import { Chess } from "chess.js";
import { Chessboard, INPUT_EVENT_TYPE, COLOR } from "cm-chessboard/src/Chessboard.js";
import { Arrows } from "cm-chessboard/src/extensions/arrows/Arrows.js";
import { Markers } from "cm-chessboard/src/extensions/markers/Markers.js";

const chess = new Chess();
const statusEl = document.getElementById("status");
const gameInfoEl = document.getElementById("game-info");

// State
let gameMode = 'none'; // 'offline' or 'online'
let myColor = COLOR.white; 
let isConnected = false;
let peerConnection = null;
const peer = new Peer();

// UI Elements
const landingScreen = document.getElementById("landing-screen");
const appScreen = document.getElementById("app-screen");
const networkMenu = document.getElementById("network-menu");
const appTitle = document.getElementById("app-title");
const dropdownMenu = document.getElementById("dropdown-menu");

// Initialize Board
const board = new Chessboard(document.getElementById("board"), {
  position: chess.fen(),
  assetsUrl: "https://cdn.jsdelivr.net/npm/cm-chessboard@8.12.12/assets/",
  extensions: [{ class: Markers }, { class: Arrows }]
});


// Hamburger Menu Toggle
document.getElementById("hamburger-btn").addEventListener("click", () => {
  dropdownMenu.classList.toggle("hidden");
});

// Close dropdown if clicked outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-wrapper")) {
    dropdownMenu.classList.add("hidden");
  }
});

// Flip Board Button
document.getElementById("flip-board-btn").addEventListener("click", () => {
  const currentOri = board.getOrientation();
  board.setOrientation(currentOri === COLOR.white ? COLOR.black : COLOR.white, true);
  dropdownMenu.classList.add("hidden"); // close menu after clicking
});

// offline button
document.getElementById("btn-offline").addEventListener("click", (e) => {
  const button = e.currentTarget;

  button.classList.add("pressed");

  setTimeout(() => {
    gameMode = "offline";

    landingScreen.classList.remove("active");
    appScreen.classList.add("active");

    appTitle.innerText = "Offline Match";
    updateStatus();

    button.classList.remove("pressed");
  }, 150);
});


// online button

document.getElementById("btn-online").addEventListener("click", (e) => {
  const button = e.currentTarget;

  button.classList.add("pressed");

  setTimeout(() => {
    gameMode = "online";

    landingScreen.classList.remove("active");
    appScreen.classList.add("active");

    networkMenu.classList.remove("hidden");
    appTitle.innerText = "Online Match";

    updateStatus();

    button.classList.remove("pressed");
  }, 150);
});

// Game Logic below

function updateStatus() {
  if (gameMode === 'online' && !isConnected) {
    statusEl.innerText = "Waiting for opponent...";
    return;
  }
  
  if (chess.isCheckmate()) {
    statusEl.innerText = `Game Over! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
  } else if (chess.isDraw()) {
    statusEl.innerText = "Game Over! Draw.";
  } else {
    if (gameMode === 'offline') {
      statusEl.innerText = `${chess.turn() === 'w' ? "White" : "Black"}'s Turn`;
    } else {
      const turnColor = chess.turn() === 'w' ? COLOR.white : COLOR.black;
      statusEl.innerText = turnColor === myColor ? "Your Turn!" : "Opponent's Turn...";
    }
  }
}

function inputHandler(event) {
  if (gameMode === 'online' && !isConnected) return false;

  switch (event.type) {
    case INPUT_EVENT_TYPE.moveInputStarted:
      const piece = chess.get(event.squareFrom);
      const pieceColor = piece ? (piece.color === 'w' ? COLOR.white : COLOR.black) : null;
      const turnColor = chess.turn() === 'w' ? COLOR.white : COLOR.black;
      
      // Basic rule: can only move the piece of the current turn
      if (pieceColor !== turnColor) return false;

      // Online rule: can only move if it's actually your assigned color
      if (gameMode === 'online' && pieceColor !== myColor) return false;
      
      return true;

    case INPUT_EVENT_TYPE.validateMoveInput:
      try {
        chess.move({ from: event.squareFrom, to: event.squareTo, promotion: "q" });
        return true; 
      } catch (error) {
        return false; 
      }

    case INPUT_EVENT_TYPE.moveInputFinished:
      board.setPosition(chess.fen(), true);

      if (gameMode === "offline") {
        board.setOrientation(
          chess.turn() === "w" ? COLOR.white : COLOR.black,
          true
        );
      }

  updateStatus();

  if (gameMode === "online" && peerConnection) {
    peerConnection.send(chess.fen());
  }
  break;
  }
}

board.enableMoveInput(inputHandler);

function setupNetworkListeners(conn) {
  peerConnection = conn;
  conn.on('open', () => {
    isConnected = true;
    gameInfoEl.innerText = "Connected! Game Started.";
    updateStatus();
  });
  conn.on('data', (fenData) => {
    chess.load(fenData);
    board.setPosition(fenData, true);
    updateStatus();
  });
}

document.getElementById('host-btn').addEventListener('click', () => {
  myColor = COLOR.white;
  board.setOrientation(COLOR.white);
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const hostPeer = new Peer(roomCode);
  
  hostPeer.on('open', (id) => {
    gameInfoEl.innerText = `Tell friend to join ID: ${id}`;
  });
  hostPeer.on('connection', (conn) => {
    setupNetworkListeners(conn);
  });
});

document.getElementById('join-btn').addEventListener('click', () => {
  const joinId = document.getElementById('join-id').value.toUpperCase();
  if (!joinId) return;
  myColor = COLOR.black;
  board.setOrientation(COLOR.black); 
  gameInfoEl.innerText = `Connecting to ${joinId}...`;
  const conn = peer.connect(joinId);
  setupNetworkListeners(conn);
});
