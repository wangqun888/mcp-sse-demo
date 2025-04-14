import { Config } from "./config.js";
import { Anthropic } from "@anthropic-ai/sdk";
import { Ollama } from "ollama";

/**
 * 格式化工具调用结果
 */
export function formatToolResult(result: any): string {
  try {
    if (typeof result === "string") {
      // 尝试解析JSON字符串
      try {
        const parsedResult = JSON.parse(result);
        return JSON.stringify(parsedResult, null, 2);
      } catch {
        return result;
      }
    } else if (result && result.content && Array.isArray(result.content)) {
      // 处理MCP结果格式
      return result.content
        .filter((item: any) => item.type === "text")
        .map((item: any) => {
          try {
            return JSON.stringify(JSON.parse(item.text), null, 2);
          } catch {
            return item.text;
          }
        })
        .join("\n");
    } else {
      // 处理其他格式
      return JSON.stringify(result, null, 2);
    }
  } catch (error) {
    console.error("格式化结果出错:", error);
    return String(result);
  }
}

// 根据配置创建Anthropic客户端
export function createAnthropicClient(config: Config) {
  let apiKey, baseURL;

  if (config.ai.anthropicApiKey) {
    apiKey = config.ai.anthropicApiKey;
    baseURL = config.ai.anthropicApiUrl;
    return new Anthropic({
      apiKey,
      baseURL,
    });
  } else {
    throw new Error("未配置API密钥");
  }
}

// 创建Ollama客户端
export function createOllamaClient(config: Config) {
  const ollama = new Ollama({
    host: config.ai.ollamaApiUrl,
  });
  return ollama;
}

/**
 * 带重试机制的异步函数执行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 2000
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error.message.includes('Request timed out')) {
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  
  throw lastError;
}


