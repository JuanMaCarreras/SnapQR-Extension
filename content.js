;(function () {
  if (document.getElementById('qr-overlay')) return

  const overlay = document.createElement('div')
  overlay.id = 'qr-overlay'
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483645',
    cursor: 'crosshair',
    background: 'rgba(0,0,0,0.4)',
  })

  const selBox = document.createElement('div')
  Object.assign(selBox.style, {
    position: 'fixed',
    border: '2px solid rgba(255,255,255,0.8)',
    background: 'transparent',
    pointerEvents: 'none',
    display: 'none',
    zIndex: '2147483646',
  })

  const tooltip = document.createElement('div')
  tooltip.textContent = 'Dibuja un rectángulo sobre el QR · ESC para cancelar'
  Object.assign(tooltip.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    pointerEvents: 'none',
    zIndex: '2147483647',
    whiteSpace: 'nowrap',
  })

  document.body.appendChild(overlay)
  document.body.appendChild(selBox)
  document.body.appendChild(tooltip)

  let startX,
    startY,
    isDrawing = false

  overlay.addEventListener('mousedown', e => {
    startX = e.clientX
    startY = e.clientY
    isDrawing = true
    Object.assign(selBox.style, {
      display: 'block',
      left: startX + 'px',
      top: startY + 'px',
      width: '0px',
      height: '0px',
    })
  })

  overlay.addEventListener('mousemove', e => {
    if (!isDrawing) return
    const x = Math.min(startX, e.clientX)
    const y = Math.min(startY, e.clientY)
    const w = Math.abs(e.clientX - startX)
    const h = Math.abs(e.clientY - startY)
    Object.assign(selBox.style, {
      left: x + 'px',
      top: y + 'px',
      width: w + 'px',
      height: h + 'px',
    })
  })

  overlay.addEventListener('mouseup', async e => {
    if (!isDrawing) return
    isDrawing = false
    selBox.style.display = 'none'

    const x = Math.min(startX, e.clientX)
    const y = Math.min(startY, e.clientY)
    const w = Math.abs(e.clientX - startX)
    const h = Math.abs(e.clientY - startY)

    overlay.remove()
    selBox.remove()
    tooltip.remove()

    if (w < 10 || h < 10) return

    await scanAndShow(x, y, w, h)
  })

  document.addEventListener(
    'keydown',
    e => {
      if (e.key === 'Escape') {
        overlay.remove()
        selBox.remove()
        tooltip.remove()
      }
    },
    { once: true }
  )

  async function scanAndShow(x, y, w, h) {
    const dpr = window.devicePixelRatio || 1

    const response = await chrome.runtime.sendMessage({ action: 'capture' })
    if (!response?.dataUrl) {
      showToast('❌ Error al capturar la pantalla')
      return
    }

    const img = new Image()
    img.src = response.dataUrl
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        img,
        Math.round(x * dpr),
        Math.round(y * dpr),
        Math.round(w * dpr),
        Math.round(h * dpr),
        0,
        0,
        Math.round(w * dpr),
        Math.round(h * dpr)
      )

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code?.data) {
        showResultPanel(code.data)
      } else {
        showToast('❌ No se encontró ningún QR en esa zona')
      }
    }
  }

  function showResultPanel(url) {
    document.getElementById('qr-result-panel')?.remove()
    document.getElementById('qr-backdrop')?.remove()

    const cleanUrl = String(url)
      .trim()
      .replace(/^\uFEFF/, '')

    const backdrop = document.createElement('div')
    backdrop.id = 'qr-backdrop'
    Object.assign(backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: '2147483646',
    })
    backdrop.addEventListener('click', closePanel)

    const panel = document.createElement('div')
    panel.id = 'qr-result-panel'
    Object.assign(panel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#1e1e1e',
      color: '#fff',
      padding: '24px',
      borderRadius: '16px',
      fontSize: '14px',
      zIndex: '2147483647',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      width: '380px',
      fontFamily: 'sans-serif',
    })

    const title = document.createElement('div')
    title.textContent = '🔍 QR Detectado'
    Object.assign(title.style, {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '12px',
    })

    const urlBox = document.createElement('div')
    urlBox.textContent = cleanUrl
    Object.assign(urlBox.style, {
      background: '#2a2a2a',
      padding: '10px 12px',
      borderRadius: '8px',
      wordBreak: 'break-all',
      fontSize: '13px',
      color: '#ccc',
      marginBottom: '16px',
      userSelect: 'text',
    })

    const openBtn = document.createElement('button')
    openBtn.textContent = '🌐 Abrir enlace'
    Object.assign(openBtn.style, {
      width: '100%',
      padding: '10px',
      background: '#2196F3',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      marginBottom: '8px',
    })
    openBtn.addEventListener(
      'click',
      () => {
        chrome.runtime.sendMessage({ action: 'openTab', url: cleanUrl })
        closePanel()
      },
      { once: true }
    )

    const copyBtn = document.createElement('button')
    copyBtn.textContent = '📋 Copiar URL'
    Object.assign(copyBtn.style, {
      width: '100%',
      padding: '10px',
      background: '#333',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      marginBottom: '8px',
    })
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(cleanUrl)
      copyBtn.textContent = '✅ Copiado!'
      setTimeout(() => (copyBtn.textContent = '📋 Copiar URL'), 2000)
    })

    const closeBtn = document.createElement('button')
    closeBtn.textContent = 'Cerrar'
    Object.assign(closeBtn.style, {
      width: '100%',
      padding: '10px',
      background: 'transparent',
      color: '#888',
      border: '1px solid #444',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
    })
    closeBtn.addEventListener('click', closePanel)

    panel.appendChild(title)
    panel.appendChild(urlBox)
    panel.appendChild(openBtn)
    panel.appendChild(copyBtn)
    panel.appendChild(closeBtn)

    document.body.appendChild(backdrop)
    document.body.appendChild(panel)

    function closePanel() {
      panel.remove()
      backdrop.remove()
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div')
    toast.textContent = msg
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: '2147483647',
    })
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }
})()
