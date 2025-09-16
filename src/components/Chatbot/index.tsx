import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import styles from './styles.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  apiEndpoint?: string;
  placeholder?: string;
  title?: string;
  token?: string;
  onContentChange?: (contentHeight: number) => void;
}

// Generate a simple session ID for this chat session
const generateSessionId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const Chatbot: React.FC<ChatbotProps> = ({
  apiEndpoint = 'https://ai-agents.horizenlabs.io/webhook/chat',
  placeholder = 'Ask me anything...',
  title = 'Chat Assistant',
  token,
  onContentChange
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Hello! How can I help you with zkVerify?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent of content changes for auto-resize
  useEffect(() => {
    if (onContentChange && messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        // Calculate ideal height based on content
        const headerHeight = title ? 60 : 0; // Header height if present
        const inputHeight = 80; // Input area height
        const padding = 32; // Total padding
        const messagesHeight = messagesContainer.scrollHeight;

        const idealHeight = headerHeight + messagesHeight + inputHeight + padding;
        onContentChange(idealHeight);
      }
    }
  }, [messages, onContentChange, title]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add token if provided
      if (token) {
        headers['token'] = token;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatInput: inputValue,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.output || 'Sorry, I didn\'t understand that.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className={styles.chatbot}>
      {title && (
        <div className={styles.header}>
          <h3>{title}</h3>
        </div>
      )}

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.sender]}`}
          >
            <div className={styles.messageContent}>
              {message.sender === 'bot' ? (
                <Markdown>{message.text}</Markdown>
              ) : (
                message.text
              )}
            </div>
            <div className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.bot}`}>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={styles.input}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isLoading || !inputValue.trim()}
          className={styles.sendButton}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;