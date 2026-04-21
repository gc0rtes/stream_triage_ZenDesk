import { useState, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { TableKit } from '@tiptap/extension-table'
import type { Editor } from '@tiptap/react'
import {
  IconBold, IconItalic, IconUnderline, IconStrikethrough,
  IconList, IconListOrdered, IconBlockquote, IconCode, IconTerminal,
  IconEraser, IconLink2, IconHeading, IconTable,
} from './icons'

export interface RichTextEditorHandle {
  setContent: (html: string) => void
  clear: () => void
}

interface RichTextEditorProps {
  onChange: (html: string) => void
  placeholder?: string
  isPublic?: boolean
  onKeyboardSubmit?: () => void
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

const DIVIDER = (
  <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0, alignSelf: 'center' }} />
)

interface TbtnProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}
function Tbtn({ onClick, active = false, title, children, disabled }: TbtnProps) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      disabled={disabled}
      style={{
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-dim)',
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        borderRadius: 3, padding: '3px 4px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
        transition: 'background 0.1s, color 0.1s',
        lineHeight: 1,
      }}
    >{children}</button>
  )
}

interface ToolbarProps {
  editor: Editor
}
function Toolbar({ editor }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const applyLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }

  const openLinkInput = () => {
    const existing = editor.getAttributes('link').href as string | undefined
    setLinkUrl(existing ?? '')
    setShowLinkInput(true)
  }

  const headingLevel = editor.isActive('heading', { level: 1 }) ? '1'
    : editor.isActive('heading', { level: 2 }) ? '2'
    : editor.isActive('heading', { level: 3 }) ? '3'
    : '0'

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      position: 'relative',
    }}>
      {/* row 1 — formatting */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1,
        padding: '4px 8px', flexWrap: 'wrap',
      }}>
        {/* heading */}
        <select
          value={headingLevel}
          onChange={e => {
            const lvl = Number(e.target.value)
            if (lvl === 0) editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: lvl as 1 | 2 | 3 }).run()
          }}
          style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', borderRadius: 3, fontSize: 10,
            padding: '2px 4px', cursor: 'pointer', fontFamily: 'var(--mono)',
            fontWeight: 600, height: 22, marginRight: 2,
          }}
        >
          <option value="0">¶</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
        </select>

        <Tbtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)">
          <IconBold size={13} />
        </Tbtn>
        <Tbtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)">
          <IconItalic size={13} />
        </Tbtn>
        <Tbtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)">
          <IconUnderline size={13} />
        </Tbtn>
        <Tbtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <IconStrikethrough size={13} />
        </Tbtn>

        {DIVIDER}

        <Tbtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <IconList size={13} />
        </Tbtn>
        <Tbtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <IconListOrdered size={13} />
        </Tbtn>

        {DIVIDER}

        <Tbtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <IconBlockquote size={13} />
        </Tbtn>
        <Tbtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <IconCode size={13} />
        </Tbtn>
        <Tbtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <IconTerminal size={13} />
        </Tbtn>

        {DIVIDER}

        <Tbtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1, color: 'inherit' }}>—</span>
        </Tbtn>
        <Tbtn
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          active={editor.isActive('table')}
          title="Insert table"
        >
          <IconTable size={13} />
        </Tbtn>

        {DIVIDER}

        <Tbtn onClick={openLinkInput} active={editor.isActive('link')} title="Link (⌘K)">
          <IconLink2 size={13} />
        </Tbtn>

        {DIVIDER}

        <Tbtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <IconEraser size={13} />
        </Tbtn>

        {/* heading guide when in table */}
        {editor.isActive('table') && (
          <>
            {DIVIDER}
            <Tbtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column before">
              <IconHeading size={11} />
            </Tbtn>
            <Tbtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column" disabled={false}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--danger)' }}>−C</span>
            </Tbtn>
            <Tbtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row after">
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>+R</span>
            </Tbtn>
            <Tbtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--danger)' }}>−R</span>
            </Tbtn>
            <Tbtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--danger)' }}>✕T</span>
            </Tbtn>
          </>
        )}
      </div>

      {/* link input overlay */}
      {showLinkInput && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 8, zIndex: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6,
          minWidth: 280,
        }}>
          <input
            autoFocus
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') applyLink()
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl('') }
            }}
            placeholder="https://"
            style={{
              flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '5px 8px', color: 'var(--text)', fontSize: 12,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onMouseDown={e => { e.preventDefault(); applyLink() }}
            style={{
              background: 'var(--accent)', color: 'var(--accent-ink)',
              border: 'none', borderRadius: 4, padding: '5px 10px',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >Apply</button>
          {editor.isActive('link') && (
            <button
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run(); setShowLinkInput(false) }}
              style={{
                background: 'var(--danger-soft)', color: 'var(--danger)',
                border: '1px solid var(--danger)', borderRadius: 4, padding: '5px 8px',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >Remove</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ onChange, placeholder, isPublic, onKeyboardSubmit }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noreferrer', target: '_blank' } }),
        Placeholder.configure({ placeholder: placeholder ?? 'Write a reply…' }),
        TextStyle,
        Color,
        TableKit,
      ],
      editorProps: {
        handleKeyDown: (_view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            onKeyboardSubmit?.()
            return true
          }
          return false
        },
      },
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML()
        onChange(html === '<p></p>' ? '' : html)
      },
    })

    useImperativeHandle(ref, () => ({
      setContent: (html) => { editor?.commands.setContent(html, { emitUpdate: true }) },
      clear: () => { editor?.commands.clearContent(true) },
    }), [editor])

    if (!editor) return null

    return (
      <div style={{
        border: `1px solid ${isPublic ? 'var(--border)' : 'var(--warn)'}`,
        borderRadius: 6, background: 'var(--bg-2)', overflow: 'hidden',
        marginBottom: 8, transition: 'border-color 0.15s',
      }}>
        <EditorContent editor={editor} />
        <Toolbar editor={editor} />
      </div>
    )
  }
)
