import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <Streamdown
      plugins={{ code }}
      mode="static"
      linkSafety={{ enabled: false }}
      className="prose prose-sm dark:prose-invert max-w-none text-sm break-words"
    >
      {content}
    </Streamdown>
  )
}
