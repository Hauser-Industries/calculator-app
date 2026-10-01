import type { CostBreakdownPreview, PlanterInput } from '@/types'
import {
  DEFAULT_LABOR_RATES,
  DEFAULT_PAINT_SETTINGS,
  type Category,
  type TerracePlanterLaborRates,
  type TerracePlanterPaintSettings,
} from '@/lib/terrace_planter/planterDefaults'

export const OVERHEAD_CATEGORY = 'Overhead' as const

export type TerracePlanterCostCategory =
  | Exclude<Category, 'Paint'>
  | 'Paint Material'
  | 'Paint Labor'
  | typeof OVERHEAD_CATEGORY

export const TERRACE_PLANTER_COST_CATEGORY_ORDER: TerracePlanterCostCategory[] = [
  'Weld',
  'Grind',
  'Paint Material',
  'Paint Labor',
  'Assembly',
  'Saw',
  'Laser Bend',
  OVERHEAD_CATEGORY,
  'Weight Plate',
  'Liner',
  'Shelf',
]

const WELD_MINUTES_PER_INCH = 1.5
const INTERMITTENT_WELD_SECTION_IN = 4
const LINER_INSET_IN = 3
const LINER_HEIGHT_IN = 16
const SQUARE_INCHES_PER_SQUARE_FOOT = 144
const SQUARE_FEET_PER_POUND_AT_ONE_MIL = 100
const PAINT_THICKNESS_MULTIPLIER = 4
const POUNDS_PER_KILOGRAM = 2.2046

const getBreakdownPrice = (row: CostBreakdownPreview | undefined) =>
  row ? row.overridePrice ?? row.basePrice : 0

const getIntermittentWeldMinutes = (sideLength: number) =>
  (Math.max(0, sideLength) / INTERMITTENT_WELD_SECTION_IN) * WELD_MINUTES_PER_INCH

export const getTerracePlanterWeldMinutes = (input: PlanterInput) => {
  // The planter body has two continuous vertical welds, including the lip.
  const planterMinutes =
    (Math.max(0, input.height) + Math.max(0, input.lip)) * 2 * WELD_MINUTES_PER_INCH

  const shelfMinutes = input.shelfEnabled
    ? getIntermittentWeldMinutes(input.length) +
      (input.width >= 24 ? getIntermittentWeldMinutes(input.width) : 0)
    : 0

  // Floor welds use the intermittent pattern on all four sides.
  const floorMinutes = input.floorEnabled
    ? getIntermittentWeldMinutes(input.length) * 2 +
      getIntermittentWeldMinutes(input.width) * 2
    : 0

  // Liner welding covers four 16-inch heights and its two short sides.
  const linerWidth = Math.max(0, input.width - LINER_INSET_IN)
  const linerMinutes = input.linerEnabled
    ? (LINER_HEIGHT_IN * 4 + linerWidth * 2) * WELD_MINUTES_PER_INCH
    : 0

  return planterMinutes + shelfMinutes + floorMinutes + linerMinutes
}

export const getTerracePlanterAssemblyMinutes = (input: PlanterInput) =>
  20 + (input.weightPlateEnabled ? 10 : 0)

export const getTerracePlanterGrindMinutes = (input: PlanterInput) =>
  getTerracePlanterWeldMinutes(input) * 0.5

export const getTerracePlanterPaintWeightKg = (input: PlanterInput) => {
  const length = Math.max(0, input.length)
  const width = Math.max(0, input.width)
  const height = Math.max(0, input.height)
  // Open-top planter: one floor plus two long and two short sides.
  const totalSquareInches = length * width + 2 * length * height + 2 * width * height
  const totalSquareFeet = totalSquareInches / SQUARE_INCHES_PER_SQUARE_FOOT
  const poundsAtOneMil = totalSquareFeet / SQUARE_FEET_PER_POUND_AT_ONE_MIL
  const poundsAtFourMil = poundsAtOneMil * PAINT_THICKNESS_MULTIPLIER
  return poundsAtFourMil / POUNDS_PER_KILOGRAM
}

export const normalizeTerracePlanterLaborRates = (
  source?: Partial<TerracePlanterLaborRates> | null,
): TerracePlanterLaborRates => ({
  weldHourlyRate:
    Number.isFinite(source?.weldHourlyRate) && (source?.weldHourlyRate as number) >= 0
      ? (source?.weldHourlyRate as number)
      : DEFAULT_LABOR_RATES.weldHourlyRate,
  assemblyHourlyRate:
    Number.isFinite(source?.assemblyHourlyRate) && (source?.assemblyHourlyRate as number) >= 0
      ? (source?.assemblyHourlyRate as number)
      : DEFAULT_LABOR_RATES.assemblyHourlyRate,
  grindHourlyRate:
    Number.isFinite(source?.grindHourlyRate) && (source?.grindHourlyRate as number) >= 0
      ? (source?.grindHourlyRate as number)
      : DEFAULT_LABOR_RATES.grindHourlyRate,
  paintHourlyRate:
    Number.isFinite(source?.paintHourlyRate) && (source?.paintHourlyRate as number) >= 0
      ? (source?.paintHourlyRate as number)
      : DEFAULT_LABOR_RATES.paintHourlyRate,
})

