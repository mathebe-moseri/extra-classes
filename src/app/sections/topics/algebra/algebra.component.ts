import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { QuizProgressService } from '../../../quiz-progress.service';

type QuestionType = 'info' | 'mcq' | 'calc';
/** 0 = applies to both grades (overview card) */
type Grade = 0 | 9 | 10;

interface QuizQuestion {
  type: QuestionType;
  /** Grade the question belongs to (CAPS) */
  grade: Grade;
  /** Topic name, shown above the question and used for "topics to revise" */
  topic: string;
  /** Question text, or the heading of a learn card (HTML allowed) */
  text: string;
  /** mcq: answer options */
  options?: string[];
  /** mcq: index of the correct option */
  correctIndex?: number;
  /** calc: the numeric answer. info: the definition / rules text shown in the card */
  answer?: number | string;
  /** calc: how far a typed answer may be from the correct one (default 0.011) */
  tolerance?: number;
  /** Optional picture */
  image?: string;
  /** Shown when the answer is revealed */
  explanation?: string;
}

type RawQuestion = Omit<QuizQuestion, 'grade' | 'topic'>;

// ---------- Small helpers so the question bank stays readable ----------
const info = (text: string, answer: string): RawQuestion => ({ type: 'info', text, answer });

const mcq = (text: string, options: string[], correctIndex: number, explanation: string): RawQuestion =>
  ({ type: 'mcq', text, options, correctIndex, explanation });

const calc = (text: string, answer: number, explanation: string, tolerance?: number): RawQuestion =>
  tolerance === undefined
    ? { type: 'calc', text, answer, explanation }
    : { type: 'calc', text, answer, explanation, tolerance };

/** Tags every question in a block with its grade and topic */
const section = (grade: Grade, topic: string, items: RawQuestion[]): QuizQuestion[] =>
  items.map(q => ({ ...q, grade, topic }));

@Component({
  selector: 'app-algebra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  templateUrl: './algebra.component.html',
  styleUrl: './algebra.component.css'
})
export class AlgebraComponent implements OnInit, OnDestroy {

  /** Admin switch: lets the learner use the "Check answer" link */
  @Input() answersEnabled = true;
  /** Percentage needed to pass */
  @Input() passMark = 70;
  /** Seconds allowed per scored question */
  @Input() timeTotal = 120;

  @Output() closed = new EventEmitter<void>();
  @Output() signUp = new EventEmitter<void>();

  title = 'Algebra: Grade 9 to Grade 10';

