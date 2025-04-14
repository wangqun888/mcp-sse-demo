/**
 * 这是一个Web客户端示例，用于在Node.js服务器中集成MCP客户端
 * 实际项目中可以把这部分代码整合到Next.js、Express或其他Web框架中
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { config } from "./config.js";
import { createOllamaClient, withRetry } from "./utils.js";
import { Ollama } from "ollama";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mcpClient: McpClient | null = null;
let anthropicTools: any[] = [];
let ollamaClient: Ollama;

const app = express();

// 使用中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// 初始化MCP客户端
async function initMcpClient() {
  if (mcpClient) return;

  try {
    console.log("正在连接到MCP服务器...");
    mcpClient = new McpClient({
      name: "mcp-client",
      version: "1.0.0",
    });

    const transport = new SSEClientTransport(new URL(config.mcp.serverUrl));

    await mcpClient.connect(transport);
    const { tools } = await mcpClient.listTools();
    console.log(`获取到的工具: ${tools.map(t => t.name).join(', ')}`);
    // 转换工具格式为Anthropic所需的数组形式
    anthropicTools = tools.map((tool: any) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      };
    });
    // 创建Anthropic客户端
    // aiClient = createAnthropicClient(config);
    // 创建Ollama客户端
    ollamaClient = createOllamaClient(config);

    console.log("MCP客户端和工具已初始化完成");
  } catch (error) {
    console.error("初始化MCP客户端失败:", error);
    throw error;
  }
}

// 主页
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 创建路由器
const apiRouter = express.Router();

// 中间件：确保MCP客户端已初始化
// @ts-ignore
apiRouter.use((req, res, next) => {
  if (!mcpClient) {
    initMcpClient().catch(console.error);
  }
  next();
});

// API: 获取可用工具列表
// @ts-ignore
apiRouter.get("/tools", async (req, res) => {
  try {
    res.json({ tools: anthropicTools });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: 聊天请求
// @ts-ignore
apiRouter.post("/chat", async (req, res) => {
  try {
    console.log("收到聊天请求");
    const { message, history = [] } = req.body;
    console.log(`用户消息: ${message}`);
    console.log(`历史消息数量: ${history.length}`);

    if (!message) {
      console.warn("请求中消息为空");
      return res.status(400).json({ error: "消息不能为空" });
    }

    // 构建消息历史
    const messages = [...history, { role: "user", content: message }];
    console.log(`准备发送到AI的消息总数: ${messages.length}`);

    // 调用AI
    console.log(`开始调用AI模型: ${config.ai.defaultModel}`);
    const response = await ollamaClient.chat({
      model: config.ai.defaultModel,
      messages,
      tools: anthropicTools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema
        }
      })),
    });
    console.log("AI响应成功");

    // 处理工具调用
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      // 处理所有工具调用
      const toolResults = [];

      for (const toolCall of response.message.tool_calls) {
        const name = toolCall.function.name;
        const toolInput = toolCall.function.arguments;
        console.log(`工具调用: ${name}, 参数: ${toolInput}`);
        // 处理工具调用并获取结果
        // 这里需要根据实际情况调用相应的工具，并获取结果
        // 这里只是一个示例，实际项目中需要根据具体情况实现
        // 假设工具调用成功，返回结果为toolResult
        try {
          // 调用MCP工具
          if (!mcpClient) {
            console.error("MCP客户端未初始化");
            throw new Error("MCP客户端未初始化");
          }
          console.log(`开始调用MCP工具: ${name}`);
          
          // 解析工具参数
          let parsedInput = toolInput;
          if (typeof toolInput === 'string') {
            try {
              parsedInput = JSON.parse(toolInput);
            } catch (e) {
              console.warn(`工具参数解析失败，使用原始参数: ${toolInput}`);
            }
          }
          
          // 确保参数是对象类型并且包含必要的字段
          let finalInput: any = {};
          if (name === 'purchase') {
            // 规范化 purchase 工具的参数
            const items = Array.isArray(parsedInput?.items) ? parsedInput.items : [];
            finalInput = {
              customerName: parsedInput?.customerName || '匿名用户',
              items: items.map((item: any) => ({
                productId: Number(item.productID || item.productId) || 0, // 确保转换为数字类型
                quantity: Number(item.quantity) || 1 // 确保转换为数字类型
              }))
            };
          } else {
            finalInput = typeof parsedInput === 'object' ? parsedInput : {};
          }
          
          console.log(`最终工具参数: ${JSON.stringify(finalInput)}`);
          
          const toolResult = await withRetry(async () => {
            return await mcpClient!.callTool({
              name,
              arguments: finalInput,
            });
          });
          console.log(`工具返回结果: ${JSON.stringify(toolResult)}`);

          toolResults.push({
            name,
            result: toolResult,
          });
        } catch (error: any) {
          console.error(`工具调用失败: ${name}`, error);
          toolResults.push({
            name,
            error: error.message,
          });
        }
      }

      // 将工具结果发送回AI获取最终回复
      console.log("开始获取AI最终回复");
      const finalResponse = await ollamaClient.chat({
        model: config.ai.defaultModel,
        messages: [
          ...messages,
          { role: 'assistant', content: response.message.content },
          { role: 'user', content: JSON.stringify(toolResults) }
        ],
      });
      console.log("获取AI最终回复成功");

      res.json({
        response: finalResponse.message.content,
        toolCalls: toolResults,
      });
    } else {
      // 直接返回AI回复
      res.json({
        response: response.message.content,
        toolCalls: [],
      });
    }
  } catch (error: any) {
    console.error("聊天请求处理失败:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: 直接调用工具
// @ts-ignore
apiRouter.post("/call-tool", async (req, res) => {
  try {
    const { name, args } = req.body;

    if (!name) {
      console.warn("请求中工具名称为空");
      return res.status(400).json({ error: "工具名称不能为空" });
    }

    if (!mcpClient) {
      console.error("MCP客户端未初始化");
      throw new Error("MCP客户端未初始化");
    }

    const result = await mcpClient.callTool({
      name,
      arguments: args || {},
    });
    res.json({ result });
  } catch (error: any) {
    console.error("工具调用请求处理失败:", error);
    res.status(500).json({ error: error.message });
  }
});

// 注册API路由
app.use("/api", apiRouter);

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web客户端服务器已启动，地址: http://localhost:${PORT}`);

  // 预初始化MCP客户端
  initMcpClient().catch(console.error);
});
