import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { QuizProgressService } from '../../../quiz-progress.service';
// import { AuthService } from '../../../../auth.service';
// import { QuizProgressService } from '../../../../quiz-progress.service';

type QuestionType = 'info' | 'mcq' | 'tf' | 'term' | 'short';

interface QuizQuestion {
  type: QuestionType;
  text: string;
  no: string;
  section: string;
  sub: string;
  instruction: string;
  marks: number;
  timed: boolean;
  body?: string;
  /** Poem or story shown above the question (HTML allowed) */
  passage?: string;
  options?: string[];
  correctIndex?: number;
  accepted?: string[];
  modelText?: string;
  model?: string[];
  explanation?: string;
}

type Draft = Omit<QuizQuestion, 'no' | 'section' | 'sub' | 'instruction' | 'passage'>;

interface SubSection { sub: string; heading: string; instruction: string; passage?: string; items: Draft[]; }
interface LearnCard { title: string; body: string; }
interface Section { title: string; learn: LearnCard[]; subs: SubSection[]; }

/* ================= QUESTION HELPERS ================= */
const mcq = (text: string, options: string[], correctIndex: number, explanation: string): Draft =>
  ({ type: 'mcq', text, options, correctIndex, explanation, marks: 1, timed: true });

const tf = (text: string, isTrue: boolean, explanation: string): Draft =>
  ({ type: 'tf', text, options: ['Nnete (True)', 'Maaka (False)'], correctIndex: isTrue ? 0 : 1, explanation, marks: 1, timed: true });

const term = (text: string, accepted: string[], explanation: string): Draft =>
  ({ type: 'term', text, accepted, modelText: accepted[0], explanation, marks: 1, timed: true });

const short = (text: string, marks: number, model: string[], explanation = ''): Draft =>
  ({ type: 'short', text, marks, model, explanation, timed: false });

/* ================= PASSAGES (original, written for practice) ================= */
const POEM =
  '<strong>Lebone la ka</strong><br><br>' +
  'Go ithuta ke lebone la ka,<br>le bonagatšago tsela ya ka,<br>le sa time le ge go le bošego,<br>le ntlhahla go fihla gae.<br><br>' +
  'Ke sepela ke lebelela pele,<br>bjalo ka noka e elago lewatleng;<br>ke sa lape le ge tsela e le telele,<br>hobane bokamoso bo a nkemela.<br><br>' +
  'Bana ba Afrika, rutegang!<br>Dibuka ke mohlodi wa kgonthe;<br>ge o ithuta, o tla fihla mo go kgolo.';

const STORY =
  '<strong>Diaparo tša sekolo</strong><br><br>' +
  'Mpho o tsogile ka pela ka Mantaga. Kgaetšedi ya gagwe, Kabelo, o be a sa ye sekolong ka gobane a be a hloka diaparo tša sekolo. ' +
  'Mmagwe o be a šoma lebenkeleng, a hwetša tšhelete e nyenyane yeo e sa lekanego dilo ka moka. ' +
  'Mpho a hlokomela gore kgaetšedi ya gagwe e tla šala morago dithutong. ' +
  'A tšea sephetho sa go bolela le mogokgo wa sekolo. Ka morago ga matšatši a mmalwa, mogokgo a fa Kabelo diaparo tšeo di šomišitšwego. ' +
  'Kabelo a thaba kudu, a boela sekolong.';

