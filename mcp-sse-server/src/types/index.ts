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