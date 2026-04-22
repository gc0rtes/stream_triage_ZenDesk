import { useState, useRef, useEffect, useCallback } from 'react'

interface Rect { x: number; y: number; w: number; h: number }
type DragHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

interface Props {
  file: File
  onConfirm: (blob: Blob, filename: string) => void
  onCancel: () => void
}

const MIN_CROP = 20
const MAX_DISPLAY_W = 540
const MAX_DISPLAY_H = 360

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function applyHandle(
  handle: DragHandle,
  sc: Rect,
  dx: number,
  dy: number,
  imgW: number,
  imgH: number,
): Rect {
  let { x, y, w, h } = sc
  switch (handle) {
    case 'move':
      x = clamp(sc.x + dx, 0, imgW - sc.w)
      y = clamp(sc.y + dy, 0, imgH - sc.h)
      break
    case 'se':
      w = clamp(sc.w + dx, MIN_CROP, imgW - sc.x)
      h = clamp(sc.h + dy, MIN_CROP, imgH - sc.y)
      break
    case 'sw': {
      const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN_CROP)
      w = sc.x + sc.w - nx; x = nx
      h = clamp(sc.h + dy, MIN_CROP, imgH - sc.y)
      break
    }
    case 'ne': {
      const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN_CROP)
      h = sc.y + sc.h - ny; y = ny
      w = clamp(sc.w + dx, MIN_CROP, imgW - sc.x)
      break
    }
    case 'nw': {
      const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN_CROP)
      const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN_CROP)
      w = sc.x + sc.w - nx; x = nx
      h = sc.y + sc.h - ny; y = ny
      break
    }
    case 'n': {
      const ny = clamp(sc.y + dy, 0, sc.y + sc.h - MIN_CROP)
      h = sc.y + sc.h - ny; y = ny
      break
    }
    case 's':
      h = clamp(sc.h + dy, MIN_CROP, imgH - sc.y)
      break
    case 'e':
      w = clamp(sc.w + dx, MIN_CROP, imgW - sc.x)
      break
    case 'w': {
      const nx = clamp(sc.x + dx, 0, sc.x + sc.w - MIN_CROP)
      w = sc.x + sc.w - nx; x = nx
      break
    }
  }
  return { x, y, w, h }
}

const HANDLE_CURSORS: Record<DragHandle, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize', move: 'move',
}

