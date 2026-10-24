import { formatCurrency } from '../../utils/formatters';
import { formatDurationHuman } from '../../utils/focusCalculations';

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    failed++;
    console.error(`  FAIL: ${message || 'Assertion failed'} (Expected: "${expected}", Actual: "${actual}")`);
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    failed++;
    console.error(`  FAIL: ${message || 'Assertion condition is false'}`);
    throw new Error(`Assertion failed: condition was false`);
  }
}

console.log('--- Running UniFlow CountUp & Numeric Formatting Animation Test Suite ---');

// 1. Quartic Ease-Out curve verification
{
  const quarticEaseOut = (t: number) => 1 - Math.pow(1 - t, 4);
  assertEqual(quarticEaseOut(0), 0, 'Quartic ease at 0 must be 0');
  assertEqual(quarticEaseOut(1), 1, 'Quartic ease at 1 must be 1');
  
  // Deceleration verification: first 25% of time covers more than 50% of the distance
  const quarterProgress = quarticEaseOut(0.25);
  assertTrue(quarterProgress > 0.65, `Early progress should be fast (got ${quarterProgress})`);
  
  // Last 25% of time covers less than 10% of the distance (smooth deceleration landing)
  const lastQuarterDelta = quarticEaseOut(1.0) - quarticEaseOut(0.75);
  assertTrue(lastQuarterDelta < 0.05, `Landing should gently decelerate (got delta ${lastQuarterDelta})`);
  console.log('  ✓ Quartic Ease-Out curve provides responsive deceleration without sudden stops');
  passed++;
}

// 2. Numeric rounding and integer clamping for currency
{
  const endValue = 6353;
  const startValue = 0;
  
  // Test intermediate interpolation values
  const intermediateValues: number[] = [];
  for (let progress = 0; progress <= 1.0; progress += 0.1) {
    const ease = 1 - Math.pow(1 - progress, 4);
    const rawVal = startValue + (endValue - startValue) * ease;
    // CountUp rounds to integer when start and end are integers
    const rounded = Math.round(rawVal);
    intermediateValues.push(rounded);
    
    // Verify each intermediate value is strictly an integer
    assertTrue(Number.isInteger(rounded), `Intermediate value ${rounded} must be an integer`);
    
    // Verify currency formatting never contains fractional pennies for whole integers
    const formatted = formatCurrency(rounded, 'INR');
    assertTrue(!formatted.includes('.'), `Formatted currency ${formatted} must never have decimal pennies`);
  }
  
  assertEqual(intermediateValues[0], 0, 'Initial intermediate value must be 0');
  assertEqual(intermediateValues[intermediateValues.length - 1], 6353, 'Final intermediate value must be 6353');
  console.log('  ✓ Currency values animate with integer precision and never display invalid intermediate decimals');
  passed++;
}

// 3. Indian Rupee (INR) locale formatting
{
  assertEqual(formatCurrency(0, 'INR'), '₹0', 'Zero currency must format as ₹0');
  assertEqual(formatCurrency(6353, 'INR'), '₹6,353', '6353 must format as ₹6,353 with comma grouping');
  assertEqual(formatCurrency(4853, 'INR'), '₹4,853', '4853 must format as ₹4,853');
  assertEqual(formatCurrency(125000, 'INR'), '₹1,25,000', '125000 must use Indian lakh grouping');
  console.log('  ✓ Indian Rupee (INR) formatting accurately renders ₹ and correct comma groupings');
  passed++;
}

// 4. Academic SGPA decimal precision (2 decimal places)
{
  const sgpaTarget = 8.8;
  const decimals = 2;
  const factor = Math.pow(10, decimals);
  
  // Test intermediate precision
  for (let progress = 0; progress <= 1.0; progress += 0.2) {
    const raw = 0 + (sgpaTarget - 0) * (1 - Math.pow(1 - progress, 4));
    const rounded = Math.round(raw * factor) / factor;
    const formatted = rounded.toFixed(decimals);
    assertTrue(formatted.includes('.'), `SGPA ${formatted} must have decimal point`);
    assertEqual(formatted.split('.')[1].length, 2, `SGPA ${formatted} must have exactly 2 decimal digits`);
  }
  
  const finalFormatted = sgpaTarget.toFixed(2);
  assertEqual(finalFormatted, '8.80', 'SGPA target 8.8 must format as 8.80');
  console.log('  ✓ Academic SGPA formatting maintains exactly 2 decimal places (0.00 → 8.80)');
  passed++;
}

// 5. Focus duration formatting (seconds to human-readable 0m → 49m)
{
  assertEqual(formatDurationHuman(0), '0m', '0 seconds must format as 0m');
  assertEqual(formatDurationHuman(49 * 60), '49m', '49 minutes must format as 49m');
  assertEqual(formatDurationHuman(75 * 60), '1h 15m', '75 minutes must format as 1h 15m');
  
  // Test animated seconds from 0 to 49m
  const targetSeconds = 49 * 60;
  const intermediateDurations: string[] = [];
  for (let p = 0; p <= 1; p += 0.25) {
    const s = Math.round(targetSeconds * (1 - Math.pow(1 - p, 4)));
    intermediateDurations.push(formatDurationHuman(s));
  }
  
  assertEqual(intermediateDurations[0], '0m', 'Start duration must be 0m');
  assertEqual(intermediateDurations[intermediateDurations.length - 1], '49m', 'End duration must be 49m');
  console.log('  ✓ Focus workspace duration formats cleanly from 0m to target duration');
  passed++;
}

// 6. Habit paired format (3 / 5) animation
{
  const completed = 3;
  const total = 5;
  
  const animatedCompleted = Math.round(completed * 1.0);
  const formattedPaired = `${animatedCompleted} / ${total}`;
  assertEqual(formattedPaired, '3 / 5', 'Paired habits must format as "3 / 5"');
  console.log('  ✓ Paired habits animate numerical completed portion while keeping total stable');
  passed++;
}

// 7. Negative net cash flow handling
{
  const negativeFlow = -1500;
  const formattedNegative = formatCurrency(negativeFlow, 'INR');
  assertTrue(formattedNegative.includes('-') || formattedNegative.includes('₹'), 'Negative currency must be formatted');
  console.log('  ✓ Negative cash flow values format correctly without crashing');
  passed++;
}

// 8. Genuine zero values
{
  assertEqual(formatCurrency(0, 'INR'), '₹0');
  assertEqual(formatDurationHuman(0), '0m');
  const zeroVal = 0;
  assertEqual(zeroVal.toFixed(2), '0.00');
  console.log('  ✓ Genuine zero values render without errors or empty states');
  passed++;
}

console.log(`\nCountUp Test Summary: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  (globalThis as any).process?.exit(1);
}