  // ---------- Questions ----------
  questions: QuizQuestion[] = [

    /* ===================================================== */
    /* OVERVIEW                                              */
    /* ===================================================== */
    ...section(0, 'Overview', [
      info('Algebra: Grade 9 to Grade 10 (CAPS)',
        'This quiz follows the CAPS Mathematics algebra content for Grades 9 and 10.\n\n' +
        '<strong>GRADE 9</strong>\n' +
        '1. Exponents: laws of exponents (integer exponents)\n' +
        '2. Algebraic expressions: add, subtract, multiply, divide, substitute\n' +
        '3. Factorisation: common factor, difference of squares, trinomials, grouping\n' +
        '4. Algebraic fractions (monomial denominators)\n' +
        '5. Linear equations and word problems\n' +
        '6. Linear functions and graphs: y = mx + c\n\n' +
        '<strong>GRADE 10</strong>\n' +
        '7. Exponents and surds: rational exponents, real numbers\n' +
        '8. Expanding and factorising: trinomials, sum and difference of cubes\n' +
        '9. Algebraic fractions (binomial denominators)\n' +
        '10. Equations: quadratic, fractions, exponential, literal\n' +
        '11. Linear inequalities and interval notation\n' +
        '12. Simultaneous equations\n' +
        '13. Functions: parabola, hyperbola, exponential\n\n')
    ]),

    /* ===================================================== */
    /* GRADE 9                                               */
    /* ===================================================== */

    /* ---------- 1. Exponents ---------- */
    ...section(9, 'Exponents', [
      info('Laws of exponents',
        'For any base a (a ≠ 0) and integers m and n:\n\n' +
        'a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup>\n' +
        'a<sup>m</sup> ÷ a<sup>n</sup> = a<sup>m−n</sup>\n' +
        '(a<sup>m</sup>)<sup>n</sup> = a<sup>mn</sup>\n' +
        '(ab)<sup>n</sup> = a<sup>n</sup>b<sup>n</sup>\n' +
        'a<sup>0</sup> = 1\n' +
        'a<sup>−n</sup> = 1/a<sup>n</sup>\n\n' +
        'Example: 2³ × 2⁴ = 2⁷ = 128\n\n' +
        'Tip: when you multiply the SAME base, ADD the exponents. Do not multiply the bases.'),
      mcq('Simplify x⁵ × x³', ['x⁸', 'x¹⁵', 'x²', '2x⁸'], 0,
        'Same base, so add the exponents: 5 + 3 = 8.'),
      mcq('Simplify (2x³)²', ['2x⁶', '4x⁶', '4x⁵', '2x⁵'], 1,
        'Square both the 2 and the x³: 2² = 4 and (x³)² = x⁶.'),
      mcq('What is 5⁰?', ['0', '5', '1', '50'], 2,
        'Any non-zero number to the power 0 equals 1.'),
      mcq('Simplify 6x⁷ ÷ 2x²', ['4x⁵', '3x⁵', '3x⁹', '3x³'], 1,
        '6 ÷ 2 = 3 and x⁷ ÷ x² = x⁷⁻² = x⁵.'),
      mcq('Simplify (3a²b)³', ['9a⁵b³', '27a⁶b³', '27a⁵b³', '9a⁶b³'], 1,
        '3³ = 27, (a²)³ = a⁶ and b³. So 27a⁶b³.'),
      calc('Evaluate 2⁵ × 2³ ÷ 2⁶', 4,
        '2⁵ × 2³ = 2⁸. Then 2⁸ ÷ 2⁶ = 2² = 4.'),
      calc('Solve for x: 3<sup>x</sup> = 81', 4,
        '81 = 3⁴, so x = 4.'),
      calc('Evaluate 2⁻³ as a decimal.', 0.125,
        '2⁻³ = 1/2³ = 1/8 = 0.125.', 0.001),
      calc('Evaluate (−2)³ + 3²', 1,
        '(−2)³ = −8 and 3² = 9. So −8 + 9 = 1.')
    ]),

    /* ---------- 2. Algebraic expressions ---------- */
    ...section(9, 'Algebraic expressions', [
      info('Working with algebraic expressions',
        'Like terms have the same letters with the same exponents. Only like terms can be added or subtracted.\n\n' +
        'Multiplying:\n' +
        '• Monomial × binomial: a(b + c) = ab + ac\n' +
        '• Binomial × binomial: (x + a)(x + b) = x² + (a + b)x + ab\n' +
        '• Square of a binomial: (x + a)² = x² + 2ax + a²\n\n' +
        'Dividing by a monomial: divide each term.\n' +
        'Substitution: replace the letter with the number, in brackets.\n\n' +
        'Example: (x + 3)(x + 5) = x² + 5x + 3x + 15 = x² + 8x + 15'),
      mcq('Which two terms are <strong>like terms</strong>?', ['3x and 3y', '4x² and 4x', '5ab and −2ab', '2x and 2x²'], 2,
        'Like terms have exactly the same letters and exponents: ab and ab.'),
      mcq('Simplify 3x + 2y − x + 5y', ['2x + 7y', '4x + 7y', '2x + 3y', '5xy'], 0,
        '3x − x = 2x and 2y + 5y = 7y.'),
      mcq('Expand 3(x − 4)', ['3x − 4', '3x − 12', '3x + 12', 'x − 12'], 1,
        'Multiply both terms by 3: 3x − 12.'),
      mcq('Expand (x + 3)(x + 5)', ['x² + 15', 'x² + 8x + 15', 'x² + 8x + 8', 'x² + 15x + 8'], 1,
        'x² + 5x + 3x + 15 = x² + 8x + 15.'),
      mcq('Expand (x − 2)(x + 7)', ['x² + 5x − 14', 'x² − 5x − 14', 'x² + 9x − 14', 'x² + 5x + 14'], 0,
        'x² + 7x − 2x − 14 = x² + 5x − 14.'),
      mcq('Expand (2x + 1)²', ['4x² + 1', '4x² + 2x + 1', '4x² + 4x + 1', '2x² + 4x + 1'], 2,
        '(2x + 1)(2x + 1) = 4x² + 2x + 2x + 1 = 4x² + 4x + 1.'),
      mcq('Simplify (12x³ − 8x²) ÷ 4x', ['3x² − 2x', '3x³ − 2x²', '3x² − 8x', '8x² − 4x'], 0,
        'Divide each term by 4x: 12x³ ÷ 4x = 3x² and 8x² ÷ 4x = 2x.'),
      calc('Evaluate 3x² − 2x + 1 when x = 2', 9,
        '3(4) − 2(2) + 1 = 12 − 4 + 1 = 9.'),
      calc('Evaluate 5a − 2b when a = 4 and b = −3', 26,
        '5(4) − 2(−3) = 20 + 6 = 26.'),
      calc('Evaluate (x + 3)(x − 1) when x = 5', 32,
        '(5 + 3)(5 − 1) = 8 × 4 = 32.'),
      calc('Simplify 2(x + 3) − 3(x − 2) and then find its value when x = 4', 8,
        '2x + 6 − 3x + 6 = −x + 12. When x = 4: −4 + 12 = 8.')
    ]),

    /* ---------- 3. Factorisation ---------- */
    ...section(9, 'Factorisation', [
      info('Factorisation',
        'Factorising is the opposite of expanding. Always check by expanding your answer.\n\n' +
        '1. Common factor: take out the highest common factor.\n' +
        '   6x + 9 = 3(2x + 3)\n\n' +
        '2. Difference of two squares:\n' +
        '   a² − b² = (a − b)(a + b)\n\n' +
        '3. Trinomials x² + bx + c: find two numbers that multiply to c and add to b.\n' +
        '   x² + 7x + 12: 3 × 4 = 12 and 3 + 4 = 7, so (x + 3)(x + 4)\n\n' +
        '4. Grouping in pairs (four terms):\n' +
        '   ax + ay + bx + by = a(x + y) + b(x + y) = (a + b)(x + y)'),
      mcq('Factorise 6x + 9', ['3(2x + 3)', '6(x + 9)', '3(2x + 9)', '2(3x + 9)'], 0,
        'The highest common factor of 6 and 9 is 3. 6x ÷ 3 = 2x and 9 ÷ 3 = 3.'),
      mcq('Factorise 4x² − 12x', ['x(4x − 3)', '4x(x − 12)', '4(x − 3)', '4x(x − 3)'], 3,
        'The highest common factor is 4x. 4x² ÷ 4x = x and 12x ÷ 4x = 3.'),
      mcq('Factorise x² − 49', ['(x − 7)²', '(x − 7)(x + 7)', '(x − 49)(x + 1)', '(x + 7)²'], 1,
        'Difference of two squares: x² − 7² = (x − 7)(x + 7).'),
      mcq('Factorise 9x² − 16', ['(3x − 4)(3x + 4)', '(9x − 16)(x + 1)', '(3x − 4)²', '(3x − 8)(3x + 2)'], 0,
        '9x² = (3x)² and 16 = 4². So (3x − 4)(3x + 4).'),
      mcq('Factorise x² + 7x + 12', ['(x + 2)(x + 6)', '(x + 3)(x + 4)', '(x + 1)(x + 12)', '(x − 3)(x − 4)'], 1,
        '3 × 4 = 12 and 3 + 4 = 7.'),
      mcq('Factorise x² − 2x − 15', ['(x + 5)(x − 3)', '(x − 15)(x + 1)', '(x − 5)(x + 3)', '(x − 5)(x − 3)'], 2,
        '−5 × 3 = −15 and −5 + 3 = −2.'),
      mcq('Factorise x² − 10x + 21', ['(x + 3)(x + 7)', '(x − 3)(x + 7)', '(x − 21)(x − 1)', '(x − 3)(x − 7)'], 3,
        '(−3) × (−7) = 21 and (−3) + (−7) = −10.'),
      mcq('Factorise by grouping: ax + ay + bx + by', ['(a + b)(x + y)', '(a + x)(b + y)', '(a − b)(x − y)', 'ab(x + y)'], 0,
        'a(x + y) + b(x + y) = (a + b)(x + y).'),
      calc('Use the difference of two squares to calculate 51² − 49²', 200,
        '(51 − 49)(51 + 49) = 2 × 100 = 200.'),
      calc('x² + 8x + 15 = (x + 3)(x + k). Find k.', 5,
        '3 × k = 15, so k = 5. Check: 3 + 5 = 8.'),
      calc('Factorise to calculate 75 × 13 + 75 × 7', 1500,
        '75(13 + 7) = 75 × 20 = 1 500.')
    ]),

    /* ---------- 4. Algebraic fractions (monomial) ---------- */
    ...section(9, 'Algebraic fractions', [
      info('Algebraic fractions with monomial denominators',
        'Factorise, then cancel common FACTORS. Never cancel terms that are added or subtracted.\n\n' +
        'Example: (6x + 9)/3 = 3(2x + 3)/3 = 2x + 3\n\n' +
        'To add or subtract, use a common denominator:\n' +
        'x/2 + x/3 = 3x/6 + 2x/6 = 5x/6'),
      mcq('Simplify 6x²/(3x)', ['2x²', '3x', '2x', '2'], 2,
        '6 ÷ 3 = 2 and x² ÷ x = x.'),
      mcq('Simplify (4x + 8)/4', ['x + 8', 'x + 4', '4x + 2', 'x + 2'], 3,
        'Divide each term by 4: x + 2. Or factorise 4(x + 2) and cancel the 4.'),
      mcq('Simplify 3x²y/(6xy)', ['2x', 'x/2', 'x/3', 'xy/2'], 1,
        '3/6 = 1/2, x²/x = x and y/y = 1. So x/2.'),
      mcq('Which statement is correct?',
        ['The 6s cancel, so (x + 6)/6 = x', '(x + 6)/6 = x/6 + 1', '(x + 6)/6 = x + 1', '(x + 6)/6 = x/6 + 6'], 1,
        'You can only cancel factors. Divide each term by 6: x/6 + 6/6 = x/6 + 1.'),
      calc('Simplify 10x²/(5x) and find its value when x = 6', 12,
        '10x²/(5x) = 2x. When x = 6: 2 × 6 = 12.'),
      calc('x/2 + x/3 = 5x/6. Find the value of 5x/6 when x = 12', 10,
        '5 × 12 ÷ 6 = 10.')
    ]),

    /* ---------- 5. Linear equations ---------- */
    ...section(9, 'Linear equations', [
      info('Solving linear equations',
        'Whatever you do to one side, do to the other side.\n\n' +
        '1. Remove brackets\n' +
        '2. Collect x-terms on one side and numbers on the other\n' +
        '3. Divide by the coefficient of x\n' +
        '4. Check by substituting\n\n' +
        'Example: 3x − 7 = 2x + 4\n' +
        '3x − 2x = 4 + 7, so x = 11\n\n' +
        'Fractions: multiply every term by the LCD.\n\n' +
        'Word problems: let x be the unknown, write an equation, solve it and answer the question.'),
      mcq('What is the best first step to solve 3x + 4 = 19?',
        ['Add 4 to both sides', 'Subtract 4 from both sides', 'Multiply both sides by 3', 'Divide 4 by 3'], 1,
        'Undo the + 4 by subtracting 4 from both sides: 3x = 15.'),
      calc('Solve for x: 2x + 5 = 17', 6,
        '2x = 12, so x = 6.'),
      calc('Solve for x: 3x − 7 = 2x + 4', 11,
        '3x − 2x = 4 + 7, so x = 11.'),
      calc('Solve for x: 4(x − 2) = 20', 7,
        'x − 2 = 5, so x = 7.'),
      calc('Solve for x: x/3 + 2 = 6', 12,
        'x/3 = 4, so x = 12.'),
      calc('Solve for x: 2(x + 3) = 3(x − 1)', 9,
        '2x + 6 = 3x − 3, so 9 = x.'),
      calc('Solve for x: 5 − 2x = −9', 7,
        '−2x = −14, so x = 7.'),
      calc('Thandi thinks of a number, doubles it and adds 7. The answer is 25. What is her number?', 9,
        '2n + 7 = 25, so 2n = 18 and n = 9.'),
      calc('The sum of three consecutive integers is 48. What is the smallest integer?', 15,
        'n + (n + 1) + (n + 2) = 48, so 3n + 3 = 48 and n = 15.'),
      calc('A rectangle is 3 cm longer than it is wide. Its perimeter is 38 cm. Find the width (in cm).', 8,
        '2(w + w + 3) = 38, so 4w + 6 = 38 and w = 8.'),
      calc('A cellphone plan costs R50 plus R2 per minute. The bill is R130. How many minutes were used?', 40,
        '50 + 2m = 130, so 2m = 80 and m = 40.')
    ]),

    /* ---------- 6. Linear functions and graphs ---------- */
    ...section(9, 'Linear functions and graphs', [
      info('Straight-line graphs',
        'A straight line has the equation y = mx + c.\n' +
        '• m is the gradient (steepness)\n' +
        '• c is the y-intercept (where the line cuts the y-axis)\n\n' +
        'Gradient = (y₂ − y₁)/(x₂ − x₁) = rise/run\n\n' +
        'x-intercept: put y = 0.\n' +
        'y-intercept: put x = 0.\n\n' +
        'Parallel lines have the same gradient.\n' +
        'Horizontal line: y = c.   Vertical line: x = a.\n\n' +
        'Example: y = 2x − 6\n' +
        'y-intercept: (0; −6)\n' +
        'x-intercept: 0 = 2x − 6, so x = 3, giving (3; 0)'),
      mcq('What is the gradient of y = 3x − 2?', ['3', '−2', '2', 'x'], 0,
        'In y = mx + c, the gradient is the number in front of x.'),
      mcq('What is the y-intercept of y = −x + 5?', ['−1', '−5', '1', '5'], 3,
        'c = 5, so the line cuts the y-axis at (0; 5).'),
      mcq('Which line is parallel to y = 2x + 3?', ['y = −2x + 3', 'y = 3x + 2', 'y = 2x − 5', 'y = x/2 + 3'], 2,
        'Parallel lines have the same gradient, m = 2.'),
      mcq('What is the equation of the horizontal line through (0; 4)?', ['x = 4', 'y = 4', 'y = 4x', 'x = y'], 1,
        'A horizontal line has the form y = c.'),
      calc('Find y when x = 4 for y = 2x + 1', 9,
        'y = 2(4) + 1 = 9.'),
      calc('For y = 3x − 5, find x when y = 10', 5,
        '10 = 3x − 5, so 3x = 15 and x = 5.'),
      calc('Find the gradient of the line through (1; 2) and (3; 8)', 3,
        'm = (8 − 2)/(3 − 1) = 6/2 = 3.'),
      calc('Find the x-intercept of y = 2x − 8', 4,
        '0 = 2x − 8, so x = 4.'),
      calc('Find the y-intercept of 4x + 2y = 12', 6,
        'Put x = 0: 2y = 12, so y = 6.'),
      calc('The line y = mx + 3 passes through (2; 11). Find m.', 4,
        '11 = 2m + 3, so 2m = 8 and m = 4.'),
      calc('A taxi charges R15 plus R6 per km: y = 6x + 15. What is the cost of a 9 km trip (in rand)?', 69,
        'y = 6(9) + 15 = 54 + 15 = 69.')
    ]),

    /* ===================================================== */
    /* GRADE 10                                              */
    /* ===================================================== */

    /* ---------- 7. Exponents and surds ---------- */
    ...section(10, 'Exponents and surds', [
      info('Rational exponents and real numbers',
        'Rational exponents link exponents and roots:\n' +
        'a<sup>1/n</sup> = ⁿ√a\n' +
        'a<sup>m/n</sup> = ⁿ√(a<sup>m</sup>) = (ⁿ√a)<sup>m</sup>\n\n' +
        'Example: 8<sup>2/3</sup> = (³√8)² = 2² = 4\n\n' +
        'Real numbers are rational (can be written as a fraction, e.g. 0.5 or √49) or irrational (cannot, e.g. √2 or π).\n\n' +
        'A surd lies between two integers. √30 is between √25 and √36, so between 5 and 6.\n\n' +
        'Surd law: √a × √b = √(ab)'),
      mcq('Simplify 4<sup>1/2</sup>', ['4', '2', '1/2', '16'], 1,
        '4<sup>1/2</sup> = √4 = 2.'),
      mcq('Simplify 27<sup>1/3</sup>', ['9', '81', '3', '1/9'], 2,
        '27<sup>1/3</sup> = ³√27 = 3.'),
      mcq('Between which two integers does √30 lie?', ['4 and 5', '5 and 6', '6 and 7', '29 and 31'], 1,
        '5² = 25 and 6² = 36. Since 25 &lt; 30 &lt; 36, √30 is between 5 and 6.'),
      mcq('√3 is...', ['rational', 'irrational', 'an integer', 'a whole number'], 1,
        '√3 cannot be written as a fraction, so it is irrational.'),
      mcq('Which of these is a <strong>rational</strong> number?', ['√2', 'π', '√10', '√49'], 3,
        '√49 = 7, which can be written as 7/1.'),
      calc('Evaluate 8<sup>2/3</sup>', 4,
        '³√8 = 2, then 2² = 4.'),
      calc('Evaluate 16<sup>3/4</sup>', 8,
        '⁴√16 = 2, then 2³ = 8.'),
      calc('Evaluate 9<sup>−1/2</sup> (round to 2 decimal places)', 0.33,
        '9<sup>−1/2</sup> = 1/√9 = 1/3 = 0.33.'),
      calc('Evaluate 2<sup>n+3</sup> ÷ 2<sup>n</sup>', 8,
        '2<sup>n+3−n</sup> = 2³ = 8.'),
      calc('Evaluate (2<sup>n+2</sup> − 2<sup>n</sup>) ÷ 2<sup>n</sup>', 3,
        'Take out 2<sup>n</sup>: 2<sup>n</sup>(4 − 1) ÷ 2<sup>n</sup> = 3.'),
      calc('Evaluate √12 × √3', 6,
        '√12 × √3 = √36 = 6.'),
      calc('Round √20 to 2 decimal places', 4.47,
        '√20 = 4.4721..., which rounds to 4.47.')
    ]),

    /* ---------- 8. Expanding and factorising ---------- */
    ...section(10, 'Expanding and factorising', [
      info('Expanding and factorising (Grade 10)',
        'Expanding: multiply every term in the first bracket by every term in the second.\n\n' +
        'Sum and difference of cubes:\n' +
        'a³ + b³ = (a + b)(a² − ab + b²)\n' +
        'a³ − b³ = (a − b)(a² + ab + b²)\n\n' +
        'Trinomials ax² + bx + c (a ≠ 1): find two numbers that multiply to a×c and add to b. Split the middle term, then group.\n' +
        'Example: 2x² + 7x + 3. a×c = 6, and 1 + 6 = 7.\n' +
        '2x² + x + 6x + 3 = x(2x + 1) + 3(2x + 1) = (2x + 1)(x + 3)\n\n' +
        'Always take out a COMMON FACTOR first, then see if you can factorise further.'),
      mcq('Expand (x + 2)(x² − 2x + 4)', ['x³ − 8', 'x³ + 4x² + 8', 'x³ + 8', 'x³ + 2x² + 8'], 2,
        'This is a sum of cubes: (x + 2)(x² − 2x + 4) = x³ + 2³ = x³ + 8.'),
      mcq('Expand (x − 1)(x² + 2x − 3)', ['x³ + x² − 5x + 3', 'x³ + x² − x + 3', 'x³ + 3x² − 5x − 3', 'x³ − x² − 5x + 3'], 0,
        'x³ + 2x² − 3x − x² − 2x + 3 = x³ + x² − 5x + 3.'),
      mcq('Factorise x³ − 27', ['(x − 3)(x² − 3x + 9)', '(x − 3)(x² + 3x + 9)', '(x − 3)³', '(x + 3)(x² − 3x + 9)'], 1,
        'Difference of cubes: a³ − b³ = (a − b)(a² + ab + b²) with a = x and b = 3.'),
      mcq('Factorise 8x³ + 1', ['(2x + 1)(4x² − 2x + 1)', '(2x + 1)(4x² + 2x + 1)', '(8x + 1)(x² − x + 1)', '(2x − 1)(4x² + 2x + 1)'], 0,
        'Sum of cubes with a = 2x and b = 1: (2x + 1)(4x² − 2x + 1).'),
      mcq('Factorise 2x² + 7x + 3', ['(2x + 3)(x + 1)', '(2x + 1)(x + 3)', '(2x − 1)(x − 3)', '(x + 7)(2x + 3)'], 1,
        'Check: (2x + 1)(x + 3) = 2x² + 6x + x + 3 = 2x² + 7x + 3.'),
      mcq('Factorise 6x² − x − 2', ['(3x + 2)(2x − 1)', '(6x − 1)(x + 2)', '(3x − 2)(2x + 1)', '(3x − 1)(2x + 2)'], 2,
        'Check: (3x − 2)(2x + 1) = 6x² + 3x − 4x − 2 = 6x² − x − 2.'),
      mcq('Factorise completely: 3x² − 27', ['3(x − 3)(x + 3)', '3(x − 3)²', '(3x − 9)(x + 3)', '3(x² − 9)'], 0,
        'Take out 3: 3(x² − 9). Then difference of squares: 3(x − 3)(x + 3).'),
      mcq('Factorise completely: 2x³ − 8x', ['2x(x² − 4)', '2(x³ − 4x)', '2x(x − 2)²', '2x(x − 2)(x + 2)'], 3,
        'Take out 2x: 2x(x² − 4), then factorise the difference of squares.'),
      calc('Evaluate (x − 2)(x² + 2x + 4) when x = 5', 117,
        '(x − 2)(x² + 2x + 4) = x³ − 8. So 125 − 8 = 117.'),
      calc('x² − 5x − 14 = (x − 7)(x + k). Find k.', 2,
        '(−7) × k = −14, so k = 2. Check: −7 + 2 = −5.'),
      calc('Evaluate (x + 1)(x² − x + 1) when x = 3', 28,
        'This equals x³ + 1. So 27 + 1 = 28.')
    ]),

    /* ---------- 9. Algebraic fractions (binomial) ---------- */
    ...section(10, 'Algebraic fractions', [
      info('Algebraic fractions with binomial denominators',
        'Factorise numerators and denominators first, then cancel common factors.\n\n' +
        'Example: (x² − 9)/(x − 3) = (x − 3)(x + 3)/(x − 3) = x + 3, where x ≠ 3\n\n' +
        'Multiply: factorise, cancel, then multiply tops and multiply bottoms.\n' +
        'Divide: multiply by the reciprocal.\n' +
        'Add or subtract: write each fraction with the lowest common denominator (LCD).\n\n' +
        'A denominator can never be 0, so state the restrictions.'),
      mcq('Simplify (x² − 9)/(x − 3)', ['x − 3', 'x + 3', 'x² − 3', '3'], 1,
        '(x − 3)(x + 3)/(x − 3) = x + 3.'),
      mcq('Simplify (x² + 5x + 6)/(x + 2)', ['x + 2', 'x + 6', 'x + 3', 'x² + 3'], 2,
        'x² + 5x + 6 = (x + 2)(x + 3). Cancel (x + 2).'),
      mcq('Simplify (x² − 4)/(x² + 2x)', ['(x + 2)/x', '(x − 2)/(x + 2)', '(x − 2)/x', 'x − 2'], 2,
        '(x − 2)(x + 2)/[x(x + 2)] = (x − 2)/x.'),
      mcq('Which value of x is NOT allowed in 5/(x − 4)?', ['x = 5', 'x = 4', 'x = −4', 'x = 0'], 1,
        'If x = 4 the denominator is 0, and you cannot divide by 0.'),
      mcq('Simplify 1/(x − 1) + 1/(x + 1)', ['2/(x² − 1)', '2x/(x² − 1)', 'x/(x² − 1)', '2/(2x)'], 1,
        'LCD = (x − 1)(x + 1). Numerator: (x + 1) + (x − 1) = 2x.'),
      calc('Evaluate (x² − 16)/(x − 4) when x = 10', 14,
        'The fraction simplifies to x + 4. So 10 + 4 = 14.'),
      calc('Evaluate (x² + x − 6)/(x − 2) when x = 7', 10,
        'x² + x − 6 = (x + 3)(x − 2), so the fraction is x + 3. So 7 + 3 = 10.'),
      calc('Evaluate 1/(x − 1) + 1/(x + 1) when x = 3', 0.75,
        '1/2 + 1/4 = 3/4 = 0.75.', 0.001),
      calc('Simplify [4x/(x + 1)] × [(x + 1)/2] and evaluate when x = 5', 10,
        'Cancel (x + 1) and 4/2 = 2. The answer is 2x = 10.')
    ]),

    /* ---------- 10. Equations ---------- */
    ...section(10, 'Equations', [
      info('Quadratic, fractional, exponential and literal equations',
        'Quadratic equations: write as ax² + bx + c = 0, factorise, then use the zero-product rule: if A × B = 0 then A = 0 or B = 0.\n' +
        'Example: x² − 5x + 6 = 0 → (x − 2)(x − 3) = 0 → x = 2 or x = 3\n\n' +
        'Fractions: multiply by the LCD and check that no answer makes a denominator 0.\n\n' +
        'Exponential equations: write both sides with the same base, then equate the exponents.\n' +
        'Example: 2<sup>x+1</sup> = 32 → 2<sup>x+1</sup> = 2⁵ → x + 1 = 5\n\n' +
        'Literal equations: change the subject of a formula using the same steps as for numbers.\n' +
        'Example: v = u + at → at = v − u → a = (v − u)/t'),
      calc('Solve x² − 5x + 6 = 0. Give the smaller solution.', 2,
        '(x − 2)(x − 3) = 0, so x = 2 or x = 3.'),
      calc('Solve x² + 2x − 15 = 0. Give the positive solution.', 3,
        '(x + 5)(x − 3) = 0, so x = −5 or x = 3.'),
      calc('Solve x² = 3x + 10. Give the positive solution.', 5,
        'x² − 3x − 10 = 0, so (x − 5)(x + 2) = 0 and x = 5 or x = −2.'),
      calc('Solve 2x² − x − 6 = 0. Give the positive solution.', 2,
        '(2x + 3)(x − 2) = 0, so x = −3/2 or x = 2.'),
      mcq('Solve x² = 4x', ['x = 4 only', 'x = 0 only', 'x = 0 or x = 4', 'x = 2'], 2,
        'x² − 4x = 0, so x(x − 4) = 0. Never divide by x, or you lose the solution x = 0.'),
      calc('Solve 3/(x − 1) = 6/(x + 1)', 3,
        '3(x + 1) = 6(x − 1), so 3x + 3 = 6x − 6 and x = 3.'),
      calc('Solve x/2 + x/3 = 10', 12,
        'Multiply by 6: 3x + 2x = 60, so x = 12.'),
      calc('Solve 2<sup>x+1</sup> = 32', 4,
        '32 = 2⁵, so x + 1 = 5 and x = 4.'),
      calc('Solve 3<sup>2x</sup> = 81', 2,
        '81 = 3⁴, so 2x = 4 and x = 2.'),
      calc('Solve 2<sup>x</sup> + 2<sup>x+1</sup> = 24', 3,
        '2<sup>x</sup> + 2 × 2<sup>x</sup> = 3 × 2<sup>x</sup> = 24, so 2<sup>x</sup> = 8 and x = 3.'),
      mcq('Make a the subject of v = u + at', ['a = (v + u)/t', 'a = (v − u)/t', 'a = t(v − u)', 'a = v − u − t'], 1,
        'v − u = at, so a = (v − u)/t.'),
      calc('P = 2(l + w). Find w when P = 30 and l = 11.', 4,
        '30 = 2(11 + w), so 15 = 11 + w and w = 4.')
    ]),

    /* ---------- 11. Inequalities ---------- */
    ...section(10, 'Inequalities', [
      info('Linear inequalities',
        'Solve an inequality like an equation, with ONE extra rule: when you multiply or divide by a NEGATIVE number, reverse the sign.\n' +
        'Example: −2x &lt; 6 → x &gt; −3\n\n' +
        'Interval notation:\n' +
        'x ≥ 2 is [2; ∞)   (square bracket: 2 is included)\n' +
        'x &lt; 5 is (−∞; 5)   (round bracket: 5 is not included)\n' +
        '−2 &lt; x ≤ 3 is (−2; 3]\n\n' +
        'On a number line a closed dot means included and an open dot means not included.'),
      mcq('Solve 2x + 3 &lt; 11', ['x &gt; 4', 'x &lt; 7', 'x &lt; 4', 'x &gt; 7'], 2,
        '2x &lt; 8, so x &lt; 4.'),
      mcq('Solve −3x ≥ 12', ['x ≥ −4', 'x ≤ −4', 'x ≥ 4', 'x ≤ 4'], 1,
        'Divide by −3 and reverse the sign: x ≤ −4.'),
      mcq('Solve 5 − 2x &gt; 1', ['x &gt; 2', 'x &lt; −2', 'x &gt; −2', 'x &lt; 2'], 3,
        '−2x &gt; −4. Divide by −2 and reverse the sign: x &lt; 2.'),
      mcq('Write x ≥ 2 in interval notation', ['(2; ∞)', '[2; ∞)', '(−∞; 2]', '(−∞; 2)'], 1,
        '2 is included, so use a square bracket: [2; ∞).'),
      mcq('Solve −3 &lt; 2x + 1 ≤ 7', ['−4 &lt; x ≤ 6', '−2 &lt; x ≤ 3', '−2 ≤ x &lt; 3', '−1 &lt; x ≤ 3'], 1,
        'Subtract 1: −4 &lt; 2x ≤ 6. Divide by 2: −2 &lt; x ≤ 3.'),
      calc('What is the largest integer that satisfies 3x − 4 &lt; 14?', 5,
        '3x &lt; 18, so x &lt; 6. The largest integer below 6 is 5.'),
      calc('What is the smallest integer that satisfies 2x + 1 ≥ 9?', 4,
        '2x ≥ 8, so x ≥ 4. The smallest integer is 4.'),
      calc('What is the smallest integer that satisfies 4 − x &lt; −2?', 7,
        '−x &lt; −6, so x &gt; 6. The smallest integer above 6 is 7.'),
      calc('How many positive integers satisfy 2x − 1 ≤ 9?', 5,
        '2x ≤ 10, so x ≤ 5. The positive integers are 1, 2, 3, 4 and 5.')
    ]),

    /* ---------- 12. Simultaneous equations ---------- */
    ...section(10, 'Simultaneous equations', [
      info('Simultaneous linear equations',
        'Two unknowns need two equations.\n\n' +
        '<strong>Substitution:</strong> make one letter the subject, then substitute it into the other equation.\n' +
        '<strong>Elimination:</strong> add or subtract the equations to remove one letter (multiply first if needed).\n' +
        '<strong>Graphically:</strong> the solution is the point where the two lines cross.\n\n' +
        'Example: x + y = 10 and x − y = 4\n' +
        'Add the equations: 2x = 14, so x = 7. Then y = 3.\n\n' +
        'Always check your answer in BOTH equations.'),
      calc('Solve x + y = 12 and x − y = 2. Find x.', 7,
        'Add: 2x = 14, so x = 7 (and y = 5).'),
      calc('Solve y = 2x and x + y = 12. Find x.', 4,
        'Substitute: x + 2x = 12, so 3x = 12 and x = 4.'),
      calc('Solve 2x + y = 11 and x − y = 1. Find y.', 3,
        'Add: 3x = 12, so x = 4. Then y = 11 − 8 = 3.'),
      calc('Solve 3x + 2y = 16 and x + y = 6. Find y.', 2,
        'From the second equation y = 6 − x. Then 3x + 12 − 2x = 16, so x = 4 and y = 2.'),
      calc('Two pens and one ruler cost R19. One pen and two rulers cost R17. How much is one pen (in rand)?', 7,
        '2p + r = 19 and p + 2r = 17. From the first, r = 19 − 2p. Then p + 38 − 4p = 17, so p = 7.'),
      calc('A father is 3 times as old as his son. The sum of their ages is 48. How old is the father?', 36,
        'f = 3s and f + s = 48, so 4s = 48 and s = 12. Father = 36.'),
      mcq('The lines y = x + 1 and y = −x + 5 intersect at...', ['(3; 2)', '(1; 2)', '(2; 3)', '(4; 1)'], 2,
        'x + 1 = −x + 5, so 2x = 4 and x = 2. Then y = 3.'),
      mcq('When solving simultaneous equations graphically, the solution is...',
        ['the y-intercept of one line', 'the point where the two graphs intersect', 'the gradient of the lines', 'the x-intercepts of both lines'], 1,
        'The intersection point satisfies both equations at the same time.')
    ]),

    /* ---------- 13. Functions ---------- */
    ...section(10, 'Functions and graphs', [
      info('Parabola, hyperbola and exponential graphs',
        '<strong>Parabola y = ax² + q</strong>\n' +
        '• Turning point (0; q), axis of symmetry x = 0\n' +
        '• a &gt; 0: smile shape with a minimum value of q\n' +
        '• a &lt; 0: frown shape with a maximum value of q\n' +
        '• q moves the graph up or down\n\n' +
        '<strong>Hyperbola y = a/x + q</strong>\n' +
        '• Asymptotes: x = 0 and y = q\n' +
        '• Domain: x ≠ 0.  Range: y ≠ q\n\n' +
        '<strong>Exponential y = a·b<sup>x</sup> + q</strong> (b &gt; 0, b ≠ 1)\n' +
        '• Horizontal asymptote: y = q\n\n' +
        'x-intercept: put y = 0.   y-intercept: put x = 0.'),
      mcq('What is the turning point of y = x² − 4?', ['(0; 4)', '(0; −4)', '(−4; 0)', '(4; 0)'], 1,
        'For y = ax² + q the turning point is (0; q) = (0; −4).'),
      mcq('The graph of y = −2x² + 3 has...',
        ['a minimum value of 3', 'a maximum value of 3', 'a minimum value of −2', 'a maximum value of −2'], 1,
        'a &lt; 0 gives a frown shape, so the turning point (0; 3) is a maximum.'),
      mcq('In y = ax² + q, changing q...',
        ['stretches the graph', 'moves the graph left or right', 'moves the graph up or down', 'reflects the graph in the x-axis'], 2,
        'q is the vertical shift of the graph.'),
      calc('Find the positive x-intercept of y = x² − 9', 3,
        '0 = x² − 9, so x = ±3. The positive one is 3.'),
      calc('Find the y-intercept of y = 2x² − 5', -5,
        'Put x = 0: y = −5.'),
      calc('Find y when x = −3 for y = x² + 1', 10,
        'y = (−3)² + 1 = 9 + 1 = 10.'),
      mcq('What are the asymptotes of y = 2/x + 3?',
        ['x = 3 and y = 0', 'x = 0 and y = 3', 'x = 0 and y = 2', 'y = 2 and x = 3'], 1,
        'For y = a/x + q the asymptotes are x = 0 and y = q.'),
      mcq('What is the domain of y = 4/x?', ['all real numbers', 'x ≠ 0', 'y ≠ 0', 'x &gt; 0'], 1,
        'You cannot divide by 0, so x ≠ 0.'),
      calc('For y = 6/x, find y when x = −2', -3,
        'y = 6 ÷ (−2) = −3.'),
      mcq('What is the horizontal asymptote of y = 2<sup>x</sup> + 1?', ['y = 0', 'y = 1', 'y = 2', 'x = 1'], 1,
        'For y = a·b<sup>x</sup> + q, the asymptote is y = q = 1.'),
      calc('For y = 2<sup>x</sup>, find y when x = 5', 32,
        '2⁵ = 32.'),
      calc('Find the y-intercept of y = 3 · 2<sup>x</sup> − 1', 2,
        'Put x = 0: y = 3(1) − 1 = 2.'),
      calc('For y = 2<sup>x</sup> + 1, find y when x = −1', 1.5,
        '2<sup>−1</sup> = 0.5, so y = 0.5 + 1 = 1.5.', 0.001)
    ])
  ];

