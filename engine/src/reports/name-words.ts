const words = (list: string) => new Set(list.split(/\s+/).filter(Boolean));

export const STOP = words(
  `the a an and but or if so then when what who where why how this that these those there here my our your his her their its i we he she it they you me us
  not no yes ok also just now today tomorrow yesterday soon later maybe note notes todo to do done ask call book email buy pay send check chase get make talk follow see
  need needs want wants have has had will would should could can may might must about after before during with without for from into over under
  off on in at by up out down of as per via like than other some any all each every both either neither
  jan feb mar apr may jun jul aug sep sept oct nov dec january february march april june july august september october november december
  monday tuesday wednesday thursday friday saturday sunday christmas easter
  mac english french spanish german italian japanese chinese portuguese korean arabic hindi
  canadian american british european african asian indian australian mexican russian irish scottish welsh dutch swedish danish norwegian finnish polish greek turkish
  buddhist christian muslim jewish hindu sikh catholic protestant orthodox islamic hebrew taoist jain mormon`,
);

export const COMMON = words(
  `Before After During Today Tomorrow Yesterday Please Thanks Thank Sorry Maybe Perhaps Always Never Sometimes Often Still Already Again
  Finish Start Review Write Read Plan Plans Buy Fix Update Remember Remind Follow Idea Ideas Question Questions Reminder Goal Goals Meeting Notes`,
);

export const PLACE_WORDS = words("canada vancouver montreal ottawa calgary halifax quebec winnipeg mississauga hamilton kitchener waterloo");

export const FIRST_NAMES = new Set(
  `alma boris cedric dagny elias fiona gwen hugo ines jorah kira lenny tessa priya omar sam alex jordan taylor chris pat jamie robin casey morgan riley
  james john robert michael william david richard joseph thomas charles daniel matthew anthony mark paul steven andrew kevin brian george ryan eric jacob
  mary patricia jennifer linda elizabeth barbara susan jessica sarah karen nancy lisa emma olivia sophia grace anna laura julia maria rachel hannah chloe
  liam noah ethan lucas mason logan owen henry jack leo oliver nathan aaron adam ben carl dan ian ken luke max nick pete ravi sanjay wei li mei yuki hiro
  amir fatima aisha ahmed ali hassan layla nina rosa carlos diego miguel pablo sofia lucia elena ivan olga dmitri anya`
    .split(/\s+/)
    .filter(Boolean),
);
