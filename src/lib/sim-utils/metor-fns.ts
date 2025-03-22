import { type METORData, type METORDataSample } from "../types/metor-data";
import { seededNormalDistribution } from "../utils";

export default function getMETORSample(
  seed: number,
  metorData: METORData,
): METORDataSample {
  // let season: Season = Season.Spring;
  let meanTemperature = 0.0;

  switch (seed % 4) {
    case 0:
      // season = Season.Spring;
      meanTemperature = metorData.meanTemperature * 1.3;
      break;
    case 1:
      // season = Season.Summer;
      meanTemperature = metorData.meanTemperature * 1.7;
      break;
    case 2:
      // season = Season.Autumn;
      meanTemperature = metorData.meanTemperature * 1.1;
      break;
    case 3:
      // season = Season.Winter;
      meanTemperature = metorData.meanTemperature * 0.4;
      break;
  }

  // Simulate temperature, wind direction, wind speed and pressure with a normal distribution
  const windDirection =
    seededNormalDistribution(
      seed.toString(),
      metorData.avgWindDirection,
      10.0,
    ) % 360.0;

  const temperature = seededNormalDistribution(
    seed.toString(),
    meanTemperature,
    metorData.stdTemperature,
  );

  const windSpeed = seededNormalDistribution(
    seed.toString(),
    metorData.meanWindSpeed,
    metorData.stdWindSpeed,
  );

  const pressure = seededNormalDistribution(
    seed.toString(),
    metorData.meanPressure,
    metorData.stdTemperature,
  );

  const sample: METORDataSample = {
    windDirection: windDirection,
    windSpeed: windSpeed,
    pressure: pressure,
    temperature: temperature,
    dewpoint: temperature * 0.95 - 1.2,
  };

  return sample;
}
