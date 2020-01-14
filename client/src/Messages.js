import React, { useEffect,useRef,Fragment } from 'react';
import styled from 'styled-components';



const Typing = styled.svg`
  color: white;
  circle:nth-of-type(1) {
    animation: fade 700ms cubic-bezier(0.39, 0.58, 0.57, 1) 0ms infinite
      alternate-reverse;
  }
  circle:nth-Thinking.jsof-type(2) {
    animationThinking.js: fade 700ms cubic-bezier(0.39, 0.58, 0.57, 1) 400ms infinite
      alternate-reverse;
  }
  circle:nth-of-type(3) {
    animation: fade 700ms cubic-bezier(0.39, 0.58, 0.57, 1) 800ms infinite
      alternate-reverse;
  }
  @keyframes fade {
    from {
        opacity: 1;
    }
    to {
        opacity: 0.45;
    }
  }
`;

const Thinking = () => (
  <Typing height="100%" viewBox="0 0 10 4">
    <g fill="currentColor">
      <circle cx="2" cy="2" r="1" />
      <circle cx="5" cy="2" r="1" />
      <circle cx="8" cy="2" r="1" />
    </g>
  </Typing>
);

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
const Messages = ({ ref, typingUsers, chats }) => {
  let chatRef = useRef(null);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ behavior: 'smooth', top: chatRef.current.scrollHeight });
      // chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chats]);
  return (
    <Chat ref={ref}>
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
      {
        typingUsers.map((u, i) => (
          <Fragment key={i}>
            <Name right={false}>{u}</Name>
            <Bubble right={false}><Thinking /></Bubble>
          </Fragment>
        ))
      }
    </Chat>
  )
};
export default Messages