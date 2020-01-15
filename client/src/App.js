import React, { useEffect,useRef, useState,Fragment } from 'react';
import Messages from './Messages';
import io from "socket.io-client";
import styled,{ createGlobalStyle } from 'styled-components';

let socket = io('ws://localhost:3001');

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
    setUser(socket.io.engine.id);
    console.log(socket.io.engine.id)
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
      {/* <GlobalStyle /> */}
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
  div{
    padding:0.5em 1em;
    :hover{
      background:#f1f0f0;
    }
  }
`
const Input = styled.div`
  border-radius: 0.3em;
  border: 1px solid grey;
  padding: 0.5em 1em;
  margin-right:0.5em;
  flex-grow:1;
  :focus {
    border-color: rgb(0,132,180);
  }
  word-break:break-all;
`;
const Footer = styled.div`
  display:flex;
  margin:0.3em;
  // grid-column: 2;
  // grid-row: 2;
`;
const Button = styled.button`
  align-self:flex-end;
  border-radius: 0.3em;
  background-color: green;
  color:white;
  text-transform: uppercase;
  font-weight: 600;
  padding: 0.5em 1em;
  border:none;
`;

function Home({ user }) {
  let inputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [moves, setMoves] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [player, setPlayer] = useState(0);
  useEffect(() => {
    fetch("/prev").then(res => res.json())
      .then(res => {
        setRooms(res.rooms);
      })
    // socket.emit('join room', 'newRoom');
    // socket.emit('add user');
    socket.on('chat message', msg => {
      setChats(chats => chats.concat(msg));
    });

    socket.on('typing', data => {
      console.log(data);
      setTypingUsers(typingUsers => (data.typing && data.username) ?
        typingUsers.concat(data.username) : typingUsers.filter(i => i !== data.username));
    });
    socket.on('user joined', data => {
      console.log(data + ' joined');
      setChats(chats => chats.concat({ action: 'joined', username: data }));
      setUsers(users => users.concat(data));
    });
    socket.on('user left', data => {
      console.log(data + ' left');
      if (data) {
        setChats(chats => chats.concat({ action: 'left', username: data }));
        setUsers(users => users.filter(i => i !== data));
        setTypingUsers(typingUsers.filter(i => i !== data))
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

  function sendMsg() {
    setTyping(false);
    let input = inputRef.current;
    if (input.textContent) {
      socket.emit('chat message', { username: user, msg: input.textContent });
      setChats(chats.concat({ self: true, username: user, msg: input.textContent }));
      input.innerHTML = ''
    }
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMsg();
    } else if (!typing) setTyping(true);
  }
  function createRoom(e) {
    if (e.key === 'Enter') {
      socket.emit('join room', e.target.value);
      fetch("/room", {
        headers: { 'Content-Type': 'application/json' },
        method: "POST",
        body: JSON.stringify({ data: e.target.value })
      }).then(res => res.json())
        .then(res => {
          console.log(res);
          setMoves(res.moves);
          setUsers(res.users);
          setChats(res.chats);
          setPlayer(res.users.length);
        })
    }
  }
  return (
    <Layout>
      <Side><div>Me: {user}</div>
        <input onKeyDown={createRoom}/>
        <button onClick={createRoom}>join room</button>
        {rooms.map(u => <div key={u}>{u}</div>)}
        {/* {users.map(u => <div key={u}>{u}</div>)} */}
      </Side>
      <Canvas player={player} moves={moves}/>
      <Messages typingUsers={typingUsers} chats={chats} />
      <Footer>
        <Input
          ref={inputRef}
          contentEditable
          onKeyDown={handleKeyDown}
          // onBlur={() => setTyping(false)}
        />
        <Button onClick={sendMsg}>
          send
        </Button>
      </Footer>
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
  let n=14;
  useEffect(() => {
    console.log('shoud',player)
    let turn=false;
    const canv = canvRef.current;
    const ctx = canv.getContext('2d');
    
    let dim=canv.width/n;
    
    ctx.clearRect(0, 0, canv.width, canv.height);
    let ar=[];
    for (let x = 0; x < n; x++){
      ar[x] = []; 
      for(let y=0; y < n;y++){
        ctx.strokeRect(x*dim ,y*dim ,dim,dim);   
      }     
    }
    
    for(let {x,y,player} of moves){
      if(player==1){
        ctx.fillStyle = 'black';
      }else if(player==2){
        ctx.fillStyle = 'white';
      }
      ctx.beginPath();
        ctx.arc(x*dim , y*dim , dim/2.5, 0, 2 * Math.PI);
        ctx.fill(); 
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
      const {x,y,player}=data;
      if(player==1){
        ctx.fillStyle = 'black';
      }else if(player==2){
        ctx.fillStyle = 'white';
      }
      ctx.beginPath();
        ctx.arc(x*dim , y*dim , dim/2.5, 0, 2 * Math.PI);
        ctx.fill(); 
    });
    socket.on('ready', () => {
      turn=(player==1);
    });
  }, [player]);
  return (
    <Main >
        <Board width="840px" height="840px" ref={canvRef}/>
    </Main>
  );
}

// function App() {
//   useEffect(() => {
//     socket.emit("test")
//     socket.on("test", data => console.log(data));
//     fetch("/login")
//         .then(res => res.text())
//         .then(res => console.log(res));
//   }, []);
//   return (
//     <div className="App">
//       gomoku
//     </div>
//   );
// }

export default App;
