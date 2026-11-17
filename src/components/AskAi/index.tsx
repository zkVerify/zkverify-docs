import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDoc } from '@docusaurus/theme-common/internal';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

/**
 * "Open in AI tools" dropdown shown at the top-right of every docs page.
 *
 * The button toggles a menu offering:
 * - Copy page: copies the page's markdown (derived from the GitHub editUrl),
 *   falling back to the rendered article text if the fetch fails.
 * - View as Markdown: opens the raw .md file.
 * - Open in an AI assistant (ChatGPT, Claude, Perplexity, Grok) pre-loaded
 *   with a prompt referencing this page.
 */

type CopyState = 'idle' | 'copying' | 'copied' | 'error';

// Convert a GitHub "blob/tree" edit URL into its raw.githubusercontent.com URL.
// e.g. https://github.com/org/repo/tree/main/docs/a.md
//   -> https://raw.githubusercontent.com/org/repo/main/docs/a.md
function toRawMarkdownUrl(editUrl?: string): string | null {
  if (!editUrl) return null;
  return editUrl
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/tree/', '/')
    .replace('/blob/', '/');
}

// Strip MDX import/export lines and frontmatter so copied markdown reads cleanly.
function cleanMarkdown(raw: string): string {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n/, '') // frontmatter
    .replace(/^import\s.*$/gm, '') // import statements
    .replace(/^export\s.*$/gm, '') // export statements
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkdownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M6 15V9l3 3 3-3v6M17 9v6M17 15l2-2M17 15l-2-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AskAi(): JSX.Element {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();

  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  const rawUrl = toRawMarkdownUrl(metadata.editUrl);
  const pageUrl = siteConfig.url.replace(/\/$/, '') + metadata.permalink;
  const prompt = `Read ${pageUrl} so I can ask questions about this zkVerify documentation page.`;
  const encoded = encodeURIComponent(prompt);

  const aiTargets = [
    {
      key: 'chatgpt',
      label: 'Open in ChatGPT',
      href: `https://chatgpt.com/?hints=search&q=${encoded}`,
      icon: <ChatGptIcon />,
    },
    {
      key: 'claude',
      label: 'Open in Claude',
      href: `https://claude.ai/new?q=${encoded}`,
      icon: <ClaudeIcon />,
    },
    {
      key: 'perplexity',
      label: 'Open in Perplexity',
      href: `https://www.perplexity.ai/search/new?q=${encoded}`,
      icon: <PerplexityIcon />,
    },
    {
      key: 'grok',
      label: 'Open in Grok',
      href: `https://grok.com/?q=${encoded}`,
      icon: <GrokIcon />,
    },
  ];

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copyPage = useCallback(async () => {
    setCopyState('copying');
    let text = '';
    try {
      if (rawUrl) {
        const res = await fetch(rawUrl);
        if (res.ok) text = cleanMarkdown(await res.text());
      }
    } catch {
      // ignore and fall back below
    }
    if (!text) {
      // Fallback: copy the rendered article text.
      const article =
        document.querySelector('.theme-doc-markdown') || document.querySelector('article');
      text = (article as HTMLElement | null)?.innerText ?? '';
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    setTimeout(() => setCopyState('idle'), 2000);
  }, [rawUrl]);

  const copyLabel =
    copyState === 'copied'
      ? 'Copied!'
      : copyState === 'copying'
        ? 'Copying…'
        : copyState === 'error'
          ? 'Copy failed'
          : 'Copy page';

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.copyBtn}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        Open in AI tools
        <span className={styles.caretIcon}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.menuItem}
            onClick={copyPage}
            disabled={copyState === 'copying'}
            role="menuitem"
          >
            <span className={styles.menuIcon}>
              {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
            </span>
            <span className={styles.menuText}>
              <span className={styles.menuTitle}>{copyLabel}</span>
              <span className={styles.menuSub}>Copy this page as Markdown</span>
            </span>
          </button>
          <div className={styles.divider} />

          {rawUrl && (
            <>
              <a
                className={styles.menuItem}
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className={styles.menuIcon}>
                  <MarkdownIcon />
                </span>
                <span className={styles.menuText}>
                  <span className={styles.menuTitle}>View as Markdown</span>
                  <span className={styles.menuSub}>Open the raw .md file</span>
                </span>
              </a>
              <div className={styles.divider} />
            </>
          )}

          {aiTargets.map((t) => (
            <a
              key={t.key}
              className={styles.menuItem}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className={styles.menuIcon}>{t.icon}</span>
              <span className={styles.menuText}>
                <span className={styles.menuTitle}>{t.label}</span>
                <span className={styles.menuSub}>Ask about this page</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Brand marks (simplified, monochrome-friendly) ---- */

function ChatGptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A5.98 5.98 0 0 0 10.74.5 6.05 6.05 0 0 0 4.98 4.7a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .75 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.98 5.98 0 0 0 13.26 23.5a6.05 6.05 0 0 0 5.77-4.2 5.98 5.98 0 0 0 4-2.9 6.05 6.05 0 0 0-.75-7.08zM13.26 21.9a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.5 4.5 0 0 1-4.49 4.49zM3.6 17.77a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76a.78.78 0 0 0 .78 0l5.84-3.37v2.33a.07.07 0 0 1-.03.06l-4.83 2.79a4.5 4.5 0 0 1-6.14-1.65zM2.34 8.4a4.47 4.47 0 0 1 2.34-1.97v5.68a.78.78 0 0 0 .39.68l5.84 3.37-2.02 1.17a.07.07 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 8.4zm16.6 3.86-5.84-3.38 2.02-1.16a.07.07 0 0 1 .07 0l4.83 2.78a4.49 4.49 0 0 1-.68 8.1v-5.67a.78.78 0 0 0-.4-.67zm2.01-3.02-.14-.09-4.78-2.76a.78.78 0 0 0-.78 0L9.4 9.76V7.42a.07.07 0 0 1 .03-.06l4.83-2.78a4.5 4.5 0 0 1 6.68 4.66zM8.3 13.38l-2.02-1.17a.07.07 0 0 1-.04-.05V6.57a4.5 4.5 0 0 1 7.37-3.45l-.14.08L8.7 5.96a.78.78 0 0 0-.4.68zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z" />
    </svg>
  );
}

function ClaudeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#D97757" aria-hidden="true">
      <path d="M4.7 15.6l4.2-2.36.07-.2-.07-.11h-.2l-.68-.05-2.33-.06-2.02-.08-1.96-.1-.49-.1L0 11.8l.05-.3.41-.28.59.05 1.3.09 1.95.14 1.42.08 2.1.22h.33l.05-.14-.11-.08-.09-.08-2-1.36-2.17-1.44-1.13-.83-.62-.42-.3-.4-.14-.9.58-.65.78.06.2.05.8.61 1.7 1.32 2.22 1.64.33.27.13-.09.01-.07-.15-.25-1.25-2.26-1.33-2.3-.6-.95-.15-.57a2.74 2.74 0 0 1-.1-.68l.67-.9L5 .68l.9.12.37.33.56 1.27.9 2.01 1.4 2.73.41.81.22.75.08.23h.14V9.9l.12-1.56.21-1.92.21-2.47.07-.7.35-.83.68-.45.54.26.44.63-.06.4-.26 1.72-.52 2.69-.33 1.8h.2l.22-.23.9-1.19 1.51-1.9.67-.74.77-.83.5-.4h.94l.69 1.03-.31 1.06-.97 1.22-.8 1.04-1.15 1.55-.72 1.24.07.1h.17l2.6-.56 1.4-.25 1.68-.29.76.36.08.36-.3.73-1.8.44-2.1.42-3.14.74-.04.03.05.06 1.41.13.6.04h1.49l2.76.2.72.48.43.58-.07.44-1.11.57-1.49-.36-3.49-.83-1.2-.3h-.16v.1l1 .98 1.83 1.65 2.3 2.14.11.53-.3.42-.31-.04-2.02-1.52-.78-.68-1.76-1.48h-.12v.15l.41.59 2.14 3.22.11.99-.16.32-.56.2-.61-.11-1.27-1.78-1.3-2-1.06-1.8-.13.07-.62 6.7-.3.34-.66.26-.56-.42-.3-.68.3-1.37.36-1.78.29-1.42.26-1.76.16-.58-.01-.04-.13.02-1.32 1.8-2 2.72-1.6 1.7-.37.15-.65-.33.06-.6.36-.54 2.17-2.76 1.3-1.71.85-.99-.01-.14h-.05L4.7 16.44l-1.14.15-.5-.46.07-.76.23-.24 1.94-1.34-.6.02z" />
    </svg>
  );
}

function PerplexityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#20808D" aria-hidden="true">
      <path
        d="M12 3v18M12 7.5l6.5-4.5v7M12 7.5L5.5 3v7M3 8.5h18v8H3zM6.5 16.5V21M17.5 16.5V21"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GrokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.2 20.8 14.3 9.7l2.1 2.1-9 9H3.2v-0zM9.9 14 3.2 7.3V3.2h4.1l6.7 6.7L9.9 14zM16.6 14.9l4.2 4.2v1.7h-1.7l-4.2-4.2 1.7-1.7zM20.8 3.2v8.9l-2.1-2.1V5.3h-4.7l-2.1-2.1h8.9z" />
    </svg>
  );
}
