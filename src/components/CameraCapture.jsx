import { useEffect, useRef, useState } from 'react'
import { FaCamera, FaXmark } from 'react-icons/fa6'

export default function CameraCapture({ onCapture }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    setIsOpen(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Could not access the camera. Please ensure permissions are granted.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        stopCamera()
      }, 'image/jpeg')
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <>
      <button type="button" className="btn" onClick={startCamera}>
        <FaCamera /> Take Photo
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', maxWidth: '90%', width: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Take a Photo</h3>
              <button type="button" className="btn" onClick={stopCamera} style={{ padding: '4px' }}>
                <FaXmark />
              </button>
            </div>
            
            {error ? (
              <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>
            ) : (
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', backgroundColor: '#000', borderRadius: '4px' }} />
            )}

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button type="button" className="btn" onClick={stopCamera}>Cancel</button>
              {!error && (
                <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                  <FaCamera /> Capture
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
