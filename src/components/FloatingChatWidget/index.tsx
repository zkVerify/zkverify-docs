import React, { useState, useEffect, useRef, useCallback } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Chatbot from '../Chatbot';
import styles from './styles.module.css';

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 550;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 350;
const MAX_WIDTH = 600;
const MAX_HEIGHT = window.innerHeight * 0.8;

// Version for localStorage - increment when changing defaults
const CHAT_WIDGET_VERSION = 8;

const FloatingChatWidget: React.FC = () => {
  const { siteConfig } = useDocusaurusContext();
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isResizing, setIsResizing] = useState(false);
  const chatWidgetRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Load saved size from localStorage with version check
  useEffect(() => {
    const savedData = localStorage.getItem('chatWidgetSize');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        // Check if version matches current version
        if (parsed.version === CHAT_WIDGET_VERSION && parsed.width && parsed.height) {
          setSize({
            width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed.width)),
            height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, parsed.height))
          });
        } else {
          // Version mismatch or invalid data, use new defaults and update version
          const newSizeData = {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            version: CHAT_WIDGET_VERSION
          };
          localStorage.setItem('chatWidgetSize', JSON.stringify(newSizeData));
          setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
        }
      } catch (e) {
        // Invalid saved data, use defaults and set version
        const newSizeData = {
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          version: CHAT_WIDGET_VERSION
        };
        localStorage.setItem('chatWidgetSize', JSON.stringify(newSizeData));
        setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
      }
    } else {
      // No saved data, use defaults and set version
      const newSizeData = {
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        version: CHAT_WIDGET_VERSION
      };
      localStorage.setItem('chatWidgetSize', JSON.stringify(newSizeData));
    }
  }, []);

  // Save size to localStorage when it changes
  useEffect(() => {
    const sizeData = {
      width: size.width,
      height: size.height,
      version: CHAT_WIDGET_VERSION
    };
    localStorage.setItem('chatWidgetSize', JSON.stringify(sizeData));
  }, [size]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Resize functionality
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
  }, [size]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartPos.current.x;
    const deltaY = e.clientY - resizeStartPos.current.y;

    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartPos.current.width - deltaX));
    const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStartPos.current.height - deltaY));

    setSize({ width: newWidth, height: newHeight });
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Handle auto-resize based on content
  const handleContentChange = useCallback((idealHeight: number) => {
    // Only auto-resize if the user hasn't manually resized recently
    const shouldAutoResize = !isResizing && idealHeight > size.height;

    if (shouldAutoResize) {
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, idealHeight));
      if (newHeight !== size.height) {
        setSize(prev => ({ ...prev, height: newHeight }));
      }
    }
  }, [size.height, isResizing]);

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <div
          ref={chatWidgetRef}
          className={`${styles.chatWidget} ${isResizing ? styles.resizing : ''}`}
          style={{
            width: size.width,
            height: size.height
          }}
        >
          <div className={styles.chatHeader}>
            <span>zkVerify AI</span>
            <button
              className={styles.closeButton}
              onClick={toggleChat}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className={styles.chatContainer}>
            <Chatbot
              apiEndpoint="https://ai-agents.horizenlabs.io/webhook/chat"
              title=""
              placeholder="Ask me about zkVerify..."
              token={siteConfig.customFields?.chatApiToken as string}
              onContentChange={handleContentChange}
            />
          </div>
          {/* Resize Handle */}
          <div
            className={styles.resizeHandle}
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`${styles.floatingButton} ${isOpen ? styles.open : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
      </button>
    </>
  );
};

export default FloatingChatWidget;