export const normalizeTerracePlanterPaintSettings = (
  source?: Partial<TerracePlanterPaintSettings> | null,
): TerracePlanterPaintSettings => ({
  materialRatePerKg:
    Number.isFinite(source?.materialRatePerKg) && (source?.materialRatePerKg as number) >= 0
      ? (source?.materialRatePerKg as number)
      : DEFAULT_PAINT_SETTINGS.materialRatePerKg,
  lowDimensionThreshold:
    Number.isFinite(source?.lowDimensionThreshold) && (source?.lowDimensionThreshold as number) >= 0
      ? (source?.lowDimensionThreshold as number)
      : DEFAULT_PAINT_SETTINGS.lowDimensionThreshold,
  mediumDimensionThreshold:
    Number.isFinite(source?.mediumDimensionThreshold) &&
    (source?.mediumDimensionThreshold as number) >= 0
      ? (source?.mediumDimensionThreshold as number)
      : DEFAULT_PAINT_SETTINGS.mediumDimensionThreshold,
  lowMinutes:
    Number.isFinite(source?.lowMinutes) && (source?.lowMinutes as number) >= 0
      ? (source?.lowMinutes as number)
      : DEFAULT_PAINT_SETTINGS.lowMinutes,
  mediumMinutes:
    Number.isFinite(source?.mediumMinutes) && (source?.mediumMinutes as number) >= 0
      ? (source?.mediumMinutes as number)
      : DEFAULT_PAINT_SETTINGS.mediumMinutes,
  highMinutes:
    Number.isFinite(source?.highMinutes) && (source?.highMinutes as number) >= 0
      ? (source?.highMinutes as number)
      : DEFAULT_PAINT_SETTINGS.highMinutes,
})

export const getTerracePlanterPaintLaborMinutes = (
  input: PlanterInput,
  settings: Partial<TerracePlanterPaintSettings> = DEFAULT_PAINT_SETTINGS,
) => {
  const normalizedSettings = normalizeTerracePlanterPaintSettings(settings)
  const largestDimension = Math.max(input.length, input.width, input.height)
  if (largestDimension < normalizedSettings.lowDimensionThreshold) {
    return normalizedSettings.lowMinutes
  }
  if (largestDimension < normalizedSettings.mediumDimensionThreshold) {
    return normalizedSettings.mediumMinutes
  }
  return normalizedSettings.highMinutes
}

export const applyTerracePlanterDerivedPrices = (
  breakdowns: CostBreakdownPreview[],
): CostBreakdownPreview[] => {
  const next = breakdowns.map((row) => ({ ...row }))
  const lookup = next.reduce<Record<string, CostBreakdownPreview>>((acc, row) => {
    acc[row.category] = row
    return acc
  }, {})

  const directLaborTotal =
    getBreakdownPrice(lookup.Weld) +
    getBreakdownPrice(lookup['Paint Labor']) +
    getBreakdownPrice(lookup.Assembly) +
    getBreakdownPrice(lookup.Saw) +
    getBreakdownPrice(lookup['Laser Bend'])

  const overhead = lookup[OVERHEAD_CATEGORY]
  if (overhead) {
    overhead.basePrice = (directLaborTotal + getBreakdownPrice(lookup.Grind)) * 1.5
  }

  return next
}

export const buildTerracePlanterCostBreakdowns = (
  input: PlanterInput,
  laborRates: Partial<TerracePlanterLaborRates> = DEFAULT_LABOR_RATES,
  paintSettings: Partial<TerracePlanterPaintSettings> = DEFAULT_PAINT_SETTINGS,
): CostBreakdownPreview[] => {
  const normalizedLaborRates = normalizeTerracePlanterLaborRates(laborRates)
  const normalizedPaintSettings = normalizeTerracePlanterPaintSettings(paintSettings)
  const rows: CostBreakdownPreview[] = TERRACE_PLANTER_COST_CATEGORY_ORDER.map((category) => {
    if (category === 'Paint Material') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice:
          getTerracePlanterPaintWeightKg(input) * normalizedPaintSettings.materialRatePerKg,
        overridePrice: null,
      }
    }
    if (category === 'Paint Labor') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice:
          (getTerracePlanterPaintLaborMinutes(input, normalizedPaintSettings) / 60) *
          normalizedLaborRates.paintHourlyRate,
        overridePrice: null,
      }
    }
    if (category === 'Weight Plate') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice: input.weightPlateEnabled ? 95 : 0,
        overridePrice: null,
      }
    }
    if (category === 'Liner') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice: input.linerEnabled ? 130 : 0,
        overridePrice: null,
      }
    }
    if (category === 'Shelf') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice: input.shelfEnabled ? 200 : 0,
        overridePrice: null,
      }
    }
    if (category === 'Weld') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice: (getTerracePlanterWeldMinutes(input) / 60) * normalizedLaborRates.weldHourlyRate,
        overridePrice: null,
      }
    }
    if (category === 'Assembly') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice:
          (getTerracePlanterAssemblyMinutes(input) / 60) * normalizedLaborRates.assemblyHourlyRate,
        overridePrice: null,
      }
    }
    if (category === 'Grind') {
      return {
        category,
        tierUsed: 'Not Selected',
        basePrice:
          (getTerracePlanterGrindMinutes(input) / 60) * normalizedLaborRates.grindHourlyRate,
        overridePrice: null,
      }
    }

    const basePrice = category === 'Saw' ? 25 : category === 'Laser Bend' ? 150 : 0
    return { category, tierUsed: 'Not Selected', basePrice, overridePrice: null }
  })

  return applyTerracePlanterDerivedPrices(rows)
}