  // ---------- State ----------
  currentIndex = 0;
  showResults = false;

  answered = false;
  revealed = false;
  isCorrect = false;
  selectedOption: number | null = null;
  userAnswer: number | null = null;
  feedback = '';

  timeLeft = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  totalCorrect = 0;
  totalWrong = 0;

  /** Correct answers per grade */
  gradeCorrect: Record<number, number> = { 9: 0, 10: 0 };
  /** Topics the learner got wrong at least once (for the revise list) */
  wrongTopics: string[] = [];

  /** Correct answers per topic block, e.g. "Grade 9: Exponents" */
  private topicCorrect: Record<string, number> = {};
  /** Every answer given, saved with the attempt so the dashboard can show it */
  private answerLog: { part: string; text: string; given: string; correct: string; ok: boolean; explanation: string }[] = [];
  private attemptSaved = false;

  constructor(private auth: AuthService, private progress: QuizProgressService) { }

  // ---------- Saved progress (resume) ----------
  private readonly PROGRESS_KEY = 'algebra-quiz-progress-v1';
  showResumePrompt = false;
  savedProgress: {
    index: number;
    totalCorrect: number;
    totalWrong: number;
    gradeCorrect: Record<number, number>;
    wrongTopics: string[];
    topicCorrect: Record<string, number>;
    answerLog: any[];
  } | null = null;

