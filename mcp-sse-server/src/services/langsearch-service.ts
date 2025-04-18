import axios from 'axios';
import { 
  LangSearchOptions, 
  LangSearchResponse, 
  LangSearchApiResponse, 
  LangSearchWebPage 
} from '../types/index.js';

/**
 * 使用 LangSearch 进行网络搜索
 * @param options 搜索选项
 * @returns 搜索结果
 */
export async function searchLang(options: LangSearchOptions): Promise<LangSearchResponse> {
  try {
    const apiKey = process.env.LANGSEARCH_API_KEY || 'sk-0b8eea6f35204b15a46830acec0a47b5';
    if (!apiKey) {
      throw new Error('未配置LangSearch API密钥');
    }

    const requestBody = {
      query: options.query,
      freshness: options.freshness || 'noLimit',
      summary: options.summary ?? false,
      count: Math.min(Math.max(options.count || 10, 1), 10)
    };

    const response = await axios.post<LangSearchApiResponse>(
      'https://api.langsearch.com/v1/web-search',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '请求失败');
    }

    const webPages = response.data.data.webPages.value;
    const results = webPages.map((page: LangSearchWebPage) => ({
      title: page.name,
      url: page.url,
      content: page.snippet,
      summary: page.summary,
      datePublished: page.datePublished
    }));

    return {
      success: true,
      results
    };
  } catch (error: any) {
    return {
      success: false,
      error: `LangSearch查询失败: ${error.message}`
    };
  }
}

/**
 * 使用 LangSearch 进行网络搜索并格式化结果
 */
export async function searchLangWithFormat(options: LangSearchOptions): Promise<{
  content: Array<{ type: "text"; text: string; }>
}> {
  const response = await searchLang(options);
  
  if (!response.success) {
    return {
      content: [
        {
          type: "text",
          text: response.error || "搜索失败"
        }
      ]
    };
  }

  const searchResults = response.results!.map((result, index) => 
    `引用 ${index + 1}:\n标题: ${result.title}\nURL: ${result.url}\n内容: ${result.content}${result.summary ? `\n摘要: ${result.summary}` : ''}\n`
  ).join('\n');

  return {
    content: [
      {
        type: "text",
        text: searchResults
      }
    ]
  };
}