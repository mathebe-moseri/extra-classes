import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

type QuestionType = 'info' | 'mcq' | 'calc';

interface QuizQuestion {
  type: QuestionType;
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

@Component({
  selector: 'app-measurement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './measurement.component.html',
  styleUrl: './measurement.component.css'
})
export class MeasurementComponent implements OnInit, OnDestroy {

  /** Admin switch: lets the learner use the "Check answer" link */
  @Input() answersEnabled = true;
  /** Percentage needed to pass */
  @Input() passMark = 70;
  /** Seconds allowed per scored question */
  @Input() timeTotal = 120;

  @Output() closed = new EventEmitter<void>();
  @Output() signUp = new EventEmitter<void>();

  title = 'Measurement: surface area and volume';

  // ---------- Questions ----------
  questions: QuizQuestion[] = [

    /* ===================================================== */
    /* 1. UNITS AND CONVERSIONS                              */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Surface area, volume and units',
      answer:
        '<strong>Surface area</strong> is the total area of all the outside faces of a solid. It is measured in square units (cm², m²).\n' +
        '<strong>Volume</strong> is the space inside a solid. It is measured in cubic units (cm³, m³).\n\n' +
        'Useful conversions:\n' +
        '1 m = 100 cm\n' +
        '1 m² = 10 000 cm²\n' +
        '1 m³ = 1 000 000 cm³\n' +
        '1 ℓ = 1 000 mℓ = 1 000 cm³\n' +
        '1 m³ = 1 000 ℓ\n\n' +
        'Example: A tank holds 3 m³. How many litres is that?\n' +
        '3 × 1 000 = 3 000 ℓ'
    },
    {
      type: 'mcq',
      text: 'Which unit is used to measure <strong>volume</strong>?',
      options: ['cm', 'cm²', 'cm³', 'kg'],
      correctIndex: 2,
      explanation: 'Volume is measured in cubic units, such as cm³ or m³.'
    },
    {
      type: 'mcq',
      text: 'Which unit is used to measure <strong>surface area</strong>?',
      options: ['m²', 'm', 'ℓ', 'm³'],
      correctIndex: 0,
      explanation: 'Surface area is measured in square units, such as cm² or m².'
    },
    {
      type: 'mcq',
      text: '1 litre is the same as...',
      options: ['100 cm³', '10 cm³', '1 000 cm³', '10 000 cm³'],
      correctIndex: 2,
      explanation: '1 ℓ = 1 000 mℓ = 1 000 cm³.'
    },
    {
      type: 'calc',
      text: 'Convert 2.5 m³ to litres.',
      answer: 2500,
      explanation: '1 m³ = 1 000 ℓ, so 2.5 × 1 000 = 2 500 ℓ.'
    },
    {
      type: 'calc',
      text: 'Convert 3 500 cm³ to litres.',
      answer: 3.5,
      explanation: '1 ℓ = 1 000 cm³, so 3 500 ÷ 1 000 = 3.5 ℓ.'
    },
    {
      type: 'calc',
      text: 'Convert 4 m² to cm².',
      answer: 40000,
      explanation: '1 m² = 10 000 cm², so 4 × 10 000 = 40 000 cm².'
    },
    {
      type: 'calc',
      text: 'A water tank holds 25 000 ℓ. How many m³ is that?',
      answer: 25,
      explanation: '1 m³ = 1 000 ℓ, so 25 000 ÷ 1 000 = 25 m³.'
    },

