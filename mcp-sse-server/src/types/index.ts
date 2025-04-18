export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

export interface Inventory {
  productId: number;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: number;
  customerName: string;
  items: Array<{productId: number, quantity: number}>;
  totalAmount: number;
  orderDate: string;
}

export interface WeatherData {
  city: string;
  date: string;
  temperature: string;
  description: string;
  humidity: string;
  windSpeed: string;
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
}

export interface WebFetchResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface BingSearchResponse {
  success: boolean;
  results?: Array<{
    title: string;
    url: string;
    content: string;
  }>;
  error?: string;
}

// LangSearch 相关接口定义
export interface LangSearchOptions {
  query: string;
  freshness?: 'oneDay' | 'oneWeek' | 'oneMonth' | 'oneYear' | 'noLimit';
  summary?: boolean;
  count?: number;
}

export interface LangSearchQueryContext {
  originalQuery: string;
}

export interface LangSearchWebPage {
  id: string;
  name: string;
  url: string;
  displayUrl: string;
  snippet: string;
  summary?: string;
  datePublished?: string;
  dateLastCrawled?: string;
}

export interface LangSearchWebPages {
  webSearchUrl: string;
  totalEstimatedMatches: number | null;
  value: LangSearchWebPage[];
  someResultsRemoved?: boolean;
}

export interface LangSearchResponseData {
  _type: 'SearchResponse';
  queryContext: LangSearchQueryContext;
  webPages: LangSearchWebPages;
}

export interface LangSearchApiResponse {
  code: number;
  log_id: string;
  msg: string | null;
  data: LangSearchResponseData;
}

export interface LangSearchResponse {
  success: boolean;
  results?: Array<{
    title: string;
    url: string;
    content: string;
    summary?: string;
    datePublished?: string;
  }>;
  error?: string;
}

export interface WeatherForecast {
  date: string;
  dayPeriods: Array<{
    period: '早上' | '中午' | '傍晚' | '夜间';
    weather: string;
    temperature: string;
    windSpeed: string;
    visibility: string;
    humidity: string;
  }>;
}

export interface WeatherDetail {
  current: {
    temperature: string;
    windSpeed: string;
    visibility: string;
    humidity: string;
    weather: string;
  };
  forecasts: WeatherForecast[];
}


export interface WeatherHourly {
  time: string;
  tempC: string;
  lang_zh: Array<{value: string}>;
  windspeedKmph: string;
  visibility: string;
  humidity: string;
}

export interface WeatherDay {
  date: string;
  hourly: WeatherHourly[];
}


export interface FlightTime {
  departure: string;
  arrival: string;
  duration: string;
}

export interface FlightTimeResponse {
  success: boolean;
  data?: FlightTime;
  error?: string;
}

// 定义工具响应类型，添加索引签名以匹配 MCP 工具响应类型
export interface ToolResponse {
  [x: string]: unknown;  // 添加索引签名
  content: Array<
    | { type: "text"; text: string; [x: string]: unknown }
    | { type: "image"; data: string; mimeType: string; [x: string]: unknown }
  >;
}