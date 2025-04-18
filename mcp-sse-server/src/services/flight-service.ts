import { FlightTime, FlightTimeResponse } from '../types/index.js';

/**
 * 获取航班起降时间信息
 */
export async function getFlightTimes(departure: string, arrival: string): Promise<FlightTimeResponse> {
  try {
    const flights: { [key: string]: FlightTime } = {
      "LGA-LAX": { departure: "08:00 AM", arrival: "11:30 AM", duration: "5h 30m" },
      "LAX-LGA": { departure: "02:00 PM", arrival: "10:30 PM", duration: "5h 30m" },
      "LHR-JFK": { departure: "10:00 AM", arrival: "01:00 PM", duration: "8h 00m" },
      "JFK-LHR": { departure: "09:00 PM", arrival: "09:00 AM", duration: "7h 00m" },
      "CDG-DXB": { departure: "11:00 AM", arrival: "08:00 PM", duration: "6h 00m" },
      "DXB-CDG": { departure: "03:00 AM", arrival: "07:30 AM", duration: "7h 30m" }
    };

    const key = `${departure}-${arrival}`.toUpperCase();
    const flightData = flights[key];

    if (!flightData) {
      return {
        success: false,
        error: "未找到该航线信息"
      };
    }

    return {
      success: true,
      data: flightData
    };
  } catch (error: any) {
    return {
      success: false,
      error: `获取航班信息失败: ${error.message}`
    };
  }
}

/**
 * 获取并格式化航班信息
 */
export async function getFlightTimesWithFormat(departure: string, arrival: string): Promise<{
  content: Array<{ type: "text"; text: string; }>
}> {
  const response = await getFlightTimes(departure, arrival);
  
  if (!response.success) {
    return {
      content: [
        {
          type: "text",
          text: response.error || "查询失败"
        }
      ]
    };
  }

  const flightInfo = response.data!;
  const text = `航班信息：
    出发时间：${flightInfo.departure}
    到达时间：${flightInfo.arrival}
    飞行时长：${flightInfo.duration}`;

  return {
    content: [
      {
        type: "text",
        text: text
      }
    ]
  };
}