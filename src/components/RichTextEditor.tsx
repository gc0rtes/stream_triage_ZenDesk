import { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/react'
import { uploadAttachmentFull } from '../api/tickets'
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
  onDropAttachment?: (file: File) => void
  onInlineUpload?: (token: string, contentUrl: string, blobUrl: string) => void
  editorHeight?: number
}

// Ctrl+Shift+5 → inline code, Ctrl+Shift+6 → code block
const CodeShortcuts = Extension.create({
  name: 'codeShortcuts',
  addKeyboardShortcuts() {
    return {
      'Ctrl-Shift-5': () => this.editor.chain().focus().toggleCode().run(),
      'Ctrl-Shift-6': () => this.editor.chain().focus().toggleCodeBlock().run(),
    }
  },
})

// ── Inline image resize node view ────────────────────────────────────────────

const CORNERS = ['nw', 'ne', 'sw', 'se'] as const
type Corner = typeof CORNERS[number]

function ImageResizeView({ node, updateAttributes, selected }: {
  node: { attrs: Record<string, unknown> }
  updateAttributes: (attrs: Record<string, unknown>) => void
  selected: boolean
}) {
  const imgRef = useRef<HTMLImageElement>(null)

  const startResize = (e: React.MouseEvent, corner: Corner) => {
    e.preventDefault()
    e.stopPropagation()
    const el = imgRef.current
    if (!el) return

    const startX = e.clientX
    const startW = el.offsetWidth || (node.attrs.width as number) || 200
    const startH = el.offsetHeight || (node.attrs.height as number) || 150
    const aspect = startW / startH
    const goesRight = corner === 'ne' || corner === 'se'

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const newW = Math.max(40, startW + (goesRight ? dx : -dx))
      updateAttributes({ width: Math.round(newW), height: Math.round(newW / aspect) })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = `${corner}-resize`
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const w = node.attrs.width as number | null
  const h = node.attrs.height as number | null

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline-block', position: 'relative', lineHeight: 0, verticalAlign: 'bottom' }}>
      <img
        ref={imgRef}
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ''}
        width={w ?? undefined}
        height={h ?? undefined}
        style={{
          display: 'block', maxWidth: '100%',
          outline: selected ? '2px solid var(--accent)' : 'none',
          outlineOffset: 1,
        }}
        draggable={false}
      />
      {selected && CORNERS.map(corner => (
        <div
          key={corner}
          onMouseDown={e => startResize(e, corner)}
          style={{
            position: 'absolute',
            ...(corner.startsWith('n') ? { top: -5 } : { bottom: -5 }),
            ...(corner.endsWith('w') ? { left: -5 } : { right: -5 }),
            width: 10, height: 10,
            background: 'var(--accent)', border: '2px solid white',
            borderRadius: 2, cursor: `${corner}-resize`, zIndex: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      ))}
    </NodeViewWrapper>
  )
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: el => el.getAttribute('width') ? Number(el.getAttribute('width')) : null },
      height: { default: null, parseHTML: el => el.getAttribute('height') ? Number(el.getAttribute('height')) : null },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView)
  },
})

// ── Drop image choice popup ───────────────────────────────────────────────────

interface DropImageMenuProps {
  file: File
  uploading: boolean
  onInline: () => void
  onAttach: () => void
  onCancel: () => void
}

function DropImageMenu({ file, uploading, onInline, onAttach, onCancel }: DropImageMenuProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20, borderRadius: 6,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '16px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', gap: 10, minWidth: 230,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🖼</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{file.name}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>How do you want to add this image?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
          <button
            onClick={onInline}
            disabled={uploading}
            style={{
              padding: '8px 12px', borderRadius: 5,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              border: 'none', cursor: uploading ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 600, opacity: uploading ? 0.6 : 1,
              textAlign: 'left',
            }}
          >{uploading ? 'Uploading…' : 'Insert inline in message'}</button>
          <button
            onClick={onAttach}
            disabled={uploading}
            style={{
              padding: '8px 12px', borderRadius: 5,
              background: 'var(--surface-2)', color: 'var(--text)',
              border: '1px solid var(--border)', cursor: uploading ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 500, opacity: uploading ? 0.6 : 1,
              textAlign: 'left',
            }}
          >Add as attachment</button>
        </div>
        <button
          onClick={onCancel}
          disabled={uploading}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-mute)', fontSize: 11, padding: 0, textAlign: 'center',
          }}
        >Cancel</button>
      </div>
    </div>
  )
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
  function RichTextEditor({ onChange, placeholder, isPublic, onKeyboardSubmit, onDropAttachment, onInlineUpload, editorHeight }, ref) {
    const [dropFile, setDropFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noreferrer', target: '_blank' } }),
        Placeholder.configure({ placeholder: placeholder ?? 'Write a reply…' }),
        TextStyle,
        Color,
        TableKit,
        CodeShortcuts,
        ResizableImage.configure({ inline: true, allowBase64: false }),
      ],
      editorProps: {
        handleKeyDown: (_view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            onKeyboardSubmit?.()
            return true
          }
          return false
        },
        handleDrop: (_view, event) => {
          const file = Array.from(event.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'))
          if (!file) return false
          event.preventDefault()
          setDropFile(file)
          setIsDragOver(false)
          return true
        },
        handleDOMEvents: {
          dragover: (_view, event) => {
            if (event.dataTransfer?.types.includes('Files')) setIsDragOver(true)
            return false
          },
          dragleave: () => { setIsDragOver(false); return false },
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

    const insertInline = useCallback(async () => {
      if (!dropFile || !editor) return
      const file = dropFile
      setDropFile(null)
      setUploading(true)
      const blobUrl = URL.createObjectURL(file)
      try {
        const { token, contentUrl } = await uploadAttachmentFull(file)
        onInlineUpload?.(token, contentUrl, blobUrl)
        editor.chain().focus().setImage({ src: blobUrl, alt: file.name }).run()
      } catch {
        URL.revokeObjectURL(blobUrl)
      } finally {
        setUploading(false)
      }
    }, [dropFile, editor, onInlineUpload])

    const addAsAttachment = useCallback(() => {
      if (!dropFile) return
      onDropAttachment?.(dropFile)
      setDropFile(null)
    }, [dropFile, onDropAttachment])

    if (!editor) return null

    const borderColor = isDragOver ? 'var(--accent)' : isPublic ? 'var(--border)' : 'var(--warn)'

    return (
      <div
          style={{
            border: `1px solid ${borderColor}`,
            borderRadius: 6, background: 'var(--bg-2)', overflow: 'hidden',
            marginBottom: 8, transition: 'border-color 0.15s',
            position: 'relative',
            '--editor-h': editorHeight ? `${editorHeight}px` : undefined,
          } as React.CSSProperties}
        >
          {dropFile && (
            <DropImageMenu
              file={dropFile}
              uploading={uploading}
              onInline={insertInline}
              onAttach={addAsAttachment}
              onCancel={() => setDropFile(null)}
            />
          )}
          {uploading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10, borderRadius: 6,
              background: 'rgba(0,0,0,0.4)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 12, color: 'white' }}>Uploading image…</span>
            </div>
          )}
          <EditorContent editor={editor} />
          <Toolbar editor={editor} />
        </div>
    )
  }
)
