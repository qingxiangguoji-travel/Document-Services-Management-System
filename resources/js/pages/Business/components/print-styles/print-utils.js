/**
 * 专业打印工具函数
 */

/**
 * 创建打印专用的iframe
 * @param {string} html - 要打印的HTML内容
 * @param {string} title - 打印标题
 * @returns {Promise<HTMLIFrameElement>}
 */
export const createPrintIframe = (html, title = 'Invoice') => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    
    // 设置iframe样式（隐藏但可访问）
    iframe.style.cssText = `
      position: fixed;
      width: 1px;
      height: 1px;
      border: none;
      clip: rect(0 0 0 0);
      overflow: hidden;
    `;
    
    document.body.appendChild(iframe);
    
    // 准备打印内容
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: "Microsoft YaHei", "SimHei", "PingFang SC", sans-serif;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();
    
    // 等待内容加载
    iframe.onload = () => resolve(iframe);
  });
};

/**
 * 执行打印
 * @param {HTMLIFrameElement} iframe - 打印iframe
 * @returns {Promise<void>}
 */
export const executePrint = (iframe) => {
  return new Promise((resolve) => {
    const win = iframe.contentWindow;
    
    // 监听打印完成
    const afterPrint = () => {
      document.body.removeChild(iframe);
      resolve();
    };
    
    win.addEventListener('afterprint', afterPrint, { once: true });
    
    // 延迟打印以确保样式加载
    setTimeout(() => {
      win.focus();
      win.print();
    }, 100);
  });
};

/**
 * 专业打印函数
 * @param {HTMLElement} element - 要打印的元素
 * @param {string} title - 打印标题
 */
export const professionalPrint = async (element, title = 'Invoice') => {
  if (!element) {
    throw new Error('打印元素不存在');
  }
  
  // 克隆元素以避免影响原页面
  const clonedElement = element.cloneNode(true);
  
  // 确保所有样式都包含在内
  const html = clonedElement.outerHTML;
  
  // 创建并执行打印
  const iframe = await createPrintIframe(html, title);
  await executePrint(iframe);
};