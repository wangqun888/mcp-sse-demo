import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProducts, getInventory, getOrders, createPurchase, fetchWeather, fetchWebsite, searchBing } from "./services/inventory-service.js";

export const server = new McpServer({
  name: "mcp-sse-demo",
  version: "1.0.0",
  description: "提供商品查询、库存管理和订单处理的MCP工具"
});

// 获取产品列表工具
server.tool(
  "getProducts", 
  "获取所有产品信息", 
  {}, 
  async () => {
    console.log("获取产品列表");
    const products = await getProducts();
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(products) 
        }
      ] 
    };
  }
);

// 获取库存信息工具
server.tool(
  "getInventory", 
  "获取所有产品的库存信息", 
  {}, 
  async () => {
    console.log("获取库存信息");
    const inventory = await getInventory();
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(inventory) 
        }
      ] 
    };
  }
);

// 获取订单列表工具
server.tool(
  "getOrders", 
  "获取所有订单信息", 
  {}, 
  async () => {
    console.log("获取订单列表");
    const orders = await getOrders();
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(orders) 
        }
      ] 
    };
  }
);

// 购买商品工具
server.tool(
  "purchase",
  "购买商品",
  {
    items: z
      .array(
        z.object({
          productId: z.number().describe("商品ID"),
          quantity: z.number().describe("购买数量")
        })
      )
      .describe("要购买的商品列表"),
    customerName: z.string().describe("客户姓名")
  },
  async ({ items, customerName }) => {
    console.log("处理购买请求", { items, customerName });
    try {
      const order = await createPurchase(customerName, items);
      return { 
        content: [
          { 
            type: "text", 
            text: JSON.stringify(order) 
          }
        ] 
      };
    } catch (error: any) {
      return { 
        content: [
          { 
            type: "text", 
            text: JSON.stringify({ error: error.message }) 
          }
        ] 
      };
    }
  }
);

// 添加天气查询工具
server.tool(
  "getWeather",
  "获取指定城市的天气信息",
  {
    city: z.string().describe("城市名称")
  },
  async ({ city }, extra) => {  // 添加 extra 参数
    console.log("查询天气", { city });
    const response = await fetchWeather(city);
    
    if (!response.success) {
      return {
        content: [
          {
            type: "text",
            text: response.error || "获取天气信息失败"  // 确保 text 不为 undefined
          }
        ]
      };
    }

    const weather = response.data!;
    const weatherText = `${weather.date} 城市 ${weather.city} 的天气情况：
温度：${weather.temperature}
天气：${weather.description}
湿度：${weather.humidity}
风速：${weather.windSpeed}`;

    return {
      content: [
        {
          type: "text",
          text: weatherText  // weatherText 一定是 string 类型
        }
      ]
    };
  }
);

// 添加网页抓取工具
server.tool(
  "fetchWebsite",
  "获取指定网页的内容",
  {
    url: z.string().url().describe("网页URL")
  },
  async ({ url }, extra) => {  // 添加 extra 参数
    console.log("抓取网页", { url });
    const response = await fetchWebsite(url);
    
    if (!response.success) {
      return {
        content: [
          {
            type: "text",
            text: response.error || "获取网页内容失败"  // 确保 text 不为 undefined
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: response.content || "网页内容为空"  // 确保 text 不为 undefined
        }
      ]
    };
  }
);

// 添加必应搜索工具
server.tool(
  "searchBing",
  "使用必应搜索引擎进行搜索",
  {
    query: z.string().describe("搜索关键词"),
    pageNum: z.number().optional().describe("搜索结果页数，默认2页")
  },
  async ({ query, pageNum }) => {
    console.log("必应搜索", { query, pageNum });
    const response = await searchBing(query, pageNum);
    
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
      `引用 ${index + 1}:\n标题: ${result.title}\nURL: ${result.url}\n内容: ${result.content}\n`
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
);
