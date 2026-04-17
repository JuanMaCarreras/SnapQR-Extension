chrome.action.onClicked.addListener(async tab => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['jsQR.js'],
  })
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js'],
  })
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'capture') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
      sendResponse({ dataUrl })
    })
    return true
  }

  if (msg.action === 'openTab') {
    chrome.tabs.create({ url: msg.url })
  }
})