    /* ===================================================== */
    /* 2. RECTANGULAR PRISMS AND CUBES                       */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Rectangular prisms and cubes',
      answer:
        'A rectangular prism (box) has length l, breadth b and height h.\n\n' +
        'Volume = l × b × h\n' +
        'Surface area = 2(lb + lh + bh)\n\n' +
        'A cube has all sides equal (side s):\n' +
        'Volume = s³\n' +
        'Surface area = 6s²\n\n' +
        'Example: A box is 8 cm long, 5 cm wide and 3 cm high.\n' +
        'V = 8 × 5 × 3 = 120 cm³\n' +
        'SA = 2(8×5 + 8×3 + 5×3) = 2(40 + 24 + 15) = 158 cm²'
    },
    {
      type: 'mcq',
      text: 'Which formula gives the <strong>surface area</strong> of a rectangular prism?',
      options: ['l × b × h', '2(lb + lh + bh)', 'l + b + h', '6s²'],
      correctIndex: 1,
      explanation: 'A box has 6 faces in 3 matching pairs: lb, lh and bh. So SA = 2(lb + lh + bh).'
    },
    {
      type: 'calc',
      text: 'Find the volume of a box that is 9 cm long, 4 cm wide and 5 cm high. (in cm³)',
      answer: 180,
      explanation: 'V = l × b × h = 9 × 4 × 5 = 180 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the surface area of a box that is 8 cm long, 5 cm wide and 3 cm high. (in cm²)',
      answer: 158,
      explanation: 'SA = 2(8×5 + 8×3 + 5×3) = 2(40 + 24 + 15) = 2(79) = 158 cm².'
    },
    {
      type: 'calc',
      text: 'Find the volume of a cube with sides of 5 cm. (in cm³)',
      answer: 125,
      explanation: 'V = s³ = 5 × 5 × 5 = 125 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the surface area of a cube with sides of 5 cm. (in cm²)',
      answer: 150,
      explanation: 'SA = 6s² = 6 × 25 = 150 cm².'
    },
    {
      type: 'calc',
      text: 'A cube has a volume of 343 cm³. How long is one side? (in cm)',
      answer: 7,
      explanation: 's³ = 343, so s = ∛343 = 7 cm.'
    },
    {
      type: 'calc',
      text: 'A box has a volume of 240 cm³. It is 10 cm long and 6 cm wide. How high is it? (in cm)',
      answer: 4,
      explanation: '240 = 10 × 6 × h, so 240 = 60h and h = 4 cm.'
    },
    {
      type: 'calc',
      text: 'A fish tank is 60 cm long, 30 cm wide and 40 cm high. How many litres of water can it hold when it is full?',
      answer: 72,
      explanation: 'V = 60 × 30 × 40 = 72 000 cm³. 72 000 ÷ 1 000 = 72 ℓ.'
    },
    {
      type: 'calc',
      text: 'A swimming pool is 10 m long, 5 m wide and 1.5 m deep. How many litres of water does it hold when it is full?',
      answer: 75000,
      explanation: 'V = 10 × 5 × 1.5 = 75 m³. 75 × 1 000 = 75 000 ℓ.'
    },
    {
      type: 'calc',
      text: 'An open box (no lid) is 10 cm long, 4 cm wide and 3 cm high. Find the surface area of the outside. (in cm²)',
      answer: 124,
      explanation: 'With a lid: 2(40 + 30 + 12) = 164 cm². Take away the lid (10 × 4 = 40): 164 − 40 = 124 cm².'
    },
    {
      type: 'calc',
      text: '90 ℓ of water is poured into an empty tank with a base of 50 cm by 30 cm. How deep is the water? (in cm)',
      answer: 60,
      explanation: '90 ℓ = 90 000 cm³. Base area = 50 × 30 = 1 500 cm². Depth = 90 000 ÷ 1 500 = 60 cm.'
    },

