import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import { z } from "zod";
import { 
  getProducts, 
  getInventory, 
  getOrders, 
  createPurchase
} from "./services/inventory-service.js";
import { getFlightTimesWithFormat } from "./services/flight-service.js";
import { automateWebPage } from "./services/automate-webpage-service.js";
import { searchLangWithFormat } from "./services/langsearch-service.js";
import { getWeatherWithFormat } from "./services/weather-service.js";
import { fetchWebsiteWithFormat } from "./services/website-service.js";

export const server = new McpServer({
  name: "mcp-sse-demo",
  version: "1.0.0",
  description: "提供商品查询、库存管理和订单处理、天气查询、网页搜索、抓取页面代码、航班查询、网页自动化操作等MCP工具",
  // 添加外部服务配置
  services: {
    "amap-sse": {
      url: `${config.amap.mcpUrl}?key=${config.amap.key}`
    }
  }
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

// 修改天气查询工具
server.tool(
  "getWeather",
  "获取指定城市的天气信息",
  {
    city: z.string().describe("城市名称")
  },
  async ({ city }) => {
    console.log("查询天气", { city });
    return await getWeatherWithFormat(city);
  }
);

// 添加网页抓取工具
server.tool(
  "fetchWebsite",
  "获取指定网页的内容",
  {
    url: z.string().url().describe("网页URL")
  },
  async ({ url }) => {
    console.log("抓取网页", { url });
    return await fetchWebsiteWithFormat(url);
  }
);

// // 添加必应搜索工具
// server.tool(
//   "searchBing",
//   "使用必应搜索引擎进行搜索",
//   {
//     query: z.string().describe("搜索关键词"),
//     pageNum: z.number().optional().describe("搜索结果页数，默认2页")
//   },
//   async ({ query, pageNum }) => {
//     console.log("必应搜索", { query, pageNum });
//     const response = await searchBing(query, pageNum);
    
//     if (!response.success) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: response.error || "搜索失败"
//           }
//         ]
//       };
//     }

//     const searchResults = response.results!.map((result, index) => 
//       `引用 ${index + 1}:\n标题: ${result.title}\nURL: ${result.url}\n内容: ${result.content}\n`
//     ).join('\n');

//     return {
//       content: [
//         {
//           type: "text",
//           text: searchResults
//         }
//       ]
//     };
//   }
// );

// 添加 LangSearch 查询工具
server.tool(
  "searchLang",
  "使用LangSearch进行网络搜索",
  {
    query: z.string().describe("搜索关键词"),
    freshness: z.enum(['oneDay', 'oneWeek', 'oneMonth', 'oneYear', 'noLimit'])
      .optional()
      .default('noLimit')
      .describe("搜索结果时间范围（可选，默认：noLimit）"),
    summary: z.boolean()
      .optional()
      .default(false)
      .describe("是否显示长文本摘要（可选，默认：false）"),
    count: z.number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("返回结果数量，范围1-10（可选，默认：5）")
  },
  async ({ query, freshness, summary, count }) => {
    console.log("LangSearch搜索", { query, freshness, summary, count });
    return await searchLangWithFormat({ query, freshness, summary, count });
  }
);

// 添加航班查询工具
server.tool(
  "getFlightTimes",
  "查询航班起降时间信息",
  {
    departure: z.string().describe("出发机场代码 (如: LGA, LAX)"),
    arrival: z.string().describe("到达机场代码 (如: LAX, LGA)")
  },
  async ({ departure, arrival }) => {
    console.log("查询航班", { departure, arrival });
    return await getFlightTimesWithFormat(departure, arrival);
  }
);

// 添加 Playwright 网页自动化工具
server.tool(
  "automateWebPage",
  "使用 Playwright 进行网页自动化操作",
  {
    url: z.string().url().describe("目标网页URL"),
    actions: z.string().describe("自动化操作指令，格式为JSON字符串或自然语言描述")
  },
  async ({ url, actions }) => {
    return await automateWebPage(url, actions);
  }
);


