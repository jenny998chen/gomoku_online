import React, { useEffect, useRef, useState } from 'react';
import Messages from './Messages';
import Canvas from './Canvas';
import io from "socket.io-client";
import styled from 'styled-components';

let socket = io();

function App() {
  const [user, setUser] = useState('');
  useEffect(() => {
    socket.on('name', n => {
      setUser(n);
    });
    setUser(socket.id);
  }, []);
  return (
    <Home user={user} />
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
  padding:1em 1.5em;
  ${props => props.active &&
    `background:lightgrey;
     pointer-events:none;
    `}
  :hover{
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
  border-radius:0 0.2em 0.2em 0;
  // white-space: nowrap;
`;
const Footer = styled.div`
  display:flex;
  margin:0.3em;
  margin-bottom:0.6em;
  input{
    width:0;
    flex-grow:1;
    padding:0.3em 0.5em;
    border-radius:0.2em 0 0 0.2em;
    border:1px solid lightgrey;
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
    if (r) {
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
        {rooms.map((r, i) =>
          <Room key={r} active={r === room} onClick={() => joinRoom(r)}>
            {i + 1}. {r}
          </Room>
        )}
        {/* {users.map(u => <div key={u}>{u}</div>)} */}
      </Side>
      <Canvas player={player} moves={moves} users={users} socket={socket} />
      <Messages chats={chats} inputRef={inputRef} sendMsg={sendMsg} />
    </Layout>
  );
}

export default App;
