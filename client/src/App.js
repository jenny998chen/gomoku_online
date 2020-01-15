import React, { useEffect, useRef, useState } from 'react';
import Messages from './Messages';
import io from "socket.io-client";
import styled from 'styled-components';

let socket = io();

const Login = styled.div`
  text-align:center;
  margin: auto;
  display: inline-block;
  div{
    font-size: 1.3rem;
    font-weight: 600;
    color:rgb(56,56,56);
  }
  input{
    text-align:center;
    font-weight: 500;
    margin:0.6em;
    padding:0.4em 1em;
    border:none;
    border-bottom:2px solid rgb(56,56,56);
  }
  span{
    font-size: 0.85rem;
    display:block;
    color: #D8000C;
  }
`;
function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    socket.on('name', n => {
      setUser(n);
    });
    setUser(socket.id);
    setShowLogin(false);
  }, []);
  function login(name) {
    fetch("/login", {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify({ data: name })
    }).then(res => res.json())
      .then(res => {
        if (res.data) {
          setUser(name);
          socket.emit('add user', name);
          setShowLogin(false);
        } else {
          setErr(true);
        }
      })
  }
  return (
    <>
      {showLogin ?
        <Login>
          <div>What's your name?</div>
          <input onKeyDown={e => { if (e.key === 'Enter') login(e.target.value) }} />
          {err && <span>username already exist! try again</span>}
        </Login>
        :
        <Home user={user} />
      }
    </>
  );
}
const Layout = styled.div`
  height:100%;
  display:grid;
  grid-template-columns:350px 1fr 350px ;
  grid-template-rows:auto 1fr auto;
  overflow: hidden;
  border-right:1px solid #C8C8C8;
`
const Side = styled.aside`
  border-right:1px solid #C8C8C8;
  grid-row: span 2;
  padding:1em 0;
  background:#eff0f1;
`
const Room = styled.aside`
  padding:0.5em 1em;
  ${props => props.active && 'background:lightgrey;'}
  :hover{
    // background:#f1f0f0;
    background:grey;
  }
`

const Head = styled.header`
  padding: 0.6em;
  grid-column: span 3;
  display: flex;
  align-items: center;
  color: white;
  background-color: #2C3E50;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
`;
const Title = styled.div`
  flex-grow:1;
  text-align:center;
  font-weight:600;
  font-size:1.2em;
`;
const Button = styled.button`
  // align-self:flex-end;
  // border-radius: 0.3em;
  background-color: #0084ff;
  color:white;
  padding: 0.5em;
  border:none;
`;
const Footer = styled.div`
  display:flex;
  margin:0.3em;
  input{
    padding:0.2em 0;
  }
`;
function Home({ user }) {
  const [roomInp, setRoomInp] = useState('');
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [moves, setMoves] = useState([]);

  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState([]);
  const [player, setPlayer] = useState(0);
  useEffect(() => {
    fetch("/prev").then(res => res.json())
      .then(res => {
        setRooms(res.rooms);
      })
    socket.on('chat message', msg => {
      setChats(chats => chats.concat(msg));
    });

    socket.on('user joined', data => {
      console.log(data + ' joined');
      console.log(socket.id)
      setChats(chats => chats.concat({ action: 'joined', username: data }));
      setUsers(users => users.concat(data));
    });
    socket.on('user left', data => {
      console.log(data + ' left');
      if (data) {
        setChats(chats => chats.concat({ action: 'left', username: data }));
        setUsers(users => users.filter(i => i !== data));
      }
    });

    socket.on('room added', data => {
      console.log(data);
      setRooms(rooms => rooms.concat(data))
    });
    socket.on('room deleted', data => {
      console.log(data);
      setRooms(rooms => rooms.filter(i => i !== data))
    });
  }, []);


  function joinRoom(r) {
    setRoom(r);
    socket.emit('join room', r);
    fetch("/room", {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify({ data: r })
    }).then(res => res.json())
      .then(res => {
        console.log(res);
        setMoves(res.moves);
        setUsers(res.users);
        setChats(res.chats);
        setPlayer(res.users.length);
      })
    setRoomInp('');
  }
  let inputRef = useRef(null);
  function sendMsg() {
    let input = inputRef.current;
    if (input.textContent) {
      socket.emit('chat message', { username: user, msg: input.textContent });
      setChats(chats.concat({ self: true, username: user, msg: input.textContent }));
      input.innerHTML = '';
    }
  }
  return (
    <Layout>
      <Head>
        <Title>Gomoku Online</Title>
        <div>Guest: {user}</div>
      </Head>
      <Side>
        <Footer>
          <input
            value={roomInp}
            onKeyDown={e => { if (e.key === 'Enter') joinRoom(roomInp) }}
            onChange={e => setRoomInp(e.target.value)} />
          <Button onClick={() => joinRoom(roomInp)}>Join Room</Button>
        </Footer>
        {rooms.map(u => <Room key={u} active={u === room} onClick={() => joinRoom(u)}>{u}</Room>)}
        {/* {users.map(u => <div key={u}>{u}</div>)} */}
      </Side>
      <Canvas player={player} moves={moves} />
      <Messages chats={chats} inputRef={inputRef} sendMsg={sendMsg} />
    </Layout>
  );
}
const Main = styled.main`
  border-right:1px solid #C8C8C8;
  grid-row: span 2;
  display:grid;
`
const Board = styled.canvas`
  // background-color: grey;
  width:720px;
  height:720px;
  margin:auto;
`;

function Canvas({ moves, player }) {
  const canvRef = useRef(null);
  useEffect(() => {
    // console.log('shoud', player)
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
      if (player == 1 || player == 2) {
        turn = t;
        canv.style.cursor = turn ? "auto" : "not-allowed";
      }
    }
    canv.style.cursor = "not-allowed";
    ctx.clearRect(0, 0, canv.width, canv.height);
    ctx.fillStyle = '#2C3E50';
    ctx.translate(0.5, 0.5);
    // ctx.lineWidth = 0.5;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        ctx.strokeRect(x * dim, y * dim, dim, dim);
      }
    }
    for (let m of moves)  makeMove(m);

    canv.addEventListener('mousedown', e => {
      console.log(turn, player)
      if (turn && player && player < 3) {
        let x = (e.offsetX + dim / 2) / dim | 0;
        let y = (e.offsetY + dim / 2) / dim | 0;
        if (0 < x && x < n && 0 < y && y < n) {
          socket.emit("move", { x, y, player })
        }
      }
    });

    socket.on('ready', () => {
      setTurn(player === 1);
    });
    socket.on('user moved', data => {
      setTurn(!turn);
      makeMove(data)
    });
  }, [player]);

  return (
    <Main >
      <Board width="721px" height="721px" ref={canvRef} />
    </Main>
  );
}

export default App;