/* ================= THE PAPER ================= */
const SECTIONS: Section[] = [

  /* ===== SECTION A: POETRY ===== */
  {
    title: 'Karolo A: Thetho (Poetry)',
    learn: [
      {
        title: 'Mantšu a bohlokwa a thetho (Poetry terms)',
        body:
          '<strong>Sehlogo</strong> = title of the poem.\n' +
          '<strong>Morero</strong> = theme / what the poem is about.\n' +
          '<strong>Temana</strong> (ditemana) = stanza(s).\n' +
          '<strong>Mothalo</strong> (methalo) = line(s).\n' +
          '<strong>Tshwantšhanyo</strong> = simile (comparing with "bjalo ka").\n' +
          '<strong>Poeletšo</strong> = repetition of words or sounds.\n\n' +
          'Tip: read the poem twice. First for the story, then for the feelings and word pictures.'
      },
      {
        title: 'Go araba dipotšišo tša thetho (Answering poetry questions)',
        body:
          '1. Read the poem and the title before you read the questions.\n' +
          '2. For "Hlaloša" (explain) questions, give the meaning AND the reason.\n' +
          '3. Use your own words and refer to the poem.\n' +
          '4. The marks tell you how many points to give.'
      }
    ],
    subs: [
      {
        sub: '1.1', heading: 'Dipotšišo tša go kgetha karabo (Multiple-choice)',
        instruction: 'Bala thetho ye, o kgethe karabo e nepagetšego. (Read the poem and choose the correct answer.)',
        passage: POEM,
        items: [
          mcq('Morero wa thetho ye ke ofe?',
            ['Go ithuta', 'Lerato', 'Tlhago', 'Lehu'], 0, 'Thetho e bolela ka go ithuta, ka ge e re go ithuta ke lebone.'),
          mcq('Thetho ye e na le ditemana tše kae?',
            ['2', '3', '4', '5'], 1, 'Go na le ditemana tše tharo.'),
          mcq('"Go ithuta ke lebone la ka." Polelo ye e bolela gore …',
            ['go ithuta go laetša motho tsela ya bophelo', 'go ithuta go a tima', 'go ithuta go bohloko', 'lebone le rekwa ka tšhelete'],
            0, 'Lebone le laetša tsela. Go ithuta go laetša motho tsela ya bophelo.'),
          mcq('"bjalo ka noka e elago lewatleng" ke mohlala wa …',
            ['tshwantšhanyo (simile)', 'poeletšo (repetition)', 'tlhaloso (description)', 'potšišo (question)'],
            0, 'Mantšu "bjalo ka" a bapetša dilo tše pedi: ke tshwantšhanyo.')
        ]
      },
      {
        sub: '1.2', heading: 'Mantšu (Terminology and short answers)',
        instruction: 'Ngwala lentšu le tee goba karabo e kopana. (Give ONE word or short answer.)',
        passage: POEM,
        items: [
          term('Ngwala mantšu a mabedi a laetšago tshwantšhanyo temaneng ya bobedi.',
            ['bjalo ka'], 'Tshwantšhanyo e šomiša "bjalo ka".'),
          term('Ke eng seo se bitšwago "mohlodi wa kgonthe" thethong?',
            ['dibuka', 'dibuka.'], 'Temana ya boraro e re dibuka ke mohlodi wa kgonthe.'),
          term('Temana ya mathomo e na le methalo e mekae?',
            ['4', 'nne', 'methalo e 4'], 'Temana ya mathomo e na le methalo e mene.')
        ]
      },
      {
        sub: '1.3', heading: 'Nnete goba maaka (True or false)',
        instruction: 'Kgetha NNETE goba MAAKA. (Choose TRUE or FALSE.)',
        passage: POEM,
        items: [
          tf('Thetho ye e re go ithuta ga go na mohola.', false, 'Maaka. Go ithuta ke lebone la moanegi.'),
          tf('Moanegi o bolela gore bokamoso bo a mo emela.', true, 'Nnete. Temana ya bobedi e re "bokamoso bo a nkemela".'),
          tf('Thetho ye e kgothaletša bana go ithuta.', true, 'Nnete. Temana ya mafelelo e re "rutegang!"'),
          tf('Noka ye e boletšwego e elela thabeng.', false, 'Maaka. E elela lewatleng.')
        ]
      },
      {
        sub: '1.4', heading: 'Dipotšišo tše kopana (Short questions)',
        instruction: 'Ngwala karabo ya gago, o bapetše le memo o tikše dintlha ka moka tšeo o di ngwadilego. (Write your answer, then compare it to the memo.)',
        passage: POEM,
        items: [
          short('Hlaloša gore moanegi o ra eng ge a re "Go ithuta ke lebone la ka".', 2,
            ['Go ithuta go mo laetša tsela / go mo thuša go bona kamoo a swanetšego go phela (1)',
              'Go mo thuša le ge go le thata, bjalo ka lebone bošegong (1)'],
            'Dikarabo tše di swanago le tše di amogelwa.'),
          short('Ke ka baka lang moanegi a ithwantšha le noka?', 2,
            ['Noka e sa emiše go ela go fihla lewatleng (1)', 'Le yena o tšwela pele ka go ithuta ntle le go lapa go fihla a fihlelela maikemišetšo (1)']),
          short('Ngwala molaetša wa thetho ye ka mantšu a gago.', 2,
            ['Go ithuta go na le mohola kudu (1)', 'Bana ba swanetše go ithuta gore ba be le bokamoso bjo bobotse (1)'],
            'Dikarabo tše di swanago di amogelwa.')
        ]
      }
    ]
  },

  /* ===== SECTION B: SHORT STORY (UNSEEN) ===== */
  {
    title: 'Karolo B: Kanegelo e kopana (Short story)',
    learn: [
      {
        title: 'Dikarolo tša kanegelo (Parts of a story)',
        body:
          '<strong>Moanegwa</strong> (baanegwa) = character(s).\n' +
          '<strong>Semelo</strong> = character trait (e.g. kind, brave, selfish).\n' +
          '<strong>Lefelo</strong> = setting (place).\n' +
          '<strong>Nako</strong> = time.\n' +
          '<strong>Tiragalo</strong> (ditiragalo) = event(s) / plot.\n' +
          '<strong>Moanegi</strong> = narrator.\n' +
          '<strong>Morero</strong> = theme.\n\n' +
          'To describe a character, give the trait AND prove it with something the character did.'
      }
    ],
    subs: [
      {
        sub: '2.1', heading: 'Dipotšišo tša go kgetha karabo (Multiple-choice)',
        instruction: 'Bala kanegelo, o kgethe karabo e nepagetšego. (Read the passage and choose the correct answer.)',
        passage: STORY,
        items: [
          mcq('Ke ka baka lang Kabelo a be a sa ye sekolong?',
            ['O be a lwala', 'O be a hloka diaparo tša sekolo', 'O be a sa rate sekolo', 'Sekolo se be se tswaletšwe'],
            1, 'Kanegelo e re o be a hloka diaparo tša sekolo.'),
          mcq('Mmago Mpho o šoma kae?',
            ['Sekolong', 'Lebenkeleng', 'Bookelong', 'Polaseng'],
            1, 'O šoma lebenkeleng.'),
          mcq('Mpho o ile a dira eng go thuša kgaetšedi ya gagwe?',
            ['O ile a ba a rekela Kabelo diaparo', 'O ile a bolela le mogokgo wa sekolo', 'O ile a tlogela sekolo', 'O ile a kgopela tšhelete tseleng'],
            1, 'O ile a bolela le mogokgo wa sekolo.'),
          mcq('Ge o ka fa kanegelo ye sehlogo se sengwe, ke sefe se se swanetšego kudu?',
            ['Go nyaka mošomo', 'Kgaetšedi e rata Mpho', 'Go thušana', 'Bošego bja go lla'],
            2, 'Kanegelo e bontšha go thušana ga bana ba lapa.')
        ]
      },
      {
        sub: '2.2', heading: 'Mantšu (Terminology and short answers)',
        instruction: 'Ngwala lentšu le tee goba karabo e kopana. (Give ONE word or short answer.)',
        passage: STORY,
        items: [
          term('Ke mang yo a bego a sa ye sekolong?',
            ['kabelo'], 'Kabelo o be a sa ye sekolong.'),
          term('Ke mang yo a ilego a fa Kabelo diaparo?',
            ['mogokgo', 'mogokgo wa sekolo', 'the principal'], 'Mogokgo wa sekolo o file Kabelo diaparo.'),
          term('Lentšu la go bitša motho yo a lego kanegelong ke eng? (Ngwala bonnyane: leina la motho a le tee)',
            ['moanegwa', 'moanegwa.'], 'Motho yo a lego kanegelong ke moanegwa (baanegwa ge e le ba bantši).')
        ]
      },
      {
        sub: '2.3', heading: 'Nnete goba maaka (True or false)',
        instruction: 'Kgetha NNETE goba MAAKA. (Choose TRUE or FALSE.)',
        passage: STORY,
        items: [
          tf('Mmago Mpho o hwetša tšhelete ye ntši lebenkeleng.', false, 'Maaka. Tšhelete ye a e hwetšago ke ye nnyane.'),
          tf('Mpho o be a tshwenyegile ka dithuto tša kgaetšedi ya gagwe.', true, 'Nnete. O hlokometše gore Kabelo o tla šala morago dithutong.'),
          tf('Kabelo o ile a ya sekolong ka morago ga go newa diaparo.', true, 'Nnete. O boetše sekolong.')
        ]
      },
      {
        sub: '2.4', heading: 'Dipotšišo tše kopana (Short questions)',
        instruction: 'Ngwala karabo ya gago, o bapetše le memo. (Write your answer, then compare it to the memo.)',
        passage: STORY,
        items: [
          short('Hlaloša semelo sa Mpho ka mohlala o tšwago kanegelong.', 2,
            ['Mpho o na le kgathalelo / o rata kgaetšedi ya gagwe (1)', 'O ile a bolela le mogokgo gore a thuše Kabelo (1)'],
            'Semelo se swanago se amogelwa ge se na le bohlatse.'),
          short('Morero wa kanegelo ye ke eng? Fa lebaka.', 2,
            ['Go thušana ga ba lapa / go thuša ba bangwe (1)', 'Mpho o thušitše Kabelo gore a boele sekolong (1)']),
          short('Bolela mathata a MABEDI ao lapa la Mpho le tobanego le ona.', 2,
            ['Tlhokego ya tšhelete', 'Tlhokego ya diaparo tša sekolo', 'Mohola o monnyane wa mmago'],
            'A mabedi a nepagetšego.')
        ]
      }
    ]
  },

  /* ===== SECTION C: NOVEL "GO FETOGILE" ===== */
  {
    title: 'Karolo C: Pukwana ya "Go fetogile" (Novel)',
    learn: [
      {
        title: 'Pukwana ya "Go fetogile" (About the book)',
        body:
          'Pukwana ye e thopile sefoka sa pele phadišanong ya bangwadi ngwageng wa 2005.\n\n' +
          'According to the back cover, the book tells of changes in people\'s lives today, such as:\n' +
          '• teenage girls having babies to get the government grant\n' +
          '• men finding themselves under the control of women at work\n' +
          '• <strong>tlhokego ya mešomo</strong> (unemployment) causing trauma and more crime\n' +
          '• people changing their lives by starting projects (<strong>go ithomela diprojeke</strong>)\n\n' +
          'Use these themes in your answers, and add the names of the characters and events from your own copy of the book.'
      },
      {
        title: 'Go araba dipotšišo tša pukwana (Answering novel questions)',
        body:
          '<strong>Morero</strong> = theme. State it, then explain it with an event from the book.\n' +
          '<strong>Sehlogo</strong> = title. Link it to what changes in the story.\n' +
          '<strong>Hlaloša</strong> = explain. <strong>Bolela</strong> = state. <strong>Fa mohlala</strong> = give an example.\n\n' +
          'Always name the character and the event you are talking about.'
      }
    ],
    subs: [
      {
        sub: '3.1', heading: 'Dipotšišo tša go kgetha karabo (Multiple-choice)',
        instruction: 'Kgetha karabo e nepagetšego. (Choose the correct answer.)',
        items: [
          mcq('Pukwana ya "Go fetogile" e thopile sefoka sefe phadišanong ya bangwadi?',
            ['Sa pele', 'Sa bobedi', 'Sa boraro', 'Ga se a thopa sefoka'], 0, 'E thopile sefoka sa pele (first prize).'),
          mcq('Phadišano ya bangwadi yeo e ile ya swarwa ngwageng ofe?',
            ['2000', '2003', '2005', '2010'], 2, 'E be e le ngwaga wa 2005.'),
          mcq('Go ya ka pukwana, tlhokego ya mešomo e lebiša go eng?',
            ['Kgolo ya bosenyi', 'Kgolo ya ditšhelete', 'Mathabo a mantši', 'Maphelo a matala'], 0, 'Tlhokego ya mešomo e tliša tlhobaboroko le kgolo ya bosenyi.'),
          mcq('Batho ba laetšwa go fetola maphelo a bona bjang?',
            ['Ka go ithomela diprojeke', 'Ka go tlogela sekolo', 'Ka go emela mmušo', 'Ka go sepela motseng'], 0, 'Pukwana e kgothaletša go ithomela diprojeke.')
        ]
      },
      {
        sub: '3.2', heading: 'Nnete goba maaka (True or false)',
        instruction: 'Kgetha NNETE goba MAAKA. (Choose TRUE or FALSE.)',
        items: [
          tf('Pukwana e bontšha gore batho ba ka fetola maphelo a bona ka go ithomela diprojeke.', true, 'Nnete.'),
          tf('Pukwana e bolela fela ka bana ba bannyane.', false, 'Maaka. E bolela ka basadi, banna, basetsana le tlhokego ya mešomo.'),
          tf('Pukwana e bolela ka banna ba ikhwetšago ba le ka tlase ga taolo ya basadi mešomong.', true, 'Nnete.')
        ]
      },
      {
        sub: '3.3', heading: 'Dipotšišo tše kopana (Short questions)',
        instruction: 'Ngwala karabo ya gago, o bapetše le memo. Dintlha tše di tšwa mabapi a pukwana; o ka oketša mehlala ya gago. (Write your answer, then compare it to the memo.)',
        items: [
          short('Bolela mathata a MABEDI a setšhaba ao a hlalošwago ke pukwana.', 2,
            ['Basetsana ba dira bana ka nepo ya go hwetša thušo ya mmušo (maseleng)', 'Tlhokego ya mešomo', 'Kgolo ya bosenyi', 'Banna ba laolwa ke basadi mešomong'],
            'Any two.'),
          short('Hlaloša ka moo tlhokego ya mešomo e amago maphelo a batho go ya ka pukwana.', 3,
            ['E tliša tlhobaboroko / bohloko maphelong a batho (1)', 'E lebiša go kgolo ya bosenyi (1)', 'Batho ba hloka tšhelete ya go ipshina / go phela (1)']),
          short('Hlaloša gore ke ka baka lang sehlogo "Go fetogile" se swanetše pukwana ye.', 3,
            ['Pukwana e bolela ka diphetogo maphelong a batho (1)', 'Bjalo ka go fetoga ga ditema tša basadi le banna (1)', 'Le go fetoga ga maphelo ka go ithomela diprojeke (1)'],
            'Add an example from your own copy.'),
          short('Hlaloša ka moo batho ba ka fetolago maphelo a bona ka go ithomela diprojeke.', 2,
            ['Ba ka hwetša letseno / tšhelete ka bobona (1)', 'Ba se ke ba ema mmušo / ba tlogele go ikhwetša ba hloka mešomo (1)']),
          short('Ngwala morero wo mongwe wa pukwana, o hlalose ka moanegwa goba tiragalo ye tee ya gago.', 3,
            ['Morero o bolelwa gabotse (1)', 'Moanegwa goba tiragalo e hlaolwa (1)', 'Go hlalosa gore tiragalo e bontšha morero bjang (1)'],
            'Use a character or event from your copy of the book.')
        ]
      }
    ]
  },

  /* ===== SECTION D: MIXED ===== */
  {
    title: 'Karolo D: Mantšu a dipotšišo le dikgopolo (Command words and mixed)',
    learn: [
      {
        title: 'Mantšu a dipotšišo (Command words)',
        body:
          '<strong>Bolela</strong> = state (short answer).\n' +
          '<strong>Hlaloša</strong> = explain / describe.\n' +
          '<strong>Fa mohlala</strong> = give an example.\n' +
          '<strong>Bapetša</strong> = compare.\n' +
          '<strong>Ngwala</strong> = write.\n\n' +
          'Tip: the marks show how many points you must give. A 3-mark answer needs 3 points.'
      }
    ],
    subs: [
      {
        sub: '4.1', heading: 'Mantšu (Terminology)',
        instruction: 'Ngwala lentšu le tee. (Give ONE word.)',
        items: [
          term('Lentšu la go bitša motho yo a anegago kanegelo ke eng?',
            ['moanegi'], 'Motho yo a anegago kanegelo ke moanegi.'),
          term('Lentšu la go bitša leina la thetho goba pukwana ke eng?',
            ['sehlogo'], 'Leina la thetho goba pukwana ke sehlogo.'),
          term('Lentšu la go bitša se se bolelwago ke thetho goba kanegelo ka kakaretšo ke eng?',
            ['morero'], 'Se ke morero (theme).')
        ]
      },
      {
        sub: '4.2', heading: 'Kgetha lentšu le le nepagetšego (Choose the correct word)',
        instruction: 'Kgetha karabo e nepagetšego. (Choose the correct answer.)',
        items: [
          mcq('Ge go thwe "Hlaloša", o swanetše go …',
            ['ngwala lentšu le tee', 'fa tlhaloso e feletšego', 'kopanya mantšu', 'se ke wa araba'], 1, 'Hlaloša ke go fa tlhaloso.'),
          mcq('"Moanegwa" ke …',
            ['motho yo a lego kanegelong', 'lefelo la kanegelo', 'sehlogo sa kanegelo', 'mothalo wa thetho'], 0, 'Moanegwa ke motho yo a lego kanegelong.'),
          mcq('"Temana" thethong ke …',
            ['lentšu le tee', 'sehlopha sa methalo', 'leina la thetho', 'mongwadi wa thetho'], 1, 'Temana ke sehlopha sa methalo.')
        ]
      },
      {
        sub: '4.3', heading: 'Kgopolo ya gago (Your opinion)',
        instruction: 'Ngwala karabo ya gago, o bapetše le memo. (Write your answer, then compare it to the memo.)',
        items: [
          short('Ke ka baka lang go ithuta go le bohlokwa go ya ka thetho ya "Lebone la ka"?', 3,
            ['Go ithuta go laetša motho tsela ya bophelo (1)', 'Go ithuta go thuša motho go fihlelela bokamoso bjo bobotse (1)', 'Dibuka ke mohlodi wa kgonthe (1)'],
            'Dikarabo tše di swanago di amogelwa.'),
          short('Fa maikutlo a gago a MABEDI ka go thuša ba bangwe, o šomiša kanegelo ya "Diaparo tša sekolo".', 2,
            ['Go thuša go fa ba bangwe monyetla wa go ithuta (1)', 'Go thuša go aga setšhaba se se kwanago (1)'],
            'Dikarabo tše di swanago di amogelwa.')
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
      type: 'info', text: l.title, body: l.body,
      no: '', section: s.title, sub: '', instruction: '', marks: 0, timed: false
    }));
    s.subs.forEach(sub => sub.items.forEach((it, k) => out.push({
      ...it,
      no: `${sub.sub}.${k + 1}`,
      section: s.title,
      sub: `${sub.sub} ${sub.heading}`,
      instruction: sub.instruction,
      passage: sub.passage
    })));
  });
  return out;
}

