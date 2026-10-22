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
  /** Question heading, e.g. "Question 1: Overview of soil degradation" */
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

const erosionPanel = (x: number, label: string, inner: string) =>
  `<g transform="translate(${x},0)"><rect x="2" y="2" width="112" height="126" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>` +
  `<polygon points="8,100 108,60 108,118 8,118" fill="#c9a27a"/>${inner}` +
  `<text x="58" y="148" text-anchor="middle" font-weight="bold" font-size="16">${label}</text></g>`;

/** Four stages of water erosion, labelled A-D (A splash, B sheet, C rill, D gully) */
const IMG_WATER_STAGES = svg(480, 156,
  erosionPanel(0, 'A',
    '<g stroke="#0ea5e9" stroke-width="2"><line x1="30" y1="45" x2="28" y2="80"/><line x1="55" y1="35" x2="53" y2="72"/><line x1="80" y1="25" x2="78" y2="62"/></g>' +
    '<g fill="#7c4a1e"><circle cx="24" cy="86" r="2"/><circle cx="34" cy="84" r="2"/><circle cx="50" cy="76" r="2"/><circle cx="60" cy="74" r="2"/><circle cx="76" cy="66" r="2"/><circle cx="86" cy="64" r="2"/></g>') +
  erosionPanel(120, 'B', '<polygon points="8,98 108,58 108,66 8,106" fill="#7dd3fc" opacity=".85"/>') +
  erosionPanel(240, 'C',
    '<g stroke="#6b3e17" stroke-width="3" stroke-linecap="round"><line x1="30" y1="90" x2="36" y2="114"/><line x1="55" y1="81" x2="61" y2="114"/><line x1="80" y1="71" x2="86" y2="114"/></g>') +
  erosionPanel(360, 'D', '<polygon points="40,86 58,117 78,70 68,72 58,102 50,84" fill="#6b3e17"/>'));

/** Learn-card picture: up and down the slope vs contour ploughing */
const IMG_CONTOUR = svg(390, 150,
  '<path d="M10,115 Q95,5 180,115 Z" fill="#bbf7d0" stroke="#15803d"/>' +
  '<g stroke="#92400e" stroke-width="2"><line x1="95" y1="38" x2="95" y2="115"/><line x1="70" y1="52" x2="62" y2="115"/><line x1="120" y1="52" x2="128" y2="115"/><line x1="45" y1="78" x2="35" y2="115"/><line x1="145" y1="78" x2="155" y2="115"/></g>' +
  '<text x="95" y="138" text-anchor="middle" font-weight="bold">Up and down the slope</text>' +
  '<g transform="translate(200,0)"><path d="M10,115 Q95,5 180,115 Z" fill="#bbf7d0" stroke="#15803d"/>' +
  '<g stroke="#92400e" stroke-width="2" fill="none"><path d="M38,92 Q95,50 152,92"/><path d="M24,104 Q95,68 166,104"/><path d="M58,74 Q95,52 132,74"/></g>' +
  '<text x="95" y="138" text-anchor="middle" font-weight="bold">Across the slope (contour)</text></g>');

/** Terraces, side view */
const IMG_TERRACE = svg(300, 160,
  '<polygon points="10,135 10,105 80,105 80,85 150,85 150,65 220,65 220,45 290,45 290,135" fill="#c9a27a" stroke="#7c4a1e"/>' +
  '<g stroke="#16a34a" stroke-width="5"><line x1="10" y1="105" x2="80" y2="105"/><line x1="80" y1="85" x2="150" y2="85"/><line x1="150" y1="65" x2="220" y2="65"/><line x1="220" y1="45" x2="290" y2="45"/></g>' +
  '<text x="150" y="153" text-anchor="middle">Side view of a steep slope</text>');

/** Compacted layer X under a tractor */
const IMG_COMPACTION = svg(320, 175,
  '<rect x="0" y="60" width="320" height="115" fill="#c9a27a"/><rect x="0" y="60" width="320" height="28" fill="#92643c"/>' +
  '<rect x="0" y="90" width="320" height="14" fill="#5b3a1a"/>' +
  '<rect x="40" y="30" width="62" height="18" fill="#dc2626"/><rect x="44" y="14" width="22" height="16" fill="#b91c1c"/>' +
  '<circle cx="52" cy="52" r="10" fill="#111"/><circle cx="92" cy="54" r="8" fill="#111"/>' +
  '<path d="M200,60 L200,88 M200,75 L188,86 M200,75 L212,86" stroke="#16a34a" stroke-width="2" fill="none"/>' +
  '<path d="M200,60 L194,48 M200,60 L206,48" stroke="#16a34a" stroke-width="2"/>' +
  '<line x1="250" y1="97" x2="282" y2="97" stroke="#111"/><text x="288" y="102" font-weight="bold" font-size="16">X</text>');