    /* ===================================================== */
    /* 3. TRIANGULAR PRISMS                                  */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Right triangular prisms',
      answer:
        'A triangular prism has two identical triangles at the ends, joined by 3 rectangles.\n\n' +
        'Volume = area of triangle × length of prism\n' +
        'V = (½ × b × h) × H\n\n' +
        'Surface area = 2 × (area of triangle) + (perimeter of triangle) × H\n\n' +
        'Example: A triangle with sides 3 cm, 4 cm and 5 cm (right-angled at the 3 and 4). The prism is 10 cm long.\n' +
        'V = (½ × 3 × 4) × 10 = 6 × 10 = 60 cm³\n' +
        'SA = 2(6) + (3 + 4 + 5) × 10 = 12 + 120 = 132 cm²\n\n' +
        'If a side is missing, use Pythagoras: c² = a² + b².'
    },
    {
      type: 'mcq',
      text: 'The volume of a triangular prism is found by multiplying...',
      options: [
        'the area of the triangle by the length of the prism',
        'the perimeter of the triangle by the length of the prism',
        'the three sides of the triangle',
        'the base of the triangle by the height of the triangle only'
      ],
      correctIndex: 0,
      explanation: 'V = (area of the triangular end) × (length of the prism).'
    },
    {
      type: 'calc',
      text: 'A triangular prism has a triangle with base 6 cm and height 8 cm. The prism is 15 cm long. Find its volume. (in cm³)',
      answer: 360,
      explanation: 'Area of triangle = ½ × 6 × 8 = 24 cm². V = 24 × 15 = 360 cm³.'
    },
    {
      type: 'calc',
      text: 'The triangular end of a prism has an area of 15 cm². The volume is 150 cm³. How long is the prism? (in cm)',
      answer: 10,
      explanation: '150 = 15 × H, so H = 10 cm.'
    },
    {
      type: 'calc',
      text: 'A tent is a triangular prism. The triangle has a base of 2 m and a height of 1.5 m. The tent is 3 m long. What is its volume? (in m³)',
      answer: 4.5,
      explanation: 'Area of triangle = ½ × 2 × 1.5 = 1.5 m². V = 1.5 × 3 = 4.5 m³.'
    },
    {
      type: 'calc',
      text: 'The triangle at the end of a prism has sides 5 cm, 12 cm and 13 cm (right-angled between 5 and 12). The prism is 8 cm long. Find the volume. (in cm³)',
      answer: 240,
      explanation: 'Area of triangle = ½ × 5 × 12 = 30 cm². V = 30 × 8 = 240 cm³.'
    },
    {
      type: 'calc',
      text: 'Using the same prism (triangle sides 5, 12 and 13, prism length 8 cm), find the total surface area. (in cm²)',
      answer: 300,
      explanation: 'SA = 2(30) + (5 + 12 + 13) × 8 = 60 + 30 × 8 = 60 + 240 = 300 cm².'
    },
    {
      type: 'calc',
      text: 'A right-angled triangle has short sides of 6 cm and 8 cm. How long is the longest side? (in cm)',
      answer: 10,
      explanation: 'c² = 6² + 8² = 36 + 64 = 100, so c = 10 cm.'
    },
    {
      type: 'calc',
      text: 'Find the total surface area of a triangular prism with a right-angled triangle (sides 3, 4 and 5 cm) and a length of 10 cm. (in cm²)',
      answer: 132,
      explanation: 'SA = 2(½ × 3 × 4) + (3 + 4 + 5) × 10 = 12 + 120 = 132 cm².'
    },

    /* ===================================================== */
    /* 4. CYLINDERS                                          */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Cylinders',
      answer:
        'A cylinder has a circular base with radius r and a height h.\n\n' +
        'Volume = πr²h\n' +
        'Curved surface = 2πrh\n' +
        'Total surface area = 2πr² + 2πrh = 2πr(r + h)\n\n' +
        'Example: r = 7 cm and h = 10 cm\n' +
        'V = π × 7² × 10 = π × 490 = 1 539.38 cm³\n\n' +
        'Tips:\n' +
        '• The radius is half of the diameter.\n' +
        '• Use the π button on your calculator and only round at the very end.'
    },
    {
      type: 'mcq',
      text: 'Which formula gives the <strong>volume</strong> of a cylinder?',
      options: ['2πr(r + h)', 'πr²h', '⅓πr²h', 'πr²'],
      correctIndex: 1,
      explanation: 'Volume of a cylinder = area of the circle × height = πr²h.'
    },
    {
      type: 'mcq',
      text: 'A cylinder has a diameter of 10 cm. What is its radius?',
      options: ['20 cm', '10 cm', '5 cm', '2.5 cm'],
      correctIndex: 2,
      explanation: 'The radius is half of the diameter: 10 ÷ 2 = 5 cm.'
    },
    {
      type: 'calc',
      text: 'Find the volume of a cylinder with radius 7 cm and height 10 cm. (in cm³, round to 2 decimal places)',
      answer: 1539.38,
      explanation: 'V = πr²h = π × 7² × 10 = π × 490 = 1 539.38 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the volume of a cylinder with diameter 10 cm and height 20 cm. (in cm³, round to 2 decimal places)',
      answer: 1570.8,
      explanation: 'r = 5 cm. V = π × 5² × 20 = π × 500 = 1 570.80 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the total surface area of a closed cylinder with radius 5 cm and height 12 cm. (in cm², round to 2 decimal places)',
      answer: 534.07,
      explanation: 'SA = 2πr(r + h) = 2π × 5 × 17 = 170π = 534.07 cm².'
    },
    {
      type: 'calc',
      text: 'The label on a tin of beans wraps once around the curved side. The tin has radius 4 cm and height 10 cm. Find the area of the label. (in cm², round to 2 decimal places)',
      answer: 251.33,
      explanation: 'Curved surface = 2πrh = 2π × 4 × 10 = 80π = 251.33 cm².'
    },
    {
      type: 'calc',
      text: 'An open cylinder (no lid) has radius 3 cm and height 8 cm. Find its outside surface area. (in cm², round to 2 decimal places)',
      answer: 179.07,
      explanation: 'SA = πr² + 2πrh = π(9) + 2π(3)(8) = 9π + 48π = 57π = 179.07 cm².'
    },
    {
      type: 'calc',
      text: 'A cylinder has a radius of 5 cm and a volume of 392.7 cm³. Find its height. (in cm)',
      answer: 5,
      explanation: '392.7 = π × 25 × h, so h = 392.7 ÷ (25π) = 5 cm.'
    },
    {
      type: 'calc',
      text: 'A cylinder has a height of 10 cm and a volume of 282.74 cm³. Find its radius. (in cm)',
      answer: 3,
      explanation: '282.74 = πr² × 10, so r² = 282.74 ÷ (10π) = 9 and r = 3 cm.'
    },
    {
      type: 'calc',
      text: 'A round water tank has a radius of 0.5 m and a height of 2 m. How many litres does it hold when full? (round to 2 decimal places)',
      answer: 1570.8,
      explanation: 'V = π × 0.5² × 2 = 1.5708 m³. 1.5708 × 1 000 = 1 570.80 ℓ.'
    },

    /* ===================================================== */
    /* 5. SPHERES                                            */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Spheres and hemispheres',
      answer:
        'A sphere is a perfectly round ball with radius r.\n\n' +
        'Volume = <sup>4</sup>&frasl;<sub>3</sub>πr³\n' +
        'Surface area = 4πr²\n\n' +
        'A hemisphere is half a sphere:\n' +
        'Volume = <sup>2</sup>&frasl;<sub>3</sub>πr³\n' +
        'Curved surface = 2πr²\n' +
        'Total surface area (with the flat circle) = 3πr²\n\n' +
        'Example: r = 3 cm\n' +
        'V = <sup>4</sup>&frasl;<sub>3</sub> × π × 3³ = 36π = 113.10 cm³\n' +
        'SA = 4 × π × 3² = 36π = 113.10 cm²'
    },
    {
      type: 'mcq',
      text: 'Which formula gives the <strong>surface area</strong> of a sphere?',
      options: ['4πr²', '<sup>4</sup>&frasl;<sub>3</sub>πr³', '2πr²', 'πr²'],
      correctIndex: 0,
      explanation: 'The surface area of a sphere is 4πr². The formula with r³ is the volume.'
    },
    {
      type: 'calc',
      text: 'Find the volume of a sphere with radius 3 cm. (in cm³, round to 2 decimal places)',
      answer: 113.1,
      explanation: 'V = <sup>4</sup>&frasl;<sub>3</sub>πr³ = <sup>4</sup>&frasl;<sub>3</sub> × π × 27 = 36π = 113.10 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the surface area of a sphere with radius 5 cm. (in cm², round to 2 decimal places)',
      answer: 314.16,
      explanation: 'SA = 4πr² = 4 × π × 25 = 100π = 314.16 cm².'
    },
    {
      type: 'calc',
      text: 'A ball has a diameter of 12 cm. Find its volume. (in cm³, round to 2 decimal places)',
      answer: 904.78,
      explanation: 'r = 6 cm. V = <sup>4</sup>&frasl;<sub>3</sub> × π × 6³ = 288π = 904.78 cm³.'
    },
    {
      type: 'calc',
      text: 'A soccer ball has a diameter of 22 cm. Find the volume of air inside it. (in cm³, round to 2 decimal places)',
      answer: 5575.28,
      explanation: 'r = 11 cm. V = <sup>4</sup>&frasl;<sub>3</sub> × π × 11³ = <sup>4</sup>&frasl;<sub>3</sub> × π × 1 331 = 5 575.28 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the volume of a hemisphere with radius 4 cm. (in cm³, round to 2 decimal places)',
      answer: 134.04,
      explanation: 'V = <sup>2</sup>&frasl;<sub>3</sub>πr³ = <sup>2</sup>&frasl;<sub>3</sub> × π × 64 = 134.04 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the total surface area of a solid hemisphere with radius 4 cm (including the flat circle). (in cm², round to 2 decimal places)',
      answer: 150.8,
      explanation: 'SA = 2πr² + πr² = 3πr² = 3 × π × 16 = 48π = 150.80 cm².'
    },
    {
      type: 'calc',
      text: 'A sphere has a surface area of 201.06 cm². Find its radius. (in cm)',
      answer: 4,
      explanation: '4πr² = 201.06, so r² = 201.06 ÷ 4π = 16 and r = 4 cm.'
    },

    /* ===================================================== */
    /* 6. CONES                                              */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Right cones',
      answer:
        'A cone has a circular base (radius r), a vertical height h and a slant height s.\n\n' +
        'Volume = ⅓πr²h\n' +
        'Curved surface = πrs\n' +
        'Total surface area = πr² + πrs\n' +
        'Slant height: s² = r² + h² (Pythagoras)\n\n' +
        'A cone holds exactly ⅓ of a cylinder with the same base and height.\n\n' +
        'Example: r = 3 cm and h = 4 cm\n' +
        's² = 9 + 16 = 25, so s = 5 cm\n' +
        'V = ⅓ × π × 9 × 4 = 12π = 37.70 cm³\n' +
        'SA = π(9) + π(3)(5) = 24π = 75.40 cm²'
    },
    {
      type: 'mcq',
      text: 'A cone and a cylinder have the same radius and the same height. The volume of the cone is...',
      options: [
        'the same as the cylinder',
        'half of the cylinder',
        'one third of the cylinder',
        'double the cylinder'
      ],
      correctIndex: 2,
      explanation: 'V(cone) = ⅓πr²h, which is one third of V(cylinder) = πr²h.'
    },
    {
      type: 'mcq',
      text: 'Which formula gives the slant height s of a cone?',
      options: ['s = r + h', 's² = r² + h²', 's = r × h', 's² = h² − r²'],
      correctIndex: 1,
      explanation: 'The radius, vertical height and slant height form a right-angled triangle, so s² = r² + h².'
    },
    {
      type: 'calc',
      text: 'A cone has a radius of 5 cm and a vertical height of 12 cm. Find the slant height. (in cm)',
      answer: 13,
      explanation: 's² = 5² + 12² = 25 + 144 = 169, so s = 13 cm.'
    },
    {
      type: 'calc',
      text: 'Find the volume of a cone with radius 6 cm and height 10 cm. (in cm³, round to 2 decimal places)',
      answer: 376.99,
      explanation: 'V = ⅓πr²h = ⅓ × π × 36 × 10 = 120π = 376.99 cm³.'
    },
    {
      type: 'calc',
      text: 'Find the total surface area of a cone with radius 3 cm and height 4 cm. (in cm², round to 2 decimal places)',
      answer: 75.4,
      explanation: 's = 5 cm. SA = πr² + πrs = 9π + 15π = 24π = 75.40 cm².'
    },
    {
      type: 'calc',
      text: 'The curved surface of a cone has radius 7 cm and slant height 10 cm. Find the curved surface area. (in cm², round to 2 decimal places)',
      answer: 219.91,
      explanation: 'Curved surface = πrs = π × 7 × 10 = 70π = 219.91 cm².'
    },
    {
      type: 'calc',
      text: 'A cone has a radius of 3 cm and a volume of 47.12 cm³. Find its height. (in cm)',
      answer: 5,
      explanation: '47.12 = ⅓ × π × 9 × h = 3πh, so h = 47.12 ÷ 3π = 5 cm.'
    },
    {
      type: 'calc',
      text: 'A pile of sand is a cone with radius 2 m and height 1.5 m. Find the volume of sand. (in m³, round to 2 decimal places)',
      answer: 6.28,
      explanation: 'V = ⅓ × π × 4 × 1.5 = 2π = 6.28 m³.'
    },

    /* ===================================================== */
    /* 7. PYRAMIDS                                           */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Right pyramids',
      answer:
        'A right pyramid has a base and triangular faces that meet at the apex (top).\n\n' +
        'Volume = ⅓ × (area of base) × (vertical height)\n' +
        'Surface area = area of base + area of all the triangular faces\n\n' +
        'The slant height is the height of a triangular face. Use Pythagoras to link it to the vertical height:\n' +
        'slant² = vertical height² + (half the base)²\n\n' +
        'Example: Square base 6 cm × 6 cm and vertical height 10 cm.\n' +
        'V = ⅓ × 36 × 10 = 120 cm³'
    },
    {
      type: 'mcq',
      text: 'Which formula gives the volume of a pyramid?',
      options: [
        'base area × height',
        '⅓ × base area × vertical height',
        '½ × base area × slant height',
        '⅓ × perimeter × height'
      ],
      correctIndex: 1,
      explanation: 'Volume of a pyramid = ⅓ × (area of base) × (vertical height).'
    },
    {
      type: 'calc',
      text: 'A pyramid has a square base of 6 cm by 6 cm and a vertical height of 10 cm. Find its volume. (in cm³)',
      answer: 120,
      explanation: 'V = ⅓ × 36 × 10 = 120 cm³.'
    },
    {
      type: 'calc',
      text: 'A pyramid has a rectangular base of 6 cm by 4 cm and a vertical height of 9 cm. Find its volume. (in cm³)',
      answer: 72,
      explanation: 'V = ⅓ × (6 × 4) × 9 = ⅓ × 24 × 9 = 72 cm³.'
    },
    {
      type: 'calc',
      text: 'A pyramid has a square base of 5 cm by 5 cm and a volume of 100 cm³. Find its vertical height. (in cm)',
      answer: 12,
      explanation: '100 = ⅓ × 25 × h, so h = 300 ÷ 25 = 12 cm.'
    },
    {
      type: 'calc',
      text: 'A square pyramid has a base of 10 cm by 10 cm and a vertical height of 12 cm. Find the slant height of a triangular face. (in cm)',
      answer: 13,
      explanation: 'Half the base = 5 cm. slant² = 12² + 5² = 144 + 25 = 169, so slant = 13 cm.'
    },
    {
      type: 'calc',
      text: 'For the same pyramid (base 10 cm × 10 cm, slant height 13 cm), find the total surface area. (in cm²)',
      answer: 360,
      explanation: 'Base = 100 cm². Each triangle = ½ × 10 × 13 = 65 cm², and there are 4. SA = 100 + 4(65) = 360 cm².'
    },
    {
      type: 'calc',
      text: 'A square pyramid has a base of 8 cm by 8 cm and a slant height of 5 cm. Find the total surface area. (in cm²)',
      answer: 144,
      explanation: 'Base = 64 cm². Each triangle = ½ × 8 × 5 = 20 cm², and there are 4. SA = 64 + 80 = 144 cm².'
    },

    /* ===================================================== */
    /* 8. COMPOSITE SOLIDS                                   */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Combined (composite) solids',
      answer:
        'Split the solid into simple solids. Then:\n' +
        '• Volume: add (or subtract) the volumes.\n' +
        '• Surface area: only count the faces on the OUTSIDE. Faces that are joined together are left out.\n\n' +
        'Example: A cylinder (r = 3 cm, h = 10 cm) with a hemisphere (r = 3 cm) on top.\n' +
        'V(cylinder) = π × 9 × 10 = 90π\n' +
        'V(hemisphere) = <sup>2</sup>&frasl;<sub>3</sub> × π × 27 = 18π\n' +
        'V(total) = 108π = 339.29 cm³'
    },
    {
      type: 'calc',
      text: 'A cylinder (r = 3 cm, h = 10 cm) has a hemisphere (r = 3 cm) on top. Find the total volume. (in cm³, round to 2 decimal places)',
      answer: 339.29,
      explanation: 'V = 90π + 18π = 108π = 339.29 cm³.'
    },
    {
      type: 'calc',
      text: 'The same solid is closed at the bottom. Find the total outside surface area. (in cm², round to 2 decimal places)',
      answer: 273.32,
      explanation: 'Base circle = π(9) = 9π. Curved cylinder = 2π(3)(10) = 60π. Hemisphere = 2π(9) = 18π. Total = 87π = 273.32 cm².'
    },
    {
      type: 'calc',
      text: 'A silo is a cylinder (r = 2 m, h = 5 m) with a cone (r = 2 m, h = 3 m) on top. Find the total volume. (in m³, round to 2 decimal places)',
      answer: 75.4,
      explanation: 'V(cylinder) = π × 4 × 5 = 20π. V(cone) = ⅓ × π × 4 × 3 = 4π. Total = 24π = 75.40 m³.'
    },
    {
      type: 'calc',
      text: 'A solid block is 10 cm × 10 cm × 5 cm. A cylindrical hole with radius 2 cm goes right through its height. Find the volume of the block that is left. (in cm³, round to 2 decimal places)',
      answer: 437.17,
      explanation: 'Block = 10 × 10 × 5 = 500 cm³. Hole = π × 4 × 5 = 20π = 62.83 cm³. Left = 500 − 62.83 = 437.17 cm³.'
    },
    {
      type: 'calc',
      text: 'A model house is a rectangular prism (6 cm × 4 cm × 3 cm) with a triangular prism roof on top. The roof triangle has base 4 cm and height 1.5 cm and the roof is 6 cm long. Find the total volume. (in cm³)',
      answer: 90,
      explanation: 'Box = 6 × 4 × 3 = 72 cm³. Roof = ½ × 4 × 1.5 × 6 = 18 cm³. Total = 90 cm³.'
    },
    {
      type: 'calc',
      text: 'A cube with sides of 4 cm has a square pyramid (base 4 cm × 4 cm, height 3 cm) on top. Find the total volume. (in cm³)',
      answer: 80,
      explanation: 'Cube = 4³ = 64 cm³. Pyramid = ⅓ × 16 × 3 = 16 cm³. Total = 80 cm³.'
    },
    {
      type: 'mcq',
      text: 'When a cone is placed on top of a cylinder with the same radius, which area is NOT part of the outside surface?',
      options: [
        'The curved surface of the cone',
        'The curved surface of the cylinder',
        'The base circle of the cone and the top circle of the cylinder where they join',
        'The bottom circle of the cylinder'
      ],
      correctIndex: 2,
      explanation: 'Where two solids are joined, the faces are hidden inside. They are left out of the surface area.'
    },

    /* ===================================================== */
    /* 9. EFFECT OF CHANGING THE DIMENSIONS (FACTOR k)       */
    /* ===================================================== */
    {
      type: 'info',
      text: 'What happens when we change the dimensions?',
      answer:
        'Look at how many times each dimension appears in the formula.\n\n' +
        'Example 1: The radius of a cylinder is doubled (h stays the same).\n' +
        'V = πr²h. The radius is squared, so V × 2² = V × 4.\n\n' +
        'Example 2: The height of a cylinder is tripled (r stays the same).\n' +
        'V = πr²h. The height appears once, so V × 3.\n\n' +
        'If ALL dimensions are multiplied by k:\n' +
        '• lengths × k\n' +
        '• surface area × k²\n' +
        '• volume × k³\n\n' +
        'Example 3: Every side of a cube is doubled (k = 2).\n' +
        'SA × 4 and V × 8.'
    },
    {
      type: 'mcq',
      text: 'The radius of a cylinder is doubled and the height stays the same. What happens to the volume?',
      options: ['It stays the same', 'It is doubled', 'It is multiplied by 4', 'It is multiplied by 8'],
      correctIndex: 2,
      explanation: 'V = πr²h. The radius is squared, so doubling it gives 2² = 4 times the volume.'
    },
    {
      type: 'mcq',
      text: 'The height of a cylinder is tripled and the radius stays the same. What happens to the volume?',
      options: ['It is multiplied by 3', 'It is multiplied by 6', 'It is multiplied by 9', 'It stays the same'],
      correctIndex: 0,
      explanation: 'The height appears once in V = πr²h, so the volume is multiplied by 3.'
    },
    {
      type: 'mcq',
      text: 'Every side of a cube is doubled. What happens to the surface area?',
      options: ['× 2', '× 4', '× 6', '× 8'],
      correctIndex: 1,
      explanation: 'SA = 6s². Doubling s gives 6(2s)² = 6 × 4s², so the surface area is × 4.'
    },
    {
      type: 'mcq',
      text: 'Every side of a cube is doubled. What happens to the volume?',
      options: ['× 2', '× 4', '× 6', '× 8'],
      correctIndex: 3,
      explanation: 'V = s³. Doubling s gives (2s)³ = 8s³, so the volume is × 8.'
    },
    {
      type: 'mcq',
      text: 'The radius of a sphere is multiplied by k. The volume is multiplied by...',
      options: ['k', 'k²', 'k³', '3k'],
      correctIndex: 2,
      explanation: 'V = <sup>4</sup>&frasl;<sub>3</sub>πr³. The radius is cubed, so the volume is multiplied by k³.'
    },
    {
      type: 'calc',
      text: 'The volume of a box is 40 cm³. Its length is doubled and its breadth is tripled. The height stays the same. What is the new volume? (in cm³)',
      answer: 240,
      explanation: 'New volume = 40 × 2 × 3 = 240 cm³.'
    },
    {
      type: 'calc',
      text: 'The volume of a cylinder is 100 cm³. Its radius is doubled and its height is halved. What is the new volume? (in cm³)',
      answer: 200,
      explanation: 'The radius is squared: × 4. The height is halved: × ½. New volume = 100 × 4 × ½ = 200 cm³.'
    },
    {
      type: 'calc',
      text: 'The surface area of a cube is 54 cm². Every side is doubled. What is the new surface area? (in cm²)',
      answer: 216,
      explanation: 'The surface area is multiplied by 2² = 4. New SA = 54 × 4 = 216 cm².'
    },
    {
      type: 'calc',
      text: 'The radius of a sphere is tripled. By what factor is the volume multiplied?',
      answer: 27,
      explanation: 'k = 3, so the volume is multiplied by k³ = 27.'
    },
    {
      type: 'calc',
      text: 'The radius of a sphere is halved. By what factor is the volume multiplied? (give a decimal)',
      answer: 0.125,
      tolerance: 0.001,
      explanation: 'k = ½, so the volume is multiplied by (½)³ = ⅛ = 0.125.'
    },
    {
      type: 'calc',
      text: 'Every dimension of a rectangular prism is multiplied by 3. By what factor is the surface area multiplied?',
      answer: 9,
      explanation: 'The surface area is multiplied by k² = 3² = 9.'
    },
    {
      type: 'calc',
      text: 'A cone has a volume of 30 cm³. Its radius is doubled and the height stays the same. What is the new volume? (in cm³)',
      answer: 120,
      explanation: 'V = ⅓πr²h. The radius is squared, so the volume is × 4. New volume = 30 × 4 = 120 cm³.'
    },

    /* ===================================================== */
    /* 10. REAL-LIFE PROBLEMS                                */
    /* ===================================================== */
    {
      type: 'info',
      text: 'Solving real-life problems',
      answer:
        'Follow these steps:\n' +
        '1. Draw the solid and write down what you know.\n' +
        '2. Choose the correct formula.\n' +
        '3. Make sure all measurements use the same unit.\n' +
        '4. Substitute and calculate. Do not round until the last step.\n' +
        '5. Convert to the unit asked for and write the unit.\n\n' +
        'Example: How many small cubes with sides of 2 cm fit in a box that is 10 cm × 6 cm × 4 cm?\n' +
        'Volume of box = 240 cm³\n' +
        'Volume of one cube = 2³ = 8 cm³\n' +
        'Number of cubes = 240 ÷ 8 = 30'
    },
    {
      type: 'calc',
      text: 'How many small cubes with sides of 2 cm fit into a box that is 10 cm × 6 cm × 4 cm?',
      answer: 30,
      explanation: '240 cm³ ÷ 8 cm³ = 30 cubes.'
    },
    {
      type: 'calc',
      text: 'A round water tank has a radius of 1 m and a height of 2.5 m. How many litres of water does it hold when full? (round to 2 decimal places)',
      answer: 7853.98,
      explanation: 'V = π × 1² × 2.5 = 7.85398 m³. 7.85398 × 1 000 = 7 853.98 ℓ.'
    },
    {
      type: 'calc',
      text: 'A rectangular tank is 2 m long, 1.5 m wide and 1 m high. It is filled to 80% of its volume. How many litres of water are in it?',
      answer: 2400,
      explanation: 'V = 2 × 1.5 × 1 = 3 m³. 80% of 3 = 2.4 m³ = 2 400 ℓ.'
    },
    {
      type: 'calc',
      text: 'A gift box is 30 cm long, 20 cm wide and 10 cm high. How much wrapping paper is needed to cover the whole box, with no overlap? (in cm²)',
      answer: 2200,
      explanation: 'SA = 2(30×20 + 30×10 + 20×10) = 2(600 + 300 + 200) = 2 200 cm².'
    },
    {
      type: 'calc',
      text: 'A paint tin is a cylinder with radius 10 cm and height 20 cm. How many litres of paint does it hold when full? (round to 2 decimal places)',
      answer: 6.28,
      explanation: 'V = π × 100 × 20 = 2 000π = 6 283.19 cm³ = 6.28 ℓ.'
    },
    {
      type: 'calc',
      text: 'A solid metal sphere has a radius of 2 cm. Find its volume. (in cm³, round to 2 decimal places)',
      answer: 33.51,
      explanation: 'V = <sup>4</sup>&frasl;<sub>3</sub> × π × 8 = <sup>32</sup>&frasl;<sub>3</sub>π = 33.51 cm³.'
    }
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

  // ---------- Lifecycle ----------
  ngOnInit(): void {
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

  // ---------- Question flow ----------
  private startQuestion(): void {
    this.answered = false;
    this.revealed = false;
    this.isCorrect = false;
    this.selectedOption = null;
    this.userAnswer = null;
    this.feedback = '';
    this.stopTimer();

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

  private lockAnswer(): void {
    this.answered = true;
    this.stopTimer();
    if (this.isCorrect) {
      this.totalCorrect++;
    } else {
      this.totalWrong++;
    }
    this.feedback = 'Answer saved.';
  }

  nextQuestion(): void {
    this.stopTimer();

    if (this.isLast) {
      this.showResults = true;
      return;
    }
    this.currentIndex++;
    this.startQuestion();
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
    this.totalWrong++;
    this.feedback = "Time's up!";
  }

  // ---------- Results actions ----------
  retry(): void {
    this.stopTimer();
    this.currentIndex = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
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
