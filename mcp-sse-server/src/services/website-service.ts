import axios from 'axios';
import { WebFetchResponse } from '../types/index.js';

/**
 * 获取指定网页的内容
 */
export async function fetchWebsite(url: string): Promise<WebFetchResponse> {
  try {
    const headers = {
      "User-Agent": "MCP Test Server (github.com/modelcontextprotocol/python-sdk)"
    };

    const response = await axios.get(url, { 
      headers,
      timeout: 10000,
      maxRedirects: 5
    });

    return {
      success: true,
      content: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      error: `获取网页内容失败: ${error.message}`
    };
  }
}

/**
 * 获取并格式化网页内容
 */
export async function fetchWebsiteWithFormat(url: string): Promise<{
  content: Array<{ type: "text"; text: string; }>
}> {
  const response = await fetchWebsite(url);
  
  if (!response.success) {
    return {
      content: [
        {
          type: "text",
          text: response.error || "获取网页内容失败"
        }
      ]
    };
  }

  return {
    content: [
      {
        type: "text",
        text: response.content || "网页内容为空"
      }
    ]
  };
}