/** White crust on the soil surface (Y) */
const IMG_SALT = svg(300, 150,
  '<rect x="0" y="62" width="300" height="88" fill="#a16f45"/><rect x="0" y="58" width="300" height="6" fill="#ffffff" stroke="#e5e7eb"/>' +
  '<g fill="#ffffff"><circle cx="40" cy="64" r="5"/><circle cx="90" cy="65" r="6"/><circle cx="140" cy="64" r="5"/><circle cx="230" cy="65" r="6"/></g>' +
  '<g stroke="#92400e" stroke-width="2"><path d="M60,58 L56,40"/><path d="M110,58 L116,42"/><path d="M180,58 L176,38"/></g>' +
  '<line x1="205" y1="38" x2="185" y2="57" stroke="#111"/><text x="208" y="36" font-weight="bold" font-size="16">Y</text>' +
  '<text x="150" y="138" text-anchor="middle">Dry land, irrigated for many years</text>');

/** Row of trees (A) protecting a field from the wind */
const IMG_WINDBREAK = svg(340, 140,
  '<rect x="0" y="110" width="340" height="30" fill="#c9a27a"/>' +
  '<g stroke="#0284c7" stroke-width="2"><line x1="10" y1="55" x2="110" y2="55"/><line x1="10" y1="80" x2="110" y2="80"/><line x1="10" y1="100" x2="110" y2="100"/></g>' +
  '<g fill="#0284c7"><polygon points="110,55 100,50 100,60"/><polygon points="110,80 100,75 100,85"/><polygon points="110,100 100,95 100,105"/></g>' +
  '<g fill="#7c4a1e"><rect x="136" y="85" width="5" height="25"/><rect x="158" y="85" width="5" height="25"/><rect x="180" y="85" width="5" height="25"/></g>' +
  '<g fill="#15803d"><circle cx="138" cy="70" r="17"/><circle cx="160" cy="68" r="19"/><circle cx="182" cy="70" r="17"/></g>' +
  '<g stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 3"><line x1="215" y1="80" x2="260" y2="80"/></g>' +
  '<g stroke="#16a34a" stroke-width="3"><line x1="225" y1="110" x2="225" y2="98"/><line x1="245" y1="110" x2="245" y2="98"/><line x1="265" y1="110" x2="265" y2="98"/><line x1="285" y1="110" x2="285" y2="98"/><line x1="305" y1="110" x2="305" y2="98"/></g>' +
  '<text x="160" y="30" text-anchor="middle" font-weight="bold" font-size="16">A</text>');

/** Maize yield over 5 years (y gridlines every 1 t/ha) */
const IMG_YIELD_CHART = (() => {
  const grid = [0, 1, 2, 3, 4, 5, 6].map(t =>
    `<line x1="50" y1="${150 - 20 * t}" x2="310" y2="${150 - 20 * t}" stroke="#e2e8f0"/><text x="44" y="${154 - 20 * t}" text-anchor="end" font-size="11">${t}</text>`).join('');
  const heights = [100, 90, 76, 60, 44];
  const bars = heights.map((h, i) =>
    `<rect x="${68 + i * 50}" y="${150 - h}" width="34" height="${h}" fill="#38bdf8"/><text x="${85 + i * 50}" y="166" text-anchor="middle" font-size="11">${i + 1}</text>`).join('');
  return svg(330, 200,
    grid + bars +
    '<line x1="50" y1="20" x2="50" y2="150" stroke="#111"/><line x1="50" y1="150" x2="310" y2="150" stroke="#111"/>' +
    '<text x="180" y="188" text-anchor="middle" font-weight="bold">Year</text>' +
    '<text x="14" y="90" text-anchor="middle" font-weight="bold" transform="rotate(-90 14 90)">Maize yield (t/ha)</text>');
})();

/* ================= QUESTION HELPERS ================= */
const mcq = (text: string, options: string[], correctIndex: number, explanation: string, image?: string): Draft =>
  ({ type: 'mcq', text, options, correctIndex, explanation, image, marks: 1, timed: true });

const tf = (text: string, isTrue: boolean, explanation: string): Draft =>
  ({ type: 'tf', text, options: ['True', 'False'], correctIndex: isTrue ? 0 : 1, explanation, marks: 1, timed: true });

