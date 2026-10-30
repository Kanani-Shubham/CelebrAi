import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './SafeMarkdown.css';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Preprocesses markdown text from AI to eliminate raw HTML tags (like <br>),
 * while preserving markdown table row structure.
 */
function preprocessMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    // Detect table rows by checking pipe delimiters
    const isTableRow = trimmed.startsWith('|') || (trimmed.endsWith('|') && trimmed.includes('|'));
    if (isTableRow) {
      // In table rows, preserve line breaks inside cells using [[BR]] without splitting the row
      return line
        .replace(/<br\s*\/?>/gi, '[[BR]]')
        .replace(/<\/?(script|iframe|object|embed|style|meta|link)[^>]*>/gi, '');
    }
    // Outside table rows, convert <br> to actual newlines
    return line
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(script|iframe|object|embed|style|meta|link)[^>]*>/gi, '');
  });

  return processedLines.join('\n');
}

/**
 * Safely renders cell content, converting [[BR]] tokens into <br /> elements
 * without dangerouslySetInnerHTML.
 */
function renderCellContent(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') {
    if (node.includes('[[BR]]')) {
      const parts = node.split('[[BR]]');
      return parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {part.trim()}
        </React.Fragment>
      ));
    }
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => <React.Fragment key={i}>{renderCellContent(child)}</React.Fragment>);
  }
  return node;
}

/**
 * Validates that an href is safe to render as a link.
 * Only allows https, http, and mailto protocols.
 */
function isSafeUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  );
}

/**
 * Safe, secure Markdown renderer for CelebrAI chat messages and AI outputs.
 * - Does NOT use dangerouslySetInnerHTML
 * - Does NOT enable rehype-raw
 * - Sanitizes unsafe URLs
 * - Responsive scrollable tables on mobile
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  const cleanContent = preprocessMarkdown(content);

  return (
    <div className={`safe-markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with clean font-serif hierarchy
          h1: ({ children }) => <h1 className="md-h1 font-serif">{children}</h1>,
          h2: ({ children }) => <h2 className="md-h2 font-serif">{children}</h2>,
          h3: ({ children }) => <h3 className="md-h3 font-serif">{children}</h3>,
          h4: ({ children }) => <h4 className="md-h4 font-serif">{children}</h4>,

          // Paragraphs
          p: ({ children }) => <p className="md-p">{children}</p>,

          // Lists
          ul: ({ children }) => <ul className="md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="md-ol">{children}</ol>,
          li: ({ children }) => <li className="md-li">{children}</li>,

          // Responsive Table Wrapper
          table: ({ children }) => (
            <div className="md-table-container">
              <table className="md-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="md-thead">{children}</thead>,
          tbody: ({ children }) => <tbody className="md-tbody">{children}</tbody>,
          tr: ({ children }) => <tr className="md-tr">{children}</tr>,
          th: ({ children }) => <th className="md-th">{renderCellContent(children)}</th>,
          td: ({ children }) => <td className="md-td">{renderCellContent(children)}</td>,

          // Strong / Emphasis
          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
          em: ({ children }) => <em className="md-em">{children}</em>,

          // Blockquote
          blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,

          // Safe Links
          a: ({ href, children }) => {
            if (!isSafeUrl(href)) {
              return <span>{children}</span>;
            }
            const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
            return (
              <a
                href={href}
                className="md-link"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            );
          },

          // Code
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="md-code-inline" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="md-code-block">
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
};