export function ImageEditorModal({ file, onConfirm, onCancel }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [imgUrl, setImgUrl] = useState('')
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [targetW, setTargetW] = useState(0)
  const [targetH, setTargetH] = useState(0)
  const [lockRatio, setLockRatio] = useState(true)
  const [processing, setProcessing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ handle: DragHandle; sx: number; sy: number; sc: Rect } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    const el = new Image()
    el.onload = () => {
      setImg(el)
      const r = { x: 0, y: 0, w: el.naturalWidth, h: el.naturalHeight }
      setCrop(r)
      setTargetW(el.naturalWidth)
      setTargetH(el.naturalHeight)
    }
    el.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const startDrag = useCallback((e: React.MouseEvent, handle: DragHandle) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    const scale = containerRef.current.offsetWidth / (img?.naturalWidth ?? 1)
    dragRef.current = {
      handle,
      sx: (e.clientX - rect.left) / scale,
      sy: (e.clientY - rect.top) / scale,
      sc: { ...crop },
    }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !containerRef.current || !img) return
      const cr = containerRef.current.getBoundingClientRect()
      const s = containerRef.current.offsetWidth / img.naturalWidth
      const mx = (ev.clientX - cr.left) / s
      const my = (ev.clientY - cr.top) / s
      const next = applyHandle(
        dragRef.current.handle,
        dragRef.current.sc,
        mx - dragRef.current.sx,
        my - dragRef.current.sy,
        img.naturalWidth,
        img.naturalHeight,
      )
      setCrop(next)
    }

    const onUp = () => {
      dragRef.current = null
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    document.body.style.cursor = HANDLE_CURSORS[handle]
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [crop, img])

  const handleConfirm = useCallback(async () => {
    if (!img) return
    setProcessing(true)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, targetW, targetH)
    canvas.toBlob(blob => {
      if (blob) {
        const ext = file.name.match(/\.[^.]+$/)
        onConfirm(blob, file.name.replace(/\.[^.]+$/, '') + (ext?.[0] ?? '.jpg'))
      }
      setProcessing(false)
    }, 'image/jpeg', 0.92)
  }, [img, crop, targetW, targetH, file, onConfirm])

  if (!img) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
      }}>
        <span style={{ color: 'var(--text-mute)', fontSize: 13 }}>Loading…</span>
      </div>
    )
  }

  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  const scale = Math.min(MAX_DISPLAY_W / imgW, MAX_DISPLAY_H / imgH, 1)
  const dW = Math.round(imgW * scale)
  const dH = Math.round(imgH * scale)

  const dc = {
    x: crop.x * scale, y: crop.y * scale,
    w: crop.w * scale, h: crop.h * scale,
  }

  const H_SIZE = 8
  const handles: Array<{ id: DragHandle; top?: number; bottom?: number; left?: number; right?: number }> = [
    { id: 'nw', top: -H_SIZE / 2, left: -H_SIZE / 2 },
    { id: 'n',  top: -H_SIZE / 2, left: dc.w / 2 - H_SIZE / 2 },
    { id: 'ne', top: -H_SIZE / 2, right: -H_SIZE / 2 },
    { id: 'e',  top: dc.h / 2 - H_SIZE / 2, right: -H_SIZE / 2 },
    { id: 'se', bottom: -H_SIZE / 2, right: -H_SIZE / 2 },
    { id: 's',  bottom: -H_SIZE / 2, left: dc.w / 2 - H_SIZE / 2 },
    { id: 'sw', bottom: -H_SIZE / 2, left: -H_SIZE / 2 },
    { id: 'w',  top: dc.h / 2 - H_SIZE / 2, left: -H_SIZE / 2 },
  ]

  const inputStyle: React.CSSProperties = {
    width: 68, padding: '4px 6px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 4, color: 'var(--text)', fontSize: 12,
    fontFamily: 'var(--mono)', outline: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        maxWidth: MAX_DISPLAY_W + 40,
      }}>
        {/* Header */}
        <div style={{
          padding: '11px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
            Edit image
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--mono)' }}>
            {imgW} × {imgH} px
          </span>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', fontSize: 18, lineHeight: 1, padding: '0 2px',
            }}
          >×</button>
        </div>

        {/* Canvas area */}
        <div style={{ padding: 16, background: 'var(--bg)', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={containerRef}
            style={{ position: 'relative', width: dW, height: dH, flexShrink: 0, cursor: 'crosshair', userSelect: 'none' }}
          >
            <img src={imgUrl} style={{ width: dW, height: dH, display: 'block', pointerEvents: 'none' }} />

            {/* Dim overlay: 4 rects around the crop rect */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: dc.y, background: 'rgba(0,0,0,0.52)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: dc.y + dc.h, bottom: 0, background: 'rgba(0,0,0,0.52)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: dc.y, height: dc.h, left: 0, width: dc.x, background: 'rgba(0,0,0,0.52)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: dc.y, height: dc.h, left: dc.x + dc.w, right: 0, background: 'rgba(0,0,0,0.52)', pointerEvents: 'none' }} />

            {/* Crop rect */}
            <div
              onMouseDown={e => startDrag(e, 'move')}
              style={{
                position: 'absolute',
                top: dc.y, left: dc.x, width: dc.w, height: dc.h,
                border: '1px solid rgba(255,255,255,0.85)',
                outline: '1px solid rgba(0,0,0,0.4)',
                cursor: 'move', boxSizing: 'border-box',
              }}
            >
              {/* Rule-of-thirds grid */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35 }}>
                {[33.33, 66.66].map(p => (
                  <div key={`h${p}`} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'white' }} />
                ))}
                {[33.33, 66.66].map(p => (
                  <div key={`v${p}`} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, background: 'white' }} />
                ))}
              </div>

              {/* Corner + edge handles */}
              {handles.map(({ id, ...pos }) => (
                <div
                  key={id}
                  onMouseDown={e => startDrag(e, id)}
                  style={{
                    position: 'absolute',
                    width: H_SIZE, height: H_SIZE,
                    background: 'var(--accent)',
                    border: '1px solid white',
                    borderRadius: 1,
                    cursor: HANDLE_CURSORS[id],
                    ...pos,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Crop info + reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>Crop</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
              {Math.round(crop.x)},{Math.round(crop.y)}  {Math.round(crop.w)}×{Math.round(crop.h)}
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                setCrop({ x: 0, y: 0, w: imgW, h: imgH })
              }}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 4, padding: '2px 9px', cursor: 'pointer',
                fontSize: 11, color: 'var(--text-dim)',
              }}
            >Reset crop</button>
          </div>

          {/* Output size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-mute)', width: 42 }}>Output</span>
            <input
              type="number" min={1} value={targetW}
              onChange={e => {
                const v = Math.max(1, Number(e.target.value))
                setTargetW(v)
                if (lockRatio && crop.w > 0) setTargetH(Math.round(v * crop.h / crop.w))
              }}
              style={inputStyle}
            />
            <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>×</span>
            <input
              type="number" min={1} value={targetH}
              onChange={e => {
                const v = Math.max(1, Number(e.target.value))
                setTargetH(v)
                if (lockRatio && crop.h > 0) setTargetW(Math.round(v * crop.w / crop.h))
              }}
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>px</span>
            <button
              onClick={() => setLockRatio(v => !v)}
              style={{
                background: lockRatio ? 'var(--accent-soft)' : 'transparent',
                border: '1px solid',
                borderColor: lockRatio ? 'var(--accent)' : 'var(--border)',
                borderRadius: 4, padding: '3px 8px',
                cursor: 'pointer',
                color: lockRatio ? 'var(--accent)' : 'var(--text-mute)',
                fontSize: 13,
              }}
              title={lockRatio ? 'Aspect ratio locked' : 'Aspect ratio free'}
            >🔗</button>
            <button
              onClick={() => {
                setTargetW(Math.round(crop.w))
                setTargetH(Math.round(crop.h))
              }}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 4, padding: '2px 9px', cursor: 'pointer',
                fontSize: 11, color: 'var(--text-dim)',
              }}
            >1:1</button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 2 }}>
            <button
              onClick={onCancel}
              style={{
                padding: '7px 16px', borderRadius: 5, fontSize: 12,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 500,
              }}
            >Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              style={{
                padding: '7px 18px', borderRadius: 5, fontSize: 12, fontWeight: 600,
                background: 'var(--accent)', color: 'var(--accent-ink)',
                border: 'none', cursor: processing ? 'default' : 'pointer',
                opacity: processing ? 0.7 : 1,
              }}
            >{processing ? 'Processing…' : 'Insert image'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
