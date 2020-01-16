
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Main = styled.main`
  border-right:1px solid #C8C8C8;
  grid-row: span 2;
  display:grid;
`
const Board = styled.canvas`
  // background-color: grey;
  width:720px;
  height:720px;
  margin:0.8em 0;
`;
const Circle = styled.span`
  height: 25px;
  width: 25px;
  background-color: ${p => p.c};
  border-radius: 50%;
  display: inline-block;
`;
const Players = styled.div`
  display: flex;
  justify-content: space-between;
  span{
    vertical-align: middle;
  }
`;
export default function Canvas({ moves, player, users, socket }) {
  const canvRef = useRef(null);
  useEffect(() => {
    let n = 14;
    let turn = false;
    const canv = canvRef.current;
    const ctx = canv.getContext('2d');

    let dim = (canv.width - 1) / n;
    function makeMove(data) {
      const { x, y, player } = data;
      if (player === 1) {
        ctx.fillStyle = '#2C3E50';
      } else if (player === 2) {
        ctx.fillStyle = '#4FBD9C';
      }
      ctx.beginPath();
      ctx.arc(x * dim, y * dim, dim / 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    function setTurn(t) {
      if (player === 1 || player === 2) {
        turn = t;
        canv.style.cursor = turn ? "auto" : "not-allowed";
      }
    }
    canv.style.cursor = "not-allowed";
    ctx.clearRect(0, 0, canv.width, canv.height);
    // if (player) ctx.translate(0.5, 0.5);
    // ctx.lineWidth = 0.5;
    ctx.fillStyle = '#2C3E50';
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        ctx.strokeRect(x * dim, y * dim, dim, dim);
      }
    }
    for (let m of moves) makeMove(m);

    canv.onclick = e => {
      console.log(turn, player)
      if (turn && player && player < 3) {
        let x = (e.offsetX + dim / 2) / dim | 0;
        let y = (e.offsetY + dim / 2) / dim | 0;
        if (0 < x && x < n && 0 < y && y < n) {
          socket.emit("move", { x, y, player })
        }
      }
    }
    socket.on('ready', () => {
      setTurn(player === 1);
      // setReady(true);
    });
    socket.on('user moved', data => {
      setTurn(!turn);
      makeMove(data)
    });
  }, [moves, player]);
  // useEffect(() => {
  //   setReady(false);
  // }, [moves]);

  return (
    <Main >
      <div style={{ margin: 'auto' }}>
        {users.length &&
          <Players>
            <span><Circle c="#2C3E50" /> {users[0]}</span>
            vs
            <span> <Circle c="#4FBD9C" /> {users[1]?users[1]:'Waiting for Opponent . . .'}</span>
          </Players>
        }
        <Board width="721px" height="721px" ref={canvRef} />
      </div>
    </Main>
  );
}