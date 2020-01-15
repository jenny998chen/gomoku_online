import React, { useEffect,useRef, useState,Fragment } from 'react';
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
    <Fragment>
      {showLogin ?
        <Login>
          <div>What's your name?</div>
          <input onKeyDown={e => { if (e.key === 'Enter') login(e.target.value) }} />
          {err && <span>username already exist! try again</span>}
        </Login>
        :
        <Home user={user} />
       }
    </Fragment>
  );
}
const Layout = styled.div`
  height:100%;
  display:grid;
  grid-template-columns:350px 1fr 350px ;
  grid-template-rows:1fr auto;
  overflow: hidden;
  border-right:1px solid #C8C8C8;
`
const Side = styled.aside`
  border-right:1px solid #C8C8C8;
  grid-row: 1 / span 2;
  padding:1em 0;
`
const Room = styled.aside`
  padding:0.5em 1em;
  ${props => props.active && 'background:#f1f0f0;'}
  :hover{
    background:#f1f0f0;
  }
`

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
      <Side><div>Me: {user}</div>
        <input value={roomInp} onKeyDown={e=>{if (e.key === 'Enter')joinRoom(roomInp)}} onChange={e=>setRoomInp(e.target.value)}/>
        <button onClick={()=>joinRoom(roomInp)}>join room</button>
        {rooms.map(u => <Room key={u} active={u===room} onClick={()=>joinRoom(u)}>{u}</Room>)}
        {/* {users.map(u => <div key={u}>{u}</div>)} */}
      </Side>
      <Canvas player={player} moves={moves}/>
      <Messages chats={chats} inputRef={inputRef} sendMsg={sendMsg}/>

    </Layout>
  );
}
const Main = styled.main`
  border-right:1px solid #C8C8C8;
  grid-row: 1 / span 2;
  display:grid;
`
const Board = styled.canvas`
  background-color: green;
  width:840px;
  height:840px;
  margin:auto;
`;

function Canvas({moves,player}){
  const canvRef = useRef(null);
  useEffect(() => {

    console.log('shoud',player)
    let n=14;
    let turn=false;
    const canv = canvRef.current;
    const ctx = canv.getContext('2d');
    
    let dim=canv.width/n;
    function makeMove(data){
      const {x,y,player}=data;
      if(player===1){
        ctx.fillStyle = 'black';
      }else if(player===2){
        ctx.fillStyle = 'white';
      }
      ctx.beginPath();
        ctx.arc(x*dim , y*dim , dim/2.5, 0, 2 * Math.PI);
        ctx.fill(); 
    }
    ctx.clearRect(0, 0, canv.width, canv.height);
    for (let x = 0; x < n; x++){
      for(let y=0; y < n;y++){
        ctx.strokeRect(x*dim ,y*dim ,dim,dim);   
      }     
    }
    
    for(let m of moves){
      makeMove(m) 
    }

    canv.addEventListener('mousedown', e => {
      console.log(turn,player)
      if(turn && player && player<3){
        let x=(e.offsetX+dim/2)/dim|0;
        let y=(e.offsetY+dim/2)/dim|0;
        if(0<x&&x<n && 0<y&&y<n){
          socket.emit("move",{x,y,player})
        }
      }
    });
    socket.on('user moved', data => {
      console.log(data);
      turn^=true;
      console.log(turn);
      makeMove(data)
    });
    socket.on('ready', () => {
      turn=(player===1);
    });
  }, [player]);
  
  return (
    <Main >
        <Board width="840px" height="840px" ref={canvRef}/>
    </Main>
  );
}

export default App;
