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
  grid-template-columns:280px 1fr;
  grid-template-rows:1fr auto;
  overflow: hidden;
  // max-width:1100px;
  border-right:1px solid #C8C8C8;
`
const Side = styled.aside`
  border-right:1px solid #C8C8C8;
  grid-row: span 2;
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
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  useEffect(() => {
    fetch("/prev").then(res => res.json())
      .then(res => {
        setChats(res.chats);
      })
    socket.emit('join room', 'newRoom');
    // socket.emit('add user');
    socket.on('chat message', msg => {
      setChats(chats => chats.concat(msg));
    });
    socket.on('prev', m => {
      console.log('m', m)
      setChats(m.chats);
      setUsers(m.users);
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
    socket.on('updatechat', data => {
      console.log(data);
    });
  }, []);

  useEffect(() => {
    socket.emit('typing', typing);
  }, [typing]);

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
  function createRoom() {
    socket.emit('join room', 'newRoom2');
  }
  return (
    <Layout>
      <Side><div>Me: {user}</div>
        <button>join room</button>
        <button onClick={createRoom}>create room</button>
        {/* {users.map(u => <div key={u}>{u}</div>)} */}
      </Side>
      <Messages typingUsers={typingUsers} chats={chats} />
      <Footer>
        <Input
          ref={inputRef}
          contentEditable
          onKeyDown={handleKeyDown}
          onBlur={() => setTyping(false)}
        />
        <Button onClick={sendMsg}>
          send
        </Button>
      </Footer>
    </Layout>
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
