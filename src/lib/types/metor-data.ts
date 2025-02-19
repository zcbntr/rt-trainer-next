/* METORlogical data. */
export type METORData = {
  avgWindDirection: number;
  meanWindSpeed: number;
  stdWindSpeed: number;
  meanPressure: number;
  stdPressure: number;
  meanTemperature: number;
  stdTemperature: number;
  meanDewpoint: number;
  stdDewpoint: number;
};

/* METOR data sample. Obtained from taking a random sample of the METOR data model. */
export type METORDataSample = {
  windDirection: number;
  windSpeed: number;
  pressure: number;
  temperature: number;
  dewpoint: number;
};
