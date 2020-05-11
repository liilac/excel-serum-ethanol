import {
  Measure,
  Time,
  Mass,
  VolumeDensity,
  AreaDensity,
  Volume,
  grams,
  kilograms,
  hours,
  deca,
  centi,
  meters,
  milli,
  deci,
  liters,
  SpecificVolume
} from "safe-units";

const EliminationRate = VolumeDensity.over(Time);
type EliminationRate = typeof EliminationRate;

const VolumeOfDistribution = SpecificVolume;
type VolumeOfDistribution = typeof VolumeOfDistribution;

const SerumConcentration = VolumeDensity;
type SerumConcentration = typeof VolumeDensity;


const milligrams: Mass = milli(grams);
const deciliters: Volume = deci(liters);

const mgDL: SerumConcentration = milligrams.over(deciliters);

// density of ethanol in kg/m3
const ethanolDensity = Measure.of(789, VolumeDensity);
// volume of distribution of ethanol
const ethanolVD = Measure.of(0.6, VolumeOfDistribution);
const ethanolMeanMaleVD = Measure.of(0.58, VolumeOfDistribution);
const ethanolMeanFemaleVD = Measure.of(0.49, VolumeOfDistribution);
// mean elimination rates of ethanol
const ethanolER = Measure.of(0.016, EliminationRate);
const ethanolERMale = Measure.of(0.015, EliminationRate);
const ethanolERFemale = Measure.of(0.017, EliminationRate);

/*
Clinical effects of blood alcohol concentration
Blood alcohol concentration	Clinical effects
20-50 mg/dL (4.4-11 mmol/L)	Diminished fine motor coordination
50-100 mg/dL (11-22 mmol/L	Impaired judgment; impaired coordination
100-150 mg/dL (22-33 mmol/L)	Difficulty with gait and balance
150-250 mg/dL (33-55 mmol/L)	Lethargy; difficulty sitting upright without assistance
300 mg/dL (66 mmol/L)	Coma in the non-habituated drinker
400 mg/dL (88 mmol/L)	Respiratory depression
Adapted from: Marx JA. Rosen's emergency medicine: concepts and clinical practice, 5th ed, Mosby, Inc., St. Louis 2002. p. 2513. Copyright © 2002 Elsevier.
*/

class clinicalRange {
  lowerConcentration: SerumConcentration;
  upperConcentration?: SerumConcentration;
  description: string;
  constructor(desc: string, lower: SerumConcentration, upper?: SerumConcentration) {
    this.lowerConcentration = lower;
    this.upperConcentration = upper;
    this.description = desc;
  }
  withinRange(vd: SerumConcentration) {
    if (this.lowerConcentration.lte(vd) && this.upperConcentration.gte(vd)) {
      return true;
    }
    return false;
  }
  describe() {
    return this.description;
  }
}

type clinicalRanges = Array<clinicalRange>;

const ethanolClinicalEffects: clinicalRanges = [
  new clinicalRange("Diminished fine motor coordination", Measure.of(20,mgDL), Measure.of(50,mgDL)),
  new clinicalRange("Impaired judgement; imparied coordination", Measure.of(50,mgDL), Measure.of(100,mgDL)),
  new clinicalRange("Difficulty with gait and balance", Measure.of(100,mgDL), Measure.of(150,mgDL)),
  new clinicalRange("Lethargy; difficulty sitting upright", Measure.of(150,mgDL), Measure.of(250,mgDL)),
  new clinicalRange("Coma in the non-habituated drinker", Measure.of(300,mgDL)),
  new clinicalRange("Respiratory depression", Measure.of(400,mgDL))
]

/**
 * Calculates ethanol mass from volume and concentration
 * @customfunction
 * @param volumeIngested volume of ethanol-containing liquid ingested
 * @param concentrationIngested concentration of ethanol in the liquid
 */
export function ethanolIngested(volumeIngested: Volume, concentrationIngested: number): Mass {
  // create safe-units representation of dimensionless concentration
  let ethanolConcentration = Measure.dimensionless(concentrationIngested);
  // calculate volume of actual ethanol
  const ethanolVolume: Volume = volumeIngested.times(ethanolConcentration);

  // calculate and return mass of ingested ethanol
  return ethanolDensity.times(ethanolVolume)
}

/**
 * Estimates peak serum ethanol concentration

 * https://www.uptodate.com/contents/calculator-blood-ethanol-concentration-estimation
 * @customfunction
 * @param ethanol mass of ethanol ingested
 * @param weight weight of the person
 * @param vd volume of distribution; sex and person specific
 */
export function peakSerumEthanol(ethanol: Mass, weight: Mass, vd: VolumeOfDistribution = ethanolVD): SerumConcentration {
  const vol: Volume = weight.times(vd);
  return ethanol.div(vol);
}
 
// C_t = [(No_drinks * density_alcohol * vol_ethanol_per_drink) / (body_weight * V_D)] - (elim_rate * time)
/**
 * Calculates Blood Alcohol Content (BAC) using the Widmark formula
 * @customfunction
 * @param ethanol mass of ethanol ingested
 * @param weight weight of the person
 * @param vd volume of distribution; sex and person specific
 * @param duration time since the person began drinking
 * @param r rate of elimination of alcohol; sex and person specific
 */
export function ebac(ethanol: Mass, weight: Mass, vd: VolumeOfDistribution = ethanolVD, duration: Time, r: EliminationRate = ethanolER): SerumConcentration {
  const peakSerum: SerumConcentration = peakSerumEthanol(ethanol, weight, vd);
  const eliminated: SerumConcentration = r.times(duration);
  return peakSerum.minus(eliminated);
}