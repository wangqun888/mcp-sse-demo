import axios from 'axios';
import { WeatherDetail, WeatherDay, WeatherHourly } from '../types/index.js';

/**
 * 获取天气详细信息
 */
export async function getWeatherDetail(city: string): Promise<WeatherDetail> {
  try {
    const encodedCity = encodeURIComponent(city);
    const response = await axios.get(
      `https://wttr.in/${encodedCity}?format=j1&lang=zh`,
      { timeout: 10000 }
    );

    const weatherData = response.data;
    
    // 处理当前天气
    const current = weatherData.current_condition[0];
    const currentWeather = {
      temperature: `${current.temp_C}(${current.FeelsLikeC})°C`,
      windSpeed: `${current.windspeedKmph} km/h`,
      visibility: `${current.visibility} km`,
      humidity: `${current.humidity}%`,
      weather: current.lang_zh[0].value
    };

    // 处理天气预报
    const forecasts = weatherData.weather.map((day: WeatherDay) => {
      const dayPeriods = [];
      const date = day.date;
      
      // 早上 (6:00)
      const morning = day.hourly.find((h: WeatherHourly) => h.time === "600");
      if (morning) {
        dayPeriods.push({
          period: '早上',
          weather: morning.lang_zh[0].value,
          temperature: `${morning.tempC}°C`,
          windSpeed: `${morning.windspeedKmph} km/h`,
          visibility: `${morning.visibility} km`,
          humidity: `${morning.humidity}%`
        });
      }

      // 中午 (12:00)
      const noon = day.hourly.find((h: WeatherHourly) => h.time === "1200");
      if (noon) {
        dayPeriods.push({
          period: '中午',
          weather: noon.lang_zh[0].value,
          temperature: `${noon.tempC}°C`,
          windSpeed: `${noon.windspeedKmph} km/h`,
          visibility: `${noon.visibility} km`,
          humidity: `${noon.humidity}%`
        });
      }

      // 傍晚 (18:00)
      const evening = day.hourly.find((h: WeatherHourly) => h.time === "1800");
      if (evening) {
        dayPeriods.push({
          period: '傍晚',
          weather: evening.lang_zh[0].value,
          temperature: `${evening.tempC}°C`,
          windSpeed: `${evening.windspeedKmph} km/h`,
          visibility: `${evening.visibility} km`,
          humidity: `${evening.humidity}%`
        });
      }

      // 夜间 (21:00)
      const night = day.hourly.find((h: WeatherHourly) => h.time === "2100");
      if (night) {
        dayPeriods.push({
          period: '夜间',
          weather: night.lang_zh[0].value,
          temperature: `${night.tempC}°C`,
          windSpeed: `${night.windspeedKmph} km/h`,
          visibility: `${night.visibility} km`,
          humidity: `${night.humidity}%`
        });
      }

      return {
        date,
        dayPeriods
      };
    });

    return {
      current: currentWeather,
      forecasts
    };
  } catch (error: any) {
    throw new Error(`获取天气数据失败: ${error.message}`);
  }
}

/**
 * 获取并格式化天气信息
 */
export async function getWeatherWithFormat(city: string): Promise<{
  content: Array<{ type: "text"; text: string; }>
}> {
  try {
    const weatherDetail = await getWeatherDetail(city);
    
    // 格式化当前天气
    const currentWeather = weatherDetail.current;
    const currentText = `当前天气情况：
        温度：${currentWeather.temperature}
        天气：${currentWeather.weather}
        湿度：${currentWeather.humidity}
        风速：${currentWeather.windSpeed}
        能见度：${currentWeather.visibility}`;

    // 格式化天气预报
    const forecastText = weatherDetail.forecasts.map(day => {
      const periodsText = day.dayPeriods.map(period => 
        `${period.period}:
        天气：${period.weather}
        温度：${period.temperature}
        风速：${period.windSpeed}
        湿度：${period.humidity}
        能见度：${period.visibility}`
      ).join('\n\n');

      return `\n${day.date} 天气预报：\n${periodsText}`;
    }).join('\n');

    return {
      content: [
        {
          type: "text",
          text: currentText + '\n\n' + forecastText
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `获取天气信息失败: ${error.message}`
        }
      ]
    };
  }
}