const term = (text: string, accepted: string[], explanation: string, image?: string): Draft =>
  ({ type: 'term', text, accepted, modelText: accepted[0], explanation, image, marks: 1, timed: true });

const short = (text: string, marks: number, model: string[], explanation = '', image?: string): Draft =>
  ({ type: 'short', text, marks, model, explanation, image, timed: false });

/* ================= THE PAPER ================= */
const SECTIONS: Section[] = [

  /* ================= QUESTION 1: UNIT 1 ================= */
  {
    title: 'Question 1: An overview of soil degradation',
    learn: [
      {
        title: 'What is soil degradation?',
        body:
          'Soil <strong>degradation</strong> is the decline in the quality and productivity of soil. It is caused by natural processes or by human activities.\n\n' +
          '<strong>Soil quality</strong> = the ability of soil to support plant growth, store water and nutrients and support living organisms.\n' +
          '<strong>Soil conservation</strong> = the protection of soil against degradation (loss, erosion and loss of fertility).\n' +
          '<strong>Soil management</strong> = farming practices that keep soil healthy and productive.\n\n' +
          'Topsoil forms very slowly (hundreds of years for a few centimetres), so lost topsoil is not easily replaced.'
      },
      {
        title: 'Causes and signs of soil degradation',
        body:
          '<strong>Natural causes:</strong> heavy rain, floods, strong winds, drought, steep slopes.\n\n' +
          '<strong>Human causes:</strong> overgrazing, deforestation (removing vegetation), ploughing up and down slopes, monoculture (same crop every year), overuse of chemicals and fertilisers, burning veld, poor irrigation, mining and construction.\n\n' +
          '<strong>Signs on a farm:</strong> falling yields, bare patches, gullies, hard crusts, white salt patches, water ponding, exposed roots, silted dams.'
      }
    ],
    subs: [
      {
        sub: '1.1', heading: 'Multiple-choice questions',
        instruction: 'Choose the correct answer.',
        items: [
          mcq('Which ONE of the following best defines soil degradation?',
            ['An increase in soil fertility over time', 'The decline in soil quality and productivity', 'The formation of new soil from rock', 'The addition of fertiliser to soil'],
            1, 'Soil degradation is the decline in the quality and productivity of soil.'),
          mcq('Which ONE of the following is a HUMAN cause of soil degradation?',
            ['Floods', 'Strong winds', 'Overgrazing', 'Drought'],
            2, 'Overgrazing is caused by people (farmers) keeping too many animals on the veld.'),
          mcq('The protection of soil against loss and deterioration is called …',
            ['soil degradation', 'soil pollution', 'soil conservation', 'weathering'],
            2, 'Soil conservation protects soil from erosion and loss of fertility.'),
          mcq('Which ONE of the following is a sign of soil degradation on a farm?',
            ['Increasing yields every year', 'Gullies on the lands', 'Dark, rich topsoil', 'Many earthworms'],
            1, 'Gullies show that soil is being removed by water.'),
          mcq('Which ONE of the following is a NATURAL cause of soil degradation?',
            ['Monoculture', 'Mining', 'Deforestation', 'Heavy rainfall on steep slopes'],
            3, 'Heavy rain on steep slopes is natural. The others are caused by people.')
        ]
      },
      {
        sub: '1.2', heading: 'Terminology',
        instruction: 'Give ONE word or term for each description.',
        items: [
          term('The ability of soil to support plant growth, store water and nutrients and support living organisms.',
            ['soil quality', 'quality of soil'], 'This is soil quality.'),
          term('The protection of soil against degradation and erosion.',
            ['soil conservation', 'conservation'], 'This is soil conservation.'),
          term('Growing the same crop on the same land year after year.',
            ['monoculture', 'monocropping', 'mono-cropping', 'mono cropping'], 'This is monoculture.'),
          term('The removal of trees and natural vegetation from large areas.',
            ['deforestation'], 'This is deforestation.'),
          term('Too many animals grazing on veld for too long, leaving the soil bare.',
            ['overgrazing', 'over-grazing', 'over grazing'], 'This is overgrazing.')
        ]
      },
      {
        sub: '1.3', heading: 'True or false',
        instruction: 'Choose TRUE or FALSE. If a statement is false, the explanation shows why.',
        items: [
          tf('Soil degradation is caused only by human activities.', false, 'False. It is caused by natural processes AND human activities.'),
          tf('Overgrazing leaves the soil bare and exposed to erosion.', true, 'True. Without plant cover, soil is easily washed or blown away.'),
          tf('Lost topsoil is quickly replaced by natural soil formation.', false, 'False. Soil forms extremely slowly.'),
          tf('Burning veld leaves the soil surface bare.', true, 'True. Burning removes the plant cover that protects the soil.'),
          tf('Monoculture can lead to a loss of soil nutrients.', true, 'True. The same crop takes the same nutrients from the soil every year.')
        ]
      },
      {
        sub: '1.4', heading: 'Short questions',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Define the term <strong>soil degradation</strong>.', 2,
            ['The decline / deterioration in the quality and productivity of soil (1)', 'Caused by natural processes or human activities (1)']),
          short('Name FOUR human activities that cause soil degradation.', 4,
            ['Overgrazing', 'Deforestation', 'Ploughing up and down slopes / poor tillage', 'Monoculture', 'Overuse of chemicals and fertilisers', 'Burning of veld', 'Poor irrigation practices', 'Mining / construction'],
            'Any four.'),
          short('Describe THREE signs that show the soil on a farm is degrading.', 3,
            ['Crop yields decrease', 'Gullies / rills form on the land', 'Bare patches / loss of vegetation cover', 'Hard crust on the surface', 'White salt patches', 'Exposed plant roots', 'Dams and rivers become silted'],
            'Any three.')
        ]
      }
    ]
  },

  /* ================= QUESTION 2: UNIT 2 ================= */
  {
    title: 'Question 2: Types and processes of soil degradation',
    learn: [
      {
        title: 'Types of soil degradation',
        body:
          '<strong>Physical degradation</strong> (soil structure and condition): erosion by wind and water, compaction, crusting (capping), waterlogging.\n\n' +
          '<strong>Chemical degradation</strong> (soil chemistry): acidification, salinisation, sodicity (too much sodium), loss of nutrients by leaching, pollution.\n\n' +
          '<strong>Biological degradation</strong>: loss of organic matter and of living organisms (earthworms, bacteria, fungi), for example through burning, overuse of pesticides and monoculture.'
      },
      {
        title: 'Soil erosion',
        body:
          '<strong>Soil erosion</strong> is the removal and transport of topsoil by water or wind.\n\n' +
          '<strong>Agents of erosion:</strong> water and wind.\n\n' +
          '<strong>Stages of water erosion (in order):</strong>\n' +
          '1. Splash erosion: raindrops hit bare soil and throw particles into the air.\n' +
          '2. Sheet erosion: a thin layer of topsoil is washed off evenly.\n' +
          '3. Rill erosion: small channels form on the surface.\n' +
          '4. Gully erosion: rills join and become deep channels that cannot be crossed by machinery.\n\n' +
          '<strong>Wind erosion</strong> happens on bare, dry, loose soil in open areas.\n\n' +
          'Factors: slope, plant cover, rainfall intensity, soil type and management.',
        image: IMG_WATER_STAGES
      },
      {
        title: 'Other degradation processes',
        body:
          '<strong>Compaction:</strong> soil particles are pressed together, so pore spaces decrease. Causes: heavy machinery, trampling by livestock, ploughing wet soil. Effects: poor root growth, poor infiltration and poor aeration.\n\n' +
          '<strong>Crusting (capping):</strong> a hard layer forms on bare soil after raindrops break up the surface. It blocks seedlings and water.\n\n' +
          '<strong>Leaching:</strong> nutrients are washed down below the root zone by water.\n\n' +
          '<strong>Acidification:</strong> the soil pH drops (soil becomes acid). Causes: leaching of bases, acid rain, some fertilisers.\n\n' +
          '<strong>Salinisation:</strong> soluble salts build up in the topsoil. Causes: irrigating with salty water, poor drainage, high evaporation.\n\n' +
          '<strong>Waterlogging:</strong> all pore spaces are filled with water, so roots get no oxygen.\n\n' +
          '<strong>Desertification:</strong> land in dry areas turns into desert because of degradation.'
      },
      {
        title: 'Controlling soil degradation',
        body:
          '<strong>Erosion:</strong> contour ploughing, terracing, strip cropping, cover crops, mulching, windbreaks, grassed waterways, check dams (gullies), conservation tillage, rotational grazing.\n\n' +
          '<strong>Compaction:</strong> avoid heavy machines on wet soil, reduce traffic, deep ripping, crop rotation.\n\n' +
          '<strong>Crusting:</strong> mulch, cover crops, add organic matter.\n\n' +
          '<strong>Acid soil:</strong> add lime.   <strong>Sodic soil:</strong> add gypsum.\n\n' +
          '<strong>Salinisation:</strong> improve drainage, leach with good quality water, avoid over-irrigation, plant salt-tolerant crops.\n\n' +
          '<strong>Waterlogging:</strong> install drainage.\n\n' +
          '<strong>Loss of organic matter:</strong> compost, manure, crop residues, green manure, no burning.',
        image: IMG_CONTOUR
      }
    ],
    subs: [
      {
        sub: '2.1', heading: 'Multiple-choice questions',
        instruction: 'Choose the correct answer.',
        items: [
          mcq('Soil erosion is best described as …',
            ['the build-up of salts in the topsoil', 'the removal and transport of topsoil by wind or water', 'the pressing together of soil particles', 'the addition of organic matter to soil'],
            1, 'Erosion is the removal and transport of topsoil by wind or water.'),
          mcq('Which sequence shows the stages of water erosion from first to last?',
            ['Sheet, splash, rill, gully', 'Splash, sheet, rill, gully', 'Rill, splash, sheet, gully', 'Gully, rill, sheet, splash'],
            1, 'Splash, then sheet, then rill, then gully.'),
          mcq('Study the diagram. Which panel (A–D) shows <strong>rill erosion</strong>?',
            ['A', 'B', 'C', 'D'], 2,
            'Panel C shows several small channels (rills). A is splash, B is sheet and D is a gully.', IMG_WATER_STAGES),
          mcq('Which ONE of the following is a CHEMICAL type of soil degradation?',
            ['Compaction', 'Sheet erosion', 'Crusting', 'Salinisation'],
            3, 'Salinisation changes the chemistry of the soil. The others are physical.'),
          mcq('Lime is added to soil to correct …',
            ['salinity', 'sodicity', 'acidity', 'waterlogging'],
            2, 'Lime raises the pH of acid soil.'),
          mcq('Study the diagram. What is the dark layer labelled <strong>X</strong>?',
            ['Fertile topsoil', 'A compacted layer (hardpan)', 'Bedrock', 'A layer of organic matter'],
            1, 'Heavy machinery presses the soil together and forms a compacted layer that roots cannot penetrate.', IMG_COMPACTION),
          mcq('The diagram shows a conservation practice used on a steep slope. Which practice is it?',
            ['Windbreak', 'Strip cropping', 'Mulching', 'Terracing'],
            3, 'Terracing cuts a steep slope into level steps that slow down runoff.', IMG_TERRACE),
          mcq('Gypsum is added to soil to treat …',
            ['acid soil', 'sodic soil', 'compacted soil', 'sandy soil'],
            1, 'Gypsum replaces sodium in sodic soil with calcium.')
        ]
      },
      {
        sub: '2.2', heading: 'Terminology',
        instruction: 'Give ONE word or term for each description.',
        items: [
          term('A hard layer that forms on bare soil after rain and stops seedlings from emerging.',
            ['crusting', 'capping', 'soil crust', 'surface crust', 'crust'], 'This is crusting (capping).'),
          term('The washing of nutrients down below the root zone by water.',
            ['leaching'], 'This is leaching.'),
          term('A drop in soil pH that makes the soil sour (acid).',
            ['acidification', 'soil acidification', 'acidity'], 'This is acidification.'),
          term('The process in which land in dry areas turns into desert because of degradation.',
            ['desertification'], 'This is desertification.'),
          term('A condition where all soil pores are filled with water so that roots lack oxygen.',
            ['waterlogging', 'water logging', 'water-logging'], 'This is waterlogging.'),
          term('Study the diagram. Name the process that caused the white crust at <strong>Y</strong>.',
            ['salinisation', 'salinization', 'salt accumulation', 'soil salinisation'],
            'Salts left behind when irrigation water evaporates form a white crust: salinisation.', IMG_SALT),
          term('Study the diagram. Name the conservation practice shown at <strong>A</strong>.',
            ['windbreak', 'wind break', 'windbreaks', 'shelterbelt', 'shelter belt'],
            'A row of trees (windbreak) slows the wind and reduces wind erosion.', IMG_WINDBREAK)
        ]
      },
      {
        sub: '2.3', heading: 'True or false',
        instruction: 'Choose TRUE or FALSE. If a statement is false, the explanation shows why.',
        items: [
          tf('Contour ploughing means ploughing up and down the slope.', false, 'False. Contour ploughing is done ACROSS the slope, along the contour lines.'),
          tf('Mulching protects the soil from the impact of raindrops.', true, 'True. Mulch covers the soil surface.'),
          tf('Salinisation is common where irrigation water is salty and drainage is poor.', true, 'True. Salts stay behind when the water evaporates.'),
          tf('Overgrazing improves plant cover and reduces erosion.', false, 'False. Overgrazing removes plant cover and increases erosion.'),
          tf('Gully erosion is the first stage of water erosion.', false, 'False. Splash erosion is the first stage.'),
          tf('Compaction increases the air spaces in soil.', false, 'False. Compaction reduces pore spaces.')
        ]
      },
      {
        sub: '2.4', heading: 'Short questions',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Define <strong>soil erosion</strong>.', 2,
            ['The removal / washing or blowing away of topsoil (1)', 'By agents such as water or wind (1)']),
          short('Name the TWO agents of soil erosion.', 2, ['Water', 'Wind']),
          short('Name the FOUR stages of water erosion in the correct order.', 4,
            ['Splash erosion (1)', 'Sheet erosion (2)', 'Rill erosion (3)', 'Gully erosion (4)'],
            'Each correct stage in the correct position earns 1 mark.', IMG_WATER_STAGES),
          short('Study the compaction diagram.<br>(a) State TWO causes of soil compaction. (2)<br>(b) Explain TWO ways in which compaction harms plant growth. (2)', 4,
            ['(a) Heavy machinery / tractors', '(a) Trampling by livestock', '(a) Ploughing wet soil / ploughing at the same depth every year',
              '(b) Roots cannot penetrate the hard layer', '(b) Poor water infiltration, so more runoff or waterlogging', '(b) Poor aeration, so roots get too little oxygen'],
            'Any 2 causes and any 2 effects.', IMG_COMPACTION),
          short('Suggest THREE methods to control soil erosion on sloping land.', 3,
            ['Contour ploughing', 'Terracing', 'Strip cropping', 'Cover crops / mulching', 'Grassed waterways', 'Windbreaks (wind erosion)', 'Conservation tillage / no-till'],
            'Any three.'),
          short('Describe how salinisation occurs and how it can be reduced.', 4,
            ['Irrigation water contains dissolved salts (1)', 'Water evaporates and the salts stay behind in the topsoil (1)', 'Improve drainage (1)', 'Leach with good quality water / avoid over-irrigation / plant salt-tolerant crops (1)'],
            'Two marks for how it occurs and two for how to reduce it.'),
          short('Differentiate between <strong>physical</strong> and <strong>chemical</strong> soil degradation. Give ONE example of each.', 4,
            ['Physical: damage to the structure or physical condition of the soil (1)', 'Example: erosion / compaction / crusting / waterlogging (1)', 'Chemical: change in the chemical make-up of the soil (1)', 'Example: acidification / salinisation / sodicity / leaching (1)']),
          short('Name the soil amendment used to treat: (a) acid soil (1) and (b) sodic soil (1).', 2,
            ['(a) Lime (1)', '(b) Gypsum (1)'])
        ]
      }
    ]
  },

  /* ================= QUESTION 3: UNIT 3 ================= */
  {
    title: 'Question 3: The impact of soil degradation on agricultural productivity',
    learn: [
      {
        title: 'Effects on crop production and the farm',
        body:
          '<strong>On the soil and crops:</strong> loss of topsoil, organic matter and nutrients, so yields drop. Less water is held and less water soaks in, so crops suffer drought stress and there is more runoff and flooding. Crusting and compaction make poor seedbeds.\n\n' +
          '<strong>On the farm business:</strong> higher input costs (more fertiliser, lime, irrigation), lower income and profit, lower land value, land may be abandoned, and veld carries fewer animals (lower carrying capacity).\n\n' +
          'Eroded soil is washed into dams and rivers. This is called <strong>siltation</strong>.'
      },
      {
        title: 'Wider effects and the vicious cycle',
        body:
          '<strong>On people and the economy:</strong> food insecurity, higher food prices, unemployment and poverty in farming areas, and rural-urban migration.\n\n' +
          '<strong>On the environment:</strong> loss of biodiversity, siltation of dams, polluted water, flooding and desertification.\n\n' +
          '<strong>The vicious cycle:</strong>\n' +
          'Soil degradation → lower yields → lower income → the farmer cannot afford conservation or inputs → more soil degradation.'
      }
    ],
    subs: [
      {
        sub: '3.1', heading: 'Multiple-choice questions',
        instruction: 'Choose the correct answer.',
        items: [
          mcq('What is a direct effect of topsoil loss on crops?',
            ['Higher yields', 'Lower yields', 'Better water retention', 'More organic matter'],
            1, 'Topsoil holds most of the nutrients and organic matter, so crops yield less without it.'),
          mcq('Eroded soil that settles in dams and rivers causes …',
            ['siltation', 'salinisation', 'liming', 'leaching'],
            0, 'Sediment building up in dams and rivers is siltation.'),
          mcq('Degraded soil with poor infiltration leads to …',
            ['less runoff', 'more runoff and flooding', 'more groundwater', 'higher crop yields'],
            1, 'Water cannot soak in, so it runs off.'),
          mcq('How does soil degradation affect a farmer financially?',
            ['Lower input costs', 'Higher input costs and lower income', 'Higher land value', 'More profit'],
            1, 'The farmer must spend more to get less.'),
          mcq('Which ONE is a social consequence of widespread soil degradation?',
            ['Better food security', 'Rural-urban migration', 'More farm jobs', 'Lower food prices'],
            1, 'People leave failing farming areas to look for work in towns and cities.')
        ]
      },
      {
        sub: '3.2', heading: 'Terminology and data response',
        instruction: 'Give ONE word, term or value. Questions 3.2.3 to 3.2.5 use the graph.',
        items: [
          term('The build-up of eroded soil (sediment) in dams and rivers.',
            ['siltation', 'silting'], 'This is siltation.'),
          term('A shortage of enough safe and nutritious food for people.',
            ['food insecurity', 'food shortage', 'hunger'], 'This is food insecurity.'),
          term('Study the graph of maize yield on an eroding land. What was the yield in <strong>year 4</strong>? (t/ha)',
            ['3', '3.0', '3 t/ha', '3t/ha'], 'Read across from the top of the year 4 bar: 3 t/ha.', IMG_YIELD_CHART),
          term('Calculate the decrease in yield from year 1 to year 5. (t/ha)',
            ['2.8', '2.8 t/ha', '2.8t/ha'], '5.0 − 2.2 = 2.8 t/ha.', IMG_YIELD_CHART),
          term('Calculate the percentage decrease in yield from year 1 to year 5.',
            ['56', '56%', '56 %'], '(2.8 ÷ 5.0) × 100 = 56%.', IMG_YIELD_CHART)
        ]
      },
      {
        sub: '3.3', heading: 'True or false',
        instruction: 'Choose TRUE or FALSE. If a statement is false, the explanation shows why.',
        items: [
          tf('Soil degradation has no effect on farm income.', false, 'False. Lower yields and higher costs reduce income.'),
          tf('Degraded soil holds less water, so crops suffer drought stress sooner.', true, 'True. Loss of organic matter and structure reduces water-holding capacity.'),
          tf('A farmer with degraded land may need more fertiliser to get the same yield.', true, 'True. Nutrients have been lost, so they must be replaced.'),
          tf('Soil degradation can contribute to unemployment in farming communities.', true, 'True. When farms fail, jobs are lost.')
        ]
      },
      {
        sub: '3.4', heading: 'Short questions',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Explain how the loss of topsoil reduces crop yields.', 2,
            ['Topsoil contains most of the nutrients and organic matter (1)', 'Without it, plants get fewer nutrients / less water, so growth and yield drop (1)']),
          short('State THREE effects of soil degradation on a farmer.', 3,
            ['Lower yields', 'Higher input costs (fertiliser, lime, irrigation)', 'Lower income / profit', 'Lower land value', 'Land may be abandoned', 'Lower carrying capacity of the veld'],
            'Any three.'),
          short('Describe the vicious cycle of soil degradation and poverty.', 3,
            ['Soil degradation lowers yields (1)', 'Lower yields mean lower income (1)', 'The farmer cannot afford conservation measures or inputs, so degradation continues (1)']),
          short('Discuss TWO ways in which soil degradation affects the environment or community outside the farm.', 2,
            ['Siltation of dams and rivers', 'Flooding because of more runoff', 'Water pollution', 'Food insecurity / higher food prices', 'Loss of biodiversity', 'Rural-urban migration'],
            'Any two, each with a short explanation.'),
          short('Study the graph. Give TWO possible reasons for the decline in maize yield over the five years.', 2,
            ['Topsoil was lost through erosion', 'Nutrients were lost / not replaced', 'Continuous monoculture', 'Soil compaction or poor structure'],
            'Any two.', IMG_YIELD_CHART)
        ]
      }
    ]
  },

  /* ================= QUESTION 4: MIXED, PAPER STYLE ================= */
  {
    title: 'Question 4: Mixed paper-style questions',
    learn: [
      {
        title: 'Command words in the exam',
        body:
          '<strong>Define:</strong> give the exact meaning.\n' +
          '<strong>Name / State / List:</strong> give short answers, no explanation.\n' +
          '<strong>Describe:</strong> say what something is like or how it happens.\n' +
          '<strong>Explain:</strong> give the reason or cause (use because / so).\n' +
          '<strong>Differentiate:</strong> show the difference between two things.\n' +
          '<strong>Suggest:</strong> give a sensible solution.\n' +
          '<strong>Discuss:</strong> give several points with a short explanation of each.\n\n' +
          'Tip: the marks tell you how many facts to give. A 3-mark question needs 3 points.'
      }
    ],
    subs: [
      {
        sub: '4.1', heading: 'Case study',
        instruction: 'A farmer in Limpopo ploughs his maize land up and down a steep slope every year and leaves the soil bare after harvest. After heavy rain, deep channels have formed and his yields have dropped.',
        items: [
          term('Identify the type of erosion that formed the deep channels.',
            ['gully erosion', 'gully', 'gullies', 'gully erosion.'], 'Deep channels are gullies.'),
          short('Name ONE farming mistake mentioned in the case study.', 1,
            ['Ploughing up and down the slope', 'Leaving the soil bare after harvest']),
          short('Suggest TWO practices the farmer can use to prevent further erosion.', 2,
            ['Contour ploughing', 'Terracing', 'Strip cropping', 'Cover crops / mulching', 'Grassed waterways'],
            'Any two.'),
          short('Explain how the erosion lowered the farmer\'s yield.', 2,
            ['Topsoil with nutrients and organic matter was washed away (1)', 'Plants receive less nutrients and water, so yields drop (1)']),
          short('Name ONE structure that can be built to stop a gully from growing.', 1,
            ['Check dam', 'Stone packing / brushwood barrier', 'Grassed waterway'], 'Any one.')
        ]
      },
      {
        sub: '4.2', heading: 'Match the problem to its control',
        instruction: 'Choose the best control measure for each problem.',
        items: [
          mcq('Waterlogging',
            ['Lime', 'Gypsum', 'Drainage', 'Contour ploughing'], 2, 'Drains remove the excess water.'),
          mcq('Sodic soil',
            ['Lime', 'Gypsum', 'Windbreaks', 'Terracing'], 1, 'Gypsum treats sodic soil.'),
          mcq('Wind erosion on large open lands',
            ['Windbreaks', 'Lime', 'Drainage', 'Gypsum'], 0, 'Rows of trees slow the wind.'),
          mcq('Loss of organic matter',
            ['Burning crop residues', 'Adding compost and manure', 'Ploughing up and down', 'Overgrazing'], 1, 'Compost and manure replace organic matter.')
        ]
      },
      {
        sub: '4.3', heading: 'Discussion',
        instruction: 'Write your answer, then compare it to the memo and tick every point you included.',
        items: [
          short('Discuss the THREE main types of soil degradation. Give ONE example of each.', 6,
            ['Physical: damage to soil structure or condition (1)', 'Example: erosion / compaction / crusting (1)',
              'Chemical: change in the chemistry of the soil (1)', 'Example: acidification / salinisation / leaching (1)',
              'Biological: loss of organic matter and soil organisms (1)', 'Example: burning / overuse of pesticides / monoculture (1)'])
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
  selector: 'app-soil-degradation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  templateUrl: './soil-degradation.component.html',
  styleUrl: './soil-degradation.component.css'

})
export class SoilDegradationComponent implements OnInit, OnDestroy {

  /** Admin switch: lets the learner use the "Check answer" link */
  @Input() answersEnabled = true;
  /** Percentage needed to pass */
  @Input() passMark = 50;
  /** Seconds allowed per timed question */
  @Input() timeTotal = 75;

  @Output() closed = new EventEmitter<void>();
  @Output() signUp = new EventEmitter<void>();

  title = 'Soil conservation and management';

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
  private readonly PROGRESS_KEY = 'soil-degradation-quiz-progress-v1';
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

  // ---------- Lifecycle ----------
  ngOnInit(): void {
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
    if (this.isCorrect) {
      this.feedback = `Correct! ${explanation}`;
    } else {
      this.feedback = `Not quite. The correct answer is <strong>${this.correctText(this.currentQuestion)}</strong>. ${explanation}`;
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
    this.feedback = 'Answer saved.';
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
      this.progress.record('soil-degradation', `q${this.currentIndex}`, topic, ok, this.scoredTotal, this.topicCounts);
    }
  }

  private saveAttempt(): void {
    if (this.attemptSaved || !this.auth.isLoggedIn()) {
      return;
    }
    this.attemptSaved = true;
    this.auth.saveAttempt({
      quiz: 'Soil conservation and management',
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