@Component({
  selector: 'app-sepedi-literature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  templateUrl: './sepedi-literature.component.html',
  styleUrl: './sepedi-literature.component.css'
})
export class SepediLiteratureComponent implements OnInit, OnDestroy {

  @Input() answersEnabled = true;
  /** Home Language pass mark */
  @Input() passMark = 40;
  @Input() timeTotal = 90;

  @Output() closed = new EventEmitter<void>();
  @Output() signUp = new EventEmitter<void>();

  title = 'Sepedi Home Language: Paper 2 (Literature), Grade 10';

  questions: QuizQuestion[] = buildQuestions(SECTIONS);

  // ---------- Saved progress (resume) ----------
  private readonly PROGRESS_KEY = 'sepedi-literature-quiz-progress-v1';
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
    private progress: QuizProgressService
  ) { }

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

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentIndex];
  }

  get isInfo(): boolean { return this.currentQuestion?.type === 'info'; }
  get isChoice(): boolean { return this.currentQuestion?.type === 'mcq' || this.currentQuestion?.type === 'tf'; }
  get isTerm(): boolean { return this.currentQuestion?.type === 'term'; }
  get isShort(): boolean { return this.currentQuestion?.type === 'short'; }

  get scoredTotal(): number {
    return this.questions.filter(q => q.type !== 'info').length;
  }

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

  /** Keeps Sepedi letters (š, Š) and removes punctuation and extra spaces */
  private normalise(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9š.%\-\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  checkAnswer(): void {
    if (this.answered || !this.userAnswer.trim()) {
      return;
    }
    const given = this.normalise(this.userAnswer);
    this.isCorrect = (this.currentQuestion.accepted ?? []).some(a => this.normalise(a) === given);
    this.lockAnswer();
  }

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

  revealAnswer(): void {
    if (!this.answered || this.revealed || !this.answersEnabled || this.isShort) {
      return;
    }
    this.revealed = true;

    const explanation = this.currentQuestion.explanation ?? '';
    if (this.isCorrect) {
      this.feedback = `Go nepagetše! ${explanation}`;
    } else {
      this.feedback = `Ga se ka nepagala. Karabo ke <strong>${this.correctText(this.currentQuestion)}</strong>. ${explanation}`;
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

  private get topicCounts(): Record<string, number> {
    const totals: Record<string, number> = {};
    this.questions.forEach(q => {
      if (q.type === 'info') { return; }
      totals[q.section] = (totals[q.section] ?? 0) + 1;
    });
    return totals;
  }

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
      this.progress.record('sepedi-literature', `q${this.currentIndex}`, topic, ok, this.scoredTotal, this.topicCounts);
    }
  }

  private saveAttempt(): void {
    if (this.attemptSaved || !this.auth.isLoggedIn()) {
      return;
    }
    this.attemptSaved = true;
    this.auth.saveAttempt({
      quiz: 'Sepedi Paper 2 Literature Grade 10',
      correct: this.marksEarned,
      total: this.marksTotal,
      details: JSON.stringify({ byPart: this.topicRows, answers: this.answerLog })
    }).subscribe({ error: () => { /* save failed: the quiz still works */ } });
  }

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
    this.feedback = "Nako e fedile! (Time's up!)";
    this.persistProgress(this.currentIndex + 1);
  }

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