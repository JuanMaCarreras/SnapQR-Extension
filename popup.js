document.getElementById('star-scan').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      window.dispatchEvent(new CustomEvent('qr-scan-start'))
    },
  })
})
