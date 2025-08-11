windows.addEventListener('qr-scan-start', async () => {
  createSelectionOverlay()
})

const createSelectionOverlay = () => {
  const overlay = document.createElement('div')
  overlay.id = 'qr-selection-overlay'
  document.body.appendChild(overlay)

  let startX, startY, selectionBox

  overlay.addEventListener('mousedown', e => {
    startX = e.clientX
    startY = e.clientY

    selectionBox = document.createElement('div')
    selectionBox.className = 'selection-box'
    selectionBox.style.left = `${startX}px`
    selectionBox.style.top = `${startY}px`
    overlay.appendChild(selectionBox)

    const onMouseMove = e2 => {
      const width = e2.clientX - startX
      const height = e2.clientY - startY
      selectionBox.style.width = `${Math.abs(width)}px`
      selectionBox.style.height = `${Math.abs(height)}px`
      selectionBox.style.left = `${Math.min(e2.clientX, startX)}px`
      selectionBox.style.top = `${Math.min(e2.clientY, startY)}px`
    }

    const onMouseUp = async e3 => {
      overlay.removeEventListener('mousemove', onMouseMove)
      overlay.removeEventListener('mouseup', onMouseUp)

      const rect = selectionBox.getBoundingClientRect()
      overlay.remove()

      chrome.runtime.sendMessage({
        type: 'CAPTURE_AND_SCAN',
        area: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      })
    }

    overlay.addEventListener('mousemove', onMouseMove)
    overlay.addEventListener('mouseup', onMouseUp)
  })
}
