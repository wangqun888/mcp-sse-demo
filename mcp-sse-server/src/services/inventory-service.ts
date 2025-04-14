import { Product, Inventory, Order, WeatherResponse, WeatherData, WebFetchResponse, BingSearchResponse } from '../types/index.js';
import axios from 'axios';

// 模拟数据存储
let products: Product[] = [
  { id: 1, name: "智能手表Galaxy", price: 1299, description: "健康监测，运动追踪，支持多种应用" },
  { id: 2, name: "无线蓝牙耳机Pro", price: 899, description: "主动降噪，30小时续航，IPX7防水" },
  { id: 3, name: "便携式移动电源", price: 299, description: "20000mAh大容量，支持快充，轻薄设计" },
  { id: 4, name: "华为MateBook X Pro", price: 1599, description: "14.2英寸全面屏，3:2比例，100% sRGB色域" },
];

// 模拟库存数据
let inventory: Inventory[] = [
  { productId: 1, quantity: 100 },
  { productId: 2, quantity: 50 },
  { productId: 3, quantity: 200 },
  { productId: 4, quantity: 150 }
];

let orders: Order[] = [];

export async function getProducts(): Promise<Product[]> {
  return products;
}

export async function getInventory(): Promise<Inventory[]> {
  return inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  });
}

export async function getOrders(): Promise<Order[]> {
  return [...orders].sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
}

export async function createPurchase(customerName: string, items: {productId: number, quantity: number}[]): Promise<Order> {
  if (!customerName || !items || items.length === 0) {
    throw new Error("请求无效：缺少客户名称或商品");
  }

  let totalAmount = 0;
  
  // 验证库存并计算总价
  for (const item of items) {
    const inventoryItem = inventory.find(i => i.productId === item.productId);
    const product = products.find(p => p.id === item.productId);

    if (!inventoryItem || !product) {
      throw new Error(`商品ID ${item.productId} 不存在`);
    }

    if (inventoryItem.quantity < item.quantity) {
      throw new Error(`商品 ${product.name} 库存不足. 可用: ${inventoryItem.quantity}`);
    }

    totalAmount += product.price * item.quantity;
  }

  // 创建订单
  const order: Order = {
    id: orders.length + 1,
    customerName,
    items,
    totalAmount,
    orderDate: new Date().toISOString()
  };

  // 更新库存
  items.forEach(item => {
    const inventoryItem = inventory.find(i => i.productId === item.productId)!;
    inventoryItem.quantity -= item.quantity;
  });

  orders.push(order);
  return order;
}

export async function fetchWeather(city: string): Promise<WeatherResponse> {
  try {
    const encodedCity = encodeURIComponent(city);
    const response = await axios.get(
      `https://wttr.in/${encodedCity}?format=j1&lang=zh`,
      { timeout: 10000 }
    );

    if (!response.data) {
      return {
        success: false,
        error: `获取 ${city} 的天气信息失败: 服务器返回空数据`
      };
    }

    const current = response.data.current_condition[0];
    const weatherData: WeatherData = {
      city,
      date: current.localObsDateTime,
      temperature: `${current.temp_C}°C`,
      description: current.lang_zh[0].value,
      humidity: `${current.humidity}%`,
      windSpeed: `${current.windspeedKmph}km/h`
    };

    return {
      success: true,
      data: weatherData
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.code === 'ECONNABORTED'
        ? `获取 ${city} 的天气信息超时，请稍后重试`
        : `获取 ${city} 的天气信息失败: ${error.message}`
    };
  }
}

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

export async function searchBing(query: string, pageNum: number = 2): Promise<BingSearchResponse> {
  try {
    const subscriptionKey = process.env.BING_API_KEY || '';
    if (!subscriptionKey) {
      throw new Error('未配置必应API密钥');
    }

    const endpoint = 'https://api.bing.microsoft.com/v7.0/search';
    const response = await axios.get(endpoint, {
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
      },
      params: {
        q: query,
        mkt: 'zh-CN',
        count: pageNum * 10
      }
    });

    const results = response.data.webPages.value.map((page: any) => ({
      title: page.name,
      url: page.url,
      content: page.snippet
    }));

    return {
      success: true,
      results
    };
  } catch (error: any) {
    return {
      success: false,
      error: `搜索失败: ${error.message}`
    };
  }
}
