import { FlightTime, FlightTimeResponse } from '../types/index.js';

/**
 * 获取航班起降时间信息
 * @param departure 出发机场代码
 * @param arrival 到达机场代码
 * @returns 航班时间信息
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