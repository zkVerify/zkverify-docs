import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

type Props = {
  children: any;
  className?: string;
};

// Simple CodeBlock override that always tokenizes via prism-react-renderer.
export default function CodeBlockWrapper({ children, className }: Props) {
  const inferredLang =
    typeof className === 'string' && className.startsWith('language-')
      ? className.replace('language-', '')
      : undefined;

  const language = (inferredLang || 'bash') as any;
  const code =
    typeof children === 'string'
      ? children
      : Array.isArray(children)
        ? children.join('')
        : '';

  return (
    <Highlight
      code={code.trimEnd()}
      language={language}
      theme={themes.github}
    >
      {({ className: cls, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={cls} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