  get savedQuestionNumber(): number {
    const i = Math.min(this.savedProgress?.index ?? 0, this.questions.length - 1);
    const n = this.questions.slice(0, i + 1).filter(q => q.type !== 'info').length;
    return Math.max(n, 1);
  }

  get savedTopicName(): string {
    const i = Math.min(this.savedProgress?.index ?? 0, this.questions.length - 1);
    const q = this.questions[i];
    return q ? (q.grade === 0 ? q.topic : `Grade ${q.grade}: ${q.topic}`) : '';
  }

  /** Remember where the learner is. Index 0 means "nothing to resume". */
  private persistProgress(index: number): void {
    if (index <= 0) { this.clearSavedProgress(); return; }
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify({
        index,
        totalCorrect: this.totalCorrect,
        totalWrong: this.totalWrong,
        gradeCorrect: this.gradeCorrect,
        wrongTopics: this.wrongTopics,
        topicCorrect: this.topicCorrect,
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
        Number.isFinite(p.totalCorrect) && Number.isFinite(p.totalWrong) &&
        p.gradeCorrect && typeof p.gradeCorrect === 'object' &&
        Array.isArray(p.wrongTopics) &&
        p.topicCorrect && typeof p.topicCorrect === 'object' &&
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
    this.totalCorrect = s.totalCorrect;
    this.totalWrong = s.totalWrong;
    this.gradeCorrect = { 9: 0, 10: 0, ...s.gradeCorrect };
    this.wrongTopics = [...s.wrongTopics];
    this.topicCorrect = { ...s.topicCorrect };
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
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.gradeCorrect = { 9: 0, 10: 0 };
    this.wrongTopics = [];
    this.topicCorrect = {};
    this.answerLog = [];
    this.attemptSaved = false;
    this.showResults = false;
    this.startQuestion();
  }

  closeResumePrompt(): void {
    this.showResumePrompt = false;   // progress stays saved
    this.close();
  }

  // ---------- Lifecycle ----------
  ngOnInit(): void {
    const saved = this.readSavedProgress();
    if (saved) {
      this.savedProgress = saved;
      this.showResumePrompt = true;   // ask: resume / start over / close
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

  get isInfo(): boolean {
    return this.currentQuestion.type === 'info';
  }

  get isMcq(): boolean {
    return this.currentQuestion.type === 'mcq';
  }

  /** Number of questions that count towards the score (learn cards excluded) */
  get scoredTotal(): number {
    return this.questions.filter(q => q.type !== 'info').length;
  }

  /** Scored questions completed or in progress up to the current card */
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
    return this.scoredTotal ? Math.round((this.totalCorrect / this.scoredTotal) * 100) : 0;
  }

  get passed(): boolean {
    return this.scorePercent >= this.passMark;
  }

  /** Total correct answers required to reach the pass mark */
  get marksNeeded(): number {
    return Math.ceil((this.passMark / 100) * this.scoredTotal);
  }

  /** Label for the grade badge on the current card */
  get gradeLabel(): string {
    const g = this.currentQuestion.grade;
    return g === 0 ? 'Grades 9 – 10' : `Grade ${g}`;
  }

  /** Colour of the grade badge on the current card */
  get gradeBadgeClass(): string {
    switch (this.currentQuestion.grade) {
      case 9: return 'bg-amber-100 text-amber-700';
      case 10: return 'bg-violet-100 text-violet-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  /** Scored questions in a grade */
  gradeTotal(grade: number): number {
    return this.questions.filter(q => q.type !== 'info' && q.grade === grade).length;
  }

  gradePercent(grade: number): number {
    const total = this.gradeTotal(grade);
    return total ? Math.round((this.gradeCorrect[grade] / total) * 100) : 0;
  }

  // ---------- Question flow ----------
  private startQuestion(): void {
    this.answered = false;
    this.revealed = false;
    this.isCorrect = false;
    this.selectedOption = null;
    this.userAnswer = null;
    this.feedback = '';
    this.stopTimer();
    this.persistProgress(this.currentIndex);

    if (!this.isInfo) {
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

  checkAnswer(): void {
    if (this.answered || this.userAnswer === null || this.userAnswer === undefined) {
      return;
    }
    const expected = Number(this.currentQuestion.answer);
    const tolerance = this.currentQuestion.tolerance ?? 0.011;
    this.isCorrect = Math.abs(Number(this.userAnswer) - expected) <= tolerance;
    this.lockAnswer();
  }

  /** Reveal whether the locked-in answer was right (admin-enabled) */
  revealAnswer(): void {
    if (!this.answered || this.revealed || !this.answersEnabled) {
      return;
    }
    this.revealed = true;

    const explanation = this.currentQuestion.explanation ?? '';
    if (this.isCorrect) {
      this.feedback = `Correct! ${explanation}`;
    } else if (this.isMcq) {
      const right = this.currentQuestion.options?.[this.currentQuestion.correctIndex ?? 0];
      this.feedback = `Not quite. The correct answer is <strong>${right}</strong>. ${explanation}`;
    } else {
      this.feedback = `Not quite. The correct answer is <strong>${this.currentQuestion.answer}</strong>. ${explanation}`;
    }
  }

  /** Records the result of the current question in the totals */
  private record(correct: boolean, given: string): void {
    const q = this.currentQuestion;
    const label = `Grade ${q.grade}: ${q.topic}`;
    if (correct) {
      this.totalCorrect++;
      this.gradeCorrect[q.grade] = (this.gradeCorrect[q.grade] ?? 0) + 1;
      this.topicCorrect[label] = (this.topicCorrect[label] ?? 0) + 1;
    } else {
      this.totalWrong++;
      if (!this.wrongTopics.includes(label)) {
        this.wrongTopics.push(label);
      }
    }
    this.answerLog.push({
      part: label,
      text: q.text,
      given,
      correct: q.type === 'mcq' ? (q.options?.[q.correctIndex ?? 0] ?? '') : String(q.answer),
      ok: correct,
      explanation: q.explanation ?? ''
    });

    // Remember this question for the dashboard, even if the quiz is never finished
    if (this.auth.isLoggedIn()) {
      this.progress.record('algebra', `q${this.currentIndex}`, label, correct, this.scoredTotal, this.topicTotals);
    }
  }

  /** Number of scored questions in each topic block */
  private get topicTotals(): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const q of this.questions) {
      if (q.type === 'info') {
        continue;
      }
      const name = `Grade ${q.grade}: ${q.topic}`;
      totals[name] = (totals[name] ?? 0) + 1;
    }
    return totals;
  }

  private lockAnswer(): void {
    this.answered = true;
    this.stopTimer();
    const given = this.isMcq
      ? (this.currentQuestion.options?.[this.selectedOption ?? 0] ?? '')
      : String(this.userAnswer);
    this.record(this.isCorrect, given);
    this.feedback = 'Answer saved.';
  }

  nextQuestion(): void {
    this.stopTimer();

    if (this.isLast) {
      this.clearSavedProgress();
      this.saveAttempt();
      this.showResults = true;
      return;
    }
    this.currentIndex++;
    this.startQuestion();
  }

  // ---------- Saving the attempt (logged-in learners only) ----------
  /** One row per topic block, e.g. "Grade 9: Exponents", with correct and total */
  private get byTopic(): { name: string; correct: number; total: number }[] {
    const rows: { name: string; correct: number; total: number }[] = [];
    for (const q of this.questions) {
      if (q.type === 'info') {
        continue;
      }
      const name = `Grade ${q.grade}: ${q.topic}`;
      let row = rows.find(r => r.name === name);
      if (!row) {
        row = { name, correct: this.topicCorrect[name] ?? 0, total: 0 };
        rows.push(row);
      }
      row.total++;
    }
    return rows;
  }

  private saveAttempt(): void {
    if (this.attemptSaved || !this.auth.isLoggedIn()) {
      return;
    }
    this.attemptSaved = true;
    this.auth.saveAttempt({
      quiz: 'Algebra: Grade 9 to Grade 10',
      correct: this.totalCorrect,
      total: this.scoredTotal,
      details: JSON.stringify({ byPart: this.byTopic, answers: this.answerLog })
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
    this.record(false, 'No answer (time ran out)');
    this.persistProgress(this.currentIndex + 1);
    this.feedback = "Time's up!";
  }

  // ---------- Results actions ----------
  retry(): void {
    this.stopTimer();
    this.currentIndex = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.gradeCorrect = { 9: 0, 10: 0 };
    this.wrongTopics = [];
    this.topicCorrect = {};
    this.answerLog = [];
    this.attemptSaved = false;
    this.showResults = false;
    this.startQuestion();
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
