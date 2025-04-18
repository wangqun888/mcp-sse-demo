import { chromium } from "playwright";
import { ToolResponse } from "../types/index.js";
/**
 * 自动化网页操作服务
 * @param url 目标网页URL
 * @param actions 自动化操作指令，格式为JSON字符串或自然语言描述
 * @returns 操作结果
 */
export async function automateWebPage(url: string, actions: string): Promise<ToolResponse> {
  console.log("执行 Playwright 自动化操作", { url, actions });
  
  // 尝试解析actions字符串为操作数组
  let actionsList = [];
  try {
    // 尝试解析JSON
    if (actions.trim().startsWith('[') || actions.trim().startsWith('{')) {
      try {
        actionsList = JSON.parse(actions);
        // 确保解析后是数组
        if (!Array.isArray(actionsList)) {
          actionsList = [actionsList];
        }
      } catch (jsonError: any) {
        // 提供更详细的JSON解析错误信息
        console.error("JSON解析失败:", jsonError);
        return {
          content: [
            {
              type: "text" as const,
              text: `JSON解析失败: ${jsonError.message}\n\n请检查JSON格式是否正确，特别是括号、逗号和引号。\n\n您也可以使用自然语言描述操作，例如：\n点击 按钮\n输入 文本 到 输入框\n导航到 https://example.com\n截图`
            }
          ]
        };
      }
    } else {
      // 简单的自然语言解析
      // 按行分割，每行作为一个操作
      const lines = actions.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('点击') || trimmedLine.includes('点击')) {
          const selector = trimmedLine.replace(/点击\s*[""']?([^""']+)[""']?/g, '$1').trim();
          actionsList.push({ type: 'click', selector });
        } else if (trimmedLine.startsWith('输入') || trimmedLine.includes('输入')) {
          const match = trimmedLine.match(/输入\s*[""']?([^""']+)[""']?\s*[到在于]?\s*[""']?([^""']+)[""']?/);
          if (match) {
            actionsList.push({ type: 'fill', selector: match[2], value: match[1] });
          }
        } else if (trimmedLine.startsWith('导航') || trimmedLine.includes('导航') || trimmedLine.includes('访问')) {
          const url = trimmedLine.replace(/(?:导航|访问)(?:到|至)?\s*[""']?([^""']+)[""']?/g, '$1').trim();
          actionsList.push({ type: 'navigate', value: url });
        } else if (trimmedLine.startsWith('截图') || trimmedLine.includes('截图')) {
          actionsList.push({ type: 'screenshot' });
        }
      }
    }
  } catch (error: any) {
    console.error("解析操作指令失败:", error);
    return {
      content: [
        {
          type: "text" as const,
          text: `解析操作指令失败: ${error.message}`
        }
      ]
    };
  }
  
  if (actionsList.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "未能识别任何有效的操作指令"
        }
      ]
    };
  }
  
  const browser = await chromium.launch({
    headless: false,  // 设置为 false 以显示浏览器窗口
    args: ['--start-maximized'] // 最大化窗口
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    await page.setDefaultNavigationTimeout(30000);
    console.log("正在访问页面:", url);
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const results = [];
    
    for (const action of actionsList) {
      console.log("执行操作:", action);
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.waitForSelector(action.selector, { 
              state: 'visible',
              timeout: 5000 
            });
            await page.click(action.selector);
            results.push(`点击元素: ${action.selector}`);
          }
          break;
        
        case 'type':
          if (action.selector && action.value) {
            await page.waitForSelector(action.selector, { 
              state: 'visible',
              timeout: 5000 
            });
            await page.type(action.selector, action.value);
            results.push(`输入文本: ${action.selector} = ${action.value}`);
          }
          break;
          
        case 'fill':
          if (action.selector && action.value) {
            await page.waitForSelector(action.selector, { 
              state: 'visible',
              timeout: 5000 
            });
            await page.fill(action.selector, action.value);
            results.push(`填充表单: ${action.selector} = ${action.value}`);
          }
          break;
          
        case 'navigate':
          if (action.value) {
            await page.goto(action.value);
            results.push(`导航至: ${action.value}`);
          }
          break;
          
        case 'screenshot':
          const buffer = await page.screenshot();
          const base64Image = buffer.toString('base64');
          return {
            content: [
              {
                type: "image" as const,
                data: base64Image,
                mimeType: "image/png"
              }
            ]
          };
      }
      // 每个操作后等待一下
      await page.waitForTimeout(1000);
    }
    
    // 操作完成后等待一段时间再关闭
    await page.waitForTimeout(3000);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(results)
        }
      ]
    };
  } catch (error: any) {
    console.error("自动化操作失败:", error);
    return {
      content: [
        {
          type: "text" as const,
          text: `自动化操作失败: ${error.message}`
        }
      ]
    };
  } finally {
    await browser.close();
  }
}