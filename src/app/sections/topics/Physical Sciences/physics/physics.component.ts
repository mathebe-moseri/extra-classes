import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../../../auth.service';
import { QuizProgressService } from '../../../../quiz-progress.service';


type QuestionType = 'info' | 'mcq' | 'tf' | 'term' | 'short';

interface QuizQuestion {
  type: QuestionType;
  /** Question text, or heading of a learn card (HTML allowed) */
  text: string;
  /** Paper-style number, e.g. 1.1.3 */
  no: string;
  /** Question heading, e.g. "Question 1: Motion in one dimension" */
  section: string;
  /** Sub-heading, e.g. "1.1 Multiple-choice questions" */
  sub: string;
  /** Instruction shown under the sub-heading */
  instruction: string;
  marks: number;
  timed: boolean;
  /** info: the text of the learn card */
  body?: string;
  /** mcq / tf */
  options?: string[];
  correctIndex?: number;
  /** term: accepted answers (first one is shown as the model answer) */
  accepted?: string[];
  modelText?: string;
  /** short: memo points the learner ticks off */
  model?: string[];
  image?: string;
  explanation?: string;
}

type Draft = Omit<QuizQuestion, 'no' | 'section' | 'sub' | 'instruction'>;

interface SubSection { sub: string; heading: string; instruction: string; items: Draft[]; }
interface LearnCard { title: string; body: string; image?: string; }
interface Section { title: string; learn: LearnCard[]; subs: SubSection[]; }

