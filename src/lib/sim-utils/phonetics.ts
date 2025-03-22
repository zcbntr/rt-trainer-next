export function replacePhoneticAlphabetDecimalWithNumber(str: string): string {
  return str.replace(/(\d{3}) decimal (\d{3})/g, "$1.$2");
}

export function numberToPhoneticString(
  number: number,
  precision: number,
): string {
  const phoneticNumbers = {
    "0": "Zero",
    "1": "One",
    "2": "Two",
    "3": "Three",
    "4": "Four",
    "5": "Five",
    "6": "Six",
    "7": "Seven",
    "8": "Eight",
    "9": "Niner",
  };

  const stringNumber: string = number.toFixed(precision);
  let result = "";

  for (const char of stringNumber) {
    if (/[0-9]/.test(char)) {
      result += phoneticNumbers[char as keyof typeof phoneticNumbers] + " ";
    } else if (char === "-") {
      result += "Dash ";
      continue;
    } else if (char === ".") {
      result += "Decimal ";
    } else {
      result += char + " ";
    }
  }

  return result.trim();
}

export function replacePhoneticAlphabetWithChars(str: string): string {
  const phoneticAlphabetMapping = {
    alpha: "A",
    bravo: "B",
    charlie: "C",
    delta: "D",
    echo: "E",
    foxtrot: "F",
    golf: "G",
    gulf: "G",
    hotel: "H",
    india: "I",
    juliet: "J",
    kilo: "K",
    lima: "L",
    mike: "M",
    november: "N",
    oscar: "O",
    papa: "P",
    quebec: "Q",
    romeo: "R",
    sierra: "S",
    tango: "T",
    uniform: "U",
    victor: "V",
    whiskey: "W",
    xray: "X",
    yankee: "Y",
    zulu: "Z",
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    fiver: "5",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    niner: "9",
    nine: "9",
  };

  // Create a regular expression pattern to match any of the phonetic alphabet words
  const pattern = new RegExp(
    Object.keys(phoneticAlphabetMapping).join("|"),
    "gi",
  );

  // Replace occurrences of phonetic alphabet words with their corresponding characters
  return str
    .replace(
      pattern,
      (match) =>
        phoneticAlphabetMapping[
          match.toLowerCase() as keyof typeof phoneticAlphabetMapping
        ],
    )
    .trim();
}

export function getNthPhoneticAlphabetLetter(n: number): string {
  // The phonetic alphabet is 26 letters long
  const index: number = (n - 1) % 26;

  return replaceWithPhoneticAlphabet(String.fromCharCode(65 + index));
}

export function getNRandomPhoneticAlphabetLetters(n: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < n; i++) {
    if (i > 0) {
      result += " ";
    }
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    // No duplicates
    if (result.includes(alphabet[randomIndex]!)) {
      i--;
      continue;
    }

    result += replaceWithPhoneticAlphabet(alphabet[randomIndex]!);
  }

  return result;
}

export function replaceWithPhoneticAlphabet(text: string) {
  const phoneticAlphabet = {
    A: "Alpha",
    B: "Bravo",
    C: "Charlie",
    D: "Delta",
    E: "Echo",
    F: "Foxtrot",
    G: "Golf",
    H: "Hotel",
    I: "India",
    J: "Juliet",
    K: "Kilo",
    L: "Lima",
    M: "Mike",
    N: "November",
    O: "Oscar",
    P: "Papa",
    Q: "Quebec",
    R: "Romeo",
    S: "Sierra",
    T: "Tango",
    U: "Uniform",
    V: "Victor",
    W: "Whiskey",
    X: "X-ray",
    Y: "Yankee",
    Z: "Zulu",
  };

  const phoneticNumbers = {
    "0": "Zero",
    "1": "One",
    "2": "Two",
    "3": "Three",
    "4": "Four",
    "5": "Five",
    "6": "Six",
    "7": "Seven",
    "8": "Eight",
    "9": "Niner",
  };

  const upperText = text.toUpperCase();

  let result = "";
  for (const char of upperText) {
    if (/[A-Z]/.test(char)) {
      const natoWord: string =
        phoneticAlphabet[char as keyof typeof phoneticAlphabet];
      result += natoWord + " ";
    } else if (/[0-9]/.test(char)) {
      const natoNumber: string =
        phoneticNumbers[char as keyof typeof phoneticNumbers];
      result += natoNumber + " ";
    } else if (char === "-") {
      // Ignore hyphens
      continue;
    } else if (char === ".") {
      result += "Decimal ";
    } else {
      result += char + " ";
    }
  }

  return result.trim();
}
