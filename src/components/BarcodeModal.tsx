import React, { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { fetchByBarcode } from '../lib/db'
import type { FoodItem } from '../lib/utils'

export function BarcodeModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (f: FoodItem) => void
}) {
  const [status, setStatus] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    if (!open) return
    let canceled = false
    ;(async () => {
      try {
        if ('BarcodeDetector' in window) {
          const Any: any = (window as any).BarcodeDetector
          const detector = new Any({
            formats: ['ean_13', 'ean_8', 'upc_e', 'upc_a', 'code_128', 'code_39'],
          })
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          })
          streamRef.current = stream
          if (videoRef.current) {
            // @ts-ignore
            videoRef.current.srcObject = stream
            await videoRef.current.play()
          }
          scanningRef.current = true
          setStatus('Scanning… point camera at barcode')

          const scan = async () => {
            if (canceled || !scanningRef.current || !videoRef.current) return
            try {
              const bmp = await createImageBitmap(videoRef.current)
              const codes = await detector.detect(bmp)
              if (codes && codes[0]) {
                scanningRef.current = false
                setStatus('Found: ' + codes[0].rawValue)
                const item = await fetchByBarcode(codes[0].rawValue)
                if (item) onAdd(item)
                stop()
                onClose()
                return
              }
            } catch {}
            requestAnimationFrame(scan)
          }
          requestAnimationFrame(scan)
        } else {
          setStatus('BarcodeDetector not supported. Enter code manually in Food search.')
        }
      } catch (e: any) {
        setStatus('Camera error: ' + (e?.message || e))
      }
    })()
    return () => {
      canceled = true
      stop()
    }
  }, [open])

  function stop() {
    scanningRef.current = false
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop()
      streamRef.current = null
    }
    if (videoRef.current) {
      try { videoRef.current.pause() } catch {}
      // @ts-ignore
      videoRef.current.srcObject = null
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span className="font-medium">Scan barcode</span>
          </div>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
        <div className="p-4 space-y-3">
          <video ref={videoRef} className="w-full aspect-video rounded-xl bg-black/40" muted playsInline />
          {status && <div className="text-xs text-muted">{status}</div>}
        </div>
      </div>
    </div>
  )
}

export default BarcodeModal