/* ================= SVG DIAGRAMS ================= */
const svg = (w: number, h: number, inner: string): string =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="Arial, sans-serif" font-size="12">${inner}</svg>`);

/** Velocity-time graph: 0 to 8 m/s in 4 s, constant 8 m/s until 10 s, then back to 0 at 14 s */
const IMG_VT_GRAPH = (() => {
  const gridY = [0, 2, 4, 6, 8, 10].map(v =>
    `<line x1="50" y1="${150 - 12 * v}" x2="330" y2="${150 - 12 * v}" stroke="#e2e8f0"/>` +
    `<text x="44" y="${154 - 12 * v}" text-anchor="end" font-size="11">${v}</text>`).join('');
  const ticksX = [0, 2, 4, 6, 8, 10, 12, 14].map(t =>
    `<text x="${50 + 20 * t}" y="166" text-anchor="middle" font-size="11">${t}</text>`).join('');
  return svg(350, 200,
    gridY + ticksX +
    '<polyline points="50,150 130,54 250,54 330,150" fill="none" stroke="#0284c7" stroke-width="3"/>' +
    '<line x1="50" y1="20" x2="50" y2="150" stroke="#111"/><line x1="50" y1="150" x2="335" y2="150" stroke="#111"/>' +
    '<text x="190" y="190" text-anchor="middle" font-weight="bold">Time (s)</text>' +
    '<text x="12" y="90" text-anchor="middle" font-weight="bold" transform="rotate(-90 12 90)">Velocity (m·s⁻¹)</text>');
})();

/** Position-time graph: 0 to 8 m in 4 s, at rest 4-6 s, back to 0 m at 10 s */
const IMG_XT_GRAPH = (() => {
  const gridY = [0, 2, 4, 6, 8, 10].map(v =>
    `<line x1="50" y1="${150 - 12 * v}" x2="290" y2="${150 - 12 * v}" stroke="#e2e8f0"/>` +
    `<text x="44" y="${154 - 12 * v}" text-anchor="end" font-size="11">${v}</text>`).join('');
  const ticksX = [0, 2, 4, 6, 8, 10].map(t =>
    `<text x="${50 + 24 * t}" y="166" text-anchor="middle" font-size="11">${t}</text>`).join('');
  return svg(320, 200,
    gridY + ticksX +
    '<polyline points="50,150 146,54 194,54 290,150" fill="none" stroke="#dc2626" stroke-width="3"/>' +
    '<line x1="50" y1="20" x2="50" y2="150" stroke="#111"/><line x1="50" y1="150" x2="295" y2="150" stroke="#111"/>' +
    '<text x="170" y="190" text-anchor="middle" font-weight="bold">Time (s)</text>' +
    '<text x="12" y="90" text-anchor="middle" font-weight="bold" transform="rotate(-90 12 90)">Position (m)</text>');
})();

/** Smooth ramp: A is 10 m high, B is 5 m high, C is on the ground */
const IMG_RAMP = svg(340, 190,
  '<rect x="0" y="150" width="340" height="30" fill="#c9a27a"/>' +
  '<polygon points="40,50 240,150 40,150" fill="#c9a27a" stroke="#7c4a1e"/>' +
  '<line x1="22" y1="50" x2="22" y2="150" stroke="#111"/><polygon points="22,50 18,58 26,58" fill="#111"/><polygon points="22,150 18,142 26,142" fill="#111"/>' +
  '<text x="18" y="104" text-anchor="end" font-weight="bold">10 m</text>' +
  '<line x1="22" y1="100" x2="140" y2="100" stroke="#64748b" stroke-dasharray="4 3"/>' +
  '<circle cx="44" cy="43" r="7" fill="#dc2626"/><text x="58" y="40" font-weight="bold" font-size="16">A</text>' +
  '<circle cx="140" cy="93" r="7" fill="#dc2626"/><text x="154" y="90" font-weight="bold" font-size="16">B</text>' +
  '<circle cx="240" cy="143" r="7" fill="#dc2626"/><text x="254" y="140" font-weight="bold" font-size="16">C</text>' +
  '<text x="290" y="172" text-anchor="middle">Ground (h = 0)</text>' +
  '<text x="170" y="186" text-anchor="middle" font-size="11">Smooth track, no friction, ball of mass 2 kg released from rest at A</text>');

/** Transverse wave: P is crest to crest, Q is from the rest line up to a crest */
const IMG_WAVE = svg(290, 170,
  '<line x1="10" y1="90" x2="280" y2="90" stroke="#94a3b8" stroke-dasharray="4 3"/>' +
  '<path d="M20,90 Q50,10 80,90 T140,90 T200,90 T260,90" fill="none" stroke="#0284c7" stroke-width="3"/>' +
  '<line x1="50" y1="30" x2="170" y2="30" stroke="#111"/><polygon points="50,30 58,26 58,34" fill="#111"/><polygon points="170,30 162,26 162,34" fill="#111"/>' +
  '<line x1="50" y1="30" x2="50" y2="50" stroke="#64748b" stroke-dasharray="3 3"/><line x1="170" y1="30" x2="170" y2="50" stroke="#64748b" stroke-dasharray="3 3"/>' +
  '<text x="110" y="22" text-anchor="middle" font-weight="bold" font-size="16">P</text>' +
  '<line x1="215" y1="50" x2="215" y2="90" stroke="#111"/><polygon points="215,50 211,58 219,58" fill="#111"/><polygon points="215,90 211,82 219,82" fill="#111"/>' +
  '<line x1="170" y1="50" x2="215" y2="50" stroke="#64748b" stroke-dasharray="3 3"/>' +
  '<text x="228" y="74" font-weight="bold" font-size="16">Q</text>' +
  '<text x="145" y="155" text-anchor="middle">A transverse wave</text>');

/** Electromagnetic spectrum bar with custom labels (names or letters) */
const emBar = (labels: string[], fontSize: number): string => {
  const colours = ['#fde68a', '#fdba74', '#fca5a5', '#86efac', '#a5b4fc', '#c4b5fd', '#f0abfc'];
  const boxes = labels.map((l, i) =>
    `<rect x="${6 + i * 70}" y="14" width="66" height="44" rx="6" fill="${colours[i]}" stroke="#64748b"/>` +
    `<text x="${39 + i * 70}" y="41" text-anchor="middle" font-size="${fontSize}" font-weight="bold">${l}</text>`).join('');
  return svg(500, 112, boxes +
    '<line x1="10" y1="84" x2="480" y2="84" stroke="#111" stroke-width="2"/><polygon points="492,84 478,77 478,91" fill="#111"/>' +
    '<text x="250" y="104" text-anchor="middle">Frequency and photon energy increase</text>');
};
const IMG_EM_SPECTRUM = emBar(['Radio', 'Microwaves', 'Infrared', 'Visible', 'Ultraviolet', 'X-rays', 'Gamma'], 10);
const IMG_EM_LETTERS = emBar(['A', 'B', 'C', 'D', 'E', 'F', 'G'], 20);

/* ================= QUESTION HELPERS ================= */
const mcq = (text: string, options: string[], correctIndex: number, explanation: string, image?: string): Draft =>
  ({ type: 'mcq', text, options, correctIndex, explanation, image, marks: 1, timed: true });

const tf = (text: string, isTrue: boolean, explanation: string): Draft =>
  ({ type: 'tf', text, options: ['True', 'False'], correctIndex: isTrue ? 0 : 1, explanation, marks: 1, timed: true });

const term = (text: string, accepted: string[], explanation: string, image?: string): Draft =>
  ({ type: 'term', text, accepted, modelText: accepted[0], explanation, image, marks: 1, timed: true });

const short = (text: string, marks: number, model: string[], explanation = '', image?: string): Draft =>
  ({ type: 'short', text, marks, model, explanation, image, timed: false });

/* ================= THE PAPER (Grade 10 CAPS Physical Sciences: Physics) ================= */
const SECTIONS: Section[] = [

  /* ================= QUESTION 1: MOTION IN ONE DIMENSION ================= */
  {
    title: 'Question 1: Motion in one dimension',
    learn: [
      {
        title: 'Position, distance and displacement',
        body:
          '<strong>Reference point:</strong> the starting point (origin) from which we measure position. We also choose a direction as positive (for example right or up = +, left or down = −).\n\n' +
          '<strong>Position (x):</strong> where an object is, measured from the reference point.\n\n' +
          '<strong>Distance:</strong> the total length of the path travelled. It is a <strong>scalar</strong> (size only). Unit: metre (m).\n\n' +
          '<strong>Displacement (Δx):</strong> the change in position of an object. It is a <strong>vector</strong> (size and direction). Δx = x<sub>f</sub> − x<sub>i</sub>\n\n' +
          '<strong>Scalar:</strong> a quantity with magnitude (size) only, e.g. distance, speed, time, mass.\n' +
          '<strong>Vector:</strong> a quantity with magnitude AND direction, e.g. displacement, velocity, acceleration, force.\n\n' +
          '<strong>Worked example:</strong> A learner walks 4 m east and then 3 m west.\n' +
          'Step 1: Choose east as positive. Start x<sub>i</sub> = 0 m.\n' +
          'Step 2: Distance = add the lengths of the path = 4 + 3 = <strong>7 m</strong>.\n' +
          'Step 3: Final position x<sub>f</sub> = +4 − 3 = +1 m.\n' +
          'Step 4: Δx = x<sub>f</sub> − x<sub>i</sub> = 1 − 0 = <strong>1 m east</strong>.'
      },
      {
        title: 'Speed, velocity and acceleration',
        body:
          '<strong>Average speed</strong> = total distance ÷ total time (scalar). Unit: m·s⁻¹.\n\n' +
          '<strong>Average velocity</strong> = displacement ÷ time taken: v = Δx ÷ Δt (vector). Unit: m·s⁻¹.\n\n' +
          '<strong>Instantaneous velocity:</strong> the velocity of an object at one particular moment in time.\n\n' +
          '<strong>Acceleration:</strong> the rate of change of velocity: a = Δv ÷ Δt = (v<sub>f</sub> − v<sub>i</sub>) ÷ Δt. Unit: m·s⁻². When an object slows down, the acceleration points opposite to the motion (it is negative if forward is positive).\n\n' +
          '<strong>Worked example:</strong> A car speeds up from 5 m·s⁻¹ to 20 m·s⁻¹ in 5 s (forward positive).\n' +
          'Step 1: Write down v<sub>i</sub> = 5 m·s⁻¹, v<sub>f</sub> = 20 m·s⁻¹, Δt = 5 s.\n' +
          'Step 2: Write the formula: a = (v<sub>f</sub> − v<sub>i</sub>) ÷ Δt.\n' +
          'Step 3: Substitute: a = (20 − 5) ÷ 5.\n' +
          'Step 4: a = <strong>3 m·s⁻² forward</strong>.'
      },
      {
        title: 'Equations of motion (constant acceleration)',
        body:
          'These four equations only work when the acceleration is <strong>constant</strong>:\n\n' +
          '1.  v<sub>f</sub> = v<sub>i</sub> + aΔt\n' +
          '2.  Δx = v<sub>i</sub>Δt + ½aΔt²\n' +
          '3.  v<sub>f</sub>² = v<sub>i</sub>² + 2aΔx\n' +
          '4.  Δx = ((v<sub>i</sub> + v<sub>f</sub>) ÷ 2) × Δt\n\n' +
          '<strong>How to solve (step by step):</strong>\n' +
          'Step 1: Draw a quick sketch.\n' +
          'Step 2: Choose a positive direction.\n' +
          'Step 3: List v<sub>i</sub>, v<sub>f</sub>, a, Δx and Δt with signs and SI units. "Starts from rest" means v<sub>i</sub> = 0.\n' +
          'Step 4: Pick the equation that has the three things you know and the one you want.\n' +
          'Step 5: Substitute with units, then calculate.\n' +
          'Step 6: Write the answer with unit and direction.\n\n' +
          '<strong>Worked example:</strong> A car starts from rest and accelerates at 2 m·s⁻² for 5 s. Find its final velocity and displacement.\n' +
          'Known: v<sub>i</sub> = 0, a = 2 m·s⁻² (forward +), Δt = 5 s.\n' +
          'v<sub>f</sub> = v<sub>i</sub> + aΔt = 0 + (2)(5) = <strong>10 m·s⁻¹ forward</strong>.\n' +
          'Δx = v<sub>i</sub>Δt + ½aΔt² = 0 + ½(2)(5)² = <strong>25 m forward</strong>.'
      },
      {
        title: 'Motion graphs',
        body:
          '<strong>Position-time (x-t) graph</strong>\n' +
          '• Horizontal line: object is at rest.\n' +
          '• Straight sloping line: constant velocity.\n' +
          '• Curve: velocity is changing (acceleration).\n' +
          '• <strong>Gradient = velocity</strong>.\n\n' +
          '<strong>Velocity-time (v-t) graph</strong>\n' +
          '• Horizontal line: constant velocity (a = 0).\n' +
          '• Straight line sloping up: constant positive acceleration.\n' +
          '• Straight line sloping down: constant negative acceleration (slowing down).\n' +
          '• <strong>Gradient = acceleration</strong>.\n' +
          '• <strong>Area under the graph = displacement</strong>.\n\n' +
          '<strong>Acceleration-time (a-t) graph:</strong> the area under the graph = change in velocity.\n\n' +
          '<strong>Step by step: gradient</strong>\n' +
          'Step 1: Pick two points on the straight line.\n' +
          'Step 2: Gradient = Δy ÷ Δx (rise ÷ run).\n' +
          'Step 3: Add the unit (y-unit per x-unit).\n\n' +
          '<strong>Step by step: area</strong>\n' +
          'Step 1: Split the shape into triangles (½ × base × height) and rectangles (base × height).\n' +
          'Step 2: Calculate each area.\n' +
          'Step 3: Add them up (areas below the time axis are negative).'
      },
      {
        title: 'Free fall',
        body:
          '<strong>Free fall:</strong> the motion of an object that has only gravity acting on it (air resistance is ignored).\n\n' +
          '• The acceleration is <strong>9.8 m·s⁻² downward</strong> for all objects, whatever their mass.\n' +
          '• For an object thrown upward, the velocity becomes zero at the highest point, but the acceleration is still 9.8 m·s⁻² downward.\n' +
          '• The time going up equals the time coming down (back to the same height).\n\n' +
          '<strong>Worked example:</strong> A ball is thrown straight up at 19.6 m·s⁻¹. Find the time to the top and the maximum height. (Upward = positive, so a = −9.8 m·s⁻²)\n' +
          'Step 1: At the top, v<sub>f</sub> = 0. Known: v<sub>i</sub> = +19.6 m·s⁻¹, a = −9.8 m·s⁻².\n' +
          'Step 2: Time: v<sub>f</sub> = v<sub>i</sub> + aΔt → 0 = 19.6 + (−9.8)Δt → Δt = <strong>2 s</strong>.\n' +
          'Step 3: Height: Δy = ((v<sub>i</sub> + v<sub>f</sub>) ÷ 2) × Δt = ((19.6 + 0) ÷ 2)(2) = <strong>19.6 m</strong>.\n' +
          'Step 4: Check: v<sub>f</sub>² = v<sub>i</sub>² + 2aΔy → 0 = 384.16 + 2(−9.8)(19.6) = 0 ✔.'
      }
    ],
    subs: [
      {
        sub: '1.1', heading: 'Multiple-choice questions',
        instruction: 'Choose the correct answer.',
        items: [
          mcq('Displacement is best defined as …',
            ['the total length of the path travelled', 'the change in position of an object', 'the rate of change of position', 'the speed of an object in a certain direction'],
            1, 'Displacement is the change in position of an object (Δx = x<sub>f</sub> − x<sub>i</sub>).'),
          mcq('Which ONE of the following is a vector quantity?',
            ['Distance', 'Speed', 'Time', 'Displacement'],
            3, 'Displacement has magnitude and direction. The others have magnitude only.'),
          mcq('A learner walks 4 m east and then 3 m west. What is the total <strong>distance</strong> travelled?',
            ['1 m', '3 m', '4 m', '7 m'],
            3, 'Distance is the total path length: 4 + 3 = 7 m.'),
          mcq('Which ONE is the correct unit of acceleration?',
            ['m·s⁻¹', 'm·s⁻²', 'm·s²', 'N'],
            1, 'a = Δv ÷ Δt, so the unit is (m·s⁻¹) ÷ s = m·s⁻².'),
          mcq('The gradient of a position-time graph gives the …',
            ['acceleration', 'displacement', 'velocity', 'distance'],
            2, 'Gradient = Δx ÷ Δt = velocity.'),
          mcq('The area under a velocity-time graph gives the …',
            ['acceleration', 'displacement', 'time', 'gradient'],
            1, 'Area under a v-t graph = displacement.'),
          mcq('Study the graph. Which statement describes the motion between <strong>4 s and 10 s</strong>?',
            ['Uniform acceleration', 'Constant velocity', 'Uniform deceleration', 'The object is at rest'],
            1, 'The line is horizontal at 8 m·s⁻¹, so the velocity is constant.', IMG_VT_GRAPH),
          mcq('Study the graph. Which statement describes the motion between <strong>4 s and 6 s</strong>?',
            ['Moving at constant velocity', 'Accelerating', 'At rest', 'Moving backwards'],
            2, 'The position stays at 8 m, so the object is at rest.', IMG_XT_GRAPH),
          mcq('A heavy stone and a light stone are released from the same height. Ignore air resistance. Which statement is correct?',
            ['The heavy stone hits the ground first', 'The light stone hits the ground first', 'They hit the ground at the same time', 'The heavy stone has a smaller acceleration'],
            2, 'All objects in free fall have the same acceleration (9.8 m·s⁻²), whatever their mass.')
        ]
      },
      {
        sub: '1.2', heading: 'Terminology and calculations',
        instruction: 'Give ONE word or term, or a numerical answer (numbers only, no units).',
        items: [
          term('The total length of the path travelled by an object.',
            ['distance'], 'This is distance.'),
          term('The change in position of an object.',
            ['displacement'], 'This is displacement.'),
          term('The rate of change of displacement.',
            ['velocity', 'average velocity'], 'This is velocity.'),
          term('The rate of change of velocity.',
            ['acceleration'], 'This is acceleration.'),
          term('The motion of an object with only gravity acting on it.',
            ['free fall', 'freefall', 'free-fall'], 'This is free fall.'),
          term('A physical quantity that has magnitude only.',
            ['scalar', 'scalar quantity'], 'This is a scalar.'),
          term('A car travels 120 m in 8 s at constant speed. Calculate its speed in m·s⁻¹.',
            ['15', '15.0'], 'Speed = distance ÷ time = 120 ÷ 8 = 15 m·s⁻¹.'),
          term('Study the velocity-time graph. Calculate the acceleration from 0 s to 4 s. (m·s⁻²)',
            ['2', '2.0'], 'a = gradient = (8 − 0) ÷ (4 − 0) = 2 m·s⁻².', IMG_VT_GRAPH),
          term('Study the velocity-time graph. Calculate the total displacement of the object in the 14 s. (m)',
            ['80', '80.0'], 'Area = ½(4)(8) + (6)(8) + ½(4)(8) = 16 + 48 + 16 = 80 m.', IMG_VT_GRAPH),
          term('Study the position-time graph. Calculate the velocity during the first 4 s. (m·s⁻¹)',
            ['2', '2.0'], 'v = gradient = Δx ÷ Δt = (8 − 0) ÷ 4 = 2 m·s⁻¹.', IMG_XT_GRAPH)
        ]
      },
      {
        sub: '1.3', heading: 'True or false',
        instruction: 'Choose TRUE or FALSE. If a statement is false, the explanation shows why.',
        items: [
          tf('Distance can have a negative value.', false, 'False. Distance is a scalar and is never negative.'),
          tf('An object can have a displacement of zero even though it has travelled a distance.', true, 'True. If it returns to its starting point, Δx = 0.'),
          tf('The gradient of a velocity-time graph gives acceleration.', true, 'True. Gradient = Δv ÷ Δt.'),
          tf('An object moving at constant velocity has zero acceleration.', true, 'True. The velocity is not changing.'),
          tf('A heavier object falls with a bigger acceleration than a lighter object in free fall.', false, 'False. All objects in free fall have the same acceleration.'),
          tf('At the highest point of a ball thrown upward, its acceleration is zero.', false, 'False. The velocity is zero, but the acceleration is still 9.8 m·s⁻² downward.')
        ]
      },
      {
        sub: '1.4', heading: 'Short questions',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Define <strong>displacement</strong>.', 2,
            ['The change in position of an object (1)', 'In a straight line from the starting point to the end point, with direction (1)']),
          short('Differentiate between <strong>distance</strong> and <strong>displacement</strong>.', 4,
            ['Distance: the total length of the path travelled (1)', 'Distance is a scalar / has no direction (1)', 'Displacement: the change in position (1)', 'Displacement is a vector / has direction (1)']),
          short('Define <strong>acceleration</strong>.', 2,
            ['The rate of change of velocity (1)', 'a = Δv ÷ Δt, unit m·s⁻² (1)']),
          short('A car starts from rest and accelerates uniformly at 3 m·s⁻² for 6 s. Calculate: (a) its final velocity (2) and (b) its displacement (2). Show every step.', 4,
            ['(a) v<sub>f</sub> = v<sub>i</sub> + aΔt (1)', '(a) = 0 + (3)(6) = 18 m·s⁻¹ forward (1)', '(b) Δx = v<sub>i</sub>Δt + ½aΔt² (1)', '(b) = 0 + ½(3)(6)² = 54 m forward (1)'],
            'Forward is positive.'),
          short('Study the velocity-time graph. Describe the motion of the object during each of these periods: 0-4 s, 4-10 s and 10-14 s.', 3,
            ['0-4 s: uniform (constant) acceleration (1)', '4-10 s: constant velocity (1)', '10-14 s: uniform deceleration (slowing down) (1)'],
            '', IMG_VT_GRAPH),
          short('Study the velocity-time graph. Calculate the total displacement of the object using the area under the graph.', 4,
            ['0-4 s: area of triangle = ½(4)(8) = 16 m (1)', '4-10 s: area of rectangle = (6)(8) = 48 m (1)', '10-14 s: area of triangle = ½(4)(8) = 16 m (1)', 'Total displacement = 16 + 48 + 16 = 80 m forward (1)'],
            '', IMG_VT_GRAPH),
          short('A stone is dropped from rest from the top of a cliff and hits the ground after 3 s. (g = 9.8 m·s⁻²) Calculate: (a) its velocity just before it hits the ground (2) and (b) the height of the cliff (2).', 4,
            ['(a) Downward is positive: v<sub>f</sub> = v<sub>i</sub> + aΔt = 0 + (9.8)(3) (1)', '(a) = 29.4 m·s⁻¹ downward (1)', '(b) Δy = v<sub>i</sub>Δt + ½aΔt² = 0 + ½(9.8)(3)² (1)', '(b) = 44.1 m (1)']),
          short('A ball is thrown straight up at 9.8 m·s⁻¹. (g = 9.8 m·s⁻²) Calculate: (a) the time taken to reach the highest point (2) and (b) the maximum height reached (2).', 4,
            ['(a) Upward positive: 0 = 9.8 + (−9.8)Δt (1)', '(a) Δt = 1 s (1)', '(b) Δy = ((v<sub>i</sub> + v<sub>f</sub>) ÷ 2)Δt = ((9.8 + 0) ÷ 2)(1) (1)', '(b) = 4.9 m (1)'])
        ]
      }
    ]
  },

  /* ================= QUESTION 2: MECHANICAL ENERGY ================= */
  {
    title: 'Question 2: Mechanical energy',
    learn: [
      {
        title: 'Gravitational potential energy and kinetic energy',
        body:
          '<strong>Energy:</strong> the ability to do work. It is a scalar. Unit: joule (J).\n\n' +
          '<strong>Gravitational potential energy (E<sub>p</sub>):</strong> the energy an object has because of its position relative to a reference point (its height above the ground).\n' +
          'E<sub>p</sub> = mgh\n\n' +
          '<strong>Kinetic energy (E<sub>k</sub>):</strong> the energy an object has because of its motion.\n' +
          'E<sub>k</sub> = ½mv²\n\n' +
          '<strong>Mechanical energy (E<sub>M</sub>):</strong> the sum of the gravitational potential energy and the kinetic energy at a point.\n' +
          'E<sub>M</sub> = E<sub>p</sub> + E<sub>k</sub>\n\n' +
          'Symbols: m = mass (kg), g = 9.8 m·s⁻², h = height above the reference level (m), v = speed (m·s⁻¹).\n' +
          'The reference level (h = 0) is chosen by you, usually the ground or the lowest point.\n\n' +
          '<strong>Worked example:</strong> A 3 kg ball is 4 m above the floor and moves at 2 m·s⁻¹. Find its mechanical energy.\n' +
          'Step 1: E<sub>p</sub> = mgh = (3)(9.8)(4) = 117.6 J.\n' +
          'Step 2: E<sub>k</sub> = ½mv² = ½(3)(2)² = 6 J.\n' +
          'Step 3: E<sub>M</sub> = E<sub>p</sub> + E<sub>k</sub> = 117.6 + 6 = <strong>123.6 J</strong>.'
      },
      {
        title: 'Conservation of mechanical energy',
        body:
          '<strong>Principle of conservation of mechanical energy:</strong> the total mechanical energy (sum of gravitational potential energy and kinetic energy) in an isolated system remains constant.\n\n' +
          '<strong>Isolated system:</strong> a system with no external forces doing work on it (no friction or air resistance).\n\n' +
          'So, between any two points A and B:\n' +
          'E<sub>M</sub> at A = E<sub>M</sub> at B\n' +
          '(E<sub>p</sub> + E<sub>k</sub>)<sub>A</sub> = (E<sub>p</sub> + E<sub>k</sub>)<sub>B</sub>\n\n' +
          '<strong>How to solve (step by step):</strong>\n' +
          'Step 1: Draw a sketch and mark points A and B.\n' +
          'Step 2: Choose the reference level (h = 0), usually the lowest point.\n' +
          'Step 3: At each point work out which of E<sub>p</sub> and E<sub>k</sub> are zero (at rest: E<sub>k</sub> = 0; on the ground: E<sub>p</sub> = 0).\n' +
          'Step 4: Write E<sub>M</sub> at A = E<sub>M</sub> at B.\n' +
          'Step 5: Substitute mgh and ½mv², solve for the unknown.\n' +
          'Step 6: Write the answer with its unit.\n\n' +
          '<strong>Worked example:</strong> A 2 kg ball is dropped from rest from a height of 10 m. Find its speed just before it hits the ground. Ignore air resistance.\n' +
          'Step 1: Ground is h = 0. At A (top): v = 0, so E<sub>k</sub> = 0. At B (ground): h = 0, so E<sub>p</sub> = 0.\n' +
          'Step 2: E<sub>M(A)</sub> = E<sub>p</sub> = (2)(9.8)(10) = 196 J.\n' +
          'Step 3: E<sub>M(A)</sub> = E<sub>M(B)</sub> → 196 = ½(2)v².\n' +
          'Step 4: v² = 196 → v = <strong>14 m·s⁻¹</strong>.'
      },
      {
        title: 'Energy changes and non-conservative forces',
        body:
          '<strong>Falling object:</strong> E<sub>p</sub> decreases and E<sub>k</sub> increases. The loss in E<sub>p</sub> equals the gain in E<sub>k</sub>, so E<sub>M</sub> stays the same.\n\n' +
          '<strong>Object thrown upward:</strong> E<sub>k</sub> decreases and E<sub>p</sub> increases. At the highest point v = 0, so E<sub>k</sub> = 0 and E<sub>p</sub> is at its maximum.\n\n' +
          '<strong>Positions to remember:</strong>\n' +
          '• Top (at rest): E<sub>k</sub> = 0, E<sub>p</sub> = maximum.\n' +
          '• Ground: E<sub>p</sub> = 0, E<sub>k</sub> = maximum.\n' +
          '• Halfway down: E<sub>p</sub> and E<sub>k</sub> are equal (if it started from rest).\n\n' +
          '<strong>Air resistance and friction:</strong> some mechanical energy is changed to thermal energy (heat) and sound. Mechanical energy is then NOT conserved, but the total energy of the universe is still conserved.\n\n' +
          '<strong>Tip:</strong> if a question says "smooth", "frictionless" or "ignore air resistance", you may use conservation of mechanical energy.'
      }
    ],
    subs: [
      {
        sub: '2.1', heading: 'Multiple-choice questions',
        instruction: 'Choose the correct answer. Use g = 9.8 m·s⁻².',
        items: [
          mcq('The SI unit of energy is the …',
            ['watt', 'newton', 'joule', 'pascal'],
            2, 'Energy is measured in joules (J).'),
          mcq('The gravitational potential energy of an object depends on its …',
            ['mass and speed', 'mass and height above the reference level', 'speed and height', 'speed only'],
            1, 'E<sub>p</sub> = mgh, so it depends on mass and height (and g).'),
          mcq('Which ONE is the correct formula for kinetic energy?',
            ['mgh', '½mv²', 'mv', '½mv'],
            1, 'E<sub>k</sub> = ½mv².'),
          mcq('A 3 kg object is 5 m above the ground. Its gravitational potential energy is …',
            ['15 J', '29.4 J', '73.5 J', '147 J'],
            3, 'E<sub>p</sub> = mgh = (3)(9.8)(5) = 147 J.'),
          mcq('A 2 kg object moves at 3 m·s⁻¹. Its kinetic energy is …',
            ['3 J', '6 J', '9 J', '18 J'],
            2, 'E<sub>k</sub> = ½mv² = ½(2)(3)² = 9 J.'),
          mcq('The speed of an object doubles. Its kinetic energy …',
            ['stays the same', 'doubles', 'becomes four times greater', 'is halved'],
            2, 'E<sub>k</sub> ∝ v², so doubling v makes E<sub>k</sub> four times bigger.'),
          mcq('A ball falls freely. Air resistance is ignored. Which statement is correct?',
            ['E<sub>p</sub> increases and E<sub>k</sub> decreases', 'E<sub>p</sub> decreases, E<sub>k</sub> increases and E<sub>M</sub> stays constant', 'Both E<sub>p</sub> and E<sub>k</sub> increase', 'E<sub>M</sub> decreases'],
            1, 'E<sub>p</sub> is changed to E<sub>k</sub>, and the total stays the same.'),
          mcq('Study the diagram. What is the gravitational potential energy of the ball at <strong>A</strong>?',
            ['19.6 J', '98 J', '196 J', '392 J'],
            2, 'E<sub>p</sub> = mgh = (2)(9.8)(10) = 196 J.', IMG_RAMP),
          mcq('Study the diagram. What is the kinetic energy of the ball at <strong>B</strong>?',
            ['0 J', '98 J', '196 J', '392 J'],
            1, 'E<sub>p(B)</sub> = (2)(9.8)(5) = 98 J. E<sub>M</sub> = 196 J, so E<sub>k(B)</sub> = 196 − 98 = 98 J.', IMG_RAMP)
        ]
      },
      {
        sub: '2.2', heading: 'Terminology and calculations',
        instruction: 'Give ONE word or term, or a numerical answer (numbers only, no units). Use g = 9.8 m·s⁻².',
        items: [
          term('The energy an object has because of its position relative to a reference point.',
            ['gravitational potential energy', 'potential energy', 'gravitational pe', 'gpe', 'ep'], 'This is gravitational potential energy.'),
          term('The energy an object has because of its motion.',
            ['kinetic energy', 'ke', 'ek'], 'This is kinetic energy.'),
          term('The sum of the gravitational potential energy and the kinetic energy of an object.',
            ['mechanical energy', 'em'], 'This is mechanical energy.'),
          term('Name the SI unit of energy.',
            ['joule', 'joules', 'j'], 'The joule (J).'),
          term('Name the principle that states that the total mechanical energy of an isolated system stays constant.',
            ['conservation of mechanical energy', 'principle of conservation of mechanical energy', 'law of conservation of mechanical energy', 'mechanical energy conservation'],
            'This is the principle of conservation of mechanical energy.'),
          term('Study the diagram. Calculate the mechanical energy of the ball at <strong>B</strong>. (J)',
            ['196', '196.0'], 'E<sub>M</sub> is the same everywhere on a smooth track: E<sub>M(B)</sub> = E<sub>M(A)</sub> = 196 J.', IMG_RAMP),
          term('Study the diagram. Calculate the kinetic energy of the ball at <strong>C</strong>. (J)',
            ['196', '196.0'], 'At C, E<sub>p</sub> = 0, so E<sub>k</sub> = E<sub>M</sub> = 196 J.', IMG_RAMP),
          term('Study the diagram. Calculate the speed of the ball at <strong>C</strong>. (m·s⁻¹)',
            ['14', '14.0'], '196 = ½(2)v² → v² = 196 → v = 14 m·s⁻¹.', IMG_RAMP),
          term('Calculate the kinetic energy of a 1000 kg car moving at 20 m·s⁻¹. (kJ)',
            ['200', '200.0'], 'E<sub>k</sub> = ½(1000)(20)² = 200 000 J = 200 kJ.'),
          term('Calculate the gravitational potential energy of a 0.5 kg ball held 6 m above the ground. (J)',
            ['29.4'], 'E<sub>p</sub> = mgh = (0.5)(9.8)(6) = 29.4 J.')
        ]
      },
      {
        sub: '2.3', heading: 'True or false',
        instruction: 'Choose TRUE or FALSE. If a statement is false, the explanation shows why.',
        items: [
          tf('Energy is a vector quantity.', false, 'False. Energy is a scalar (it has no direction).'),
          tf('The gravitational potential energy of an object at the reference level is zero.', true, 'True. h = 0, so E<sub>p</sub> = mgh = 0.'),
          tf('The kinetic energy of an object depends on its direction of motion.', false, 'False. E<sub>k</sub> = ½mv² depends only on mass and speed.'),
          tf('If air resistance is ignored, the mechanical energy of a freely falling object stays constant.', true, 'True. E<sub>p</sub> is changed into E<sub>k</sub> and the sum stays the same.'),
          tf('Doubling the mass of an object at the same height doubles its gravitational potential energy.', true, 'True. E<sub>p</sub> = mgh is directly proportional to m.'),
          tf('A ball thrown straight up has maximum kinetic energy at its highest point.', false, 'False. At the highest point v = 0, so E<sub>k</sub> = 0 and E<sub>p</sub> is at its maximum.')
        ]
      },
      {
        sub: '2.4', heading: 'Short questions',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Define <strong>gravitational potential energy</strong>.', 2,
            ['The energy an object has because of its position (1)', 'relative to a reference point / height above the Earth (1)']),
          short('Define <strong>kinetic energy</strong>.', 2,
            ['The energy an object has (1)', 'because of its motion (1)']),
          short('Define <strong>mechanical energy</strong>.', 2,
            ['The sum of (1)', 'gravitational potential energy and kinetic energy (1)']),
          short('State the <strong>principle of conservation of mechanical energy</strong>.', 2,
            ['The total mechanical energy (sum of E<sub>p</sub> and E<sub>k</sub>) in an isolated system (1)', 'remains constant (1)']),
          short('A 4 kg ball is held 5 m above the ground and then dropped. Ignore air resistance. Calculate: (a) its gravitational potential energy before it is released (2), (b) its kinetic energy just before it hits the ground (1) and (c) its speed just before it hits the ground (2). Show every step.', 5,
            ['(a) E<sub>p</sub> = mgh (1)', '(a) = (4)(9.8)(5) = 196 J (1)', '(b) E<sub>M(top)</sub> = E<sub>M(ground)</sub>, E<sub>k</sub> = 196 J (1)', '(c) ½mv² = 196 → ½(4)v² = 196 (1)', '(c) v = 9.9 m·s⁻¹ (v² = 98) (1)']),
          short('Study the diagram. Calculate the speed of the ball at point <strong>B</strong>.', 4,
            ['E<sub>p(B)</sub> = mgh = (2)(9.8)(5) = 98 J (1)', 'E<sub>M(B)</sub> = E<sub>M(A)</sub> = 196 J (1)', 'E<sub>k(B)</sub> = 196 − 98 = 98 J (1)', '½(2)v² = 98 → v = 9.9 m·s⁻¹ (1)'],
            'Smooth track, so mechanical energy is conserved.', IMG_RAMP),
          short('A ball is thrown straight up and returns to the thrower\'s hand. Describe the changes in kinetic and gravitational potential energy during the whole flight. Ignore air resistance.', 4,
            ['Going up: E<sub>k</sub> decreases and E<sub>p</sub> increases (1)', 'At the highest point: E<sub>k</sub> = 0 and E<sub>p</sub> is maximum (1)', 'Coming down: E<sub>p</sub> decreases and E<sub>k</sub> increases (1)', 'Mechanical energy stays constant the whole time (1)']),
          short('A ball is dropped and bounces, but each bounce is lower than the one before. Explain why, in terms of energy.', 3,
            ['Air resistance and the impact with the floor act on the ball (1)', 'Some mechanical energy is changed to heat and sound (1)', 'Mechanical energy decreases, but the total energy is still conserved (1)'])
        ]
      }
    ]
  },

  /* ================= QUESTION 3: ELECTROMAGNETIC RADIATION ================= */
  {
    title: 'Question 3: Electromagnetic radiation',
    learn: [
      {
        title: 'What is electromagnetic radiation?',
        body:
          '<strong>Electromagnetic (EM) radiation:</strong> a transverse wave made of oscillating electric and magnetic fields that are at right angles to each other and to the direction the wave travels.\n\n' +
          '<strong>Properties of EM waves:</strong>\n' +
          '• They do NOT need a medium. They can travel through a vacuum.\n' +
          '• All EM waves travel at the same speed in a vacuum: c = 3 × 10⁸ m·s⁻¹.\n' +
          '• They can be reflected, refracted and absorbed.\n\n' +
          '<strong>Dual nature:</strong> EM radiation behaves as a wave (e.g. diffraction and interference) and also as a particle.\n' +
          '<strong>Photon:</strong> a packet (quantum) of EM energy. EM radiation is made of photons.\n\n' +
          '<strong>Wave terms (see the diagram):</strong>\n' +
          '• <strong>Wavelength (λ):</strong> the distance between two consecutive points in phase (e.g. crest to crest). Unit: m.\n' +
          '• <strong>Amplitude:</strong> the maximum displacement from the rest (equilibrium) position. Unit: m.\n' +
          '• <strong>Frequency (f):</strong> the number of complete waves that pass a point per second. Unit: hertz (Hz).\n' +
          '• <strong>Period (T):</strong> the time for one complete wave. T = 1 ÷ f. Unit: s.',
        image: IMG_WAVE
      },
      {
        title: 'Calculations with c = fλ and E = hf',
        body:
          '<strong>Speed of a wave:</strong> v = fλ. For EM waves in a vacuum: <strong>c = fλ</strong>.\n\n' +
          '<strong>Energy of one photon:</strong> E = hf, or E = hc ÷ λ (because f = c ÷ λ).\n' +
          'h = Planck\'s constant = 6.63 × 10⁻³⁴ J·s.\n\n' +
          '<strong>How to solve (step by step):</strong>\n' +
          'Step 1: Write down what is given and convert to SI units (MHz → × 10⁶ Hz, nm → × 10⁻⁹ m).\n' +
          'Step 2: Pick the formula (c = fλ or E = hf or E = hc ÷ λ).\n' +
          'Step 3: Substitute the numbers with units.\n' +
          'Step 4: Calculate and write the answer with a unit.\n\n' +
          '<strong>Worked example 1:</strong> A radio wave has a frequency of 100 MHz. Find its wavelength.\n' +
          'f = 100 × 10⁶ = 1 × 10⁸ Hz.\n' +
          'λ = c ÷ f = (3 × 10⁸) ÷ (1 × 10⁸) = <strong>3 m</strong>.\n\n' +
          '<strong>Worked example 2:</strong> Find the energy of one photon of frequency 5 × 10¹⁴ Hz.\n' +
          'E = hf = (6.63 × 10⁻³⁴)(5 × 10¹⁴) = <strong>3.3 × 10⁻¹⁹ J</strong>.\n\n' +
          '<strong>Remember:</strong> if the frequency goes up, the wavelength goes down (c is constant) and the photon energy goes up.'
      },
      {
        title: 'The electromagnetic spectrum',
        body:
          'In order from the <strong>lowest</strong> to the <strong>highest</strong> frequency:\n' +
          '<strong>radio waves → microwaves → infrared → visible light → ultraviolet → X-rays → gamma rays</strong>\n\n' +
          'Going from radio waves to gamma rays:\n' +
          '• frequency increases\n' +
          '• wavelength decreases\n' +
          '• photon energy increases\n' +
          '• penetrating ability increases\n\n' +
          'Gamma rays have the highest frequency, the highest energy and the shortest wavelength. Radio waves have the lowest frequency and the longest wavelength.',
        image: IMG_EM_SPECTRUM
      },
      {
        title: 'Uses and dangers of EM radiation',
        body:
          '<strong>Radio waves:</strong> radio and TV broadcasting, cellphones. Danger: very low energy, little danger.\n\n' +
          '<strong>Microwaves:</strong> microwave ovens, cellphones, satellite and radar. Danger: heating of body tissue (e.g. eyes and skin) in strong doses.\n\n' +
          '<strong>Infrared:</strong> remote controls, thermal (heat) imaging, heaters. Danger: skin burns.\n\n' +
          '<strong>Visible light:</strong> seeing, photosynthesis, photography. Danger: very bright light (e.g. lasers) damages the retina.\n\n' +
          '<strong>Ultraviolet (UV):</strong> sterilising water and equipment, vitamin D formation, detecting forged notes. Danger: sunburn, skin cancer and cataracts.\n\n' +
          '<strong>X-rays:</strong> medical imaging of bones, airport security scanners. Danger: ionising radiation that damages cells and can cause cancer.\n\n' +
          '<strong>Gamma rays:</strong> cancer treatment (radiotherapy), sterilising food and medical equipment. Danger: ionising radiation, damages cells and DNA, causes cancer.\n\n' +
          '<strong>Why are high-frequency waves more dangerous?</strong> Each photon has more energy (E = hf), so it can damage living cells.'
      }
    ],
    subs: [
      {
        sub: '3.1', heading: 'Multiple-choice questions',
        instruction: 'Choose the correct answer. Use c = 3 × 10⁸ m·s⁻¹ and h = 6.63 × 10⁻³⁴ J·s.',
        items: [
          mcq('Electromagnetic radiation is …',
            ['a longitudinal wave that needs a medium', 'a transverse wave that does not need a medium', 'a sound wave', 'a wave that only travels through solids'],
            1, 'EM waves are transverse and can travel through a vacuum.'),
          mcq('What is the speed of all EM waves in a vacuum?',
            ['3 × 10⁶ m·s⁻¹', '3 × 10⁸ m·s⁻¹', '340 m·s⁻¹', '3 × 10¹⁰ m·s⁻¹'],
            1, 'c = 3 × 10⁸ m·s⁻¹.'),
          mcq('Which type of EM radiation has the highest frequency?',
            ['Radio waves', 'Infrared', 'Ultraviolet', 'Gamma rays'],
            3, 'Gamma rays are at the high-frequency end of the spectrum.'),
          mcq('Which type of EM radiation has the longest wavelength?',
            ['X-rays', 'Microwaves', 'Radio waves', 'Visible light'],
            2, 'Radio waves have the lowest frequency, so the longest wavelength.'),
          mcq('Which type of EM radiation is used to take images of broken bones?',
            ['Radio waves', 'X-rays', 'Infrared', 'Microwaves'],
            1, 'X-rays pass through soft tissue but are absorbed by bone.'),
          mcq('Which type of EM radiation can cause sunburn and skin cancer?',
            ['Infrared', 'Microwaves', 'Ultraviolet', 'Radio waves'],
            2, 'Too much UV radiation damages skin cells.'),
          mcq('Photons of which type of radiation have the MOST energy?',
            ['Radio waves', 'Microwaves', 'Visible light', 'Ultraviolet'],
            3, 'E = hf. UV has the highest frequency of these, so the highest energy.'),
          mcq('The frequency of a photon is 4 × 10¹⁴ Hz. What is its energy?',
            ['2.65 × 10⁻¹⁹ J', '6.63 × 10⁻³⁴ J', '2.65 × 10⁻⁴⁸ J', '1.66 × 10⁻²⁰ J'],
            0, 'E = hf = (6.63 × 10⁻³⁴)(4 × 10¹⁴) = 2.65 × 10⁻¹⁹ J.'),
          mcq('Study the wave diagram. What is the quantity labelled <strong>P</strong>?',
            ['Amplitude', 'Wavelength', 'Period', 'Frequency'],
            1, 'P is the distance from one crest to the next crest: the wavelength.', IMG_WAVE),
          mcq('Study the spectrum. Which letter represents the region used in <strong>TV remote controls</strong>?',
            ['B', 'C', 'D', 'E'],
            1, 'Remote controls use infrared, which is region C (between microwaves and visible light).', IMG_EM_LETTERS),
          mcq('Study the spectrum. Which letter represents the radiation with the <strong>greatest photon energy</strong>?',
            ['A', 'D', 'F', 'G'],
            3, 'Energy increases to the right, so G (gamma rays) has the highest energy.', IMG_EM_LETTERS)
        ]
      },
      {
        sub: '3.2', heading: 'Terminology and calculations',
        instruction: 'Give ONE word or term, or a numerical answer (numbers only, no units). Use c = 3 × 10⁸ m·s⁻¹.',
        items: [
          term('A packet (quantum) of electromagnetic energy.',
            ['photon', 'a photon'], 'This is a photon.'),
          term('The distance between two consecutive crests of a wave.',
            ['wavelength'], 'This is wavelength.'),
          term('The number of complete waves that pass a point per second.',
            ['frequency'], 'This is frequency.'),
          term('The maximum displacement of a wave from its rest (equilibrium) position.',
            ['amplitude'], 'This is amplitude.'),
          term('The ability of EM radiation to behave as both a wave and a particle is called its ... nature.',
            ['dual', 'dual nature', 'wave-particle duality', 'wave particle duality'], 'EM radiation has a dual nature.'),
          term('Name the unit of frequency.',
            ['hertz', 'hz'], 'The hertz (Hz).'),
          term('Study the wave diagram. Name the quantity labelled <strong>Q</strong>.',
            ['amplitude'], 'Q is the height from the rest position to a crest: the amplitude.', IMG_WAVE),
          term('Study the spectrum. Name the region labelled <strong>E</strong>.',
            ['ultraviolet', 'ultraviolet radiation', 'ultraviolet rays', 'uv', 'ultra violet'],
            'The order is: radio, microwaves, infrared, visible light, ultraviolet (E), X-rays, gamma rays.', IMG_EM_LETTERS),
          term('Calculate the wavelength of an EM wave with a frequency of 1.5 × 10⁸ Hz. (m)',
            ['2', '2.0'], 'λ = c ÷ f = (3 × 10⁸) ÷ (1.5 × 10⁸) = 2 m.'),
          term('A wave has a frequency of 50 Hz. Calculate its period. (s)',
            ['0.02'], 'T = 1 ÷ f = 1 ÷ 50 = 0.02 s.'),
          term('A wave completes 5 complete cycles in 2 s. Calculate its frequency. (Hz)',
            ['2.5'], 'f = number of waves ÷ time = 5 ÷ 2 = 2.5 Hz.')
        ]
      },
      {
        sub: '3.3', heading: 'True or false',
        instruction: 'Choose TRUE or FALSE. If a statement is false, the explanation shows why.',
        items: [
          tf('Electromagnetic waves need a medium to travel through.', false, 'False. They can travel through a vacuum.'),
          tf('All EM waves travel at the same speed in a vacuum.', true, 'True. The speed is c = 3 × 10⁸ m·s⁻¹.'),
          tf('When the frequency of an EM wave increases, its wavelength decreases.', true, 'True. c = fλ and c is constant.'),
          tf('Gamma rays have less energy per photon than radio waves.', false, 'False. Gamma rays have the highest frequency, so the highest photon energy.'),
          tf('Visible light has a longer wavelength than infrared radiation.', false, 'False. Visible light has a higher frequency, so a SHORTER wavelength than infrared.'),
          tf('X-rays have a greater penetrating ability than radio waves.', true, 'True. Penetrating ability increases with frequency.'),
          tf('Too much exposure to ultraviolet radiation can cause skin cancer.', true, 'True. UV photons have enough energy to damage skin cells.')
        ]
      },
      {
        sub: '3.4', heading: 'Short questions',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Define <strong>electromagnetic radiation</strong>.', 2,
            ['A transverse wave (1)', 'made of oscillating electric and magnetic fields / that does not need a medium (1)']),
          short('State TWO properties of electromagnetic waves.', 2,
            ['They are transverse waves', 'They do not need a medium / can travel in a vacuum', 'They travel at 3 × 10⁸ m·s⁻¹ in a vacuum', 'They can be reflected / refracted / absorbed'],
            'Any two.'),
          short('List the seven regions of the electromagnetic spectrum in order of INCREASING frequency.', 7,
            ['Radio waves (1)', 'Microwaves (1)', 'Infrared (1)', 'Visible light (1)', 'Ultraviolet (1)', 'X-rays (1)', 'Gamma rays (1)'],
            'Each region in the correct position earns 1 mark.', IMG_EM_SPECTRUM),
          short('A radio wave has a frequency of 6 × 10⁷ Hz. Calculate: (a) its wavelength (2) and (b) the energy of one of its photons (2). Show every step.', 4,
            ['(a) λ = c ÷ f (1)', '(a) = (3 × 10⁸) ÷ (6 × 10⁷) = 5 m (1)', '(b) E = hf (1)', '(b) = (6.63 × 10⁻³⁴)(6 × 10⁷) = 3.98 × 10⁻²⁶ J (1)']),
          short('Calculate the energy of one photon of light with a wavelength of 5 × 10⁻⁷ m.', 3,
            ['E = hc ÷ λ (1)', '= (6.63 × 10⁻³⁴)(3 × 10⁸) ÷ (5 × 10⁻⁷) (1)', '= 3.98 × 10⁻¹⁹ J (1)']),
          short('Blue light has a higher frequency than red light. Which one has photons with more energy? Explain.', 2,
            ['Blue light (1)', 'E = hf, so a higher frequency means more energy per photon (1)']),
          short('Explain why X-rays are more dangerous to living cells than radio waves.', 3,
            ['X-rays have a much higher frequency (1)', 'So each photon carries more energy (E = hf) (1)', 'X-rays are ionising: they damage cells and DNA and can cause cancer (1)']),
          short('Give ONE use and ONE danger of each of the following: (a) microwaves (2), (b) ultraviolet radiation (2), (c) gamma rays (2).', 6,
            ['(a) Use: microwave ovens / cellphones / radar / satellite communication (1)', '(a) Danger: heating of body tissue / burns (1)',
              '(b) Use: sterilising / vitamin D / detecting forged notes (1)', '(b) Danger: sunburn / skin cancer / cataracts (1)',
              '(c) Use: cancer treatment / sterilising medical equipment or food (1)', '(c) Danger: damages cells and DNA / causes cancer (1)'])
        ]
      }
    ]
  }
];

/** Flatten the paper into one list and add paper-style numbering */
function buildQuestions(sections: Section[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  sections.forEach(s => {
    s.learn.forEach(l => out.push({
      type: 'info', text: l.title, body: l.body, image: l.image,
      no: '', section: s.title, sub: '', instruction: '', marks: 0, timed: false
    }));
    s.subs.forEach(sub => sub.items.forEach((it, k) => out.push({
      ...it,
      no: `${sub.sub}.${k + 1}`,
      section: s.title,
      sub: `${sub.sub} ${sub.heading}`,
      instruction: sub.instruction
    })));
  });
  return out;
}

@Component({
  selector: 'app-physics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  templateUrl: './physics.component.html',
  styleUrl: './physics.component.css'
})
export class PhysicsComponent implements OnInit, OnDestroy {

  /** Admin switch: lets the learner use the "Check answer" link */
  @Input() answersEnabled = true;
  /** Percentage needed to pass */
  @Input() passMark = 50;
  /** Seconds allowed per timed question */
  @Input() timeTotal = 75;

  @Output() closed = new EventEmitter<void>();
  @Output() signUp = new EventEmitter<void>();

  title = 'Grade 10 Physics';

  /** Which part of the paper to show: 'all', 'motion', 'energy' or 'em' */
  @Input() topic = 'all';

  questions: QuizQuestion[] = buildQuestions(SECTIONS);

  // ---------- Pictures (SVG data URLs need to be marked as safe) ----------
  private imageCache = new Map<string, SafeUrl>();
  img(url: string): SafeUrl {
    let safe = this.imageCache.get(url);
    if (!safe) {
      safe = this.sanitizer.bypassSecurityTrustUrl(url);
      this.imageCache.set(url, safe);
    }
    return safe;
  }

  // ---------- Saved progress (resume) ----------
  private get PROGRESS_KEY(): string {
    return this.topic === 'all' ? 'physics-quiz-progress-v1' : 'physics-quiz-progress-v1-' + this.topic;
  }
  showResumePrompt = false;
  savedProgress: {
    index: number;
    marksEarned: number;
    topicMarks: Record<string, number>;
    answerLog: any[];
  } | null = null;

  get savedQuestionNumber(): number {
    const i = Math.min(this.savedProgress?.index ?? 0, this.questions.length - 1);
    const n = this.questions.slice(0, i + 1).filter(q => q.type !== 'info').length;
    return Math.max(n, 1);
  }

  get savedTopicName(): string {
    const i = Math.min(this.savedProgress?.index ?? 0, this.questions.length - 1);
    return this.topicOf(i);
  }

  private persistProgress(index: number): void {
    if (index <= 0) { this.clearSavedProgress(); return; }
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify({
        index,
        marksEarned: this.marksEarned,
        topicMarks: this.topicMarks,
        answerLog: this.answerLog
      }));
    } catch { /* storage blocked: quiz still works, just can't resume */ }
  }

  private readSavedProgress() {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      const valid =
        Number.isInteger(p.index) && p.index > 0 && p.index <= this.questions.length &&
        Number.isFinite(p.marksEarned) &&
        p.topicMarks && typeof p.topicMarks === 'object' &&
        Array.isArray(p.answerLog);
      return valid ? p : null;
    } catch { return null; }
  }

  private clearSavedProgress(): void {
    try { localStorage.removeItem(this.PROGRESS_KEY); } catch { }
  }

  resumeQuiz(): void {
    const s = this.savedProgress;
    if (!s) { this.startFresh(); return; }

    this.showResumePrompt = false;
    this.marksEarned = s.marksEarned;
    this.topicMarks = { ...s.topicMarks };
    this.answerLog = [...s.answerLog];

    // They answered the very last question but never pressed "See results"
    if (s.index >= this.questions.length) {
      this.currentIndex = this.questions.length - 1;
      this.clearSavedProgress();
      this.saveAttempt();
      this.showResults = true;
      return;
    }

    this.currentIndex = s.index;
    this.startQuestion();
  }

  startFresh(): void {
    this.clearSavedProgress();
    this.showResumePrompt = false;
    this.currentIndex = 0;
    this.marksEarned = 0;
    this.topicMarks = {};
    this.answerLog = [];
    this.attemptSaved = false;
    this.showResults = false;
    this.startQuestion();
  }

  closeResumePrompt(): void {
    this.showResumePrompt = false;   // progress stays saved
    this.close();
  }

  currentIndex = 0;
  showResults = false;

  answered = false;
  revealed = false;
  isCorrect = false;
  selectedOption: number | null = null;
  userAnswer = '';
  userText = '';
  memoChecked: boolean[] = [];
  feedback = '';

  timeLeft = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  marksEarned = 0;

  constructor(
    private auth: AuthService,
    private progress: QuizProgressService,
    private sanitizer: DomSanitizer
  ) { }

  // ---------- Topic filter ----------
  private static readonly TOPICS: Record<string, { index: number; title: string }> = {
    motion: { index: 0, title: 'Grade 10 Physics: Motion in one dimension' },
    energy: { index: 1, title: 'Grade 10 Physics: Mechanical energy' },
    em: { index: 2, title: 'Grade 10 Physics: Electromagnetic radiation' }
  };

  private applyTopic(): void {
    const t = PhysicsComponent.TOPICS[this.topic];
    if (t) {
      this.questions = buildQuestions([SECTIONS[t.index]]);
      this.title = t.title;
    }
  }

  // ---------- Lifecycle ----------
  ngOnInit(): void {
    this.applyTopic();
    const saved = this.readSavedProgress();
    if (saved) {
      this.savedProgress = saved;
      this.showResumePrompt = true;
      return;
    }
    this.startQuestion();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ---------- Getters used by the template ----------
  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentIndex];
  }

  get isInfo(): boolean { return this.currentQuestion?.type === 'info'; }
  /** Multiple choice and true/false share the same buttons */
  get isChoice(): boolean { return this.currentQuestion?.type === 'mcq' || this.currentQuestion?.type === 'tf'; }
  get isTerm(): boolean { return this.currentQuestion?.type === 'term'; }
  get isShort(): boolean { return this.currentQuestion?.type === 'short'; }

  /** Number of questions that count towards the score (learn cards excluded) */
  get scoredTotal(): number {
    return this.questions.filter(q => q.type !== 'info').length;
  }

  /** Total marks in the whole quiz */
  get marksTotal(): number {
    return this.questions.reduce((sum, q) => sum + q.marks, 0);
  }

  get questionNumber(): number {
    return this.questions
      .slice(0, this.currentIndex + 1)
      .filter(q => q.type !== 'info').length;
  }

  get isLast(): boolean {
    return this.currentIndex === this.questions.length - 1;
  }

  get nextLabel(): string {
    if (this.isInfo) {
      return 'Start';
    }
    return this.isLast ? 'See results' : 'Next';
  }

  get scorePercent(): number {
    return this.marksTotal ? Math.round((this.marksEarned / this.marksTotal) * 100) : 0;
  }

  get passed(): boolean {
    return this.scorePercent >= this.passMark;
  }

  get marksNeeded(): number {
    return Math.ceil((this.passMark / 100) * this.marksTotal);
  }

  get marksLost(): number {
    return this.marksTotal - this.marksEarned;
  }

  /** Marks the learner has ticked on the memo of the current short question */
  get shortMarks(): number {
    return Math.min(this.memoChecked.filter(Boolean).length, this.currentQuestion.marks);
  }

  // ---------- Question flow ----------
  private startQuestion(): void {
    this.answered = false;
    this.revealed = false;
    this.isCorrect = false;
    this.selectedOption = null;
    this.userAnswer = '';
    this.userText = '';
    this.memoChecked = [];
    this.feedback = '';
    this.stopTimer();
    this.persistProgress(this.currentIndex);

    if (!this.isInfo && this.currentQuestion.timed) {
      this.startTimer();
    }
  }

  chooseOption(index: number): void {
    if (this.answered) {
      return;
    }
    this.selectedOption = index;
    this.isCorrect = index === this.currentQuestion.correctIndex;
    this.lockAnswer();
  }

  private normalise(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9.%\-\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  checkAnswer(): void {
    if (this.answered || !this.userAnswer.trim()) {
      return;
    }
    const given = this.normalise(this.userAnswer);
    this.isCorrect = (this.currentQuestion.accepted ?? []).some(a => this.normalise(a) === given);
    this.lockAnswer();
  }

  /** Short questions: show the memo so the learner can mark themselves */
  submitShort(): void {
    if (this.answered || !this.userText.trim()) {
      return;
    }
    this.answered = true;
    this.stopTimer();
    this.memoChecked = (this.currentQuestion.model ?? []).map(() => false);
  }

  toggleMemo(i: number): void {
    this.memoChecked[i] = !this.memoChecked[i];
  }

  /** Reveal whether the locked-in answer was right (admin-enabled) */
  revealAnswer(): void {
    if (!this.answered || this.revealed || !this.answersEnabled || this.isShort) {
      return;
    }
    this.revealed = true;

    const explanation = this.currentQuestion.explanation ?? '';
    const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

    if (this.isCorrect) {
      const cheers = [
        'Nice one! 🎉', 'Yes! You nailed it! 🌟', 'Brilliant! 🙌',
        'Spot on! 🔥', 'You\'re on a roll! 🚀', 'Boom! Correct! 💥'
      ];
      this.feedback = `${pick(cheers)} ${explanation}`;
    } else {
      const nudges = [
        'Good try! 💪', 'Almost there! 😊', 'No worries, this one trips up lots of people!',
        'Great effort, you\'ll get the next one! 🌈', 'Mistakes help us learn! 🧠'
      ];
      this.feedback = `${pick(nudges)} The answer is <strong>${this.correctText(this.currentQuestion)}</strong>. ${explanation}`;
    }
  }

  private correctText(q: QuizQuestion): string {
    if (q.type === 'mcq' || q.type === 'tf') {
      return q.options?.[q.correctIndex ?? 0] ?? '';
    }
    if (q.type === 'term') {
      return q.modelText ?? '';
    }
    return (q.model ?? []).join('; ');
  }

  private lockAnswer(): void {
    this.answered = true;
    this.stopTimer();
    const q = this.currentQuestion;
    const given = q.type === 'term'
      ? this.userAnswer
      : (q.options?.[this.selectedOption ?? 0] ?? '');
    this.recordResult(this.isCorrect ? q.marks : 0, given);
    this.persistProgress(this.currentIndex + 1);
    if (this.answersEnabled) {
      this.revealAnswer();
    } else {
      this.feedback = 'Answer saved. 👍';
    }
  }

  nextQuestion(): void {
    this.stopTimer();

    // Short questions are marked by the learner when they press Next
    if (this.isShort && this.answered) {
      const marks = this.shortMarks;
      this.isCorrect = marks === this.currentQuestion.marks;
      this.recordResult(marks, this.userText.trim());
      this.persistProgress(this.currentIndex + 1);
    }

    if (this.isLast) {
      this.clearSavedProgress();
      this.saveAttempt();
      this.showResults = true;
      return;
    }
    this.currentIndex++;
    this.startQuestion();
  }

  // ---------- Saving answers and attempts ----------
  private topicMarks: Record<string, number> = {};
  private answerLog: { part: string; no: string; text: string; given: string; correct: string; marks: number; outOf: number; ok: boolean; explanation: string }[] = [];
  private attemptSaved = false;

  private topicOf(index: number): string {
    return this.questions[index]?.section ?? 'Questions';
  }

  /** Number of scored questions in each section */
  private get topicCounts(): Record<string, number> {
    const totals: Record<string, number> = {};
    this.questions.forEach(q => {
      if (q.type === 'info') { return; }
      totals[q.section] = (totals[q.section] ?? 0) + 1;
    });
    return totals;
  }

  /** One row per section with marks earned and marks available */
  get topicRows(): { name: string; earned: number; total: number }[] {
    const totals: Record<string, number> = {};
    this.questions.forEach(q => {
      if (q.type === 'info') { return; }
      totals[q.section] = (totals[q.section] ?? 0) + q.marks;
    });
    return Object.keys(totals).map(name => ({ name, earned: this.topicMarks[name] ?? 0, total: totals[name] }));
  }

  private recordResult(marks: number, given: string): void {
    const q = this.currentQuestion;
    const topic = this.topicOf(this.currentIndex);
    const ok = marks === q.marks;

    this.marksEarned += marks;
    this.topicMarks[topic] = (this.topicMarks[topic] ?? 0) + marks;
    this.answerLog.push({
      part: topic,
      no: q.no,
      text: q.text,
      given: given || '(no answer)',
      correct: this.correctText(q),
      marks,
      outOf: q.marks,
      ok,
      explanation: q.explanation ?? ''
    });

    if (this.auth.isLoggedIn()) {
      this.progress.record(this.topic === 'all' ? 'physics' : 'physics-' + this.topic, `q${this.currentIndex}`, topic, ok, this.scoredTotal, this.topicCounts);
    }
  }

  private saveAttempt(): void {
    if (this.attemptSaved || !this.auth.isLoggedIn()) {
      return;
    }
    this.attemptSaved = true;
    this.auth.saveAttempt({
      quiz: this.title,
      correct: this.marksEarned,
      total: this.marksTotal,
      details: JSON.stringify({ byPart: this.topicRows, answers: this.answerLog })
    }).subscribe({ error: () => { /* save failed: the quiz still works */ } });
  }

  // ---------- Option styling ----------
  optionClass(i: number): string {
    const correctIdx = this.currentQuestion.correctIndex;

    if (!this.answered) {
      return 'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50';
    }

    if (!this.revealed) {
      return i === this.selectedOption
        ? 'border-sky-500 bg-sky-50 text-slate-900'
        : 'border-slate-200 bg-white text-slate-400';
    }

    if (i === this.selectedOption) {
      return this.isCorrect
        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
        : 'border-red-500 bg-red-50 text-red-800';
    }
    if (i === correctIdx) {
      return 'border-emerald-400 bg-emerald-50 text-emerald-800';
    }
    return 'border-slate-200 bg-white text-slate-400';
  }

  // ---------- Timer ----------
  private startTimer(): void {
    this.timeLeft = this.timeTotal;
    this.timerId = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private timeUp(): void {
    this.stopTimer();
    this.timeLeft = 0;
    if (this.answered) {
      return;
    }
    this.isCorrect = false;
    this.selectedOption = null;
    this.answered = true;
    this.recordResult(0, 'No answer (time ran out)');
    this.feedback = "Time's up!";
    this.persistProgress(this.currentIndex + 1);
  }

  // ---------- Results actions ----------
  retry(): void {
    this.stopTimer();
    this.startFresh();
  }

  goSignUp(): void {
    this.stopTimer();
    this.signUp.emit();
  }

  close(): void {
    this.stopTimer();
    this.closed.emit();
  }
}
