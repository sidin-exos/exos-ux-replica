/**
 * INPUT_EVALUATOR — Procurement domain glossary + common English words
 * Used for gibberish detection: if < 40% of words match this set, content is likely gibberish.
 * ~200 procurement terms + ~300 common English words = compact O(1) lookup.
 */

const WORDS = [
  // Common English (top ~300)
  "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as",
  "you","do","at","this","but","his","by","from","they","we","her","she","or","an","will","my",
  "one","all","would","there","their","what","so","up","out","if","about","who","get","which",
  "go","me","when","make","can","like","time","no","just","him","know","take","people","into",
  "year","your","good","some","could","them","see","other","than","then","now","look","only",
  "come","its","over","think","also","back","after","use","two","how","our","work","first",
  "well","way","even","new","want","because","any","these","give","day","most","us","are","is",
  "was","were","been","has","had","does","did","being","having","doing","will","would","shall",
  "should","may","might","must","can","could","need","more","very","much","many","each","every",
  "both","few","several","such","own","same","still","already","through","between","under",
  "before","after","during","without","within","against","above","below","around","across",
  "where","here","there","why","how","what","which","when","while","since","until","although",
  "however","therefore","moreover","furthermore","nevertheless","meanwhile","otherwise","instead",
  "including","regarding","according","per","via","based","due","given","following","provide",
  "include","ensure","require","describe","explain","define","identify","assess","evaluate",
  "analyze","review","compare","determine","establish","implement","develop","manage","support",
  "maintain","monitor","report","document","plan","process","system","service","project","cost",
  "price","value","rate","amount","total","number","level","type","area","part","point","issue",
  "case","example","result","change","need","help","information","data","detail","fact",
  // Procurement domain (~200 terms)
  "procurement","sourcing","supplier","vendor","contract","tender","rfp","rfq","rfi","bid",
  "quote","proposal","negotiation","award","purchase","order","invoice","payment","spend",
  "budget","forecast","savings","reduction","optimization","consolidation","category","commodity",
  "material","service","goods","delivery","logistics","warehouse","inventory","stock","supply",
  "chain","demand","capacity","lead","time","quality","defect","reject","compliance","audit",
  "risk","mitigation","assessment","insurance","liability","indemnity","warranty","guarantee",
  "penalty","bonus","incentive","kpi","sla","metric","scorecard","benchmark","baseline",
  "target","threshold","tolerance","specification","requirement","standard","iso","gdpr",
  "regulatory","legal","clause","term","condition","amendment","renewal","extension","expiry",
  "termination","exit","transition","onboarding","implementation","deployment","integration",
  "migration","maintenance","support","escalation","dispute","claim","resolution","arbitration",
  "stakeholder","sponsor","approver","buyer","seller","partner","subcontractor","consortium",
  "framework","agreement","master","blanket","call","off","spot","fixed","variable","unit",
  "volume","discount","rebate","tier","margin","markup","overhead","labour","labor","material",
  "capex","opex","depreciation","amortization","npv","irr","wacc","roi","tco","lifecycle",
  "acquisition","disposal","residual","salvage","inflation","deflation","escalation","index",
  "cpi","ppi","commodity","currency","fx","exchange","hedge","exposure","volatility","market",
  "industry","sector","segment","portfolio","pipeline","strategy","strategic","tactical",
  "operational","transformation","digital","automation","ai","analytics","dashboard","report",
  "sustainability","esg","carbon","emission","circular","economy","diversity","inclusion",
  "innovation","disruption","resilience","continuity","recovery","contingency","scenario",
  "simulation","stress","test","due","diligence","evaluation","selection","qualification",
  "prequalification","shortlist","longlist","weighted","scoring","matrix","decision","criteria",
  "weighting","ranking","comparison","analysis","breakdown","waterfall","sensitivity","model",
  "assumption","hypothesis","recommendation","action","roadmap","milestone","timeline","phase",
  "gate","review","approval","delegation","authority","governance","policy","procedure","process",
  "workflow","template","checklist","tool","platform","software","saas","license","subscription",
  "utilization","usage","adoption","training","onboard","offboard","handover","knowledge",
  "transfer","documentation","ip","intellectual","property","confidential","nda","proprietary",
  "patent","trademark","copyright","obligation","deliverable","milestone","acceptance","sign",
  "off","stakeholder","raci","responsible","accountable","consulted","informed","swot",
  "strength","weakness","opportunity","threat","kraljic","leverage","bottleneck","routine",
  "critical","non","strategic","performance","improvement","corrective","preventive",
  "manufacturer","distributor","wholesaler","retailer","oem","mro","indirect","direct",
  "percentage","annual","monthly","quarterly","weekly","daily","year","month","week","day",
  "hours","minutes","estimated","approximately","expected","projected","planned","actual",
  "current","previous","prior","next","future","historical","trend","growth","decline",
  "increase","decrease","stable","flat","rising","falling","high","medium","low","minimum",
  "maximum","average","range","band","tier","grade","class","category","type","kind","sort",
  "group","cluster","segment","division","department","function","role","position","team",
  "organization","organisation","company","enterprise","business","corporate","entity","subsidiary",
  "holding","parent","affiliate","joint","venture","partnership","limited","liability","plc",
  "gmbh","bv","sa","ag","llc","inc","corp","ltd",
];

export const KNOWN_WORDS = new Set(WORDS);

/** Keyboard-mash patterns to detect gibberish */
export const KEYBOARD_MASH_PATTERNS = [
  /asdf/i, /qwer/i, /zxcv/i, /hjkl/i, /uiop/i,
  /aaaa/i, /bbbb/i, /cccc/i, /dddd/i, /xxxx/i, /yyyy/i, /zzzz/i,
  /1234/, /abcd/i, /jjjj/i, /kkkk/i, /llll/i,
  /(.)\1{4,}/, // any character repeated 5+ times
];
