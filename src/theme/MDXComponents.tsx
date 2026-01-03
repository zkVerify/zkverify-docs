import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import CodeBlock from '@theme/CodeBlock';

// Render fenced code blocks through the Docusaurus CodeBlock (Prism) renderer.
export default {
  ...MDXComponents,
  code: (props: any) => {
    const { children, className } = props;
    const language =
      typeof className === 'string' && className.startsWith('language-')
        ? className.replace(/language-/, '')
        : undefined;

    // Inline code or no language: fallback to default renderer
    if (!language || String(children).includes('\n') === false) {
      return <code {...props} />;
    }

    return (
      <CodeBlock className={className} language={language}>
        {children}
      </CodeBlock>
    );
  },
};
