import React, { useEffect,useRef,Fragment } from 'react';
import styled from 'styled-components';


const Chat = styled.div`
  padding: 1em;
  display: flex;
  flex-direction: column;
  overflow: auto;
`
const Name = styled.div`
  font-size: 0.85em;
  padding:0 0.6em;
  font-weight: 550;
  opacity: 0.6;
  ${props => props.right
    ? 'align-self: flex-end;'
    : 'align-self: flex-start;'
  }
`
const Action = styled.div`
  font-size: 0.9em;
  font-weight: 500;
  opacity: 0.7;
  text-align: center;
  padding:0.1em;
`
const Bubble = styled.div`
  max-width: 85%;
  color: white;
  margin: 0.3em 0 0.8em;
  padding: 0.6em 1em;
  word-wrap:break-word;
  ${props => props.right
    ? 'align-self: flex-end;background-color: darkgrey;border-radius:0.6em 0.6em 0em 0.6em;'
    : 'align-self: flex-start;background-color: #0084ff;border-radius:0.6em 0.6em 0.6em 0em;'
  }
`;
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
const Messages = ({sendMsg, inputRef, chats }) => {
  let chatRef = useRef(null);


  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMsg();
    }
  }
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ behavior: 'smooth', top: chatRef.current.scrollHeight });
      // chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chats]);
  return (
      <>
    <Chat ref={chatRef}>
      {chats.map(({ username, self, msg, action }, i) => (
        <Fragment key={i}>
          {action ? <Action>{username} {action}</Action>
            :
            <Fragment>
              <Name right={self}>{username}</Name>
              <Bubble right={self}>{msg}</Bubble>
            </Fragment>
          }
        </Fragment>
      ))}
    </Chat>
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
        </>
  )
};
export default Messages