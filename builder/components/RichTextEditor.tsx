'use client'

import { useEffect, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  /**
   * Placeholder is shown through CSS on the first empty paragraph. Useful for
   * empty translated values in the builder.
   */
  placeholder?: string
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? 'secondary' : 'ghost'}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')

  const openLink = () => {
    const current = (editor.getAttributes('link').href as string | undefined) ?? ''
    setLinkHref(current)
    setLinkOpen(true)
  }

  const applyLink = () => {
    const href = linkHref.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkOpen(false)
  }

  const chain = () => editor.chain().focus()

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-1.5">
      <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}>
        <Underline />
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={openLink}>
        <Link2 />
      </ToolbarButton>
      <ToolbarButton label="Remove link" disabled={!editor.isActive('link')} onClick={() => chain().extendMarkRange('link').unsetLink().run()}>
        <Link2Off />
      </ToolbarButton>
      <ToolbarButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => chain().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => chain().redo().run()}>
        <Redo2 />
      </ToolbarButton>
      {linkOpen && (
        <div className="flex w-full items-center gap-2 pt-1.5">
          <Input
            autoFocus
            value={linkHref}
            onChange={(event) => setLinkHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              }
              if (event.key === 'Escape') setLinkOpen(false)
            }}
            placeholder="https://example.com"
            aria-label="Link URL"
            className="h-7 flex-1"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Apply
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setLinkOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    // The builder is server-rendered, so defer rendering until the client.
    immediatelyRender: false,
    // Keep the toolbar's active states in sync with the document.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rte-content',
        dir: 'auto',
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.isEmpty ? '' : instance.getHTML())
    },
  })

  // Sync external changes (locale tab switch, reset, section switch) without
  // fighting the user's cursor while they type.
  useEffect(() => {
    if (!editor) return
    const next = value ?? ''
    if (editor.getHTML() === next) return
    if (editor.isFocused) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  if (!editor) {
    return <div className="min-h-32 rounded-lg border bg-muted/30" aria-hidden="true" />
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
